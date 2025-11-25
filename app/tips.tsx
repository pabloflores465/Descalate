import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

type Tip = {
  id: number;
  title: string;
  content: string;
  icon: keyof typeof Ionicons.glyphMap;
  category: string;
};

const tipsByLevel: Record<number, Tip[]> = {
  1: [
    {
      id: 1,
      title: 'Mantén Tu Rutina',
      content: 'Mantén tu horario regular de sueno, ejercicio y habitos alimenticios saludables para conservar tu estado de calma.',
      icon: 'calendar-outline',
      category: 'Estilo de vida',
    },
    {
      id: 2,
      title: 'Practica Mindfulness Diario',
      content: 'Incluso cuando te sientas tranquilo, la practica regular de meditacion construye resiliencia para momentos mas desafiantes.',
      icon: 'leaf-outline',
      category: 'Mindfulness',
    },
    {
      id: 3,
      title: 'Mantente Conectado',
      content: 'Nutre tus relaciones y conexiones sociales. Son tu red de apoyo cuando la necesitas.',
      icon: 'people-outline',
      category: 'Social',
    },
  ],
  2: [
    {
      id: 1,
      title: 'Identifica Tus Desencadenantes',
      content: 'Presta atencion a lo que causa tu ansiedad leve. La conciencia es el primer paso para manejarla.',
      icon: 'search-outline',
      category: 'Autoconocimiento',
    },
    {
      id: 2,
      title: 'Limita el Consumo de Cafeina',
      content: 'La cafeina puede amplificar los sintomas de ansiedad. Considera reducir o programar mejor tu consumo.',
      icon: 'cafe-outline',
      category: 'Dieta',
    },
    {
      id: 3,
      title: 'Toma Descansos Regulares',
      content: 'Alejate de situaciones estresantes periodicamente. Incluso descansos de 5 minutos ayudan a reiniciar tu mente.',
      icon: 'pause-outline',
      category: 'Equilibrio',
    },
    {
      id: 4,
      title: 'Ponte en Movimiento',
      content: 'La actividad fisica ligera libera endorfinas y ayuda a manejar los sintomas de ansiedad leve.',
      icon: 'walk-outline',
      category: 'Ejercicio',
    },
  ],
  3: [
    {
      id: 1,
      title: 'Desafia los Pensamientos Negativos',
      content: 'Cuando surjan pensamientos ansiosos, cuestiona su validez. Preguntate: "Este pensamiento esta basado en hechos?"',
      icon: 'bulb-outline',
      category: 'Cognitivo',
    },
    {
      id: 2,
      title: 'Crea un Ambiente Tranquilo',
      content: 'Reduce los estresores ambientales. Ordena tu espacio, usa aromas relajantes, pon musica suave.',
      icon: 'home-outline',
      category: 'Ambiente',
    },
    {
      id: 3,
      title: 'Practica la Autocompasion',
      content: 'Se amable contigo mismo. La ansiedad no es una debilidad. Tratate como tratarias a un buen amigo.',
      icon: 'heart-outline',
      category: 'Autocuidado',
    },
    {
      id: 4,
      title: 'Limita el Tiempo de Pantalla',
      content: 'Reduce la exposicion a noticias y redes sociales que puedan aumentar la ansiedad. Establece horarios especificos para revisar.',
      icon: 'phone-portrait-outline',
      category: 'Bienestar digital',
    },
  ],
  4: [
    {
      id: 1,
      title: 'Usa Tecnicas de Anclaje',
      content: 'Concentrate en sensaciones fisicas: pies en el suelo, manos tocando superficies. Esto te ancla al presente.',
      icon: 'footsteps-outline',
      category: 'Anclaje',
    },
    {
      id: 2,
      title: 'Busca Apoyo',
      content: 'Habla con alguien de confianza sobre como te sientes. La conexion reduce la intensidad de la ansiedad.',
      icon: 'chatbubbles-outline',
      category: 'Apoyo',
    },
    {
      id: 3,
      title: 'Evita la Evitacion',
      content: 'Aunque se siente mas seguro evitar los desencadenantes de ansiedad, la exposicion gradual ayuda a construir tolerancia con el tiempo.',
      icon: 'trending-up-outline',
      category: 'Crecimiento',
    },
    {
      id: 4,
      title: 'Escribelo',
      content: 'Escribir tus pensamientos ansiosos en un diario puede ayudar a externalizarlos y reducir su poder sobre ti.',
      icon: 'create-outline',
      category: 'Expresion',
    },
    {
      id: 5,
      title: 'Considera Ayuda Profesional',
      content: 'Si la ansiedad alta es frecuente, hablar con un profesional de salud mental puede proporcionar herramientas valiosas.',
      icon: 'medical-outline',
      category: 'Profesional',
    },
  ],
  5: [
    {
      id: 1,
      title: 'Enfocate en la Seguridad Primero',
      content: 'Recuerdate que estas a salvo. Los ataques de panico son intensos pero no peligrosos. Pasaran.',
      icon: 'shield-checkmark-outline',
      category: 'Seguridad',
    },
    {
      id: 2,
      title: 'Usa Tus Sentidos',
      content: 'Sostén hielo, huele algo fuerte, escucha musica alta - la entrada sensorial fuerte puede interrumpir el panico.',
      icon: 'hand-left-outline',
      category: 'Sensorial',
    },
    {
      id: 3,
      title: 'Ten un Contacto de Emergencia',
      content: 'Mantén a una persona de confianza en marcado rapido que pueda ayudarte en momentos severos.',
      icon: 'call-outline',
      category: 'Apoyo',
    },
    {
      id: 4,
      title: 'Crea un Plan de Crisis',
      content: 'Escribe los pasos a seguir cuando llegue el panico. Tener un plan reduce el estres de tomar decisiones en el momento.',
      icon: 'document-text-outline',
      category: 'Planificacion',
    },
    {
      id: 5,
      title: 'Busca Ayuda Profesional',
      content: 'La ansiedad severa requiere apoyo profesional. No hay vergüenza en buscar ayuda - demuestra fortaleza.',
      icon: 'medkit-outline',
      category: 'Profesional',
    },
    {
      id: 6,
      title: 'Recuerda: Esto Pasara',
      content: 'La ansiedad es temporal. Incluso el panico mas intenso disminuye. Has sobrevivido cada momento dificil hasta ahora.',
      icon: 'sunny-outline',
      category: 'Esperanza',
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

function TipCard({ tip, colors }: { tip: Tip; colors: string[] }) {
  return (
    <View style={styles.tipCard}>
      <View style={styles.tipCardContent}>
        <View style={styles.tipHeader}>
          <View style={[styles.tipIconContainer, { backgroundColor: colors[0] + '20' }]}>
            <Ionicons name={tip.icon} size={24} color={colors[0]} />
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: colors[0] + '15' }]}>
            <Text style={[styles.categoryText, { color: colors[0] }]}>{tip.category}</Text>
          </View>
        </View>
        <Text style={styles.tipTitle}>{tip.title}</Text>
        <Text style={styles.tipContent}>{tip.content}</Text>
      </View>
    </View>
  );
}

