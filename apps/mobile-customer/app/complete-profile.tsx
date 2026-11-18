import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  User,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  LogOut,
} from 'lucide-react-native';
import type { ThemeColors } from '@/constants/theme';
import { useAppTheme, useThemedStyles } from '@/components/ThemeProvider';
import { Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { customerApi } from '@/lib/api';
import { showToast } from '@/components/ToastHost';
import { isCustomerProfileComplete, normalizeIndianPhone } from '@/lib/customerProfile';

export default function CompleteProfileScreen() {
  const { colors: Colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const syncCustomerProfile = useAuthStore((s) => s.syncCustomerProfile);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isEditMode = mode === 'edit';

  const [name, setName] = useState(
    user?.name && user.name !== 'Valued Customer' && user.name !== 'Customer' ? user.name : ''
  );
  const [phone, setPhone] = useState(
    user?.phone ? user.phone.replace(/^\+91/, '').replace(/\D/g, '') : ''
  );
  const [loading, setLoading] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    let isActive = true;

    const checkSavedProfile = async () => {
      try {
        const savedUser = await syncCustomerProfile();
        if (!isActive || !savedUser) return;

        if (isCustomerProfileComplete(savedUser) && !isEditMode) {
          router.replace('/(tabs)');
          return;
        }

        setName(savedUser.name && !['customer', 'valued customer'].includes(savedUser.name.trim().toLowerCase()) ? savedUser.name : '');
        setPhone(normalizeIndianPhone(savedUser.phone));
      } catch (error) {
        // Keep the form available during a temporary API outage. The submit
        // action will still report any save error to the customer.
        console.warn('Could not check saved customer profile:', error);
      } finally {
        if (isActive) setIsCheckingProfile(false);
      }
    };

    void checkSavedProfile();
    return () => {
      isActive = false;
    };
  }, [syncCustomerProfile, isEditMode]);

  const cleanPhone = phone.replace(/\D/g, '');
  const isNameValid = name.trim().length >= 2;
  const isPhoneValid = /^[6-9]\d{9}$/.test(cleanPhone);
  const canSubmit = (otpSent ? otp.length === 6 : isNameValid && isPhoneValid) && !loading;

  const handleSave = async () => {
    if (!isNameValid) {
      setErrorMsg('Please enter your full name (minimum 2 characters).');
      return;
    }
    if (!isPhoneValid) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      if (!otpSent && normalizeIndianPhone(user?.phone) !== cleanPhone) {
        await customerApi.requestPhoneChangeOtp(cleanPhone);
        setOtpSent(true);
        showToast({ title: 'OTP sent', message: `Enter the code sent to +91 ${cleanPhone}.`, variant: 'success' });
        return;
      }

      const verifiedPhone = otpSent ? await customerApi.verifyPhoneChangeOtp(cleanPhone, otp) : null;
      if (verifiedPhone) {
        await updateUser({ phone: verifiedPhone.phone || cleanPhone, profileCompleted: verifiedPhone.profileCompleted });
        setOtpSent(false);
      }
      const res = await customerApi.updateProfile({ name: name.trim() });

      await updateUser({
        name: res.name,
        phone: res.phone || cleanPhone,
        profileCompleted: res.profileCompleted ?? true,
      });

      showToast({ title: otpSent ? 'Mobile number verified' : (isEditMode ? 'Profile updated' : 'Profile completed'), message: otpSent ? 'Your contact number has been updated.' : 'Your details have been saved.', variant: 'success' });
      if (isEditMode) router.back();
      else router.replace('/(tabs)');
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await clearAuth();
    router.replace('/(auth)/login');
  };

  if (isCheckingProfile) {
    return (
      <View style={styles.screen}>
        <View style={styles.bgBlobNavy} />
        <View style={styles.bgBlobMarigold} />
        <View style={styles.checkingContainer}>
          <ActivityIndicator color={Colors.marigold} size="large" />
          <Text style={styles.checkingText}>Checking your saved profile…</Text>
        </View>
      </View>
    );
  }

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
          {/* Header Card */}
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <ShieldCheck size={28} color={Colors.marigold} strokeWidth={2.2} />
            </View>

            <Text style={styles.title}>{isEditMode ? 'Edit Your Profile' : 'Complete Your Profile'}</Text>
            <Text style={styles.subtitle}>
              {isEditMode ? 'Update your name or verify a new mobile number with a one-time password.' : 'To coordinate your move, pair verified drivers, and send live GPS tracking updates, we require your name and phone number.'}
            </Text>

            {!!errorMsg && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Email Verified Pill (if registered via email) */}
            {!!user?.email && (
              <View style={styles.verifiedEmailBox}>
                <View style={styles.verifiedEmailLeft}>
                  <Mail size={16} color={Colors.text} />
                  <View>
                    <Text style={styles.verifiedEmailLabel}>VERIFIED EMAIL</Text>
                    <Text style={styles.verifiedEmailText}>{user.email}</Text>
                  </View>
                </View>
                <View style={styles.verifiedPill}>
                  <CheckCircle2 size={12} color={Colors.success} />
                  <Text style={styles.verifiedPillText}>Verified</Text>
                </View>
              </View>
            )}

            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconBox}>
                  <User size={16} color={Colors.text} />
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

            {otpSent && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>6-digit verification code</Text>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  placeholder="Enter OTP"
                  placeholderTextColor={Colors.inputPlaceholder}
                  value={otp}
                  onChangeText={(value) => setOtp(value.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <Text style={styles.inputHelpText}>Sent by SMS to +91 {cleanPhone}.</Text>
              </View>
            )}

            {/* Phone Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mobile Number (for Driver & SMS Updates)</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.countryCodeBox}>
                  <Text style={styles.countryCode}>+91</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="98765 43210"
                  placeholderTextColor={Colors.inputPlaceholder}
                  value={phone}
                  onChangeText={(t) => {
                    setPhone(t.replace(/\D/g, '').slice(0, 10));
                    setOtpSent(false);
                    setOtp('');
                    setErrorMsg('');
                  }}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                {cleanPhone.length === 10 && isPhoneValid && (
                  <View style={{ paddingRight: Spacing.md }}>
                    <CheckCircle2 size={18} color={Colors.success} />
                  </View>
                )}
              </View>
              <Text style={styles.inputHelpText}>
                We will send booking confirmations & driver contact via SMS & WhatsApp.
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
              onPress={handleSave}
              disabled={!canSubmit}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color={Colors.navyDark} />
              ) : (
                <View style={styles.btnContent}>
                  <Text style={styles.submitBtnText}>{loading ? 'Please wait…' : otpSent ? 'Verify & Save' : isEditMode ? 'Save Changes' : 'Continue'}</Text>
                  <ArrowRight size={16} color={Colors.navyDark} strokeWidth={2.4} />
                </View>
              )}
            </TouchableOpacity>

            {/* Sign Out Option */}
            {!isEditMode && <TouchableOpacity
              style={styles.signOutBtn}
              onPress={handleSignOut}
              activeOpacity={0.8}
            >
              <LogOut size={14} color={Colors.textMuted} />
              <Text style={styles.signOutText}>Sign in with a different account</Text>
            </TouchableOpacity>}
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
  checkingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  checkingText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },

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
    paddingHorizontal: Spacing.md,
    paddingTop: 60,
    paddingBottom: Spacing.xxl,
    justifyContent: 'center',
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

  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.marigoldSubtle,
    borderWidth: 1,
    borderColor: Colors.marigoldBorder,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.xs,
  },

  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.navyDark,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: -4,
  },

  errorBox: {
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },

  verifiedEmailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  verifiedEmailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  verifiedEmailLabel: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  verifiedEmailText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  verifiedPillText: {
    color: Colors.success,
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
  },

  inputGroup: {
    gap: 6,
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
  inputIconBox: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surfaceSubtle,
    borderRightWidth: 1,
    borderRightColor: Colors.cardBorder,
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
  otpInput: {
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.inputBg,
    letterSpacing: 8,
    textAlign: 'center',
  },
  inputHelpText: {
    fontSize: FontSize.xxs,
    color: Colors.textMuted,
    lineHeight: 14,
  },

  submitBtn: {
    backgroundColor: Colors.marigold,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
    ...Shadow.glowSm,
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
    color: Colors.navyDark,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.3,
  },

  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.xs,
    marginTop: Spacing.xs,
  },
  signOutText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
});
