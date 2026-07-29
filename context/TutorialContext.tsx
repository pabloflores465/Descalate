import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import logger from '@/services/logger';
import { getUserProgress, migrateLegacyProgress, setUserProgress } from '@/database/user-progress';
import { useAuth } from './AuthContext';

type TutorialContextType = {
  shouldShowTutorial: boolean;
  completeTutorial: () => Promise<void>;
  resetTutorial: () => Promise<void>;
  isLoading: boolean;
  tutorialTrigger: number;
  requestTutorialStart: () => void;
};

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export function TutorialProvider({ children }: { children: ReactNode }) {
  const { currentUserEmail, isLoading: authLoading } = useAuth();
  const [shouldShowTutorial, setShouldShowTutorial] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tutorialTrigger, setTutorialTrigger] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    const checkTutorialStatus = async () => {
      if (authLoading) {
        return;
      }

      if (!currentUserEmail) {
        setShouldShowTutorial(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        await migrateLegacyProgress(currentUserEmail);
        const progress = await getUserProgress(currentUserEmail);
        if (isCurrent) {
          setShouldShowTutorial(progress ? !progress.tutorialCompleted : false);
        }
      } catch (error) {
        logger.error('Error checking tutorial status', error);
        if (isCurrent) {
          setShouldShowTutorial(false);
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    };

    checkTutorialStatus();

    return () => {
      isCurrent = false;
    };
  }, [authLoading, currentUserEmail]);

  const completeTutorial = useCallback(async () => {
    if (!currentUserEmail) return;

    try {
      await setUserProgress(currentUserEmail, 'tutorial_completed', true);
      setShouldShowTutorial(false);
    } catch (error) {
      logger.error('Error completing tutorial', error);
    }
  }, [currentUserEmail]);

  const resetTutorial = useCallback(async () => {
    if (!currentUserEmail) return;

    try {
      await setUserProgress(currentUserEmail, 'tutorial_completed', false);
      setShouldShowTutorial(true);
    } catch (error) {
      logger.error('Error resetting tutorial', error);
    }
  }, [currentUserEmail]);

  const requestTutorialStart = useCallback(() => {
    if (shouldShowTutorial && !isLoading) {
      setTutorialTrigger((prev) => prev + 1);
    }
  }, [shouldShowTutorial, isLoading]);

  return (
    <TutorialContext.Provider
      value={{
        shouldShowTutorial,
        completeTutorial,
        resetTutorial,
        isLoading,
        tutorialTrigger,
        requestTutorialStart,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}
