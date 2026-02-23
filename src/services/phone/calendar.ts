import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

class CalendarService {
  private hasPermission = false;

  async requestPermission(): Promise<boolean> {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    this.hasPermission = status === 'granted';
    return this.hasPermission;
  }

  private async ensurePermission(): Promise<void> {
    if (!this.hasPermission) {
      const granted = await this.requestPermission();
      if (!granted) {
        throw new Error('Nema dozvole za pristup kalendaru. Omogući u postavkama telefona.');
      }
    }
  }

  private async getDefaultCalendarId(): Promise<string> {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

    // Try to find the default calendar
    const defaultCal = calendars.find(
      (c) => c.isPrimary || c.allowsModifications
    );

    if (defaultCal) return defaultCal.id;

    // Create one if none exists (Android)
    if (Platform.OS === 'android') {
      const newCalId = await Calendar.createCalendarAsync({
        title: 'RAFI',
        color: '#6C63FF',
        entityType: Calendar.EntityTypes.EVENT,
        source: {
          isLocalAccount: true,
          name: 'RAFI Calendar',
          type: Calendar.CalendarType.LOCAL,
        },
        name: 'RAFI',
        ownerAccount: 'personal',
        accessLevel: Calendar.CalendarAccessLevel.OWNER,
      });
      return newCalId;
    }

    throw new Error('Nema dostupnog kalendara na uređaju.');
  }

  async getEvents(options: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<{
    success: boolean;
    events: Array<{
      id: string;
      title: string;
      startDate: string;
      endDate: string;
      location?: string;
      notes?: string;
    }>;
    message: string;
  }> {
    await this.ensurePermission();

    const now = new Date();
    const start = options.startDate ? new Date(options.startDate) : now;
    const end = options.endDate
      ? new Date(options.endDate)
      : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Default: next 7 days

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const calendarIds = calendars.map((c) => c.id);

    const events = await Calendar.getEventsAsync(calendarIds, start, end);

    const mapped = events
      .slice(0, options.limit || 20)
      .map((e) => ({
        id: e.id,
        title: e.title,
        startDate: String(e.startDate),
        endDate: String(e.endDate),
        location: e.location || undefined,
        notes: e.notes || undefined,
      }));

    return {
      success: true,
      events: mapped,
      message: mapped.length > 0
        ? `Pronađeno ${mapped.length} događaja.`
        : 'Nema događaja u tom periodu.',
    };
  }

  async createEvent(options: {
    title: string;
    startDate: string;
    endDate?: string;
    location?: string;
    notes?: string;
    allDay?: boolean;
  }): Promise<{ success: boolean; event_id: string; message: string }> {
    await this.ensurePermission();

    const calendarId = await this.getDefaultCalendarId();

    const start = new Date(options.startDate);
    const end = options.endDate
      ? new Date(options.endDate)
      : new Date(start.getTime() + 60 * 60 * 1000); // Default: 1 hour

    const eventId = await Calendar.createEventAsync(calendarId, {
      title: options.title,
      startDate: start,
      endDate: end,
      location: options.location,
      notes: options.notes,
      allDay: options.allDay || false,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    return {
      success: true,
      event_id: eventId,
      message: `Događaj "${options.title}" dodan u kalendar za ${start.toLocaleDateString()} ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
    };
  }
}

export const calendar = new CalendarService();
