import { View, Text, StyleSheet, ScrollView, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useRef, useEffect } from 'react';
import { useSession } from '@/context/SessionContext';

type Tip = {
  id: number;
  title: string;
  content: string;
  icon: keyof typeof Ionicons.glyphMap;
  category: string;
  steps: string[];
};

const tipsByLevel: Record<number, Tip[]> = {
  1: [
    {
      id: 1,
      title: 'Manten Tu Rutina',
      content: 'Manten tu horario regular de sueno, ejercicio y habitos alimenticios saludables para conservar tu estado de calma.',
      icon: 'calendar-outline',
      category: 'Estilo de vida',
      steps: [
        'Establece una hora fija para dormir y despertar',
        'Planifica tus comidas a horas regulares',
        'Reserva 30 minutos diarios para actividad fisica',
        'Crea una rutina matutina que te de energia',
      ],
    },
    {
      id: 2,
      title: 'Practica Mindfulness Diario',
      content: 'Incluso cuando te sientas tranquilo, la practica regular de meditacion construye resiliencia para momentos mas desafiantes.',
      icon: 'leaf-outline',
      category: 'Mindfulness',
      steps: [
        'Encuentra un lugar tranquilo y comodo',
        'Cierra los ojos y respira profundamente 3 veces',
        'Enfoca tu atencion en tu respiracion',
        'Cuando tu mente divague, gentilmente regresa al presente',
        'Practica por 5-10 minutos cada dia',
      ],
    },
    {
      id: 3,
      title: 'Mantente Conectado',
      content: 'Nutre tus relaciones y conexiones sociales. Son tu red de apoyo cuando la necesitas.',
      icon: 'people-outline',
      category: 'Social',
      steps: [
        'Contacta a un amigo o familiar hoy',
        'Programa una actividad social esta semana',
        'Escucha activamente cuando otros hablen',
        'Comparte como te sientes con alguien de confianza',
      ],
    },
  ],
  2: [
    {
      id: 1,
      title: 'Identifica Tus Desencadenantes',
      content: 'Presta atencion a lo que causa tu ansiedad leve. La conciencia es el primer paso para manejarla.',
      icon: 'search-outline',
      category: 'Autoconocimiento',
      steps: [
        'Lleva un diario de momentos ansiosos',
        'Anota que estabas haciendo cuando inicio',
        'Identifica patrones en tus desencadenantes',
        'Desarrolla estrategias especificas para cada uno',
      ],
    },
    {
      id: 2,
      title: 'Limita el Consumo de Cafeina',
      content: 'La cafeina puede amplificar los sintomas de ansiedad. Considera reducir o programar mejor tu consumo.',
      icon: 'cafe-outline',
      category: 'Dieta',
      steps: [
        'Reduce gradualmente tu consumo de cafe',
        'Evita cafeina despues del mediodia',
        'Sustituye por te herbal o agua',
        'Observa como cambia tu nivel de ansiedad',
      ],
    },
    {
      id: 3,
      title: 'Toma Descansos Regulares',
      content: 'Alejate de situaciones estresantes periodicamente. Incluso descansos de 5 minutos ayudan a reiniciar tu mente.',
      icon: 'pause-outline',
      category: 'Equilibrio',
      steps: [
        'Programa alarmas cada 90 minutos de trabajo',
        'Levantate y estira tu cuerpo',
        'Mira por la ventana o sal al exterior',
        'Respira profundamente 5 veces antes de continuar',
      ],
    },
    {
      id: 4,
      title: 'Ponte en Movimiento',
      content: 'La actividad fisica ligera libera endorfinas y ayuda a manejar los sintomas de ansiedad leve.',
      icon: 'walk-outline',
      category: 'Ejercicio',
      steps: [
        'Comienza con una caminata de 10 minutos',
        'Estira tu cuerpo al despertar',
        'Sube escaleras en lugar del elevador',
        'Baila tu cancion favorita',
      ],
    },
  ],
  3: [
    {
      id: 1,
      title: 'Desafia los Pensamientos Negativos',
      content: 'Cuando surjan pensamientos ansiosos, cuestiona su validez. Preguntate: "Este pensamiento esta basado en hechos?"',
      icon: 'bulb-outline',
      category: 'Cognitivo',
      steps: [
        'Identifica el pensamiento negativo',
        'Preguntate: "Que evidencia tengo?"',
        'Considera explicaciones alternativas',
        'Reformula el pensamiento de forma realista',
      ],
    },
    {
      id: 2,
      title: 'Crea un Ambiente Tranquilo',
      content: 'Reduce los estresores ambientales. Ordena tu espacio, usa aromas relajantes, pon musica suave.',
      icon: 'home-outline',
      category: 'Ambiente',
      steps: [
        'Ordena y limpia tu espacio',
        'Reduce el ruido o pon musica relajante',
        'Usa iluminacion suave y calida',
        'Anade plantas o elementos naturales',
        'Prueba aromaterapia con lavanda',
      ],
    },
    {
      id: 3,
      title: 'Practica la Autocompasion',
      content: 'Se amable contigo mismo. La ansiedad no es una debilidad. Tratate como tratarias a un buen amigo.',
      icon: 'heart-outline',
      category: 'Autocuidado',
      steps: [
        'Reconoce que es normal sentir ansiedad',
        'Habla contigo mismo con amabilidad',
        'Evita criticarte por sentirte ansioso',
        'Date permiso para descansar cuando lo necesites',
      ],
    },
    {
      id: 4,
      title: 'Limita el Tiempo de Pantalla',
      content: 'Reduce la exposicion a noticias y redes sociales que puedan aumentar la ansiedad.',
      icon: 'phone-portrait-outline',
      category: 'Bienestar digital',
      steps: [
        'Establece horarios especificos para redes sociales',
        'Desactiva notificaciones no esenciales',
        'Evita pantallas 1 hora antes de dormir',
        'Usa apps de bienestar para monitorear tu uso',
      ],
    },
  ],
  4: [
    {
      id: 1,
      title: 'Usa Tecnicas de Anclaje',
      content: 'Concentrate en sensaciones fisicas: pies en el suelo, manos tocando superficies. Esto te ancla al presente.',
      icon: 'footsteps-outline',
      category: 'Anclaje',
      steps: [
        'Siente tus pies firmemente en el suelo',
        'Nombra 5 cosas que puedes ver',
        'Toca diferentes texturas a tu alrededor',
        'Enfocate en tu respiracion por 1 minuto',
      ],
    },
    {
      id: 2,
      title: 'Busca Apoyo',
      content: 'Habla con alguien de confianza sobre como te sientes. La conexion reduce la intensidad de la ansiedad.',
      icon: 'chatbubbles-outline',
      category: 'Apoyo',
      steps: [
        'Identifica a alguien de confianza',
        'Dile: "Necesito hablar, estoy ansioso"',
        'Comparte como te sientes sin juzgarte',
        'Permite que te escuchen y apoyen',
      ],
    },
    {
      id: 3,
      title: 'Evita la Evitacion',
      content: 'Aunque se siente mas seguro evitar los desencadenantes, la exposicion gradual ayuda a construir tolerancia.',
      icon: 'trending-up-outline',
      category: 'Crecimiento',
      steps: [
        'Identifica lo que estas evitando',
        'Comienza con exposiciones pequenas',
        'Aumenta gradualmente la dificultad',
        'Celebra cada pequeno logro',
      ],
    },
    {
      id: 4,
      title: 'Escribelo',
      content: 'Escribir tus pensamientos ansiosos en un diario puede ayudar a externalizarlos y reducir su poder.',
      icon: 'create-outline',
      category: 'Expresion',
      steps: [
        'Toma papel y lapiz o abre una nota',
        'Escribe todo lo que sientes sin filtrar',
        'No te preocupes por la gramatica',
        'Lee lo escrito y reflexiona',
      ],
    },
    {
      id: 5,
      title: 'Considera Ayuda Profesional',
      content: 'Si la ansiedad alta es frecuente, un profesional de salud mental puede proporcionar herramientas valiosas.',
      icon: 'medical-outline',
      category: 'Profesional',
      steps: [
        'Investiga terapeutas en tu area',
        'Consulta con tu medico de cabecera',
        'Considera terapia online como opcion',
        'Da el primer paso y agenda una cita',
      ],
    },
  ],
  5: [
    {
      id: 1,
      title: 'Enfocate en la Seguridad',
      content: 'Recuerdate que estas a salvo. Los ataques de panico son intensos pero no peligrosos. Pasaran.',
      icon: 'shield-checkmark-outline',
      category: 'Seguridad',
      steps: [
        'Repite: "Estoy a salvo, esto pasara"',
        'Recuerda que un ataque de panico no te danara',
        'Busca un lugar donde te sientas seguro',
        'Respira lentamente: inhala 4, exhala 6',
      ],
    },
    {
      id: 2,
      title: 'Usa Tus Sentidos',
      content: 'Sosten hielo, huele algo fuerte, escucha musica - la entrada sensorial puede interrumpir el panico.',
      icon: 'hand-left-outline',
      category: 'Sensorial',
      steps: [
        'Sosten cubos de hielo en tus manos',
        'Huele algo fuerte como menta o limon',
        'Pon musica que te calme',
        'Salpica agua fria en tu cara',
      ],
    },
    {
      id: 3,
      title: 'Ten un Contacto de Emergencia',
      content: 'Manten a una persona de confianza en marcado rapido que pueda ayudarte en momentos severos.',
      icon: 'call-outline',
      category: 'Apoyo',
      steps: [
        'Elige a alguien de confianza',
        'Explicale tu situacion con anticipacion',
        'Guardalo en marcado rapido',
        'Acordar una palabra clave si necesitas ayuda',
      ],
    },
    {
      id: 4,
      title: 'Crea un Plan de Crisis',
      content: 'Escribe los pasos a seguir cuando llegue el panico. Tener un plan reduce el estres del momento.',
      icon: 'document-text-outline',
      category: 'Planificacion',
      steps: [
        'Escribe que hacer primero (respirar)',
        'Lista tecnicas que te han funcionado',
        'Incluye numeros de emergencia',
        'Guarda el plan en tu telefono',
      ],
    },
    {
      id: 5,
      title: 'Busca Ayuda Profesional',
      content: 'La ansiedad severa requiere apoyo profesional. No hay verguenza en buscar ayuda - demuestra fortaleza.',
      icon: 'medkit-outline',
      category: 'Profesional',
      steps: [
        'Reconoce que necesitas apoyo',
        'Llama a una linea de crisis si es urgente',
        'Agenda una cita con un profesional',
        'Considera medicacion si es recomendada',
      ],
    },
    {
      id: 6,
      title: 'Recuerda: Esto Pasara',
      content: 'La ansiedad es temporal. Incluso el panico mas intenso disminuye. Has sobrevivido cada momento dificil.',
      icon: 'sunny-outline',
      category: 'Esperanza',
      steps: [
        'Repite: "Esto es temporal"',
        'Recuerda momentos dificiles que superaste',
        'Visualiza como te sentiras cuando pase',
        'Confía en tu capacidad de superar esto',
      ],
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

const levelDescriptions: Record<number, string> = {
  1: 'Relajado y en paz. La respiracion es estable y los pensamientos son claros.',
  2: 'Ligeramente tenso. Preocupaciones menores presentes pero manejables.',
  3: 'Notablemente ansioso. El ritmo cardiaco puede aumentar, comienza la inquietud.',
  4: 'Ansiedad fuerte. Dificultad para concentrarse, pensamientos acelerados.',
  5: 'Ansiedad intensa o panico. Sentimientos abrumadores, sintomas fisicos presentes.',
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
  const level = Number(params.level) || 3;
  const tips = tipsByLevel[level] || tipsByLevel[3];
  const colors = levelColors[level] || levelColors[3];
  const levelTitle = levelTitles[level] || 'Moderate';
  const [showLevelSelection, setShowLevelSelection] = useState(false);
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);
  const [isTipExpanded, setIsTipExpanded] = useState(false);
  const { setSessionTip, endSession, startSession, clearSession } = useSession();

  const [randomTip] = useState(() => {
    const randomIndex = Math.floor(Math.random() * tips.length);
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
            <Text style={styles.title}>Selecciona un Nivel</Text>
            <Text style={styles.subtitle}>Como te sientes ahora?</Text>
          </View>
        </LinearGradient>

        <Text style={styles.sectionTitle}>
          Toca para ver detalles, luego selecciona:
        </Text>

        {Object.entries(levelTitles).map(([lvl, title]) => {
          const levelNum = Number(lvl);
          return (
            <LevelSelectCard
              key={lvl}
              levelNum={levelNum}
              title={title}
              description={levelDescriptions[levelNum]}
              icon={levelIcons[levelNum]}
              colors={levelColors[levelNum]}
              isExpanded={expandedLevel === levelNum}
              onExpand={() => handleLevelExpand(levelNum)}
              onSelect={() => handleLevelSelect(levelNum)}
            />
          );
        })}

        <Pressable style={styles.endSessionButton} onPress={handleEndSession}>
          <View style={styles.endSessionButtonContent}>
            <Ionicons name="close-circle-outline" size={24} color="#566573" />
            <Text style={styles.endSessionButtonText}>Finalizar Sesion</Text>
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
          <Text style={styles.title}>Consejo</Text>
          <Text style={styles.subtitle}>Para Ansiedad {levelTitle} (Nivel {level})</Text>
        </View>
      </LinearGradient>

      <Text style={styles.sectionTitle}>
        Aqui tienes un consejo para ti:
      </Text>

      <TipCard
        tip={randomTip}
        colors={colors}
        isExpanded={isTipExpanded}
        onPress={handleTipPress}
      />

      <Text style={styles.actionTitle}>Que deseas hacer ahora?</Text>

      <Pressable style={styles.newLevelButton} onPress={handleSelectNewLevel}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.homeButtonGradient}
        >
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.homeButtonText}>Seleccionar Nuevo Nivel</Text>
        </LinearGradient>
      </Pressable>

      <Pressable style={styles.endSessionButton} onPress={handleEndSession}>
        <View style={styles.endSessionButtonContent}>
          <Ionicons name="checkmark-circle-outline" size={24} color="#5a8c6a" />
          <Text style={styles.endSessionButtonTextGreen}>Finalizar Sesion</Text>
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
