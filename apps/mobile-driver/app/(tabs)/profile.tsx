import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  Image,
  Modal,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import {
  User,
  Truck,
  ShieldCheck,
  Award,
  FileText,
  PhoneCall,
  LogOut,
  ChevronRight,
  CheckCircle2,
  Camera,
  Edit3,
  CreditCard,
  Eye,
  Sparkles,
} from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';

export default function DriverProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const driverKyc = useOnboardingStore((s) => s.driverKyc);
  const vehicle = useOnboardingStore((s) => s.vehicle);
  const bank = useOnboardingStore((s) => s.bank);
  const loadSavedOnboarding = useOnboardingStore((s) => s.loadSavedOnboarding);

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    loadSavedOnboarding();
  }, []);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out from the Driver Partner Portal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          clearAuth();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const displayName = driverKyc.fullName || user?.name || 'Rajesh Kumar';
  const displayPhone = driverKyc.phone || user?.phone || '98888 88888';
  const displayPlate = vehicle.registrationNumber || 'MH 12 CD 5678';
  const displayModel = vehicle.type || 'Tata 407';
  const displayCapacity = vehicle.capacityCft || 600;

  // Collect existing vehicle inspection photos
  const vehiclePhotos = [
    { label: 'Front (Plate)', uri: vehicle.frontImageUri },
    { label: 'Side Profile', uri: vehicle.sideImageUri },
    { label: 'Rear View', uri: vehicle.rearImageUri },
    { label: 'Cargo Area', uri: vehicle.cargoImageUri },
  ].filter((p) => !!p.uri);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Driver Identity Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            {driverKyc.profilePhotoUri ? (
              <Image source={{ uri: driverKyc.profilePhotoUri }} style={styles.avatarImage} />
            ) : (
              <User size={28} color={Colors.navy} strokeWidth={2.4} />
            )}
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.driverName}>{displayName}</Text>
              <View style={styles.verifiedBadge}>
                <ShieldCheck size={11} color={Colors.success} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
            <Text style={styles.driverPhone}>+91 {displayPhone}</Text>
            <Text style={styles.partnerId}>Captain ID: TRV-DRV-1049 · {driverKyc.city || 'Pune & PCMC'}</Text>
          </View>
        </View>

        {/* Badges / Metrics Row */}
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <View style={styles.metricValueRow}>
              <Award size={13} color={Colors.marigold} />
              <Text style={styles.metricValue}>4.9/5</Text>
            </View>
            <Text style={styles.metricLabel}>Rating</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>340+</Text>
            <Text style={styles.metricLabel}>Completed Moves</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>99.4%</Text>
            <Text style={styles.metricLabel}>On-Time Arrival</Text>
          </View>
        </View>
      </View>

      {/* Assigned Commercial Vehicle Card */}
      <View style={styles.vehicleCard}>
        <View style={styles.cardHeaderWithAction}>
          <View style={styles.cardTitleRow}>
            <Truck size={17} color={Colors.navy} />
            <Text style={styles.cardTitle}>Registered Vehicle</Text>
          </View>
          <TouchableOpacity
            style={styles.editActionBtn}
            onPress={() => router.push('/(auth)/onboarding' as any)}
            activeOpacity={0.8}
          >
            <Edit3 size={13} color={Colors.navy} />
            <Text style={styles.editActionText}>Update Vehicle</Text>
          </TouchableOpacity>
        </View>

        {/* Commercial Number Plate Badge */}
        <View style={styles.plateRow}>
          <View style={styles.indianPlate}>
            <View style={styles.plateIndBadge}>
              <Text style={styles.plateIndFlag}>🇮🇳</Text>
              <Text style={styles.plateIndText}>IND</Text>
            </View>
            <Text style={styles.plateNumberText}>{displayPlate}</Text>
          </View>
          <View style={styles.plateVerifiedPill}>
            <CheckCircle2 size={12} color={Colors.success} />
            <Text style={styles.plateVerifiedText}>RTO Verified</Text>
          </View>
        </View>

        <View style={styles.vehicleDetailsRow}>
          <View style={styles.vehicleSpecBox}>
            <Text style={styles.specLabel}>Vehicle Model</Text>
            <Text style={styles.specValue}>{displayModel}</Text>
          </View>
          <View style={styles.vehicleSpecBox}>
            <Text style={styles.specLabel}>Capacity</Text>
            <Text style={styles.specValue}>{displayCapacity} CFT</Text>
          </View>
          <View style={styles.vehicleSpecBox}>
            <Text style={styles.specLabel}>Payload Class</Text>
            <Text style={styles.specValue}>{vehicle.payloadTons || '2.5 Tons'}</Text>
          </View>
          <View style={styles.vehicleSpecBox}>
            <Text style={styles.specLabel}>Commercial Permit</Text>
            <Text style={[styles.specValue, { color: Colors.success }]}>
              {vehicle.permitExpiry ? `Valid: ${vehicle.permitExpiry}` : 'Active till 2028'}
            </Text>
          </View>
        </View>

        <View style={styles.complianceRow}>
          <View style={styles.complianceItem}>
            <CheckCircle2 size={13} color={Colors.success} />
            <Text style={styles.complianceText}>Fitness Certificate</Text>
          </View>
          <View style={styles.complianceItem}>
            <CheckCircle2 size={13} color={Colors.success} />
            <Text style={styles.complianceText}>Commercial Insurance</Text>
          </View>
          <View style={styles.complianceItem}>
            <CheckCircle2 size={13} color={Colors.success} />
            <Text style={styles.complianceText}>Goods Permit</Text>
          </View>
        </View>

        {/* Vehicle Inspection Images Section */}
        <View style={styles.photoSection}>
          <View style={styles.photoSectionHeader}>
            <Camera size={14} color={Colors.navy} />
            <Text style={styles.photoSectionTitle}>Vehicle Inspection Photos</Text>
          </View>

          {vehiclePhotos.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
              {vehiclePhotos.map((p, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.photoCard}
                  onPress={() => setPreviewImage(p.uri || null)}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: p.uri }} style={styles.photoImage} />
                  <View style={styles.photoLabelWrap}>
                    <Text style={styles.photoLabelText}>{p.label}</Text>
                    <Eye size={10} color={Colors.white} />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <TouchableOpacity
              style={styles.noPhotosPlaceholder}
              onPress={() => router.push('/(auth)/onboarding' as any)}
              activeOpacity={0.8}
            >
              <Camera size={20} color={Colors.navy} />
              <Text style={styles.noPhotosText}>No vehicle photos uploaded yet</Text>
              <Text style={styles.noPhotosSubtext}>Tap to upload front, side, cargo & RC photos</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Driver KYC & Government Documentation Card */}
      <View style={styles.menuCard}>
        <View style={styles.cardHeaderWithAction}>
          <View style={styles.cardTitleRow}>
            <FileText size={17} color={Colors.navy} />
            <Text style={styles.cardTitle}>KYC & Legal Documentation</Text>
          </View>
          <TouchableOpacity
            style={styles.editActionBtn}
            onPress={() => router.push('/(auth)/onboarding' as any)}
            activeOpacity={0.8}
          >
            <Edit3 size={13} color={Colors.navy} />
            <Text style={styles.editActionText}>Manage Docs</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.docRow}>
          <View style={styles.docInfo}>
            <Text style={styles.docTitle}>Driving Licence (Commercial)</Text>
            <Text style={styles.docCode}>{driverKyc.dlNumber || 'MH-12-2018-0045892'}</Text>
            <Text style={styles.docMeta}>
              Category: {driverKyc.dlCategory || 'Commercial Transport'} · Expiry: {driverKyc.dlExpiry || '2030'}
            </Text>
          </View>
          <View style={styles.docStatusBadge}>
            <ShieldCheck size={12} color={Colors.success} />
            <Text style={styles.docStatusText}>Verified</Text>
          </View>
        </View>

        <View style={styles.menuDivider} />

        <View style={styles.docRow}>
          <View style={styles.docInfo}>
            <Text style={styles.docTitle}>Aadhaar Card / Government ID</Text>
            <Text style={styles.docCode}>{driverKyc.aadhaarNumber || '7845 9012 3456'}</Text>
            <Text style={styles.docMeta}>Identity & Address Authenticated</Text>
          </View>
          <View style={styles.docStatusBadge}>
            <ShieldCheck size={12} color={Colors.success} />
            <Text style={styles.docStatusText}>Verified</Text>
          </View>
        </View>

        <View style={styles.menuDivider} />

        <View style={styles.docRow}>
          <View style={styles.docInfo}>
            <Text style={styles.docTitle}>Vehicle RC Certificate Book</Text>
            <Text style={styles.docCode}>{vehicle.rcNumber || 'MH12-RC-2021-9988'}</Text>
            <Text style={styles.docMeta}>RTO Registered to {displayName}</Text>
          </View>
          <View style={styles.docStatusBadge}>
            <ShieldCheck size={12} color={Colors.success} />
            <Text style={styles.docStatusText}>Verified</Text>
          </View>
        </View>
      </View>

      {/* Driver Payout Settlement Account Card */}
      <View style={styles.menuCard}>
        <View style={styles.cardTitleRow}>
          <CreditCard size={17} color={Colors.navy} />
          <Text style={styles.cardTitle}>Earnings Settlement Bank</Text>
        </View>

        <View style={styles.bankDetailsBox}>
          <View style={styles.bankDetailRow}>
            <Text style={styles.bankLabel}>Bank Name:</Text>
            <Text style={styles.bankVal}>{bank.bankName || 'HDFC Bank'}</Text>
          </View>
          <View style={styles.bankDetailRow}>
            <Text style={styles.bankLabel}>Account Number:</Text>
            <Text style={[styles.bankVal, styles.codeFont]}>
              {bank.accountNumber ? `•••• •••• ${bank.accountNumber.slice(-4)}` : '•••• •••• 4788'}
            </Text>
          </View>
          <View style={styles.bankDetailRow}>
            <Text style={styles.bankLabel}>IFSC Code:</Text>
            <Text style={[styles.bankVal, styles.codeFont]}>{bank.ifscCode || 'HDFC0001234'}</Text>
          </View>
          {bank.upiId && (
            <View style={styles.bankDetailRow}>
              <Text style={styles.bankLabel}>Instant UPI:</Text>
              <Text style={styles.bankVal}>{bank.upiId}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Onboarding Wizard Action Banner */}
      <TouchableOpacity
        style={styles.onboardBanner}
        onPress={() => router.push('/(auth)/onboarding' as any)}
        activeOpacity={0.88}
      >
        <View style={styles.onboardBannerIcon}>
          <Sparkles size={20} color={Colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.onboardBannerTitle}>Full Onboarding & Vehicle Inspection</Text>
          <Text style={styles.onboardBannerSub}>
            Update commercial vehicle plate, capture high-res images & compliance renewal
          </Text>
        </View>
        <ChevronRight size={18} color={Colors.white} />
      </TouchableOpacity>

      {/* Operations Desk Help */}
      <View style={styles.menuCard}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => Linking.openURL('tel:8828647785')}
          activeOpacity={0.7}
        >
          <View style={styles.menuIconCircle}>
            <PhoneCall size={16} color={Colors.navy} />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>24/7 Operations Desk Helpline</Text>
            <Text style={styles.menuSubtitle}>8828647785 · Direct Dispatcher Link</Text>
          </View>
          <ChevronRight size={16} color={Colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => Alert.alert('Safety Standards', 'Opening Material Handling & Safety Guide.')}
          activeOpacity={0.7}
        >
          <View style={styles.menuIconCircle}>
            <FileText size={16} color={Colors.navy} />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Safety & Packaging Standards</Text>
            <Text style={styles.menuSubtitle}>Handling protocols & strapping guide</Text>
          </View>
          <ChevronRight size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity
        style={styles.signOutBtn}
        onPress={handleSignOut}
        activeOpacity={0.85}
      >
        <LogOut size={16} color={Colors.error} />
        <Text style={styles.signOutText}>Sign Out from Portal</Text>
      </TouchableOpacity>

      <Text style={styles.appVersionText}>Triveni Driver App v1.2.0 · Verified Commercial Carrier</Text>

      {/* Fullscreen Photo Modal */}
      <Modal visible={!!previewImage} transparent animationType="fade">
        <View style={styles.modalBg}>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setPreviewImage(null)}>
            <Text style={styles.modalCloseText}>✕ Close Preview</Text>
          </TouchableOpacity>
          {previewImage && (
            <Image source={{ uri: previewImage }} style={styles.modalImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  container: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl * 2,
  },

  // Profile Card
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md + 2,
    gap: Spacing.md,
    ...Shadow.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.navySubtle,
    borderWidth: 1.5,
    borderColor: Colors.navyBorder,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  driverName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.extrabold,
    color: Colors.navyDark,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.success,
  },
  driverPhone: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  partnerId: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Metrics
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  metricItem: {
    alignItems: 'center',
    gap: 2,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.extrabold,
    color: Colors.navyDark,
  },
  metricLabel: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.cardBorder,
  },

  // Vehicle Card
  vehicleCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    gap: Spacing.sm + 2,
    ...Shadow.sm,
  },
  cardHeaderWithAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.extrabold,
    color: Colors.navyDark,
  },
  editActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  editActionText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.navy,
  },

  // Commercial Number Plate
  plateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  indianPlate: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7D000',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#000000',
    overflow: 'hidden',
    ...Shadow.sm,
  },
  plateIndBadge: {
    backgroundColor: '#003399',
    paddingHorizontal: 6,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plateIndFlag: { fontSize: 8 },
  plateIndText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  plateNumberText: {
    fontSize: FontSize.sm + 1,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 2,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  plateVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  plateVerifiedText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.success,
  },

  vehicleDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm + 2,
  },
  vehicleSpecBox: {
    width: '47%',
    gap: 2,
  },
  specLabel: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  specValue: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },

  complianceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  complianceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  complianceText: {
    fontSize: 10,
    color: Colors.navyDark,
    fontWeight: FontWeight.semibold,
  },

  // Photos Section
  photoSection: {
    marginTop: 4,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    paddingTop: Spacing.sm,
  },
  photoSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  photoSectionTitle: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Colors.navy,
  },
  photoScroll: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  photoCard: {
    width: 90,
    height: 70,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginRight: 8,
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  photoImage: { width: '100%', height: '100%' },
  photoLabelWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  photoLabelText: {
    color: Colors.white,
    fontSize: 8,
    fontWeight: FontWeight.bold,
  },
  noPhotosPlaceholder: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.inputBorder,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    backgroundColor: Colors.surfaceSubtle,
  },
  noPhotosText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Colors.navy,
  },
  noPhotosSubtext: {
    fontSize: 9,
    color: Colors.textMuted,
  },

  // KYC Menu Card
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  docInfo: { flex: 1, gap: 2 },
  docTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  docCode: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.navy,
  },
  codeFont: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 0.5,
  },
  docMeta: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  docStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  docStatusText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.success,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginVertical: 2,
  },

  // Bank Card
  bankDetailsBox: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm + 2,
    gap: 6,
  },
  bankDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  bankVal: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },

  // Onboard Banner
  onboardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 2,
    backgroundColor: Colors.navy,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  onboardBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onboardBannerTitle: {
    fontSize: FontSize.xs + 1,
    fontWeight: FontWeight.extrabold,
    color: Colors.white,
  },
  onboardBannerSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },

  // Menu Options
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  menuIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.navySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: { flex: 1, gap: 1 },
  menuTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  menuSubtitle: {
    fontSize: 10,
    color: Colors.textSecondary,
  },

  // Sign out
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  signOutText: {
    color: Colors.error,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },

  appVersionText: {
    textAlign: 'center',
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
  },

  // Modal
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    zIndex: 10,
  },
  modalCloseText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.navy,
  },
  modalImage: { width: '100%', height: '75%' },
});
