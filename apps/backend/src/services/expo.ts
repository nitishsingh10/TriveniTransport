import { Expo } from 'expo-server-sdk';

const expo = new Expo();

export class PushNotificationService {
  /**
   * Sends a push notification to a specific expo push token.
   * Handles chunking and error reporting.
   */
  static async sendPush(token: string, title: string, body: string, data: any = {}) {
    if (!Expo.isExpoPushToken(token)) {
      console.warn('Skipping push notification because the Expo push token is invalid.');
      return [];
    }

    const messages = [{
      to: token,
      sound: 'default',
      title,
      body,
      data,
    }];

    // The Expo push service accepts batches of notifications so
    // that you don't need to send 1000 requests to send 1000 notifications.
    const chunks = expo.chunkPushNotifications(messages as any);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch {
        console.error('Expo push delivery failed.');
      }
    }
    
    // In production, we should handle ticket receipts to clean up invalid tokens
    return tickets;
  }
}
