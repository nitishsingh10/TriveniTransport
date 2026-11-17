import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { registerDriverPushToken } from '@/lib/notifications';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const triveniDriverTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.navy,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.navy,
    border: Colors.cardBorder,
    notification: Colors.marigold,
  },
};

export default function RootLayout() {
  const hydrateAuth = useAuthStore((s) => s.hydrateAuth);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    // Hydrate auth session from storage before hiding splash screen
    // Android nav bar is hidden natively via app.json androidNavigationBar config
    hydrateAuth()
      .catch((err) => console.warn('Driver auth hydration error:', err))
      .finally(async () => {
        try {
          await SplashScreen.hideAsync();
        } catch {}
      });
  }, [hydrateAuth]);

  useEffect(() => {
    if (!isAuthenticated || Platform.OS === 'web') return;

    void registerDriverPushToken().catch((error) => {
      console.warn('Driver push registration failed; foreground polling remains available:', error);
    });

    const tokenSubscription = Notifications.addPushTokenListener(() => {
      void registerDriverPushToken().catch((error) => {
        console.warn('Could not refresh driver push token:', error);
      });
    });
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(() => {
      router.replace('/(tabs)');
    });

    return () => {
      tokenSubscription.remove();
      responseSubscription.remove();
    };
  }, [isAuthenticated]);

  return (
    <ThemeProvider value={triveniDriverTheme}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.headerBackground,
          },
          headerTintColor: Colors.navy,
          headerTitleStyle: {
            fontWeight: '700',
            color: Colors.navy,
          },
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="delivery/[id]/confirm" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
