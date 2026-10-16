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
} from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';

const OTP_LENGTH = 6;

export default function OtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleChange = (val: string, index: number) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);
    if (val && index < OTP_LENGTH - 1) {
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

  const handleVerify = async (code?: string) => {
    const finalOtp = code ?? otp.join('');
    if (finalOtp.length !== OTP_LENGTH) return;

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await authApi.verifyOtp(phone || '9820098200', finalOtp);
      setAuth(
        {
          id: res.userId,
          role: 'customer',
          name: 'Verified Customer',
          phone: `+91${phone}`,
        },
        res.accessToken
      );
      setLoading(false);
      router.replace('/(tabs)');
    } catch (e: any) {
      console.log('Backend verifyOtp error:', e.message);
      // Fallback for dev OTP
      if (finalOtp === '123456') {
        setAuth(
          { id: 'cust_seed', role: 'customer', name: 'Verified Customer', phone: `+91${phone}` },
          'dev_customer_token'
        );
        setLoading(false);
        router.replace('/(tabs)');
      } else {
        setErrorMsg(e.message || 'Invalid verification code. Please check and try again.');
        setLoading(false);
      }
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setOtp(Array(OTP_LENGTH).fill(''));
    setResendTimer(30);
    setErrorMsg('');
    try {
      await authApi.requestOtp(phone || '9820098200');
    } catch {}
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
            <ArrowLeft size={16} color={Colors.navy} />
            <Text style={styles.backText}>Back to Phone Number</Text>
          </TouchableOpacity>

          <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.shieldIconContainer}>
                <ShieldCheck size={28} color={Colors.marigold} strokeWidth={2.2} />
              </View>
              <Text style={styles.title}>Enter OTP Code</Text>
              <Text style={styles.subtitle}>
                We have sent a 6-digit code to{' '}
                <Text style={styles.phoneHighlight}>+91 {phone}</Text>
              </Text>
            </View>

            {/* Dev hint banner (Matching web login page) */}
            <View style={styles.devHint}>
              <Text style={styles.devHintText}>
                Dev mode: use OTP <Text style={{ fontWeight: 'bold' }}>123456</Text>
              </Text>
            </View>

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
                  maxLength={1}
                  textAlign="center"
                  selectionColor={Colors.navy}
                  caretHidden
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
                color={resendTimer > 0 ? Colors.textMuted : Colors.navy}
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
                (loading || otp.join('').length !== OTP_LENGTH) && styles.ctaDisabled,
              ]}
              onPress={() => handleVerify()}
              disabled={loading || otp.join('').length !== OTP_LENGTH}
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

const styles = StyleSheet.create({
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
    backgroundColor: 'rgba(13, 31, 55, 0.05)',
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
    color: Colors.navy,
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
    color: Colors.navy,
    fontWeight: FontWeight.bold,
  },

  devHint: {
    backgroundColor: 'rgba(247, 163, 0, 0.1)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.marigoldBorder,
    alignSelf: 'center',
  },
  devHintText: {
    color: '#B45309',
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.medium,
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
    color: Colors.navy,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  otpBoxFilled: {
    borderColor: Colors.navy,
    backgroundColor: Colors.surfaceSubtle,
  },

  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  resend: {
    color: Colors.navy,
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
