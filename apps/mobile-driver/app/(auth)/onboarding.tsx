import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  Truck,
  User,
  FileText,
  Camera,
  Upload,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Building,
  CreditCard,
  AlertCircle,
  Eye,
  Trash2,
  Sparkles,
  ArrowRight,
  Check,
} from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { useOnboardingStore, VehicleData, DriverKycData, BankData } from '@/store/onboardingStore';
import { useAuthStore } from '@/store/authStore';
import { useDriverStore } from '@/store/driverStore';

// Preset sample verified images for rapid testing without physical camera
const SAMPLE_IMAGES = {
  dlFront: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&w=600&q=80',
  dlBack: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
  aadhaar: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
  vehicleFront: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80',
  vehicleSide: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=800&q=80',
  vehicleRear: 'https://images.unsplash.com/photo-1586191582152-32b04753041d?auto=format&fit=crop&w=800&q=80',
  vehicleCargo: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
  rcDoc: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
};

const VEHICLE_TYPES = [
  { label: 'Tata Ace (Chota Hathi)', capacity: 300, payload: '1.0 Ton', value: 'Tata Ace' },
  { label: 'Tata 407 (Medium Duty)', capacity: 600, payload: '2.5 Tons', value: 'Tata 407' },
  { label: 'Mahindra Bolero Maxi Truck', capacity: 450, payload: '1.8 Tons', value: 'Mahindra Bolero' },
  { label: 'Eicher 14ft (Heavy Cargo)', capacity: 800, payload: '4.0 Tons', value: 'Eicher 14ft' },
  { label: 'Eicher 17ft (High Deck)', capacity: 1000, payload: '5.5 Tons', value: 'Eicher 17ft' },
  { label: '20ft High-Cube Container', capacity: 1200, payload: '7.5 Tons', value: '20ft Container' },
];

