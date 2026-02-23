import { db } from '../services/storage/database';
import { routineTracker } from './routines';
import { memoryManager } from './memory';

export type UserAction =
  | { type: 'task_created'; data: { title: string; priority: string; hour: number } }
  | { type: 'task_completed'; data: { taskId: number; title: string; hour: number } }
  | { type: 'chat_message'; data: { hour: number; dayOfWeek: number } }
  | { type: 'app_opened'; data: { hour: number; dayOfWeek: number } };

class AgentCore {
  async trackAction(action: UserAction): Promise<void> {
    // Log the action
    await db.logAction(action.type, JSON.stringify(action.data));

    // Feed to routine tracker
    await routineTracker.processAction(action);
  }

  async getDailySummary(): Promise<{
    pendingTasks: number;
    completedToday: number;
    upcomingReminders: number;
    routineSuggestions: string[];
    tip: string;
  }> {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const pending = await db.getTasks({ status: 'pending' });
    const completed = await db.getTasks({ status: 'completed', date: todayStr });
    const routines = await routineTracker.getActiveRoutines();
    const suggestions = await routineTracker.getSuggestions();
    const tip = await memoryManager.getDailyTip(now.getHours());

    return {
      pendingTasks: pending.length,
      completedToday: completed.length,
      upcomingReminders: 0, // Will be populated from notifications
      routineSuggestions: suggestions,
      tip,
    };
  }

  async getProactiveSuggestion(): Promise<string | null> {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    // Check if there's a routine suggestion for this time
    const routineSuggestion = await routineTracker.getTimeSuggestion(hour, dayOfWeek);
    if (routineSuggestion) return routineSuggestion;

    // Check for overdue tasks
    const pending = await db.getTasks({ status: 'pending' });
    const overdue = pending.filter(
      (t: any) => t.due_date && new Date(t.due_date) < now
    );
    if (overdue.length > 0) {
      return `Imas ${overdue.length} zakasnjelih obaveza. Zelis li da ih pregledamo?`;
    }

    return null;
  }
}

export const agentCore = new AgentCore();
