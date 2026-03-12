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
    icon: 'leaf-outline',
    colors: ['#2d9a6e', '#1e6e52'],
  },
  {
    key: '2',
    titleKey: 'onboarding.slides.understand.title',
    textKey: 'onboarding.slides.understand.text',
    encouragementKey: 'onboarding.slides.understand.encouragement',
    icon: 'layers-outline',
    colors: ['#5a67d8', '#3730a3'],
  },
  {
    key: '3',
    titleKey: 'onboarding.slides.tools.title',
    textKey: 'onboarding.slides.tools.text',
    encouragementKey: 'onboarding.slides.tools.encouragement',
    icon: 'body-outline',
    colors: ['#0891b2', '#0e7490'],
  },
  {
    key: '4',
    titleKey: 'onboarding.slides.progress.title',
    textKey: 'onboarding.slides.progress.text',
    encouragementKey: 'onboarding.slides.progress.encouragement',
    icon: 'bar-chart-outline',
    colors: ['#be185d', '#9d174d'],
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

  const levelColors = ['#5a67d8', '#2d9a6e', '#d97706', '#c026d3', '#be185d'];
  const levelLabels = ['1', '2', '3', '4', '5'];

  const renderItem = ({ item }: { item: Slide }) => {
    return (
      <LinearGradient colors={item.colors} style={styles.slide}>
        <View style={styles.encouragementCard}>
          <Ionicons name="sparkles" size={16} color="rgba(255,255,255,0.9)" />
          <Text style={styles.encouragementText}>{t(item.encouragementKey)}</Text>
        </View>
        <View style={styles.iconContainer}>
          <Ionicons name={item.icon} size={90} color="rgba(255,255,255,0.9)" />
        </View>
        {item.key === '2' && (
          <View style={styles.levelIndicator}>
            {levelColors.map((color, index) => (
              <View key={color} style={styles.levelItem}>
                <View style={[styles.levelDot, { backgroundColor: color }]}>
                  <Text style={styles.levelDotText}>{levelLabels[index]}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
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
  levelIndicator: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelItem: {
    alignItems: 'center',
  },
  levelDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  levelDotText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
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
