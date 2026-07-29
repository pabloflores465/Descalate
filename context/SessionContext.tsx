import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import logger from '@/services/logger';
import { expoDb } from '@/database/db';

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
  isLoading: boolean;
  startSession: (anxietyLevel: number) => Promise<void>;
  setSelectedExercises: (exercises: SelectedExercise[]) => Promise<void>;
  setSessionTip: (tip: SessionTip) => Promise<void>;
  endSession: (finalAction: 'new_level' | 'end_session') => Promise<void>;
  clearSession: () => void;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUserEmail, isLoading: authLoading } = useAuth();

  useEffect(() => {
    let isCurrent = true;

    const restoreActiveSession = async () => {
      if (authLoading) return;

      if (!currentUserEmail) {
        setSessionData(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const activeSession = await expoDb.getFirstAsync<{
          anxiety_level: number;
          selected_exercises: string | null;
          tip_id: number | null;
          tip_title: string | null;
          tip_category: string | null;
          start_time: number;
        }>(
          `SELECT active.anxiety_level, active.selected_exercises,
                  active.tip_id, active.tip_title, active.tip_category,
                  active.start_time
           FROM active_sessions active
           INNER JOIN users ON users.id = active.user_id
           WHERE users.email = ?
           LIMIT 1`,
          [currentUserEmail]
        );

        if (!isCurrent) return;

        if (!activeSession) {
          setSessionData(null);
          return;
        }

        let selectedExercises: SelectedExercise[] = [];
        if (activeSession.selected_exercises) {
          try {
            const parsed = JSON.parse(activeSession.selected_exercises);
            if (Array.isArray(parsed)) {
              selectedExercises = parsed;
            }
          } catch (error) {
            logger.error('Could not parse the saved active exercises', error);
          }
        }

        setSessionData({
          anxietyLevel: activeSession.anxiety_level,
          selectedExercises,
          tip:
            activeSession.tip_id !== null &&
            activeSession.tip_title !== null &&
            activeSession.tip_category !== null
              ? {
                  id: activeSession.tip_id,
                  title: activeSession.tip_title,
                  category: activeSession.tip_category,
                }
              : null,
          startTime: activeSession.start_time,
        });
      } catch (error) {
        logger.error('Error restoring active session', error);
        if (isCurrent) {
          setSessionData(null);
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    };

    restoreActiveSession();

    return () => {
      isCurrent = false;
    };
  }, [authLoading, currentUserEmail]);

  const startSession = useCallback(
    async (anxietyLevel: number) => {
      if (!currentUserEmail) {
        throw new Error('Cannot start a session without an authenticated user');
      }

      const user = await expoDb.getFirstAsync<{ id: number }>(
        'SELECT id FROM users WHERE email = ? LIMIT 1',
        [currentUserEmail]
      );
      if (!user) {
        throw new Error('Cannot start a session: authenticated user does not exist');
      }

      const newSession: SessionData = {
        anxietyLevel,
        selectedExercises: [],
        tip: null,
        startTime: Date.now(),
      };

      await expoDb.runAsync(
        `INSERT INTO active_sessions (
         user_id, anxiety_level, selected_exercises,
         tip_id, tip_title, tip_category, start_time, updated_at
       ) VALUES (?, ?, ?, NULL, NULL, NULL, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id) DO UPDATE SET
         anxiety_level = excluded.anxiety_level,
         selected_exercises = excluded.selected_exercises,
         tip_id = NULL,
         tip_title = NULL,
         tip_category = NULL,
         start_time = excluded.start_time,
         updated_at = CURRENT_TIMESTAMP`,
        [user.id, anxietyLevel, JSON.stringify([]), newSession.startTime]
      );

      setSessionData(newSession);
    },
    [currentUserEmail]
  );

  const setSelectedExercises = useCallback(
    async (exercises: SelectedExercise[]) => {
      if (!currentUserEmail) {
        throw new Error('Cannot save exercises without an active session');
      }

      const result = await expoDb.runAsync(
        `UPDATE active_sessions
       SET selected_exercises = ?, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = (SELECT id FROM users WHERE email = ?)`,
        [JSON.stringify(exercises), currentUserEmail]
      );
      if (result.changes !== 1) {
        throw new Error('Could not persist exercises for the active session');
      }

      setSessionData((currentSession) =>
        currentSession ? { ...currentSession, selectedExercises: exercises } : currentSession
      );
    },
    [currentUserEmail]
  );

  const setSessionTip = useCallback(
    async (tip: SessionTip) => {
      if (!currentUserEmail) {
        throw new Error('Cannot save a tip without an active session');
      }

      const result = await expoDb.runAsync(
        `UPDATE active_sessions
       SET tip_id = ?, tip_title = ?, tip_category = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = (SELECT id FROM users WHERE email = ?)`,
        [tip.id, tip.title, tip.category, currentUserEmail]
      );
      if (result.changes !== 1) {
        throw new Error('Could not persist the tip for the active session');
      }

      setSessionData((currentSession) =>
        currentSession ? { ...currentSession, tip } : currentSession
      );
    },
    [currentUserEmail]
  );

  const endSession = useCallback(
    async (finalAction: 'new_level' | 'end_session') => {
      if (!sessionData || !currentUserEmail) {
        throw new Error('Cannot finish a session that is not active');
      }

      const user = await expoDb.getFirstAsync<{ id: number }>(
        'SELECT id FROM users WHERE email = ?',
        [currentUserEmail]
      );

      if (!user) {
        throw new Error('User not found for session save');
      }

      const durationSeconds = Math.floor((Date.now() - sessionData.startTime) / 1000);
      const completedAt = new Date().toISOString();

      try {
        await expoDb.withExclusiveTransactionAsync(async (transaction) => {
          const activeSession = await transaction.getFirstAsync<{ user_id: number }>(
            'SELECT user_id FROM active_sessions WHERE user_id = ? LIMIT 1',
            [user.id]
          );
          if (!activeSession) {
            throw new Error('This session was already completed');
          }

          await transaction.runAsync(
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

          await transaction.runAsync(
            `INSERT INTO anxiety_logs (user_id, anxiety_level, notes) VALUES (?, ?, ?)`,
            [
              user.id,
              sessionData.anxietyLevel,
              `Session: ${sessionData.selectedExercises.length} exercises, tip: ${sessionData.tip?.title || 'none'}`,
            ]
          );

          const deletion = await transaction.runAsync(
            'DELETE FROM active_sessions WHERE user_id = ?',
            [user.id]
          );
          if (deletion.changes !== 1) {
            throw new Error('Could not close the active session');
          }
        });

        setSessionData(null);
        logger.info('Session saved successfully');
      } catch (error) {
        logger.error('Error saving session', error);
        throw error;
      }
    },
    [sessionData, currentUserEmail]
  );

  const clearSession = useCallback(() => {
    setSessionData(null);
  }, []);

  return (
    <SessionContext.Provider
      value={{
        sessionData,
        isLoading,
        startSession,
        setSelectedExercises,
        setSessionTip,
        endSession,
        clearSession,
      }}
    >
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
