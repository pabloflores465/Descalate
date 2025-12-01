import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { SessionProvider } from '@/context/SessionContext';
import { TutorialProvider } from '@/context/TutorialContext';
import '@/locales/i18n';
import { initializeLanguage } from '@/locales/i18n';

export default function RootLayout() {
  useEffect(() => {
    initializeLanguage();
  }, []);

  return (
    <AuthProvider>
      <SessionProvider>
        <TutorialProvider>
          <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' },
            animation: 'none',
          }}
        >
          <Stack.Screen name="(session)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="exercises"
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="tips"
            options={{
              animation: 'slide_from_right',
            }}
          />
        </Stack>
        </TutorialProvider>
      </SessionProvider>
    </AuthProvider>
  );
}
