import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { driverVendorApi } from '@/lib/api';

export interface DriverKycData {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  experienceYears: string;
  emergencyContact: string;
  emergencyPhone: string;
  dlNumber: string;
  dlExpiry: string;
  dlCategory: string;
  // Document photos (URIs or base64)
  dlFrontUri?: string;
  dlBackUri?: string;
  identityProofUri?: string;
  profilePhotoUri?: string;
}

export interface VehicleData {
  registrationNumber: string; // e.g. "MH 12 CD 5678"
  type: string; // "Tata 407", "Tata Ace", "Eicher 14ft", "Eicher 17ft", "Mahindra Bolero Pickup"
  makeModel: string;
  capacityCft: number;
  payloadTons: string;
  rcNumber: string;
  permitExpiry: string;
  fitnessCertExpiry: string;
  insurancePolicyNumber: string;
  insuranceExpiry: string;
  // Vehicle Images
  frontImageUri?: string;
  sideImageUri?: string;
  rearImageUri?: string;
  cargoImageUri?: string;
  rcDocUri?: string;
  permitDocUri?: string;
  fitnessDocUri?: string;
  insuranceDocUri?: string;
}

export interface BankData {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId?: string;
  proofUri?: string;
  accountLast4?: string;
}

export interface OnboardingState {
  currentStep: number;
  isCompleted: boolean;
  verificationStatus: 'pending' | 'submitted' | 'under_review' | 'needs_changes' | 'approved' | 'rejected';
  reviewNotes: string | null;
  driverKyc: DriverKycData;
  vehicle: VehicleData;
  bank: BankData;
  agreementAccepted: boolean;
  submittedAt: string | null;

  // Actions
  setStep: (step: number) => void;
  updateDriverKyc: (data: Partial<DriverKycData>) => void;
  updateVehicle: (data: Partial<VehicleData>) => void;
  updateBank: (data: Partial<BankData>) => void;
  setAgreementAccepted: (accepted: boolean) => void;
  saveToStorage: () => Promise<void>;
  loadSavedOnboarding: () => Promise<void>;
  submitOnboarding: () => Promise<void>;
  resetOnboarding: () => void;
}

const STORAGE_KEY = 'triveni_driver_onboarding_v1';

const defaultDriverKyc: DriverKycData = {
  fullName: '', phone: '', email: '', city: '', experienceYears: '',
  emergencyContact: '', emergencyPhone: '', dlNumber: '', dlExpiry: '', dlCategory: 'Commercial Transport (HMV/LMV)',
};

const defaultVehicle: VehicleData = {
  registrationNumber: '',
  type: '',
  makeModel: '',
  capacityCft: 0,
  payloadTons: '',
  rcNumber: '',
  permitExpiry: '',
  fitnessCertExpiry: '',
  insurancePolicyNumber: '',
  insuranceExpiry: '',
};

