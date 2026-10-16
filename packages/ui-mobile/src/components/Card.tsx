import React from 'react';
import { View, StyleSheet, ViewStyle, ViewProps } from 'react-native';
import { colors, radii, spacing } from '../theme';

export interface CardProps extends ViewProps {
  variant?: 'elevated' | 'glass' | 'outlined';
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  variant = 'elevated',
  children,
  style,
  ...rest
}) => {
  const getCardStyle = (): ViewStyle => {
    const base: ViewStyle = {
      borderRadius: radii.xl,
      padding: spacing.lg,
    };

    if (variant === 'glass') {
      return {
        ...base,
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        borderColor: 'rgba(255, 255, 255, 0.95)',
        borderWidth: 1.5,
        shadowColor: colors.brand[700],
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 4,
      };
    }

    if (variant === 'outlined') {
      return {
        ...base,
        backgroundColor: colors.surface,
        borderColor: colors.gray[200],
        borderWidth: 1.5,
      };
    }

    // Default: elevated
    return {
      ...base,
      backgroundColor: colors.surface,
      borderColor: 'rgba(13, 31, 55, 0.06)',
      borderWidth: 1,
      shadowColor: colors.brand[900],
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
      elevation: 3,
    };
  };

  return (
    <View style={[getCardStyle(), style]} {...rest}>
      {children}
    </View>
  );
};
