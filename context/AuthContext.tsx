import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_STORAGE_KEY = '@descalate_current_user_email';

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
      const storedEmail = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (storedEmail) {
        setCurrentUserEmailState(storedEmail);
      }
    } catch (error) {
      console.error('Error loading stored email:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setCurrentUserEmail = async (email: string | null) => {
    try {
      if (email) {
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, email);
      } else {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      }
      setCurrentUserEmailState(email);
    } catch (error) {
      console.error('Error storing email:', error);
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
