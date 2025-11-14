import { useEffect, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { GOOGLE_CONFIG } from '../constants/google-config';

// Completa el flujo de autenticación del navegador
WebBrowser.maybeCompleteAuthSession();

export interface GoogleUser {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

export function useGoogleAuth() {
  const [userInfo, setUserInfo] = useState<GoogleUser | null>(null);
  const [loading, setLoading] = useState(false);

  // Usar la configuración más simple que funciona con Expo Go
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_CONFIG.webClientId,
    iosClientId: GOOGLE_CONFIG.iosClientId,
    androidClientId: GOOGLE_CONFIG.androidClientId,
  });

  useEffect(() => {
    if (request) {
      console.log('🔗 Request ready. Redirect URI:', request?.redirectUri);
      console.log('🔑 Using Web Client ID for Expo Go');
    }
  }, [request]);

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        fetchUserInfo(authentication.accessToken);
      }
    } else if (response?.type === 'error') {
      console.error('❌ Auth Error:', response.error);
    }
  }, [response]);

  const fetchUserInfo = async (token: string) => {
    setLoading(true);
    try {
      const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      const user = await response.json();
      setUserInfo(user);
      console.log('✅ Google User Info:', user);
      console.log('📧 Email:', user.email);
      console.log('👤 Name:', user.name);
    } catch (error) {
      console.error('❌ Error fetching user info:', error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setUserInfo(null);
    console.log('👋 User signed out');
  };

  return {
    promptAsync,
    userInfo,
    loading,
    request,
    signOut,
  };
}
