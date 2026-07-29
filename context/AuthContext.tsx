import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '@/services/logger';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import { expoDb } from '@/database/db';

type AuthContextType = {
  currentUserEmail: string | null;
  setCurrentUserEmail: (email: string | null) => Promise<void>;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUserEmail, setCurrentUserEmailState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredEmail();
  }, []);

  const loadStoredEmail = async () => {
    try {
      const storedEmail = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_EMAIL);
      logger.debug('AuthContext: Loaded stored email', { email: storedEmail });
      if (storedEmail) {
        const user = await expoDb.getFirstAsync<{ email: string }>(
          'SELECT email FROM users WHERE email = ? LIMIT 1',
          [storedEmail]
        );

        if (user) {
          setCurrentUserEmailState(user.email);
        } else {
          // AsyncStorage can survive a failed/destructive database migration.
          // Never restore a session whose user row no longer exists.
          await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_EMAIL);
          logger.warn('AuthContext: Removed stale session without a database user');
        }
      }
    } catch (error) {
      logger.error('Error loading stored email', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setCurrentUserEmail = async (email: string | null) => {
    try {
      logger.debug('AuthContext: Setting email', { email });
      if (email) {
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_EMAIL, email);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_EMAIL);
      }
      setCurrentUserEmailState(email);
      logger.debug('AuthContext: Email state updated');
    } catch (error) {
      logger.error('Error storing email', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ currentUserEmail, setCurrentUserEmail, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
