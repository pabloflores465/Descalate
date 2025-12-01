import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@descalate_onboarding_complete';
const PROFILE_COMPLETE_KEY = '@descalate_profile_complete';

export default function Index() {
  const { currentUserEmail, isLoading: authLoading } = useAuth();
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, [currentUserEmail]);

  const checkOnboardingStatus = async () => {
    if (!currentUserEmail) {
      setCheckingStatus(false);
      return;
    }

    try {
      const [onboarding, profile] = await Promise.all([
        AsyncStorage.getItem(ONBOARDING_KEY),
        AsyncStorage.getItem(PROFILE_COMPLETE_KEY),
      ]);

      setOnboardingComplete(onboarding === 'true');
      setProfileComplete(profile === 'true');
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  if (authLoading || checkingStatus) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f8f3' }}>
        <ActivityIndicator size="large" color="#5a8c6a" />
      </View>
    );
  }

  if (!currentUserEmail) {
    return <Redirect href="/(session)/auth" />;
  }

  if (!onboardingComplete) {
    return <Redirect href="/(session)/onboarding" />;
  }

  if (!profileComplete) {
    return <Redirect href="/(session)/complete-profile" />;
  }

  return <Redirect href="/(tabs)/home" />;
}
