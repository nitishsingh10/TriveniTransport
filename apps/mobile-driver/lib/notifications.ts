import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { driverVendorApi } from '@/lib/api';

export async function registerDriverPushToken(): Promise<void> {
  if (Platform.OS === 'web') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('driver-orders', {
      name: 'Order requests',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F5A000',
    });
  }

  const current = await Notifications.getPermissionsAsync();
  const permission = current.status === 'granted'
    ? current
    : await Notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') return;

  const projectId = Constants.easConfig?.projectId || Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) throw new Error('EAS project ID is missing from the driver app configuration.');

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await driverVendorApi.updatePushToken(token);
}
