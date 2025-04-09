import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image, ActivityIndicator, Alert, ScrollView } from 'react-native';
import {
  CameraView,
  useCameraPermissions,
} from 'expo-camera';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@/utils/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MoodLog {
  emotion: string;
  confidence: number;
  timestamp: string;
  imageUri?: string;
  stressLevel?: number;
  notes?: string;
}

// Map emotions to stress levels
const STRESS_LEVELS: Record<string, number> = {
  'Angry': 5,
  'Disgust': 4,
  'Fear': 4,
  'Happy': 1,
  'Sad': 3,
  'Surprise': 2,
  'Neutral': 2
};

// Map stress levels to notes
const STRESS_NOTES: Record<number, string> = {
  1: "Low stress - Good emotional state",
  2: "Moderate stress - Normal range",
  3: "Elevated stress - Consider taking a break",
  4: "High stress - Recommended to practice stress management",
  5: "Very high stress - Consider seeking support"
};

export default function CameraScreen() {
  const { theme } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<'front' | 'back'>('front');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [currentMood, setCurrentMood] = useState<MoodLog | null>(null);
  const [moodHistory, setMoodHistory] = useState<MoodLog[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
    loadMoodHistory();
  }, [permission]);

  const loadMoodHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('moodHistory');
      if (history) {
        setMoodHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading mood history:', error);
    }
  };

  const saveMoodHistory = async (newMood: MoodLog) => {
    try {
      const updatedHistory = [newMood, ...moodHistory];
      await AsyncStorage.setItem('moodHistory', JSON.stringify(updatedHistory));
      setMoodHistory(updatedHistory);
    } catch (error) {
      console.error('Error saving mood history:', error);
    }
  };

  const toggleCameraType = () => {
    setCameraType((prevType: 'front' | 'back') =>
      prevType === 'back' ? 'front' : 'back'
    );
  };

  const captureAndAnalyze = async () => {
    if (cameraRef.current) {
      try {
        setIsAnalyzing(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          base64: true,
        });

        if (!photo || !photo.uri || !photo.base64) {
          throw new Error('Failed to capture photo');
        }

        // Create form data for the image
        const formData = new FormData();
        formData.append('image', {
          uri: photo.uri,
          type: 'image/jpeg',
          name: 'photo.jpg',
          base64: photo.base64,
        } as any);

        // Send to backend for emotion detection
        const response = await fetch('http://192.168.204.181:5000/detect_emotion', {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to analyze emotion');
        }

        const result = await response.json();
        const emotion = result.emotion;
        const confidence = result.confidence;
        const stressLevel = STRESS_LEVELS[emotion] || 2;
        const notes = STRESS_NOTES[stressLevel] || "Unknown stress level";

        const newMood: MoodLog = {
          emotion,
          confidence,
          timestamp: new Date().toISOString(),
          imageUri: photo.uri,
          stressLevel,
          notes
        };

        setCurrentMood(newMood);
        saveMoodHistory(newMood);
        setShowResult(true);
        setShowHistory(false);
      } catch (error) {
        console.error('Error capturing or analyzing image:', error);
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to analyze emotion. Please try again.');
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const resetCamera = () => {
    setShowResult(false);
    setCurrentMood(null);
    setShowHistory(false);
  };

  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };

  const getStressLevelColor = (level: number) => {
    switch (level) {
      case 1: return '#4CAF50'; // Green
      case 2: return '#8BC34A'; // Light Green
      case 3: return '#FFC107'; // Amber
      case 4: return '#FF9800'; // Orange
      case 5: return '#F44336'; // Red
      default: return '#9E9E9E'; // Grey
    }
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      {!showResult ? (
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={cameraType}
          />
          <View style={styles.overlay}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.text.inverse }]}>
                Mood Detection
              </Text>
            </View>
            
            <View style={styles.controls}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={captureAndAnalyze}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <ActivityIndicator color={theme.text.inverse} />
                ) : (
                  <FontAwesome name="camera" size={24} color={theme.text.inverse} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.card }]}
                onPress={toggleCameraType}
              >
                <FontAwesome name="refresh" size={24} color={theme.text.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.resultContainer}>
          <LinearGradient
            colors={[theme.primary, theme.primary + '80']}
            style={styles.resultGradient}
          />
          
          <View style={styles.resultContent}>
            {!showHistory ? (
              <>
                <Text style={[styles.resultTitle, { color: theme.text.inverse }]}>
                  Mood Detected
                </Text>
                
                <View style={[styles.emotionBox, { backgroundColor: theme.card }]}>
                  <Text style={[styles.emotionText, { color: theme.text.primary }]}>
                    {currentMood?.emotion.toUpperCase()}
                  </Text>
                  <Text style={[styles.confidenceText, { color: theme.text.secondary }]}>
                    Confidence: {currentMood?.confidence.toFixed(2)}%
                  </Text>
                  
                  {currentMood?.stressLevel && (
                    <View style={[styles.stressIndicator, { backgroundColor: getStressLevelColor(currentMood.stressLevel) }]}>
                      <Text style={styles.stressText}>Stress Level: {currentMood.stressLevel}/5</Text>
                    </View>
                  )}
                  
                  {currentMood?.notes && (
                    <Text style={[styles.notesText, { color: theme.text.secondary }]}>
                      {currentMood.notes}
                    </Text>
                  )}
                </View>
                
                <View style={styles.resultActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.primary }]}
                    onPress={resetCamera}
                  >
                    <Text style={[styles.actionButtonText, { color: theme.text.inverse }]}>
                      Take Another
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.card }]}
                    onPress={toggleHistory}
                  >
                    <Text style={[styles.actionButtonText, { color: theme.text.primary }]}>
                      View History
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={[styles.resultTitle, { color: theme.text.inverse }]}>
                  Mood History
                </Text>
                
                <ScrollView style={styles.historyContainer}>
                  {moodHistory.length > 0 ? (
                    moodHistory.map((mood, index) => (
                      <View key={index} style={[styles.historyItem, { backgroundColor: theme.card }]}>
                        <View style={styles.historyHeader}>
                          <Text style={[styles.historyEmotion, { color: theme.text.primary }]}>
                            {mood.emotion}
                          </Text>
                          <Text style={[styles.historyDate, { color: theme.text.secondary }]}>
                            {new Date(mood.timestamp).toLocaleString()}
                          </Text>
                        </View>
                        
                        <View style={styles.historyDetails}>
                          <Text style={[styles.historyConfidence, { color: theme.text.secondary }]}>
                            Confidence: {mood.confidence.toFixed(2)}%
                          </Text>
                          
                          {mood.stressLevel && (
                            <View style={[styles.historyStress, { backgroundColor: getStressLevelColor(mood.stressLevel) }]}>
                              <Text style={styles.historyStressText}>Stress: {mood.stressLevel}/5</Text>
                            </View>
                          )}
                        </View>
                        
                        {mood.notes && (
                          <Text style={[styles.historyNotes, { color: theme.text.secondary }]}>
                            {mood.notes}
                          </Text>
                        )}
                      </View>
                    ))
                  ) : (
                    <Text style={[styles.noHistoryText, { color: theme.text.secondary }]}>
                      No mood history available
                    </Text>
                  )}
                </ScrollView>
                
                <TouchableOpacity
                  style={[styles.backButton, { backgroundColor: theme.primary }]}
                  onPress={() => setShowHistory(false)}
                >
                  <Text style={[styles.backButtonText, { color: theme.text.inverse }]}>
                    Back to Result
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 30,
  },
  button: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  resultContainer: {
    flex: 1,
  },
  resultGradient: {
    flex: 1,
  },
  resultContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  emotionBox: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
  },
  emotionText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  confidenceText: {
    fontSize: 16,
    marginBottom: 15,
  },
  stressIndicator: {
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  stressText: {
    color: 'white',
    fontWeight: 'bold',
  },
  notesText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  actionButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  historyContainer: {
    width: '100%',
    maxHeight: 400,
    marginBottom: 20,
  },
  historyItem: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  historyEmotion: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  historyDate: {
    fontSize: 12,
  },
  historyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  historyConfidence: {
    fontSize: 14,
  },
  historyStress: {
    padding: 5,
    borderRadius: 5,
  },
  historyStressText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  historyNotes: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  noHistoryText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
  backButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 20,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
