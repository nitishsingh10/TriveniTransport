import { create } from 'zustand';
import type { BookingStatus } from '@triveni/shared-types';
import { driverJobsApi, type BackendJob } from '@/lib/api';

export interface DriverJob {
  id: string;
  trackingCode: string;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  dropAddress: string;
  distanceKm: number;
  totalCft: number;
  configuration: string;
  vehicleType: string;
  vehicleReg: string;
  scheduledDate: string;
  scheduledSlot: string;
  payoutAmount: number;
  advanceCollected: number;
  collectAtDelivery: number;
  status: BookingStatus;
  itemsCount: number;
  floorNumber: number;
  liftAvailable: boolean;
  notes?: string;
  proofOfDelivery?: {
    photoUri?: string;
    customerSignature?: string;
    signedBy?: string;
    completedAt?: string;
  };
}

export interface GpsState {
  latitude: number;
  longitude: number;
  speedKmh: number;
  headingDeg: number;
  isBroadcasting: boolean;
  satellites: number;
  lastPingTime: string;
}

interface DriverState {
  activeJob: DriverJob | null;
  pendingJobs: DriverJob[];
  completedJobs: DriverJob[];
  gps: GpsState;
  isLoading: boolean;
  lastFetchedAt: string | null;
  
  // Actions
  setActiveJob: (job: DriverJob | null) => void;
  acceptJob: (jobId: string) => void;
  declineJob: (jobId: string) => void;
  updateJobStatus: (jobId: string, status: BookingStatus) => void;
  completeJob: (jobId: string, pod: DriverJob['proofOfDelivery']) => void;
  toggleGpsBroadcast: (enabled?: boolean) => void;
  updateGpsLocation: (lat: number, lng: number, speed: number) => void;
  fetchJobsFromBackend: () => Promise<void>;
}

/**
 * Convert backend job response to DriverJob interface
 */
function mapBackendJob(job: BackendJob): DriverJob {
  return {
    id: job.id,
    trackingCode: `TRV-${job.id.slice(-8).toUpperCase()}`,
    customerName: job.customer?.name || 'Customer',
    customerPhone: job.customer?.phone || '',
    pickupAddress: job.pickupAddress,
    dropAddress: job.dropAddress,
    distanceKm: job.distanceKm || 0,
    totalCft: 480,
    configuration: 'Household Move',
    vehicleType: job.vehicle?.type || 'Tata 407',
    vehicleReg: job.vehicle?.registrationNumber || '',
    scheduledDate: new Date(job.scheduledDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    scheduledSlot: job.scheduledSlot || '09:00 AM – 12:00 PM',
    payoutAmount: Math.round((job.finalAmount || 0) * 0.65),
    advanceCollected: Math.round((job.finalAmount || 0) * 0.2),
    collectAtDelivery: Math.round((job.finalAmount || 0) * 0.8),
    status: job.status,
    itemsCount: 0,
    floorNumber: 0,
    liftAvailable: false,
    notes: '',
  };
}

export const useDriverStore = create<DriverState>((set, get) => ({
  // Start with empty data — no mock data
  activeJob: null,
  pendingJobs: [],
  completedJobs: [],
  isLoading: false,
  lastFetchedAt: null,
  gps: {
    latitude: 0,
    longitude: 0,
    speedKmh: 0,
    headingDeg: 0,
    isBroadcasting: false,
    satellites: 0,
    lastPingTime: '',
  },

  /**
   * Fetch real jobs from backend API
   */
  fetchJobsFromBackend: async () => {
    set({ isLoading: true });
    try {
      const jobs = await driverJobsApi.getJobs();
      
      const active: DriverJob[] = [];
      const pending: DriverJob[] = [];
      const completed: DriverJob[] = [];

      for (const job of jobs) {
        const mapped = mapBackendJob(job);
        if (job.status === 'COMPLETED' || job.status === 'CANCELLED') {
          completed.push(mapped);
        } else if (job.status === 'ASSIGNED' || job.status === 'EN_ROUTE' || job.status === 'ARRIVED' || job.status === 'IN_PROGRESS') {
          active.push(mapped);
        } else {
          pending.push(mapped);
        }
      }

      set({
        activeJob: active.length > 0 ? active[0] : null,
        pendingJobs: pending,
        completedJobs: completed,
        isLoading: false,
        lastFetchedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('Failed to fetch jobs from backend:', error);
      set({ isLoading: false });
    }
  },

  setActiveJob: (job) => set({ activeJob: job }),

  acceptJob: (jobId) =>
    set((state) => {
      const job = state.pendingJobs.find((j) => j.id === jobId);
      if (!job) return state;
      
      // Also call backend to update status
      driverJobsApi.updateJobStatus(jobId, 'ASSIGNED').catch(() => {});
      
      const updatedJob: DriverJob = { ...job, status: 'ASSIGNED' };
      return {
        activeJob: state.activeJob || updatedJob,
        pendingJobs: state.pendingJobs.filter((j) => j.id !== jobId),
      };
    }),

  declineJob: (jobId) =>
    set((state) => ({
      pendingJobs: state.pendingJobs.filter((j) => j.id !== jobId),
    })),

  updateJobStatus: (jobId, status) =>
    set((state) => {
      // Call backend to sync status
      driverJobsApi.updateJobStatus(jobId, status).catch(() => {});
      
      if (state.activeJob && state.activeJob.id === jobId) {
        return {
          activeJob: { ...state.activeJob, status },
        };
      }
      return state;
    }),

  completeJob: (jobId, pod) =>
    set((state) => {
      if (!state.activeJob || state.activeJob.id !== jobId) return state;
      
      // Call backend to mark completed
      driverJobsApi.updateJobStatus(jobId, 'COMPLETED').catch(() => {});
      
      const finished: DriverJob = {
        ...state.activeJob,
        status: 'COMPLETED',
        proofOfDelivery: pod,
      };
      return {
        activeJob: null,
        completedJobs: [finished, ...state.completedJobs],
      };
    }),

  toggleGpsBroadcast: (enabled) =>
    set((state) => ({
      gps: {
        ...state.gps,
        isBroadcasting: enabled !== undefined ? enabled : !state.gps.isBroadcasting,
        lastPingTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      },
    })),

  updateGpsLocation: (latitude, longitude, speedKmh) =>
    set((state) => ({
      gps: {
        ...state.gps,
        latitude,
        longitude,
        speedKmh,
        lastPingTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      },
    })),
}));
