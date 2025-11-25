import { View, Text, StyleSheet, Pressable, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type AnxietyLevel = {
  level: number;
  title: string;
  description: string;
  colors: string[];
  icon: keyof typeof Ionicons.glyphMap;
};

const anxietyLevels: AnxietyLevel[] = [
  {
    level: 1,
    title: 'Calma',
    description: 'Relajado y en paz. La respiracion es estable y los pensamientos son claros.',
    colors: ['#667eea', '#764ba2'],
    icon: 'happy-outline',
  },
  {
    level: 2,
    title: 'Leve',
    description: 'Ligeramente tenso. Preocupaciones menores presentes pero manejables.',
    colors: ['#84fab0', '#8fd3f4'],
    icon: 'fitness-outline',
  },
  {
    level: 3,
    title: 'Moderada',
    description: 'Notablemente ansioso. El ritmo cardiaco puede aumentar, comienza la inquietud.',
    colors: ['#ffd89b', '#19547b'],
    icon: 'warning-outline',
  },
  {
    level: 4,
    title: 'Alta',
    description: 'Ansiedad fuerte. Dificultad para concentrarse, pensamientos acelerados.',
    colors: ['#f093fb', '#f5576c'],
    icon: 'alert-circle-outline',
  },
  {
    level: 5,
    title: 'Severa',
    description: 'Ansiedad intensa o panico. Sentimientos abrumadores, sintomas fisicos presentes.',
    colors: ['#fa709a', '#fee140'],
    icon: 'flash-outline',
  },
];

function AnxietyCard({
  level,
  isExpanded,
  onPress,
  onContinue
}: {
  level: AnxietyLevel;
  isExpanded: boolean;
  onPress: () => void;
  onContinue: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const iconScaleAnim = useRef(new Animated.Value(1)).current;
  const badgeScaleAnim = useRef(new Animated.Value(1)).current;
  const descriptionOpacityAnim = useRef(new Animated.Value(0)).current;
  const descriptionTranslateAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Stop all running animations first
    scaleAnim.stopAnimation(() => {
      iconScaleAnim.stopAnimation(() => {
        badgeScaleAnim.stopAnimation(() => {
          descriptionOpacityAnim.stopAnimation(() => {
            descriptionTranslateAnim.stopAnimation(() => {
              if (isExpanded) {
                Animated.parallel([
                  Animated.spring(scaleAnim, {
                    toValue: 1.05,
                    friction: 6,
                    tension: 40,
                    useNativeDriver: true,
                  }),
                  Animated.spring(iconScaleAnim, {
                    toValue: 2.5,
                    friction: 8,
                    tension: 50,
                    useNativeDriver: true,
                  }),
                  Animated.spring(badgeScaleAnim, {
                    toValue: 1.5,
                    friction: 8,
                    tension: 50,
                    useNativeDriver: true,
                  }),
                  Animated.timing(descriptionOpacityAnim, {
                    toValue: 1,
                    duration: 500,
                    delay: 200,
                    useNativeDriver: true,
                  }),
                  Animated.timing(descriptionTranslateAnim, {
                    toValue: 0,
                    duration: 500,
                    delay: 200,
                    useNativeDriver: true,
                  }),
                ]).start();
              } else {
                // Reset immediately to default values
                scaleAnim.setValue(1);
                iconScaleAnim.setValue(1);
                badgeScaleAnim.setValue(1);
                descriptionOpacityAnim.setValue(0);
                descriptionTranslateAnim.setValue(20);
              }
            });
          });
        });
      });
    });
  }, [isExpanded]);

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        isExpanded && styles.cardWrapperExpanded,
      ]}
    >
      <Pressable onPress={onPress} style={{ flex: 1 }}>
        <Animated.View
          style={[
            styles.card,
            isExpanded && styles.cardExpanded,
            {
              transform: [{ scale: scaleAnim }],
              overflow: 'hidden',
            },
          ]}
        >
          <LinearGradient
            colors={level.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.gradientBackground,
              isExpanded && styles.gradientExpanded,
            ]}
          >
            <View style={styles.cardHeader}>
              <Animated.View
                style={{
                  transform: [{ scale: iconScaleAnim }],
                }}
              >
                <Ionicons
                  name={level.icon}
                  size={36}
                  color="rgba(255, 255, 255, 0.95)"
                />
              </Animated.View>
              <Animated.View
                style={[
                  styles.levelBadge,
                  {
                    transform: [{ scale: badgeScaleAnim }],
                  },
                ]}
              >
                <Text style={[styles.levelNumber, isExpanded && styles.levelNumberExpanded]}>
                  {level.level}
                </Text>
              </Animated.View>
            </View>

            <Text style={[styles.cardTitle, isExpanded && styles.cardTitleExpanded]}>
              {level.title}
            </Text>

            {isExpanded && (
              <Animated.View
                style={[
                  styles.descriptionContainer,
                  {
                    opacity: descriptionOpacityAnim,
                    transform: [{
                      translateY: descriptionTranslateAnim,
                    }],
                  },
                ]}
              >
                <Text style={styles.cardDescription}>{level.description}</Text>
              </Animated.View>
            )}

            {isExpanded && (
              <Animated.View
                style={[
                  styles.continueButtonContainer,
                  {
                    opacity: descriptionOpacityAnim,
                    transform: [{
                      translateY: descriptionTranslateAnim,
                    }],
                  },
                ]}
              >
                <Pressable
                  onPress={onContinue}
                  style={styles.continueButton}
                >
                  <Text style={styles.continueButtonText}>Continuar</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </Pressable>
              </Animated.View>
            )}
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);

  const handleCardPress = (level: number) => {
    if (expandedLevel === level) {
      setExpandedLevel(null);
    } else {
      setExpandedLevel(level);
    }
  };

  const handleContinue = (level: number) => {
    setExpandedLevel(null);
    router.push({
      pathname: '/exercises',
      params: { level },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="pulse" size={48} color="#5a8c6a" />
        <Text style={styles.title}>Niveles de Ansiedad</Text>
        <Text style={styles.subtitle}>Toca cada tarjeta para saber mas</Text>
      </View>

      <View style={styles.cardsContainer}>
        {anxietyLevels.slice().reverse().map((level) => (
          <AnxietyCard
            key={level.level}
            level={level}
            isExpanded={expandedLevel === level.level}
            onPress={() => handleCardPress(level.level)}
            onContinue={() => handleContinue(level.level)}
          />
        ))}
      </View>
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
    color: '#7F8C8D',
    marginTop: 10,
    fontWeight: '500',
  },
  cardsContainer: {
    flex: 1,
    padding: 20,
    gap: 12,
  },
  cardWrapper: {
    flex: 1,
    minHeight: 90,
    maxHeight: 110,
  },
  cardWrapperExpanded: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    bottom: 0,
    zIndex: 1000,
    minHeight: 'auto',
    maxHeight: 'none',
  },
  card: {
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    justifyContent: 'center',
    borderRadius: 20,
  },
  cardExpanded: {
    borderRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
  gradientBackground: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    borderRadius: 20,
  },
  gradientExpanded: {
    padding: 40,
    borderRadius: 32,
    justifyContent: 'flex-start',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  levelNumber: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  levelNumberExpanded: {
    fontSize: 26,
  },
  cardTitle: {
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 0.5,
    fontSize: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardTitleExpanded: {
    fontSize: 48,
    marginTop: 24,
    marginBottom: 28,
    letterSpacing: -0.5,
  },
  descriptionContainer: {
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardDescription: {
    color: '#fff',
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '500',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  continueButtonContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
