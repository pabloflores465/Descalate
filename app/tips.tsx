import { View, Text, StyleSheet, ScrollView, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useRef, useEffect } from 'react';
import { useSession } from '@/context/SessionContext';
import { useTranslation } from 'react-i18next';

type Tip = {
  id: number;
  title: string;
  content: string;
  icon: keyof typeof Ionicons.glyphMap;
  category: string;
  steps: string[];
};

type TipConfig = {
  id: number;
  translationKey: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const tipConfigsByLevel: Record<number, TipConfig[]> = {
  1: [
    { id: 1, translationKey: 'maintainRoutine', icon: 'calendar-outline' },
    { id: 2, translationKey: 'dailyMindfulness', icon: 'leaf-outline' },
    { id: 3, translationKey: 'stayConnected', icon: 'people-outline' },
  ],
  2: [
    { id: 1, translationKey: 'identifyTriggers', icon: 'search-outline' },
    { id: 2, translationKey: 'limitCaffeine', icon: 'cafe-outline' },
    { id: 3, translationKey: 'takeBreaks', icon: 'pause-outline' },
    { id: 4, translationKey: 'getMoving', icon: 'walk-outline' },
  ],
  3: [
    { id: 1, translationKey: 'challengeNegativeThoughts', icon: 'bulb-outline' },
    { id: 2, translationKey: 'createCalmEnvironment', icon: 'home-outline' },
    { id: 3, translationKey: 'practiceSelfCompassion', icon: 'heart-outline' },
    { id: 4, translationKey: 'limitScreenTime', icon: 'phone-portrait-outline' },
  ],
  4: [
    { id: 1, translationKey: 'useGroundingTechniques', icon: 'footsteps-outline' },
    { id: 2, translationKey: 'seekSupport', icon: 'chatbubbles-outline' },
    { id: 3, translationKey: 'avoidAvoidance', icon: 'trending-up-outline' },
    { id: 4, translationKey: 'writeItDown', icon: 'create-outline' },
    { id: 5, translationKey: 'considerProfessionalHelp', icon: 'medical-outline' },
  ],
  5: [
    { id: 1, translationKey: 'focusOnSafety', icon: 'shield-checkmark-outline' },
    { id: 2, translationKey: 'useYourSenses', icon: 'hand-left-outline' },
    { id: 3, translationKey: 'haveEmergencyContact', icon: 'call-outline' },
    { id: 4, translationKey: 'createCrisisPlan', icon: 'document-text-outline' },
    { id: 5, translationKey: 'seekProfessionalHelp', icon: 'medkit-outline' },
    { id: 6, translationKey: 'rememberThisWillPass', icon: 'sunny-outline' },
  ],
};

const levelColors: Record<number, string[]> = {
  1: ['#5a67d8', '#6b46c1'],
  2: ['#2d9a6e', '#2b7a9b'],
  3: ['#d97706', '#1e4e6d'],
  4: ['#c026d3', '#dc2626'],
  5: ['#be185d', '#ea580c'],
};

const levelIcons: Record<number, keyof typeof Ionicons.glyphMap> = {
  1: 'happy-outline',
  2: 'fitness-outline',
  3: 'warning-outline',
  4: 'alert-circle-outline',
  5: 'flash-outline',
};

function LevelSelectCard({
  levelNum,
  title,
  description,
  icon,
  colors,
  isExpanded,
  onExpand,
  onSelect,
}: {
  levelNum: number;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: string[];
  isExpanded: boolean;
  onExpand: () => void;
  onSelect: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const iconScaleAnim = useRef(new Animated.Value(1)).current;
  const badgeScaleAnim = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (isExpanded) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.02,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(iconScaleAnim, {
          toValue: 1.4,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(badgeScaleAnim, {
          toValue: 1.2,
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
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(iconScaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(badgeScaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isExpanded]);

  return (
    <Animated.View
      style={[
        styles.levelSelectCard,
        isExpanded && styles.levelSelectCardExpanded,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <Pressable onPress={onExpand}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.levelSelectGradient, isExpanded && styles.levelSelectGradientExpanded]}
        >
          <View style={styles.levelSelectContent}>
            <Animated.View
              style={[
                styles.levelIconContainer,
                { transform: [{ scale: iconScaleAnim }] },
              ]}
            >
              <Ionicons name={icon} size={24} color="#fff" />
            </Animated.View>
            <View style={styles.levelTextContainer}>
              <Text style={[styles.levelSelectTitle, isExpanded && styles.levelSelectTitleExpanded]}>
                {title}
              </Text>
              {!isExpanded && (
                <Text style={styles.levelSelectSubtitle}>Nivel {levelNum}</Text>
              )}
            </View>
            <Animated.View
              style={[
                styles.levelBadge,
                { transform: [{ scale: badgeScaleAnim }] },
              ]}
            >
              <Text style={styles.levelBadgeText}>{levelNum}</Text>
            </Animated.View>
          </View>

          {isExpanded && (
            <Animated.View
              style={[
                styles.levelExpandedContent,
                {
                  opacity: contentOpacity,
                  transform: [{ translateY: contentTranslate }],
                },
              ]}
            >
              <View style={styles.levelDescriptionContainer}>
                <Text style={styles.levelDescription}>{description}</Text>
              </View>
              <Pressable style={styles.levelContinueButton} onPress={onSelect}>
                <Text style={styles.levelContinueButtonText}>Seleccionar este nivel</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </Pressable>
            </Animated.View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

function TipCard({ tip, colors, isExpanded, onPress }: {
  tip: Tip;
  colors: string[];
  isExpanded: boolean;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(20)).current;

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

  return (
    <View
      style={[
        styles.tipCard,
        isExpanded && styles.tipCardExpanded,
      ]}
    >
      <Pressable onPress={onPress}>
        <LinearGradient
          colors={isExpanded ? colors : ['#ffffff', '#ffffff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.tipCardContent, isExpanded && styles.tipCardContentExpanded]}
        >
          <View style={styles.tipHeader}>
            <View
              style={[
                styles.tipIconContainer,
                isExpanded && styles.tipIconContainerExpanded,
                {
                  backgroundColor: isExpanded ? 'rgba(255,255,255,0.25)' : colors[0] + '20',
                },
              ]}
            >
              <Ionicons name={tip.icon} size={isExpanded ? 40 : 24} color={isExpanded ? '#fff' : colors[0]} />
            </View>
            <View style={[
              styles.categoryBadge,
              { backgroundColor: isExpanded ? 'rgba(255,255,255,0.2)' : colors[0] + '15' }
            ]}>
              <Text style={[styles.categoryText, { color: isExpanded ? '#fff' : colors[0] }]}>
                {tip.category}
              </Text>
            </View>
          </View>
          <Text style={[styles.tipTitle, isExpanded && styles.tipTitleExpanded]}>
            {tip.title}
          </Text>

          {isExpanded ? (
            <Animated.View
              style={{
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslate }],
              }}
            >
              <Text style={styles.tipContentExpanded}>{tip.content}</Text>
              <View style={styles.stepsContainer}>
                <Text style={styles.stepsTitle}>Como aplicarlo:</Text>
                {tip.steps.map((step, index) => (
                  <View key={index} style={styles.stepItem}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          ) : (
            <Text style={styles.tipContent} numberOfLines={2}>{tip.content}</Text>
          )}
        </LinearGradient>
      </Pressable>
    </View>
  );
}

export default function TipsScreen() {
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const level = Number(params.level) || 3;
  const tipConfigs = tipConfigsByLevel[level] || tipConfigsByLevel[3];
  const colors = levelColors[level] || levelColors[3];
  const levelTitle = t(`anxietyLevels.${level}.title`);
  const [showLevelSelection, setShowLevelSelection] = useState(false);
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);
  const [isTipExpanded, setIsTipExpanded] = useState(false);
  const { setSessionTip, endSession, startSession, clearSession } = useSession();

  const tips: Tip[] = tipConfigs.map(config => ({
    id: config.id,
    title: t(`tips.levels.${level}.tips.${config.translationKey}.title`),
    content: t(`tips.levels.${level}.tips.${config.translationKey}.content`),
    icon: config.icon,
    category: t(`tips.categories.${t(`tips.levels.${level}.tips.${config.translationKey}.category`)}`),
    steps: t(`tips.levels.${level}.tips.${config.translationKey}.steps`, { returnObjects: true }) as string[],
  }));

  const [randomTip] = useState(() => {
    const randomIndex = Math.floor(Math.random() * tipConfigs.length);
    return tips[randomIndex];
  });

  useEffect(() => {
    setSessionTip({
      id: randomTip.id,
      title: randomTip.title,
      category: randomTip.category,
    });
  }, [randomTip]);

  const handleTipPress = () => {
    setIsTipExpanded(prev => !prev);
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleSelectNewLevel = () => {
    setShowLevelSelection(true);
  };

  const handleLevelExpand = (lvl: number) => {
    setExpandedLevel(prev => prev === lvl ? null : lvl);
  };

  const handleLevelSelect = async (selectedLevel: number) => {
    await endSession('new_level');
    clearSession();
    startSession(selectedLevel);
    router.replace({
      pathname: '/exercises',
      params: { level: selectedLevel },
    });
  };

  const handleEndSession = async () => {
    await endSession('end_session');
    clearSession();
    router.replace('/(tabs)/home');
  };

  if (showLevelSelection) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Pressable onPress={() => setShowLevelSelection(false)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <View style={styles.headerContent}>
            <Ionicons name="pulse" size={48} color="rgba(255,255,255,0.9)" />
            <Text style={styles.title}>{t('tips.levelSelection.title')}</Text>
            <Text style={styles.subtitle}>{t('tips.levelSelection.subtitle')}</Text>
          </View>
        </LinearGradient>

        <Text style={styles.sectionTitle}>
          {t('tips.sectionTitle')}
        </Text>

        {[1, 2, 3, 4, 5].map((lvl) => (
          <LevelSelectCard
            key={lvl}
            levelNum={lvl}
            title={t(`anxietyLevels.${lvl}.title`)}
            description={t(`anxietyLevels.${lvl}.description`)}
            icon={levelIcons[lvl]}
            colors={levelColors[lvl]}
            isExpanded={expandedLevel === lvl}
            onExpand={() => handleLevelExpand(lvl)}
            onSelect={() => handleLevelSelect(lvl)}
          />
        ))}

        <Pressable style={styles.endSessionButton} onPress={handleEndSession}>
          <View style={styles.endSessionButtonContent}>
            <Ionicons name="close-circle-outline" size={24} color="#566573" />
            <Text style={styles.endSessionButtonText}>{t('tips.finishSession')}</Text>
          </View>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
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
          <Ionicons name="bulb" size={48} color="rgba(255,255,255,0.9)" />
          <Text style={styles.title}>{t('tips.title')}</Text>
          <Text style={styles.subtitle}>{t('tips.subtitle', { levelTitle, level })}</Text>
        </View>
      </LinearGradient>

      <Text style={styles.sectionTitle}>
        {t('tips.sectionTitle')}
      </Text>

      <TipCard
        tip={randomTip}
        colors={colors}
        isExpanded={isTipExpanded}
        onPress={handleTipPress}
      />

      <Text style={styles.actionTitle}>{t('tips.actionTitle')}</Text>

      <Pressable style={styles.newLevelButton} onPress={handleSelectNewLevel}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.homeButtonGradient}
        >
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.homeButtonText}>{t('tips.selectNewLevel')}</Text>
        </LinearGradient>
      </Pressable>

      <Pressable style={styles.endSessionButton} onPress={handleEndSession}>
        <View style={styles.endSessionButtonContent}>
          <Ionicons name="checkmark-circle-outline" size={24} color="#5a8c6a" />
          <Text style={styles.endSessionButtonTextGreen}>{t('tips.finishSession')}</Text>
        </View>
      </Pressable>
    </ScrollView>
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
  tipCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  tipCardExpanded: {
    borderRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  tipCardContent: {
    padding: 16,
    borderRadius: 16,
  },
  tipCardContentExpanded: {
    padding: 24,
    borderRadius: 24,
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipIconContainerExpanded: {
    width: 72,
    height: 72,
    borderRadius: 20,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 8,
  },
  tipTitleExpanded: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '800',
    marginBottom: 16,
  },
  tipContent: {
    fontSize: 14,
    color: '#566573',
    lineHeight: 22,
  },
  tipContentExpanded: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 26,
    fontWeight: '500',
  },
  stepsContainer: {
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
  },
  stepsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    paddingTop: 3,
  },
  homeButton: {
    borderRadius: 16,
    marginHorizontal: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  homeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 8,
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
    marginHorizontal: 20,
  },
  newLevelButton: {
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  endSessionButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  endSessionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  endSessionButtonText: {
    color: '#566573',
    fontSize: 16,
    fontWeight: '600',
  },
  endSessionButtonTextGreen: {
    color: '#5a8c6a',
    fontSize: 16,
    fontWeight: '600',
  },
  levelSelectCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  levelSelectCardExpanded: {
    marginBottom: 16,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  levelSelectGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  levelSelectGradientExpanded: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  levelSelectContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  levelTextContainer: {
    flex: 1,
  },
  levelBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelBadgeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  levelSelectTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  levelSelectTitleExpanded: {
    fontSize: 24,
    fontWeight: '800',
  },
  levelSelectSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  levelExpandedContent: {
    marginTop: 20,
  },
  levelDescriptionContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  levelDescription: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  levelContinueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    gap: 8,
  },
  levelContinueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
