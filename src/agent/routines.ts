import { db } from '../services/storage/database';
import type { UserAction } from './core';

interface RoutinePattern {
  name: string;
  type: 'time_based' | 'frequency_based' | 'sequence_based';
  hour?: number;
  dayOfWeek?: number;
  frequency: string; // 'daily', 'weekly', 'weekdays'
  confidence: number; // 0-1
  occurrences: number;
  lastSeen: string;
}

class RoutineTracker {
  private actionBuffer: Array<{
    type: string;
    data: string;
    timestamp: string;
  }> = [];

  async processAction(action: UserAction): Promise<void> {
    this.actionBuffer.push({
      type: action.type,
      data: JSON.stringify(action.data),
      timestamp: new Date().toISOString(),
    });

    // Analyze patterns every 10 actions
    if (this.actionBuffer.length >= 10) {
      await this.analyzePatterns();
      this.actionBuffer = [];
    }
  }

  private async analyzePatterns(): Promise<void> {
    const actions = await db.getRecentActions(100);
    if (actions.length < 5) return;

    // Detect time-based patterns (user active at same hours)
    const hourCounts = new Map<number, number>();
    for (const action of actions) {
      const hour = new Date(action.created_at).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    }

    // Find peak hours (hours with significantly more activity)
    const avgCount = actions.length / 24;
    for (const [hour, count] of hourCounts) {
      if (count >= avgCount * 2 && count >= 3) {
        const confidence = Math.min(count / actions.length, 0.95);
        await this.saveRoutine({
          name: `Aktivan u ${hour}:00`,
          type: 'time_based',
          hour,
          frequency: 'daily',
          confidence,
          occurrences: count,
          lastSeen: new Date().toISOString(),
        });
      }
    }

    // Detect day-of-week patterns
    const dayCounts = new Map<number, number>();
    for (const action of actions) {
      const day = new Date(action.created_at).getDay();
      dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
    }

    const weekdayTotal = [1, 2, 3, 4, 5].reduce(
      (sum, d) => sum + (dayCounts.get(d) || 0),
      0
    );
    const weekendTotal = [0, 6].reduce(
      (sum, d) => sum + (dayCounts.get(d) || 0),
      0
    );

    if (weekdayTotal > 0 && weekendTotal === 0) {
      await this.saveRoutine({
        name: 'Koristi app samo radnim danima',
        type: 'frequency_based',
        frequency: 'weekdays',
        confidence: 0.7,
        occurrences: weekdayTotal,
        lastSeen: new Date().toISOString(),
      });
    }

    // Detect task creation patterns
    const taskActions = actions.filter((a) => a.type === 'task_created');
    if (taskActions.length >= 3) {
      const taskHours = taskActions.map((a) => new Date(a.created_at).getHours());
      const commonHour = this.findMode(taskHours);
      if (commonHour !== null) {
        const count = taskHours.filter((h) => h === commonHour).length;
        if (count >= 3) {
          await this.saveRoutine({
            name: `Planira obaveze oko ${commonHour}:00`,
            type: 'time_based',
            hour: commonHour,
            frequency: 'daily',
            confidence: count / taskActions.length,
            occurrences: count,
            lastSeen: new Date().toISOString(),
          });
        }
      }
    }
  }

  private findMode(arr: number[]): number | null {
    if (arr.length === 0) return null;
    const counts = new Map<number, number>();
    let maxCount = 0;
    let mode = arr[0];
    for (const val of arr) {
      const count = (counts.get(val) || 0) + 1;
      counts.set(val, count);
      if (count > maxCount) {
        maxCount = count;
        mode = val;
      }
    }
    return mode;
  }

  private async saveRoutine(pattern: RoutinePattern): Promise<void> {
    await db.saveRoutine({
      name: pattern.name,
      pattern: JSON.stringify(pattern),
      frequency: pattern.frequency,
      lastOccurrence: pattern.lastSeen,
    });
  }

  async getActiveRoutines(): Promise<RoutinePattern[]> {
    const routines = await db.getRoutines();
    return routines
      .map((r: any) => {
        try {
          return JSON.parse(r.pattern) as RoutinePattern;
        } catch {
          return null;
        }
      })
      .filter((r): r is RoutinePattern => r !== null && r.confidence >= 0.5);
  }

  async getSuggestions(): Promise<string[]> {
    const routines = await this.getActiveRoutines();
    const suggestions: string[] = [];

    for (const routine of routines) {
      if (routine.confidence >= 0.7) {
        suggestions.push(
          `Primijećeno: ${routine.name} (${Math.round(routine.confidence * 100)}% sigurnost)`
        );
      }
    }

    return suggestions;
  }

  async getTimeSuggestion(
    currentHour: number,
    _dayOfWeek: number
  ): Promise<string | null> {
    const routines = await this.getActiveRoutines();

    for (const routine of routines) {
      if (
        routine.type === 'time_based' &&
        routine.hour === currentHour &&
        routine.confidence >= 0.6
      ) {
        if (routine.name.includes('Planira obaveze')) {
          return 'Obično u ovo vrijeme planiraš obaveze. Želiš li dodati nešto?';
        }
      }
    }

    return null;
  }
}

export const routineTracker = new RoutineTracker();
