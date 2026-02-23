import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private hasPermission = false;

  async init(): Promise<void> {
    await this.requestPermission();

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Podsjetnici',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
      });

      await Notifications.setNotificationChannelAsync('tasks', {
        name: 'Zadaci',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
      });
    }
  }

  async requestPermission(): Promise<boolean> {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') {
      this.hasPermission = true;
      return true;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    this.hasPermission = status === 'granted';
    return this.hasPermission;
  }

  async scheduleReminder(options: {
    message: string;
    datetime: string;
    title?: string;
  }): Promise<{
    success: boolean;
    notification_id: string;
    message: string;
  }> {
    if (!this.hasPermission) {
      const granted = await this.requestPermission();
      if (!granted) {
        return {
          success: false,
          notification_id: '',
          message: 'Nema dozvole za notifikacije. Omogući u postavkama telefona.',
        };
      }
    }

    const triggerDate = new Date(options.datetime);
    const now = new Date();

    if (triggerDate <= now) {
      return {
        success: false,
        notification_id: '',
        message: 'Vrijeme podsjetnika mora biti u budućnosti.',
      };
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: options.title || 'RAFI Podsjetnik',
        body: options.message,
        sound: 'default',
        data: { type: 'reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: 'reminders',
      },
    });

    const timeStr = triggerDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const dateStr = triggerDate.toLocaleDateString();

    return {
      success: true,
      notification_id: id,
      message: `Podsjetnik postavljen za ${dateStr} u ${timeStr}: "${options.message}"`,
    };
  }

  async scheduleTaskReminder(options: {
    taskId: number;
    taskTitle: string;
    datetime: string;
  }): Promise<string> {
    const result = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Obaveza',
        body: options.taskTitle,
        sound: 'default',
        data: { type: 'task', taskId: options.taskId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(options.datetime),
        channelId: 'tasks',
      },
    });

    return result;
  }

  async cancelNotification(id: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(id);
  }

  async cancelAll(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async getScheduled(): Promise<Notifications.NotificationRequest[]> {
    return Notifications.getAllScheduledNotificationsAsync();
  }

  onNotificationReceived(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.EventSubscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  onNotificationResponse(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.EventSubscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }
}

export const notifications = new NotificationService();
