import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  LayoutChangeEvent,
  StyleProp,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/components/ThemeProvider';
import { BorderRadius, FontSize, FontWeight, Shadow } from '@/constants/theme';

export interface SlidingPillOption<T = string | number | boolean> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface SlidingPillProps<T = string | number | boolean> {
  options: [SlidingPillOption<T>, SlidingPillOption<T>];
  value: T;
  onChange: (val: T) => void;
  style?: StyleProp<ViewStyle>;
  hapticFeedback?: boolean;
}

const PADDING = 4;

export function SlidingPill<T = string | number | boolean>({
  options,
  value,
  onChange,
  style,
  hapticFeedback = true,
}: SlidingPillProps<T>) {
  const { colors: Colors, mode } = useAppTheme();
  const [containerWidth, setContainerWidth] = useState(0);

  const selectedIndex = options.findIndex((opt) => opt.value === value);
  const activeIndex = selectedIndex >= 0 ? selectedIndex : 0;

  const anim = useRef(new Animated.Value(activeIndex)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: activeIndex,
      useNativeDriver: true,
      speed: 28,
      bounciness: 4,
    }).start();
  }, [activeIndex]);

  const handleSelect = (val: T, index: number) => {
    if (val === value) return;
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onChange(val);
  };

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0 && width !== containerWidth) {
      setContainerWidth(width);
    }
  };

  const segmentWidth = containerWidth > 0 ? (containerWidth - PADDING * 2) / 2 : 0;

  const translateX = segmentWidth > 0
    ? anim.interpolate({
        inputRange: [0, 1],
        outputRange: [PADDING, PADDING + segmentWidth],
      })
    : PADDING;

  const isDark = mode === 'dark';

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.container,
        {
          backgroundColor: isDark ? Colors.inputBg : '#F1F5F9',
          borderColor: Colors.cardBorder,
        },
        style,
      ]}
    >
      {segmentWidth > 0 && (
        <Animated.View
          style={[
            styles.indicator,
            {
              width: segmentWidth,
              transform: [{ translateX }],
              backgroundColor: isDark ? Colors.surfaceElevated : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.08)',
            },
          ]}
        />
      )}

      {options.map((option, idx) => {
        const isActive = activeIndex === idx;
        return (
          <TouchableOpacity
            key={String(option.value)}
            style={styles.segment}
            activeOpacity={0.85}
            onPress={() => handleSelect(option.value, idx)}
          >
            {option.icon && (
              <View style={[styles.iconWrapper, isActive && styles.activeIconWrapper]}>
                {option.icon}
              </View>
            )}
            <Text
              style={[
                styles.label,
                {
                  color: isActive ? Colors.text : Colors.textSecondary,
                  fontWeight: isActive ? FontWeight.bold : FontWeight.medium,
                },
              ]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

interface SlidingPillToggleProps {
  value: boolean;
  onChange: (val: boolean) => void;
  trueLabel?: string;
  falseLabel?: string;
  trueIcon?: React.ReactNode;
  falseIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  hapticFeedback?: boolean;
}

export function SlidingPillToggle({
  value,
  onChange,
  trueLabel = 'Yes',
  falseLabel = 'No',
  trueIcon,
  falseIcon,
  style,
  hapticFeedback = true,
}: SlidingPillToggleProps) {
  const options: [SlidingPillOption<boolean>, SlidingPillOption<boolean>] = [
    { value: false, label: falseLabel, icon: falseIcon },
    { value: true, label: trueLabel, icon: trueIcon },
  ];

  return (
    <SlidingPill
      options={options}
      value={value}
      onChange={onChange}
      style={style}
      hapticFeedback={hapticFeedback}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    height: 42,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: PADDING,
    position: 'relative',
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    top: PADDING,
    bottom: PADDING,
    left: 0,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    ...Shadow.sm,
  },
  segment: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 1,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconWrapper: {
    opacity: 1,
  },
  label: {
    fontSize: FontSize.xs + 0.5,
  },
});
