import { View, Text, StyleSheet, ScrollView, Dimensions, RefreshControl, ImageBackground, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, PieChart, LineChart } from 'react-native-gifted-charts';
import { useState, useCallback } from 'react';
import * as SQLite from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';

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

// Mapping of all exercise translation keys by level for reverse lookup
const exerciseKeysByLevel: Record<number, string[]> = {
  1: ['mindfulBreathing', 'gratitudeJournal', 'gentleStretching'],
  2: ['boxBreathing', 'progressiveMuscleRelaxation', 'mindfulWalking'],
  3: ['breathing478', 'bodyScan', 'grounding54321'],
  4: ['deepDiaphragmatic', 'guidedVisualization', 'physicalRelease', 'coldWater'],
  5: ['emergencyGrounding', 'tippTechnique', 'safePlace', 'butterflyHug'],
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
  const { t } = useTranslation();
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
  const [topExercises, setTopExercises] = useState<{ name: string; count: number; translationKey?: string; level?: number }[]>([]);
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
      const exerciseCounts: Record<string, { count: number; translationKey?: string; level?: number }> = {};
      sessionRows.forEach(session => {
        if (session.selected_exercises) {
          try {
            const exercises = JSON.parse(session.selected_exercises) as { title: string; translationKey?: string; level?: number }[];
            totalExercises += exercises.length;
            exercises.forEach(ex => {
              const key = ex.translationKey && ex.level ? `${ex.level}:${ex.translationKey}` : ex.title;
              if (!exerciseCounts[key]) {
                exerciseCounts[key] = { count: 0, translationKey: ex.translationKey, level: ex.level };
              }
              exerciseCounts[key].count += 1;
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
        label: `${level}`,
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
          frontColor: avgLevel > 0 ? levelColors[Math.round(avgLevel)] || '#2d9a6e' : 'rgba(255,255,255,0.2)',
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
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 5)
        .map(([name, data]) => ({
          name,
          count: data.count,
          translationKey: data.translationKey,
          level: data.level,
        }));
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
    <ImageBackground
      source={require('@/assets/images/wall2.jpg')}
      style={styles.bgContainer}
      imageStyle={styles.bgImage}
    >
    <BlurView intensity={50} tint="dark" style={styles.blurContainer} experimentalBlurMethod="dimezisBlurView">
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
      }
    >
      {!hasData ? (
        <View style={styles.noDataContainer}>
          <Ionicons name="analytics-outline" size={80} color="rgba(255,255,255,0.4)" />
          <Text style={styles.noDataTitle}>{t('charts.noData.title')}</Text>
          <Text style={styles.noDataText}>
            {t('charts.noData.message')}
          </Text>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.statCardPrimary]}>
              <LinearGradient
                colors={['#2d9a6e', '#4a7c5a']}
                style={styles.statGradient}
              >
                <Ionicons name="layers-outline" size={28} color="#fff" />
                <Text style={styles.statNumberWhite}>{stats.totalSessions}</Text>
                <Text style={styles.statLabelWhite}>{t('charts.stats.totalSessions')}</Text>
              </LinearGradient>
            </View>

            <View style={[styles.statCard, styles.statCardSecondary]}>
              <Ionicons name="calendar-outline" size={28} color="#5a67d8" />
              <Text style={styles.statNumber}>{stats.sessionsThisWeek}</Text>
              <Text style={styles.statLabel}>{t('charts.stats.thisWeek')}</Text>
            </View>

            <View style={[styles.statCard, styles.statCardSecondary]}>
              <Ionicons name="fitness-outline" size={28} color="#2d9a6e" />
              <Text style={styles.statNumber}>{stats.totalExercises}</Text>
              <Text style={styles.statLabel}>{t('charts.stats.exercises')}</Text>
            </View>

            <View style={[styles.statCard, styles.statCardSecondary]}>
              <Ionicons name="time-outline" size={28} color="#d97706" />
              <Text style={styles.statNumber}>{formatDuration(stats.averageDuration)}</Text>
              <Text style={styles.statLabel}>{t('charts.stats.avgTime')}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{t('charts.cards.avgLevel')}</Text>
              <View style={[styles.levelBadge, { backgroundColor: levelColors[Math.round(stats.averageLevel)] + '20' }]}>
                <Text style={[styles.levelBadgeText, { color: levelColors[Math.round(stats.averageLevel)] }]}>
                  {t(`anxietyLevels.${Math.round(stats.averageLevel)}.title`) || 'N/A'}
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
                          : 'rgba(255,255,255,0.2)',
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{t('charts.cards.weeklyTrend')}</Text>
              <Ionicons name="calendar-outline" size={24} color="#2d9a6e" />
            </View>
            <Text style={styles.chartSubtitle}>{t('charts.chartSubtitles.weekly')}</Text>
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
                xAxisColor="rgba(255,255,255,0.2)"
                yAxisColor="rgba(255,255,255,0.2)"
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
                <Text style={styles.cardTitle}>{t('charts.cards.monthlyTrend')}</Text>
                <Ionicons name="trending-up" size={24} color="#2d9a6e" />
              </View>
              <Text style={styles.chartSubtitle}>{t('charts.chartSubtitles.monthly')}</Text>
              <View style={styles.chartWrapper}>
                <LineChart
                  data={monthlyData}
                  width={SCREEN_WIDTH - 100}
                  height={180}
                  spacing={50}
                  initialSpacing={20}
                  color="#2d9a6e"
                  thickness={3}
                  hideDataPoints={false}
                  dataPointsColor="#2d9a6e"
                  dataPointsRadius={6}
                  textColor="rgba(255,255,255,0.6)"
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
                <Text style={styles.cardTitle}>{t('charts.cards.yearlyTrend')}</Text>
                <Ionicons name="analytics" size={24} color="#2d9a6e" />
              </View>
              <Text style={styles.chartSubtitle}>{t('charts.chartSubtitles.yearly')}</Text>
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
                  textColor="rgba(255,255,255,0.6)"
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
                <Text style={styles.cardTitle}>{t('charts.cards.levelDistribution')}</Text>
                <Ionicons name="pie-chart" size={24} color="#2d9a6e" />
              </View>
              <View style={styles.pieChartContainer}>
                <PieChart
                  data={levelDistribution}
                  donut
                  radius={80}
                  innerRadius={50}
                  showText
                  textColor="#fff"
                  textSize={11}
                  fontWeight="bold"
                  centerLabelComponent={() => (
                    <View style={styles.pieCenter}>
                      <Text style={styles.pieCenterNumber}>{stats.totalSessions}</Text>
                      <Text style={styles.pieCenterLabel}>{t('charts.sessions')}</Text>
                    </View>
                  )}
                />
                <View style={styles.pieLegend}>
                  {levelDistribution.map((item, index) => (
                    <View key={index} style={styles.pieLegendItem}>
                      <View style={[styles.pieLegendColor, { backgroundColor: item.color }]} />
                      <Text style={styles.pieLegendText}>{t(`anxietyLevels.${item.label}.title`)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {topExercises.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{t('charts.cards.favoriteExercises')}</Text>
                <Ionicons name="barbell" size={24} color="#2d9a6e" />
              </View>
              {topExercises.map((exercise, index) => {
                let displayName = exercise.name;

                if (exercise.translationKey && exercise.level) {
                  // New data with translation key
                  displayName = t(`exercises.levels.${exercise.level}.exercises.${exercise.translationKey}.title`);
                } else {
                  // Old data - try to find translation key by matching title
                  for (const [levelStr, keys] of Object.entries(exerciseKeysByLevel)) {
                    const level = Number(levelStr);
                    for (const key of keys) {
                      const enTitle = t(`exercises.levels.${level}.exercises.${key}.title`, { lng: 'en' });
                      const esTitle = t(`exercises.levels.${level}.exercises.${key}.title`, { lng: 'es' });
                      if (exercise.name === enTitle || exercise.name === esTitle) {
                        displayName = t(`exercises.levels.${level}.exercises.${key}.title`);
                        break;
                      }
                    }
                  }
                }

                return (
                  <View key={index} style={styles.listItem}>
                    <View style={styles.listRank}>
                      <Text style={styles.listRankText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.listItemText} numberOfLines={1}>{displayName}</Text>
                    <View style={styles.listCount}>
                      <Text style={styles.listCountText}>{exercise.count}x</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {topCategories.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{t('charts.cards.tipCategories')}</Text>
                <Ionicons name="bulb" size={24} color="#2d9a6e" />
              </View>
              {topCategories.map((category, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={[styles.listRank, { backgroundColor: 'rgba(45,154,110,0.2)' }]}>
                    <Ionicons name="bookmark" size={16} color="#2d9a6e" />
                  </View>
                  <Text style={styles.listItemText}>{t(`tips.categories.${category.name}`, { defaultValue: category.name })}</Text>
                  <View style={styles.listCount}>
                    <Text style={styles.listCountText}>{category.count}x</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{t('charts.cards.recentSessions')}</Text>
              <Ionicons name="time" size={24} color="#2d9a6e" />
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
                      {t(`anxietyLevels.${session.anxiety_level}.title`)} - {exerciseCount} {t('charts.stats.exercises').toLowerCase()}
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
              <Ionicons name="information-circle" size={24} color="#2d9a6e" />
              <Text style={styles.infoTitle}>{t('charts.infoBox.title')}</Text>
            </View>
            <Text style={styles.infoText}>
              {t('charts.infoBox.text')}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
    </BlurView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgContainer: {
    flex: 1,
  },
  bgImage: {
    resizeMode: 'cover',
  },
  blurContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 80,
  },
  noDataContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 200,
    paddingHorizontal: 40,
  },
  noDataTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 20,
  },
  noDataText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
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
  },
  statCardPrimary: {
    width: '100%',
  },
  statCardSecondary: {
    width: (SCREEN_WIDTH - 64) / 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
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
    color: '#fff',
    marginTop: 8,
    textAlign: 'center',
    width: '100%',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
    textAlign: 'center',
    width: '100%',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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
    color: '#fff',
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
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 12,
  },
  axisText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
  },
  pieChartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 20,
  },
  pieCenter: {
    alignItems: 'center',
  },
  pieCenterNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  pieCenterLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  pieLegend: {
    flexShrink: 1,
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
    color: 'rgba(255,255,255,0.85)',
    width: 90,
    marginRight: 10,
  },
  pieLegendValue: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  listRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2d9a6e',
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
    color: 'rgba(255,255,255,0.85)',
  },
  listCount: {
    backgroundColor: 'rgba(45,154,110,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  listCountText: {
    fontSize: 13,
    color: '#4ade80',
    fontWeight: '600',
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
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
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  sessionDate: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  sessionDuration: {
    fontSize: 13,
    color: '#4ade80',
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: 'rgba(45,154,110,0.15)',
    borderRadius: 18,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2d9a6e',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 22,
  },
});
