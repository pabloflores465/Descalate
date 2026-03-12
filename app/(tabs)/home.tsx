import { View, Text, StyleSheet, Pressable, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
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
  icon: string;
};

const anxietyLevelConfigs: AnxietyLevelConfig[] = [
  {
    level: 1,
    colors: ['#5a67d8', '#6b46c1'],
    icon: 'face-smile',
  },
  {
    level: 2,
    colors: ['#2d9a6e', '#2b7a9b'],
    icon: 'face-meh',
  },
  {
    level: 3,
    colors: ['#d97706', '#1e4e6d'],
    icon: 'face-frown-open',
  },
  {
    level: 4,
    colors: ['#c026d3', '#dc2626'],
    icon: 'face-sad-tear',
  },
  {
    level: 5,
    colors: ['#be185d', '#ea580c'],
    icon: 'face-tired',
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
    <View style={[styles.cardWrapper, isExpanded && styles.cardWrapperExpanded]}>
      <Pressable onPress={onPress} style={styles.cardPressable}>
        <LinearGradient
          colors={levelConfig.colors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.cardRow}>
            <View style={styles.iconCircle}>
              <FontAwesome6
                name={levelConfig.icon}
                size={22}
                color="#fff"
              />
            </View>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {title}
            </Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelNumber}>{levelConfig.level}</Text>
            </View>
          </View>

          {isExpanded && (
            <Animated.View style={[styles.expandedContent, { opacity: contentOpacity }]}>
              <Text style={styles.cardDescription}>{description}</Text>
              <Pressable onPress={onContinue} style={styles.continueButton}>
                <Text style={styles.continueButtonText}>{continueText}</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
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

  useEffect(() => {
    if (shouldShowTutorial) {
      hasStartedTour.current = false;
    }
  }, [shouldShowTutorial]);

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
    setExpandedLevel(expandedLevel === level ? null : level);
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
      <AttachStep index={1} style={styles.flex}>
        <AttachStep index={2} style={styles.flex}>
          <AttachStep index={5} style={styles.flex}>
            <View style={styles.cardsInner}>
              <Text style={styles.prompt}>{t('home.subtitle')}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f8',
  },
  flex: {
    flex: 1,
  },
  cardsInner: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 8,
  },
  prompt: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
    marginLeft: 4,
  },
  cardWrapper: {
    flex: 1,
  },
  cardWrapperExpanded: {
    flex: 2.5,
  },
  cardPressable: {
    flex: 1,
  },
  card: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    justifyContent: 'center',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    flex: 1,
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  levelBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  levelNumber: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
  },
  expandedContent: {
    marginTop: 12,
  },
  cardDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    marginBottom: 12,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    gap: 6,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
