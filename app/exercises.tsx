import { View, Text, StyleSheet, FlatList, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useRef, useEffect } from 'react';
import { useSession } from '@/context/SessionContext';
import { useTranslation } from 'react-i18next';

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
  icon: keyof typeof Ionicons.glyphMap;
  translationKey: string;
  level: number;
};

const exerciseConfigsByLevel: Record<number, ExerciseConfig[]> = {
  1: [
    { id: 1, translationKey: 'mindfulBreathing', icon: 'leaf-outline' },
    { id: 2, translationKey: 'gratitudeJournal', icon: 'book-outline' },
    { id: 3, translationKey: 'gentleStretching', icon: 'body-outline' },
  ],
  2: [
    { id: 1, translationKey: 'boxBreathing', icon: 'square-outline' },
    { id: 2, translationKey: 'progressiveMuscleRelaxation', icon: 'fitness-outline' },
    { id: 3, translationKey: 'mindfulWalking', icon: 'walk-outline' },
  ],
  3: [
    { id: 1, translationKey: 'breathing478', icon: 'pulse-outline' },
    { id: 2, translationKey: 'bodyScan', icon: 'body-outline' },
    { id: 3, translationKey: 'grounding54321', icon: 'earth-outline' },
  ],
  4: [
    { id: 1, translationKey: 'deepDiaphragmatic', icon: 'contract-outline' },
    { id: 2, translationKey: 'guidedVisualization', icon: 'cloudy-outline' },
    { id: 3, translationKey: 'physicalRelease', icon: 'barbell-outline' },
    { id: 4, translationKey: 'coldWater', icon: 'water-outline' },
  ],
  5: [
    { id: 1, translationKey: 'emergencyGrounding', icon: 'hand-left-outline' },
    { id: 2, translationKey: 'tippTechnique', icon: 'thermometer-outline' },
    { id: 3, translationKey: 'safePlace', icon: 'home-outline' },
    { id: 4, translationKey: 'butterflyHug', icon: 'heart-outline' },
  ],
};

const levelColors: Record<number, string[]> = {
  1: ['#5a67d8', '#6b46c1'],
  2: ['#2d9a6e', '#2b7a9b'],
  3: ['#d97706', '#1e4e6d'],
  4: ['#c026d3', '#dc2626'],
  5: ['#be185d', '#ea580c'],
};

