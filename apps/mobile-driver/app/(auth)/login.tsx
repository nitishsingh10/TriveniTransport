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
  ArrowRight,
  Wallet,
  Clock,
  Truck,
  User,
  UserPlus,
  LogIn,
} from 'lucide-react-native';
import type { ThemeColors } from '@/constants/theme';
import { useAppTheme, useThemedStyles } from '@/components/ThemeProvider';
import { Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { driverAuthApi } from '@/lib/api';

type Method = 'phone' | 'email';
type AuthMode = 'login' | 'signup';

export default function DriverLoginScreen() {
  const { colors: Colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [method, setMethod] = useState<Method>('phone');
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isPhoneValid = method === 'phone' && /^[6-9]\d{9}$/.test(identifier.replace(/\D/g, ''));
  const isEmailValid = method === 'email' && identifier.trim().length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim());
  const canSubmit = method === 'phone' ? isPhoneValid : isEmailValid;
  const canCreateAccount = authMode === 'login' || (name.trim().length >= 2 && name.trim().length <= 150);
  const resolvedIdentifier = method === 'phone' ? identifier.replace(/\D/g, '') : identifier.trim().toLowerCase();

  const switchMethod = (m: Method) => {
    setMethod(m);
    setIdentifier('');
    setErrorMsg('');
  };

  const handleSendOtp = async () => {
    if (!canSubmit || !canCreateAccount) {
      if (authMode === 'signup' && !canCreateAccount) setErrorMsg('Enter your full name (2–150 characters).');
      else if (!canSubmit) setErrorMsg(method === 'phone' ? 'Enter a valid 10-digit Indian mobile number.' : 'Enter a valid email address.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const isSignup = authMode === 'signup';
      await driverAuthApi.requestOtp(resolvedIdentifier, isSignup);
      router.push({
        pathname: '/(auth)/otp',
        params: { identifier: resolvedIdentifier, isSignup: String(isSignup), name: isSignup ? name.trim() : '' },
      });
    } catch (e: any) {
      if (e.status === 429) {
        setErrorMsg('Too many OTP requests. Please wait a few minutes.');
      } else if (e.status === 404) {
        setErrorMsg('No partner account found. Please contact support.');
      } else if (e.status === 403) {
        setErrorMsg('Your partner account is inactive. Please contact Triveni support.');
      } else if (e.code === 'ALREADY_EXISTS') {
        setErrorMsg('A partner account already exists. Sign in with it instead.');
      } else {
        setErrorMsg(e.message || 'Unable to send a verification code. Check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Ambient background elements */}
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
              <View style={styles.partnerBadge}>
                <Text style={styles.partnerBadgeText}>DRIVER PARTNER PORTAL</Text>
              </View>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <View style={styles.authModeToggle}>
              <TouchableOpacity
                style={[styles.authModeTab, authMode === 'login' && styles.authModeTabActive]}
                onPress={() => { setAuthMode('login'); setErrorMsg(''); }}
                activeOpacity={0.8}
              >
                <LogIn size={14} color={authMode === 'login' ? Colors.text : Colors.textMuted} />
                <Text style={[styles.authModeText, authMode === 'login' && styles.authModeTextActive]}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.authModeTab, authMode === 'signup' && styles.authModeTabActive]}
                onPress={() => { setAuthMode('signup'); setMethod('phone'); setIdentifier(''); setErrorMsg(''); }}
                activeOpacity={0.8}
              >
                <UserPlus size={14} color={authMode === 'signup' ? Colors.text : Colors.textMuted} />
                <Text style={[styles.authModeText, authMode === 'signup' && styles.authModeTextActive]}>New Partner</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.cardTitle}>{authMode === 'login' ? 'Driver Sign In' : 'Create Partner Account'}</Text>
            <Text style={styles.cardSubtitle}>
              {authMode === 'login'
                ? 'Enter your registered mobile number or email to access pickup and truck assignments.'
                : 'Verify your mobile number by OTP, then submit your driver, vehicle, and compliance documents for review.'}
            </Text>

            {!!errorMsg && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {authMode === 'signup' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.countryCodeBox}><User size={16} color={Colors.text} /></View>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Rahul Sharma"
                    placeholderTextColor={Colors.inputPlaceholder}
                    value={name}
                    maxLength={150}
                    onChangeText={(value) => { setName(value); setErrorMsg(''); }}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              </View>
            )}

            {/* Method Toggle */}
            <View style={styles.methodToggle}>
              <TouchableOpacity
                style={[styles.methodTab, method === 'phone' && styles.methodTabActive]}
                onPress={() => switchMethod('phone')}
                activeOpacity={0.8}
              >
                <Phone size={13} color={method === 'phone' ? Colors.text : Colors.textMuted} />
                <Text style={[styles.methodTabText, method === 'phone' && styles.methodTabTextActive]}>
                  Mobile
                </Text>
              </TouchableOpacity>
              {authMode === 'login' && (
                <TouchableOpacity
                  style={[styles.methodTab, method === 'email' && styles.methodTabActive]}
                  onPress={() => switchMethod('email')}
                  activeOpacity={0.8}
                >
                  <Mail size={13} color={method === 'email' ? Colors.text : Colors.textMuted} />
                  <Text style={[styles.methodTabText, method === 'email' && styles.methodTabTextActive]}>
                    Email
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Input */}
            {method === 'phone' ? (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Registered Partner Phone</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.countryCodeBox}>
                    <Text style={styles.countryCode}>+91</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="98888 88888"
                    placeholderTextColor={Colors.inputPlaceholder}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={identifier}
                    onChangeText={(value) => {
                      setIdentifier(value.replace(/\D/g, '').slice(0, 10));
                      setErrorMsg('');
                    }}
                    returnKeyType="done"
                    onSubmitEditing={handleSendOtp}
                  />
                  <Phone size={18} color={Colors.textMuted} style={styles.inputIcon} />
                </View>
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Registered Partner Email</Text>
                <View style={styles.inputWrapperEmail}>
                  <TextInput
                    style={[styles.input, styles.inputEmail]}
                    placeholder="partner@example.com"
                    placeholderTextColor={Colors.inputPlaceholder}
                    keyboardType="email-address"
                    maxLength={254}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={identifier}
                    onChangeText={(value) => {
                      setIdentifier(value);
                      setErrorMsg('');
                    }}
                    returnKeyType="done"
                    onSubmitEditing={handleSendOtp}
                  />
                  <Mail size={18} color={Colors.textMuted} style={styles.inputIcon} />
                </View>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!canSubmit || !canCreateAccount || loading) && styles.submitBtnDisabled,
              ]}
              onPress={handleSendOtp}
              activeOpacity={0.88}
              disabled={!canSubmit || !canCreateAccount || loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <View style={styles.btnContent}>
                  <Text style={styles.submitBtnText}>{authMode === 'login' ? 'Get OTP Code' : 'Create Account with OTP'}</Text>
                  <ArrowRight size={16} color={Colors.white} strokeWidth={2.4} />
                </View>
              )}
            </TouchableOpacity>

            {/* Onboard New Vehicle / Register CTA */}
            <View style={styles.onboardDividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{authMode === 'login' ? 'NEW DRIVER PARTNER?' : 'NEXT STEP'}</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.onboardBtn}
              onPress={() => { setAuthMode('signup'); setErrorMsg(''); }}
              activeOpacity={0.88}
            >
              <View style={styles.onboardBtnContent}>
                <View style={styles.onboardIconCircle}>
                  <Truck size={18} color={Colors.text} strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.onboardBtnTitle}>
                    {authMode === 'login' ? 'Create a partner account' : 'Add your vehicle details next'}
                  </Text>
                  <Text style={styles.onboardBtnSubtitle}>
                    {authMode === 'login' ? 'Verify your number, then continue onboarding' : 'Continue after OTP verification'}
                  </Text>
                </View>
                <ArrowRight size={16} color={Colors.text} />
              </View>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              Pickup and truck partners must complete document review and receive approval before assignments are available.
            </Text>
          </View>

          {/* Trust Badges */}
          <View style={styles.trustRow}>
            <View style={styles.trustBadge}>
              <ShieldCheck size={14} color={Colors.text} />
              <Text style={styles.trustBadgeText}>OTP protected</Text>
            </View>
            <View style={styles.trustBadge}>
              <Wallet size={14} color={Colors.marigold} />
              <Text style={styles.trustBadgeText}>Pickup &amp; truck</Text>
            </View>
            <View style={styles.trustBadge}>
              <Clock size={14} color={Colors.success} />
              <Text style={styles.trustBadgeText}>Approval before dispatch</Text>
            </View>
          </View>
        </ScrollView>
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
    color: Colors.text,
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
    color: Colors.text,
    letterSpacing: 2,
  },
  logoTagline: {
    fontSize: 9,
    color: Colors.marigold,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.8,
    marginTop: 4,
  },
  partnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.marigoldSubtle,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.marigoldBorder,
    marginTop: 8,
  },
  partnerBadgeText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
    letterSpacing: 0.5,
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
  authModeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: 12,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  authModeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 8,
  },
  authModeTabActive: { backgroundColor: Colors.surface, ...Shadow.sm },
  authModeText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.semibold },
  authModeTextActive: { color: Colors.text },

  methodToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: 12,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
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
    backgroundColor: Colors.surface,
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
    color: Colors.text,
  },

  // Input
  inputGroup: {
    gap: 6,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
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
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    color: Colors.text,
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
    backgroundColor: Colors.brandSurface,
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

  // Onboard CTA
  onboardDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.cardBorder,
  },
  dividerText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  onboardBtn: {
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: Colors.navyBorder,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm + 2,
    ...Shadow.sm,
  },
  onboardBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  onboardIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.navySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onboardBtnTitle: {
    fontSize: FontSize.xs + 1,
    fontWeight: FontWeight.extrabold,
    color: Colors.navyDark,
  },
  onboardBtnSubtitle: {
    fontSize: 10,
    color: Colors.textSecondary,
  },

  disclaimer: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
  },
  link: {
    color: Colors.text,
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
    color: Colors.text,
    fontSize: 11,
    fontWeight: FontWeight.semibold,
  },
  errorBox: {
    backgroundColor: Colors.errorLight,
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
