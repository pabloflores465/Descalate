import { View, Text, StyleSheet, Pressable, Animated, ScrollView, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useSession } from '@/context/SessionContext';
import { AttachStep, useSpotlightTour } from 'react-native-spotlight-tour';
import { useTutorial } from '@/context/TutorialContext';
import { useTranslation } from 'react-i18next';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type AnxietyLevelConfig = {
  level: number;
  colors: string[];
  icon: keyof typeof Ionicons.glyphMap;
};

const anxietyLevelConfigs: AnxietyLevelConfig[] = [
  {
    level: 1,
    colors: ['#5a67d8', '#6b46c1'],
    icon: 'happy-outline',
  },
  {
    level: 2,
    colors: ['#2d9a6e', '#2b7a9b'],
    icon: 'fitness-outline',
  },
  {
    level: 3,
    colors: ['#d97706', '#1e4e6d'],
    icon: 'warning-outline',
  },
  {
    level: 4,
    colors: ['#c026d3', '#dc2626'],
    icon: 'alert-circle-outline',
  },
  {
    level: 5,
    colors: ['#be185d', '#ea580c'],
    icon: 'flash-outline',
  },
];

function AnxietyCard({
  levelConfig,
  title,
  description,
  continueText,
  isExpanded,
  onPress,
  onContinue,
}: {
  levelConfig: AnxietyLevelConfig;
  title: string;
  description: string;
  continueText: string;
  isExpanded: boolean;
  onPress: () => void;
  onContinue: () => void;
}) {
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isExpanded) {
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 300,
        delay: 150,
        useNativeDriver: true,
      }).start();
    } else {
      contentOpacity.setValue(0);
    }
  }, [isExpanded, contentOpacity]);

  return (
    <View style={styles.cardWrapper}>
      <Pressable onPress={onPress}>
        <LinearGradient
          colors={levelConfig.colors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <Ionicons
              name={levelConfig.icon}
              size={32}
              color="rgba(255, 255, 255, 0.95)"
            />
            <View style={styles.levelBadge}>
              <Text style={styles.levelNumber}>
                {levelConfig.level}
              </Text>
            </View>
          </View>

          <Text style={styles.cardTitle}>
            {title}
          </Text>

          {isExpanded && (
            <Animated.View style={{ opacity: contentOpacity }}>
              <View style={styles.descriptionContainer}>
                <Text style={styles.cardDescription}>{description}</Text>
              </View>

              <Pressable onPress={onContinue} style={styles.continueButton}>
                <Text style={styles.continueButtonText}>{continueText}</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </Pressable>
            </Animated.View>
          )}
        </LinearGradient>
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);
  const { startSession } = useSession();
  const { start } = useSpotlightTour();
  const { shouldShowTutorial, isLoading: tutorialLoading } = useTutorial();
  const { t } = useTranslation();
  const hasStartedTour = useRef(false);

  // Start tutorial when ready
  useEffect(() => {
    if (!tutorialLoading && shouldShowTutorial && !hasStartedTour.current) {
      const timer = setTimeout(() => {
        if (!hasStartedTour.current) {
          hasStartedTour.current = true;
          start();
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [tutorialLoading, shouldShowTutorial, start]);

  // Reset flag when screen loses focus
  useFocusEffect(
    useCallback(() => {
      return () => {
        hasStartedTour.current = false;
      };
    }, [])
  );

  const handleCardPress = (level: number) => {
    LayoutAnimation.configureNext({
      duration: 300,
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });
    if (expandedLevel === level) {
      setExpandedLevel(null);
    } else {
      setExpandedLevel(level);
    }
  };

  const handleContinue = (level: number) => {
    setExpandedLevel(null);
    startSession(level);
    router.push({
      pathname: '/exercises',
      params: { level },
    });
  };

  return (
    <View style={styles.container}>
      <AttachStep index={0} style={{ width: '100%' }}>
        <View style={styles.header}>
          <Ionicons name="pulse" size={48} color="#2d9a6e" />
          <Text style={styles.title}>{t('home.title')}</Text>
          <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
        </View>
      </AttachStep>

      <ScrollView
        style={styles.cardsContainer}
        contentContainerStyle={styles.cardsContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <AttachStep index={1} style={{ width: '100%' }}>
          <AttachStep index={2} style={{ width: '100%' }}>
            <AttachStep index={5} style={{ width: '100%' }}>
              <View style={styles.cardsInner}>
                {anxietyLevelConfigs.slice().reverse().map((levelConfig) => (
                  <AnxietyCard
                    key={levelConfig.level}
                    levelConfig={levelConfig}
                    title={t(`anxietyLevels.${levelConfig.level}.title`)}
                    description={t(`anxietyLevels.${levelConfig.level}.description`)}
                    continueText={t('home.continueButton')}
                    isExpanded={expandedLevel === levelConfig.level}
                    onPress={() => handleCardPress(levelConfig.level)}
                    onContinue={() => handleContinue(levelConfig.level)}
                  />
                ))}
              </View>
            </AttachStep>
          </AttachStep>
        </AttachStep>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f8f3',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 34,
    backgroundColor: '#F5F3ED',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#2C3E50',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#566573',
    marginTop: 10,
    fontWeight: '500',
  },
  cardsContainer: {
    flex: 1,
  },
  cardsContentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  cardsInner: {
    gap: 12,
  },
  cardWrapper: {
    minHeight: 95,
  },
  card: {
    padding: 16,
    borderRadius: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  levelBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  levelNumber: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
  cardTitle: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 20,
  },
  descriptionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  cardDescription: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    gap: 8,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
