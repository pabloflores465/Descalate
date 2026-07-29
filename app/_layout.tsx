import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View, ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { AuthProvider } from '@/context/AuthContext';
import { SessionProvider } from '@/context/SessionContext';
import { TutorialProvider } from '@/context/TutorialContext';
import { initializeLanguage } from '@/locales/i18n';
import { expoDb } from '@/database/db';
import { runMigrations } from '@/database/migrations';

export default function RootLayout() {
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);
  const [databaseError, setDatabaseError] = useState<Error | null>(null);
  const [initializationAttempt, setInitializationAttempt] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    async function initializeApp() {
      try {
        setDatabaseError(null);
        await initializeLanguage();
        console.log('starting database connection ...');
        await runMigrations(expoDb);
        console.info('database ready');
      } catch (error) {
        console.error('Error initializing app:', error);
        if (isCurrent) {
          setDatabaseError(
            error instanceof Error ? error : new Error('Unknown database initialization error')
          );
        }
        return;
      }

      if (isCurrent) {
        setIsDatabaseReady(true);
      }
    }

    initializeApp();

    return () => {
      isCurrent = false;
    };
  }, [initializationAttempt]);

  const retryInitialization = useCallback(() => {
    setIsDatabaseReady(false);
    setInitializationAttempt((attempt) => attempt + 1);
  }, []);

  if (databaseError) {
    return (
      <View style={styles.databaseState}>
        <Text style={styles.databaseErrorTitle}>No se pudo abrir la base de datos</Text>
        <Text style={styles.databaseErrorText}>
          Tus datos no se modificarán. Intenta iniciar la aplicación otra vez.
        </Text>
        <Pressable style={styles.retryButton} onPress={retryInitialization}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  if (!isDatabaseReady) {
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

const styles = StyleSheet.create({
  databaseState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f8f3',
    paddingHorizontal: 32,
  },
  databaseErrorTitle: {
    color: '#2C3E50',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  databaseErrorText: {
    color: '#566573',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#2d9a6e',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
