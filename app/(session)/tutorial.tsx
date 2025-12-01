import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const TUTORIAL_COMPLETE_KEY = '@descalate_tutorial_complete';

type TutorialStep = {
  id: number;
  title: string;
  instruction: string;
  tip: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: [string, string];
};

const tutorialSteps: TutorialStep[] = [
  {
    id: 1,
    title: 'Como Empezar',
    instruction: 'En la pantalla de inicio veras 5 tarjetas de colores. Toca la que mejor represente como te sientes ahora mismo.',
    tip: 'Nivel 1 es calma total, nivel 5 es ansiedad intensa',
    icon: 'hand-left-outline',
    colors: ['#5a8c6a', '#3d6b4f'],
  },
  {
    id: 2,
    title: 'Elige tus Ejercicios',
    instruction: 'Despues de seleccionar tu nivel, veras ejercicios recomendados. Marca los que quieras practicar y presiona continuar.',
    tip: 'Puedes seleccionar varios ejercicios a la vez',
    icon: 'checkbox-outline',
    colors: ['#5a67d8', '#4c51bf'],
  },
  {
    id: 3,
    title: 'Recibe tu Tip',
    instruction: 'Al final de cada sesion recibiras un consejo personalizado. Leelo y decide si quieres guardarlo o finalizar.',
    tip: 'Los tips se adaptan a tu nivel de ansiedad',
    icon: 'bulb-outline',
    colors: ['#d97706', '#b45309'],
  },
  {
    id: 4,
    title: 'Revisa tu Progreso',
    instruction: 'En la pestana de estadisticas puedes ver graficas de tu historial semanal, mensual y anual.',
    tip: 'Desliza hacia abajo para ver todas las estadisticas',
    icon: 'bar-chart-outline',
    colors: ['#c026d3', '#a21caf'],
  },
];

export default function TutorialScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep]);

  const animateTransition = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      slideAnim.setValue(50);
    });
  };

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      animateTransition(() => setCurrentStep(currentStep + 1));
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      animateTransition(() => setCurrentStep(currentStep - 1));
    }
  };

  const handleComplete = async () => {
    await AsyncStorage.setItem(TUTORIAL_COMPLETE_KEY, 'true');
    router.replace('/(tabs)/home');
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(TUTORIAL_COMPLETE_KEY, 'true');
    router.replace('/(tabs)/home');
  };

  return (
    <LinearGradient colors={step.colors} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tutorial Rapido</Text>
        <Pressable style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Saltar</Text>
        </Pressable>
      </View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.stepBadge}>
          <Text style={styles.stepNumber}>Paso {currentStep + 1} de {tutorialSteps.length}</Text>
        </View>

        <View style={styles.iconContainer}>
          <Ionicons name={step.icon} size={80} color="rgba(255,255,255,0.95)" />
        </View>

        <Text style={styles.title}>{step.title}</Text>

        <View style={styles.instructionCard}>
          <Ionicons name="information-circle" size={24} color="#fff" style={styles.instructionIcon} />
          <Text style={styles.instruction}>{step.instruction}</Text>
        </View>

        <View style={styles.tipContainer}>
          <Ionicons name="sparkles" size={18} color="rgba(255,255,255,0.9)" />
          <Text style={styles.tip}>{step.tip}</Text>
        </View>
      </Animated.View>

      <View style={styles.dotsContainer}>
        {tutorialSteps.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, index === currentStep && styles.dotActive]}
          />
        ))}
      </View>

      <View style={styles.footer}>
        {currentStep > 0 ? (
          <Pressable style={styles.navButton} onPress={handlePrev}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
        ) : (
          <View style={styles.navButtonPlaceholder} />
        )}

        <Pressable style={styles.mainButton} onPress={handleNext}>
          <Text style={styles.mainButtonText}>
            {isLastStep ? 'Empezar' : 'Siguiente'}
          </Text>
          <Ionicons
            name={isLastStep ? 'rocket' : 'arrow-forward'}
            size={20}
            color="#fff"
          />
        </Pressable>

        <View style={styles.navButtonPlaceholder} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  headerTitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  stepBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  stepNumber: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  instructionCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  instructionIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  instruction: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  tip: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontStyle: 'italic',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#fff',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonPlaceholder: {
    width: 50,
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    gap: 8,
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
