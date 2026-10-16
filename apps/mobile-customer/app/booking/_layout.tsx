import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function BookingLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.headerBackground,
        },
        headerTintColor: Colors.navy,
        headerTitleStyle: {
          fontWeight: '700',
          color: Colors.navy,
          fontSize: 16,
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="[id]/index" options={{ title: 'Track Your Move' }} />
      <Stack.Screen name="[id]/pay" options={{ title: 'Pay Advance', presentation: 'modal' }} />
      <Stack.Screen name="[id]/invoice" options={{ title: 'Tax Invoice' }} />
    </Stack>
  );
}
