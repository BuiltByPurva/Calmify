import cv2
import numpy as np
from tensorflow.keras.models import model_from_json
import os
import csv
from datetime import datetime
import pandas as pd

class EmotionDetector:
    def __init__(self):
        # Load the model architecture and weights
        model_json_path = os.path.join(os.path.dirname(__file__), "model.json")
        model_weights_path = os.path.join(os.path.dirname(__file__), "model.weights.h5")
        
        # Load the model architecture
        with open(model_json_path, "r") as json_file:
            model_json = json_file.read()
            self.model = model_from_json(model_json)
        
        # Load the weights
        self.model.load_weights(model_weights_path)
        
        # Define emotion labels
        self.emotion_labels = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']
        
        # Load face detection cascade
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        self.face_cascade = cv2.CascadeClassifier(cascade_path)
        
        # Define input shape for the model
        self.input_shape = (48, 48, 1)
        
        # Initialize CSV file
        self.csv_file = 'emotion_log.csv'
        self.initialize_csv()
        
        # Define stress levels for emotions
        self.stress_levels = {
            'Angry': 5,
            'Disgust': 4,
            'Fear': 4,
            'Happy': 1,
            'Sad': 3,
            'Surprise': 2,
            'Neutral': 2
        }
        
    def initialize_csv(self):
        if not os.path.exists(self.csv_file):
            with open(self.csv_file, 'w', newline='') as file:
                writer = csv.writer(file)
                writer.writerow(['Timestamp', 'Emotion', 'Confidence', 'Stress Level', 'Notes'])
    
    def log_emotion(self, emotion, confidence):
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        stress_level = self.stress_levels.get(emotion, 2)  # Default to 2 if emotion not found
        
        # Add notes based on stress level
        notes = self.get_stress_notes(stress_level)
        
        with open(self.csv_file, 'a', newline='') as file:
            writer = csv.writer(file)
            writer.writerow([timestamp, emotion, confidence, stress_level, notes])
    
    def get_stress_notes(self, stress_level):
        notes = {
            1: "Low stress - Good emotional state",
            2: "Moderate stress - Normal range",
            3: "Elevated stress - Consider taking a break",
            4: "High stress - Recommended to practice stress management",
            5: "Very high stress - Consider seeking support"
        }
        return notes.get(stress_level, "Unknown stress level")
    
    def analyze_stress_trend(self):
        try:
            df = pd.read_csv(self.csv_file)
            if len(df) > 0:
                avg_stress = df['Stress Level'].mean()
                recent_stress = df['Stress Level'].tail(5).mean()
                print("\nStress Analysis:")
                print(f"Average Stress Level: {avg_stress:.2f}")
                print(f"Recent Stress Level (last 5): {recent_stress:.2f}")
                
                if recent_stress > avg_stress:
                    print("⚠️ Warning: Your stress levels have been increasing recently.")
                elif recent_stress < avg_stress:
                    print("✅ Good news: Your stress levels have been decreasing recently.")
        except Exception as e:
            print(f"Error analyzing stress trend: {str(e)}")
    
    def preprocess_image(self, face_img):
        # Convert to grayscale
        gray = cv2.cvtColor(face_img, cv2.COLOR_BGR2GRAY)
        # Resize to model input size
        resized = cv2.resize(gray, (48, 48))
        # Normalize pixel values
        normalized = resized / 255.0
        # Reshape for model input
        reshaped = normalized.reshape(1, 48, 48, 1)
        return reshaped
    
    def detect_emotion(self, image_data):
        # Convert image data to numpy array
        nparr = np.frombuffer(image_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Convert frame to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )
        
        results = []
        
        for (x, y, w, h) in faces:
            # Extract face ROI
            face_roi = frame[y:y+h, x:x+w]
            
            # Preprocess face image
            processed_face = self.preprocess_image(face_roi)
            
            # Predict emotion
            prediction = self.model.predict(processed_face)
            emotion_idx = np.argmax(prediction[0])
            emotion = self.emotion_labels[emotion_idx]
            confidence = float(prediction[0][emotion_idx])
            
            results.append({
                'emotion': emotion,
                'confidence': confidence,
                'bbox': (x, y, w, h)
            })
        
        if results:
            # Get the result with highest confidence
            best_result = max(results, key=lambda x: x['confidence'])
            # Log the emotion
            self.log_emotion(best_result['emotion'], best_result['confidence'])
            return best_result['emotion'], best_result['confidence']
        else:
            return None, 0.0