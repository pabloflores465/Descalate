import { View, Text, StyleSheet, FlatList, Pressable, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSession } from '@/context/SessionContext';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Breathing pattern types
type BreathingPhaseType = 'inhale' | 'hold' | 'exhale' | 'holdAfterExhale';

type BreathingPhase = {
  type: BreathingPhaseType;
  duration: number;
};

type BreathingPattern = {
  type: 'breathing';
  phases: BreathingPhase[];
};

type StepPattern = {
  type: 'steps';
  steps: string[];
};

type ExercisePattern = BreathingPattern | StepPattern;

// Phase colors for visual feedback
const phaseColors: Record<BreathingPhaseType, string> = {
  inhale: '#60A5FA',      // Sky blue - expansion
  hold: '#FBBF24',        // Amber - pause
  exhale: '#34D399',      // Emerald - release
  holdAfterExhale: '#A78BFA', // Purple - deep pause
};

// Phase icons
const phaseIcons: Record<BreathingPhaseType, keyof typeof Ionicons.glyphMap> = {
  inhale: 'arrow-up',
  hold: 'pause',
  exhale: 'arrow-down',
  holdAfterExhale: 'pause',
};

// Exercise breathing patterns configuration
const exercisePatterns: Record<string, ExercisePattern> = {
  // Level 1
  'cardiacCoherence': { type: 'breathing', phases: [{type: 'inhale', duration: 5}, {type: 'exhale', duration: 5}] },
  'diaphragmaticBreathing336': { type: 'breathing', phases: [{type: 'inhale', duration: 3}, {type: 'hold', duration: 3}, {type: 'exhale', duration: 6}] },
  'bodyScanQuick': { type: 'steps', steps: ['feet', 'legs', 'torso', 'arms', 'head'] },
  'microMeditationAppreciation': { type: 'steps', steps: ['think', 'feel', 'expand'] },
  'calmVisualization': { type: 'steps', steps: ['imaginePlace', 'seeColors', 'hearSounds', 'feelSensations'] },

  // Level 2
  'tensionRelease': { type: 'steps', steps: ['shouldersTense', 'shouldersRelease', 'handsTense', 'handsRelease'] },
  'breathing46': { type: 'breathing', phases: [{type: 'inhale', duration: 4}, {type: 'exhale', duration: 6}] },
  'neckStretch': { type: 'steps', steps: ['leftSide', 'release', 'rightSide', 'releaseRight'] },
  'breathCounting': { type: 'breathing', phases: [{type: 'inhale', duration: 4}, {type: 'exhale', duration: 4}] },
  'sensoryGrounding2': { type: 'steps', steps: ['seeSomething', 'touchSomething'] },

  // Level 3
  'grounding54321': { type: 'steps', steps: ['see5', 'touch4', 'hear3', 'smell2', 'taste1'] },
  'physiologicalSigh': { type: 'breathing', phases: [{type: 'inhale', duration: 3}, {type: 'inhale', duration: 1}, {type: 'exhale', duration: 6}] },
  'emotionalLabeling': { type: 'steps', steps: ['identify', 'name', 'accept'] },
  'feetAttention': { type: 'steps', steps: ['feelPressure', 'noticeTemperature', 'breathe'] },
  'extendedExhale2x': { type: 'breathing', phases: [{type: 'inhale', duration: 3}, {type: 'exhale', duration: 6}] },

  // Level 4
  'physiologicalSighRepeated': { type: 'breathing', phases: [{type: 'inhale', duration: 3}, {type: 'inhale', duration: 1}, {type: 'exhale', duration: 6}] },
  'breathing478': { type: 'breathing', phases: [{type: 'inhale', duration: 4}, {type: 'hold', duration: 7}, {type: 'exhale', duration: 8}] },
  'somaticHold': { type: 'steps', steps: ['handOnChest', 'handOnAbdomen', 'feelMovement', 'breatheSlowly'] },
  'tactileGrounding': { type: 'steps', steps: ['touchSurface', 'feelTemperature', 'describeTexture'] },
  'countdown54321Breath': { type: 'breathing', phases: [{type: 'inhale', duration: 3}, {type: 'exhale', duration: 6}] },

  // Level 5
  'triangularBreathing': { type: 'breathing', phases: [{type: 'inhale', duration: 3}, {type: 'hold', duration: 3}, {type: 'exhale', duration: 3}] },
  'boxBreathing4444': { type: 'breathing', phases: [{type: 'inhale', duration: 4}, {type: 'hold', duration: 4}, {type: 'exhale', duration: 4}, {type: 'holdAfterExhale', duration: 4}] },
  'physicalGrounding3Points': { type: 'steps', steps: ['feetOnFloor', 'backOnChair', 'handsOnLegs'] },
  'verbalAnchoring': { type: 'steps', steps: ['sayIAmHere', 'sayThisWillPass', 'repeat'] },
  'doubleExtendedExhale': { type: 'breathing', phases: [{type: 'exhale', duration: 3}, {type: 'exhale', duration: 3}, {type: 'inhale', duration: 4}] },
};

