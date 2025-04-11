import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image, ActivityIndicator, Alert, ScrollView } from 'react-native';
import {
  CameraView,
  useCameraPermissions,
} from 'expo-camera';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@/utils/ThemeContext';
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
  const { theme, isDark } = useTheme();
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

        console.log('Captured image URI:', photo.uri);
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
    <View style={[styles.container, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
      {!showResult ? (
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={cameraType}
          />
          <View style={[styles.overlay, { backgroundColor: 'transparent' }]}>
            <View style={[styles.header, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)' }]}>
              <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                Mood Detection
              </Text>
            </View>
            
            <View style={styles.controls}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: isDark ? '#4A90E2' : '#007AFF' }]}
                onPress={captureAndAnalyze}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <FontAwesome name="camera" size={24} color="#FFFFFF" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: isDark ? '#4A90E2' : '#007AFF', marginLeft: 16 }]}
                onPress={toggleCameraType}
              >
                <FontAwesome name="refresh" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: isDark ? '#4A90E2' : '#007AFF', marginLeft: 16 }]}
                onPress={toggleHistory}
              >
                <FontAwesome name="history" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <ScrollView style={[styles.resultContainer, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          <View style={[styles.resultHeader, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
            <Text style={[styles.resultTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Analysis Result
            </Text>
          </View>
          
          {currentMood && (
            <View style={[styles.resultContent, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}>
              <Image
                source={{ uri: currentMood.imageUri }}
                style={styles.resultImage}
              />
              <View style={[styles.resultInfo, { backgroundColor: isDark ? '#3C3C3E' : '#F2F2F7' }]}>
                <Text style={[styles.emotionText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  Emotion: {currentMood.emotion}
                </Text>
                <Text style={[styles.confidenceText, { color: isDark ? '#E0E0E0' : '#666666' }]}>
                  Confidence: {(currentMood.confidence * 100).toFixed(1)}%
                </Text>
                <View style={[styles.stressIndicator, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}>
                  <Text style={[styles.stressText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                    Stress Level: {currentMood.stressLevel}/5
                  </Text>
                  <View style={[styles.stressBar, { backgroundColor: getStressLevelColor(currentMood.stressLevel || 0) }]} />
                </View>
                <Text style={[styles.notesText, { color: isDark ? '#E0E0E0' : '#666666' }]}>
                  {currentMood.notes}
                </Text>
              </View>
            </View>
          )}
          
          <TouchableOpacity
            style={[styles.actionButton, {
              backgroundColor: isDark ? '#4A90E2' : '#007AFF',
              marginTop: 16,
              marginHorizontal: 16,
              marginBottom: 20,
            }]}
            onPress={resetCamera}
          >
            <Text style={styles.actionButtonText}>Take Another Photo</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {showHistory && (
        <ScrollView 
          style={[styles.historyContainer, { 
            backgroundColor: isDark ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.95)',
            borderColor: isDark ? '#3C3C3E' : '#E5E5EA'
          }]}
        >
          <View style={[styles.historyHeader, { borderBottomColor: isDark ? '#3C3C3E' : '#E5E5EA' }]}>
            <Text style={[styles.historyTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Mood History
            </Text>
            <TouchableOpacity onPress={toggleHistory}>
              <FontAwesome name="close" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
            </TouchableOpacity>
          </View>
          
          {moodHistory.map((mood, index) => (
            <View 
              key={index} 
              style={[
                styles.historyItem, 
                { 
                  backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                  borderColor: isDark ? '#3C3C3E' : '#E5E5EA'
                }
              ]}
            >
              <Image source={{ uri: mood.imageUri }} style={styles.historyImage} />
              <View style={styles.historyInfo}>
                <Text style={[styles.historyEmotion, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  {mood.emotion}
                </Text>
                <Text style={[styles.historyTime, { color: isDark ? '#E0E0E0' : '#666666' }]}>
                  {new Date(mood.timestamp).toLocaleString()}
                </Text>
                <View style={styles.historyStressLevel}>
                  <Text style={[styles.historyStressText, { color: isDark ? '#E0E0E0' : '#666666' }]}>
                    Stress Level: {mood.stressLevel}/5
                  </Text>
                  <View 
                    style={[
                      styles.historyStressBar,
                      { backgroundColor: getStressLevelColor(mood.stressLevel || 0) }
                    ]} 
                  />
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
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
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  header: {
    padding: 16,
    paddingTop: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    flex: 1,
  },
  resultHeader: {
    padding: 16,
    borderBottomWidth: 1,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resultContent: {
    padding: 16,
  },
  resultImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 16,
  },
  resultInfo: {
    padding: 16,
    borderRadius: 12,
  },
  emotionText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  confidenceText: {
    fontSize: 16,
    marginBottom: 16,
  },
  stressIndicator: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  stressText: {
    fontSize: 16,
    marginBottom: 8,
  },
  stressBar: {
    height: 8,
    borderRadius: 4,
  },
  notesText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  historyContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  historyItem: {
    flexDirection: 'row',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  historyImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  historyInfo: {
    flex: 1,
    marginLeft: 12,
  },
  historyEmotion: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  historyTime: {
    fontSize: 14,
    marginBottom: 8,
  },
  historyStressLevel: {
    backgroundColor: 'transparent',
  },
  historyStressText: {
    fontSize: 14,
    marginBottom: 4,
  },
  historyStressBar: {
    height: 4,
    borderRadius: 2,
    width: '100%',
  },
  actionButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
