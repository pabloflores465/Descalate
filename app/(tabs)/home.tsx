import { View, Text, StyleSheet, Pressable, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type AnxietyLevel = {
  level: number;
  title: string;
  description: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const anxietyLevels: AnxietyLevel[] = [
  {
    level: 1,
    title: 'Calm',
    description: 'Relaxed and at peace. Breathing is steady and thoughts are clear.',
    color: '#2ECC71',
    icon: 'happy-outline',
  },
  {
    level: 2,
    title: 'Mild',
    description: 'Slightly tense. Minor worries present but manageable.',
    color: '#5dba77',
    icon: 'refresh-outline',
  },
  {
    level: 3,
    title: 'Moderate',
    description: 'Noticeably anxious. Heart rate may increase, restlessness begins.',
    color: '#F39C12',
    icon: 'warning-outline',
  },
  {
    level: 4,
    title: 'High',
    description: 'Strong anxiety. Difficulty concentrating, racing thoughts.',
    color: '#E67E22',
    icon: 'alert-circle-outline',
  },
  {
    level: 5,
    title: 'Severe',
    description: 'Intense anxiety or panic. Overwhelming feelings, physical symptoms present.',
    color: '#E74C3C',
    icon: 'flash-outline',
  },
];

function AnxietyCard({
  level,
  isExpanded,
  onPress
}: {
  level: AnxietyLevel;
  isExpanded: boolean;
  onPress: () => void;
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
              backgroundColor: level.color,
              transform: [{ scale: scaleAnim }],
            },
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
                size={32}
                color="#fff"
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="pulse" size={40} color="#5a8c6a" />
        <Text style={styles.title}>Anxiety Levels</Text>
        <Text style={styles.subtitle}>Tap to explore</Text>
      </View>

      <View style={styles.cardsContainer}>
        {anxietyLevels.slice().reverse().map((level) => (
          <AnxietyCard
            key={level.level}
            level={level}
            isExpanded={expandedLevel === level.level}
            onPress={() => handleCardPress(level.level)}
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
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#F5F3ED',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#2C3E50',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 6,
    fontWeight: '500',
  },
  cardsContainer: {
    flex: 1,
    padding: 16,
    gap: 8,
  },
  cardWrapper: {
    flex: 1,
    minHeight: 80,
    maxHeight: 100,
  },
  cardWrapperExpanded: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    bottom: 0,
    zIndex: 1000,
    minHeight: 'auto',
    maxHeight: 'none',
  },
  card: {
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
  },
  cardExpanded: {
    padding: 40,
    borderRadius: 28,
    justifyContent: 'flex-start',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  levelBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  levelNumber: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  levelNumberExpanded: {
    fontSize: 22,
  },
  cardTitle: {
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 0.4,
    fontSize: 20,
  },
  cardTitleExpanded: {
    fontSize: 44,
    marginTop: 20,
    marginBottom: 24,
  },
  descriptionContainer: {
    marginTop: 12,
  },
  cardDescription: {
    color: '#fff',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '500',
    opacity: 0.95,
  },
});
