import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TUTORIAL_COMPLETE_KEY = '@descalate_tutorial_complete';

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
      const completed = await AsyncStorage.getItem(TUTORIAL_COMPLETE_KEY);
      setShouldShowTutorial(completed !== 'true');
    } catch (error) {
      console.error('Error checking tutorial status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completeTutorial = async () => {
    try {
      await AsyncStorage.setItem(TUTORIAL_COMPLETE_KEY, 'true');
      setShouldShowTutorial(false);
    } catch (error) {
      console.error('Error completing tutorial:', error);
    }
  };

  const resetTutorial = async () => {
    try {
      await AsyncStorage.removeItem(TUTORIAL_COMPLETE_KEY);
      setShouldShowTutorial(true);
    } catch (error) {
      console.error('Error resetting tutorial:', error);
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
