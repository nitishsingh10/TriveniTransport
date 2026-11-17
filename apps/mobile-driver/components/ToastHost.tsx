import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react-native';
import { BorderRadius, FontSize, FontWeight, Shadow, Spacing, type ThemeColors } from '@/constants/theme';
import { useAppTheme, useThemedStyles } from '@/components/ThemeProvider';

export type ToastVariant = 'success' | 'error' | 'info';
export interface ToastMessage {
  title: string;
  message?: string;
  variant?: ToastVariant;
}

type ToastEvent = ToastMessage & { id: number };
type ToastListener = (event: ToastEvent) => void;
const listeners = new Set<ToastListener>();
let nextToastId = 0;

export function showToast(message: ToastMessage) {
  const event = { ...message, id: ++nextToastId };
  listeners.forEach((listener) => listener(event));
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  layer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 1000, elevation: 30 },
  placement: { position: 'absolute', top: 56, left: 16, right: 16, alignItems: 'center' },
  pill: {
    width: '100%',
    maxWidth: 520,
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadow.md,
  },
  iconWell: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  title: { color: Colors.navyDark, fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  message: { color: Colors.textSecondary, fontSize: FontSize.xxs, marginTop: 2 },
  dismiss: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  dismissText: { color: Colors.textMuted, fontSize: 18, lineHeight: 20 },
});

export function ToastHost() {
  const { colors: Colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const useNativeDriver = Platform.OS !== 'web';
  const [toast, setToast] = useState<ToastEvent | null>(null);
  const animation = useRef(new Animated.Value(0)).current;
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = null;
    Animated.timing(animation, { toValue: 0, duration: 140, useNativeDriver }).start(() => setToast(null));
  }, [animation, useNativeDriver]);

  useEffect(() => {
    const listener: ToastListener = (event) => {
      if (timeout.current) clearTimeout(timeout.current);
      setToast(event);
      animation.stopAnimation();
      animation.setValue(0);
      Animated.spring(animation, { toValue: 1, speed: 22, bounciness: 2, useNativeDriver }).start();
      timeout.current = setTimeout(dismiss, 3600);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, [animation, dismiss, useNativeDriver]);

  if (!toast) return null;

  const variant = toast.variant ?? 'info';
  const iconColor = variant === 'success' ? Colors.success : variant === 'error' ? Colors.error : Colors.info;
  const iconBackground = variant === 'success' ? Colors.successLight : variant === 'error' ? Colors.errorLight : Colors.infoLight;
  const Icon = variant === 'success' ? CheckCircle2 : variant === 'error' ? AlertCircle : Info;

  return (
    <View pointerEvents="box-none" style={styles.layer}>
      <View pointerEvents="box-none" style={[styles.placement, { top: Math.max(8, insets.top + 8) }]}>
        <Animated.View
          accessibilityLiveRegion="polite"
          style={{
            width: '100%',
            maxWidth: 520,
            opacity: animation,
            transform: [{ translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
          }}
        >
          <View style={styles.pill}>
            <View style={[styles.iconWell, { backgroundColor: iconBackground }]}>
              <Icon size={17} color={iconColor} strokeWidth={2.4} />
            </View>
            <View style={styles.copy}>
              <Text style={styles.title} numberOfLines={1}>{toast.title}</Text>
              {!!toast.message && <Text style={styles.message} numberOfLines={2}>{toast.message}</Text>}
            </View>
            <Pressable onPress={dismiss} accessibilityRole="button" accessibilityLabel="Dismiss notification" style={styles.dismiss}>
              <Text style={styles.dismissText}>×</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}
