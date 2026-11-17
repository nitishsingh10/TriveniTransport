import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppThemeProvider, useAppTheme } from '@/components/ThemeProvider';
import { ToastHost } from '@/components/ToastHost';
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

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <RootNavigation />
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}

function RootNavigation() {
  const { colors: Colors, mode } = useAppTheme();
  const hydrateAuth = useAuthStore((s) => s.hydrateAuth);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const baseTheme = mode === 'dark' ? DarkTheme : DefaultTheme;
  const triveniTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: Colors.marigold,
      background: Colors.background,
      card: Colors.surface,
      text: Colors.navyDark,
      border: Colors.cardBorder,
      notification: Colors.marigold,
    },
  };

  useEffect(() => {
    // Hydrate auth session from storage before hiding splash screen
    hydrateAuth()
      .catch((err) => {
        console.warn('Failed to hydrate auth in root layout:', err);
      })
      .finally(() => {
        SplashScreen.hideAsync();
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
    <NavigationThemeProvider value={triveniTheme}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.headerBackground,
          },
          headerTintColor: Colors.text,
          headerTitleStyle: {
            fontWeight: '700',
            color: Colors.text,
          },
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="delivery/[id]/confirm" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <ToastHost />
    </NavigationThemeProvider>
  );
}
