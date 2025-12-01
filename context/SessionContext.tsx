import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import * as SQLite from 'expo-sqlite';
import { useAuth } from './AuthContext';

type SelectedExercise = {
  id: number;
  title: string;
  duration: string;
  translationKey?: string;
  level?: number;
};

type SessionTip = {
  id: number;
  title: string;
  category: string;
};

type SessionData = {
  anxietyLevel: number;
  selectedExercises: SelectedExercise[];
  tip: SessionTip | null;
  startTime: number;
};

type SessionContextType = {
  sessionData: SessionData | null;
  startSession: (anxietyLevel: number) => void;
  setSelectedExercises: (exercises: SelectedExercise[]) => void;
  setSessionTip: (tip: SessionTip) => void;
  endSession: (finalAction: 'new_level' | 'end_session') => Promise<void>;
  clearSession: () => void;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const { currentUserEmail } = useAuth();

  const startSession = useCallback((anxietyLevel: number) => {
    setSessionData({
      anxietyLevel,
      selectedExercises: [],
      tip: null,
      startTime: Date.now(),
    });
  }, []);

  const setSelectedExercises = useCallback((exercises: SelectedExercise[]) => {
    setSessionData(prev => {
      if (!prev) return prev;
      return { ...prev, selectedExercises: exercises };
    });
  }, []);

  const setSessionTip = useCallback((tip: SessionTip) => {
    setSessionData(prev => {
      if (!prev) return prev;
      return { ...prev, tip };
    });
  }, []);

  const endSession = useCallback(async (finalAction: 'new_level' | 'end_session') => {
    if (!sessionData || !currentUserEmail) return;

    try {
      const db = await SQLite.openDatabaseAsync('descalate.db');

      const user = await db.getFirstAsync<{ id: number }>(
        'SELECT id FROM users WHERE email = ?',
        [currentUserEmail]
      );

      if (!user) {
        console.error('User not found');
        return;
      }

      const durationSeconds = Math.floor((Date.now() - sessionData.startTime) / 1000);
      const completedAt = new Date().toISOString();

      await db.runAsync(
        `INSERT INTO sessions (
          user_id, anxiety_level, selected_exercises,
          tip_id, tip_title, tip_category,
          final_action, duration_seconds, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          sessionData.anxietyLevel,
          JSON.stringify(sessionData.selectedExercises),
          sessionData.tip?.id ?? null,
          sessionData.tip?.title ?? null,
          sessionData.tip?.category ?? null,
          finalAction,
          durationSeconds,
          completedAt,
        ]
      );

      await db.runAsync(
        `INSERT INTO anxiety_logs (user_id, anxiety_level, notes) VALUES (?, ?, ?)`,
        [
          user.id,
          sessionData.anxietyLevel,
          `Session: ${sessionData.selectedExercises.length} exercises, tip: ${sessionData.tip?.title || 'none'}`,
        ]
      );

      console.log('Session saved successfully');
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }, [sessionData, currentUserEmail]);

  const clearSession = useCallback(() => {
    setSessionData(null);
  }, []);

  return (
    <SessionContext.Provider value={{
      sessionData,
      startSession,
      setSelectedExercises,
      setSessionTip,
      endSession,
      clearSession,
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
