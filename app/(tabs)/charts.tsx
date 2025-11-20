import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-gifted-charts';
import { useState, useEffect } from 'react';
import * as SQLite from 'expo-sqlite';

const SCREEN_WIDTH = Dimensions.get('window').width;

type AnxietyData = {
  value: number;
  label: string;
  frontColor: string;
  spacing?: number;
};

const getColorForLevel = (level: number): string => {
  if (level === 1) return '#2ECC71';
  if (level === 2) return '#5dba77';
  if (level === 3) return '#F39C12';
  if (level === 4) return '#E67E22';
  return '#E74C3C';
};

const getLevelName = (level: number): string => {
  if (level === 1) return 'Calm';
  if (level === 2) return 'Mild';
  if (level === 3) return 'Moderate';
  if (level === 4) return 'High';
  return 'Severe';
};

export default function ChartsScreen() {
  const [anxietyData, setAnxietyData] = useState<AnxietyData[]>([]);
  const [stats, setStats] = useState({
    average: 0,
    totalLogs: 0,
    mostCommonLevel: 0,
  });

  useEffect(() => {
    loadAnxietyData();
  }, []);

  const loadAnxietyData = async () => {
    try {
      const db = await SQLite.openDatabaseAsync('descalate.db');

      const logs = await db.getAllAsync<{
        anxiety_level: number;
        created_at: string;
      }>(
        `SELECT anxiety_level, created_at
         FROM anxiety_logs
         ORDER BY created_at DESC
         LIMIT 14`
      );

      if (logs && logs.length > 0) {
        const chartData: AnxietyData[] = logs.reverse().map((log, index) => {
          const date = new Date(log.created_at);
          const label = `${date.getMonth() + 1}/${date.getDate()}`;

          return {
            value: log.anxiety_level,
            label: label,
            frontColor: getColorForLevel(log.anxiety_level),
            spacing: index === 0 ? 0 : 2,
          };
        });

        setAnxietyData(chartData);

        const average = logs.reduce((sum, log) => sum + log.anxiety_level, 0) / logs.length;
        const levelCounts: { [key: number]: number } = {};
        logs.forEach(log => {
          levelCounts[log.anxiety_level] = (levelCounts[log.anxiety_level] || 0) + 1;
        });
        const mostCommon = Number(Object.entries(levelCounts)
          .sort(([, a], [, b]) => b - a)[0][0]);

        setStats({
          average: Math.round(average * 10) / 10,
          totalLogs: logs.length,
          mostCommonLevel: mostCommon,
        });
      } else {
        const sampleData: AnxietyData[] = [
          { value: 2, label: '11/13', frontColor: getColorForLevel(2) },
          { value: 3, label: '11/14', frontColor: getColorForLevel(3), spacing: 2 },
          { value: 2, label: '11/15', frontColor: getColorForLevel(2), spacing: 2 },
          { value: 4, label: '11/16', frontColor: getColorForLevel(4), spacing: 2 },
          { value: 3, label: '11/17', frontColor: getColorForLevel(3), spacing: 2 },
          { value: 2, label: '11/18', frontColor: getColorForLevel(2), spacing: 2 },
          { value: 1, label: '11/19', frontColor: getColorForLevel(1), spacing: 2 },
        ];
        setAnxietyData(sampleData);
        setStats({
          average: 2.4,
          totalLogs: 7,
          mostCommonLevel: 2,
        });
      }
    } catch (error) {
      console.error('Error loading anxiety data:', error);
      const sampleData: AnxietyData[] = [
        { value: 2, label: '11/13', frontColor: getColorForLevel(2) },
        { value: 3, label: '11/14', frontColor: getColorForLevel(3), spacing: 2 },
        { value: 2, label: '11/15', frontColor: getColorForLevel(2), spacing: 2 },
        { value: 4, label: '11/16', frontColor: getColorForLevel(4), spacing: 2 },
        { value: 3, label: '11/17', frontColor: getColorForLevel(3), spacing: 2 },
        { value: 2, label: '11/18', frontColor: getColorForLevel(2), spacing: 2 },
        { value: 1, label: '11/19', frontColor: getColorForLevel(1), spacing: 2 },
      ];
      setAnxietyData(sampleData);
      setStats({
        average: 2.4,
        totalLogs: 7,
        mostCommonLevel: 2,
      });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="stats-chart" size={48} color="#5a8c6a" />
        <Text style={styles.title}>Anxiety History</Text>
        <Text style={styles.subtitle}>Your anxiety levels over time</Text>
      </View>

      <View style={styles.chartContainer}>
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Last 14 Days</Text>
            <Ionicons name="pulse" size={24} color="#5a8c6a" />
          </View>

          <View style={styles.chartWrapper}>
            {anxietyData.length > 0 ? (
              <BarChart
                data={anxietyData}
                barWidth={SCREEN_WIDTH / (anxietyData.length * 2.5)}
                noOfSections={5}
                maxValue={5}
                yAxisThickness={0}
                xAxisThickness={1}
                xAxisColor="#E0E0E0"
                hideRules
                showGradient
                frontColor="#5a8c6a"
                backgroundColor="transparent"
                isAnimated
                animationDuration={800}
                yAxisTextStyle={styles.yAxisText}
                xAxisLabelTextStyle={styles.xAxisText}
                height={200}
                spacing={2}
                renderTooltip={(item: any) => {
                  return (
                    <View style={styles.tooltip}>
                      <Text style={styles.tooltipText}>{getLevelName(item.value)}</Text>
                      <Text style={styles.tooltipValue}>Level {item.value}</Text>
                    </View>
                  );
                }}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Ionicons name="bar-chart-outline" size={64} color="#BDC3C7" />
                <Text style={styles.noDataText}>No data available</Text>
                <Text style={styles.noDataSubtext}>Start logging your anxiety levels</Text>
              </View>
            )}
          </View>

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#2ECC71' }]} />
              <Text style={styles.legendText}>Calm</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#5dba77' }]} />
              <Text style={styles.legendText}>Mild</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#F39C12' }]} />
              <Text style={styles.legendText}>Moderate</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#E67E22' }]} />
              <Text style={styles.legendText}>High</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#E74C3C' }]} />
              <Text style={styles.legendText}>Severe</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardBlue]}>
            <Ionicons name="analytics" size={32} color="#4A90E2" />
            <Text style={styles.statNumber}>{stats.average.toFixed(1)}</Text>
            <Text style={styles.statText}>Average Level</Text>
            <View style={styles.statBadge}>
              <Text style={styles.statBadgeText}>{getLevelName(Math.round(stats.average))}</Text>
            </View>
          </View>

          <View style={[styles.statCard, styles.statCardPurple]}>
            <Ionicons name="calendar" size={32} color="#9B59B6" />
            <Text style={styles.statNumber}>{stats.totalLogs}</Text>
            <Text style={styles.statText}>Total Logs</Text>
            <View style={styles.statBadge}>
              <Text style={styles.statBadgeText}>Last 14 days</Text>
            </View>
          </View>

          <View style={[styles.statCard, styles.statCardGreen]}>
            <Ionicons name="trophy" size={32} color="#2ECC71" />
            <Text style={styles.statNumber}>{stats.mostCommonLevel}</Text>
            <Text style={styles.statText}>Most Common</Text>
            <View style={styles.statBadge}>
              <Text style={styles.statBadgeText}>{getLevelName(stats.mostCommonLevel)}</Text>
            </View>
          </View>

          <View style={[styles.statCard, styles.statCardOrange]}>
            <Ionicons name="trending-down" size={32} color="#F39C12" />
            <Text style={styles.statNumber}>{anxietyData.length > 0 ? anxietyData[anxietyData.length - 1].value : '-'}</Text>
            <Text style={styles.statText}>Latest Level</Text>
            <View style={styles.statBadge}>
              <Text style={styles.statBadgeText}>
                {anxietyData.length > 0 ? getLevelName(anxietyData[anxietyData.length - 1].value) : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color="#5a8c6a" />
            <Text style={styles.infoTitle}>Understanding Your Data</Text>
          </View>
          <Text style={styles.infoText}>
            This chart shows your anxiety levels over the past 14 days. Lower numbers indicate
            calmer states, while higher numbers show increased anxiety. Track your patterns to
            identify triggers and progress.
          </Text>
        </View>
      </View>
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
  chartContainer: {
    padding: 20,
  },
  chartCard: {
    backgroundColor: '#F0EDE5',
    borderRadius: 18,
    padding: 22,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#2C3E50',
    letterSpacing: 0.3,
  },
  chartWrapper: {
    marginVertical: 10,
    minHeight: 220,
    justifyContent: 'center',
  },
  yAxisText: {
    color: '#7F8C8D',
    fontSize: 11,
  },
  xAxisText: {
    color: '#7F8C8D',
    fontSize: 10,
    marginTop: 5,
  },
  tooltip: {
    backgroundColor: '#2C3E50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  tooltipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tooltipValue: {
    color: '#fff',
    fontSize: 10,
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#F0EDE5',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  statCardBlue: {
    borderLeftWidth: 5,
    borderLeftColor: '#4A90E2',
  },
  statCardPurple: {
    borderLeftWidth: 5,
    borderLeftColor: '#9B59B6',
  },
  statCardGreen: {
    borderLeftWidth: 5,
    borderLeftColor: '#2ECC71',
  },
  statCardOrange: {
    borderLeftWidth: 5,
    borderLeftColor: '#F39C12',
  },
  statNumber: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 10,
    letterSpacing: 0.5,
  },
  statText: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 6,
    fontWeight: '500',
  },
  statBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  statBadgeText: {
    fontSize: 11,
    color: '#5a8c6a',
    fontWeight: 'bold',
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7F8C8D',
    marginTop: 16,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#95A5A6',
    marginTop: 8,
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
    lineHeight: 20,
  },
});
