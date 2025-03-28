import { useEffect, useState } from 'react';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAuth } from '@/hooks/useAuth';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { ThemeProvider, useTheme } from '@/utils/ThemeContext';
import { MessageCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

function ChatButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();
  const { session } = useAuth();

  // Don't show the button if we're on the chat screen
  if (pathname === '/chat' || !session) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(500).springify()}
      exiting={FadeOut.duration(300)}
      style={styles.chatButtonContainer}
    >
      <TouchableOpacity
        style={[styles.chatButton, { backgroundColor: theme.primary }]}
        onPress={() => router.push('/chat')}
      >
        <MessageCircle size={24} color={theme.text.inverse} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function RootLayout() {
  useFrameworkReady();
  const { session, loading } = useAuth();
  const [isNavigatorReady, setIsNavigatorReady] = useState(false);

  useEffect(() => {
    setIsNavigatorReady(true);
  }, []);

  if (loading || !isNavigatorReady) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name={session ? '(tabs)' : '(auth)'}
          options={{ headerShown: false }}
        />
        <StatusBar style="auto" />
      </Stack>
      <ChatButton />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  chatButtonContainer: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'ios' ? 100 : 80,
    zIndex: 1000,
  },
  chatButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
        elevation: 5,
      },
    }),
  },
});
