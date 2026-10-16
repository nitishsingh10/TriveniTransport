import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  PressableProps,
} from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: 'primary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  onPress,
  ...rest
}) => {
  const getContainerStyle = (pressed: boolean): ViewStyle => {
    let bg: string = colors.brand[700];
    let border: string = 'transparent';
    let borderWidth = 0;

    if (variant === 'accent') {
      bg = colors.accent[500];
    } else if (variant === 'outline') {
      bg = 'transparent';
      border = colors.brand[700];
      borderWidth = 1.5;
    } else if (variant === 'ghost') {
      bg = 'transparent';
    }

    if (disabled) {
      bg = colors.gray[200];
      border = 'transparent';
    }

    let padY = spacing.md;
    let padX = spacing.xl;
    if (size === 'sm') {
      padY = spacing.sm;
      padX = spacing.md;
    } else if (size === 'lg') {
      padY = spacing.lg;
      padX = spacing.xxl;
    }

    return {
      backgroundColor: bg,
      borderColor: border,
      borderWidth,
      paddingVertical: padY,
      paddingHorizontal: padX,
      borderRadius: radii.xl,
      opacity: pressed ? 0.85 : 1,
      transform: [{ scale: pressed ? 0.98 : 1 }],
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      ...style,
    };
  };

  const getTextStyle = (): TextStyle => {
    let color: string = colors.text.inverse;
    if (variant === 'accent') color = colors.brand[900];
    if (variant === 'outline' || variant === 'ghost') color = colors.brand[700];
    if (disabled) color = colors.gray[400];

    let fontSize = typography.sizes.base;
    if (size === 'sm') fontSize = typography.sizes.sm;
    if (size === 'lg') fontSize = typography.sizes.lg;

    return {
      color,
      fontSize,
      fontWeight: typography.weights.bold,
      letterSpacing: -0.2,
      ...textStyle,
    };
  };

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => getContainerStyle(pressed)}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'accent' ? colors.brand[900] : '#ffffff'}
        />
      ) : (
        <>
          {icon}
          <Text style={getTextStyle()}>{title}</Text>
        </>
      )}
    </Pressable>
  );
};
