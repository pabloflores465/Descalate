import { View, Text, StyleSheet, ScrollView, Pressable, Animated, Dimensions } from 'react-native';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useSession } from '@/context/SessionContext';
import { useTranslation } from 'react-i18next';
import DonationModal from '@/components/DonationModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#FF69B4', '#00CED1'];
const CONFETTI_COUNT = 60;

function Confetti() {
  const animations = useRef(
    Array.from({ length: CONFETTI_COUNT }, () => ({
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  const pieces = useMemo(() => {
    return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * SCREEN_WIDTH,
      delay: Math.random() * 800,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 10 + Math.random() * 10,
      horizontalMovement: (Math.random() - 0.5) * 150,
      duration: 2500 + Math.random() * 1500,
    }));
  }, []);

  useEffect(() => {
    pieces.forEach((piece, index) => {
      const anim = animations[index];

      setTimeout(() => {
        Animated.parallel([
          Animated.timing(anim.translateY, {
            toValue: SCREEN_HEIGHT + 50,
            duration: piece.duration,
            useNativeDriver: true,
          }),
          Animated.timing(anim.translateX, {
            toValue: piece.horizontalMovement,
            duration: piece.duration,
            useNativeDriver: true,
          }),
          Animated.timing(anim.rotate, {
            toValue: 10,
            duration: piece.duration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(piece.duration * 0.6),
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: piece.duration * 0.4,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      }, piece.delay);
    });
  }, []);

  return (
    <View style={styles.confettiContainer} pointerEvents="none">
      {pieces.map((piece, index) => {
        const anim = animations[index];
        const rotateInterpolation = anim.rotate.interpolate({
          inputRange: [0, 10],
          outputRange: ['0deg', '1800deg'],
        });

        return (
          <Animated.View
            key={piece.id}
            style={[
              styles.confettiPiece,
              {
                left: piece.x,
                width: piece.size,
                height: piece.size * 0.6,
                backgroundColor: piece.color,
                opacity: anim.opacity,
                transform: [
                  { translateY: anim.translateY },
                  { translateX: anim.translateX },
                  { rotate: rotateInterpolation },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

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
    { id: 5, translationKey: 'breathingChangesChemistry', icon: 'pulse-outline' },
  ],
  5: [
    { id: 1, translationKey: 'focusOnSafety', icon: 'shield-checkmark-outline' },
    { id: 2, translationKey: 'useYourSenses', icon: 'hand-left-outline' },
    { id: 3, translationKey: 'haveEmergencyContact', icon: 'call-outline' },
    { id: 4, translationKey: 'createCrisisPlan', icon: 'document-text-outline' },
    { id: 5, translationKey: 'youAreNotBroken', icon: 'heart-outline' },
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

const levelIcons: Record<number, string> = {
  1: 'face-smile',
  2: 'face-meh',
  3: 'face-frown-open',
  4: 'face-sad-tear',
  5: 'face-tired',
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
  icon: string;
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
              <FontAwesome6 name={icon} size={24} color="#fff" />
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

function UnifiedTipScreen({
  tip,
  colors,
  levelTitle,
  level,
  onGoBack,
  onSelectNewLevel,
  onEndSession,
}: {
  tip: Tip;
  colors: string[];
  levelTitle: string;
  level: number;
  onGoBack: () => void;
  onSelectNewLevel: () => void;
  onEndSession: () => void;
}) {
  const { t } = useTranslation();

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.unifiedContainer}
    >
      <ScrollView
        style={styles.unifiedScrollView}
        contentContainerStyle={styles.unifiedScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={onGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>

        <View style={styles.unifiedHeader}>
          <Text style={styles.unifiedSubtitle}>
            {t('tips.subtitle', { levelTitle, level })}
          </Text>
        </View>

        <View style={styles.unifiedTipIconContainer}>
          <Ionicons name={tip.icon} size={48} color="#fff" />
        </View>

        <View style={styles.unifiedCategoryBadge}>
          <Text style={styles.unifiedCategoryText}>{tip.category}</Text>
        </View>

        <Text style={styles.unifiedTipTitle}>{tip.title}</Text>

        <Text style={styles.unifiedTipContent}>{tip.content}</Text>

        <View style={styles.unifiedStepsContainer}>
          <Text style={styles.unifiedStepsTitle}>{t('tips.howToApply')}</Text>
          {tip.steps.map((step, index) => (
            <View key={index} style={styles.unifiedStepItem}>
              <View style={styles.unifiedStepNumber}>
                <Text style={styles.unifiedStepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.unifiedStepText}>{step}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.unifiedActionTitle}>{t('tips.actionTitle')}</Text>

        <Pressable style={styles.unifiedPrimaryButton} onPress={onSelectNewLevel}>
          <Ionicons name="refresh" size={20} color={colors[0]} />
          <Text style={[styles.unifiedPrimaryButtonText, { color: colors[0] }]}>
            {t('tips.selectNewLevel')}
          </Text>
        </Pressable>

        <Pressable style={styles.unifiedSecondaryButton} onPress={onEndSession}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          <Text style={styles.unifiedSecondaryButtonText}>
            {t('tips.finishSession')}
          </Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
}

type FeedbackType = 'improved' | 'same' | 'increased';

type FeedbackData = {
  previousLevel: number;
  newLevel: number;
  type: FeedbackType;
};

function FeedbackScreen({
  feedbackData,
  onContinue,
}: {
  feedbackData: FeedbackData;
  onContinue: () => void;
}) {
  const { t } = useTranslation();
  const colors = levelColors[feedbackData.newLevel];
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getFeedbackMessages = (): string[] => {
    switch (feedbackData.type) {
      case 'improved':
        return t('deescalationFeedback.improved', { returnObjects: true }) as string[];
      case 'increased':
        return t('deescalationFeedback.increased', { returnObjects: true }) as string[];
      default:
        return t('deescalationFeedback.sameLevel', { returnObjects: true }) as string[];
    }
  };

  const getTitle = (): string => {
    switch (feedbackData.type) {
      case 'improved':
        return t('tips.feedback.congratsTitle');
      case 'increased':
        return t('tips.feedback.encourageTitle');
      default:
        return t('tips.feedback.supportTitle');
    }
  };

  const getIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (feedbackData.type) {
      case 'improved':
        return 'trophy';
      case 'increased':
        return 'hand-left';
      default:
        return 'heart';
    }
  };

  const getGradientColors = (): string[] => {
    switch (feedbackData.type) {
      case 'improved':
        return ['#2d9a6e', '#2b7a9b'];
      case 'increased':
        return ['#6366f1', '#8b5cf6'];
      default:
        return colors;
    }
  };

  const feedbackMessages = getFeedbackMessages();
  const randomMessage = feedbackMessages[Math.floor(Math.random() * feedbackMessages.length)];
  const gradientColors = getGradientColors();

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.feedbackContainer}
    >
      {feedbackData.type === 'improved' && <Confetti />}
      <Animated.View
        style={[
          styles.feedbackContent,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.feedbackIconContainer}>
          <Ionicons
            name={getIcon()}
            size={64}
            color="#fff"
          />
        </View>

        <Text style={styles.feedbackTitle}>
          {getTitle()}
        </Text>

        <View style={styles.feedbackLevelChange}>
          <View style={styles.feedbackLevelBadge}>
            <Text style={styles.feedbackLevelNumber}>{feedbackData.previousLevel}</Text>
          </View>
          <Ionicons name="arrow-forward" size={24} color="rgba(255,255,255,0.7)" />
          <View style={[styles.feedbackLevelBadge, styles.feedbackLevelBadgeNew]}>
            <Text style={styles.feedbackLevelNumber}>{feedbackData.newLevel}</Text>
          </View>
        </View>

        <View style={styles.feedbackMessageContainer}>
          <Text style={styles.feedbackMessage}>{randomMessage}</Text>
        </View>

        <Pressable style={styles.feedbackButton} onPress={onContinue}>
          <Text style={styles.feedbackButtonText}>{t('tips.feedback.continue')}</Text>
          <Ionicons name="arrow-forward" size={20} color={gradientColors[0]} />
        </Pressable>
      </Animated.View>
    </LinearGradient>
  );
}

function CelebrationScreen({
  onContinue,
}: {
  onContinue: () => void;
}) {
  const { t } = useTranslation();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={['#2d9a6e', '#2b7a9b']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.feedbackContainer}
    >
      <Confetti />
      <Animated.View
        style={[
          styles.feedbackContent,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.feedbackIconContainer}>
          <Ionicons name="trophy" size={64} color="#fff" />
        </View>

        <Text style={styles.feedbackTitle}>
          {t('tips.celebration.title')}
        </Text>

        <View style={styles.feedbackMessageContainer}>
          <Text style={styles.feedbackMessage}>{t('tips.celebration.message')}</Text>
        </View>

        <Pressable style={styles.feedbackButton} onPress={onContinue}>
          <Text style={styles.feedbackButtonText}>{t('tips.celebration.continue')}</Text>
          <Ionicons name="arrow-forward" size={20} color="#2d9a6e" />
        </Pressable>
      </Animated.View>
    </LinearGradient>
  );
}

export default function TipsScreen() {
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const level = Number(params.level) || 3;
  const tipConfigs = tipConfigsByLevel[level] || tipConfigsByLevel[3];
  const colors = levelColors[level] || levelColors[3];
  const levelTitle = t(`anxietyLevels.${level}.title`);
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [showDonation, setShowDonation] = useState(false);
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

  const handleGoBack = () => {
    router.back();
  };

  const handleLevelExpand = (lvl: number) => {
    setExpandedLevel(prev => prev === lvl ? null : lvl);
  };

  const handleLevelSelect = async (selectedLevel: number) => {
    let feedbackType: FeedbackType;
    if (selectedLevel < level) {
      feedbackType = 'improved';
    } else if (selectedLevel > level) {
      feedbackType = 'increased';
    } else {
      feedbackType = 'same';
    }

    setFeedbackData({
      previousLevel: level,
      newLevel: selectedLevel,
      type: feedbackType,
    });
  };

  const handleFeedbackContinue = async () => {
    if (feedbackData) {
      await endSession('new_level');
      clearSession();
      startSession(feedbackData.newLevel);
      router.replace({
        pathname: '/exercises',
        params: { level: feedbackData.newLevel },
      });
    }
  };

  const handleEndSession = () => {
    setShowCelebration(true);
  };

  const handleCelebrationContinue = () => {
    setShowCelebration(false);
    setShowTip(true);
  };

  const handleTipContinue = async () => {
    await endSession('end_session');
    clearSession();
    setShowDonation(true);
  };

  const handleDonationClose = () => {
    setShowDonation(false);
    router.replace('/(tabs)/home');
  };

  if (showCelebration) {
    return (
      <CelebrationScreen
        onContinue={handleCelebrationContinue}
      />
    );
  }

  if (showTip) {
    return (
      <>
        <UnifiedTipScreen
          tip={randomTip}
          colors={colors}
          levelTitle={levelTitle}
          level={level}
          onGoBack={() => setShowTip(false)}
          onSelectNewLevel={() => setShowTip(false)}
          onEndSession={handleTipContinue}
        />
        <DonationModal
          visible={showDonation}
          onClose={handleDonationClose}
        />
      </>
    );
  }

  if (feedbackData) {
    return (
      <FeedbackScreen
        feedbackData={feedbackData}
        onContinue={handleFeedbackContinue}
      />
    );
  }

  return (
    <>
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

      <DonationModal
        visible={showDonation}
        onClose={handleDonationClose}
      />
    </>
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
    color: '#2d9a6e',
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
  // Feedback Screen Styles
  feedbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  feedbackContent: {
    alignItems: 'center',
    width: '100%',
  },
  feedbackIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  feedbackTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  feedbackLevelChange: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  feedbackLevelBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackLevelBadgeNew: {
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderWidth: 3,
    borderColor: '#fff',
  },
  feedbackLevelNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  feedbackMessageContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    width: '100%',
  },
  feedbackMessage: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '500',
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    gap: 10,
  },
  feedbackButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
  },
  // Confetti Styles
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
    overflow: 'visible',
  },
  confettiPiece: {
    position: 'absolute',
    top: -30,
    borderRadius: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  // Unified Tip Screen Styles
  unifiedContainer: {
    flex: 1,
  },
  unifiedScrollView: {
    flex: 1,
  },
  unifiedScrollContent: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  unifiedHeader: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 24,
  },
  unifiedSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  unifiedTipIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  unifiedCategoryBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  unifiedCategoryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  unifiedTipTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  unifiedTipContent: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 24,
  },
  unifiedStepsContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
  },
  unifiedStepsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  unifiedStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  unifiedStepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  unifiedStepNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  unifiedStepText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    paddingTop: 2,
  },
  unifiedActionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  unifiedPrimaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    gap: 10,
    marginBottom: 12,
  },
  unifiedPrimaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
  },
  unifiedSecondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    gap: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  unifiedSecondaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
});
