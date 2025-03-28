import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Modal,
  Dimensions,
} from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/utils/ThemeContext';
import { Video, Phone, Calendar, Star, Clock, X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  date: Date;
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

export default function TeletherapyScreen() {
  const { theme } = useTheme();
  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'available'>('available');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [scheduleStep, setScheduleStep] = useState<'date' | 'time' | 'confirm'>('date');
  const [bookedSessions, setBookedSessions] = useState<BookedSession[]>([]);

  const handleSchedule = (therapist: Therapist) => {
    setSelectedTherapist(therapist);
    setShowScheduleModal(true);
    setScheduleStep('date');
  };

  const handleConfirmSchedule = () => {
    if (!selectedTherapist || !selectedTime) return;

    const newSession: BookedSession = {
      id: Date.now().toString(),
      therapist: selectedTherapist,
      date: selectedDate,
      time: selectedTime,
    };

    setBookedSessions((prev) => [...prev, newSession]);
    setShowScheduleModal(false);
    setSelectedTab('upcoming');
    setSelectedTherapist(null);
    setSelectedTime(null);
    setScheduleStep('date');
  };

  const renderDatePicker = () => {
    const dates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      return date;
    });

    return (
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
  };

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
      <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <Animated.View
          entering={FadeInUp.springify()}
          style={[styles.modalContent, { backgroundColor: theme.background }]}
        >
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
              style={styles.modalBackButton}
            >
              {scheduleStep === 'date' ? (
                <X size={24} color={theme.text.primary} />
              ) : (
                <ChevronLeft size={24} color={theme.text.primary} />
              )}
            </TouchableOpacity>
            <View style={styles.stepIndicator}>
              {['date', 'time', 'confirm'].map((step, index) => (
                <View
                  key={step}
                  style={[
                    styles.stepDot,
                    {
                      backgroundColor:
                        scheduleStep === step ? theme.primary : theme.border,
                    },
                  ]}
                />
              ))}
            </View>
            <View style={styles.modalBackButton} />
          </View>

          <ScrollView style={styles.modalScroll}>
            {scheduleStep === 'date' && renderDatePicker()}
            {scheduleStep === 'time' && renderTimePicker()}
            {scheduleStep === 'confirm' && renderConfirmation()}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[
                styles.modalButton,
                {
                  backgroundColor:
                    (scheduleStep === 'date' && selectedDate) ||
                    (scheduleStep === 'time' && selectedTime) ||
                    scheduleStep === 'confirm'
                      ? theme.primary
                      : theme.border,
                },
              ]}
              onPress={() => {
                if (scheduleStep === 'date') {
                  setScheduleStep('time');
                } else if (scheduleStep === 'time') {
                  setScheduleStep('confirm');
                } else {
                  handleConfirmSchedule();
                }
              }}
              disabled={
                (scheduleStep === 'date' && !selectedDate) ||
                (scheduleStep === 'time' && !selectedTime)
              }
            >
              <Text style={[styles.modalButtonText, { color: theme.text.inverse }]}>
                {scheduleStep === 'confirm' ? 'Confirm Booking' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );

  const renderUpcomingSession = (session: BookedSession) => (
    <Animated.View
      entering={FadeInDown.springify()}
      key={session.id}
      style={[styles.sessionCard, { backgroundColor: theme.card }]}
    >
      <Image
        source={{ uri: session.therapist.image }}
        style={styles.sessionTherapistImage}
      />
      <View style={styles.sessionInfo}>
        <Text style={[styles.sessionTherapistName, { color: theme.text.primary }]}>
          {session.therapist.name}
        </Text>
        <Text style={[styles.sessionSpecialty, { color: theme.text.secondary }]}>
          {session.therapist.specialty}
        </Text>
        <View style={styles.sessionDateTime}>
          <Calendar size={16} color={theme.primary} style={styles.sessionIcon} />
          <Text style={[styles.sessionDate, { color: theme.text.primary }]}>
            {session.date.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        <View style={styles.sessionDateTime}>
          <Clock size={16} color={theme.primary} style={styles.sessionIcon} />
          <Text style={[styles.sessionTime, { color: theme.text.primary }]}>
            {session.time}
          </Text>
        </View>
      </View>
      <View style={styles.sessionActions}>
        <TouchableOpacity
          style={[styles.sessionActionButton, { backgroundColor: theme.primary }]}
        >
          <Video size={20} color={theme.text.inverse} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sessionActionButton, { backgroundColor: theme.primary }]}
        >
          <Phone size={20} color={theme.text.inverse} />
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
        <Text style={[styles.specialty, { color: theme.text.secondary }]}>
          {therapist.specialty}
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Star size={16} color={theme.primary} />
            <Text style={[styles.statText, { color: theme.text.secondary }]}>
              {therapist.rating}
            </Text>
          </View>
          <View style={styles.stat}>
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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Teletherapy',
          headerStyle: {
            backgroundColor: theme.card,
          },
          headerTitleStyle: {
            color: theme.text.primary,
            fontFamily: 'Inter-Bold',
          },
        }}
      />

      <View style={styles.tabsContainer}>
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
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {selectedTab === 'available' &&
          therapists.map((therapist, index) =>
            renderTherapistCard(therapist, index)
          )}
        {selectedTab === 'upcoming' && (
          <>
            {bookedSessions.length > 0 ? (
              bookedSessions.map((session) => renderUpcomingSession(session))
            ) : (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: theme.text.secondary }]}>
                  No upcoming sessions scheduled
                </Text>
                <TouchableOpacity
                  style={[styles.scheduleButton, { backgroundColor: theme.primary }]}
                  onPress={() => setSelectedTab('available')}
                >
                  <Text style={[styles.scheduleButtonText, { color: theme.text.inverse }]}>
                    Schedule a Session
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {renderScheduleModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  therapistCard: {
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
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
  therapistImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  therapistInfo: {
    marginBottom: 16,
  },
  therapistName: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  specialty: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    marginLeft: 4,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  nextAvailable: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
  },
  scheduleButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  scheduleButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '70%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalBackButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modalScroll: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  datePickerContainer: {
    padding: 16,
  },
  dateList: {
    paddingVertical: 8,
  },
  dateItem: {
    width: 70,
    height: 80,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 16,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  timeSlot: {
    width: (SCREEN_WIDTH - 64) / 3,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  timeText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  confirmationContainer: {
    padding: 16,
  },
  confirmationCard: {
    borderRadius: 16,
    padding: 16,
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
  confirmationImage: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    marginBottom: 16,
  },
  confirmationDetails: {
    gap: 8,
  },
  confirmationName: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  confirmationSpecialty: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  confirmationDateTime: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  sessionCard: {
    flexDirection: 'row',
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
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
  sessionTherapistImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  sessionInfo: {
    flex: 1,
    marginLeft: 16,
  },
  sessionTherapistName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  sessionSpecialty: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  sessionDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sessionIcon: {
    marginRight: 8,
  },
  sessionDate: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  sessionTime: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  sessionActions: {
    justifyContent: 'center',
    gap: 8,
  },
  sessionActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});