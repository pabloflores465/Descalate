import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Pressable, StyleSheet, Animated, Text } from 'react-native';
import { useRef, useEffect, useMemo } from 'react';
import { BlurView } from 'expo-blur';
import {
  SpotlightTourProvider,
  TourStep,
  AttachStep,
} from 'react-native-spotlight-tour';
import { useTutorial } from '@/context/TutorialContext';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';

type TabIconProps = {
  name: keyof typeof Ionicons.glyphMap;
  nameOutline: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
  focused: boolean;
};

type TabButtonProps = {
  children: React.ReactNode;
  onPress: () => void;
  onLongPress: () => void;
};

function AnimatedTabIcon({ name, nameOutline, color, size, focused }: TabIconProps) {
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const bgAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(translateYAnim, {
      toValue: focused ? -2 : 0,
      friction: 5,
      tension: 200,
      useNativeDriver: true,
    }).start();
    Animated.timing(bgAnim, {
      toValue: focused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [focused]);

  const backgroundColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', 'rgba(74, 222, 128, 0.25)'],
  });

  return (
    <View style={styles.iconContainer}>
      <Animated.View style={[styles.tabSectionFill, { backgroundColor }]}>
        <Animated.View style={[styles.tabActiveTopLine, { opacity: bgAnim }]} />
      </Animated.View>
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

function TabLayoutContent() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4ade80',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.45)',
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint="dark"
            style={StyleSheet.absoluteFill}
            experimentalBlurMethod="dimezisBlurView"
          />
        ),
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
            <AttachStep index={3}>
              <AnimatedTabIcon
                name="stats-chart"
                nameOutline="stats-chart-outline"
                color={color}
                size={26}
                focused={focused}
              />
            </AttachStep>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <AttachStep index={4}>
              <AnimatedTabIcon
                name="person"
                nameOutline="person-outline"
                color={color}
                size={26}
                focused={focused}
              />
            </AttachStep>
          ),
        }}
      />
    </Tabs>
  );
}

