import { db } from '../services/storage/database';

const TIPS: Record<string, string[]> = {
  morning: [
    'Jutro je idealno za najteže zadatke - energija i fokus su na vrhuncu.',
    'Pokušaj "pojesti žabu" - uradi najneprijatniji zadatak prvo.',
    'Pregledaj obaveze za danas i postavi top 3 prioriteta.',
    'Započni dan kratkim pregledom kalendara.',
  ],
  afternoon: [
    'Popodne je dobro za sastanke i kolaboraciju.',
    'Ako osjećaš pad energije, kratka šetnja od 10 min pomaže.',
    'Provjeri napredak na današnjim zadacima.',
    'Grupiši slične zadatke - batch processing štedi vrijeme.',
  ],
  evening: [
    'Večer je dobra za planiranje sutrašnjeg dana.',
    'Zapiši šta si danas postigao - pomaže motivaciji.',
    'Pripremi listu za sutra večeras - sutra ćeš biti produktivniji.',
    'Izbjegavaj teške odluke uveče - sačuvaj ih za jutro.',
  ],
};

class MemoryManager {
  private tipIndex: Record<string, number> = {
    morning: 0,
    afternoon: 0,
    evening: 0,
  };

  async getDailyTip(hour: number): Promise<string> {
    let period: string;
    if (hour >= 5 && hour < 12) {
      period = 'morning';
    } else if (hour >= 12 && hour < 18) {
      period = 'afternoon';
    } else {
      period = 'evening';
    }

    const tips = TIPS[period];
    const index = this.tipIndex[period] % tips.length;
    this.tipIndex[period]++;

    return tips[index];
  }

  async getUserProfile(): Promise<{
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    peakHours: number[];
    preferences: Record<string, string>;
    routineCount: number;
  }> {
    const allTasks = await db.getTasks({ status: 'all' });
    const completed = allTasks.filter((t: any) => t.status === 'completed');

    // Find peak activity hours
    const actions = await db.getRecentActions(200);
    const hourCounts = new Map<number, number>();
    for (const action of actions) {
      const hour = new Date(action.created_at).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    }

    const sortedHours = [...hourCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => hour);

    const routines = await db.getRoutines();

    return {
      totalTasks: allTasks.length,
      completedTasks: completed.length,
      completionRate:
        allTasks.length > 0 ? completed.length / allTasks.length : 0,
      peakHours: sortedHours,
      preferences: {},
      routineCount: routines.length,
    };
  }
}

export const memoryManager = new MemoryManager();