export default function TipsScreen() {
  const params = useLocalSearchParams();
  const level = Number(params.level) || 3;
  const tips = tipsByLevel[level] || tipsByLevel[3];
  const colors = levelColors[level] || levelColors[3];
  const levelTitle = levelTitles[level] || 'Moderate';

  const handleGoBack = () => {
    router.back();
  };

  const handleGoHome = () => {
    router.replace('/(tabs)/home');
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
          <Ionicons name="bulb" size={48} color="rgba(255,255,255,0.9)" />
          <Text style={styles.title}>Consejos y Recomendaciones</Text>
          <Text style={styles.subtitle}>Para Ansiedad {levelTitle} (Nivel {level})</Text>
        </View>
      </LinearGradient>
      <Text style={styles.sectionTitle}>
        Aqui tienes algunos consejos utiles para manejar tu ansiedad:
      </Text>
    </>
  );

  const renderFooter = () => (
    <>
      <View style={styles.encouragementCard}>
        <Ionicons name="heart" size={32} color={colors[0]} />
        <Text style={styles.encouragementTitle}>Lo estas haciendo muy bien!</Text>
        <Text style={styles.encouragementText}>
          Recuerda, manejar la ansiedad es un viaje. Cada pequeno paso cuenta.
          Se paciente contigo mismo y celebra tu progreso.
        </Text>
      </View>

      <Pressable style={styles.homeButton} onPress={handleGoHome}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.homeButtonGradient}
        >
          <Ionicons name="home" size={20} color="#fff" />
          <Text style={styles.homeButtonText}>Volver al Inicio</Text>
        </LinearGradient>
      </Pressable>
    </>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      data={tips}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => <TipCard tip={item} colors={colors} />}
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
  },
  tipCardContent: {
    padding: 16,
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
  tipContent: {
    fontSize: 14,
    color: '#7F8C8D',
    lineHeight: 22,
  },
  encouragementCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginTop: 8,
    marginBottom: 20,
    marginHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  encouragementTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
    marginTop: 12,
    marginBottom: 8,
  },
  encouragementText: {
    fontSize: 14,
    color: '#7F8C8D',
    lineHeight: 22,
    textAlign: 'center',
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
});
