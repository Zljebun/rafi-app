import { db } from '../storage/database';
import { calendar } from '../phone/calendar';
import { notifications } from '../phone/notifications';
import { scheduler } from '../../agent/scheduler';
import { optimizer } from '../../agent/optimizer';
import { agentCore } from '../../agent/core';
import { googleSearch } from '../search/google';

// Claude tool definitions for RAFI agent
export const tools = [
  // --- Task Management ---
  {
    name: 'create_task',
    description:
      'Kreira novi zadatak/obavezu za korisnika. Koristi za "podsjeti me", "dodaj obavezu", "moram da...", "zapamti da trebam..."',
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
      'Prikazuje listu korisnikovih zadataka. Koristi kad korisnik pita "šta imam danas", "moje obaveze", "lista zadataka".',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: {
          type: 'string',
          enum: ['pending', 'completed', 'all'],
          description: 'Filter po statusu (default: pending)',
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
    description: 'Označava zadatak kao završen. Koristi kad korisnik kaže "završio sam", "obavio sam", "done".',
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
    name: 'edit_task',
    description: 'Mijenja postojeći zadatak - naslov, opis, prioritet ili rok.',
    input_schema: {
      type: 'object' as const,
      properties: {
        task_id: {
          type: 'number',
          description: 'ID zadatka za izmjenu',
        },
        title: {
          type: 'string',
          description: 'Novi naslov (opciono)',
        },
        description: {
          type: 'string',
          description: 'Novi opis (opciono)',
        },
        due_date: {
          type: 'string',
          description: 'Novi rok u ISO formatu (opciono)',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Novi prioritet (opciono)',
        },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'delete_task',
    description: 'Briše zadatak. Koristi kad korisnik kaže "obriši zadatak", "ukloni obavezu".',
    input_schema: {
      type: 'object' as const,
      properties: {
        task_id: {
          type: 'number',
          description: 'ID zadatka za brisanje',
        },
      },
      required: ['task_id'],
    },
  },

  // --- Calendar ---
  {
    name: 'read_calendar',
    description:
      'Čita događaje iz kalendara telefona. Koristi kad korisnik pita "šta imam u kalendaru", "moji sastanci", "raspored za sutra".',
    input_schema: {
      type: 'object' as const,
      properties: {
        start_date: {
          type: 'string',
          description: 'Početni datum za pretragu (ISO format, default: danas)',
        },
        end_date: {
          type: 'string',
          description: 'Krajnji datum za pretragu (ISO format, default: +7 dana)',
        },
        limit: {
          type: 'number',
          description: 'Maksimalan broj rezultata (default: 20)',
        },
      },
    },
  },
  {
    name: 'create_event',
    description:
      'Dodaje novi događaj u kalendar telefona. Koristi za "dodaj u kalendar", "zakaži sastanak", "napravi event".',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: {
          type: 'string',
          description: 'Naziv događaja',
        },
        start_date: {
          type: 'string',
          description: 'Početak događaja u ISO formatu',
        },
        end_date: {
          type: 'string',
          description: 'Kraj događaja u ISO formatu (opciono, default: +1h)',
        },
        location: {
          type: 'string',
          description: 'Lokacija događaja (opciono)',
        },
        notes: {
          type: 'string',
          description: 'Bilješke za događaj (opciono)',
        },
        all_day: {
          type: 'boolean',
          description: 'Da li je cjelodnevni događaj (default: false)',
        },
      },
      required: ['title', 'start_date'],
    },
  },

  // --- Reminders/Notifications ---
  {
    name: 'set_reminder',
    description:
      'Postavlja podsjetnik/notifikaciju koja će se pojaviti u određeno vrijeme. Koristi za "podsjeti me u 9", "javi mi za sat vremena".',
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
    name: 'list_reminders',
    description: 'Prikazuje zakazane podsjetnike.',
    input_schema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'cancel_reminder',
    description: 'Otkazuje zakazani podsjetnik.',
    input_schema: {
      type: 'object' as const,
      properties: {
        notification_id: {
          type: 'string',
          description: 'ID notifikacije za otkazivanje',
        },
      },
      required: ['notification_id'],
    },
  },

  // --- Routines & Insights ---
  {
    name: 'get_routine_info',
    description:
      'Vraća informacije o naučenim rutinama korisnika. Koristi za savjete o optimizaciji vremena.',
    input_schema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'save_preference',
    description:
      'Pamti korisnikovu preferencu. Koristi kad korisnik kaže "zapamti da volim...", "uvijek želim...".',
    input_schema: {
      type: 'object' as const,
      properties: {
        key: {
          type: 'string',
          description: 'Ključ preference (npr. "wake_time", "favorite_coffee")',
        },
        value: {
          type: 'string',
          description: 'Vrijednost preference',
        },
      },
      required: ['key', 'value'],
    },
  },

  // --- Schedule & Optimization ---
  {
    name: 'suggest_schedule',
    description:
      'Predlaže optimalan raspored za danas na osnovu prioriteta zadataka. Koristi za "organizuj mi dan", "napravi raspored".',
    input_schema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'get_productivity_score',
    description:
      'Vraća ocjenu produktivnosti korisnika baziranu na završenim/nezavršenim zadacima.',
    input_schema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'get_insights',
    description:
      'Vraća personalizirane uvide i savjete za korisnika. Koristi za "daj mi savjet", "kako mogu biti produktivniji".',
    input_schema: {
      type: 'object' as const,
      properties: {},
    },
  },
  // --- Web Search ---
  {
    name: 'web_search',
    description:
      'Pretražuje internet koristeći Google. Koristi za recepte, vijesti, informacije, savjete, bilo šta što zahtijeva aktuelne podatke s interneta.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Pojam za pretragu (na jeziku koji daje najbolje rezultate)',
        },
        num_results: {
          type: 'number',
          description: 'Broj rezultata (default: 5, max: 10)',
        },
      },
      required: ['query'],
    },
  },

  {
    name: 'get_daily_summary',
    description:
      'Vraća dnevni pregled: broj obaveza, završeno danas, podsjetnici, savjeti. Koristi za "dnevni pregled", "šta imam danas", "sumiraj mi dan".',
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
  try {
    switch (toolName) {
      // Task Management
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

      case 'edit_task':
        return db.editTask(input.task_id as number, {
          title: input.title as string | undefined,
          description: input.description as string | undefined,
          dueDate: input.due_date as string | undefined,
          priority: input.priority as string | undefined,
        });

      case 'delete_task':
        return db.deleteTask(input.task_id as number);

      // Calendar
      case 'read_calendar':
        return calendar.getEvents({
          startDate: input.start_date as string | undefined,
          endDate: input.end_date as string | undefined,
          limit: input.limit as number | undefined,
        });

      case 'create_event':
        return calendar.createEvent({
          title: input.title as string,
          startDate: input.start_date as string,
          endDate: input.end_date as string | undefined,
          location: input.location as string | undefined,
          notes: input.notes as string | undefined,
          allDay: input.all_day as boolean | undefined,
        });

      // Reminders
      case 'set_reminder': {
        // Save to DB and schedule notification
        const dbResult = await db.createReminder({
          message: input.message as string,
          datetime: input.datetime as string,
        });
        const notifResult = await notifications.scheduleReminder({
          message: input.message as string,
          datetime: input.datetime as string,
        });
        return {
          ...dbResult,
          notification: notifResult.success
            ? notifResult.message
            : notifResult.message,
        };
      }

      case 'list_reminders': {
        const scheduled = await notifications.getScheduled();
        return {
          success: true,
          reminders: scheduled.map((n) => ({
            id: n.identifier,
            title: n.content.title,
            message: n.content.body,
            trigger: n.trigger,
          })),
          count: scheduled.length,
        };
      }

      case 'cancel_reminder':
        await notifications.cancelNotification(input.notification_id as string);
        return { success: true, message: 'Podsjetnik otkazan.' };

      // Routines & Preferences
      case 'get_routine_info':
        return db.getRoutines();

      case 'save_preference':
        await db.setPreference(input.key as string, input.value as string);
        return {
          success: true,
          message: `Zapamtio sam: ${input.key} = ${input.value}`,
        };

      // Schedule & Optimization
      case 'suggest_schedule':
        return scheduler.suggestSchedule();

      case 'get_productivity_score':
        return scheduler.getProductivityScore();

      case 'get_insights':
        return optimizer.getInsights();

      case 'get_daily_summary':
        return agentCore.getDailySummary();

      // Web Search
      case 'web_search': {
        if (!googleSearch.isConfigured()) {
          return { error: true, message: 'Google Search nije podešen. Korisnik treba unijeti Google API key u Postavke.' };
        }
        const results = await googleSearch.search(
          input.query as string,
          (input.num_results as number) || 5
        );
        return {
          success: true,
          query: input.query,
          results: results.map((r) => ({
            title: r.title,
            snippet: r.snippet,
            url: r.link,
          })),
          count: results.length,
        };
      }

      default:
        return { error: `Nepoznat tool: ${toolName}` };
    }
  } catch (error) {
    return {
      error: true,
      message: error instanceof Error ? error.message : 'Nepoznata greška pri izvršavanju.',
    };
  }
}
