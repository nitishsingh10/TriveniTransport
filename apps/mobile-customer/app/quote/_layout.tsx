import { Stack } from 'expo-router';
import { useAppTheme } from '@/components/ThemeProvider';


export default function QuoteLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Move Details (Step 1)' }} />
      <Stack.Screen name="inventory" options={{ title: 'Select Inventory (Step 2)' }} />
      <Stack.Screen name="summary" options={{ title: 'Quote Breakdown (Step 3)' }} />
    </Stack>
  );
}
