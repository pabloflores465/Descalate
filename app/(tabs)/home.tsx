import { View, Text, StyleSheet, Pressable, ImageBackground } from 'react-native';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import { useCallback, useRef, useEffect } from 'react';
import { BlurView } from 'expo-blur';
import { router, useFocusEffect } from 'expo-router';
import { useSession } from '@/context/SessionContext';
import { AttachStep, useSpotlightTour } from 'react-native-spotlight-tour';
import { useTutorial } from '@/context/TutorialContext';
import { useTranslation } from 'react-i18next';

type AnxietyLevelConfig = {
  level: number;
  colors: string[];
  icon: string;
};

const anxietyLevelConfigs: AnxietyLevelConfig[] = [
  { level: 1, colors: ['#5a67d8', '#6b46c1'], icon: 'face-smile' },
  { level: 2, colors: ['#2d9a6e', '#2b7a9b'], icon: 'face-meh' },
  { level: 3, colors: ['#d97706', '#1e4e6d'], icon: 'face-frown-open' },
  { level: 4, colors: ['#c026d3', '#dc2626'], icon: 'face-sad-tear' },
  { level: 5, colors: ['#be185d', '#ea580c'], icon: 'face-tired' },
];

function AnxietyCard({
  levelConfig,
  title,
  description,
  continueText,
  onContinue,
}: {
  levelConfig: AnxietyLevelConfig;
  title: string;
  description: string;
  continueText: string;
  onContinue: () => void;
}) {
  return (
    <View style={styles.cardWrapper}>
      <Pressable onPress={onContinue} style={styles.cardPressable}>
        <BlurView intensity={40} tint="default" style={styles.card}>
          <View
            style={[
              styles.cardColorOverlay,
              { backgroundColor: levelConfig.colors[0] + '40' },
            ]}
          />
          <View style={styles.cardContent}>
            <View style={styles.cardTop}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: levelConfig.colors[0] + '55' },
                ]}
              >
                <FontAwesome6 name={levelConfig.icon} size={20} color="#fff" />
              </View>
              <View style={styles.titleArea}>
                <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
                <Text style={styles.cardDescription} numberOfLines={2}>{description}</Text>
              </View>
              <View
                style={[
                  styles.levelBadge,
                  { borderColor: levelConfig.colors[0] + '80' },
                ]}
              >
                <Text style={styles.levelNumber}>{levelConfig.level}</Text>
              </View>
            </View>

            <View style={styles.cardBottom}>
              <View style={[styles.continueButton, { backgroundColor: levelConfig.colors[0] + '66' }]}>
                <Text style={styles.continueText}>{continueText}</Text>
                <Ionicons name="arrow-forward" size={14} color="#fff" />
              </View>
            </View>
          </View>
        </BlurView>
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
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

  const handleContinue = (level: number) => {
    startSession(level);
    router.push({ pathname: '/exercises', params: { level } });
  };

  return (
    <ImageBackground
      source={require('@/assets/images/wall1.jpg')}
      style={styles.container}
      imageStyle={styles.bgImage}
    >
      <View style={styles.darkOverlay}>
        <AttachStep index={1} style={styles.flex}>
          <AttachStep index={2} style={styles.flex}>
            <AttachStep index={5} style={styles.flex}>
              <View style={styles.cardsInner}>
                {anxietyLevelConfigs.slice().reverse().map((levelConfig) => (
                  <AnxietyCard
                    key={levelConfig.level}
                    levelConfig={levelConfig}
                    title={t(`anxietyLevels.${levelConfig.level}.title`)}
                    description={t(`anxietyLevels.${levelConfig.level}.description`)}
                    continueText={t('home.continueButton')}
                    onContinue={() => handleContinue(levelConfig.level)}
                  />
                ))}
              </View>
            </AttachStep>
          </AttachStep>
        </AttachStep>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgImage: {
    resizeMode: 'cover',
  },
  darkOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  flex: {
    flex: 1,
  },
  cardsInner: {
    flex: 1,
    padding: 12,
    paddingBottom: 72,
    gap: 6,
  },
  cardWrapper: {
    flex: 1,
  },
  cardPressable: {
    flex: 1,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  cardColorOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleArea: {
    flex: 1,
  },
  cardTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  cardDescription: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  levelBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  levelNumber: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 13,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  continueText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
