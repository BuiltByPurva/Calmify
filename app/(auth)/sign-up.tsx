import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Image, useColorScheme, Dimensions } from 'react-native';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, User, UserPlus } from 'lucide-react-native';
import { useGoogleAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const GoogleIcon = () => (
  <View style={styles.googleIconContainer}>
    <Image
      source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
      style={styles.googleIcon}
    />
  </View>
);

export default function SignUp() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signInWithGoogle, isLoading: isGoogleLoading } = useGoogleAuth();

  async function handleGoogleSignUp() {
    try {
      setError(null);
      const { session } = await signInWithGoogle();
      if (session) {
        router.replace('/(tabs)');
      }
    } catch (error) {
      setError('Failed to sign up with Google');
    }
  }

  async function handleSignUp() {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) throw error;

      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#ffffff' }]}>
      <LinearGradient
        colors={isDark ? ['#1a1a1a', '#2d2d2d'] : ['#f7f7f7', '#ffffff']}
        style={styles.gradientBackground}
      />
      
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2940&auto=format&fit=crop' }}
        style={[styles.backgroundImage, { opacity: isDark ? 0.1 : 0.05 }]}
      />

      <Animated.View 
        entering={FadeInUp.duration(1000).springify()}
        style={styles.header}
      >
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1616198814651-e71f960c3180?q=80&w=987&auto=format&fit=crop' }}
          style={styles.logo}
        />
      </Animated.View>
      
      <Animated.View 
        entering={FadeInDown.duration(1000).springify()}
        style={styles.formContainer}
      >
        <View style={styles.welcomeSection}>
          <Text style={[styles.title, { color: isDark ? '#ffffff' : '#000000' }]}>
            Create Account
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? '#A0A0A0' : '#666666' }]}>
            Start your wellness journey today
          </Text>
        </View>

        <View style={styles.form}>
          <View style={[styles.inputContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}>
            <User size={20} color={isDark ? '#A0A0A0' : '#666666'} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: isDark ? '#ffffff' : '#000000' }]}
              placeholder="Full Name"
              placeholderTextColor={isDark ? '#A0A0A0' : '#666666'}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}>
            <Mail size={20} color={isDark ? '#A0A0A0' : '#666666'} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: isDark ? '#ffffff' : '#000000' }]}
              placeholder="Email"
              placeholderTextColor={isDark ? '#A0A0A0' : '#666666'}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}>
            <Lock size={20} color={isDark ? '#A0A0A0' : '#666666'} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: isDark ? '#ffffff' : '#000000' }]}
              placeholder="Password"
              placeholderTextColor={isDark ? '#A0A0A0' : '#666666'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {error && (
            <Animated.Text 
              entering={FadeInDown.duration(400)}
              style={styles.error}
            >
              {error}
            </Animated.Text>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              loading && styles.buttonDisabled,
              { backgroundColor: isDark ? '#008080' : '#20B2AA' }
            ]}
            onPress={handleSignUp}
            disabled={loading}
          >
            <UserPlus size={20} color="#ffffff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
            <Text style={[styles.dividerText, { color: isDark ? '#A0A0A0' : '#666666' }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
          </View>

          <TouchableOpacity
            style={[
              styles.googleButton,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' },
              isGoogleLoading && styles.buttonDisabled
            ]}
            onPress={handleGoogleSignUp}
            disabled={isGoogleLoading}
          >
            <GoogleIcon />
            <Text style={[styles.googleButtonText, { color: isDark ? '#ffffff' : '#000000' }]}>
              {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>

          <Link href="/sign-in" asChild>
            <TouchableOpacity style={styles.linkContainer}>
              <Text style={[styles.linkText, { color: isDark ? '#A0A0A0' : '#666666' }]}>
                Already have an account? <Text style={[styles.linkTextBold, { color: isDark ? '#20B2AA' : '#008080' }]}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  formContainer: {
    flex: 1,
    padding: 24,
    maxWidth: Math.min(width * 0.9, 400),
    width: '100%',
    alignSelf: 'center',
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  button: {
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#ff4444',
    textAlign: 'center',
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    height: 56,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  googleIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  googleIcon: {
    width: 18,
    height: 18,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  linkText: {
    fontSize: 14,
  },
  linkTextBold: {
    fontWeight: '600',
  },
});