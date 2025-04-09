from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from tensorflow.keras.models import load_model
import joblib
import os
from langchain.chains import RetrievalQA
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceBgeEmbeddings
from langchain.prompts import PromptTemplate
from langchain_groq import ChatGroq
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
import cv2
import base64
import io
from PIL import Image
from emotion_detector import EmotionDetector

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# ============= Stress Prediction Model Setup =============
MODEL_PATH = 'adaboost_model.pkl'
SCALER_PATH = 'scaler.pkl'

# Stress level labels
STRESS_LABELS = {
    0: "No Stress",
    1: "Mild Stress",
    2: "Moderate Stress",
    3: "High Stress",
    4: "Extreme Stress"
}

model = None
scaler = None

if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
    try:
        model = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        print("Stress prediction model and scaler loaded successfully")
    except Exception as e:
        print(f"Error loading stress prediction model: {e}")
else:
    print(f"Stress prediction model files not found. Please ensure {MODEL_PATH} and {SCALER_PATH} exist in the backend directory")

# ============= Emotion Detection Setup =============
emotion_detector = EmotionDetector()
print("Emotion detection model loaded successfully!")

# ============= Chatbot Model Setup =============
# Download and cache the model
sentence_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
print("Sentence transformer model downloaded successfully!")

# Load LLaMA-3 from Groq API
def initialize_llm():
    groq_api_key = os.getenv("GROQ_API_KEY")
    return ChatGroq(
        temperature=0,
        groq_api_key=groq_api_key,
        model_name="llama-3.3-70b-versatile"
    )

llm = initialize_llm()

# Load ChromaDB
db_path = "./chroma_db"
embeddings = HuggingFaceBgeEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

if os.path.exists(db_path):
    vector_db = Chroma(persist_directory=db_path, embedding_function=embeddings)
else:
    vector_db = Chroma(persist_directory=db_path, embedding_function=embeddings)
    vector_db.persist()

retriever = vector_db.as_retriever()

# Setup the QA Chain
prompt_template = """You are a mental health chatbot named Calmify. Keep your answers short and supportive:
{context}
User: {question}
Chatbot: """
PROMPT = PromptTemplate(template=prompt_template, input_variables=['context', 'question'])

if retriever:
    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        chain_type_kwargs={"prompt": PROMPT}
    )
else:
    qa_chain = None

# ============= API Routes =============
@app.route('/predict', methods=['POST'])
def predict():
    if model is None or scaler is None:
        return jsonify({
            'error': 'Stress prediction model not loaded. Please ensure model files exist and are properly loaded.',
            'details': f'Required files: {MODEL_PATH}, {SCALER_PATH}'
        }), 500

    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        print("Received data from frontend:", data)  # Log the entire request data
        
        # Extract features from request with proper field names matching frontend
        try:
            snoring_range = float(data.get('snoringRange', 0))
            print(f"Snoring range: {snoring_range}")
            respiration_rate = float(data.get('respirationRate', 0))
            print(f"Respiration rate: {respiration_rate}")
            body_temperature = float(data.get('bodyTemperature', 0))
            print(f"Body temperature: {body_temperature}")
            blood_oxygen = float(data.get('bloodOxygen', 0))
            print(f"Blood oxygen: {blood_oxygen}")
            sleep_hours = float(data.get('sleepHours', 0))
            print(f"Sleep hours: {sleep_hours}")
            heart_rate = float(data.get('heartRate', 0))
            print(f"Heart rate: {heart_rate}")
        except ValueError as e:
            return jsonify({
                'error': 'Invalid input values. All values must be numbers.',
                'details': str(e)
            }), 400
        
        # Create input array with the 6 features
        input_data = np.array([[
            snoring_range,
            respiration_rate,
            body_temperature,
            blood_oxygen,
            sleep_hours,
            heart_rate
        ]])
        
        # Scale the input data
        input_data_scaled = scaler.transform(input_data)
        
        # Make prediction
        prediction = model.predict(input_data_scaled)[0]
        
        # Map prediction to stress level (0-4)
        stress_level = int(prediction)
        stress_label = STRESS_LABELS.get(stress_level, "Unknown")
        
        return jsonify({
            'prediction': float(prediction),
            'stress_level': stress_level,
            'stress_label': stress_label
        })
        
    except Exception as e:
        print(f"Error in predict endpoint: {str(e)}")  # Add logging
        return jsonify({
            'error': 'Error processing request',
            'details': str(e)
        }), 400

@app.route('/detect_emotion', methods=['POST'])
def detect_emotion_endpoint():
    try:
        # Check if image is in the request
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        # Get the image file
        image_file = request.files['image']
        
        # Read the image
        image_data = image_file.read()
        
        # Detect emotion using our model
        emotion, confidence = emotion_detector.detect_emotion(image_data)
        
        if emotion is None:
            return jsonify({'error': 'No face detected in the image'}), 400
        
        return jsonify({
            'emotion': emotion,
            'confidence': confidence * 100  # Convert to percentage
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Error processing image',
            'details': str(e)
        }), 400

@app.route('/chat', methods=['POST'])
def chat():
    if not qa_chain:
        return jsonify({"error": "Chatbot is not initialized properly"}), 500

    data = request.json
    user_input = data.get("message", "")

    if not user_input:
        return jsonify({"error": "No message provided"}), 400

    try:
        response = qa_chain.run(user_input)
        return jsonify({"response": response})
    except Exception as e:
        return jsonify({
            "error": "Error processing chat request",
            "details": str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True) 