type ExerciseConfig = {
  id: number;
  translationKey: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type Exercise = {
  id: number;
  title: string;
  description: string;
  duration: string;
  durationMinutes: number;
  icon: keyof typeof Ionicons.glyphMap;
  translationKey: string;
  level: number;
};

const exerciseConfigsByLevel: Record<number, ExerciseConfig[]> = {
  1: [
    { id: 1, translationKey: 'cardiacCoherence', icon: 'heart-outline' },
    { id: 2, translationKey: 'diaphragmaticBreathing336', icon: 'leaf-outline' },
    { id: 3, translationKey: 'bodyScanQuick', icon: 'body-outline' },
    { id: 4, translationKey: 'microMeditationAppreciation', icon: 'sunny-outline' },
    { id: 5, translationKey: 'calmVisualization', icon: 'cloudy-outline' },
  ],
  2: [
    { id: 1, translationKey: 'tensionRelease', icon: 'fitness-outline' },
    { id: 2, translationKey: 'breathing46', icon: 'leaf-outline' },
    { id: 3, translationKey: 'neckStretch', icon: 'body-outline' },
    { id: 4, translationKey: 'breathCounting', icon: 'calculator-outline' },
    { id: 5, translationKey: 'sensoryGrounding2', icon: 'eye-outline' },
  ],
  3: [
    { id: 1, translationKey: 'grounding54321', icon: 'earth-outline' },
    { id: 2, translationKey: 'physiologicalSigh', icon: 'pulse-outline' },
    { id: 3, translationKey: 'emotionalLabeling', icon: 'chatbubble-outline' },
    { id: 4, translationKey: 'feetAttention', icon: 'footsteps-outline' },
    { id: 5, translationKey: 'extendedExhale2x', icon: 'leaf-outline' },
  ],
  4: [
    { id: 1, translationKey: 'physiologicalSighRepeated', icon: 'pulse-outline' },
    { id: 2, translationKey: 'breathing478', icon: 'timer-outline' },
    { id: 3, translationKey: 'somaticHold', icon: 'hand-left-outline' },
    { id: 4, translationKey: 'tactileGrounding', icon: 'finger-print-outline' },
    { id: 5, translationKey: 'countdown54321Breath', icon: 'list-outline' },
  ],
  5: [
    { id: 1, translationKey: 'triangularBreathing', icon: 'triangle-outline' },
    { id: 2, translationKey: 'boxBreathing4444', icon: 'square-outline' },
    { id: 3, translationKey: 'physicalGrounding3Points', icon: 'body-outline' },
    { id: 4, translationKey: 'verbalAnchoring', icon: 'chatbubble-outline' },
    { id: 5, translationKey: 'doubleExtendedExhale', icon: 'leaf-outline' },
  ],
};

const levelColors: Record<number, string[]> = {
  1: ['#5a67d8', '#6b46c1'],
  2: ['#2d9a6e', '#2b7a9b'],
  3: ['#d97706', '#1e4e6d'],
  4: ['#c026d3', '#dc2626'],
  5: ['#be185d', '#ea580c'],
};

// Breathing Indicator Component - Integrated with timer
function BreathingIndicator({
  pattern,
  isRunning,
  totalTimeLeft,
  totalSeconds,
}: {
  pattern: BreathingPattern;
  isRunning: boolean;
  totalTimeLeft: number;
  totalSeconds: number;
}) {
  const { t } = useTranslation();
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [phaseTimeLeft, setPhaseTimeLeft] = useState(pattern.phases[0].duration);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const cycleDuration = useMemo(() =>
    pattern.phases.reduce((sum, phase) => sum + phase.duration, 0),
    [pattern.phases]
  );

  const currentPhase = pattern.phases[currentPhaseIndex];
  const phaseColor = phaseColors[currentPhase.type];
  const phaseIcon = phaseIcons[currentPhase.type];

  // Calculate current phase based on elapsed time
  useEffect(() => {
    if (!isRunning) {
      setCurrentPhaseIndex(0);
      setPhaseTimeLeft(pattern.phases[0].duration);
      return;
    }

    const elapsedTotal = totalSeconds - totalTimeLeft;
    const elapsedInCycle = elapsedTotal % cycleDuration;

    let accumulated = 0;
    let newPhaseIndex = 0;
    let timeInPhase = 0;

    for (let i = 0; i < pattern.phases.length; i++) {
      const phaseDuration = pattern.phases[i].duration;
      if (elapsedInCycle < accumulated + phaseDuration) {
        newPhaseIndex = i;
        timeInPhase = phaseDuration - (elapsedInCycle - accumulated);
        break;
      }
      accumulated += phaseDuration;
    }

    setCurrentPhaseIndex(newPhaseIndex);
    setPhaseTimeLeft(Math.ceil(timeInPhase));
  }, [isRunning, totalTimeLeft, totalSeconds, cycleDuration, pattern.phases]);

  // Breathing animation (scale pulse)
  useEffect(() => {
    if (!isRunning) {
      scaleAnim.setValue(1);
      return;
    }

    const isInhale = currentPhase.type === 'inhale';
    const isExhale = currentPhase.type === 'exhale';

    if (isInhale) {
      Animated.timing(scaleAnim, {
        toValue: 1.12,
        duration: currentPhase.duration * 1000,
        useNativeDriver: true,
      }).start();
    } else if (isExhale) {
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: currentPhase.duration * 1000,
        useNativeDriver: true,
      }).start();
    }
  }, [isRunning, currentPhaseIndex, currentPhase]);

  const totalProgress = 1 - (totalTimeLeft / totalSeconds);

  const getPhaseLabel = (phaseType: BreathingPhaseType) => {
    return t(`exercises.breathing.phases.${phaseType}`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={indicatorStyles.container}>
      {/* Progress ring background */}
      <View style={indicatorStyles.progressRingBg} />

      {/* Progress ring - shows total progress */}
      <View
        style={[
          indicatorStyles.progressRingFill,
          {
            borderTopColor: 'rgba(255,255,255,0.9)',
            borderRightColor: totalProgress > 0.25 ? 'rgba(255,255,255,0.9)' : 'transparent',
            borderBottomColor: totalProgress > 0.5 ? 'rgba(255,255,255,0.9)' : 'transparent',
            borderLeftColor: totalProgress > 0.75 ? 'rgba(255,255,255,0.9)' : 'transparent',
            transform: [{ rotate: '-45deg' }],
          }
        ]}
      />

      {/* Inner animated circle */}
      <Animated.View
        style={[
          indicatorStyles.innerCircle,
          {
            backgroundColor: phaseColor + '25',
            borderColor: phaseColor,
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
        {/* Center content */}
        <View style={indicatorStyles.centerContent}>
          <Ionicons name={phaseIcon} size={36} color={phaseColor} />
          <Text style={[indicatorStyles.phaseLabel, { color: phaseColor }]}>
            {getPhaseLabel(currentPhase.type)}
          </Text>
          <Text style={[indicatorStyles.phaseTime, { color: phaseColor }]}>
            {phaseTimeLeft}
          </Text>
        </View>
      </Animated.View>

      {/* Total time at bottom */}
      <View style={indicatorStyles.totalTimeContainer}>
        <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.9)" />
        <Text style={indicatorStyles.totalTimeText}>
          {formatTime(totalTimeLeft)}
        </Text>
      </View>
    </View>
  );
}

// Step Indicator Component - For non-breathing exercises
function StepIndicator({
  pattern,
  isRunning,
  totalTimeLeft,
  totalSeconds,
}: {
  pattern: StepPattern;
  isRunning: boolean;
  totalTimeLeft: number;
  totalSeconds: number;
}) {
  const { t } = useTranslation();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepTimeLeft, setStepTimeLeft] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const stepDuration = Math.floor(totalSeconds / pattern.steps.length);

  // Initialize step time when starting
  useEffect(() => {
    if (!isRunning) {
      setCurrentStepIndex(0);
      setStepTimeLeft(stepDuration);
    }
  }, [isRunning, stepDuration]);

  // Independent step timer - counts down and auto-advances
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setStepTimeLeft(prev => {
        if (prev <= 1) {
          // Auto-advance to next step (cyclical)
          setCurrentStepIndex(currentIdx =>
            (currentIdx + 1) % pattern.steps.length
          );
          return stepDuration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, stepDuration, pattern.steps.length]);

  // Handle tap to advance to next step (cyclical)
  const handleTapToAdvance = () => {
    if (!isRunning) return;

    // Advance to next step cyclically
    setCurrentStepIndex(prev => (prev + 1) % pattern.steps.length);
    setStepTimeLeft(stepDuration);
  };

  // Pulse animation when running
  useEffect(() => {
    if (!isRunning) {
      pulseAnim.setValue(1);
      return;
    }

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => pulseAnim.setValue(1);
  }, [isRunning]);

  const totalProgress = 1 - (totalTimeLeft / totalSeconds);
  const currentStep = pattern.steps[currentStepIndex];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={indicatorStyles.container}>
      {/* Progress ring background */}
      <View style={indicatorStyles.progressRingBg} />

      {/* Progress ring - shows total progress */}
      <View
        style={[
          indicatorStyles.progressRingFill,
          {
            borderTopColor: 'rgba(255,255,255,0.9)',
            borderRightColor: totalProgress > 0.25 ? 'rgba(255,255,255,0.9)' : 'transparent',
            borderBottomColor: totalProgress > 0.5 ? 'rgba(255,255,255,0.9)' : 'transparent',
            borderLeftColor: totalProgress > 0.75 ? 'rgba(255,255,255,0.9)' : 'transparent',
            transform: [{ rotate: '-45deg' }],
          }
        ]}
      />

      {/* Inner animated circle - tappable */}
      <Pressable onPress={handleTapToAdvance}>
        <Animated.View
          style={[
            indicatorStyles.innerCircleSteps,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          {/* Step dots */}
          <View style={indicatorStyles.stepDotsContainer}>
            {pattern.steps.map((_, index) => (
              <View
                key={index}
                style={[
                  indicatorStyles.stepDot,
                  index <= currentStepIndex && indicatorStyles.stepDotActive,
                  index === currentStepIndex && indicatorStyles.stepDotCurrent,
                ]}
              />
            ))}
          </View>

          {/* Center content */}
          <View style={indicatorStyles.centerContent}>
            <Text style={indicatorStyles.stepNumber}>
              {currentStepIndex + 1}/{pattern.steps.length}
            </Text>
            <Text style={indicatorStyles.stepLabel}>
              {t(`exercises.steps.${currentStep}`)}
            </Text>
            {/* Step timer */}
            {isRunning && (
              <Text style={indicatorStyles.stepTimer}>
                {stepTimeLeft}s
              </Text>
            )}
          </View>

          {/* Tap hint */}
          {isRunning && (
            <Text style={indicatorStyles.tapHint}>
              {t('exercises.timer.tapToAdvance')}
            </Text>
          )}
        </Animated.View>
      </Pressable>

      {/* Total time at bottom */}
      <View style={indicatorStyles.totalTimeContainer}>
        <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.9)" />
        <Text style={indicatorStyles.totalTimeText}>
          {formatTime(totalTimeLeft)}
        </Text>
      </View>
    </View>
  );
}

// Indicator styles
const indicatorStyles = StyleSheet.create({
  container: {
    width: 280,
    height: 360,
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressRingBg: {
    position: 'absolute',
    top: 0,
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 6,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  progressRingFill: {
    position: 'absolute',
    top: 0,
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 6,
  },
  innerCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  innerCircleSteps: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseLabel: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  phaseTime: {
    fontSize: 56,
    fontWeight: '200',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  totalTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 35,
  },
  totalTimeText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
    fontVariant: ['tabular-nums'],
  },
  stepDotsContainer: {
    flexDirection: 'row',
    position: 'absolute',
    top: 30,
    gap: 8,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  stepDotActive: {
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  stepDotCurrent: {
    backgroundColor: '#fff',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  stepLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: 20,
    maxWidth: 180,
  },
  stepTimer: {
    fontSize: 32,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
    fontVariant: ['tabular-nums'],
  },
  tapHint: {
    position: 'absolute',
    bottom: 25,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
});

function ExerciseCard({
  exercise,
  colors,
  onPress,
}: {
  exercise: Exercise;
  colors: string[];
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.exerciseCardWrapper}>
      <View style={styles.exerciseCard}>
        <View style={styles.exerciseCardContent}>
          <View
            style={[
              styles.exerciseIconContainer,
              { backgroundColor: colors[0] + '20' }
            ]}
          >
            <Ionicons
              name={exercise.icon}
              size={28}
              color={colors[0]}
            />
          </View>
          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseTitle}>
              {exercise.title}
            </Text>
            <View style={styles.durationContainer}>
              <Ionicons name="time-outline" size={14} color="#566573" />
              <Text style={styles.durationText}>{exercise.duration}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors[0]} />
        </View>
      </View>
    </Pressable>
  );
}

function TimerScreen({
  exercise,
  colors,
  onFinish,
  onBack,
}: {
  exercise: Exercise;
  colors: string[];
  onFinish: () => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const totalSeconds = exercise.durationMinutes * 60;
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Get the exercise pattern
  const pattern = exercisePatterns[exercise.translationKey];

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setTimeLeft(totalSeconds);
    setIsRunning(false);
    setIsFinished(false);
  };

  // Render the appropriate indicator based on pattern type
  const renderIndicator = () => {
    if (!pattern) {
      // Fallback for exercises without defined patterns
      return (
        <View style={styles.timerCircleContainer}>
          <View style={styles.timerCircle}>
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
            <Text style={styles.timerLabel}>
              {isFinished
                ? t('exercises.timer.completed')
                : isRunning
                  ? t('exercises.timer.breathing')
                  : t('exercises.timer.ready')}
            </Text>
          </View>
        </View>
      );
    }

    if (pattern.type === 'breathing') {
      return (
        <BreathingIndicator
          pattern={pattern}
          isRunning={isRunning}
          totalTimeLeft={timeLeft}
          totalSeconds={totalSeconds}
        />
      );
    }

    return (
      <StepIndicator
        pattern={pattern}
        isRunning={isRunning}
        totalTimeLeft={timeLeft}
        totalSeconds={totalSeconds}
      />
    );
  };

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.timerContainer}
    >
      <Pressable onPress={onBack} style={styles.timerBackButton}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </Pressable>

      <View style={styles.timerContent}>
        <View style={styles.timerIconContainer}>
          <Ionicons name={exercise.icon} size={40} color="#fff" />
        </View>

        <Text style={styles.timerTitle}>{exercise.title}</Text>

        {/* Indicator with integrated timer */}
        {renderIndicator()}

        <View style={styles.timerDescriptionContainer}>
          <Text style={styles.timerDescription}>{exercise.description}</Text>
        </View>

        <View style={styles.timerButtons}>
          {!isFinished ? (
            <>
              <Pressable
                style={[styles.timerButton, styles.timerButtonSecondary]}
                onPress={handleReset}
              >
                <Ionicons name="refresh" size={24} color="#fff" />
              </Pressable>
              <Pressable
                style={[styles.timerButton, styles.timerButtonPrimary]}
                onPress={handleStartPause}
              >
                <Ionicons
                  name={isRunning ? 'pause' : 'play'}
                  size={32}
                  color={colors[0]}
                />
              </Pressable>
              <Pressable
                style={[styles.timerButton, styles.timerButtonSecondary]}
                onPress={onFinish}
              >
                <Ionicons name="checkmark" size={24} color="#fff" />
              </Pressable>
            </>
          ) : (
            <Pressable
              style={styles.continueButton}
              onPress={onFinish}
            >
              <Text style={styles.continueButtonText}>
                {t('exercises.timer.continue')}
              </Text>
              <Ionicons name="arrow-forward" size={20} color={colors[0]} />
            </Pressable>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

export default function ExercisesScreen() {
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const level = Number(params.level) || 3;
  const exerciseConfigs = exerciseConfigsByLevel[level] || exerciseConfigsByLevel[3];
  const colors = levelColors[level] || levelColors[3];
  const levelTitle = t(`anxietyLevels.${level}.title`);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const { setSelectedExercises } = useSession();

  const exercises: Exercise[] = exerciseConfigs.map(config => ({
    id: config.id,
    title: t(`exercises.levels.${level}.exercises.${config.translationKey}.title`),
    description: t(`exercises.levels.${level}.exercises.${config.translationKey}.description`),
    duration: t('exercises.duration', { minutes: t(`exercises.levels.${level}.exercises.${config.translationKey}.duration`) }),
    durationMinutes: Number(t(`exercises.levels.${level}.exercises.${config.translationKey}.duration`)),
    icon: config.icon,
    translationKey: config.translationKey,
    level: level,
  }));

  const handleExercisePress = (exercise: Exercise) => {
    setActiveExercise(exercise);
  };

  const handleExerciseFinish = () => {
    if (activeExercise) {
      setSelectedExercises([{
        id: activeExercise.id,
        title: activeExercise.title,
        duration: activeExercise.duration,
        translationKey: activeExercise.translationKey,
        level: activeExercise.level,
      }]);
      router.push({
        pathname: '/tips',
        params: { level, showLevelSelector: 'true' },
      });
    }
  };

  const handleBackFromTimer = () => {
    setActiveExercise(null);
  };

  const handleGoBack = () => {
    router.back();
  };

  if (activeExercise) {
    return (
      <TimerScreen
        exercise={activeExercise}
        colors={colors}
        onFinish={handleExerciseFinish}
        onBack={handleBackFromTimer}
      />
    );
  }

  const renderHeader = () => (
    <>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Pressable onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <View style={styles.headerContent}>
          <Ionicons name="fitness" size={48} color="rgba(255,255,255,0.9)" />
          <Text style={styles.title}>{t('exercises.title')}</Text>
          <Text style={styles.subtitle}>{t('exercises.subtitle', { levelTitle, level })}</Text>
        </View>
      </LinearGradient>
      <Text style={styles.sectionTitle}>
        {t('exercises.selectExercise')}
      </Text>
    </>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      data={exercises}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <ExerciseCard
          exercise={item}
          colors={colors}
          onPress={() => handleExercisePress(item)}
        />
      )}
      ListHeaderComponent={renderHeader}
      showsVerticalScrollIndicator={true}
      bounces={true}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f8f3',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#566573',
    marginBottom: 20,
    marginTop: 20,
    marginHorizontal: 20,
    textAlign: 'center',
  },
  exerciseCardWrapper: {
    marginBottom: 12,
    marginHorizontal: 20,
  },
  exerciseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  exerciseCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2C3E50',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  durationText: {
    fontSize: 13,
    color: '#566573',
    fontWeight: '500',
  },
  // Timer Screen Styles
  timerContainer: {
    flex: 1,
    paddingTop: 60,
  },
  timerBackButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  timerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  timerIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  timerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  timerCircleContainer: {
    width: 260,
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  timerCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  progressRingContainer: {
    position: 'absolute',
    width: 260,
    height: 260,
  },
  progressRingBackground: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 6,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  progressRing: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 6,
  },
  timerText: {
    fontSize: 56,
    fontWeight: '300',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
    fontWeight: '500',
  },
  timeRemainingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timeRemainingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  timerDescriptionContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    maxHeight: 120,
  },
  timerDescription: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
  },
  timerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  timerButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
  },
  timerButtonPrimary: {
    width: 80,
    height: 80,
    backgroundColor: '#fff',
  },
  timerButtonSecondary: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    gap: 10,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
  },
});
