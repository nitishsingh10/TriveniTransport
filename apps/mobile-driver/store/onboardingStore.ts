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
  aadhaarNumber: string;
  // Document photos (URIs or base64)
  dlFrontUri?: string;
  dlBackUri?: string;
  aadhaarUri?: string;
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
  insuranceDocUri?: string;
}

export interface BankData {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId?: string;
}

export interface OnboardingState {
  currentStep: number;
  isCompleted: boolean;
  verificationStatus: 'verified' | 'pending' | 'submitted';
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
  fullName: 'Rajesh Kumar',
  phone: '98888 88888',
  email: 'rajesh.kumar@trivenitransports.com',
  city: 'Pune & PCMC',
  experienceYears: '6',
  emergencyContact: 'Sunita Kumar',
  emergencyPhone: '98765 43210',
  dlNumber: 'MH-12-2018-0045892',
  dlExpiry: '2030-05-15',
  dlCategory: 'Commercial Transport (HMV/LMV)',
  aadhaarNumber: '7845 9012 3456',
};

const defaultVehicle: VehicleData = {
  registrationNumber: 'MH 12 CD 5678',
  type: 'Tata 407',
  makeModel: 'Tata Motors 407 LPT Heavy',
  capacityCft: 600,
  payloadTons: '2.5 Tons',
  rcNumber: 'MH12-RC-2021-9988',
  permitExpiry: '2028-11-20',
  fitnessCertExpiry: '2027-08-10',
  insurancePolicyNumber: 'NEW-IND-TRV-884920',
  insuranceExpiry: '2027-04-30',
};

const defaultBank: BankData = {
  accountHolderName: 'Rajesh Kumar',
  bankName: 'HDFC Bank',
  accountNumber: '50100458921478',
  ifscCode: 'HDFC0001234',
  upiId: 'rajeshkumar@okhdfcbank',
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  currentStep: 1,
  isCompleted: true, // Default to onboarded with verified demo vehicle
  verificationStatus: 'verified',
  driverKyc: defaultDriverKyc,
  vehicle: defaultVehicle,
  bank: defaultBank,
  agreementAccepted: true,
  submittedAt: new Date().toISOString(),

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
        bank: state.bank,
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
        set({
          currentStep: parsed.currentStep || 1,
          isCompleted: parsed.isCompleted ?? true,
          verificationStatus: parsed.verificationStatus || 'verified',
          driverKyc: { ...defaultDriverKyc, ...(parsed.driverKyc || {}) },
          vehicle: { ...defaultVehicle, ...(parsed.vehicle || {}) },
          bank: { ...defaultBank, ...(parsed.bank || {}) },
          agreementAccepted: parsed.agreementAccepted ?? true,
          submittedAt: parsed.submittedAt || null,
        });
      }
    } catch (e) {
      console.warn('Failed to load saved onboarding:', e);
    }
  },

  submitOnboarding: async () => {
    const { driverKyc, vehicle } = get();
    const now = new Date().toISOString();

    set({
      isCompleted: true,
      verificationStatus: 'verified',
      submittedAt: now,
      currentStep: 6,
    });

    await get().saveToStorage();

    // Sync to backend if authenticated
    try {
      await driverVendorApi.saveOnboarding({
        name: driverKyc.fullName,
        vehicleNumber: vehicle.registrationNumber,
        vehicleType: vehicle.type,
        capacityCft: vehicle.capacityCft,
        permitExpiry: vehicle.permitExpiry,
        fitnessCertExpiry: vehicle.fitnessCertExpiry,
      });
    } catch (err) {
      console.log('Driver onboarding backend sync deferred (saved locally):', err);
    }
  },

  resetOnboarding: () => {
    set({
      currentStep: 1,
      isCompleted: false,
      verificationStatus: 'pending',
      driverKyc: {
        fullName: '',
        phone: '',
        email: '',
        city: 'Pune & PCMC',
        experienceYears: '3',
        emergencyContact: '',
        emergencyPhone: '',
        dlNumber: '',
        dlExpiry: '',
        dlCategory: 'Commercial Transport (HMV/LMV)',
        aadhaarNumber: '',
      },
      vehicle: {
        registrationNumber: '',
        type: 'Tata 407',
        makeModel: 'Tata Motors 407',
        capacityCft: 600,
        payloadTons: '2.5 Tons',
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

