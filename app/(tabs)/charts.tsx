import { View, Text, StyleSheet, ScrollView, Dimensions, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, PieChart, LineChart } from 'react-native-gifted-charts';
import { useState, useCallback } from 'react';
import * as SQLite from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const SCREEN_WIDTH = Dimensions.get('window').width;

type Session = {
  id: number;
  anxiety_level: number;
  selected_exercises: string | null;
  tip_title: string | null;
  tip_category: string | null;
  duration_seconds: number | null;
  created_at: string;
};

type BarData = {
  value: number;
  label: string;
  frontColor: string;
};

type PieData = {
  value: number;
  color: string;
  text: string;
  label: string;
};

type LineData = {
  value: number;
  label?: string;
  dataPointText?: string;
};

const levelColors: Record<number, string> = {
  1: '#5a67d8',
  2: '#2d9a6e',
  3: '#d97706',
  4: '#c026d3',
  5: '#be185d',
};

const levelNames: Record<number, string> = {
  1: 'Calma',
  2: 'Leve',
  3: 'Moderada',
  4: 'Alta',
  5: 'Severa',
};

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

export default function ChartsScreen() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalSessions: 0,
    averageLevel: 0,
    totalExercises: 0,
    averageDuration: 0,
    mostCommonLevel: 0,
    sessionsThisWeek: 0,
  });
  const [levelDistribution, setLevelDistribution] = useState<PieData[]>([]);
  const [weeklyData, setWeeklyData] = useState<BarData[]>([]);
  const [monthlyData, setMonthlyData] = useState<LineData[]>([]);
  const [yearlyData, setYearlyData] = useState<LineData[]>([]);
  const [topExercises, setTopExercises] = useState<{ name: string; count: number }[]>([]);
  const [topCategories, setTopCategories] = useState<{ name: string; count: number }[]>([]);

  const loadData = useCallback(async () => {
    try {
      const db = await SQLite.openDatabaseAsync('descalate.db');

      const sessionRows = await db.getAllAsync<Session>(
        `SELECT * FROM sessions ORDER BY created_at DESC`
      );

      if (!sessionRows || sessionRows.length === 0) {
        setSessions([]);
        setStats({
          totalSessions: 0,
          averageLevel: 0,
          totalExercises: 0,
          averageDuration: 0,
          mostCommonLevel: 0,
          sessionsThisWeek: 0,
        });
        setLevelDistribution([]);
        setWeeklyData([]);
        setMonthlyData([]);
        setYearlyData([]);
        setTopExercises([]);
        setTopCategories([]);
        return;
      }

      setSessions(sessionRows);

      const totalSessions = sessionRows.length;
      const averageLevel = sessionRows.reduce((sum, s) => sum + s.anxiety_level, 0) / totalSessions;

      let totalExercises = 0;
      const exerciseCounts: Record<string, number> = {};
      sessionRows.forEach(session => {
        if (session.selected_exercises) {
          try {
            const exercises = JSON.parse(session.selected_exercises) as { title: string }[];
            totalExercises += exercises.length;
            exercises.forEach(ex => {
              exerciseCounts[ex.title] = (exerciseCounts[ex.title] || 0) + 1;
            });
          } catch {
            // Ignore parsing errors
          }
        }
      });

      const categoryCounts: Record<string, number> = {};
      sessionRows.forEach(session => {
        if (session.tip_category) {
          categoryCounts[session.tip_category] = (categoryCounts[session.tip_category] || 0) + 1;
        }
      });

      const validDurations = sessionRows.filter(s => s.duration_seconds !== null && s.duration_seconds > 0);
      const averageDuration = validDurations.length > 0
        ? validDurations.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / validDurations.length
        : 0;

      const levelCounts: Record<number, number> = {};
      sessionRows.forEach(session => {
        levelCounts[session.anxiety_level] = (levelCounts[session.anxiety_level] || 0) + 1;
      });
      const mostCommonLevel = Object.entries(levelCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0];

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const sessionsThisWeek = sessionRows.filter(s => new Date(s.created_at) >= oneWeekAgo).length;

      setStats({
        totalSessions,
        averageLevel: Math.round(averageLevel * 10) / 10,
        totalExercises,
        averageDuration: Math.round(averageDuration),
        mostCommonLevel: Number(mostCommonLevel) || 0,
        sessionsThisWeek,
      });

      const pieData: PieData[] = Object.entries(levelCounts).map(([level, count]) => ({
        value: count,
        color: levelColors[Number(level)] || '#999',
        text: `${Math.round((count / totalSessions) * 100)}%`,
        label: levelNames[Number(level)] || `Nivel ${level}`,
      }));
      setLevelDistribution(pieData);

      const last7Days: BarData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const daySessions = sessionRows.filter(s => s.created_at.startsWith(dateStr));
        const avgLevel = daySessions.length > 0
          ? daySessions.reduce((sum, s) => sum + s.anxiety_level, 0) / daySessions.length
          : 0;
        last7Days.push({
          value: Math.round(avgLevel * 10) / 10,
          label: `${date.getDate()}/${date.getMonth() + 1}`,
          frontColor: avgLevel > 0 ? levelColors[Math.round(avgLevel)] || '#5a8c6a' : '#E0E0E0',
        });
      }
      setWeeklyData(last7Days);

      // Monthly data - last 6 months
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const last6Months: LineData[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.getMonth();
        const year = date.getFullYear();
        const monthSessions = sessionRows.filter(s => {
          const sessionDate = new Date(s.created_at);
          return sessionDate.getMonth() === month && sessionDate.getFullYear() === year;
        });
        const avgLevel = monthSessions.length > 0
          ? monthSessions.reduce((sum, s) => sum + s.anxiety_level, 0) / monthSessions.length
          : 0;
        last6Months.push({
          value: Math.round(avgLevel * 10) / 10,
          label: monthNames[month],
          dataPointText: avgLevel > 0 ? avgLevel.toFixed(1) : '',
        });
      }
      setMonthlyData(last6Months);

      // Yearly data - last 3 years
      const last3Years: LineData[] = [];
      const currentYear = new Date().getFullYear();
      for (let i = 2; i >= 0; i--) {
        const year = currentYear - i;
        const yearSessions = sessionRows.filter(s => {
          const sessionDate = new Date(s.created_at);
          return sessionDate.getFullYear() === year;
        });
        const avgLevel = yearSessions.length > 0
          ? yearSessions.reduce((sum, s) => sum + s.anxiety_level, 0) / yearSessions.length
          : 0;
        last3Years.push({
          value: Math.round(avgLevel * 10) / 10,
          label: year.toString(),
          dataPointText: avgLevel > 0 ? avgLevel.toFixed(1) : '',
        });
      }
      setYearlyData(last3Years);

      const topEx = Object.entries(exerciseCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));
      setTopExercises(topEx);

      const topCat = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));
      setTopCategories(topCat);

    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const hasData = sessions.length > 0;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Ionicons name="stats-chart" size={48} color="#5a8c6a" />
        <Text style={styles.title}>Estadisticas</Text>
        <Text style={styles.subtitle}>Tu historial de sesiones</Text>
      </View>

      {!hasData ? (
        <View style={styles.noDataContainer}>
          <Ionicons name="analytics-outline" size={80} color="#BDC3C7" />
          <Text style={styles.noDataTitle}>Sin datos aun</Text>
          <Text style={styles.noDataText}>
            Completa tu primera sesion para ver tus estadisticas aqui
          </Text>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.statCardPrimary]}>
              <LinearGradient
                colors={['#5a8c6a', '#4a7c5a']}
                style={styles.statGradient}
              >
                <Ionicons name="layers-outline" size={28} color="#fff" />
                <Text style={styles.statNumberWhite}>{stats.totalSessions}</Text>
                <Text style={styles.statLabelWhite}>Sesiones Totales</Text>
              </LinearGradient>
            </View>

            <View style={[styles.statCard, styles.statCardSecondary]}>
              <Ionicons name="calendar-outline" size={28} color="#5a67d8" />
              <Text style={styles.statNumber}>{stats.sessionsThisWeek}</Text>
              <Text style={styles.statLabel}>Esta Semana</Text>
            </View>

            <View style={[styles.statCard, styles.statCardSecondary]}>
              <Ionicons name="fitness-outline" size={28} color="#2d9a6e" />
              <Text style={styles.statNumber}>{stats.totalExercises}</Text>
              <Text style={styles.statLabel}>Ejercicios</Text>
            </View>

            <View style={[styles.statCard, styles.statCardSecondary]}>
              <Ionicons name="time-outline" size={28} color="#d97706" />
              <Text style={styles.statNumber}>{formatDuration(stats.averageDuration)}</Text>
              <Text style={styles.statLabel}>Tiempo Promedio</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Nivel Promedio</Text>
              <View style={[styles.levelBadge, { backgroundColor: levelColors[Math.round(stats.averageLevel)] + '20' }]}>
                <Text style={[styles.levelBadgeText, { color: levelColors[Math.round(stats.averageLevel)] }]}>
                  {levelNames[Math.round(stats.averageLevel)] || 'N/A'}
                </Text>
              </View>
            </View>
            <View style={styles.averageLevelContainer}>
              <Text style={[styles.averageLevelNumber, { color: levelColors[Math.round(stats.averageLevel)] }]}>
                {stats.averageLevel.toFixed(1)}
              </Text>
              <View style={styles.levelScale}>
                {[1, 2, 3, 4, 5].map(level => (
                  <View
                    key={level}
                    style={[
                      styles.levelDot,
                      {
                        backgroundColor: level <= Math.round(stats.averageLevel)
                          ? levelColors[level]
                          : '#E0E0E0',
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Tendencia Semanal</Text>
              <Ionicons name="calendar-outline" size={24} color="#5a8c6a" />
            </View>
            <Text style={styles.chartSubtitle}>Nivel promedio de ansiedad - ultimos 7 dias</Text>
            <View style={styles.chartWrapper}>
              <LineChart
                data={weeklyData.map(d => ({ value: d.value, label: d.label }))}
                width={SCREEN_WIDTH - 100}
                height={150}
                spacing={40}
                initialSpacing={15}
                color="#5a67d8"
                thickness={3}
                hideDataPoints={false}
                dataPointsColor="#5a67d8"
                dataPointsRadius={5}
                xAxisColor="#E0E0E0"
                yAxisColor="#E0E0E0"
                yAxisTextStyle={styles.axisText}
                xAxisLabelTextStyle={styles.axisText}
                hideRules
                yAxisThickness={0}
                xAxisThickness={1}
                noOfSections={5}
                maxValue={5}
                yAxisOffset={0}
                curved
                areaChart
                startFillColor="rgba(90, 103, 216, 0.3)"
                endFillColor="rgba(90, 103, 216, 0.01)"
                isAnimated
                animationDuration={600}
              />
            </View>
          </View>

          {monthlyData.some(d => d.value > 0) && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Tendencia Mensual</Text>
                <Ionicons name="trending-up" size={24} color="#5a8c6a" />
              </View>
              <Text style={styles.chartSubtitle}>Nivel promedio de ansiedad - ultimos 6 meses</Text>
              <View style={styles.chartWrapper}>
                <LineChart
                  data={monthlyData}
                  width={SCREEN_WIDTH - 100}
                  height={180}
                  spacing={50}
                  initialSpacing={20}
                  color="#5a8c6a"
                  thickness={3}
                  hideDataPoints={false}
                  dataPointsColor="#5a8c6a"
                  dataPointsRadius={6}
                  textColor="#7F8C8D"
                  textFontSize={11}
                  textShiftY={-8}
                  textShiftX={-5}
                  xAxisColor="#E0E0E0"
                  yAxisColor="#E0E0E0"
                  yAxisTextStyle={styles.axisText}
                  xAxisLabelTextStyle={styles.axisText}
                  hideRules
                  yAxisThickness={0}
                  xAxisThickness={1}
                  noOfSections={5}
                  maxValue={5}
                  yAxisOffset={0}
                  curved
                  areaChart
                  startFillColor="rgba(90, 140, 106, 0.3)"
                  endFillColor="rgba(90, 140, 106, 0.01)"
                  isAnimated
                  animationDuration={800}
                />
              </View>
            </View>
          )}

          {yearlyData.some(d => d.value > 0) && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Tendencia Anual</Text>
                <Ionicons name="analytics" size={24} color="#5a8c6a" />
              </View>
              <Text style={styles.chartSubtitle}>Nivel promedio de ansiedad por ano</Text>
              <View style={styles.chartWrapper}>
                <LineChart
                  data={yearlyData}
                  width={SCREEN_WIDTH - 100}
                  height={180}
                  spacing={80}
                  initialSpacing={40}
                  color="#c026d3"
                  thickness={3}
                  hideDataPoints={false}
                  dataPointsColor="#c026d3"
                  dataPointsRadius={8}
                  textColor="#7F8C8D"
                  textFontSize={12}
                  textShiftY={-10}
                  textShiftX={-8}
                  xAxisColor="#E0E0E0"
                  yAxisColor="#E0E0E0"
                  yAxisTextStyle={styles.axisText}
                  xAxisLabelTextStyle={styles.axisText}
                  hideRules
                  yAxisThickness={0}
                  xAxisThickness={1}
                  noOfSections={5}
                  maxValue={5}
                  yAxisOffset={0}
                  curved
                  areaChart
                  startFillColor="rgba(192, 38, 211, 0.2)"
                  endFillColor="rgba(192, 38, 211, 0.01)"
                  isAnimated
                  animationDuration={800}
                />
              </View>
            </View>
          )}

          {levelDistribution.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Distribucion de Niveles</Text>
                <Ionicons name="pie-chart" size={24} color="#5a8c6a" />
              </View>
              <View style={styles.pieChartContainer}>
                <PieChart
                  data={levelDistribution}
                  donut
                  radius={80}
                  innerRadius={50}
                  centerLabelComponent={() => (
                    <View style={styles.pieCenter}>
                      <Text style={styles.pieCenterNumber}>{stats.totalSessions}</Text>
                      <Text style={styles.pieCenterLabel}>sesiones</Text>
                    </View>
                  )}
                />
                <View style={styles.pieLegend}>
                  {levelDistribution.map((item, index) => (
                    <View key={index} style={styles.pieLegendItem}>
                      <View style={[styles.pieLegendColor, { backgroundColor: item.color }]} />
                      <Text style={styles.pieLegendText}>{item.label}</Text>
                      <Text style={styles.pieLegendValue}>{item.text}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {topExercises.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Ejercicios Favoritos</Text>
                <Ionicons name="barbell" size={24} color="#5a8c6a" />
              </View>
              {topExercises.map((exercise, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={styles.listRank}>
                    <Text style={styles.listRankText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.listItemText} numberOfLines={1}>{exercise.name}</Text>
                  <View style={styles.listCount}>
                    <Text style={styles.listCountText}>{exercise.count}x</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {topCategories.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Categorias de Consejos</Text>
                <Ionicons name="bulb" size={24} color="#5a8c6a" />
              </View>
              {topCategories.map((category, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={[styles.listRank, { backgroundColor: '#f0f4f8' }]}>
                    <Ionicons name="bookmark" size={16} color="#5a8c6a" />
                  </View>
                  <Text style={styles.listItemText}>{category.name}</Text>
                  <View style={styles.listCount}>
                    <Text style={styles.listCountText}>{category.count}x</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Sesiones Recientes</Text>
              <Ionicons name="time" size={24} color="#5a8c6a" />
            </View>
            {sessions.slice(0, 5).map((session, index) => {
              const date = new Date(session.created_at);
              const exerciseCount = session.selected_exercises
                ? JSON.parse(session.selected_exercises).length
                : 0;
              return (
                <View key={index} style={styles.sessionItem}>
                  <View style={[styles.sessionLevel, { backgroundColor: levelColors[session.anxiety_level] }]}>
                    <Text style={styles.sessionLevelText}>{session.anxiety_level}</Text>
                  </View>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionTitle}>
                      {levelNames[session.anxiety_level]} - {exerciseCount} ejercicio{exerciseCount !== 1 ? 's' : ''}
                    </Text>
                    <Text style={styles.sessionDate}>
                      {date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  {session.duration_seconds && (
                    <Text style={styles.sessionDuration}>
                      {formatDuration(session.duration_seconds)}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={24} color="#5a8c6a" />
              <Text style={styles.infoTitle}>Acerca de tus datos</Text>
            </View>
            <Text style={styles.infoText}>
              Estas estadisticas muestran tu progreso a traves de las sesiones.
              Continua usando la app para obtener mejores insights sobre tus patrones de ansiedad.
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f8f3',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 34,
    backgroundColor: '#F5F3ED',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#2C3E50',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    marginTop: 10,
    fontWeight: '500',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  noDataTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7F8C8D',
    marginTop: 20,
  },
  noDataText: {
    fontSize: 16,
    color: '#95A5A6',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  statCardPrimary: {
    width: '100%',
  },
  statCardSecondary: {
    width: (SCREEN_WIDTH - 64) / 3,
    backgroundColor: '#fff',
    padding: 16,
    alignItems: 'center',
  },
  statGradient: {
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statNumberWhite: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabelWhite: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#7F8C8D',
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  averageLevelContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  averageLevelNumber: {
    fontSize: 56,
    fontWeight: 'bold',
  },
  levelScale: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  levelDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  chartWrapper: {
    marginTop: 8,
    alignItems: 'center',
  },
  chartSubtitle: {
    fontSize: 13,
    color: '#7F8C8D',
    marginBottom: 12,
  },
  axisText: {
    color: '#7F8C8D',
    fontSize: 11,
  },
  pieChartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  pieCenter: {
    alignItems: 'center',
  },
  pieCenterNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  pieCenterLabel: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  pieLegend: {
    marginLeft: 20,
  },
  pieLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pieLegendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  pieLegendText: {
    fontSize: 13,
    color: '#2C3E50',
    width: 70,
  },
  pieLegendValue: {
    fontSize: 13,
    color: '#7F8C8D',
    fontWeight: '600',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#5a8c6a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listRankText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  listItemText: {
    flex: 1,
    fontSize: 15,
    color: '#2C3E50',
  },
  listCount: {
    backgroundColor: '#f0f4f8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  listCountText: {
    fontSize: 13,
    color: '#5a8c6a',
    fontWeight: '600',
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sessionLevel: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sessionLevelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 15,
    color: '#2C3E50',
    fontWeight: '600',
  },
  sessionDate: {
    fontSize: 13,
    color: '#7F8C8D',
    marginTop: 2,
  },
  sessionDuration: {
    fontSize: 13,
    color: '#5a8c6a',
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 18,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#5a8c6a',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#5F6368',
    lineHeight: 22,
  },
});
