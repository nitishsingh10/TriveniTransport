import { create } from 'zustand';
import type { BookingStatus } from '@triveni/shared-types';
import { driverJobsApi, type BackendJob } from '@/lib/api';

let latestJobsFetch = 0;

function numeric(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

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
  isRefreshing: boolean;
  loadError: string | null;
  acceptingJobIds: string[];
  dismissedJobIds: string[];
  vendorId: string | null;
  lastFetchedAt: string | null;
  
  // Actions
  setActiveJob: (job: DriverJob | null) => void;
  acceptJob: (jobId: string) => Promise<void>;
  declineJob: (jobId: string) => void;
  updateJobStatus: (jobId: string, status: BookingStatus) => Promise<void>;
  completeJob: (jobId: string, pod: DriverJob['proofOfDelivery']) => Promise<void>;
  toggleGpsBroadcast: (enabled?: boolean) => void;
  updateGpsLocation: (lat: number, lng: number, speed: number) => void;
  fetchJobsFromBackend: (manual?: boolean, vendorId?: string) => Promise<void>;
}

/**
 * Convert backend job response to DriverJob interface
 */
function mapBackendJob(job: BackendJob): DriverJob {
  const snapshot = job.pricingSnapshot || {};
  const snapshotItems = Array.isArray(snapshot.items) ? snapshot.items : [];
  const itemCount = Array.isArray(job.items)
    ? job.items.reduce((sum, item) => sum + numeric(item.quantity), 0)
    : snapshotItems.reduce((sum: number, item: any) => sum + numeric(item.quantity), 0);
  return {
    id: job.id,
    trackingCode: `TRV-${job.id.slice(-8).toUpperCase()}`,
    customerName: job.customer?.name || 'Customer',
    customerPhone: job.customer?.phone || '',
    pickupAddress: job.pickupAddress,
    dropAddress: job.dropAddress,
    distanceKm: numeric(job.distanceKm),
    totalCft: numeric(snapshot.totalCft, snapshotItems.reduce((sum: number, item: any) => sum + numeric(item.cft, 20) * numeric(item.quantity), 0)),
    configuration: job.configurationType || 'Household Move',
    vehicleType: job.vehicle?.type || 'Tata 407',
    vehicleReg: job.vehicle?.registrationNumber || '',
    scheduledDate: new Date(job.scheduledDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    scheduledSlot: job.scheduledSlot || '09:00 AM – 12:00 PM',
    status: job.status,
    itemsCount: itemCount,
    floorNumber: job.floorNumber ?? 0,
    liftAvailable: job.liftAvailable ?? false,
    notes: '',
  };
}

export const useDriverStore = create<DriverState>((set, get) => ({
  // Start with empty data — no mock data
  activeJob: null,
  pendingJobs: [],
  completedJobs: [],
  isLoading: false,
  isRefreshing: false,
  loadError: null,
  acceptingJobIds: [],
  dismissedJobIds: [],
  vendorId: null,
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
  fetchJobsFromBackend: async (manual = false, vendorId) => {
    const current = get();
    const requestedVendorId = vendorId || current.vendorId;
    if (!requestedVendorId) {
      set({ loadError: 'Your driver session is missing. Sign in again to load jobs.' });
      return;
    }

    const switchingDrivers = current.vendorId !== requestedVendorId;
    if (!switchingDrivers && (current.isLoading || current.isRefreshing)) return;
    if (switchingDrivers) {
      set({
        vendorId: requestedVendorId,
        activeJob: null,
        pendingJobs: [],
        completedJobs: [],
        dismissedJobIds: [],
        lastFetchedAt: null,
        loadError: null,
      });
    }
    const fetchId = ++latestJobsFetch;
    set({ isLoading: !get().lastFetchedAt, isRefreshing: manual, loadError: null });
    try {
      const jobs = await driverJobsApi.getJobs();
      if (fetchId !== latestJobsFetch) return;
      
      const active: DriverJob[] = [];
      const pending: DriverJob[] = [];
      const completed: DriverJob[] = [];

      for (const job of jobs) {
        const mapped = mapBackendJob(job);
        if (job.status === 'COMPLETED' || job.status === 'CANCELLED') {
          completed.push(mapped);
        } else if (job.status === 'ASSIGNED' || job.status === 'EN_ROUTE' || job.status === 'ARRIVED' || job.status === 'IN_PROGRESS') {
          active.push(mapped);
        } else if (!get().dismissedJobIds.includes(job.id)) {
          pending.push(mapped);
        }
      }

      set({
        activeJob: active.length > 0 ? active[0] : null,
        pendingJobs: pending,
        completedJobs: completed,
        isLoading: false,
        isRefreshing: false,
        loadError: null,
        lastFetchedAt: new Date().toISOString(),
      });
    } catch (error) {
      if (fetchId !== latestJobsFetch) return;
      console.warn('Failed to fetch jobs from backend:', error);
      set({
        isLoading: false,
        isRefreshing: false,
        loadError: error instanceof Error ? error.message : 'Could not load assignments.',
      });
    }
  },

  setActiveJob: (job) => set({ activeJob: job }),

  acceptJob: async (jobId) => {
    if (get().acceptingJobIds.includes(jobId)) return;
    set((state) => ({ acceptingJobIds: [...state.acceptingJobIds, jobId] }));
    try {
      const accepted = await driverJobsApi.acceptJob(jobId);
      const updatedJob = mapBackendJob(accepted);
      set((state) => ({
        activeJob: state.activeJob || updatedJob,
        pendingJobs: state.pendingJobs.filter((job) => job.id !== jobId),
        dismissedJobIds: state.dismissedJobIds.filter((id) => id !== jobId),
      }));
    } catch (error) {
      await get().fetchJobsFromBackend();
      // The server may have accepted the move even if the response was lost.
      // Reconcile before showing a failure so a network timeout isn't reported
      // as a rejected assignment after a successful claim.
      if (get().activeJob?.id === jobId) return;
      throw error;
    } finally {
      set((state) => ({ acceptingJobIds: state.acceptingJobIds.filter((id) => id !== jobId) }));
    }
  },

  declineJob: (jobId) =>
    set((state) => ({
      pendingJobs: state.pendingJobs.filter((j) => j.id !== jobId),
      dismissedJobIds: state.dismissedJobIds.includes(jobId)
        ? state.dismissedJobIds
        : [...state.dismissedJobIds, jobId],
    })),

  updateJobStatus: async (jobId, status) => {
    await driverJobsApi.updateJobStatus(jobId, status);
    set((state) => state.activeJob?.id === jobId
      ? { activeJob: { ...state.activeJob, status } }
      : state);
  },

  completeJob: async (jobId, pod) => {
    const current = get().activeJob;
    if (!current || current.id !== jobId) throw new Error('This move is no longer your active assignment.');

    await driverJobsApi.updateJobStatus(jobId, 'COMPLETED');

    const finished: DriverJob = {
      ...current,
      status: 'COMPLETED',
      proofOfDelivery: pod,
    };
    set((state) => ({
      activeJob: state.activeJob?.id === jobId ? null : state.activeJob,
      completedJobs: [finished, ...state.completedJobs.filter((job) => job.id !== jobId)],
    }));
  },

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
