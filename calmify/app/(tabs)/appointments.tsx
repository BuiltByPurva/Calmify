import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Calendar, Clock, X, Plus, Video, Phone, Star, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface Therapist {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  experience: string;
  image: string;
  nextAvailable: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface BookedSession {
  id: string;
  therapist: Therapist;
  date: string;
  time: string;
}

const therapists: Therapist[] = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    specialty: 'Anxiety & Depression',
    rating: 4.9,
    experience: '15 years',
    image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=987&auto=format&fit=crop',
    nextAvailable: 'Today, 3:00 PM',
  },
  {
    id: '2',
    name: 'Dr. Michael Chen',
    specialty: 'Relationship Counseling',
    rating: 4.8,
    experience: '12 years',
    image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=1770&auto=format&fit=crop',
    nextAvailable: 'Tomorrow, 10:00 AM',
  },
  {
    id: '3',
    name: 'Dr. Emily Martinez',
    specialty: 'Stress Management',
    rating: 4.7,
    experience: '10 years',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=1770&auto=format&fit=crop',
    nextAvailable: 'Today, 5:30 PM',
  },
];

const timeSlots: TimeSlot[] = [
  { time: '9:00 AM', available: true },
  { time: '10:00 AM', available: true },
  { time: '11:00 AM', available: false },
  { time: '1:00 PM', available: true },
  { time: '2:00 PM', available: true },
  { time: '3:00 PM', available: false },
  { time: '4:00 PM', available: true },
  { time: '5:00 PM', available: true },
];

