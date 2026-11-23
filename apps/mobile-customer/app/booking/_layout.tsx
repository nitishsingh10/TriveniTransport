import { Stack } from 'expo-router';
import { useAppTheme } from '@/components/ThemeProvider';


export default function BookingLayout() {
  const { colors: Colors } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.headerBackground,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: '700',
          color: Colors.text,
          fontSize: 16,
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="[id]/index" options={{ title: 'Track Your Move' }} />
      <Stack.Screen name="[id]/pay" options={{ title: 'Pay Advance', presentation: 'modal' }} />
      <Stack.Screen name="[id]/invoice" options={{ title: 'Payment Summary' }} />
    </Stack>
  );
}
