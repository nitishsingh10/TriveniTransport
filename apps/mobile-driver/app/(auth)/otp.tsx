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
import { useLocalSearchParams, router } from 'expo-router';
import { ShieldCheck, ArrowLeft, RotateCcw, CheckCircle2 } from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';

export default function DriverOtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [error, setError] = useState<string | null>(null);

  const inputs = useRef<Array<TextInput | null>>([]);
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (text: string, index: number) => {
    const clean = text.replace(/\D/g, '');
    const newOtp = [...otp];

    if (clean.length > 1) {
      // Pasting full 6-digit OTP
      const pasted = clean.slice(0, 6).split('');
      pasted.forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtp(newOtp);
      const nextFocus = Math.min(pasted.length, 5);
      inputs.current[nextFocus]?.focus();
      return;
    }

    newOtp[index] = clean;
    setOtp(newOtp);

    if (clean && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) return;

    setLoading(true);
    setError(null);

    try {
      // Simulate verification (in dev mode, accepts 123456 or calls backend /api/v1/auth/otp/verify)
      await new Promise((r) => setTimeout(r, 600));

      setAuth(
        {
          id: 'vendor-triveni-partner-001',
          role: 'vendor',
          name: 'Triveni Driver Partner',
          phone: phone || '9888888888',
        },
        'mock-vendor-jwt-token'
      );

      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err?.message || 'Invalid OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.container}>
          {/* Back button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <ArrowLeft size={18} color={Colors.navy} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>

          {/* Form Card */}
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <ShieldCheck size={28} color={Colors.navy} />
            </View>

            <Text style={styles.title}>Enter OTP Code</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit verification code to{' '}
              <Text style={styles.phoneHighlight}>+91 {phone ?? '9888888888'}</Text>
            </Text>

            {/* OTP 6-Box Inputs */}
            <View style={styles.otpRow}>
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(ref) => { inputs.current[i] = ref; }}
                  style={[
                    styles.otpBox,
                    digit ? styles.otpBoxFilled : null,
                  ]}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(val) => handleChange(val, i)}
                  onKeyPress={(e) => handleKeyPress(e, i)}
                  selectTextOnFocus
                />
              ))}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* Dev helper pill */}
            <TouchableOpacity
              style={styles.devPill}
              onPress={() => {
                setOtp(['1', '2', '3', '4', '5', '6']);
              }}
              activeOpacity={0.8}
            >
              <CheckCircle2 size={13} color={Colors.marigold} />
              <Text style={styles.devPillText}>Dev Mode: Tap to auto-fill code 123456</Text>
            </TouchableOpacity>

            {/* Verify Button */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (loading || otp.join('').length !== 6) && styles.submitBtnDisabled,
              ]}
              onPress={handleVerify}
              activeOpacity={0.88}
              disabled={loading || otp.join('').length !== 6}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.submitBtnText}>Verify & Start Duty</Text>
              )}
            </TouchableOpacity>

            {/* Resend Timer */}
            <View style={styles.resendRow}>
              {timer > 0 ? (
                <Text style={styles.resendTimer}>Resend code in {timer}s</Text>
              ) : (
                <TouchableOpacity
                  style={styles.resendBtn}
                  onPress={() => setTimer(30)}
                  activeOpacity={0.8}
                >
                  <RotateCcw size={13} color={Colors.navy} />
                  <Text style={styles.resendBtnText}>Resend Code</Text>
                </TouchableOpacity>
              )}
            </View>
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
  },
  flex: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  backBtnText: {
    color: Colors.navy,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadow.md,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.navySubtle,
    borderWidth: 1,
    borderColor: Colors.navyBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.navyDark,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: -4,
  },
  phoneHighlight: {
    color: Colors.navyDark,
    fontWeight: FontWeight.bold,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: Spacing.xs,
  },
  otpBox: {
    width: 44,
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.inputBg,
    textAlign: 'center',
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.navy,
  },
  otpBoxFilled: {
    borderColor: Colors.navy,
    backgroundColor: Colors.surfaceSubtle,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.error,
    fontWeight: FontWeight.semibold,
  },
  devPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.marigoldSubtle,
    borderWidth: 1,
    borderColor: Colors.marigoldBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  devPillText: {
    fontSize: 11,
    color: Colors.navyDark,
    fontWeight: FontWeight.bold,
  },
  submitBtn: {
    backgroundColor: Colors.navy,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md + 2,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
    ...Shadow.sm,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.3,
  },
  resendRow: {
    marginTop: Spacing.xs,
  },
  resendTimer: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  resendBtnText: {
    fontSize: FontSize.xs,
    color: Colors.navy,
    fontWeight: FontWeight.bold,
  },
});
