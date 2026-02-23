import { db } from '../services/storage/database';

interface TimeSlot {
  hour: number;
  label: string;
  type: 'focus' | 'meetings' | 'break' | 'planning';
}

interface ScheduleSuggestion {
  task: string;
  suggestedTime: string;
  reason: string;
}

class SchedulerService {
  private defaultSlots: TimeSlot[] = [
    { hour: 7, label: '07:00 - 09:00', type: 'focus' },
    { hour: 9, label: '09:00 - 12:00', type: 'focus' },
    { hour: 12, label: '12:00 - 13:00', type: 'break' },
    { hour: 13, label: '13:00 - 15:00', type: 'meetings' },
    { hour: 15, label: '15:00 - 17:00', type: 'focus' },
    { hour: 17, label: '17:00 - 18:00', type: 'planning' },
  ];

  async suggestSchedule(): Promise<{
    suggestions: ScheduleSuggestion[];
    summary: string;
  }> {
    const pendingTasks = await db.getTasks({ status: 'pending' });

    if (pendingTasks.length === 0) {
      return {
        suggestions: [],
        summary: 'Nemaš aktivnih obaveza. Uživaj u slobodnom danu!',
      };
    }

    const suggestions: ScheduleSuggestion[] = [];

    // Sort by priority: high > medium > low
    const priorityOrder: Record<string, number> = {
      high: 0,
      medium: 1,
      low: 2,
    };
    const sorted = [...pendingTasks].sort(
      (a: any, b: any) =>
        (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1)
    );

    // Assign high priority tasks to focus slots (morning)
    const focusSlots = this.defaultSlots.filter((s) => s.type === 'focus');
    let slotIndex = 0;

    for (const task of sorted) {
      const t = task as any;
      if (slotIndex >= focusSlots.length) break;

      const slot = focusSlots[slotIndex];
      let reason: string;

      if (t.priority === 'high') {
        reason = 'Visok prioritet - zakazan za jutarnji fokus blok kad je energija najviša.';
      } else if (t.priority === 'medium') {
        reason = 'Srednji prioritet - predložen za fokus period.';
      } else {
        reason = 'Nizak prioritet - može čekati, ali bolje završiti ranije.';
      }

      suggestions.push({
        task: t.title,
        suggestedTime: slot.label,
        reason,
      });

      slotIndex++;
    }

    const highCount = sorted.filter((t: any) => t.priority === 'high').length;
    const summary =
      highCount > 0
        ? `Imaš ${highCount} hitnih i ${sorted.length - highCount} ostalih zadataka. Preporučujem da hitne završiš ujutro.`
        : `Imaš ${sorted.length} zadataka. Rasporedio sam ih po prioritetu.`;

    return { suggestions, summary };
  }

  async getProductivityScore(): Promise<{
    score: number;
    label: string;
    details: string;
  }> {
    const allTasks = await db.getTasks({ status: 'all' });
    const completed = allTasks.filter((t: any) => t.status === 'completed');
    const pending = allTasks.filter((t: any) => t.status === 'pending');

    if (allTasks.length === 0) {
      return {
        score: 0,
        label: 'Nema podataka',
        details: 'Počni koristiti RAFI da bi dobio ocjenu produktivnosti.',
      };
    }

    const completionRate = completed.length / allTasks.length;

    // Check for overdue tasks
    const now = new Date();
    const overdue = pending.filter(
      (t: any) => t.due_date && new Date(t.due_date) < now
    );
    const overdueePenalty = overdue.length * 0.05;

    const score = Math.max(
      0,
      Math.min(100, Math.round((completionRate - overdueePenalty) * 100))
    );

    let label: string;
    if (score >= 80) label = 'Odlično';
    else if (score >= 60) label = 'Dobro';
    else if (score >= 40) label = 'Može bolje';
    else label = 'Treba poboljšanje';

    const details =
      `Završeno ${completed.length}/${allTasks.length} zadataka.` +
      (overdue.length > 0 ? ` ${overdue.length} zakasnjelih.` : '');

    return { score, label, details };
  }
}

export const scheduler = new SchedulerService();
