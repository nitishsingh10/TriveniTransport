import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppThemeProvider, useAppTheme } from '@/components/ThemeProvider';
import { ToastHost } from '@/components/ToastHost';
import { useAuthStore } from '@/store/authStore';

// Prevent auto-hide of splash screen
SplashScreen.preventAutoHideAsync();

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
    // Android nav bar is hidden natively via app.json androidNavigationBar config
    hydrateAuth()
      .catch((err) => console.warn('Customer auth hydration error:', err))
      .finally(async () => {
        try {
          await SplashScreen.hideAsync();
        } catch {}
      });
  }, [hydrateAuth]);

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
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="complete-profile" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="quote" options={{ headerShown: false }} />
        <Stack.Screen name="booking" options={{ headerShown: false }} />
        <Stack.Screen name="transport" options={{ headerShown: false }} />
        <Stack.Screen name="saved-addresses" options={{ title: 'Saved Addresses', headerShown: true }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <ToastHost />
    </NavigationThemeProvider>
  );
}
