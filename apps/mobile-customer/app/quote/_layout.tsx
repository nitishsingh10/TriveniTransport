import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function QuoteLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Move Details (Step 1)' }} />
      <Stack.Screen name="inventory" options={{ title: 'Select Inventory (Step 2)' }} />
      <Stack.Screen name="summary" options={{ title: 'Quote Breakdown (Step 3)' }} />
    </Stack>
  );
}
