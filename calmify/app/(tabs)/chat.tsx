import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  Dimensions,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useTheme } from '@/utils/ThemeContext';
import { Stack } from 'expo-router';
import { SendHorizontal, Bot } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const BOTTOM_TAB_HEIGHT = 49;
const KEYBOARD_OFFSET = Platform.OS === 'ios' ? 110 : -BOTTOM_TAB_HEIGHT;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const welcomeMessages = [
  "Hello! I'm your mental health companion. How are you feeling today?",
  "I'm here to listen and support you. What's on your mind?",
  "Welcome! I'm your safe space to share thoughts and feelings. How are you doing?",
  "Hi there! I'm here to chat about whatever's important to you. How's your day going?",
];

export default function ChatScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      'keyboardWillShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      },
    );

    const keyboardWillHide = Keyboard.addListener(
      'keyboardWillHide',
      () => {
        setKeyboardHeight(0);
      },
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  useEffect(() => {
    const randomWelcome = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
    setMessages([
      {
        id: 1,
        text: randomWelcome,
        isBot: true,
        timestamp: new Date(),
      },
    ]);
  }, []);

  const botResponses = [
    "I understand how you're feeling. Would you like to talk more about it?",
    "That sounds challenging. How long have you been feeling this way?",
    "Thank you for sharing. What do you think triggered these feelings?",
    "I'm here to support you. What would help you feel better right now?",
    "Your feelings are valid. Would you like to explore some coping strategies together?",
  ];

  const sendMessage = useCallback(async () => {
    if (!inputText.trim()) return;
  
    const newMessage: Message = {
      id: Date.now(),
      text: inputText.trim(),
      isBot: false,
      timestamp: new Date(),
    };
  
    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
    setIsLoading(true);
  
    try {
      const response = await fetch("http://192.168.204.181:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage.text }),
      });
  
      const data = await response.json();
      const botMessage: Message = {
        id: Date.now() + 1,
        text: data.response || "Sorry, I couldn't process that.",
        isBot: true,
        timestamp: new Date(),
      };
  
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error fetching chatbot response:", error);
    }
  
    setIsLoading(false);
  }, [inputText]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const bottomOffset =
    keyboardHeight > 0 ? keyboardHeight - insets.bottom : BOTTOM_TAB_HEIGHT;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Mental Health Assistant',
          headerStyle: {
            backgroundColor: theme.card,
          } as any,
          headerTitleStyle: {
            color: theme.text.primary,
            fontFamily: 'Inter-Bold',
          },
          headerLeft: () => (
            <Bot size={24} color={theme.primary} style={{ marginLeft: 16 }} />
          ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        keyboardVerticalOffset={KEYBOARD_OFFSET}
      >
        <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={[
              styles.messagesContent,
              { paddingBottom: Math.max(bottomOffset, 16) },
            ]}
            onContentSizeChange={() =>
              scrollViewRef.current?.scrollToEnd({ animated: true })
            }
            showsVerticalScrollIndicator={false}
          >
            {messages.map((message, index) => (
              <Animated.View
                key={message.id}
                entering={FadeInUp.delay(index * 100).springify()}
                style={[
                  styles.messageBubble,
                  message.isBot
                    ? [styles.botBubble, { backgroundColor: theme.card }]
                    : [styles.userBubble, { backgroundColor: theme.primary }],
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    {
                      color: message.isBot
                        ? theme.text.primary
                        : theme.text.inverse,
                    },
                  ]}
                >
                  {message.text}
                </Text>
                <Text
                  style={[
                    styles.timeText,
                    {
                      color: message.isBot
                        ? theme.text.secondary
                        : theme.text.inverse,
                    },
                  ]}
                >
                  {formatTime(message.timestamp)}
                </Text>
              </Animated.View>
            ))}
            {isLoading && (
              <Animated.View
                entering={FadeInDown}
                style={[
                  styles.loadingContainer,
                  { backgroundColor: theme.card },
                ]}
              >
                <ActivityIndicator color={theme.primary} />
              </Animated.View>
            )}
          </ScrollView>
          <View
            style={[
              styles.inputContainer,
              { 
                backgroundColor: theme.card, 
                borderTopColor: theme.border,
                paddingBottom: Platform.OS === 'ios' ? 24 : 4,
                paddingTop: 8,
                paddingHorizontal: 16,
                marginBottom: Platform.OS === 'android' ? BOTTOM_TAB_HEIGHT : 0
              },
            ]}
          >
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.background,
                  color: theme.text.primary,
                },
              ]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={theme.text.secondary}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: theme.primary }]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              <SendHorizontal
                size={24}
                color={theme.text.inverse}
                style={{ transform: [{ rotate: '0deg' }] }}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  botBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Inter-Regular',
  },
  timeText: {
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end',
    fontFamily: 'Inter-Regular',
  },
  loadingContainer: {
    alignSelf: 'flex-start',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
}); 