const createTourSteps = (t: TFunction): TourStep[] => [
  // Step 0: Welcome
  {
    render: ({ next, stop }) => (
      <View style={styles.tooltipContainer}>
        <View style={styles.tooltipHeader}>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepIndicatorText}>{t('tutorial.stepIndicator', { current: 1, total: 6 })}</Text>
          </View>
        </View>
        <Text style={styles.tooltipTitle}>{t('tutorial.steps.welcome.title')}</Text>
        <Text style={styles.tooltipText}>{t('tutorial.steps.welcome.description')}</Text>
        <View style={styles.tooltipButtons}>
          <Pressable onPress={stop} style={styles.tooltipButtonSkip}>
            <Text style={styles.tooltipButtonTextSkip}>{t('tutorial.buttons.skip')}</Text>
          </Pressable>
          <Pressable onPress={next} style={styles.tooltipButtonPrimary}>
            <Text style={styles.tooltipButtonTextPrimary}>{t('tutorial.buttons.start')}</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>
    ),
  },
  // Step 1: Anxiety levels
  {
    render: ({ next, previous, stop }) => (
      <View style={styles.tooltipContainer}>
        <View style={styles.tooltipHeader}>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepIndicatorText}>{t('tutorial.stepIndicator', { current: 2, total: 6 })}</Text>
          </View>
        </View>
        <Text style={styles.tooltipTitle}>{t('tutorial.steps.anxietyLevels.title')}</Text>
        <Text style={styles.tooltipText}>{t('tutorial.steps.anxietyLevels.description')}</Text>
        <View style={styles.tooltipButtons}>
          <Pressable onPress={stop} style={styles.tooltipButtonSkip}>
            <Text style={styles.tooltipButtonTextSkip}>{t('tutorial.buttons.skip')}</Text>
          </Pressable>
          <Pressable onPress={previous} style={styles.tooltipButton}>
            <Ionicons name="arrow-back" size={18} color="#2d9a6e" />
          </Pressable>
          <Pressable onPress={next} style={styles.tooltipButtonPrimary}>
            <Text style={styles.tooltipButtonTextPrimary}>{t('tutorial.buttons.next')}</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>
    ),
  },
  // Step 2: Session flow explanation
  {
    render: ({ next, previous, stop }) => (
      <View style={styles.tooltipContainer}>
        <View style={styles.tooltipHeader}>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepIndicatorText}>{t('tutorial.stepIndicator', { current: 3, total: 6 })}</Text>
          </View>
        </View>
        <Text style={styles.tooltipTitle}>{t('tutorial.steps.howItWorks.title')}</Text>
        <Text style={styles.tooltipText}>{t('tutorial.steps.howItWorks.description')}</Text>
        <View style={styles.tooltipButtons}>
          <Pressable onPress={stop} style={styles.tooltipButtonSkip}>
            <Text style={styles.tooltipButtonTextSkip}>{t('tutorial.buttons.skip')}</Text>
          </Pressable>
          <Pressable onPress={previous} style={styles.tooltipButton}>
            <Ionicons name="arrow-back" size={18} color="#2d9a6e" />
          </Pressable>
          <Pressable onPress={next} style={styles.tooltipButtonPrimary}>
            <Text style={styles.tooltipButtonTextPrimary}>{t('tutorial.buttons.next')}</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>
    ),
  },
  // Step 3: Charts tab
  {
    render: ({ next, previous, stop }) => (
      <View style={styles.tooltipContainer}>
        <View style={styles.tooltipHeader}>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepIndicatorText}>{t('tutorial.stepIndicator', { current: 4, total: 6 })}</Text>
          </View>
        </View>
        <Text style={styles.tooltipTitle}>{t('tutorial.steps.statistics.title')}</Text>
        <Text style={styles.tooltipText}>{t('tutorial.steps.statistics.description')}</Text>
        <View style={styles.tooltipButtons}>
          <Pressable onPress={stop} style={styles.tooltipButtonSkip}>
            <Text style={styles.tooltipButtonTextSkip}>{t('tutorial.buttons.skip')}</Text>
          </Pressable>
          <Pressable onPress={previous} style={styles.tooltipButton}>
            <Ionicons name="arrow-back" size={18} color="#2d9a6e" />
          </Pressable>
          <Pressable onPress={next} style={styles.tooltipButtonPrimary}>
            <Text style={styles.tooltipButtonTextPrimary}>{t('tutorial.buttons.next')}</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>
    ),
  },
  // Step 4: Profile tab
  {
    render: ({ next, previous, stop }) => (
      <View style={styles.tooltipContainer}>
        <View style={styles.tooltipHeader}>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepIndicatorText}>{t('tutorial.stepIndicator', { current: 5, total: 6 })}</Text>
          </View>
        </View>
        <Text style={styles.tooltipTitle}>{t('tutorial.steps.profile.title')}</Text>
        <Text style={styles.tooltipText}>{t('tutorial.steps.profile.description')}</Text>
        <View style={styles.tooltipButtons}>
          <Pressable onPress={stop} style={styles.tooltipButtonSkip}>
            <Text style={styles.tooltipButtonTextSkip}>{t('tutorial.buttons.skip')}</Text>
          </Pressable>
          <Pressable onPress={previous} style={styles.tooltipButton}>
            <Ionicons name="arrow-back" size={18} color="#2d9a6e" />
          </Pressable>
          <Pressable onPress={next} style={styles.tooltipButtonPrimary}>
            <Text style={styles.tooltipButtonTextPrimary}>{t('tutorial.buttons.next')}</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>
    ),
  },
  // Step 5: Ready to start
  {
    render: ({ stop, previous }) => (
      <View style={styles.tooltipContainer}>
        <View style={styles.tooltipHeader}>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepIndicatorText}>{t('tutorial.stepIndicator', { current: 6, total: 6 })}</Text>
          </View>
        </View>
        <Text style={styles.tooltipTitle}>{t('tutorial.steps.ready.title')}</Text>
        <Text style={styles.tooltipText}>{t('tutorial.steps.ready.description')}</Text>
        <View style={styles.tooltipButtons}>
          <Pressable onPress={previous} style={styles.tooltipButton}>
            <Ionicons name="arrow-back" size={18} color="#2d9a6e" />
          </Pressable>
          <Pressable onPress={stop} style={styles.tooltipButtonPrimary}>
            <Text style={styles.tooltipButtonTextPrimary}>{t('tutorial.buttons.begin')}</Text>
            <Ionicons name="checkmark" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>
    ),
  },
];

export default function TabLayout() {
  const { completeTutorial } = useTutorial();
  const { t } = useTranslation();

  const tourSteps = useMemo(() => createTourSteps(t), [t]);

  const handleTourStop = () => {
    completeTutorial();
  };

  return (
    <SpotlightTourProvider
      steps={tourSteps}
      overlayColor="rgba(0, 0, 0, 0.75)"
      onStop={handleTourStop}
    >
      <TabLayoutContent />
    </SpotlightTourProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    height: 60,
    paddingBottom: 0,
    paddingTop: 0,
    elevation: 0,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  tabSectionFill: {
    position: 'absolute',
    top: -30,
    bottom: -30,
    left: -100,
    right: -100,
  },
  tabActiveTopLine: {
    position: 'absolute',
    top: 14,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#4ade80',
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
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  stepIndicator: {
    backgroundColor: '#f1f8f3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stepIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2d9a6e',
  },
  tooltipTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 8,
  },
  tooltipText: {
    fontSize: 15,
    color: '#566573',
    lineHeight: 22,
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
    gap: 6,
  },
  tooltipButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#2d9a6e',
    gap: 6,
  },
  tooltipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d9a6e',
  },
  tooltipButtonTextPrimary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  tooltipButtonSkip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 'auto',
  },
  tooltipButtonTextSkip: {
    fontSize: 14,
    fontWeight: '500',
    color: '#95A5A6',
  },
});
