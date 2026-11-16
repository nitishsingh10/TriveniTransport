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
  User,
  UserPlus,
  LogIn,
} from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { authApi } from '@/lib/api';

type AuthMode = 'login' | 'signup';
type Method = 'phone' | 'email';

export default function LoginScreen() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [method, setMethod] = useState<Method>('phone');
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showSwitchPrompt, setShowSwitchPrompt] = useState<'to_signup' | 'to_login' | null>(null);

  const isPhoneValid = method === 'phone' && identifier.replace(/\D/g, '').length === 10;
  const isEmailValid = method === 'email' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim());
  const isIdentifierValid = method === 'phone' ? isPhoneValid : isEmailValid;
  const isNameValid = authMode === 'login' || name.trim().length >= 2;
  const canSubmit = isIdentifierValid && isNameValid;
  const resolvedIdentifier = method === 'phone' ? identifier.replace(/\D/g, '') : identifier.trim().toLowerCase();

  const switchAuthMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setErrorMsg('');
    setShowSwitchPrompt(null);
  };

  const switchMethod = (m: Method) => {
    setMethod(m);
    setIdentifier('');
    setErrorMsg('');
    setShowSwitchPrompt(null);
  };

  const handleSendOtp = async () => {
    if (!canSubmit) {
      if (authMode === 'signup' && name.trim().length < 2) {
        setErrorMsg('Please enter your full name (minimum 2 characters).');
        return;
      }
      if (!isIdentifierValid) {
        setErrorMsg(method === 'phone' ? 'Please enter a valid 10-digit mobile number.' : 'Please enter a valid email address.');
        return;
      }
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setShowSwitchPrompt(null);

    const isSignup = authMode === 'signup';

    try {
      await authApi.requestOtp(resolvedIdentifier, isSignup);
      router.push({
        pathname: '/(auth)/otp',
        params: {
          identifier: resolvedIdentifier,
          isSignup: isSignup ? 'true' : 'false',
          name: isSignup ? name.trim() : '',
        },
      });
    } catch (e: any) {
      const msg = e.message || '';
      console.log('Backend requestOtp failed:', msg);

      if (e.status === 429) {
        setErrorMsg('Too many requests. Please wait a few minutes and try again.');
        return;
      }

      if (e.code === 'USER_NOT_FOUND' || msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('sign up first')) {
        setErrorMsg(msg || 'No account found with this ' + (method === 'phone' ? 'phone number' : 'email') + '. Please sign up first.');
        setShowSwitchPrompt('to_signup');
        return;
      }

      if (e.code === 'ALREADY_EXISTS' || msg.toLowerCase().includes('already exists')) {
        setErrorMsg(msg || 'An account already exists for this ' + (method === 'phone' ? 'phone number' : 'email') + '. Please sign in.');
        setShowSwitchPrompt('to_login');
        return;
      }

      setErrorMsg(msg || 'Unable to send verification code. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
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

          {/* Form Card */}
          <View style={styles.card}>
            {/* Mode Switcher Tabs: Sign In vs Create Account */}
            <View style={styles.modeTabsRow}>
              <TouchableOpacity
                style={[styles.modeTabBtn, authMode === 'login' && styles.modeTabBtnActive]}
                onPress={() => switchAuthMode('login')}
                activeOpacity={0.8}
              >
                <LogIn size={14} color={authMode === 'login' ? Colors.navy : Colors.textMuted} />
                <Text style={[styles.modeTabBtnText, authMode === 'login' && styles.modeTabBtnTextActive]}>
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeTabBtn, authMode === 'signup' && styles.modeTabBtnActive]}
                onPress={() => switchAuthMode('signup')}
                activeOpacity={0.8}
              >
                <UserPlus size={14} color={authMode === 'signup' ? Colors.navy : Colors.textMuted} />
                <Text style={[styles.modeTabBtnText, authMode === 'signup' && styles.modeTabBtnTextActive]}>
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.cardTitle}>
              {authMode === 'login' ? 'Welcome Back' : 'Create an Account'}
            </Text>
            <Text style={styles.cardSubtitle}>
              {authMode === 'login'
                ? 'Sign in with your registered mobile number or email to manage bookings and track moves.'
                : 'Sign up with your mobile number or email to plan moves and access transparent relocation pricing.'}
            </Text>

            {/* Error Message Box */}
            {!!errorMsg && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
                {showSwitchPrompt === 'to_signup' && (
                  <TouchableOpacity
                    style={styles.switchPromptBtn}
                    onPress={() => switchAuthMode('signup')}
                    activeOpacity={0.8}
                  >
                    <UserPlus size={13} color={Colors.navy} />
                    <Text style={styles.switchPromptBtnText}>Create Account Now</Text>
                  </TouchableOpacity>
                )}
                {showSwitchPrompt === 'to_login' && (
                  <TouchableOpacity
                    style={styles.switchPromptBtn}
                    onPress={() => switchAuthMode('login')}
                    activeOpacity={0.8}
                  >
                    <LogIn size={13} color={Colors.navy} />
                    <Text style={styles.switchPromptBtnText}>Sign In to Existing Account</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* In Signup Mode: Name Input */}
            {authMode === 'signup' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.countryCodeBox}>
                    <User size={16} color={Colors.navy} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Rahul Sharma"
                    placeholderTextColor={Colors.inputPlaceholder}
                    value={name}
                    onChangeText={(t) => {
                      setName(t);
                      setErrorMsg('');
                    }}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              </View>
            )}

            {/* Method Toggle: Mobile vs Email */}
            <View style={styles.methodToggle}>
              <TouchableOpacity
                style={[styles.methodTab, method === 'phone' && styles.methodTabActive]}
                onPress={() => switchMethod('phone')}
                activeOpacity={0.8}
              >
                <Phone size={13} color={method === 'phone' ? Colors.navy : Colors.textMuted} />
                <Text style={[styles.methodTabText, method === 'phone' && styles.methodTabTextActive]}>
                  Mobile Number
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.methodTab, method === 'email' && styles.methodTabActive]}
                onPress={() => switchMethod('email')}
                activeOpacity={0.8}
              >
                <Mail size={13} color={method === 'email' ? Colors.navy : Colors.textMuted} />
                <Text style={[styles.methodTabText, method === 'email' && styles.methodTabTextActive]}>
                  Email Address
                </Text>
              </TouchableOpacity>
            </View>

            {/* Input: Phone or Email */}
            {method === 'phone' ? (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile Number</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.countryCodeBox}>
                    <Text style={styles.countryCode}>+91</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="98765 43210"
                    placeholderTextColor={Colors.inputPlaceholder}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={identifier}
                    onChangeText={(t) => {
                      setIdentifier(t.replace(/\D/g, '').slice(0, 10));
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
                    onChangeText={(t) => {
                      setIdentifier(t);
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
                  <Text style={styles.submitBtnText}>
                    {authMode === 'login' ? 'Send OTP & Sign In' : 'Send Verification OTP'}
                  </Text>
                  <ArrowRight size={16} color={Colors.white} strokeWidth={2.4} />
                </View>
              )}
            </TouchableOpacity>

            {/* Alternate Mode Link */}
            <TouchableOpacity
              style={styles.modeSwitchLink}
              onPress={() => switchAuthMode(authMode === 'login' ? 'signup' : 'login')}
              activeOpacity={0.75}
            >
              <Text style={styles.modeSwitchText}>
                {authMode === 'login' ? (
                  <>
                    New to Triveni Transports? <Text style={styles.modeSwitchHighlight}>Create an Account</Text>
                  </>
                ) : (
                  <>
                    Already have an account? <Text style={styles.modeSwitchHighlight}>Sign In</Text>
                  </>
                )}
              </Text>
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
    paddingHorizontal: Spacing.md,
    paddingTop: 54,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },

  brand: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoCard: {
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    ...Shadow.sm,
  },
  logoImage: {
    width: '100%',
    height: '100%',
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

  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadow.md,
  },

  modeTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 4,
  },
  modeTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 9,
  },
  modeTabBtnActive: {
    backgroundColor: '#FFFFFF',
    ...Shadow.sm,
  },
  modeTabBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
  },
  modeTabBtnTextActive: {
    color: Colors.navy,
    fontWeight: FontWeight.bold,
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

  methodToggle: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 3,
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
    paddingVertical: 7,
    borderRadius: 7,
  },
  methodTabActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(247, 163, 0, 0.3)',
    ...Shadow.sm,
  },
  methodTabText: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
  },
  methodTabTextActive: {
    color: Colors.navy,
    fontWeight: FontWeight.bold,
  },

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

  modeSwitchLink: {
    alignItems: 'center',
    paddingVertical: 4,
    marginTop: 2,
  },
  modeSwitchText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  modeSwitchHighlight: {
    color: Colors.navy,
    fontWeight: FontWeight.bold,
    textDecorationLine: 'underline',
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
    gap: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    lineHeight: 18,
  },
  switchPromptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.marigold,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  switchPromptBtnText: {
    color: Colors.navyDark,
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
  },
});
