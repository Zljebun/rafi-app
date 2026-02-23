import * as SQLite from 'expo-sqlite';

interface Task {
  id?: number;
  title: string;
  description: string;
  dueDate: string | null;
  priority: string;
  status: string;
  createdAt: string;
}

interface Reminder {
  id?: number;
  message: string;
  datetime: string;
  sent: boolean;
}

interface Routine {
  id?: number;
  name: string;
  pattern: string;
  frequency: string;
  lastOccurrence: string;
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync('rafi.db');

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        due_date TEXT,
        priority TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT NOT NULL,
        datetime TEXT NOT NULL,
        sent INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS routines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        pattern TEXT,
        frequency TEXT,
        last_occurrence TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS preferences (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS insights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
  }

  // Tasks
  async createTask(task: {
    title: string;
    description: string;
    dueDate: string | null;
    priority: string;
  }): Promise<{ success: boolean; task_id: number; message: string }> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.runAsync(
      'INSERT INTO tasks (title, description, due_date, priority) VALUES (?, ?, ?, ?)',
      [task.title, task.description, task.dueDate, task.priority]
    );

    return {
      success: true,
      task_id: result.lastInsertRowId,
      message: `Zadatak "${task.title}" kreiran.`,
    };
  }

  async getTasks(filters: {
    status?: string;
    date?: string;
  }): Promise<Task[]> {
    if (!this.db) throw new Error('Database not initialized');

    let query = 'SELECT * FROM tasks';
    const params: string[] = [];
    const conditions: string[] = [];

    if (filters.status && filters.status !== 'all') {
      conditions.push('status = ?');
      params.push(filters.status);
    }
    if (filters.date) {
      conditions.push('date(due_date) = date(?)');
      params.push(filters.date);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    return this.db.getAllAsync<Task>(query, params);
  }

  async completeTask(
    taskId: number
  ): Promise<{ success: boolean; message: string }> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync('UPDATE tasks SET status = ? WHERE id = ?', [
      'completed',
      taskId,
    ]);

    return { success: true, message: `Zadatak #${taskId} označen kao završen.` };
  }

  async editTask(
    taskId: number,
    updates: {
      title?: string;
      description?: string;
      dueDate?: string;
      priority?: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    if (!this.db) throw new Error('Database not initialized');

    const sets: string[] = [];
    const params: (string | number)[] = [];

    if (updates.title) {
      sets.push('title = ?');
      params.push(updates.title);
    }
    if (updates.description !== undefined) {
      sets.push('description = ?');
      params.push(updates.description);
    }
    if (updates.dueDate !== undefined) {
      sets.push('due_date = ?');
      params.push(updates.dueDate);
    }
    if (updates.priority) {
      sets.push('priority = ?');
      params.push(updates.priority);
    }

    if (sets.length === 0) {
      return { success: false, message: 'Nema promjena za ažuriranje.' };
    }

    params.push(taskId);
    await this.db.runAsync(
      `UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`,
      params
    );

    return { success: true, message: `Zadatak #${taskId} ažuriran.` };
  }

  async deleteTask(
    taskId: number
  ): Promise<{ success: boolean; message: string }> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync('DELETE FROM tasks WHERE id = ?', [taskId]);

    return { success: true, message: `Zadatak #${taskId} obrisan.` };
  }

  // Reminders
  async createReminder(reminder: {
    message: string;
    datetime: string;
  }): Promise<{ success: boolean; reminder_id: number; message: string }> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.runAsync(
      'INSERT INTO reminders (message, datetime) VALUES (?, ?)',
      [reminder.message, reminder.datetime]
    );

    return {
      success: true,
      reminder_id: result.lastInsertRowId,
      message: `Podsjetnik postavljen za ${reminder.datetime}.`,
    };
  }

  // Routines
  async getRoutines(): Promise<Routine[]> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAllAsync<Routine>('SELECT * FROM routines');
  }

  // Conversations
  async saveMessage(role: string, content: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync(
      'INSERT INTO conversations (role, content) VALUES (?, ?)',
      [role, content]
    );
  }

  // Preferences
  async setPreference(key: string, value: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync(
      'INSERT OR REPLACE INTO preferences (key, value, updated_at) VALUES (?, ?, datetime("now"))',
      [key, value]
    );
  }

  async getPreference(key: string): Promise<string | null> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.getFirstAsync<{ value: string }>(
      'SELECT value FROM preferences WHERE key = ?',
      [key]
    );
    return result?.value ?? null;
  }
}

export const db = new DatabaseService();