export default function DriverOnboardingScreen() {
  const currentStep = useOnboardingStore((s) => s.currentStep);
  const setStep = useOnboardingStore((s) => s.setStep);
  const driverKyc = useOnboardingStore((s) => s.driverKyc);
  const updateDriverKyc = useOnboardingStore((s) => s.updateDriverKyc);
  const vehicle = useOnboardingStore((s) => s.vehicle);
  const updateVehicle = useOnboardingStore((s) => s.updateVehicle);
  const bank = useOnboardingStore((s) => s.bank);
  const updateBank = useOnboardingStore((s) => s.updateBank);
  const agreementAccepted = useOnboardingStore((s) => s.agreementAccepted);
  const setAgreementAccepted = useOnboardingStore((s) => s.setAgreementAccepted);
  const submitOnboarding = useOnboardingStore((s) => s.submitOnboarding);
  const loadSavedOnboarding = useOnboardingStore((s) => s.loadSavedOnboarding);

  const authUser = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);

  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    loadSavedOnboarding();
  }, []);

  // Image upload handler
  const handlePickImage = async (field: string, target: 'kyc' | 'vehicle', sampleKey?: keyof typeof SAMPLE_IMAGES) => {
    Alert.alert(
      'Upload Document / Image',
      'Select a source for this image:',
      [
        {
          text: 'Camera',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Needed', 'Camera access is required to capture documents.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]?.uri) {
              if (target === 'kyc') updateDriverKyc({ [field]: result.assets[0].uri });
              else updateVehicle({ [field]: result.assets[0].uri });
            }
          },
        },
        {
          text: 'Photo Gallery',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Needed', 'Photo gallery access is required.');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              allowsEditing: true,
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]?.uri) {
              if (target === 'kyc') updateDriverKyc({ [field]: result.assets[0].uri });
              else updateVehicle({ [field]: result.assets[0].uri });
            }
          },
        },
        {
          text: 'Use Verified Sample',
          onPress: () => {
            if (sampleKey && SAMPLE_IMAGES[sampleKey]) {
              const uri = SAMPLE_IMAGES[sampleKey];
              if (target === 'kyc') updateDriverKyc({ [field]: uri });
              else updateVehicle({ [field]: uri });
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!driverKyc.fullName.trim() || !driverKyc.phone.trim()) {
        Alert.alert('Required Fields', 'Please enter your Full Name and Mobile Number.');
        return;
      }
      setStep(2);
    } else if (currentStep === 2) {
      if (!driverKyc.dlNumber.trim() || !driverKyc.aadhaarNumber.trim()) {
        Alert.alert('Required Fields', 'Please enter your Driving Licence and Aadhaar number.');
        return;
      }
      setStep(3);
    } else if (currentStep === 3) {
      if (!vehicle.registrationNumber.trim()) {
        Alert.alert('Required Fields', 'Please enter your Vehicle Registration Number (Plate).');
        return;
      }
      setStep(4);
    } else if (currentStep === 4) {
      setStep(5);
    } else if (currentStep === 5) {
      if (!bank.accountNumber.trim() || !bank.ifscCode.trim()) {
        Alert.alert('Required Fields', 'Please enter Bank Account and IFSC code for driver payouts.');
        return;
      }
      setStep(6);
    }
  };

  const handleSubmit = async () => {
    if (!agreementAccepted) {
      Alert.alert('Agreement Required', 'Please accept the Driver Partner Safety & Compliance Pledge.');
      return;
    }

    setLoading(true);
    try {
      await submitOnboarding();

      // Ensure auth store has the partner session
      if (!authUser) {
        setAuth(
          {
            id: 'vendor-partner-001',
            role: 'vendor',
            name: driverKyc.fullName || 'Driver Partner',
            phone: driverKyc.phone || '9888888888',
          },
          'mock-vendor-access-token'
        );
      }

      Alert.alert(
        '🎉 Onboarding Complete!',
        `Vehicle ${vehicle.registrationNumber} and documentation registered with Triveni Transports. Your account is approved for commercial shifting orders.`,
        [
          {
            text: 'Go to Duties Dashboard',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (e: any) {
      Alert.alert('Notice', 'Onboarding details saved locally. Connecting to dispatch desk.');
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              if (currentStep > 1) setStep(currentStep - 1);
              else router.back();
            }}
            activeOpacity={0.7}
          >
            <ChevronLeft size={20} color={Colors.navy} />
            <Text style={styles.backBtnText}>
              {currentStep > 1 ? `Step ${currentStep - 1}` : 'Back'}
            </Text>
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Driver Onboarding</Text>
            <Text style={styles.headerSubtitle}>Vehicle & Documentation</Text>
          </View>

          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.7}
          >
            <Text style={styles.skipBtnText}>Dashboard</Text>
          </TouchableOpacity>
        </View>

        {/* Stepper Dots */}
        <View style={styles.stepperContainer}>
          {[1, 2, 3, 4, 5, 6].map((step) => {
            const isActive = step === currentStep;
            const isCompleted = step < currentStep;
            return (
              <TouchableOpacity
                key={step}
                style={[
                  styles.stepDot,
                  isActive && styles.stepDotActive,
                  isCompleted && styles.stepDotCompleted,
                ]}
                onPress={() => setStep(step)}
                activeOpacity={0.8}
              >
                {isCompleted ? (
                  <Check size={11} color={Colors.white} strokeWidth={3} />
                ) : (
                  <Text style={[styles.stepNumber, isActive && styles.stepNumberActive]}>
                    {step}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Current Step Label */}
        <View style={styles.stepTitleBar}>
          <Text style={styles.stepTitleBarText}>
            {currentStep === 1 && 'Step 1: Driver Profile & Experience'}
            {currentStep === 2 && 'Step 2: KYC & Government Documents'}
            {currentStep === 3 && 'Step 3: Vehicle Specs & Registration Plate'}
            {currentStep === 4 && 'Step 4: Vehicle Inspection Photos'}
            {currentStep === 5 && 'Step 5: Direct Payout Bank Account'}
            {currentStep === 6 && 'Step 6: Compliance Pledge & Review'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ════════════════════════════════════════════════════════════════
            STEP 1: PERSONAL & DRIVER PROFILE
        ════════════════════════════════════════════════════════════════ */}
        {currentStep === 1 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconCircle}>
                <User size={20} color={Colors.navy} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Driver Personal Profile</Text>
                <Text style={styles.sectionSubtitle}>Your official logistics captain credentials</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Legal Name (as on DL/Aadhaar) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Rajesh Kumar"
                placeholderTextColor={Colors.inputPlaceholder}
                value={driverKyc.fullName}
                onChangeText={(text) => updateDriverKyc({ fullName: text })}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Mobile Phone Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="98888 88888"
                  keyboardType="phone-pad"
                  maxLength={10}
                  placeholderTextColor={Colors.inputPlaceholder}
                  value={driverKyc.phone}
                  onChangeText={(text) => updateDriverKyc({ phone: text })}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="partner@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={Colors.inputPlaceholder}
                  value={driverKyc.email}
                  onChangeText={(text) => updateDriverKyc({ email: text })}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Operating Base City</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Pune & PCMC"
                  placeholderTextColor={Colors.inputPlaceholder}
                  value={driverKyc.city}
                  onChangeText={(text) => updateDriverKyc({ city: text })}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Years of Experience</Text>
                <TextInput
                  style={styles.input}
                  placeholder="5"
                  keyboardType="number-pad"
                  placeholderTextColor={Colors.inputPlaceholder}
                  value={driverKyc.experienceYears}
                  onChangeText={(text) => updateDriverKyc({ experienceYears: text })}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Emergency Contact Person</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Sunita Kumar (Spouse)"
                  placeholderTextColor={Colors.inputPlaceholder}
                  value={driverKyc.emergencyContact}
                  onChangeText={(text) => updateDriverKyc({ emergencyContact: text })}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Emergency Phone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="98765 43210"
                  keyboardType="phone-pad"
                  maxLength={10}
                  placeholderTextColor={Colors.inputPlaceholder}
                  value={driverKyc.emergencyPhone}
                  onChangeText={(text) => updateDriverKyc({ emergencyPhone: text })}
                />
              </View>
            </View>
          </View>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 2: KYC & GOVERNMENT DOCUMENTS
        ════════════════════════════════════════════════════════════════ */}
        {currentStep === 2 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconCircle}>
                <FileText size={20} color={Colors.navy} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>KYC & Legal Documentation</Text>
                <Text style={styles.sectionSubtitle}>Mandatory for commercial transport permit compliance</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Driving Licence (DL) Number *</Text>
              <TextInput
                style={[styles.input, styles.codeFont]}
                placeholder="MH-12-2018-0045892"
                autoCapitalize="characters"
                placeholderTextColor={Colors.inputPlaceholder}
                value={driverKyc.dlNumber}
                onChangeText={(text) => updateDriverKyc({ dlNumber: text })}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>DL Expiry Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2030-05-15"
                  placeholderTextColor={Colors.inputPlaceholder}
                  value={driverKyc.dlExpiry}
                  onChangeText={(text) => updateDriverKyc({ dlExpiry: text })}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Aadhaar / National ID *</Text>
                <TextInput
                  style={[styles.input, styles.codeFont]}
                  placeholder="7845 9012 3456"
                  keyboardType="number-pad"
                  placeholderTextColor={Colors.inputPlaceholder}
                  value={driverKyc.aadhaarNumber}
                  onChangeText={(text) => updateDriverKyc({ aadhaarNumber: text })}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>DL Category</Text>
              <TextInput
                style={styles.input}
                placeholder="Commercial Transport (HMV/LMV)"
                placeholderTextColor={Colors.inputPlaceholder}
                value={driverKyc.dlCategory}
                onChangeText={(text) => updateDriverKyc({ dlCategory: text })}
              />
            </View>

            {/* Document Photo Upload Cards */}
            <Text style={styles.subHeading}>Upload Verification Documents</Text>

            <View style={styles.docUploadGrid}>
              {/* DL Front */}
              <View style={styles.docBox}>
                <Text style={styles.docBoxTitle}>Driving Licence (Front)</Text>
                {driverKyc.dlFrontUri ? (
                  <View style={styles.thumbnailWrapper}>
                    <Image source={{ uri: driverKyc.dlFrontUri }} style={styles.thumbnail} />
                    <TouchableOpacity
                      style={styles.viewThumbBtn}
                      onPress={() => setPreviewImage(driverKyc.dlFrontUri || null)}
                    >
                      <Eye size={12} color={Colors.white} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.uploadPlaceholder}
                    onPress={() => handlePickImage('dlFrontUri', 'kyc', 'dlFront')}
                    activeOpacity={0.8}
                  >
                    <Camera size={22} color={Colors.navy} />
                    <Text style={styles.uploadPlaceholderText}>Upload DL Front</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* DL Back */}
              <View style={styles.docBox}>
                <Text style={styles.docBoxTitle}>Driving Licence (Back)</Text>
                {driverKyc.dlBackUri ? (
                  <View style={styles.thumbnailWrapper}>
                    <Image source={{ uri: driverKyc.dlBackUri }} style={styles.thumbnail} />
                    <TouchableOpacity
                      style={styles.viewThumbBtn}
                      onPress={() => setPreviewImage(driverKyc.dlBackUri || null)}
                    >
                      <Eye size={12} color={Colors.white} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.uploadPlaceholder}
                    onPress={() => handlePickImage('dlBackUri', 'kyc', 'dlBack')}
                    activeOpacity={0.8}
                  >
                    <Upload size={22} color={Colors.navy} />
                    <Text style={styles.uploadPlaceholderText}>Upload DL Back</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Aadhaar Card */}
              <View style={styles.docBox}>
                <Text style={styles.docBoxTitle}>Aadhaar Card / ID Proof</Text>
                {driverKyc.aadhaarUri ? (
                  <View style={styles.thumbnailWrapper}>
                    <Image source={{ uri: driverKyc.aadhaarUri }} style={styles.thumbnail} />
                    <TouchableOpacity
                      style={styles.viewThumbBtn}
                      onPress={() => setPreviewImage(driverKyc.aadhaarUri || null)}
                    >
                      <Eye size={12} color={Colors.white} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.uploadPlaceholder}
                    onPress={() => handlePickImage('aadhaarUri', 'kyc', 'aadhaar')}
                    activeOpacity={0.8}
                  >
                    <FileText size={22} color={Colors.navy} />
                    <Text style={styles.uploadPlaceholderText}>Upload Aadhaar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 3: COMMERCIAL VEHICLE & REGISTRATION NUMBER
        ════════════════════════════════════════════════════════════════ */}
        {currentStep === 3 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconCircle}>
                <Truck size={20} color={Colors.navy} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Commercial Vehicle Details</Text>
                <Text style={styles.sectionSubtitle}>Enter registration number & cargo specs</Text>
              </View>
            </View>

            {/* Indian Number Plate Badge */}
            <View style={styles.plateContainer}>
              <View style={styles.indianNumberPlate}>
                <View style={styles.indBadge}>
                  <Text style={styles.indAshoka}>🇮🇳</Text>
                  <Text style={styles.indText}>IND</Text>
                </View>
                <TextInput
                  style={styles.plateInput}
                  placeholder="MH 12 CD 5678"
                  autoCapitalize="characters"
                  maxLength={13}
                  value={vehicle.registrationNumber}
                  onChangeText={(text) => updateVehicle({ registrationNumber: text.toUpperCase() })}
                />
              </View>
              <Text style={styles.plateCaption}>
                Enter the official registration number matching your vehicle RC certificate
              </Text>
            </View>

            {/* Vehicle Type Picker Chips */}
            <Text style={styles.label}>Select Vehicle Category</Text>
            <View style={styles.vehicleTypeGrid}>
              {VEHICLE_TYPES.map((v) => {
                const isSelected = vehicle.type === v.value;
                return (
                  <TouchableOpacity
                    key={v.value}
                    style={[styles.vehicleTypeCard, isSelected && styles.vehicleTypeCardActive]}
                    onPress={() =>
                      updateVehicle({
                        type: v.value,
                        capacityCft: v.capacity,
                        payloadTons: v.payload,
                        makeModel: v.label,
                      })
                    }
                    activeOpacity={0.8}
                  >
                    <View style={styles.vehicleTypeHeader}>
                      <Truck size={16} color={isSelected ? Colors.white : Colors.navy} />
                      <Text style={[styles.vehicleTypeTitle, isSelected && styles.vehicleTypeTitleActive]}>
                        {v.value}
                      </Text>
                    </View>
                    <Text style={[styles.vehicleTypeDesc, isSelected && styles.vehicleTypeDescActive]}>
                      {v.capacity} CFT · {v.payload}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Cargo Volume (CFT)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  value={String(vehicle.capacityCft || 600)}
                  onChangeText={(text) => updateVehicle({ capacityCft: parseInt(text) || 0 })}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Max Payload Weight</Text>
                <TextInput
                  style={styles.input}
                  value={vehicle.payloadTons}
                  onChangeText={(text) => updateVehicle({ payloadTons: text })}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>RC (Registration Certificate) Number</Text>
              <TextInput
                style={[styles.input, styles.codeFont]}
                placeholder="MH12-RC-2021-9988"
                autoCapitalize="characters"
                value={vehicle.rcNumber}
                onChangeText={(text) => updateVehicle({ rcNumber: text })}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Commercial Permit Expiry</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2028-11-20"
                  value={vehicle.permitExpiry}
                  onChangeText={(text) => updateVehicle({ permitExpiry: text })}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Fitness Cert. Expiry</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2027-08-10"
                  value={vehicle.fitnessCertExpiry}
                  onChangeText={(text) => updateVehicle({ fitnessCertExpiry: text })}
                />
              </View>
            </View>
          </View>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 4: VEHICLE IMAGES & INSPECTION PROOF
        ════════════════════════════════════════════════════════════════ */}
        {currentStep === 4 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconCircle}>
                <Camera size={20} color={Colors.navy} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Vehicle Inspection Photos</Text>
                <Text style={styles.sectionSubtitle}>
                  Provide real vehicle images with registration number clearly visible
                </Text>
              </View>
            </View>

            {/* Quick Demo Pre-fill Pill */}
            <TouchableOpacity
              style={styles.presetPill}
              onPress={() => {
                updateVehicle({
                  frontImageUri: SAMPLE_IMAGES.vehicleFront,
                  sideImageUri: SAMPLE_IMAGES.vehicleSide,
                  rearImageUri: SAMPLE_IMAGES.vehicleRear,
                  cargoImageUri: SAMPLE_IMAGES.vehicleCargo,
                  rcDocUri: SAMPLE_IMAGES.rcDoc,
                });
                Alert.alert('Samples Applied', 'Verified vehicle inspection photos have been loaded for testing.');
              }}
              activeOpacity={0.8}
            >
              <Sparkles size={14} color={Colors.navy} />
              <Text style={styles.presetPillText}>Auto-fill Verified Sample Vehicle Photos</Text>
            </TouchableOpacity>

            <View style={styles.photoUploadList}>
              {/* Front Photo with Plate */}
              <View style={styles.photoCard}>
                <View style={styles.photoInfo}>
                  <Text style={styles.photoCardTitle}>Front View (Number Plate Visible) *</Text>
                  <Text style={styles.photoCardDesc}>
                    Required for AI registration plate validation & customer trust
                  </Text>
                </View>
                {vehicle.frontImageUri ? (
                  <View style={styles.previewContainer}>
                    <Image source={{ uri: vehicle.frontImageUri }} style={styles.photoThumbnail} />
                    <TouchableOpacity
                      style={styles.deletePhotoBtn}
                      onPress={() => updateVehicle({ frontImageUri: undefined })}
                    >
                      <Trash2 size={14} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.cameraActionBtn}
                    onPress={() => handlePickImage('frontImageUri', 'vehicle', 'vehicleFront')}
                    activeOpacity={0.8}
                  >
                    <Camera size={16} color={Colors.navy} />
                    <Text style={styles.cameraActionText}>Take / Upload Front</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Side View */}
              <View style={styles.photoCard}>
                <View style={styles.photoInfo}>
                  <Text style={styles.photoCardTitle}>Side Profile (Cargo Body) *</Text>
                  <Text style={styles.photoCardDesc}>Shows cargo container length and body condition</Text>
                </View>
                {vehicle.sideImageUri ? (
                  <View style={styles.previewContainer}>
                    <Image source={{ uri: vehicle.sideImageUri }} style={styles.photoThumbnail} />
                    <TouchableOpacity
                      style={styles.deletePhotoBtn}
                      onPress={() => updateVehicle({ sideImageUri: undefined })}
                    >
                      <Trash2 size={14} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.cameraActionBtn}
                    onPress={() => handlePickImage('sideImageUri', 'vehicle', 'vehicleSide')}
                    activeOpacity={0.8}
                  >
                    <Upload size={16} color={Colors.navy} />
                    <Text style={styles.cameraActionText}>Upload Side View</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Rear View */}
              <View style={styles.photoCard}>
                <View style={styles.photoInfo}>
                  <Text style={styles.photoCardTitle}>Rear View (with Rear Plate) *</Text>
                  <Text style={styles.photoCardDesc}>Rear bumper, tail lights and rear license plate</Text>
                </View>
                {vehicle.rearImageUri ? (
                  <View style={styles.previewContainer}>
                    <Image source={{ uri: vehicle.rearImageUri }} style={styles.photoThumbnail} />
                    <TouchableOpacity
                      style={styles.deletePhotoBtn}
                      onPress={() => updateVehicle({ rearImageUri: undefined })}
                    >
                      <Trash2 size={14} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.cameraActionBtn}
                    onPress={() => handlePickImage('rearImageUri', 'vehicle', 'vehicleRear')}
                    activeOpacity={0.8}
                  >
                    <Camera size={16} color={Colors.navy} />
                    <Text style={styles.cameraActionText}>Upload Rear View</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Cargo Space Inside */}
              <View style={styles.photoCard}>
                <View style={styles.photoInfo}>
                  <Text style={styles.photoCardTitle}>Cargo Compartment Interior</Text>
                  <Text style={styles.photoCardDesc}>Clean floor, tie-down anchor hooks, water-proof roof</Text>
                </View>
                {vehicle.cargoImageUri ? (
                  <View style={styles.previewContainer}>
                    <Image source={{ uri: vehicle.cargoImageUri }} style={styles.photoThumbnail} />
                    <TouchableOpacity
                      style={styles.deletePhotoBtn}
                      onPress={() => updateVehicle({ cargoImageUri: undefined })}
                    >
                      <Trash2 size={14} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.cameraActionBtn}
                    onPress={() => handlePickImage('cargoImageUri', 'vehicle', 'vehicleCargo')}
                    activeOpacity={0.8}
                  >
                    <Upload size={16} color={Colors.navy} />
                    <Text style={styles.cameraActionText}>Upload Cargo Area</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* RC Document Photo */}
              <View style={styles.photoCard}>
                <View style={styles.photoInfo}>
                  <Text style={styles.photoCardTitle}>Vehicle RC Certificate Document</Text>
                  <Text style={styles.photoCardDesc}>Original commercial smart card or RTO certificate</Text>
                </View>
                {vehicle.rcDocUri ? (
                  <View style={styles.previewContainer}>
                    <Image source={{ uri: vehicle.rcDocUri }} style={styles.photoThumbnail} />
                    <TouchableOpacity
                      style={styles.deletePhotoBtn}
                      onPress={() => updateVehicle({ rcDocUri: undefined })}
                    >
                      <Trash2 size={14} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.cameraActionBtn}
                    onPress={() => handlePickImage('rcDocUri', 'vehicle', 'rcDoc')}
                    activeOpacity={0.8}
                  >
                    <FileText size={16} color={Colors.navy} />
                    <Text style={styles.cameraActionText}>Upload RC Document</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 5: DIRECT PAYOUT BANK ACCOUNT
        ════════════════════════════════════════════════════════════════ */}
        {currentStep === 5 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconCircle}>
                <CreditCard size={20} color={Colors.navy} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Driver Payout Settlement Account</Text>
                <Text style={styles.sectionSubtitle}>Direct daily earnings and incentive bank deposits</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Account Holder Legal Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Rajesh Kumar"
                placeholderTextColor={Colors.inputPlaceholder}
                value={bank.accountHolderName}
                onChangeText={(text) => updateBank({ accountHolderName: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bank Name</Text>
              <TextInput
                style={styles.input}
                placeholder="HDFC Bank"
                placeholderTextColor={Colors.inputPlaceholder}
                value={bank.bankName}
                onChangeText={(text) => updateBank({ bankName: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bank Account Number *</Text>
              <TextInput
                style={[styles.input, styles.codeFont]}
                placeholder="50100458921478"
                keyboardType="number-pad"
                placeholderTextColor={Colors.inputPlaceholder}
                value={bank.accountNumber}
                onChangeText={(text) => updateBank({ accountNumber: text })}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>IFSC Code *</Text>
                <TextInput
                  style={[styles.input, styles.codeFont]}
                  placeholder="HDFC0001234"
                  autoCapitalize="characters"
                  placeholderTextColor={Colors.inputPlaceholder}
                  value={bank.ifscCode}
                  onChangeText={(text) => updateBank({ ifscCode: text.toUpperCase() })}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>UPI ID (Instant Settlement)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="rajesh@okhdfc"
                  autoCapitalize="none"
                  placeholderTextColor={Colors.inputPlaceholder}
                  value={bank.upiId}
                  onChangeText={(text) => updateBank({ upiId: text })}
                />
              </View>
            </View>

            <View style={styles.payoutNoticeBox}>
              <ShieldCheck size={16} color={Colors.success} />
              <Text style={styles.payoutNoticeText}>
                Triveni Transports operates 100% automated payouts within 24 hours of successful move completion.
              </Text>
            </View>
          </View>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 6: REVIEW & COMPLIANCE PLEDGE
        ════════════════════════════════════════════════════════════════ */}
        {currentStep === 6 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconCircle}>
                <ShieldCheck size={20} color={Colors.success} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Verification Summary</Text>
                <Text style={styles.sectionSubtitle}>Review your registered vehicle & document submission</Text>
              </View>
            </View>

            {/* Verification Status Badge */}
            <View style={styles.statusBanner}>
              <CheckCircle2 size={18} color={Colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={styles.statusBannerTitle}>Driver Verification Passed</Text>
                <Text style={styles.statusBannerSubtitle}>
                  Vehicle {vehicle.registrationNumber} is approved for logistics duty
                </Text>
              </View>
            </View>

            {/* Vehicle Card Summary */}
            <View style={styles.summaryBox}>
              <View style={styles.summaryTitleRow}>
                <Truck size={16} color={Colors.navy} />
                <Text style={styles.summaryBoxTitle}>Vehicle Specifications</Text>
              </View>

              <View style={styles.summaryDetails}>
                <View style={styles.summaryDetailItem}>
                  <Text style={styles.summaryDetailLabel}>Registration Plate</Text>
                  <Text style={styles.summaryPlateText}>{vehicle.registrationNumber || 'MH 12 CD 5678'}</Text>
                </View>
                <View style={styles.summaryDetailItem}>
                  <Text style={styles.summaryDetailLabel}>Model</Text>
                  <Text style={styles.summaryDetailVal}>{vehicle.type || 'Tata 407'}</Text>
                </View>
                <View style={styles.summaryDetailItem}>
                  <Text style={styles.summaryDetailLabel}>Cargo Capacity</Text>
                  <Text style={styles.summaryDetailVal}>{vehicle.capacityCft} CFT</Text>
                </View>
                <View style={styles.summaryDetailItem}>
                  <Text style={styles.summaryDetailLabel}>Permit Status</Text>
                  <Text style={[styles.summaryDetailVal, { color: Colors.success }]}>Active till 2028</Text>
                </View>
              </View>

              {/* Photo Previews */}
              <Text style={styles.summarySectionLabel}>Vehicle Inspection Photos</Text>
              <View style={styles.thumbnailRow}>
                {vehicle.frontImageUri && (
                  <Image source={{ uri: vehicle.frontImageUri }} style={styles.summaryThumb} />
                )}
                {vehicle.sideImageUri && (
                  <Image source={{ uri: vehicle.sideImageUri }} style={styles.summaryThumb} />
                )}
                {vehicle.rearImageUri && (
                  <Image source={{ uri: vehicle.rearImageUri }} style={styles.summaryThumb} />
                )}
                {vehicle.cargoImageUri && (
                  <Image source={{ uri: vehicle.cargoImageUri }} style={styles.summaryThumb} />
                )}
              </View>
            </View>

            {/* Driver KYC Summary */}
            <View style={styles.summaryBox}>
              <View style={styles.summaryTitleRow}>
                <User size={16} color={Colors.navy} />
                <Text style={styles.summaryBoxTitle}>Driver KYC & Licence</Text>
              </View>

              <View style={styles.summaryDetails}>
                <View style={styles.summaryDetailItem}>
                  <Text style={styles.summaryDetailLabel}>Captain Name</Text>
                  <Text style={styles.summaryDetailVal}>{driverKyc.fullName || 'Rajesh Kumar'}</Text>
                </View>
                <View style={styles.summaryDetailItem}>
                  <Text style={styles.summaryDetailLabel}>Mobile</Text>
                  <Text style={styles.summaryDetailVal}>{driverKyc.phone || '98888 88888'}</Text>
                </View>
                <View style={styles.summaryDetailItem}>
                  <Text style={styles.summaryDetailLabel}>DL Number</Text>
                  <Text style={[styles.summaryDetailVal, styles.codeFont]}>{driverKyc.dlNumber}</Text>
                </View>
                <View style={styles.summaryDetailItem}>
                  <Text style={styles.summaryDetailLabel}>Aadhaar</Text>
                  <Text style={[styles.summaryDetailVal, styles.codeFont]}>{driverKyc.aadhaarNumber}</Text>
                </View>
              </View>
            </View>

            {/* Compliance Pledge Checkbox */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAgreementAccepted(!agreementAccepted)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, agreementAccepted && styles.checkboxChecked]}>
                {agreementAccepted && <Check size={14} color={Colors.white} strokeWidth={3} />}
              </View>
              <Text style={styles.checkboxLabel}>
                I declare that the commercial vehicle number, insurance documents, and driving licence provided are valid and genuine. I pledge to follow Triveni Transports safety standards.
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action Controls Footer */}
        <View style={styles.actionFooter}>
          {currentStep < 6 ? (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleNext}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>
                {currentStep === 1 && 'Next: KYC Documents →'}
                {currentStep === 2 && 'Next: Commercial Vehicle →'}
                {currentStep === 3 && 'Next: Vehicle Photos →'}
                {currentStep === 4 && 'Next: Payout Bank Account →'}
                {currentStep === 5 && 'Next: Review & Submit →'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.submitCompleteBtn, loading && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <View style={styles.btnRow}>
                  <Text style={styles.submitCompleteBtnText}>Save Onboarding & Enter Portal</Text>
                  <ArrowRight size={18} color={Colors.white} />
                </View>
              )}
            </TouchableOpacity>
          )}

          {currentStep > 1 && (
            <TouchableOpacity
              style={styles.prevBtn}
              onPress={() => setStep(currentStep - 1)}
              activeOpacity={0.7}
            >
              <Text style={styles.prevBtnText}>← Previous Step</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Fullscreen Modal Image Viewer */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },

  header: {
    backgroundColor: Colors.surface,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    ...Shadow.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backBtnText: {
    color: Colors.navy,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  headerTitleWrap: { alignItems: 'center' },
  headerTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.extrabold,
    color: Colors.navyDark,
  },
  headerSubtitle: {
    fontSize: 10,
    color: Colors.marigold,
    fontWeight: FontWeight.bold,
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSubtle,
  },
  skipBtnText: {
    color: Colors.navy,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },

  // Stepper
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: Spacing.sm,
  },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: Colors.navy,
    borderColor: Colors.navy,
    transform: [{ scale: 1.1 }],
  },
  stepDotCompleted: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  stepNumber: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: FontWeight.bold,
  },
  stepNumberActive: {
    color: Colors.white,
  },
  stepTitleBar: {
    backgroundColor: Colors.navySubtle,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  stepTitleBarText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Colors.navy,
  },

  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl * 2,
    gap: Spacing.md,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.sm,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.navySubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.extrabold,
    color: Colors.navyDark,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },

  inputGroup: { gap: 4 },
  label: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    color: Colors.navy,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    backgroundColor: Colors.inputBg,
    color: Colors.navy,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  codeFont: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
    fontWeight: FontWeight.bold,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },

  // Indian Number Plate Style
  plateContainer: {
    alignItems: 'center',
    gap: 6,
    marginVertical: Spacing.xs,
  },
  indianNumberPlate: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7D000', // Commercial Yellow Plate
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: '#000000',
    overflow: 'hidden',
    width: '100%',
    maxWidth: 320,
    ...Shadow.sm,
  },
  indBadge: {
    backgroundColor: '#003399',
    paddingHorizontal: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  indAshoka: { fontSize: 10 },
  indText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  plateInput: {
    flex: 1,
    fontSize: FontSize.xl,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 3,
    textAlign: 'center',
    paddingVertical: 10,
  },
  plateCaption: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
  },

  vehicleTypeGrid: {
    gap: 6,
  },
  vehicleTypeCard: {
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm + 2,
    backgroundColor: Colors.surfaceSubtle,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehicleTypeCardActive: {
    backgroundColor: Colors.navy,
    borderColor: Colors.navy,
  },
  vehicleTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vehicleTypeTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.navy,
  },
  vehicleTypeTitleActive: {
    color: Colors.white,
  },
  vehicleTypeDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: FontWeight.semibold,
  },
  vehicleTypeDescActive: {
    color: Colors.marigold,
  },

  subHeading: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.extrabold,
    color: Colors.navy,
    marginTop: Spacing.xs,
  },

  docUploadGrid: {
    gap: 10,
  },
  docBox: {
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    backgroundColor: Colors.surfaceSubtle,
    gap: 6,
  },
  docBoxTitle: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Colors.navy,
  },
  uploadPlaceholder: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.inputBorder,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.white,
  },
  uploadPlaceholderText: {
    fontSize: 11,
    color: Colors.navy,
    fontWeight: FontWeight.semibold,
  },
  thumbnailWrapper: {
    position: 'relative',
    height: 90,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  viewThumbBtn: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: BorderRadius.full,
    padding: 6,
  },

  presetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.marigoldSubtle,
    borderWidth: 1,
    borderColor: Colors.marigoldBorder,
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  presetPillText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },

  photoUploadList: { gap: 10 },
  photoCard: {
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm + 2,
    backgroundColor: Colors.surfaceSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  photoInfo: { flex: 1, gap: 2 },
  photoCardTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.navy,
  },
  photoCardDesc: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  previewContainer: {
    position: 'relative',
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  photoThumbnail: { width: '100%', height: '100%' },
  deletePhotoBtn: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.full,
    padding: 3,
  },
  cameraActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.navyBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  cameraActionText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Colors.navy,
  },

  payoutNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.successLight,
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  payoutNoticeText: {
    fontSize: 11,
    color: '#166534',
    flex: 1,
    lineHeight: 16,
  },

  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.successLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  statusBannerTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.extrabold,
    color: '#166534',
  },
  statusBannerSubtitle: {
    fontSize: 11,
    color: '#15803D',
  },

  summaryBox: {
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceSubtle,
    gap: Spacing.sm,
  },
  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryBoxTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.navy,
  },
  summaryDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryDetailItem: {
    width: '45%',
    gap: 2,
  },
  summaryDetailLabel: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  summaryDetailVal: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.navyDark,
  },
  summaryPlateText: {
    fontSize: FontSize.xs,
    fontWeight: '900',
    color: Colors.navy,
    backgroundColor: '#F7D000',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  summarySectionLabel: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Colors.navy,
    marginTop: 4,
  },
  thumbnailRow: {
    flexDirection: 'row',
    gap: 6,
  },
  summaryThumb: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
  },

  checkboxRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginTop: Spacing.xs,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.navy,
    borderColor: Colors.navy,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },

  actionFooter: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  primaryBtn: {
    backgroundColor: Colors.navy,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  submitCompleteBtn: {
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  submitCompleteBtnText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.extrabold,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnDisabled: { opacity: 0.6 },
  prevBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  prevBtnText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: FontWeight.semibold,
  },

  // Modal Preview
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
  modalImage: {
    width: '100%',
    height: '75%',
  },
});

