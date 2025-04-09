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

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# ============= Stress Prediction Model Setup =============
MODEL_PATH = 'Human_Stress_Predictions.h5'
SCALER_PATH = 'scaler.pkl'

model = None
scaler = None

if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
    try:
        model = load_model(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        print("Stress prediction model and scaler loaded successfully")
    except Exception as e:
        print(f"Error loading stress prediction model: {e}")
else:
    print(f"Stress prediction model files not found. Please ensure {MODEL_PATH} and {SCALER_PATH} exist in the backend directory")

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
        
        # Extract features from request
        try:
            heart_rate = float(data.get('heartRate', 0))
            sleep_hours = float(data.get('sleepHours', 0))
            snoring_rate = float(data.get('snoringRate', 0))
        except ValueError:
            return jsonify({'error': 'Invalid input values. All values must be numbers.'}), 400
        
        # Create input array with default values for missing features
        input_data = np.array([[
            snoring_rate,  # Snoring from input
            16.0, 98.0, 3.0, 97.0, 15.0,             # average eye movement activity
            sleep_hours,   # Sleep hours from input
            heart_rate,  # Heart rate from input
        ]])
        
        # Scale the input data
        input_data_scaled = scaler.transform(input_data)
        
        # Make prediction
        prediction = model.predict(input_data_scaled)[0][0]
        
        # Determine stress level
        stress_level = "Stressed" if prediction > 0.3 else "Not Stressed"
        
        return jsonify({
            'prediction': float(prediction),
            'stress_level': stress_level,
            'confidence': float(abs(prediction - 0.5) * 2)  # Convert to confidence score
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Error processing request',
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