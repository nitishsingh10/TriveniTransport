import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
} from 'lucide-react-native';
import type { ThemeColors } from '@/constants/theme';
import { useAppTheme, useThemedStyles } from '@/components/ThemeProvider';
import { Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';

const OTP_LENGTH = 6;

export default function OtpScreen() {
  const { colors: Colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const { identifier, phone: legacyPhone, isSignup, name } = useLocalSearchParams<{
    identifier: string;
    phone?: string;
    isSignup?: string;
    name?: string;
  }>();

  // Support legacy `phone` param for backward compatibility
  const resolvedIdentifier = identifier || legacyPhone || '';
  const isEmail = resolvedIdentifier.includes('@');
  const isSignupBool = isSignup === 'true';

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [errorMsg, setErrorMsg] = useState('');
  const [userNotFound, setUserNotFound] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  useEffect(() => {
    if (!resolvedIdentifier) router.replace('/(auth)/login' as any);
  }, [resolvedIdentifier]);

  const handleChange = (val: string, index: number) => {
    setErrorMsg('');
    setUserNotFound(false);
    const clean = val.replace(/\D/g, '');

    // Handle full paste or autofill of OTP
    if (clean.length > 1) {
      const pasted = clean.slice(0, OTP_LENGTH).split('');
      const newOtp = [...otp];
      pasted.forEach((ch, idx) => {
        if (idx < OTP_LENGTH) newOtp[idx] = ch;
      });
      setOtp(newOtp);
      const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
      inputRefs.current[focusIdx]?.focus();
      if (pasted.length === OTP_LENGTH) {
        handleVerify(pasted.join(''));
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = clean.slice(-1);
    setOtp(newOtp);

    if (clean && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((d) => d !== '') && newOtp.join('').length === OTP_LENGTH) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyPress = (e: { nativeEvent: { key: string } }, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (codeOverride?: string) => {
    const finalOtp = codeOverride ?? otp.join('');
    if (finalOtp.length !== OTP_LENGTH) {
      setErrorMsg('Please enter all 6 digits of the OTP code.');
      const firstEmptyIndex = otp.findIndex((d) => !d);
      if (firstEmptyIndex !== -1) {
        inputRefs.current[firstEmptyIndex]?.focus();
      }
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setUserNotFound(false);

    try {
      const res = await authApi.verifyOtp(resolvedIdentifier, finalOtp, isSignupBool, name);
      const userPhone = res.user?.phone ? (res.user.phone.startsWith('+91') ? res.user.phone : `+91${res.user.phone}`) : undefined;
      const userName = res.user?.name || name || (isEmail ? '' : 'Customer');

      await setAuth(
        {
          id: res.userId,
          role: 'customer',
          name: userName,
          phone: userPhone,
          email: res.user?.email ?? (isEmail ? resolvedIdentifier : undefined),
        },
        res.accessToken,
        res.refreshToken
      );
      setLoading(false);

      const isProfileIncomplete = isEmail && (!userPhone || !userName || userName === 'Customer' || userName === 'Valued Customer');
      if (isProfileIncomplete) {
        router.replace('/complete-profile' as any);
      } else {
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      const msg = e.message || 'Invalid verification code. Please check and try again.';
      console.log('Backend verifyOtp error:', msg);

      if (e.code === 'USER_NOT_FOUND' || msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('sign up first')) {
        setUserNotFound(true);
        setErrorMsg('No account found for this mobile/email. Please sign up first.');
      } else {
        setErrorMsg(msg);
      }
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setOtp(Array(OTP_LENGTH).fill(''));
    setResendTimer(30);
    setErrorMsg('');
    setUserNotFound(false);
    try {
      await authApi.requestOtp(resolvedIdentifier, isSignupBool);
    } catch (e: any) {
      setErrorMsg(e.message || 'Could not resend code. Please try again.');
    }
    inputRefs.current[0]?.focus();
  };

  return (
    <View style={styles.screen}>
      <View style={styles.bgBlobNavy} />
      <View style={styles.bgBlobMarigold} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.container}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <ArrowLeft size={16} color={Colors.text} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.shieldIconContainer}>
                <ShieldCheck size={28} color={Colors.marigold} strokeWidth={2.2} />
              </View>
              <Text style={styles.title}>Enter OTP Code</Text>
              <Text style={styles.subtitle}>
                We sent a 6-digit code to{' '}
                <Text style={styles.phoneHighlight}>
                  {isEmail ? resolvedIdentifier : `+91 ${resolvedIdentifier}`}
                </Text>
              </Text>
            </View>

            {/* Error Banner */}
            {errorMsg ? (
              <View style={styles.errorBanner}>
                <AlertCircle size={16} color="#DC2626" strokeWidth={2.2} />
                <View style={styles.errorTextCol}>
                  <Text style={styles.errorText}>{errorMsg}</Text>
                  {userNotFound && (
                    <TouchableOpacity
                      style={styles.switchAuthBtn}
                      onPress={() => router.replace('/(auth)/login' as any)}
                    >
                      <Text style={styles.switchAuthText}>Go to Create Account →</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : null}

            {/* OTP Boxes */}
            <View style={styles.otpRow}>
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(ref) => {
                    inputRefs.current[i] = ref;
                  }}
                  style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                  value={digit}
                  onChangeText={(val) => handleChange(val, i)}
                  onKeyPress={(e) => handleKeyPress(e, i)}
                  keyboardType="number-pad"
                  maxLength={6}
                  textAlign="center"
                  selectionColor={Colors.text}
                />
              ))}
            </View>

            {/* Resend */}
            <TouchableOpacity
              onPress={handleResend}
              disabled={resendTimer > 0}
              style={styles.resendBtn}
            >
              <RotateCcw
                size={13}
                color={resendTimer > 0 ? Colors.textMuted : Colors.text}
              />
              <Text
                style={[
                  styles.resend,
                  resendTimer > 0 && styles.resendDisabled,
                ]}
              >
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code now'}
              </Text>
            </TouchableOpacity>

            {/* Verify CTA: Matching website submitBtnAccent */}
            <TouchableOpacity
              style={[
                styles.ctaButton,
                loading && styles.ctaDisabled,
              ]}
              onPress={() => handleVerify()}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color={Colors.navyDark} />
              ) : (
                <View style={styles.ctaContent}>
                  <Text style={styles.ctaText}>Verify & Sign In</Text>
                  <ArrowRight size={16} color={Colors.navyDark} strokeWidth={2.4} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
    position: 'relative',
  },
  flex: { flex: 1 },

  bgBlobNavy: {
    position: 'absolute',
    top: -60,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: Colors.navySubtle,
  },
  bgBlobMarigold: {
    position: 'absolute',
    bottom: -40,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(247, 163, 0, 0.08)',
  },

  container: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: 54,
    gap: Spacing.md,
    justifyContent: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs,
  },
  backText: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadow.md,
  },

  header: { gap: Spacing.xs, alignItems: 'center' },
  shieldIconContainer: {
    width: 54,
    height: 54,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.marigoldSubtle,
    borderWidth: 1,
    borderColor: Colors.marigoldBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.navyDark,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  phoneHighlight: {
    color: Colors.text,
    fontWeight: FontWeight.bold,
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  errorTextCol: {
    flex: 1,
    gap: 4,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    lineHeight: 18,
  },
  switchAuthBtn: {
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  switchAuthText: {
    color: '#991B1B',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    textDecorationLine: 'underline',
  },

  otpRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginVertical: Spacing.xs,
  },
  otpBox: {
    width: 44,
    height: 54,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    backgroundColor: Colors.inputBg,
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  otpBoxFilled: {
    borderColor: Colors.brandSurface,
    backgroundColor: Colors.surfaceSubtle,
  },

  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  resend: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  resendDisabled: { color: Colors.textMuted },

  ctaButton: {
    backgroundColor: Colors.marigold,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.glowSm,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  ctaText: {
    color: Colors.navyDark,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.3,
  },
});
