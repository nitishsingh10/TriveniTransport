import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Moon, Sun } from 'lucide-react-native';
import { BorderRadius, FontSize, FontWeight, Spacing, type ThemeColors } from '@/constants/theme';
import { useAppTheme, useThemedStyles } from '@/components/ThemeProvider';

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  heading: { color: Colors.navyDark, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  hint: { color: Colors.textSecondary, fontSize: FontSize.xs, marginTop: 3 },
  options: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.md,
    padding: 4,
    gap: 4,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    minHeight: 40,
    borderRadius: BorderRadius.sm,
  },
  optionActive: { backgroundColor: Colors.brandSurface },
  optionText: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  optionTextActive: { color: Colors.white },
});

export function AppearanceControl() {
  const { colors: Colors, mode, setMode } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.card}>
      <View>
        <Text style={styles.heading}>Appearance</Text>
        <Text style={styles.hint}>Choose a comfortable look for the app.</Text>
      </View>
      <View style={styles.options} accessibilityRole="radiogroup">
        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ selected: mode === 'light' }}
          onPress={() => void setMode('light')}
          style={[styles.option, mode === 'light' && styles.optionActive]}
        >
          <Sun size={15} color={mode === 'light' ? Colors.white : Colors.textSecondary} />
          <Text style={[styles.optionText, mode === 'light' && styles.optionTextActive]}>Light</Text>
        </Pressable>
        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ selected: mode === 'dark' }}
          onPress={() => void setMode('dark')}
          style={[styles.option, mode === 'dark' && styles.optionActive]}
        >
          <Moon size={15} color={mode === 'dark' ? Colors.white : Colors.textSecondary} />
          <Text style={[styles.optionText, mode === 'dark' && styles.optionTextActive]}>Dark</Text>
        </Pressable>
      </View>
    </View>
  );
}
