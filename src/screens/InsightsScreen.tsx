import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function InsightsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Ionicons name="trending-up-outline" size={32} color="#6C63FF" />
        <Text style={styles.cardTitle}>Rutine</Text>
        <Text style={styles.cardDesc}>
          RAFI uči tvoje navike i rutine. Što više koristiš aplikaciju, to bolji
          uvidi ćeš dobiti.
        </Text>
      </View>

      <View style={styles.card}>
        <Ionicons name="time-outline" size={32} color="#FFA500" />
        <Text style={styles.cardTitle}>Optimizacija vremena</Text>
        <Text style={styles.cardDesc}>
          Uskoro: analiza kako provodiš vrijeme i prijedlozi za poboljšanje.
        </Text>
      </View>

      <View style={styles.card}>
        <Ionicons name="stats-chart-outline" size={32} color="#4CAF50" />
        <Text style={styles.cardTitle}>Statistike</Text>
        <Text style={styles.cardDesc}>
          Uskoro: pregled završenih zadataka, produktivnosti i trendova.
        </Text>
      </View>

      <View style={styles.comingSoon}>
        <Ionicons name="rocket-outline" size={24} color="#CCC" />
        <Text style={styles.comingSoonText}>
          Ova sekcija postaje korisnija kako budeš više razgovarao sa RAFI-jem
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  card: {
    backgroundColor: '#F8F8FC',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
    marginTop: 8,
  },
  cardDesc: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  comingSoon: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  comingSoonText: {
    fontSize: 13,
    color: '#CCC',
    textAlign: 'center',
  },
});
