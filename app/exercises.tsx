import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

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
  1: ['#667eea', '#764ba2'],
  2: ['#84fab0', '#8fd3f4'],
  3: ['#ffd89b', '#19547b'],
  4: ['#f093fb', '#f5576c'],
  5: ['#fa709a', '#fee140'],
};

const levelTitles: Record<number, string> = {
  1: 'Calma',
  2: 'Leve',
  3: 'Moderada',
  4: 'Alta',
  5: 'Severa',
};

function ExerciseCard({ exercise, colors }: { exercise: Exercise; colors: string[] }) {
  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseCardContent}>
        <View style={[styles.exerciseIconContainer, { backgroundColor: colors[0] + '20' }]}>
          <Ionicons name={exercise.icon} size={28} color={colors[0]} />
        </View>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseTitle}>{exercise.title}</Text>
          <Text style={styles.exerciseDescription}>{exercise.description}</Text>
          <View style={styles.durationContainer}>
            <Ionicons name="time-outline" size={14} color="#7F8C8D" />
            <Text style={styles.durationText}>{exercise.duration}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function ExercisesScreen() {
  const params = useLocalSearchParams();
  const level = Number(params.level) || 3;
  const exercises = exercisesByLevel[level] || exercisesByLevel[3];
  const colors = levelColors[level] || levelColors[3];
  const levelTitle = levelTitles[level] || 'Moderate';

  const handleContinueToTips = () => {
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
        Prueba estos ejercicios para ayudar a manejar tu ansiedad:
      </Text>
    </>
  );

  const renderFooter = () => (
    <Pressable style={styles.continueButton} onPress={handleContinueToTips}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.continueButtonGradient}
      >
        <Text style={styles.continueButtonText}>Continuar a Consejos</Text>
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
      renderItem={({ item }) => <ExerciseCard exercise={item} colors={colors} />}
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
    color: '#7F8C8D',
    marginBottom: 20,
    marginTop: 20,
    marginHorizontal: 20,
    textAlign: 'center',
  },
  exerciseCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  exerciseCardContent: {
    flexDirection: 'row',
    padding: 16,
  },
  exerciseIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 6,
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    lineHeight: 20,
    marginBottom: 8,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 13,
    color: '#7F8C8D',
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
});
