import { useCallback, useEffect, useState } from 'react';
import {
  GoogleOneTapSignIn,
  isCancelledResponse,
  isNoSavedCredentialFoundResponse,
  isSuccessResponse,
} from 'react-native-nitro-google-signin';
import { GOOGLE_CONFIG } from '../constants/google-config';

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
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    GoogleOneTapSignIn.configure({
      webClientId: GOOGLE_CONFIG.webClientId,
      iosClientId: GOOGLE_CONFIG.iosClientId,
      autoSelectOnSignIn: false,
    });
    setIsConfigured(true);
  }, []);

  const promptAsync = useCallback(async () => {
    if (!isConfigured) {
      throw new Error('Google Sign-In is not configured yet');
    }

    setLoading(true);
    try {
      await GoogleOneTapSignIn.checkPlayServices(true);

      let response = await GoogleOneTapSignIn.signIn();

      if (isNoSavedCredentialFoundResponse(response)) {
        response = await GoogleOneTapSignIn.createAccount();
      }

      if (isNoSavedCredentialFoundResponse(response)) {
        response = await GoogleOneTapSignIn.presentExplicitSignIn();
      }

      if (isCancelledResponse(response)) {
        return;
      }

      if (!isSuccessResponse(response)) {
        throw new Error('Google Sign-In did not return a user');
      }

      const { user } = response.data;
      if (!user.email) {
        throw new Error('Google account did not provide an email address');
      }

      setUserInfo({
        id: user.id,
        email: user.email,
        verified_email: true,
        name: user.name ?? user.email,
        given_name: user.givenName ?? '',
        family_name: user.familyName ?? '',
        picture: user.photo ?? '',
        locale: '',
      });
    } finally {
      setLoading(false);
    }
  }, [isConfigured]);

  const signOut = useCallback(async () => {
    setUserInfo(null);
    try {
      await GoogleOneTapSignIn.signOut();
    } catch (error) {
      console.error('Google Sign-Out error:', error);
    }
  }, []);

  return {
    promptAsync,
    userInfo,
    loading,
    request: isConfigured,
    signOut,
  };
}