export default function AppointmentsScreen() {
  const colorScheme = useColorScheme();
  const [selectedTab, setSelectedTab] = useState<'available' | 'upcoming'>('available');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [scheduleStep, setScheduleStep] = useState<'date' | 'time' | 'confirm'>('date');
  const [bookedSessions, setBookedSessions] = useState<BookedSession[]>([]);

  // Load booked sessions from AsyncStorage on mount
  useEffect(() => {
    loadBookedSessions();
  }, []);

  const loadBookedSessions = async () => {
    try {
      const savedSessions = await AsyncStorage.getItem('bookedSessions');
      if (savedSessions) {
        const parsedSessions = JSON.parse(savedSessions);
        // Convert date strings back to Date objects
        const sessionsWithDates = parsedSessions.map((session: BookedSession) => ({
          ...session,
          date: new Date(session.date)
        }));
        setBookedSessions(sessionsWithDates);
      }
    } catch (error) {
      console.error('Error loading booked sessions:', error);
    }
  };

  const saveBookedSessions = async (sessions: BookedSession[]) => {
    try {
      await AsyncStorage.setItem('bookedSessions', JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving booked sessions:', error);
    }
  };

  const theme = {
    background: colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7',
    card: colorScheme === 'dark' ? '#2C2C2E' : '#FFFFFF',
    primary: '#4A90E2',
    border: colorScheme === 'dark' ? '#3A3A3C' : '#E5E5EA',
    text: {
      primary: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
      secondary: colorScheme === 'dark' ? '#8E8E93' : '#6E6E73',
      inverse: '#FFFFFF',
    },
  };

  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  const handleSchedule = (therapist: Therapist) => {
    setSelectedTherapist(therapist);
    setShowScheduleModal(true);
    setScheduleStep('date');
  };

  const handleConfirmSchedule = async () => {
    if (!selectedTherapist || !selectedDate || !selectedTime) return;

    const newSession = {
      id: Date.now().toString(),
      therapist: selectedTherapist,
      date: selectedDate.toISOString(),
      time: selectedTime,
    };

    const updatedSessions = [...bookedSessions, newSession];
    setBookedSessions(updatedSessions);
    await saveBookedSessions(updatedSessions);
    
    setShowScheduleModal(false);
    setSelectedTab('upcoming');
    Alert.alert(
      'Appointment Scheduled',
      `Your appointment with ${selectedTherapist.name} has been scheduled for ${selectedDate.toLocaleDateString()} at ${selectedTime}.`
    );
  };

  const cancelAppointment = async (sessionId: string) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            const updatedSessions = bookedSessions.filter(session => session.id !== sessionId);
            setBookedSessions(updatedSessions);
            await saveBookedSessions(updatedSessions);
            Alert.alert('Appointment Cancelled', 'Your appointment has been cancelled successfully.');
          },
        },
      ]
    );
  };

  const renderDatePicker = () => (
    <View style={styles.datePickerContainer}>
      <Text style={[styles.modalTitle, { color: theme.text.primary }]}>
        Select Date
      </Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateList}
      >
        {dates.map((date, index) => {
          const isSelected = date.toDateString() === selectedDate.toDateString();
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dateItem,
                isSelected && { backgroundColor: theme.primary },
                { borderColor: theme.border }
              ]}
              onPress={() => setSelectedDate(date)}
            >
              <Text
                style={[
                  styles.dateDay,
                  { color: isSelected ? theme.text.inverse : theme.text.primary }
                ]}
              >
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </Text>
              <Text
                style={[
                  styles.dateNumber,
                  { color: isSelected ? theme.text.inverse : theme.text.primary }
                ]}
              >
                {date.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderTimePicker = () => (
    <View style={styles.timePickerContainer}>
      <Text style={[styles.modalTitle, { color: theme.text.primary }]}>
        Select Time
      </Text>
      <View style={styles.timeGrid}>
        {timeSlots.map((slot, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.timeSlot,
              {
                backgroundColor: slot.available 
                  ? selectedTime === slot.time 
                    ? theme.primary 
                    : theme.card
                  : theme.border,
                opacity: slot.available ? 1 : 0.5,
              },
            ]}
            onPress={() => slot.available && setSelectedTime(slot.time)}
            disabled={!slot.available}
          >
            <Text
              style={[
                styles.timeText,
                {
                  color: slot.available
                    ? selectedTime === slot.time
                      ? theme.text.inverse
                      : theme.text.primary
                    : theme.text.secondary,
                },
              ]}
            >
              {slot.time}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderConfirmation = () => (
    <View style={styles.confirmationContainer}>
      <Text style={[styles.modalTitle, { color: theme.text.primary }]}>
        Confirm Appointment
      </Text>
      <View style={[styles.confirmationCard, { backgroundColor: theme.card }]}>
        <Image
          source={{ uri: selectedTherapist?.image }}
          style={styles.confirmationImage}
        />
        <View style={styles.confirmationDetails}>
          <Text style={[styles.confirmationName, { color: theme.text.primary }]}>
            {selectedTherapist?.name}
          </Text>
          <Text style={[styles.confirmationSpecialty, { color: theme.text.secondary }]}>
            {selectedTherapist?.specialty}
          </Text>
          <Text style={[styles.confirmationDateTime, { color: theme.text.primary }]}>
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <Text style={[styles.confirmationDateTime, { color: theme.text.primary }]}>
            {selectedTime}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderScheduleModal = () => (
    <Modal
      visible={showScheduleModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowScheduleModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                if (scheduleStep === 'date') {
                  setShowScheduleModal(false);
                } else if (scheduleStep === 'time') {
                  setScheduleStep('date');
                } else {
                  setScheduleStep('time');
                }
              }}
            >
              <ChevronLeft size={24} color={theme.text.primary} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text.primary }]}>
              {scheduleStep === 'date'
                ? 'Select Date'
                : scheduleStep === 'time'
                ? 'Select Time'
                : 'Confirm'}
            </Text>
            <TouchableOpacity onPress={() => setShowScheduleModal(false)}>
              <X size={24} color={theme.text.primary} />
            </TouchableOpacity>
          </View>

          {scheduleStep === 'date' && renderDatePicker()}
          {scheduleStep === 'time' && renderTimePicker()}
          {scheduleStep === 'confirm' && renderConfirmation()}

          {scheduleStep !== 'confirm' && (
            <TouchableOpacity
              style={[
                styles.nextButton,
                {
                  backgroundColor: theme.primary,
                  opacity:
                    (scheduleStep === 'date' && selectedDate) ||
                    (scheduleStep === 'time' && selectedTime)
                      ? 1
                      : 0.5,
                },
              ]}
              onPress={() => {
                if (scheduleStep === 'date') {
                  setScheduleStep('time');
                } else if (scheduleStep === 'time') {
                  setScheduleStep('confirm');
                }
              }}
              disabled={
                (scheduleStep === 'date' && !selectedDate) ||
                (scheduleStep === 'time' && !selectedTime)
              }
            >
              <Text style={[styles.nextButtonText, { color: theme.text.inverse }]}>
                Next
              </Text>
              <ChevronRight size={20} color={theme.text.inverse} />
            </TouchableOpacity>
          )}

          {scheduleStep === 'confirm' && (
            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: theme.primary }]}
              onPress={handleConfirmSchedule}
            >
              <Text style={[styles.confirmButtonText, { color: theme.text.inverse }]}>
                Confirm Appointment
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderUpcomingSession = (session: BookedSession) => (
    <Animated.View
      key={session.id}
      entering={FadeInDown}
      style={[styles.sessionCard, { backgroundColor: theme.card }]}
    >
      <LinearGradient
        colors={[
          colorScheme === 'dark' ? 'rgba(74, 144, 226, 0.1)' : 'rgba(74, 144, 226, 0.05)',
          'transparent'
        ]}
        style={styles.cardGradient}
      />
      <View style={styles.sessionHeader}>
        <Image
          source={{ uri: session.therapist.image }}
          style={styles.upcomingTherapistImage}
        />
        <View style={styles.sessionInfo}>
          <Text style={[styles.upcomingTherapistName, { color: theme.text.primary }]}>
            {session.therapist.name}
          </Text>
          <Text style={[styles.upcomingSpecialty, { color: theme.text.secondary }]}>
            {session.therapist.specialty}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.cancelButton, { 
            backgroundColor: colorScheme === 'dark' ? 'rgba(255, 69, 58, 0.1)' : 'rgba(255, 59, 48, 0.1)',
            borderColor: 'transparent' 
          }]}
          onPress={() => cancelAppointment(session.id)}
        >
          <X size={20} color={colorScheme === 'dark' ? '#FF453A' : '#FF3B30'} />
        </TouchableOpacity>
      </View>

      <View style={styles.sessionDivider} />

      <View style={styles.sessionDetailsContainer}>
        <View style={styles.detailColumn}>
          <View style={styles.detailRow}>
            <Calendar size={18} color={theme.primary} style={styles.detailIcon} />
            <View>
              <Text style={[styles.detailLabel, { color: theme.text.secondary }]}>
                Date
              </Text>
              <Text style={[styles.detailValue, { color: theme.text.primary }]}>
                {new Date(session.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.detailColumn}>
          <View style={styles.detailRow}>
            <Clock size={18} color={theme.primary} style={styles.detailIcon} />
            <View>
              <Text style={[styles.detailLabel, { color: theme.text.secondary }]}>
                Time
              </Text>
              <Text style={[styles.detailValue, { color: theme.text.primary }]}>
                {session.time}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.sessionActions}>
        <TouchableOpacity
          style={[styles.sessionActionButton, { backgroundColor: theme.primary }]}
        >
          <Video size={20} color={theme.text.inverse} />
          <Text style={[styles.actionButtonText, { color: theme.text.inverse }]}>
            Join Call
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sessionActionButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.primary }]}
        >
          <Phone size={20} color={theme.primary} />
          <Text style={[styles.actionButtonText, { color: theme.primary }]}>
            Contact
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderTherapistCard = (therapist: Therapist, index: number) => (
    <Animated.View
      entering={FadeInDown.delay(index * 200).springify()}
      key={therapist.id}
      style={[
        styles.therapistCard,
        { backgroundColor: theme.card }
      ]}
    >
      <Image
        source={{ uri: therapist.image }}
        style={styles.therapistImage}
      />
      <View style={styles.therapistInfo}>
        <Text style={[styles.therapistName, { color: theme.text.primary }]}>
          {therapist.name}
        </Text>
        <Text style={[styles.therapistSpecialty, { color: theme.text.secondary }]}>
          {therapist.specialty}
        </Text>
        <View style={styles.therapistStats}>
          <View style={styles.statItem}>
            <Star size={16} color={theme.primary} />
            <Text style={[styles.statText, { color: theme.text.secondary }]}>
              {therapist.rating}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Clock size={16} color={theme.primary} />
            <Text style={[styles.statText, { color: theme.text.secondary }]}>
              {therapist.experience}
            </Text>
          </View>
        </View>
        <Text style={[styles.nextAvailable, { color: theme.text.secondary }]}>
          Next available: {therapist.nextAvailable}
        </Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
          onPress={() => {}}
        >
          <Video size={20} color={theme.text.inverse} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
          onPress={() => {}}
        >
          <Phone size={20} color={theme.text.inverse} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
          onPress={() => handleSchedule(therapist)}
        >
          <Calendar size={20} color={theme.text.inverse} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'available' && { borderBottomColor: theme.primary },
          ]}
          onPress={() => setSelectedTab('available')}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  selectedTab === 'available'
                    ? theme.primary
                    : theme.text.secondary,
              },
            ]}
          >
            Available Therapists
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'upcoming' && { borderBottomColor: theme.primary },
          ]}
          onPress={() => setSelectedTab('upcoming')}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  selectedTab === 'upcoming'
                    ? theme.primary
                    : theme.text.secondary,
              },
            ]}
          >
            Upcoming Sessions
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {selectedTab === 'available' ? (
          therapists.map((therapist, index) => renderTherapistCard(therapist, index))
        ) : (
          bookedSessions.length > 0 ? (
            bookedSessions.map((session) => renderUpcomingSession(session))
          ) : (
            <View style={styles.emptyState}>
              <Calendar size={48} color={theme.text.secondary} />
              <Text style={[styles.emptyStateText, { color: theme.text.secondary }]}>
                No upcoming sessions
              </Text>
            </View>
          )
        )}
      </ScrollView>

      {renderScheduleModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  therapistCard: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  therapistImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  therapistInfo: {
    flex: 1,
    marginLeft: 15,
  },
  therapistName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  therapistSpecialty: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  therapistStats: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  nextAvailable: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 8,
    justifyContent: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
  },
  datePickerContainer: {
    marginBottom: 20,
  },
  dateList: {
    paddingVertical: 10,
  },
  dateItem: {
    width: 70,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  dateDay: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
  },
  dateNumber: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  timePickerContainer: {
    marginBottom: 20,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeSlot: {
    width: '23%',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  confirmationContainer: {
    marginBottom: 20,
  },
  confirmationCard: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 12,
    marginTop: 15,
  },
  confirmationImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  confirmationDetails: {
    flex: 1,
    marginLeft: 15,
  },
  confirmationName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  confirmationSpecialty: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  confirmationDateTime: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  nextButton: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  confirmButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  sessionCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  upcomingTherapistImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  sessionInfo: {
    flex: 1,
    marginLeft: 15,
  },
  upcomingTherapistName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  upcomingSpecialty: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  sessionDivider: {
    height: 1,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    marginBottom: 15,
  },
  sessionDetailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  detailColumn: {
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  sessionActionButton: {
    flex: 1,
    flexDirection: 'row',
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginTop: 12,
  },
}); 