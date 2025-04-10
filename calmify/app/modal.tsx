import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Switch, Pressable } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useThemeContext } from '@/components/ThemeProvider';

export default function ModalScreen() {
  const { colorScheme, toggleTheme } = useThemeContext();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Link href="../" asChild>
          <Pressable>
            {({ pressed }) => (
              <Ionicons
                name="close-outline"
                size={28}
                style={{ opacity: pressed ? 0.5 : 1 }}
              />
            )}
          </Pressable>
        </Link>
      </View>

      <View style={styles.settingSection}>
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons
              name={isDark ? "moon-outline" : "sunny-outline"}
              size={24}
              style={styles.settingIcon}
            />
            <Text style={styles.settingText}>Dark Mode</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ 
              false: Platform.OS === 'ios' ? '#e9e9ea' : '#767577',
              true: '#007AFF'
            }}
            thumbColor={Platform.OS === 'ios' ? '#ffffff' : isDark ? '#ffffff' : '#f4f3f4'}
            ios_backgroundColor="#e9e9ea"
          />
        </View>
      </View>

      <StatusBar style={isDark ? 'light' : 'dark'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  settingSection: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    fontSize: 16,
  },
});
