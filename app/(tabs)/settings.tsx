import {
  View,
  Text,
  StyleSheet,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/utils/ThemeContext';
import { Moon, Sun } from 'lucide-react-native';

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();

  const settingsOptions = [
    {
      title: 'App Theme',
      description: 'Switch between light and dark mode',
      icon: isDark ? Moon : Sun,
      action: 'toggle',
      value: isDark,
    },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text.primary }]}>
          Settings
        </Text>
        <Text style={[styles.subtitle, { color: theme.text.secondary }]}>
          Customize your app experience
        </Text>
      </View>

      <View style={styles.settingsContainer}>
        {settingsOptions.map((option, index) => {
          const Icon = option.icon;
          return (
            <View
              key={option.title}
              style={[
                styles.settingItem,
                { backgroundColor: theme.card },
                index === settingsOptions.length - 1 && styles.lastItem,
              ]}
            >
              <View style={styles.settingContent}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: theme.primary + '15' },
                  ]}
                >
                  <Icon size={20} color={theme.primary} />
                </View>
                <View style={styles.settingText}>
                  <Text
                    style={[styles.settingTitle, { color: theme.text.primary }]}
                  >
                    {option.title}
                  </Text>
                  <Text
                    style={[
                      styles.settingDescription,
                      { color: theme.text.secondary },
                    ]}
                  >
                    {option.description}
                  </Text>
                </View>
              </View>
              <Switch
                value={option.value}
                onValueChange={toggleTheme}
                trackColor={{
                  false: theme.border,
                  true: theme.primary + '70',
                }}
                thumbColor={option.value ? theme.primary : theme.text.secondary}
              />
            </View>
          );
        })}
      </View>
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
  settingsContainer: {
    padding: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
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
  lastItem: {
    marginBottom: 0,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  settingDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
});