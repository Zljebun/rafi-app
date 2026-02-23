import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { optimizer } from '../agent/optimizer';
import { scheduler } from '../agent/scheduler';

interface Insight {
  type: 'tip' | 'warning' | 'achievement' | 'pattern';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

interface ProductivityScore {
  score: number;
  label: string;
  details: string;
}

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  tip: 'bulb-outline',
  warning: 'alert-circle-outline',
  achievement: 'trophy-outline',
  pattern: 'analytics-outline',
};

const COLOR_MAP: Record<string, string> = {
  tip: '#6C63FF',
  warning: '#FF6B6B',
  achievement: '#4CAF50',
  pattern: '#FFA500',
};

export function InsightsScreen() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [score, setScore] = useState<ProductivityScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [insightsData, scoreData] = await Promise.all([
        optimizer.getInsights(),
        scheduler.getProductivityScore(),
      ]);
      setInsights(insightsData);
      setScore(scoreData);
    } catch {
      // Silently handle - insights are non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Analiziram...</Text>
      </View>
    );
  }

  const scoreColor =
    score && score.score >= 80
      ? '#4CAF50'
      : score && score.score >= 60
        ? '#FFA500'
        : score && score.score >= 40
          ? '#FF9800'
          : '#FF4444';

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Productivity Score */}
      {score && (
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Produktivnost</Text>
          <View style={styles.scoreCircle}>
            <Text style={[styles.scoreNumber, { color: scoreColor }]}>
              {score.score}
            </Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>
          <Text style={[styles.scoreStatus, { color: scoreColor }]}>
            {score.label}
          </Text>
          <Text style={styles.scoreDetails}>{score.details}</Text>
        </View>
      )}

      {/* Insights */}
      {insights.length > 0 ? (
        insights.map((insight, index) => (
          <View
            key={index}
            style={[
              styles.insightCard,
              insight.priority === 'high' && styles.insightCardHigh,
            ]}
          >
            <View style={styles.insightHeader}>
              <Ionicons
                name={ICON_MAP[insight.type] || 'information-circle-outline'}
                size={24}
                color={COLOR_MAP[insight.type] || '#6C63FF'}
              />
              <Text style={styles.insightTitle}>{insight.title}</Text>
            </View>
            <Text style={styles.insightDesc}>{insight.description}</Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="analytics-outline" size={48} color="#CCC" />
          <Text style={styles.emptyTitle}>Nema dovoljno podataka</Text>
          <Text style={styles.emptyDesc}>
            Koristi RAFI za upravljanje obavezama i pojaviće se personalizirani
            uvidi i savjeti.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#999',
  },
  scoreCard: {
    backgroundColor: '#F8F8FC',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreCircle: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 8,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: '700',
  },
  scoreMax: {
    fontSize: 18,
    color: '#CCC',
    fontWeight: '500',
  },
  scoreStatus: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  scoreDetails: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
  insightCard: {
    backgroundColor: '#F8F8FC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  insightCardHigh: {
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B6B',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    flex: 1,
  },
  insightDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 34,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#999',
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#CCC',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});
