import { View, Text, StyleSheet, Pressable, Animated, ScrollView, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSession } from '@/context/SessionContext';
import { CopilotStep, walkthroughable } from 'react-native-copilot';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const WalkthroughableView = walkthroughable(View);

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
    colors: ['#5a67d8', '#6b46c1'],
    icon: 'happy-outline',
  },
  {
    level: 2,
    title: 'Leve',
    description: 'Ligeramente tenso. Preocupaciones menores presentes pero manejables.',
    colors: ['#2d9a6e', '#2b7a9b'],
    icon: 'fitness-outline',
  },
  {
    level: 3,
    title: 'Moderada',
    description: 'Notablemente ansioso. El ritmo cardiaco puede aumentar, comienza la inquietud.',
    colors: ['#d97706', '#1e4e6d'],
    icon: 'warning-outline',
  },
  {
    level: 4,
    title: 'Alta',
    description: 'Ansiedad fuerte. Dificultad para concentrarse, pensamientos acelerados.',
    colors: ['#c026d3', '#dc2626'],
    icon: 'alert-circle-outline',
  },
  {
    level: 5,
    title: 'Severa',
    description: 'Ansiedad intensa o panico. Sentimientos abrumadores, sintomas fisicos presentes.',
    colors: ['#be185d', '#ea580c'],
    icon: 'flash-outline',
  },
];

function AnxietyCard({
  level,
  isExpanded,
  onPress,
  onContinue,
}: {
  level: AnxietyLevel;
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
          colors={level.colors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <Ionicons
              name={level.icon}
              size={32}
              color="rgba(255, 255, 255, 0.95)"
            />
            <View style={styles.levelBadge}>
              <Text style={styles.levelNumber}>
                {level.level}
              </Text>
            </View>
          </View>

          <Text style={styles.cardTitle}>
            {level.title}
          </Text>

          {isExpanded && (
            <Animated.View style={{ opacity: contentOpacity }}>
              <View style={styles.descriptionContainer}>
                <Text style={styles.cardDescription}>{level.description}</Text>
              </View>

              <Pressable onPress={onContinue} style={styles.continueButton}>
                <Text style={styles.continueButtonText}>Continuar</Text>
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
      <CopilotStep
        text="Bienvenido a Descalate. Aqui veras los niveles de ansiedad disponibles."
        order={1}
        name="header"
      >
        <WalkthroughableView style={styles.header}>
          <Ionicons name="pulse" size={48} color="#5a8c6a" />
          <Text style={styles.title}>Niveles de Ansiedad</Text>
          <Text style={styles.subtitle}>Toca cada tarjeta para saber mas</Text>
        </WalkthroughableView>
      </CopilotStep>

      <ScrollView
        style={styles.cardsContainer}
        contentContainerStyle={styles.cardsContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <CopilotStep
          text="Cada tarjeta representa un nivel de ansiedad del 1 al 5. Toca una para ver mas detalles y comenzar una sesion de ejercicios."
          order={2}
          name="cards"
        >
          <WalkthroughableView style={styles.cardsInner}>
            {anxietyLevels.slice().reverse().map((level) => (
              <AnxietyCard
                key={level.level}
                level={level}
                isExpanded={expandedLevel === level.level}
                onPress={() => handleCardPress(level.level)}
                onContinue={() => handleContinue(level.level)}
              />
            ))}
          </WalkthroughableView>
        </CopilotStep>
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
