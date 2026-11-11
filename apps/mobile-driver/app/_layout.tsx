import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';

SplashScreen.preventAutoHideAsync();

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
