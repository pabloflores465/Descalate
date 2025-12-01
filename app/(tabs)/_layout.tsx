import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Pressable, StyleSheet, Animated, Text } from 'react-native';
import { useRef, useEffect } from 'react';
import { CopilotProvider, CopilotStep, walkthroughable, useCopilot } from 'react-native-copilot';
import { useTutorial } from '@/context/TutorialContext';

const WalkthroughableView = walkthroughable(View);

type TabIconProps = {
  name: keyof typeof Ionicons.glyphMap;
  nameOutline: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
  focused: boolean;
};

function AnimatedTabIcon({ name, nameOutline, color, size, focused }: TabIconProps) {
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    if (focused) {
      Animated.parallel([
        Animated.spring(translateYAnim, {
          toValue: -4,
          friction: 5,
          tension: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(translateYAnim, {
          toValue: 0,
          friction: 5,
          tension: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [focused]);

  return (
    <View style={styles.iconContainer}>
      <Animated.View
        style={[
          styles.iconBackground,
          {
            opacity: opacityAnim,
          },
        ]}
      />
      <Animated.View
        style={{
          transform: [{ translateY: translateYAnim }],
        }}
      >
        <Ionicons
          name={focused ? name : nameOutline}
          size={focused ? 28 : size}
          color={color}
        />
      </Animated.View>
    </View>
  );
}

type TabButtonProps = {
  children: React.ReactNode;
  onPress: () => void;
  onLongPress: () => void;
};

function AnimatedTabButton({ children, onPress, onLongPress }: TabButtonProps) {
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(opacityAnim, {
      toValue: 0.7,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabButton}
    >
      <Animated.View style={{ opacity: opacityAnim }}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

function TooltipComponent({
  isFirstStep,
  isLastStep,
  handleNext,
  handlePrev,
  handleStop,
  currentStep
}: {
  isFirstStep: boolean;
  isLastStep: boolean;
  handleNext: () => void;
  handlePrev: () => void;
  handleStop: () => void;
  currentStep?: { text: string; order: number; name: string };
}) {
  if (!currentStep) return null;

  return (
    <View style={styles.tooltipContainer}>
      <Text style={styles.tooltipText}>{currentStep.text}</Text>
      <View style={styles.tooltipButtons}>
        {!isFirstStep && (
          <Pressable onPress={handlePrev} style={styles.tooltipButton}>
            <Ionicons name="chevron-back" size={18} color="#5a8c6a" />
            <Text style={styles.tooltipButtonText}>Anterior</Text>
          </Pressable>
        )}
        {!isLastStep ? (
          <Pressable onPress={handleNext} style={[styles.tooltipButton, styles.tooltipButtonPrimary]}>
            <Text style={styles.tooltipButtonTextPrimary}>Siguiente</Text>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </Pressable>
        ) : (
          <Pressable onPress={handleStop} style={[styles.tooltipButton, styles.tooltipButtonPrimary]}>
            <Text style={styles.tooltipButtonTextPrimary}>Entendido</Text>
            <Ionicons name="checkmark" size={18} color="#fff" />
          </Pressable>
        )}
      </View>
      <Pressable onPress={handleStop} style={styles.skipButton}>
        <Text style={styles.skipButtonText}>Saltar tutorial</Text>
      </Pressable>
    </View>
  );
}

function TabLayoutContent() {
  const { shouldShowTutorial, completeTutorial, isLoading } = useTutorial();
  const { start, copilotEvents } = useCopilot();

  useEffect(() => {
    if (!isLoading && shouldShowTutorial) {
      const timer = setTimeout(() => {
        start();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [shouldShowTutorial, isLoading, start]);

  useEffect(() => {
    const handleStop = () => {
      completeTutorial();
    };
    copilotEvents.on('stop', handleStop);
    return () => {
      copilotEvents.off('stop', handleStop);
    };
  }, [completeTutorial, copilotEvents]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#5a8c6a',
        tabBarInactiveTintColor: '#95A5A6',
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarButton: (props) => (
          <AnimatedTabButton
            onPress={props.onPress ?? (() => {})}
            onLongPress={props.onLongPress ?? (() => {})}
          >
            {props.children}
          </AnimatedTabButton>
        ),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon
              name="home"
              nameOutline="home-outline"
              color={color}
              size={26}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="charts"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon
              name="stats-chart"
              nameOutline="stats-chart-outline"
              color={color}
              size={26}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon
              name="person"
              nameOutline="person-outline"
              color={color}
              size={26}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  return (
    <CopilotProvider
      stepNumberComponent={() => null}
      tooltipComponent={TooltipComponent as unknown as React.ComponentType}
      backdropColor="rgba(0, 0, 0, 0.75)"
      animationDuration={300}
      arrowColor="#fff"
      verticalOffset={0}
    >
      <TabLayoutContent />
    </CopilotProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#f1f8f3',
    borderTopWidth: 0,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBackground: {
    position: 'absolute',
    width: 48,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(90, 140, 106, 0.15)',
  },
  tooltipContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  tooltipText: {
    fontSize: 16,
    color: '#2C3E50',
    lineHeight: 24,
    marginBottom: 16,
  },
  tooltipButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  tooltipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f1f8f3',
    gap: 4,
  },
  tooltipButtonPrimary: {
    backgroundColor: '#5a8c6a',
  },
  tooltipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5a8c6a',
  },
  tooltipButtonTextPrimary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  skipButton: {
    alignSelf: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  skipButtonText: {
    fontSize: 13,
    color: '#95A5A6',
  },
});
