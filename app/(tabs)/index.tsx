import { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LogOut, Bell, User, MessageCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useTheme } from '@/utils/ThemeContext';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const [showProfile, setShowProfile] = useState(false);
  const { theme, isDark } = useTheme();
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name);
      } else {
        // Fallback to email if name is not available
        setUserName(user?.email?.split('@')[0] || 'User');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Profile Section */}
      <Animated.View
        entering={FadeInDown.duration(1000).springify()}
        style={[styles.profileSection, { backgroundColor: theme.card }]}
      >
        <View style={styles.profileInfo}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2080&auto=format&fit=crop',
            }}
            style={styles.profileImage}
          />
          <View style={styles.greetingContainer}>
            <Text style={[styles.greeting, { color: theme.text.secondary }]}>
              {greeting}
            </Text>
            <Animated.Text
              entering={FadeInRight.duration(1000).springify()}
              style={[styles.name, { color: theme.text.primary }]}
            >
              {loading ? 'Loading...' : userName}
            </Animated.Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.iconButton,
              { backgroundColor: isDark ? '#2d2d2d' : '#f1f3f5' },
            ]}
          >
            <Bell size={20} color={theme.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.iconButton,
              { backgroundColor: isDark ? '#2d2d2d' : '#f1f3f5' },
            ]}
            onPress={() => setShowProfile(true)}
          >
            <User size={20} color={theme.text.primary} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Main Content */}
      <Animated.View
        entering={FadeInRight.duration(1000).springify()}
        style={styles.mainContent}
      >
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.cardTitle, { color: theme.text.primary }]}>
            Today's Focus
          </Text>
          <Text style={[styles.cardText, { color: theme.text.secondary }]}>
            Start your day with mindfulness and intention
          </Text>
        </View>
      </Animated.View>

      {/* Profile Modal */}
      <Modal
        visible={showProfile}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProfile(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text.primary }]}>
                Profile
              </Text>
              <TouchableOpacity
                onPress={() => setShowProfile(false)}
                style={styles.closeButton}
              >
                <Text
                  style={[
                    styles.closeButtonText,
                    { color: theme.text.primary },
                  ]}
                >
                  ×
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.logoutButton,
                { backgroundColor: isDark ? '#2d2d2d' : '#f1f3f5' },
              ]}
              onPress={handleLogout}
            >
              <LogOut
                size={20}
                color={theme.primary}
                style={styles.logoutIcon}
              />
              <Text style={[styles.logoutText, { color: theme.primary }]}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  greetingContainer: {
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 14,
    marginBottom: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
    padding: 20,
  },
  card: {
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 10,
  },
  cardText: {
    fontSize: 16,
    lineHeight: 24,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    minHeight: 200,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: 20,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
