import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Ionicons } from '@expo/vector-icons';
import { Link, Tabs } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  const getHeaderTitle = (title: string) => (
    <Text style={[
      styles.headerTitle,
      { color: colorScheme === 'dark' ? '#4A90E2' : '#007AFF' }
    ]}>{title}</Text>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colorScheme === 'dark' ? '#4A90E2' : '#007AFF',
        tabBarInactiveTintColor: colorScheme === 'dark' ? '#E0E0E0' : '#666666',
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
          borderTopColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        },
        headerStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
        },
        headerTintColor: colorScheme === 'dark' ? '#4A90E2' : '#007AFF',
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '',
          headerTitle: () => getHeaderTitle('Calmify'),
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable>
                {({ pressed }) => (
                  <Ionicons
                    name="settings-outline"
                    size={28}
                    color={colorScheme === 'dark' ? '#E0E0E0' : '#007AFF'}
                    style={{ 
                      marginRight: 15, 
                      opacity: pressed ? 0.5 : 1,
                      transform: [{ rotate: pressed ? '30deg' : '0deg' }],
                    }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Emotion',
          headerTitle: () => getHeaderTitle('Emotion'),
          tabBarIcon: ({ color }) => <TabBarIcon name="camera" color={color} />,
          headerStyle: {
            backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
          },
          headerTintColor: colorScheme === 'dark' ? '#E0E0E0' : '#007AFF',
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          headerTitle: () => getHeaderTitle('Chat'),
          tabBarIcon: ({ color }) => <TabBarIcon name="comments" color={color} />,
          headerStyle: {
            backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
          },
          headerTintColor: colorScheme === 'dark' ? '#E0E0E0' : '#007AFF',
        }}
      />
      <Tabs.Screen
        name="session"
        options={{
          title: 'Session',
          headerTitle: () => getHeaderTitle('Session'),
          tabBarIcon: ({ color }) => <TabBarIcon name="clock-o" color={color} />,
          headerStyle: {
            backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
          },
          headerTintColor: colorScheme === 'dark' ? '#E0E0E0' : '#007AFF',
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appointments',
          headerTitle: () => getHeaderTitle('Appointments'),
          tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} />,
          headerStyle: {
            backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
          },
          headerTintColor: colorScheme === 'dark' ? '#E0E0E0' : '#007AFF',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    letterSpacing: 1,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
  },
});
