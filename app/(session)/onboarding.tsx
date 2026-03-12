import { View, Text, StyleSheet } from 'react-native';
import AppIntroSlider from 'react-native-app-intro-slider';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import LanguageSelector from '@/components/LanguageSelector';

type Slide = {
  key: string;
  titleKey: string;
  textKey: string;
  encouragementKey: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: [string, string];
};

const slidesConfig: Slide[] = [
  {
    key: '1',
    titleKey: 'onboarding.slides.welcome.title',
    textKey: 'onboarding.slides.welcome.text',
    encouragementKey: 'onboarding.slides.welcome.encouragement',
    icon: 'heart-outline',
    colors: ['#2d9a6e', '#247a58'],
  },
  {
    key: '2',
    titleKey: 'onboarding.slides.understand.title',
    textKey: 'onboarding.slides.understand.text',
    encouragementKey: 'onboarding.slides.understand.encouragement',
    icon: 'eye-outline',
    colors: ['#5a67d8', '#4c51bf'],
  },
  {
    key: '3',
    titleKey: 'onboarding.slides.tools.title',
    textKey: 'onboarding.slides.tools.text',
    encouragementKey: 'onboarding.slides.tools.encouragement',
    icon: 'medical-outline',
    colors: ['#2d9a6e', '#228b5b'],
  },
  {
    key: '4',
    titleKey: 'onboarding.slides.progress.title',
    textKey: 'onboarding.slides.progress.text',
    encouragementKey: 'onboarding.slides.progress.encouragement',
    icon: 'trending-up-outline',
    colors: ['#c026d3', '#a21caf'],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { currentUserEmail } = useAuth();

  const handleDone = async () => {
    // Global key cleared on logout to ensure new users see onboarding
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
    router.replace('/(session)/complete-profile');
  };

  const renderItem = ({ item }: { item: Slide }) => {
    return (
      <LinearGradient colors={item.colors} style={styles.slide}>
        <View style={styles.encouragementCard}>
          <Ionicons name="sparkles" size={16} color="rgba(255,255,255,0.9)" />
          <Text style={styles.encouragementText}>{t(item.encouragementKey)}</Text>
        </View>
        <View style={styles.iconContainer}>
          <Ionicons name={item.icon} size={100} color="rgba(255,255,255,0.9)" />
        </View>
        <Text style={styles.title}>{t(item.titleKey)}</Text>
        <Text style={styles.text}>{t(item.textKey)}</Text>
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
        <Text style={styles.skipText}>{t('common.skip')}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LanguageSelector style={styles.languageSelector} />
      <AppIntroSlider
        data={slidesConfig}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  languageSelector: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  encouragementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 30,
    gap: 8,
  },
  encouragementText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
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
