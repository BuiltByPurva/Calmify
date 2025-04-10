import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  Pressable,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Play, Calendar, Clock, TrendingUp, Pause, X, Plus, Trash2, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Session {
  id: number;
  title: string;
  duration: string;
  schedule: string;
  progress: string;
  time?: string;
}

const defaultSessions: Session[] = [
  {
    id: 1,
    title: 'Morning Meditation',
    duration: '10 min',
    schedule: 'Daily at 8:00 AM',
    progress: '0/0 completed',
  },
  {
    id: 2,
    title: 'Stress Relief',
    duration: '15 min',
    schedule: 'Mon, Wed, Fri',
    progress: '0/0 completed',
  },
  {
    id: 3,
    title: 'Deep Sleep',
    duration: '20 min',
    schedule: 'Every night',
    progress: '0/0 completed',
  }
];

const daysOfWeek = [
  { id: 0, name: 'Sun' },
  { id: 1, name: 'Mon' },
  { id: 2, name: 'Tue' },
  { id: 3, name: 'Wed' },
  { id: 4, name: 'Thu' },
  { id: 5, name: 'Fri' },
  { id: 6, name: 'Sat' },
];

export default function SessionsScreen() {
  const colorScheme = useColorScheme();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSession, setActiveSession] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showTimer, setShowTimer] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [newSession, setNewSession] = useState({
    title: '',
    duration: '',
  });
  const [selectedHour, setSelectedHour] = useState<number>(new Date().getHours() % 12 || 12);
  const [selectedMinute, setSelectedMinute] = useState<number>(new Date().getMinutes());
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(
    new Date().getHours() >= 12 ? 'PM' : 'AM'
  );

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  // Initialize sessions on first load
  useEffect(() => {
    const initializeSessions = async () => {
      try {
        // Clear existing sessions and set defaults
        await AsyncStorage.removeItem('sessions');
        console.log('Clearing existing sessions');
        
        // Set default sessions
        await AsyncStorage.setItem('sessions', JSON.stringify(defaultSessions));
        setSessions(defaultSessions);
        console.log('Default sessions set');
      } catch (error) {
        console.error('Error initializing sessions:', error);
        setSessions(defaultSessions);
      }
    };

    initializeSessions();
  }, []);

  const saveSessions = async (updatedSessions: Session[]) => {
    try {
      await AsyncStorage.setItem('sessions', JSON.stringify(updatedSessions));
      setSessions(updatedSessions);
    } catch (error) {
      console.error('Error saving sessions:', error);
    }
  };

  const formatTimeString = (hour: number, minute: number, period: 'AM' | 'PM'): string => {
    const adjustedHour = period === 'PM' && hour !== 12 
      ? hour + 12 
      : (period === 'AM' && hour === 12 ? 0 : hour);
    return `${adjustedHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const formatSchedule = () => {
    const timeString = formatTimeString(selectedHour, selectedMinute, selectedPeriod);
    
    if (selectedDays.length === 7) {
      return `Daily at ${timeString}`;
    } else if (selectedDays.length === 0) {
      return `Once at ${timeString}`;
    } else {
      const days = selectedDays
        .sort()
        .map(day => daysOfWeek[day].name)
        .join(', ');
      return `${days} at ${timeString}`;
    }
  };

  const createSession = () => {
    if (!newSession.title || !newSession.duration) {
      return; // Don't create if fields are empty
    }

    const newSessionData: Session = {
      id: Date.now(),
      title: newSession.title,
      duration: `${newSession.duration} min`,
      schedule: formatSchedule(),
      progress: '0/0 completed',
    };

    const updatedSessions = [...sessions, newSessionData];
    saveSessions(updatedSessions);
    setShowCreateModal(false);
    setNewSession({ title: '', duration: '' });
    setSelectedDays([]);
    setSelectedTime(new Date());
  };

  const deleteSession = (sessionId: number) => {
    if (activeSession === sessionId) {
      stopSession();
    }
    const updatedSessions = sessions.filter(session => session.id !== sessionId);
    saveSessions(updatedSessions);
  };

  const toggleDay = (dayId: number) => {
    setSelectedDays(prev => 
      prev.includes(dayId) 
        ? prev.filter(d => d !== dayId)
        : [...prev, dayId]
    );
  };

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
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
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }
      setTimeLeft(0);
    } catch (error) {
      console.error('Error stopping session:', error);
      // Ensure UI is reset even if sound stopping fails
      setIsPlaying(false);
      setActiveSession(null);
      setShowTimer(false);
      setTimeLeft(0);
    }
  };

  const updateSelectedTime = () => {
    const newDate = new Date();
    let hours = selectedHour;
    if (selectedPeriod === 'PM' && hours < 12) {
      hours += 12;
    } else if (selectedPeriod === 'AM' && hours === 12) {
      hours = 0;
    }
    newDate.setHours(hours);
    newDate.setMinutes(selectedMinute);
    setSelectedTime(newDate);
  };

  useEffect(() => {
    updateSelectedTime();
  }, [selectedHour, selectedMinute, selectedPeriod]);

  const showTimePickerModal = () => {
    setShowTimePicker(true);
  };

  const handleTimePress = (sessionId: number) => {
    const currentSession = sessions.find(s => s.id === sessionId);
    if (currentSession?.time) {
      const [time, period] = currentSession.time.split(' ');
      const [rawHours, rawMinutes] = time.split(':').map(Number);
      if (!isNaN(rawHours) && !isNaN(rawMinutes)) {
        setSelectedHour(rawHours);
        setSelectedMinute(rawMinutes);
        setSelectedPeriod(period as 'AM' | 'PM');
      }
    } else {
      const now = new Date();
      setSelectedHour(now.getHours() % 12 || 12);
      setSelectedMinute(now.getMinutes());
      setSelectedPeriod(now.getHours() >= 12 ? 'PM' : 'AM');
    }
    setActiveSession(sessionId);
    setShowTimePicker(true);
  };

  const handleTimeConfirm = () => {
    setShowTimePicker(false);
    const timeString = formatTimeString(selectedHour, selectedMinute, selectedPeriod);
    // Update any other necessary state or perform actions with the formatted time
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setNewSession({ title: '', duration: '' });
    setSelectedDays([]);
    setSelectedTime(new Date());
  };

  const renderTimePicker = () => {
    return (
      <Modal
        visible={showTimePicker}
        transparent
        animationType="slide"
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.timePickerContent, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <View style={styles.timePickerHeader}>
              <Text style={[styles.timePickerTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                Select Time
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowTimePicker(false)}
              >
                <X size={24} color={colorScheme === 'dark' ? '#E0E0E0' : '#666666'} />
              </TouchableOpacity>
            </View>

            <View style={styles.timePickerRow}>
              <View style={styles.pickerContainer}>
                <Text style={[styles.pickerLabel, { color: Colors[colorScheme ?? 'light'].text }]}>Hour</Text>
                <ScrollView style={styles.pickerScrollView}>
                  {hours.map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.timeOption,
                        selectedHour === hour && styles.timeOptionSelected
                      ]}
                      onPress={() => setSelectedHour(hour)}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        selectedHour === hour && styles.timeOptionTextSelected,
                        { color: Colors[colorScheme ?? 'light'].text }
                      ]}>
                        {hour}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.pickerContainer}>
                <Text style={[styles.pickerLabel, { color: Colors[colorScheme ?? 'light'].text }]}>Minute</Text>
                <ScrollView style={styles.pickerScrollView}>
                  {minutes.map((minute) => (
                    <TouchableOpacity
                      key={minute}
                      style={[
                        styles.timeOption,
                        selectedMinute === minute && styles.timeOptionSelected
                      ]}
                      onPress={() => setSelectedMinute(minute)}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        selectedMinute === minute && styles.timeOptionTextSelected,
                        { color: Colors[colorScheme ?? 'light'].text }
                      ]}>
                        {minute.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.pickerContainer}>
                <Text style={[styles.pickerLabel, { color: Colors[colorScheme ?? 'light'].text }]}>Period</Text>
                <View style={styles.periodContainer}>
                  <TouchableOpacity
                    style={[
                      styles.periodButton,
                      selectedPeriod === 'AM' && styles.periodButtonSelected
                    ]}
                    onPress={() => setSelectedPeriod('AM')}
                  >
                    <Text style={[
                      styles.periodButtonText,
                      selectedPeriod === 'AM' && styles.periodButtonTextSelected
                    ]}>
                      AM
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.periodButton,
                      selectedPeriod === 'PM' && styles.periodButtonSelected
                    ]}
                    onPress={() => setSelectedPeriod('PM')}
                  >
                    <Text style={[
                      styles.periodButtonText,
                      selectedPeriod === 'PM' && styles.periodButtonTextSelected
                    ]}>
                      PM
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: '#4A90E2' }]}
              onPress={handleTimeConfirm}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

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
              <View style={styles.sessionControls}>
                <TouchableOpacity
                  style={[styles.deleteButton]}
                  onPress={() => deleteSession(session.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Trash2 size={20} color={colorScheme === 'dark' ? '#FF453A' : '#FF3B30'} />
                </TouchableOpacity>
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

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: '#4A90E2' }]}
        onPress={() => setShowCreateModal(true)}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Create Session Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseCreateModal}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.createModalContent, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseCreateModal}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={24} color={colorScheme === 'dark' ? '#E0E0E0' : '#666666'} />
            </TouchableOpacity>
            
            <Text style={[styles.modalTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              Create New Session
            </Text>

            <TextInput
              style={[styles.input, { 
                color: Colors[colorScheme ?? 'light'].text,
                borderColor: Colors[colorScheme ?? 'light'].inputBorder,
                backgroundColor: colorScheme === 'dark' ? 'rgba(30, 30, 30, 0.7)' : '#ffffff'
              }]}
              placeholder="Session Title"
              placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
              value={newSession.title}
              onChangeText={(text) => setNewSession({ ...newSession, title: text })}
            />

            <TextInput
              style={[styles.input, { 
                color: Colors[colorScheme ?? 'light'].text,
                borderColor: Colors[colorScheme ?? 'light'].inputBorder,
                backgroundColor: colorScheme === 'dark' ? 'rgba(30, 30, 30, 0.7)' : '#ffffff'
              }]}
              placeholder="Duration (minutes)"
              placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
              value={newSession.duration}
              onChangeText={(text) => setNewSession({ ...newSession, duration: text })}
              keyboardType="numeric"
            />

            <View style={styles.scheduleContainer}>
              <Text style={[styles.scheduleLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                Schedule
              </Text>
              
              <View style={styles.daysContainer}>
                {daysOfWeek.map((day) => (
                  <TouchableOpacity
                    key={day.id}
                    style={[
                      styles.dayButton,
                      selectedDays.includes(day.id) && styles.dayButtonSelected
                    ]}
                    onPress={() => toggleDay(day.id)}
                  >
                    <Text style={[
                      styles.dayButtonText,
                      selectedDays.includes(day.id) && styles.dayButtonTextSelected
                    ]}>
                      {day.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.timeButton, { borderColor: Colors[colorScheme ?? 'light'].inputBorder }]}
                onPress={showTimePickerModal}
              >
                <Clock size={20} color={Colors[colorScheme ?? 'light'].text} />
                <Text style={[styles.timeButtonText, { color: Colors[colorScheme ?? 'light'].text }]}>
                  {selectedTime.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: '#4A90E2' }]}
              onPress={createSession}
            >
              <Text style={styles.createButtonText}>Create Session</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Timer Modal */}
      <Modal
        visible={showTimer}
        transparent
        animationType="fade"
        onRequestClose={stopSession}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={stopSession}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
      {renderTimePicker()}
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
  sessionControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteButton: {
    padding: 8,
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
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  createModalContent: {
    width: '90%',
    padding: 24,
    borderRadius: 16,
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
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  createButton: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  scheduleContainer: {
    marginBottom: 20,
  },
  scheduleLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 12,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  dayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  dayButtonSelected: {
    backgroundColor: '#4A90E2',
  },
  dayButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#666666',
  },
  dayButtonTextSelected: {
    color: '#FFFFFF',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  timeButtonText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  timePickerContent: {
    width: '90%',
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
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
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  timePickerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
  },
  timePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  pickerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginBottom: 8,
  },
  pickerScrollView: {
    height: 200,
  },
  timeOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 2,
    borderRadius: 8,
  },
  timeOptionSelected: {
    backgroundColor: '#4A90E2',
  },
  timeOptionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
  },
  timeOptionTextSelected: {
    color: '#FFFFFF',
  },
  periodContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  periodButtonSelected: {
    backgroundColor: '#4A90E2',
  },
  periodButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#666666',
  },
  periodButtonTextSelected: {
    color: '#FFFFFF',
  },
  confirmButton: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
}); 