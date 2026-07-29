import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { getUserProgress, migrateLegacyProgress } from '@/database/user-progress';
import { useSession } from '@/context/SessionContext';

export default function Index() {
  const { currentUserEmail, isLoading: authLoading } = useAuth();
  const { sessionData, isLoading: sessionLoading } = useSession();
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [nextRoute, setNextRoute] = useState<
    '/(session)/auth' | '/(session)/onboarding' | '/(session)/complete-profile' | '/(tabs)/home'
  >('/(session)/auth');

  useEffect(() => {
    let isCurrent = true;

    const checkUserStatus = async () => {
      if (authLoading) return;

      setCheckingStatus(true);
      try {
        if (!currentUserEmail) {
          if (isCurrent) setNextRoute('/(session)/auth');
          return;
        }

        await migrateLegacyProgress(currentUserEmail);
        const progress = await getUserProgress(currentUserEmail);

        if (!progress) {
          if (isCurrent) setNextRoute('/(session)/auth');
        } else if (!progress.onboardingCompleted) {
          if (isCurrent) setNextRoute('/(session)/onboarding');
        } else if (!progress.profileCompleted) {
          if (isCurrent) setNextRoute('/(session)/complete-profile');
        } else if (isCurrent) {
          setNextRoute('/(tabs)/home');
        }
      } catch (error) {
        console.error('Error checking user progress:', error);
        if (isCurrent) setNextRoute('/(session)/auth');
      } finally {
        if (isCurrent) setCheckingStatus(false);
      }
    };

    checkUserStatus();

    return () => {
      isCurrent = false;
    };
  }, [authLoading, currentUserEmail]);

  if (authLoading || sessionLoading || checkingStatus) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f1f8f3',
        }}
      >
        <ActivityIndicator size="large" color="#2d9a6e" />
      </View>
    );
  }

  if (nextRoute === '/(tabs)/home' && sessionData) {
    const pathname = sessionData.selectedExercises.length > 0 ? '/tips' : '/exercises';
    return (
      <Redirect
        href={{
          pathname,
          params: { level: sessionData.anxietyLevel },
        }}
      />
    );
  }

  return <Redirect href={nextRoute} />;
}
