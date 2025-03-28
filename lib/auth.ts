import { useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

// Get the redirect URL for the current platform
const redirectUri = makeRedirectUri({
  scheme: 'calmify-wellness',
  path: 'google-auth',
});

// Configure Google OAuth
const googleConfig = {
  clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
};

// Hook for Google authentication
export function useGoogleAuth() {
  const [_, response, promptAsync] = useAuthRequest(
    {
      clientId: Platform.select({
        ios: googleConfig.iosClientId,
        android: googleConfig.androidClientId,
        web: googleConfig.clientId,
        default: googleConfig.clientId,
      })!,
      redirectUri,
      scopes: ['profile', 'email'],
    },
    { authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth' }
  );

  const [isLoading, setIsLoading] = useState(false);

  async function signInWithGoogle() {
    try {
      setIsLoading(true);
      const result = await promptAsync();
      
      if (result?.type === 'success') {
        const { authentication } = result;
        
        // Exchange the Google token for a Supabase session
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: authentication.idToken!,
          access_token: authentication.accessToken,
        });

        if (error) throw error;
        return data;
      }
      
      throw new Error('Google sign in was cancelled or failed');
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    signInWithGoogle,
    isLoading,
  };
}