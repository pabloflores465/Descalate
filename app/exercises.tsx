import { View, Text, StyleSheet, FlatList, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useRef, useEffect } from 'react';
import { useSession } from '@/context/SessionContext';

type Exercise = {
  id: number;
  title: string;
  description: string;
  duration: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const exercisesByLevel: Record<number, Exercise[]> = {
  1: [
    {
      id: 1,
      title: 'Respiracion Consciente',
      description: 'Concentrate en tu respiracion por 5 minutos. Inhala profundamente por la nariz, manten por 4 segundos, luego exhala lentamente por la boca.',
      duration: '5 min',
      icon: 'leaf-outline',
    },
    {
      id: 2,
      title: 'Diario de Gratitud',
      description: 'Escribe 3 cosas por las que estas agradecido hoy. Esto ayuda a mantener tu estado de calma.',
      duration: '10 min',
      icon: 'book-outline',
    },
    {
      id: 3,
      title: 'Estiramiento Suave',
      description: 'Estiramientos suaves para mantener tu cuerpo relajado. Enfocate en cuello, hombros y espalda.',
      duration: '10 min',
      icon: 'body-outline',
    },
  ],
  2: [
    {
      id: 1,
      title: 'Respiracion Cuadrada',
      description: 'Inhala por 4 tiempos, manten por 4 tiempos, exhala por 4 tiempos, manten por 4 tiempos. Repite 5 veces.',
      duration: '5 min',
      icon: 'square-outline',
    },
    {
      id: 2,
      title: 'Relajacion Muscular Progresiva',
      description: 'Tensa y relaja cada grupo muscular comenzando desde los dedos de los pies hasta la cabeza.',
      duration: '15 min',
      icon: 'fitness-outline',
    },
    {
      id: 3,
      title: 'Caminata Consciente',
      description: 'Da un paseo lento, prestando atencion a cada paso y a tu entorno.',
      duration: '15 min',
      icon: 'walk-outline',
    },
  ],
  3: [
    {
      id: 1,
      title: 'Tecnica de Respiracion 4-7-8',
      description: 'Inhala por 4 segundos, manten por 7 segundos, exhala por 8 segundos. Esto activa tu sistema nervioso parasimpatico.',
      duration: '5 min',
      icon: 'pulse-outline',
    },
    {
      id: 2,
      title: 'Meditacion de Escaneo Corporal',
      description: 'Acuestate y escanea mentalmente tu cuerpo de la cabeza a los pies, notando y liberando la tension.',
      duration: '15 min',
      icon: 'body-outline',
    },
    {
      id: 3,
      title: 'Ejercicio de Anclaje (5-4-3-2-1)',
      description: 'Nombra 5 cosas que ves, 4 que escuchas, 3 que puedes tocar, 2 que hueles y 1 que saboreas.',
      duration: '5 min',
      icon: 'earth-outline',
    },
  ],
  4: [
    {
      id: 1,
      title: 'Respiracion Diafragmatica Profunda',
      description: 'Coloca una mano en tu pecho y otra en tu abdomen. Respira profundo para que solo tu abdomen se eleve.',
      duration: '10 min',
      icon: 'contract-outline',
    },
    {
      id: 2,
      title: 'Visualizacion Guiada',
      description: 'Cierra los ojos e imagina un lugar pacifico en detalle. Involucra todos tus sentidos en esta visualizacion.',
      duration: '15 min',
      icon: 'cloudy-outline',
    },
    {
      id: 3,
      title: 'Liberacion de Actividad Fisica',
      description: 'Haz saltos, corre en el lugar o cualquier actividad fisica para liberar la tension y adrenalina acumuladas.',
      duration: '10 min',
      icon: 'barbell-outline',
    },
    {
      id: 4,
      title: 'Tecnica del Agua Fria',
      description: 'Salpica agua fria en tu cara o sostén cubos de hielo. Esto activa tu reflejo de inmersion y reduce el ritmo cardiaco.',
      duration: '2 min',
      icon: 'water-outline',
    },
  ],
  5: [
    {
      id: 1,
      title: 'Anclaje de Emergencia',
      description: 'Presiona tus pies firmemente contra el suelo. Aprieta una pelota antiestrés o un cubo de hielo. Concentrate en las sensaciones fisicas.',
      duration: '2 min',
      icon: 'hand-left-outline',
    },
    {
      id: 2,
      title: 'Tecnica TIPP',
      description: 'Temperatura (agua fria), ejercicio Intenso, respiracion Pausada y relajacion Progresiva.',
      duration: '10 min',
      icon: 'thermometer-outline',
    },
    {
      id: 3,
      title: 'Visualizacion del Lugar Seguro',
      description: 'Cierra los ojos e imagina tu lugar mas seguro y reconfortante. Describelo en detalle para ti mismo.',
      duration: '5 min',
      icon: 'home-outline',
    },
    {
      id: 4,
      title: 'Abrazo de Mariposa',
      description: 'Cruza los brazos sobre tu pecho, manos en los hombros. Alterna golpecitos en cada hombro mientras respiras lentamente.',
      duration: '5 min',
      icon: 'heart-outline',
    },
  ],
};

const levelColors: Record<number, string[]> = {
  1: ['#5a67d8', '#6b46c1'],
  2: ['#2d9a6e', '#2b7a9b'],
  3: ['#d97706', '#1e4e6d'],
  4: ['#c026d3', '#dc2626'],
  5: ['#be185d', '#ea580c'],
};

const levelTitles: Record<number, string> = {
  1: 'Calma',
  2: 'Leve',
  3: 'Moderada',
  4: 'Alta',
  5: 'Severa',
};

function ExerciseCard({
  exercise,
  colors,
  isSelected,
  isExpanded,
  onSelect,
  onExpand
}: {
  exercise: Exercise;
  colors: string[];
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onExpand: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(20)).current;
  const checkScaleAnim = useRef(new Animated.Value(1)).current;

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

  useEffect(() => {
    if (isSelected) {
      Animated.sequence([
        Animated.spring(checkScaleAnim, {
          toValue: 1.3,
          friction: 3,
          tension: 200,
          useNativeDriver: true,
        }),
        Animated.spring(checkScaleAnim, {
          toValue: 1,
          friction: 3,
          tension: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isSelected]);

  return (
    <View
      style={[
        styles.exerciseCardWrapper,
        isExpanded && styles.exerciseCardWrapperExpanded,
      ]}
    >
      <Pressable onPress={onExpand} style={styles.exerciseCardPressable}>
        <LinearGradient
          colors={isExpanded ? colors : ['#ffffff', '#ffffff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.exerciseCard,
            isExpanded && styles.exerciseCardExpanded,
          ]}
        >
          <View style={styles.exerciseCardContent}>
            <View
              style={[
                styles.exerciseIconContainer,
                isExpanded && styles.exerciseIconContainerExpanded,
                {
                  backgroundColor: isExpanded ? 'rgba(255,255,255,0.25)' : colors[0] + '20',
                }
              ]}
            >
              <Ionicons
                name={exercise.icon}
                size={isExpanded ? 48 : 28}
                color={isExpanded ? '#fff' : colors[0]}
              />
            </View>
            <View style={styles.exerciseInfo}>
              <Text style={[
                styles.exerciseTitle,
                isExpanded && styles.exerciseTitleExpanded
              ]}>
                {exercise.title}
              </Text>
              {!isExpanded && (
                <View style={styles.durationContainer}>
                  <Ionicons name="time-outline" size={14} color="#566573" />
                  <Text style={styles.durationText}>{exercise.duration}</Text>
                </View>
              )}
            </View>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              style={styles.selectButtonContainer}
            >
              <Animated.View
                style={[
                  styles.selectCircle,
                  isSelected && { backgroundColor: isExpanded ? '#fff' : colors[0], borderColor: isExpanded ? '#fff' : colors[0] },
                  isExpanded && !isSelected && { borderColor: 'rgba(255,255,255,0.6)' },
                  { transform: [{ scale: checkScaleAnim }] },
                ]}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={18} color={isExpanded ? colors[0] : '#fff'} />
                )}
              </Animated.View>
            </Pressable>
          </View>

          {isExpanded && (
            <Animated.View
              style={[
                styles.expandedContent,
                {
                  opacity: contentOpacity,
                  transform: [{ translateY: contentTranslate }],
                },
              ]}
            >
              <View style={styles.durationBadge}>
                <Ionicons name="time-outline" size={16} color="#fff" />
                <Text style={styles.durationBadgeText}>{exercise.duration}</Text>
              </View>
              <Text style={styles.exerciseDescriptionExpanded}>{exercise.description}</Text>
            </Animated.View>
          )}
        </LinearGradient>
      </Pressable>
    </View>
  );
}

export default function ExercisesScreen() {
  const params = useLocalSearchParams();
  const level = Number(params.level) || 3;
  const exercises = exercisesByLevel[level] || exercisesByLevel[3];
  const colors = levelColors[level] || levelColors[3];
  const levelTitle = levelTitles[level] || 'Moderate';
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<number[]>([]);
  const [expandedExerciseId, setExpandedExerciseId] = useState<number | null>(null);
  const { setSelectedExercises } = useSession();

  const handleSelectExercise = (exerciseId: number) => {
    setSelectedExerciseIds(prev => {
      if (prev.includes(exerciseId)) {
        return prev.filter(id => id !== exerciseId);
      } else {
        return [...prev, exerciseId];
      }
    });
  };

  const handleExpandExercise = (exerciseId: number) => {
    setExpandedExerciseId(prev => prev === exerciseId ? null : exerciseId);
  };

  const handleContinueToTips = () => {
    if (selectedExerciseIds.length === 0) {
      return;
    }
    const selectedExercisesData = exercises
      .filter(ex => selectedExerciseIds.includes(ex.id))
      .map(ex => ({ id: ex.id, title: ex.title, duration: ex.duration }));
    setSelectedExercises(selectedExercisesData);
    router.push({
      pathname: '/tips',
      params: { level },
    });
  };

  const handleGoBack = () => {
    router.back();
  };

  const renderHeader = () => (
    <>
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
          <Ionicons name="fitness" size={48} color="rgba(255,255,255,0.9)" />
          <Text style={styles.title}>Ejercicios Recomendados</Text>
          <Text style={styles.subtitle}>Para Ansiedad {levelTitle} (Nivel {level})</Text>
        </View>
      </LinearGradient>
      <Text style={styles.sectionTitle}>
        Selecciona un ejercicio para continuar:
      </Text>
    </>
  );

  const renderFooter = () => (
    <Pressable
      style={[
        styles.continueButton,
        selectedExerciseIds.length === 0 && styles.continueButtonDisabled
      ]}
      onPress={handleContinueToTips}
      disabled={selectedExerciseIds.length === 0}
    >
      <LinearGradient
        colors={selectedExerciseIds.length > 0 ? colors : ['#cccccc', '#999999']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.continueButtonGradient}
      >
        <Text style={styles.continueButtonText}>
          {selectedExerciseIds.length > 0
            ? `Continuar con ${selectedExerciseIds.length} ejercicio${selectedExerciseIds.length > 1 ? 's' : ''}`
            : 'Selecciona al menos un ejercicio'}
        </Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </LinearGradient>
    </Pressable>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      data={exercises}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <ExerciseCard
          exercise={item}
          colors={colors}
          isSelected={selectedExerciseIds.includes(item.id)}
          isExpanded={expandedExerciseId === item.id}
          onSelect={() => handleSelectExercise(item.id)}
          onExpand={() => handleExpandExercise(item.id)}
        />
      )}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
      showsVerticalScrollIndicator={true}
      bounces={true}
    />
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
  exerciseCardWrapper: {
    marginBottom: 12,
    marginHorizontal: 20,
  },
  exerciseCardWrapperExpanded: {
    marginBottom: 16,
  },
  exerciseCardPressable: {
    flex: 1,
  },
  exerciseCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  exerciseCardExpanded: {
    borderRadius: 24,
    padding: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  exerciseCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  exerciseIconContainerExpanded: {
    width: 80,
    height: 80,
    borderRadius: 24,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2C3E50',
  },
  exerciseTitleExpanded: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '800',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  durationText: {
    fontSize: 13,
    color: '#566573',
    fontWeight: '500',
  },
  selectButtonContainer: {
    padding: 8,
  },
  selectCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  expandedContent: {
    marginTop: 20,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: 16,
  },
  durationBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseDescriptionExpanded: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
    fontWeight: '500',
  },
  continueButton: {
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 8,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
});
