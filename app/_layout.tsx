import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider } from '@/context/AuthContext';
import { SessionProvider } from '@/context/SessionContext';
import { TutorialProvider } from '@/context/TutorialContext';
import { initializeLanguage } from '@/locales/i18n';
import { expoDb } from '@/database/db';
import { runMigrations } from '@/database/migrations';

export default function RootLayout() {
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);

  useEffect(() => {
    async function initializeApp() {
      try {
        await initializeLanguage();
        console.log('starting database connection ...');
        await runMigrations(expoDb);
        console.info('database ready');
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsDatabaseReady(true);
      }
    }

    initializeApp();
  }, []);

  if (!isDatabaseReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f8f3' }}>
        <ActivityIndicator size="large" color="#2d9a6e" />
      </View>
    );
  }

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
