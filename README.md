# Calmify - Mental Health & Sleep Tracking App

## App Screenshots

<div style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center;">
  <img src="calmify/assets/screenshots/ui.jpg" alt="Calmify UI" width="200"/>
  <img src="calmify/assets/screenshots/analytics.jpg" alt="Analytics View" width="200"/>
  <img src="calmify/assets/screenshots/chatbot.jpg" alt="Chat Interface" width="200"/>
  <img src="calmify/assets/screenshots/sessions.png" alt="Meditation Sessions" width="200"/>
</div>

Calmify is a comprehensive mental health and sleep tracking application that helps users monitor their stress levels, sleep patterns, and provides guided meditation sessions.

## Features

- **Stress Prediction**: Track and predict stress levels based on health metrics
- **Sleep Analytics**: Monitor sleep duration, snoring rate, and heart rate
- **Guided Meditation**: Access to various meditation sessions with timer and background music
- **Chat Support**: AI-powered chat interface for mental health support
- **Dark Mode**: Comfortable dark theme for all app screens

## Tech Stack

### Frontend
- React Native with Expo
- TypeScript
- React Navigation
- Expo AV for audio playback
- React Native Charts
- Theme Context for dark/light mode

### Backend
- Flask (Python)
- TensorFlow for stress prediction
- Hugging Face Transformers for chatbot
- RESTful API architecture

## Project Structure

```
calmify/
├── app/                  # Main application code
│   ├── (tabs)/           # Tab screens
│   │   ├── index.tsx     # Home/Input screen
│   │   ├── chat.tsx      # Chat interface
│   │   └── session.tsx   # Meditation sessions
│   └── utils/            # Utility functions
├── assets/               # Static assets
│   ├── fonts/            # Custom fonts
│   └── sounds/           # Meditation sounds
└── components/           # Reusable components

backend/
├── app.py                # Flask application
├── models/               # ML models
└── requirements.txt      # Python dependencies
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Python 3.8+
- Expo CLI
- Android Studio or Xcode for emulators

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/calmify.git
cd calmify
```

2. Install frontend dependencies
```bash
cd calmify
npm install
```

3. Install backend dependencies
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

4. Set up environment variables
Create a `.env` file in the backend directory with:
```
FLASK_APP=app.py
FLASK_ENV=development
```

5. Start the backend server
```bash
cd backend
flask run
```

6. Start the frontend application
```bash
cd calmify
npx expo start
```

## Usage

1. **Input Health Data**: Enter your sleep hours, snoring rate, and heart rate
2. **View Analytics**: Check your stress prediction and health trends
3. **Meditation Sessions**: Start guided meditation sessions with timer and background music
4. **Chat Support**: Interact with the AI chatbot for mental health support

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Expo](https://expo.dev/) for the React Native framework
- [Flask](https://flask.palletsprojects.com/) for the backend framework
- [TensorFlow](https://www.tensorflow.org/) for machine learning capabilities
- [Hugging Face](https://huggingface.co/) for the transformer models 
