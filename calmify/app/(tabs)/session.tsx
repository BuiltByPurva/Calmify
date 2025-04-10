import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Play, Calendar, Clock, TrendingUp, Pause, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { useState, useEffect } from 'react';

export default function SessionsScreen() {
  const colorScheme = useColorScheme();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSession, setActiveSession] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showTimer, setShowTimer] = useState(false);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      stopSession();
    }
    return () => clearInterval(interval);
  }, [isPlaying, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const playSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/meditation.mp3'),
        { shouldPlay: true, isLooping: true, volume: 0.5 }
      );
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
      console.error('Error playing sound:', error);
      // Continue with timer even if sound fails
      setTimeLeft(timeLeft);
      setActiveSession(activeSession);
      setIsPlaying(true);
      setShowTimer(true);
    }
  };

  const stopSound = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }
    } catch (error) {
      console.error('Error stopping sound:', error);
    }
  };

  const startSession = async (sessionId: number, duration: string) => {
    try {
      const minutes = parseInt(duration);
      setTimeLeft(minutes * 60);
      setActiveSession(sessionId);
      setIsPlaying(true);
      setShowTimer(true);
      await playSound();
    } catch (error) {
      console.error('Error starting session:', error);
      // Show timer even if sound fails
      const minutes = parseInt(duration);
      setTimeLeft(minutes * 60);
      setActiveSession(sessionId);
      setIsPlaying(true);
      setShowTimer(true);
    }
  };

  const stopSession = async () => {
    try {
      setIsPlaying(false);
      setActiveSession(null);
      setShowTimer(false);
      await stopSound();
    } catch (error) {
      console.error('Error stopping session:', error);
      // Ensure UI is reset even if sound stopping fails
      setIsPlaying(false);
      setActiveSession(null);
      setShowTimer(false);
    }
  };

  const sessions = [
    {
      id: 1,
      title: 'Morning Meditation',
      duration: '10 min',
      schedule: 'Daily at 8:00 AM',
      progress: '7/10 completed',
    },
    {
      id: 2,
      title: 'Stress Relief',
      duration: '15 min',
      schedule: 'Mon, Wed, Fri',
      progress: '5/8 completed',
    },
    {
      id: 3,
      title: 'Deep Sleep',
      duration: '20 min',
      schedule: 'Every night',
      progress: '12/15 completed',
    },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
          Sessions
        </Text>
        <Text style={[styles.subtitle, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
          Your mindfulness journey
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {sessions.map((session) => (
          <View
            key={session.id}
            style={[styles.sessionCard, { 
              backgroundColor: colorScheme === 'dark' ? 'rgba(30, 30, 30, 0.7)' : '#ffffff'
            }]}
          >
            <LinearGradient
              colors={[
                colorScheme === 'dark' ? 'rgba(10, 132, 255, 0.3)' : 'rgba(0, 122, 255, 0.15)',
                'transparent'
              ]}
              style={styles.cardGradient}
            />
            <View style={styles.sessionHeader}>
              <Text
                style={[styles.sessionTitle, { color: Colors[colorScheme ?? 'light'].text }]}
              >
                {session.title}
              </Text>
              <TouchableOpacity
                style={[
                  styles.playButton,
                  { 
                    backgroundColor: activeSession === session.id ? 
                      'rgba(255, 255, 255, 0.36)' : 
                      '#4A90E2'
                  }
                ]}
                onPress={() => {
                  if (activeSession === session.id) {
                    stopSession();
                  } else {
                    startSession(session.id, session.duration.split(' ')[0]);
                  }
                }}
              >
                {activeSession === session.id ? (
                  <Pause size={20} color="#FFFFFF" />
                ) : (
                  <Play size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.sessionDetails}>
              <View style={styles.detailItem}>
                <Clock size={16} color={colorScheme === 'dark' ? '#E0E0E0' : '#666666'} />
                <Text
                  style={[styles.detailText, { color: colorScheme === 'dark' ? '#E0E0E0' : '#666666' }]}
                >
                  {session.duration}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Calendar size={16} color={colorScheme === 'dark' ? '#E0E0E0' : '#666666'} />
                <Text
                  style={[styles.detailText, { color: colorScheme === 'dark' ? '#E0E0E0' : '#666666' }]}
                >
                  {session.schedule}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <TrendingUp size={16} color={colorScheme === 'dark' ? '#E0E0E0' : '#666666'} />
                <Text
                  style={[styles.detailText, { color: colorScheme === 'dark' ? '#E0E0E0' : '#666666' }]}
                >
                  {session.progress}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={showTimer}
        transparent
        animationType="fade"
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={stopSession}
            >
              <X size={24} color={colorScheme === 'dark' ? '#E0E0E0' : '#666666'} />
            </TouchableOpacity>
            <Text style={[styles.timerText, { color: colorScheme === 'dark' ? '#E0E0E0' : '#666666' }]}>
              {formatTime(timeLeft)}
            </Text>
            <Text style={[styles.timerLabel, { color: colorScheme === 'dark' ? '#A0A0A0' : '#8E8E93' }]}>
              Time Remaining
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  sessionCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 200,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sessionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionDetails: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  timerText: {
    fontFamily: 'Inter-Bold',
    fontSize: 48,
    marginVertical: 16,
  },
  timerLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
}); 