function ExerciseCard({
  exercise,
  colors,
  isSelected,
  isExpanded,
  onSelect,
  onExpand
}: {
  exercise: Exercise;
  colors: string[];
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onExpand: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(20)).current;
  const checkScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isExpanded) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.02,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(100),
          Animated.parallel([
            Animated.timing(contentOpacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.spring(contentTranslate, {
              toValue: 0,
              friction: 8,
              tension: 40,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();
    } else {
      contentOpacity.setValue(0);
      contentTranslate.setValue(20);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [isExpanded]);

  useEffect(() => {
    if (isSelected) {
      Animated.sequence([
        Animated.spring(checkScaleAnim, {
          toValue: 1.3,
          friction: 3,
          tension: 200,
          useNativeDriver: true,
        }),
        Animated.spring(checkScaleAnim, {
          toValue: 1,
          friction: 3,
          tension: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isSelected]);

  return (
    <View
      style={[
        styles.exerciseCardWrapper,
        isExpanded && styles.exerciseCardWrapperExpanded,
      ]}
    >
      <Pressable onPress={onExpand} style={styles.exerciseCardPressable}>
        <LinearGradient
          colors={isExpanded ? colors : ['#ffffff', '#ffffff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.exerciseCard,
            isExpanded && styles.exerciseCardExpanded,
          ]}
        >
          <View style={styles.exerciseCardContent}>
            <View
              style={[
                styles.exerciseIconContainer,
                isExpanded && styles.exerciseIconContainerExpanded,
                {
                  backgroundColor: isExpanded ? 'rgba(255,255,255,0.25)' : colors[0] + '20',
                }
              ]}
            >
              <Ionicons
                name={exercise.icon}
                size={isExpanded ? 48 : 28}
                color={isExpanded ? '#fff' : colors[0]}
              />
            </View>
            <View style={styles.exerciseInfo}>
              <Text style={[
                styles.exerciseTitle,
                isExpanded && styles.exerciseTitleExpanded
              ]}>
                {exercise.title}
              </Text>
              {!isExpanded && (
                <View style={styles.durationContainer}>
                  <Ionicons name="time-outline" size={14} color="#566573" />
                  <Text style={styles.durationText}>{exercise.duration}</Text>
                </View>
              )}
            </View>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              style={styles.selectButtonContainer}
            >
              <Animated.View
                style={[
                  styles.selectCircle,
                  isSelected && { backgroundColor: isExpanded ? '#fff' : colors[0], borderColor: isExpanded ? '#fff' : colors[0] },
                  isExpanded && !isSelected && { borderColor: 'rgba(255,255,255,0.6)' },
                  { transform: [{ scale: checkScaleAnim }] },
                ]}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={18} color={isExpanded ? colors[0] : '#fff'} />
                )}
              </Animated.View>
            </Pressable>
          </View>

          {isExpanded && (
            <Animated.View
              style={[
                styles.expandedContent,
                {
                  opacity: contentOpacity,
                  transform: [{ translateY: contentTranslate }],
                },
              ]}
            >
              <View style={styles.durationBadge}>
                <Ionicons name="time-outline" size={16} color="#fff" />
                <Text style={styles.durationBadgeText}>{exercise.duration}</Text>
              </View>
              <Text style={styles.exerciseDescriptionExpanded}>{exercise.description}</Text>
            </Animated.View>
          )}
        </LinearGradient>
      </Pressable>
    </View>
  );
}

export default function ExercisesScreen() {
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const level = Number(params.level) || 3;
  const exerciseConfigs = exerciseConfigsByLevel[level] || exerciseConfigsByLevel[3];
  const colors = levelColors[level] || levelColors[3];
  const levelTitle = t(`anxietyLevels.${level}.title`);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<number[]>([]);
  const [expandedExerciseId, setExpandedExerciseId] = useState<number | null>(null);
  const { setSelectedExercises } = useSession();

  const exercises: Exercise[] = exerciseConfigs.map(config => ({
    id: config.id,
    title: t(`exercises.levels.${level}.exercises.${config.translationKey}.title`),
    description: t(`exercises.levels.${level}.exercises.${config.translationKey}.description`),
    duration: t('exercises.duration', { minutes: t(`exercises.levels.${level}.exercises.${config.translationKey}.duration`) }),
    icon: config.icon,
    translationKey: config.translationKey,
    level: level,
  }));

  const handleSelectExercise = (exerciseId: number) => {
    setSelectedExerciseIds(prev => {
      if (prev.includes(exerciseId)) {
        return prev.filter(id => id !== exerciseId);
      } else {
        return [...prev, exerciseId];
      }
    });
  };

  const handleExpandExercise = (exerciseId: number) => {
    setExpandedExerciseId(prev => prev === exerciseId ? null : exerciseId);
  };

  const handleContinueToTips = () => {
    if (selectedExerciseIds.length === 0) {
      return;
    }
    const selectedExercisesData = exercises
      .filter(ex => selectedExerciseIds.includes(ex.id))
      .map(ex => ({
        id: ex.id,
        title: ex.title,
        duration: ex.duration,
        translationKey: ex.translationKey,
        level: ex.level,
      }));
    setSelectedExercises(selectedExercisesData);
    router.push({
      pathname: '/tips',
      params: { level },
    });
  };

  const handleGoBack = () => {
    router.back();
  };

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
        {t('exercises.sectionTitle')}
      </Text>
    </>
  );

  const renderFooter = () => (
    <Pressable
      style={[
        styles.continueButton,
        selectedExerciseIds.length === 0 && styles.continueButtonDisabled
      ]}
      onPress={handleContinueToTips}
      disabled={selectedExerciseIds.length === 0}
    >
      <LinearGradient
        colors={selectedExerciseIds.length > 0 ? colors : ['#cccccc', '#999999']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.continueButtonGradient}
      >
        <Text style={styles.continueButtonText}>
          {t('exercises.startSession')} ({selectedExerciseIds.length})
        </Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </LinearGradient>
    </Pressable>
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
          isSelected={selectedExerciseIds.includes(item.id)}
          isExpanded={expandedExerciseId === item.id}
          onSelect={() => handleSelectExercise(item.id)}
          onExpand={() => handleExpandExercise(item.id)}
        />
      )}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
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
  exerciseCardWrapperExpanded: {
    marginBottom: 16,
  },
  exerciseCardPressable: {
    flex: 1,
  },
  exerciseCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  exerciseCardExpanded: {
    borderRadius: 24,
    padding: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
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
  exerciseIconContainerExpanded: {
    width: 80,
    height: 80,
    borderRadius: 24,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2C3E50',
  },
  exerciseTitleExpanded: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '800',
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
  selectButtonContainer: {
    padding: 8,
  },
  selectCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  expandedContent: {
    marginTop: 20,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: 16,
  },
  durationBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseDescriptionExpanded: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
    fontWeight: '500',
  },
  continueButton: {
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 8,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
});