const defaultBank: BankData = {
  accountHolderName: '', bankName: '', accountNumber: '', ifscCode: '', upiId: '',
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  currentStep: 1,
  isCompleted: false,
  verificationStatus: 'pending',
  reviewNotes: null,
  driverKyc: defaultDriverKyc,
  vehicle: defaultVehicle,
  bank: defaultBank,
  agreementAccepted: false,
  submittedAt: null,

  setStep: (step) => {
    set({ currentStep: step });
    get().saveToStorage();
  },

  updateDriverKyc: (data) => {
    set((state) => ({
      driverKyc: { ...state.driverKyc, ...data },
    }));
    get().saveToStorage();
  },

  updateVehicle: (data) => {
    set((state) => ({
      vehicle: { ...state.vehicle, ...data },
    }));
    get().saveToStorage();
  },

  updateBank: (data) => {
    set((state) => ({
      bank: { ...state.bank, ...data },
    }));
    get().saveToStorage();
  },

  setAgreementAccepted: (accepted) => {
    set({ agreementAccepted: accepted });
    get().saveToStorage();
  },

  saveToStorage: async () => {
    try {
      const state = get();
      const payload = {
        currentStep: state.currentStep,
        isCompleted: state.isCompleted,
        verificationStatus: state.verificationStatus,
        driverKyc: state.driverKyc,
        vehicle: state.vehicle,
        bank: { ...state.bank, accountNumber: '' },
        agreementAccepted: state.agreementAccepted,
        submittedAt: state.submittedAt,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to save onboarding data:', e);
    }
  },

  loadSavedOnboarding: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        let savedDriverKyc = Object.fromEntries(Object.entries(parsed.driverKyc || {}).filter(([key]) => !['aadhaarNumber', 'aadhaarUri'].includes(key) && !(typeof parsed.driverKyc[key] === 'string' && parsed.driverKyc[key].includes('images.unsplash.com')))) as Partial<DriverKycData>;
        let savedVehicle = Object.fromEntries(Object.entries(parsed.vehicle || {}).filter(([, value]) => !(typeof value === 'string' && value.includes('images.unsplash.com')))) as Partial<VehicleData>;
        if (String(savedDriverKyc.phone || '').replace(/\D/g, '') === '9888888888') savedDriverKyc = defaultDriverKyc;
        if (savedVehicle.registrationNumber?.replace(/\s/g, '').toUpperCase() === 'MH12CD5678') savedVehicle = defaultVehicle;
        set({
          currentStep: parsed.currentStep || 1,
          verificationStatus: parsed.verificationStatus === 'submitted' ? 'submitted' : 'pending',
          driverKyc: { ...defaultDriverKyc, ...savedDriverKyc },
          vehicle: { ...defaultVehicle, ...savedVehicle },
        bank: {
          ...defaultBank,
          ...(String(parsed.bank?.accountNumber || '').replace(/\s/g, '') === '50100458921478' ? {} : parsed.bank || {}),
          accountNumber: '',
        },
          agreementAccepted: parsed.agreementAccepted === true,
          submittedAt: parsed.submittedAt || null,
          isCompleted: parsed.verificationStatus === 'submitted',
          reviewNotes: null,
        });
        await get().saveToStorage();
      }
      try {
        const profile = await driverVendorApi.getProfile();
        const isApproved = profile.status === 'active' && profile.onboardingStatus === 'approved';
        const status: OnboardingState['verificationStatus'] = ['submitted', 'under_review', 'needs_changes', 'approved', 'rejected'].includes(profile.onboardingStatus)
          ? profile.onboardingStatus as OnboardingState['verificationStatus'] : 'pending';
        const data = profile.onboardingData || {};
        const serverDriver = (data.driver || {}) as Partial<DriverKycData>;
        const serverVehicle = (data.vehicle || {}) as Partial<VehicleData>;
        const serverBank = (data.bank || {}) as Partial<BankData>;
        set({
          isCompleted: status !== 'pending',
          verificationStatus: isApproved ? 'approved' : status,
          reviewNotes: profile.reviewNotes || null,
          driverKyc: { ...get().driverKyc, ...serverDriver, identityProofUri: get().driverKyc.identityProofUri },
          vehicle: { ...get().vehicle, ...serverVehicle },
          bank: { ...get().bank, ...serverBank, accountNumber: '', accountLast4: serverBank.accountLast4 || get().bank.accountLast4 },
        });
      } catch {
        // Local drafts remain pending until the server confirms approval.
      }
    } catch (e) {
      console.warn('Failed to load saved onboarding:', e);
    }
  },

  submitOnboarding: async () => {
    const { driverKyc, vehicle, bank, agreementAccepted } = get();
    const uploadedDocuments: Array<[string, string | undefined]> = [
      ['driver_license_front', driverKyc.dlFrontUri],
      ['identity_proof', driverKyc.identityProofUri],
      ['vehicle_rc', vehicle.rcDocUri],
      ['vehicle_permit', vehicle.permitDocUri],
      ['vehicle_fitness', vehicle.fitnessDocUri],
      ['vehicle_insurance', vehicle.insuranceDocUri],
      ['vehicle_photo', vehicle.frontImageUri],
      ['bank_proof', bank.proofUri],
    ];
    const missing = uploadedDocuments.filter(([, uri]) => !uri).map(([type]) => type);
    if (missing.length) throw new Error(`Upload all required documents: ${missing.join(', ')}.`);

    for (const [type, uri] of uploadedDocuments) {
      await driverVendorApi.uploadDocument(type, uri!);
    }

    await driverVendorApi.saveOnboarding({
      driver: driverKyc,
      vehicle,
      bank,
      agreementAccepted,
    });
    const now = new Date().toISOString();
    set({
      isCompleted: true,
      verificationStatus: 'submitted',
      reviewNotes: null,
      submittedAt: now,
      currentStep: 6,
      bank: { ...bank, accountNumber: '', accountLast4: bank.accountNumber.slice(-4) },
    });
    await get().saveToStorage();
  },

  resetOnboarding: () => {
    set({
      currentStep: 1,
      isCompleted: false,
      verificationStatus: 'pending',
      reviewNotes: null,
      driverKyc: {
        fullName: '',
        phone: '',
        email: '',
        city: '',
        experienceYears: '',
        emergencyContact: '',
        emergencyPhone: '',
        dlNumber: '',
        dlExpiry: '',
        dlCategory: 'Commercial Transport (HMV/LMV)',
      },
      vehicle: {
        registrationNumber: '',
        type: '',
        makeModel: '',
        capacityCft: 0,
        payloadTons: '',
        rcNumber: '',
        permitExpiry: '',
        fitnessCertExpiry: '',
        insurancePolicyNumber: '',
        insuranceExpiry: '',
      },
      bank: {
        accountHolderName: '',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        upiId: '',
      },
      agreementAccepted: false,
      submittedAt: null,
    });
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  },
}));

