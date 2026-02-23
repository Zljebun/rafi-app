import { db } from '../storage/database';

// Claude tool definitions for RAFI agent
export const tools = [
  {
    name: 'create_task',
    description:
      'Kreira novi zadatak/obavezu za korisnika. Koristi za bilo koji zahtjev tipa "podsjeti me", "dodaj obavezu", "moram da..."',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: {
          type: 'string',
          description: 'Naziv zadatka',
        },
        description: {
          type: 'string',
          description: 'Detaljan opis zadatka (opciono)',
        },
        due_date: {
          type: 'string',
          description: 'Rok za završetak u ISO formatu (opciono)',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Prioritet zadatka',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'list_tasks',
    description:
      'Prikazuje listu korisnikovih zadataka. Koristi kad korisnik pita "šta imam danas", "moje obaveze", itd.',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: {
          type: 'string',
          enum: ['pending', 'completed', 'all'],
          description: 'Filter po statusu',
        },
        date: {
          type: 'string',
          description: 'Filter po datumu (ISO format)',
        },
      },
    },
  },
  {
    name: 'complete_task',
    description: 'Označava zadatak kao završen.',
    input_schema: {
      type: 'object' as const,
      properties: {
        task_id: {
          type: 'number',
          description: 'ID zadatka koji treba označiti kao završen',
        },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'set_reminder',
    description:
      'Postavlja podsjetnik/notifikaciju za određeno vrijeme.',
    input_schema: {
      type: 'object' as const,
      properties: {
        message: {
          type: 'string',
          description: 'Tekst podsjetnika',
        },
        datetime: {
          type: 'string',
          description: 'Vrijeme notifikacije u ISO formatu',
        },
      },
      required: ['message', 'datetime'],
    },
  },
  {
    name: 'get_routine_info',
    description:
      'Vraća informacije o naučenim rutinama korisnika. Koristi za savjete o optimizaciji.',
    input_schema: {
      type: 'object' as const,
      properties: {},
    },
  },
];

// Tool execution handler
export async function handleToolCall(
  toolName: string,
  input: Record<string, unknown>
): Promise<unknown> {
  switch (toolName) {
    case 'create_task':
      return db.createTask({
        title: input.title as string,
        description: (input.description as string) || '',
        dueDate: (input.due_date as string) || null,
        priority: (input.priority as string) || 'medium',
      });

    case 'list_tasks':
      return db.getTasks({
        status: (input.status as string) || 'pending',
        date: (input.date as string) || undefined,
      });

    case 'complete_task':
      return db.completeTask(input.task_id as number);

    case 'set_reminder':
      return db.createReminder({
        message: input.message as string,
        datetime: input.datetime as string,
      });

    case 'get_routine_info':
      return db.getRoutines();

    default:
      return { error: `Nepoznat tool: ${toolName}` };
  }
}
