import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '@/services/logger';
import { STORAGE_KEYS } from '@/constants/storage-keys';

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
  const [shouldShowTutorial, setShouldShowTutorial] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tutorialTrigger, setTutorialTrigger] = useState(0);

  useEffect(() => {
    checkTutorialStatus();
  }, []);

  const checkTutorialStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem(STORAGE_KEYS.TUTORIAL_COMPLETE);
      setShouldShowTutorial(completed !== 'true');
    } catch (error) {
      logger.error('Error checking tutorial status', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completeTutorial = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TUTORIAL_COMPLETE, 'true');
      setShouldShowTutorial(false);
    } catch (error) {
      logger.error('Error completing tutorial', error);
    }
  };

  const resetTutorial = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.TUTORIAL_COMPLETE);
      setShouldShowTutorial(true);
    } catch (error) {
      logger.error('Error resetting tutorial', error);
    }
  };

  const requestTutorialStart = useCallback(() => {
    if (shouldShowTutorial && !isLoading) {
      setTutorialTrigger(prev => prev + 1);
    }
  }, [shouldShowTutorial, isLoading]);

  return (
    <TutorialContext.Provider
      value={{ shouldShowTutorial, completeTutorial, resetTutorial, isLoading, tutorialTrigger, requestTutorialStart }}
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
