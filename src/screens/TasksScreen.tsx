import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../services/storage/database';

interface Task {
  id: number;
  title: string;
  description: string;
  due_date: string | null;
  priority: string;
  status: string;
  created_at: string;
}

export function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'completed' | 'all'>(
    'pending'
  );

  const loadTasks = useCallback(async () => {
    try {
      const result = await db.getTasks({ status: filter });
      setTasks(result as unknown as Task[]);
    } catch {
      // DB might not be initialized yet
    }
  }, [filter]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const toggleComplete = async (taskId: number) => {
    await db.completeTask(taskId);
    await loadTasks();
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case 'high':
        return '#FF4444';
      case 'medium':
        return '#FFA500';
      default:
        return '#4CAF50';
    }
  };

  const renderTask = ({ item }: { item: Task }) => (
    <View style={styles.taskCard}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => toggleComplete(item.id)}
      >
        <Ionicons
          name={
            item.status === 'completed'
              ? 'checkbox'
              : 'square-outline'
          }
          size={24}
          color={item.status === 'completed' ? '#4CAF50' : '#999'}
        />
      </TouchableOpacity>
      <View style={styles.taskContent}>
        <Text
          style={[
            styles.taskTitle,
            item.status === 'completed' && styles.completedText,
          ]}
        >
          {item.title}
        </Text>
        {item.description ? (
          <Text style={styles.taskDesc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        <View style={styles.taskMeta}>
          <View
            style={[
              styles.priorityDot,
              { backgroundColor: priorityColor(item.priority) },
            ]}
          />
          <Text style={styles.metaText}>{item.priority}</Text>
          {item.due_date && (
            <Text style={styles.metaText}>
              {new Date(item.due_date).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {(['pending', 'completed', 'all'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}
            >
              {f === 'pending' ? 'Aktivne' : f === 'completed' ? 'Završene' : 'Sve'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTask}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkbox-outline" size={48} color="#CCC" />
            <Text style={styles.emptyText}>Nema obaveza</Text>
            <Text style={styles.emptySubtext}>
              Reci RAFI-ju da ti doda zadatak!
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F5',
  },
  filterBtnActive: {
    backgroundColor: '#6C63FF',
  },
  filterText: {
    fontSize: 13,
    color: '#666',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  list: {
    padding: 12,
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F8FC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  checkbox: {
    marginRight: 10,
    marginTop: 2,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A2E',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  taskDesc: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#999',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#999',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#CCC',
    marginTop: 4,
  },
});
