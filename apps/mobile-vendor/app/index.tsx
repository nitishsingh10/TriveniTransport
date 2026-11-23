import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { hasSession, pnmApi, saveSession } from '@/lib/api';

const NAVY = '#0D1F37';
const GOLD = '#F7A300';

export default function PartnerAccess() {
  const [signup, setSignup] = useState(true);
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { void hasSession().then((authenticated) => { if (authenticated) router.replace('/application'); }); }, []);

  const sendCode = async () => {
    if (!identifier.trim() || (signup && name.trim().length < 2)) { setError('Enter your name and a valid phone number or email.'); return; }
    setBusy(true); setError('');
    try { await pnmApi.requestOtp(identifier.trim(), signup, name.trim()); setOtpSent(true); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not send a verification code.'); }
    finally { setBusy(false); }
  };

  const verify = async () => {
    if (!/^\d{6}$/.test(otp)) { setError('Enter the six-digit verification code.'); return; }
    setBusy(true); setError('');
    try {
      const session = await pnmApi.verifyOtp(identifier.trim(), otp, signup, name.trim());
      await saveSession(session.accessToken, session.refreshToken);
      router.replace('/application');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Verification failed.'); }
    finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}><View style={styles.mark}><Text style={styles.markText}>T</Text></View><Text style={styles.brandText}>TRIVENI<Text style={styles.brandSub}>P&amp;M VENDOR</Text></Text></View>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>PACKERS &amp; MOVERS PARTNER</Text>
          <Text style={styles.title}>{signup ? 'Grow with Triveni' : 'Welcome back'}</Text>
          <Text style={styles.copy}>Apply as a moving business, verify your documents and sign the partner agreement in the app.</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.toggle}><Pressable onPress={() => { setSignup(true); setOtpSent(false); setError(''); }} style={[styles.toggleItem, signup && styles.toggleActive]}><Text style={[styles.toggleText, signup && styles.toggleTextActive]}>Create account</Text></Pressable><Pressable onPress={() => { setSignup(false); setOtpSent(false); setError(''); }} style={[styles.toggleItem, !signup && styles.toggleActive]}><Text style={[styles.toggleText, !signup && styles.toggleTextActive]}>Sign in</Text></Pressable></View>
          {signup && <Field label="Your full name" value={name} onChangeText={setName} placeholder="Owner or representative" autoComplete="name" />}
          <Field label="Mobile number or email" value={identifier} onChangeText={setIdentifier} placeholder="+91 98765 43210" autoCapitalize="none" keyboardType="email-address" />
          {otpSent && <Field label="Six-digit verification code" value={otp} onChangeText={(value: string) => setOtp(value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" keyboardType="number-pad" maxLength={6} />}
          {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
          <Pressable disabled={busy} onPress={() => void (otpSent ? verify() : sendCode())} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, busy && styles.buttonBusy]}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{otpSent ? 'Verify and continue' : signup ? 'Send verification code' : 'Send sign-in code'}</Text>}
          </Pressable>
          <Text style={styles.small}>This app is only for Packers &amp; Movers businesses. Pickup and truck partners use the separate Driver Partner app.</Text>
        </View>
        <Text style={styles.footer}>A partner account is reviewed before any orders are enabled.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field(props: any) {
  return <View style={styles.field}><Text style={styles.label}>{props.label}</Text><TextInput {...props} style={styles.input} placeholderTextColor="#829AB1" /></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' }, scroll: { flexGrow: 1, padding: 22, paddingTop: 38, paddingBottom: 36, maxWidth: 580, width: '100%', alignSelf: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 11 }, mark: { width: 42, height: 42, borderRadius: 13, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' }, markText: { color: GOLD, fontSize: 24, fontWeight: '900' }, brandText: { color: NAVY, fontSize: 16, fontWeight: '900', letterSpacing: 2 }, brandSub: { color: '#A66B00', fontSize: 9, letterSpacing: 1.6, marginLeft: 7 },
  hero: { marginTop: 42, marginBottom: 23 }, eyebrow: { color: '#A66B00', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 }, title: { color: NAVY, fontSize: 34, fontWeight: '900', letterSpacing: -1.4, marginTop: 8 }, copy: { color: '#62748A', fontSize: 15, lineHeight: 22, marginTop: 10 },
  card: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', padding: 20, shadowColor: NAVY, shadowOpacity: 0.06, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 2 }, toggle: { flexDirection: 'row', padding: 4, backgroundColor: '#F1F5F9', borderRadius: 12, marginBottom: 20 }, toggleItem: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' }, toggleActive: { backgroundColor: NAVY }, toggleText: { fontSize: 12, fontWeight: '800', color: '#64748B' }, toggleTextActive: { color: '#fff' },
  field: { marginBottom: 15 }, label: { color: '#33445A', fontWeight: '800', fontSize: 12, marginBottom: 7 }, input: { borderWidth: 1, borderColor: '#D9E2EC', borderRadius: 11, paddingVertical: 13, paddingHorizontal: 13, color: NAVY, backgroundColor: '#FBFCFE', fontSize: 15 }, error: { color: '#B42335', backgroundColor: '#FFF1F2', padding: 11, borderRadius: 10, fontSize: 13, marginBottom: 13 }, button: { minHeight: 50, borderRadius: 12, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center', marginTop: 3 }, buttonPressed: { backgroundColor: '#1C385B' }, buttonBusy: { opacity: 0.7 }, buttonText: { color: '#fff', fontSize: 14, fontWeight: '900' }, small: { color: '#748397', fontSize: 12, lineHeight: 18, marginTop: 17 }, footer: { color: '#8291A3', textAlign: 'center', fontSize: 12, lineHeight: 18, marginTop: 22 },
});
