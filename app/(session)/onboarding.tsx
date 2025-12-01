import { View, Text, StyleSheet } from 'react-native';
import AppIntroSlider from 'react-native-app-intro-slider';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const ONBOARDING_KEY = '@descalate_onboarding_complete';

type Slide = {
  key: string;
  title: string;
  text: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: [string, string];
};

const slides: Slide[] = [
  {
    key: '1',
    title: 'Bienvenido a Descalate',
    text: 'Tu companero personal para manejar la ansiedad y encontrar la calma interior cuando mas lo necesitas.',
    icon: 'heart-outline',
    colors: ['#5a8c6a', '#3d6b4f'],
  },
  {
    key: '2',
    title: 'Entiende tu Ansiedad',
    text: 'Aprende a identificar y comprender tus niveles de ansiedad. El primer paso para manejarla es reconocerla.',
    icon: 'eye-outline',
    colors: ['#5a67d8', '#4c51bf'],
  },
  {
    key: '3',
    title: 'Herramientas a tu Alcance',
    text: 'Accede a ejercicios de respiracion, meditacion y tecnicas probadas cientificamente para reducir la ansiedad.',
    icon: 'medical-outline',
    colors: ['#2d9a6e', '#228b5b'],
  },
  {
    key: '4',
    title: 'Tu Progreso Importa',
    text: 'Cada sesion cuenta. Observa como mejoras con el tiempo y celebra tus logros en el camino hacia el bienestar.',
    icon: 'trending-up-outline',
    colors: ['#c026d3', '#a21caf'],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();

  const handleDone = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/(session)/complete-profile');
  };

  const renderItem = ({ item }: { item: Slide }) => {
    return (
      <LinearGradient colors={item.colors} style={styles.slide}>
        <View style={styles.iconContainer}>
          <Ionicons name={item.icon} size={120} color="rgba(255,255,255,0.9)" />
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.text}>{item.text}</Text>
      </LinearGradient>
    );
  };

  const renderNextButton = () => {
    return (
      <View style={styles.buttonCircle}>
        <Ionicons name="arrow-forward" size={24} color="#fff" />
      </View>
    );
  };

  const renderDoneButton = () => {
    return (
      <View style={styles.buttonCircle}>
        <Ionicons name="checkmark" size={24} color="#fff" />
      </View>
    );
  };

  const renderSkipButton = () => {
    return (
      <View style={styles.skipButton}>
        <Text style={styles.skipText}>Saltar</Text>
      </View>
    );
  };

  return (
    <AppIntroSlider
      data={slides}
      renderItem={renderItem}
      onDone={handleDone}
      showSkipButton
      onSkip={handleDone}
      renderNextButton={renderNextButton}
      renderDoneButton={renderDoneButton}
      renderSkipButton={renderSkipButton}
      dotStyle={styles.dot}
      activeDotStyle={styles.activeDot}
    />
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  text: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 10,
  },
  buttonCircle: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  skipText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '600',
  },
  dot: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 20,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});
