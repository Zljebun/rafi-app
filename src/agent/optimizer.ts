import { db } from '../services/storage/database';
import { memoryManager } from './memory';
import { scheduler } from './scheduler';

interface OptimizationInsight {
  type: 'tip' | 'warning' | 'achievement' | 'pattern';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

class OptimizerService {
  async getInsights(): Promise<OptimizationInsight[]> {
    const insights: OptimizationInsight[] = [];
    const profile = await memoryManager.getUserProfile();
    const productivity = await scheduler.getProductivityScore();

    // Completion rate insight
    if (profile.totalTasks >= 5) {
      if (profile.completionRate >= 0.8) {
        insights.push({
          type: 'achievement',
          title: 'Odlična produktivnost!',
          description: `Završavaš ${Math.round(profile.completionRate * 100)}% zadataka. Nastavi tako!`,
          priority: 'low',
        });
      } else if (profile.completionRate < 0.4) {
        insights.push({
          type: 'warning',
          title: 'Mnogo nezavršenih zadataka',
          description:
            'Pokušaj smanjiti broj zadataka ili ih podijeliti na manje korake.',
          priority: 'high',
        });
      }
    }

    // Peak hours insight
    if (profile.peakHours.length > 0) {
      const hourStr = profile.peakHours
        .map((h) => `${h}:00`)
        .join(', ');
      insights.push({
        type: 'pattern',
        title: 'Tvoji najaktivniji sati',
        description: `Najčešće si aktivan u: ${hourStr}. Zakazuj najbitnije zadatke za to vrijeme.`,
        priority: 'medium',
      });
    }

    // Overdue tasks warning
    const pending = await db.getTasks({ status: 'pending' });
    const now = new Date();
    const overdue = pending.filter(
      (t: any) => t.due_date && new Date(t.due_date) < now
    );
    if (overdue.length > 0) {
      insights.push({
        type: 'warning',
        title: `${overdue.length} zakasnjelih obaveza`,
        description:
          'Pregledaj zakasnele obaveze i odluči: završi ih, pomjeri rok, ili obriši ako više nisu relevantne.',
        priority: 'high',
      });
    }

    // Task balance insight
    const highPriority = pending.filter(
      (t: any) => t.priority === 'high'
    );
    if (highPriority.length > 3) {
      insights.push({
        type: 'warning',
        title: 'Previše hitnih zadataka',
        description: `Imaš ${highPriority.length} zadataka visokog prioriteta. Ako je sve hitno, ništa nije hitno. Pokušaj preispitati prioritete.`,
        priority: 'high',
      });
    }

    // Routine insights
    if (profile.routineCount > 0) {
      insights.push({
        type: 'pattern',
        title: `${profile.routineCount} prepoznatih rutina`,
        description:
          'RAFI uči tvoje obrasce. Što više koristiš app, to bolji savjeti.',
        priority: 'low',
      });
    }

    // Time-based tip
    const hour = new Date().getHours();
    const tip = await memoryManager.getDailyTip(hour);
    insights.push({
      type: 'tip',
      title: 'Savjet dana',
      description: tip,
      priority: 'low',
    });

    // Sort by priority
    const priorityOrder: Record<string, number> = {
      high: 0,
      medium: 1,
      low: 2,
    };
    insights.sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );

    return insights;
  }
}

export const optimizer = new OptimizerService();
