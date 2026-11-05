import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import {
  Phone,
  Mail,
  ShieldCheck,
  Package,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { authApi } from '@/lib/api';

type Method = 'phone' | 'email';

export default function LoginScreen() {
  const [method, setMethod] = useState<Method>('phone');
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isPhoneValid = method === 'phone' && identifier.replace(/\D/g, '').length === 10;
  const isEmailValid = method === 'email' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim());
  const canSubmit = method === 'phone' ? isPhoneValid : isEmailValid;
  const resolvedIdentifier = method === 'phone' ? identifier.replace(/\D/g, '') : identifier.trim().toLowerCase();

  const switchMethod = (m: Method) => {
    setMethod(m);
    setIdentifier('');
    setErrorMsg('');
  };

  const handleSendOtp = async () => {
    if (!canSubmit) return;

    setLoading(true);
    setErrorMsg('');
    try {
      await authApi.requestOtp(resolvedIdentifier);
      router.push({ pathname: '/(auth)/otp', params: { identifier: resolvedIdentifier } });
    } catch (e: any) {
      console.log('Backend requestOtp failed or fallback:', e.message);
      if (e.status === 429) {
        setErrorMsg('Too many OTP requests. Please wait a few minutes.');
        return;
      }
      // Allow moving to OTP screen in dev mode so dev code 123456 can be used
      router.push({ pathname: '/(auth)/otp', params: { identifier: resolvedIdentifier } });
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={styles.screen}>
      {/* Decorative ambient background elements matching website .bgMesh */}
      <View style={styles.bgBlobNavy} />
      <View style={styles.bgBlobMarigold} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Header */}
          <View style={styles.brand}>
            <View style={styles.logoCard}>
              <Image
                source={require('@/assets/logo-cropped.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.brandTitleBlock}>
              <Text style={styles.brandName}>TRIVENI</Text>
              <View style={styles.brandSubtitleRow}>
                <View style={styles.subDash} />
                <Text style={styles.brandSubtitle}>TRANSPORTS</Text>
                <View style={styles.subDash} />
              </View>
              <Text style={styles.logoTagline}>SAFE HANDS FOR YOUR SHIFTING PLANS</Text>
            </View>
          </View>

          {/* Form Card (Matching website .glassCard) */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSubtitle}>
              Sign in with your mobile number or email to track moves and manage bookings.
            </Text>

            {!!errorMsg && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Method Toggle */}
            <View style={styles.methodToggle}>
              <TouchableOpacity
                style={[styles.methodTab, method === 'phone' && styles.methodTabActive]}
                onPress={() => switchMethod('phone')}
                activeOpacity={0.8}
              >
                <Phone size={13} color={method === 'phone' ? Colors.navy : Colors.textMuted} />
                <Text style={[styles.methodTabText, method === 'phone' && styles.methodTabTextActive]}>
                  Mobile
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.methodTab, method === 'email' && styles.methodTabActive]}
                onPress={() => switchMethod('email')}
                activeOpacity={0.8}
              >
                <Mail size={13} color={method === 'email' ? Colors.navy : Colors.textMuted} />
                <Text style={[styles.methodTabText, method === 'email' && styles.methodTabTextActive]}>
                  Email
                </Text>
              </TouchableOpacity>
            </View>

            {/* Input */}
            {method === 'phone' ? (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.countryCodeBox}>
                    <Text style={styles.countryCode}>+91</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="99999 99999"
                    placeholderTextColor={Colors.inputPlaceholder}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={identifier}
                    onChangeText={setIdentifier}
                    returnKeyType="done"
                    onSubmitEditing={handleSendOtp}
                  />
                  <Phone size={18} color={Colors.textMuted} style={styles.inputIcon} />
                </View>
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputWrapperEmail}>
                  <TextInput
                    style={[styles.input, styles.inputEmail]}
                    placeholder="you@example.com"
                    placeholderTextColor={Colors.inputPlaceholder}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={identifier}
                    onChangeText={setIdentifier}
                    returnKeyType="done"
                    onSubmitEditing={handleSendOtp}
                  />
                  <Mail size={18} color={Colors.textMuted} style={styles.inputIcon} />
                </View>
              </View>
            )}

            {/* Submit Button (Matching website .submitBtn: Deep Navy with white text) */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!canSubmit || loading) && styles.submitBtnDisabled,
              ]}
              onPress={handleSendOtp}
              activeOpacity={0.88}
              disabled={!canSubmit || loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <View style={styles.btnContent}>
                  <Text style={styles.submitBtnText}>Send OTP</Text>
                  <ArrowRight size={16} color={Colors.white} strokeWidth={2.4} />
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              By proceeding, you agree to our{' '}
              <Text style={styles.link}>Terms of Service</Text> and{' '}
              <Text style={styles.link}>Privacy Policy</Text>
            </Text>
          </View>

          {/* Trust Badges Bar */}
          <View style={styles.trustRow}>
            <View style={styles.trustBadge}>
              <ShieldCheck size={14} color={Colors.marigold} />
              <Text style={styles.trustBadgeText}>256-Bit Encrypted</Text>
            </View>
            <View style={styles.trustBadge}>
              <Package size={14} color={Colors.marigold} />
              <Text style={styles.trustBadgeText}>50,000+ Moves</Text>
            </View>
            <View style={styles.trustBadge}>
              <CheckCircle2 size={14} color={Colors.marigold} />
              <Text style={styles.trustBadgeText}>4.9/5 Rating</Text>
            </View>
          </View>
        </ScrollView>
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

  // Background Ambient Blobs
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
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xl,
    gap: Spacing.lg,
  },

  // Brand
  brand: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  logoCard: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xs,
    ...Shadow.sm,
  },
  logoImage: {
    width: 54,
    height: 54,
  },
  brandTitleBlock: {
    alignItems: 'center',
    marginTop: 2,
  },
  brandName: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.navy,
    letterSpacing: 2.5,
    lineHeight: 26,
  },
  brandSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  subDash: {
    width: 14,
    height: 2,
    backgroundColor: Colors.marigold,
    borderRadius: 1,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.navy,
    letterSpacing: 2,
  },
  logoTagline: {
    fontSize: 9,
    color: Colors.marigold,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.8,
    marginTop: 4,
  },

  // Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadow.md,
  },
  cardTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.navyDark,
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: -4,
  },

  // Method Toggle
  methodToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 8,
  },
  methodTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  methodTabText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
  },
  methodTabTextActive: {
    color: Colors.navy,
  },

  // Input
  inputGroup: {
    gap: 6,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.navy,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.inputBg,
    overflow: 'hidden',
  },
  inputWrapperEmail: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.inputBg,
    overflow: 'hidden',
  },
  countryCodeBox: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surfaceSubtle,
    borderRightWidth: 1,
    borderRightColor: Colors.cardBorder,
  },
  countryCode: {
    color: Colors.navy,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    color: Colors.navy,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  inputEmail: {
    paddingLeft: Spacing.md,
  },
  inputIcon: {
    marginRight: Spacing.md,
  },

  // Submit Button
  submitBtn: {
    backgroundColor: Colors.navy,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
    ...Shadow.sm,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.3,
  },

  disclaimer: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
  },
  link: {
    color: Colors.navy,
    fontWeight: FontWeight.semibold,
  },

  // Trust Badges
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadow.sm,
  },
  trustBadgeText: {
    color: Colors.navy,
    fontSize: 11,
    fontWeight: FontWeight.semibold,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  errorText: {
    color: '#DC2626',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
});
