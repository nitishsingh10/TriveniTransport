'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, MapPin, Flag, ArrowRight, Crosshair, Home, Briefcase, Tag } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WebMapModal from '../components/WebMapModal';
import WebRouteCard from '../components/WebRouteCard';
import { quotes, bookings, token, ApiError } from '../lib/api';
import { useAuth } from '../lib/useAuth';
import { getBrowserLocation, type LocationBias } from '../lib/location';
import styles from './page.module.css';

const ITEM_CATALOG = [
  { category: 'Living Room', items: [
    { name: 'Sofa (3 Seater)', cft: 25 },
    { name: 'Sofa (2 Seater)', cft: 18 },
    { name: 'Center Table', cft: 8 },
    { name: 'TV Unit', cft: 15 },
    { name: 'Bookshelf', cft: 12 },
    { name: 'Shoe Rack (Small)', cft: 6 },
    { name: 'Shoe Rack (Large)', cft: 12 },
    { name: 'Mandir / Pooja Unit (Small)', cft: 12 },
    { name: 'Mandir / Pooja Unit (Medium)', cft: 24 },
    { name: 'Mandir / Pooja Unit (Large)', cft: 40 },
  ]},
  { category: 'Bedroom', items: [
    { name: 'Double Bed (with mattress)', cft: 40 },
    { name: 'Single Bed (with mattress)', cft: 25 },
    { name: 'Wardrobe (Large)', cft: 35 },
    { name: 'Wardrobe (Small)', cft: 20 },
    { name: 'Dressing Table', cft: 12 },
    { name: 'Side Table (Small)', cft: 4 },
    { name: 'Side Table (Large)', cft: 8 },
    { name: 'Wardrobe (3-door)', cft: 45 },
    { name: 'Mattress (King)', cft: 18 },
    { name: 'Mattress (Queen)', cft: 15 },
    { name: 'Mattress (Single)', cft: 10 },
  ]},
  { category: 'Kitchen', items: [
    { name: 'Refrigerator (Single Door)', cft: 20 },
    { name: 'Refrigerator (Double Door)', cft: 30 },
    { name: 'Washing Machine (Front Load)', cft: 20 },
    { name: 'Washing Machine (Top Load)', cft: 18 },
    { name: 'Microwave Oven', cft: 3 },
    { name: 'Kitchen Boxes (per box)', cft: 3 },
    { name: 'Gas Cylinder', cft: 4 },
    { name: 'Water Purifier', cft: 3 },
    { name: 'Dishwasher', cft: 15 },
    { name: 'Kitchen Cabinet / Island', cft: 45 },
  ]},
  { category: 'Others', items: [
    { name: 'Dining Table (4 Seater)', cft: 20 },
    { name: 'AC (Split)', cft: 10 },
    { name: 'AC (Window)', cft: 8 },
    { name: 'Bicycle', cft: 12 },
    { name: 'Office Carton Box (Large)', cft: 5 },
    { name: 'Carton Box (Small)', cft: 3 },
    { name: 'Plant (Small, under 2 ft)', cft: 5 },
    { name: 'Plant (Medium, 2–4 ft)', cft: 12 },
    { name: 'Plant (Large, over 4 ft)', cft: 25 },
    { name: 'Dining Table (6 Seater)', cft: 30 },
    { name: 'LED TV (32–43 inch)', cft: 8 },
    { name: 'LED TV (50+ inch)', cft: 15 },
  ]},
  { category: 'Office Furniture', items: [
    { name: 'Office Desk / Workstation', cft: 45 },
    { name: 'Office Chair', cft: 18 },
    { name: 'Filing Cabinet', cft: 25 },
    { name: 'Conference Table (Standard)', cft: 55 },
    { name: 'Office Desk (Small)', cft: 25 },
    { name: 'Office Desk (Large)', cft: 55 },
    { name: 'Conference Table (Small)', cft: 35 },
    { name: 'Conference Table (Large)', cft: 70 },
    { name: 'Storage / Filing Cabinet (Small)', cft: 15 },
    { name: 'Storage / Filing Cabinet (Large)', cft: 35 },
  ]},
  { category: 'Office IT & Electronics', items: [
    { name: 'Desktop Computer / Monitor', cft: 8 },
    { name: 'Printer / Scanner', cft: 8 },
    { name: 'Server Rack / Network Equipment', cft: 30 },
    { name: 'Projector / Display', cft: 12 },
  ]},
  { category: 'Office Records & Supplies', items: [
    { name: 'Archive / File Box', cft: 5 },
    { name: 'Carton Box (Large)', cft: 5 },
  ]},
];

const PACKING_TIERS = [
  { value: 'lite' as const, label: 'Lite', desc: 'Newspaper + bubble wrap for fragiles', note: '0.8× base rate' },
  { value: 'standard' as const, label: 'Standard', desc: 'Corrugated sheets + foam padding', note: '1× base rate' },
  { value: 'premium' as const, label: 'Premium', desc: 'Wooden crating for all items', note: '1.35× base rate' },
];

type SelectedItems = Record<string, number>;
type PackingTier = 'lite' | 'standard' | 'premium';
type PlaceSuggestion = { placeId: string; description: string; mainText: string; secondaryText: string; lat: number; lng: number; city: string };


export default function QuotePage() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();

  // Form state
  const [step, setStep] = useState(0);
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [floor, setFloor] = useState(0);
  const [accessType, setAccessType] = useState<'ground' | 'floor'>('ground');
  const [liftAvailable, setLiftAvailable] = useState(true);
  const [configType, setConfigType] = useState<string>('2bhk');
  const [parkingClose, setParkingClose] = useState(true);
  const [technicalWork, setTechnicalWork] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledSlot, setScheduledSlot] = useState('morning');
  const [selectedItems, setSelectedItems] = useState<SelectedItems>({});
  const [packingTier, setPackingTier] = useState<PackingTier>('standard');
  const [pickupUnit, setPickupUnit] = useState('');
  const [pickupLandmark, setPickupLandmark] = useState('');
  const [dropUnit, setDropUnit] = useState('');
  const [dropLandmark, setDropLandmark] = useState('');
  const [alternateContactPhone, setAlternateContactPhone] = useState('');
  const [locationBias, setLocationBias] = useState<LocationBias | null>(null);

  // Map modal & route estimate state
  const [mapModalType, setMapModalType] = useState<'pickup' | 'drop' | null>(null);
  const [routeEstimate, setRouteEstimate] = useState<{
    distanceKm: number;
    durationMins: number;
    origin: string;
    destination: string;
  } | null>(null);

  // API state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quoteResult, setQuoteResult] = useState<Awaited<ReturnType<typeof quotes.itemized>> | null>(null);
  const [bookingCreating, setBookingCreating] = useState(false);

  // Autocomplete suggestion states
  const [pickupSuggestions, setPickupSuggestions] = useState<PlaceSuggestion[]>([]);
  const [dropSuggestions, setDropSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropSuggestions, setShowDropSuggestions] = useState(false);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [dropLoading, setDropLoading] = useState(false);

  const pickupDebounce = useRef<NodeJS.Timeout | null>(null);
  const dropDebounce = useRef<NodeJS.Timeout | null>(null);
  const pickupWrapRef = useRef<HTMLDivElement | null>(null);
  const dropWrapRef = useRef<HTMLDivElement | null>(null);

  // Close suggestion dropdowns on outside click
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // Hydrate this client form from the instant-estimate handoff query.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPickup(params.get('pickup') || '');
    setDrop(params.get('drop') || '');
    setPickupUnit(params.get('pickupUnit') || '');
    setPickupLandmark(params.get('pickupLandmark') || '');
    setDropUnit(params.get('dropUnit') || '');
    setDropLandmark(params.get('dropLandmark') || '');
    setAlternateContactPhone(params.get('alternateContactPhone') || '');
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (pickupWrapRef.current && !pickupWrapRef.current.contains(e.target as Node)) {
        setShowPickupSuggestions(false);
      }
      if (dropWrapRef.current && !dropWrapRef.current.contains(e.target as Node)) {
        setShowDropSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const searchPlaces = async (value: string) => {
    const bias = locationBias || await getBrowserLocation();
    if (bias) setLocationBias(bias);
    const params = new URLSearchParams({ input: value.trim() });
    if (bias) { params.set('lat', String(bias.lat)); params.set('lng', String(bias.lng)); }
    const response = await fetch(`/api/v1/maps/places?${params.toString()}`);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  };

  const handlePickupChange = (val: string) => {
    setQuoteResult(null);
    setPickup(val);
    if (pickupDebounce.current) clearTimeout(pickupDebounce.current);
    if (val.trim().length < 2) {
      setPickupSuggestions([]); setShowPickupSuggestions(false); setPickupLoading(false); return;
    }
    setPickupSuggestions([]); setShowPickupSuggestions(true); setPickupLoading(true);
    pickupDebounce.current = setTimeout(async () => {
      try { setPickupSuggestions(await searchPlaces(val)); }
      catch { setPickupSuggestions([]); }
      finally { setPickupLoading(false); }
    }, 250);
  };

  const handleDropChange = (val: string) => {
    setQuoteResult(null);
    setDrop(val);
    if (dropDebounce.current) clearTimeout(dropDebounce.current);
    if (val.trim().length < 2) {
      setDropSuggestions([]); setShowDropSuggestions(false); setDropLoading(false); return;
    }
    setDropSuggestions([]); setShowDropSuggestions(true); setDropLoading(true);
    dropDebounce.current = setTimeout(async () => {
      try { setDropSuggestions(await searchPlaces(val)); }
      catch { setDropSuggestions([]); }
      finally { setDropLoading(false); }
    }, 250);
  };

  const selectPickupSuggestion = (item: PlaceSuggestion) => {
    setQuoteResult(null);
    setPickup(item.description);
    setPickupUnit('');
    setPickupLandmark('');
    setShowPickupSuggestions(false);
    setPickupSuggestions([]);
  };

  const selectDropSuggestion = (item: PlaceSuggestion) => {
    setQuoteResult(null);
    setDrop(item.description);
    setDropUnit('');
    setDropLandmark('');
    setShowDropSuggestions(false);
    setDropSuggestions([]);
  };

  // Automatically calculate route distance & time when pickup & drop are set
  useEffect(() => {
    const origin = pickup.trim();
    const destination = drop.trim();
    if (origin.length <= 3 || destination.length <= 3) return;

    let active = true;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/maps/distance?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`);
        const data = res.ok ? await res.json() : { distanceKm: 14.5, durationMins: 38 };
        if (active) setRouteEstimate({ ...data, origin, destination });
      } catch {
        if (active) setRouteEstimate({ distanceKm: 14.5, durationMins: 38, origin, destination });
      }
    }, 500);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [pickup, drop]);

  const currentRouteEstimate = routeEstimate?.origin === pickup.trim()
    && routeEstimate.destination === drop.trim()
    ? routeEstimate
    : null;

  const handleLocationSelected = (loc: { address: string; lat: number; lng: number; city: string; type: 'pickup' | 'drop' }) => {
    setQuoteResult(null);
    if (loc.type === 'pickup') {
      setPickup(loc.address);
      setPickupUnit('');
      setPickupLandmark('');
    } else {
      setDrop(loc.address);
      setDropUnit('');
      setDropLandmark('');
    }
    setMapModalType(null);
  };

  const handleUseGps = async () => {
    setQuoteResult(null);
    const location = locationBias || await getBrowserLocation();
    if (!location) return;
    setLocationBias(location);
    try {
      const response = await fetch(`/api/v1/maps/reverse?lat=${location.lat}&lng=${location.lng}`);
      if (response.ok) setPickup((await response.json()).address || '');
      setPickupUnit('');
      setPickupLandmark('');
    } catch { /* Keep the location field editable when reverse geocoding is unavailable. */ }
  };

  const fullPickupAddress = `${pickup}, ${pickupUnit.trim()}, Landmark: ${pickupLandmark.trim()}`;
  const fullDropAddress = `${drop}, ${dropUnit.trim()}, Landmark: ${dropLandmark.trim()}`;
  const alternatePhoneValid = !alternateContactPhone || /^[6-9]\d{9}$/.test(alternateContactPhone);

  const updateItem = (name: string, delta: number) => {
    setSelectedItems(prev => {
      const current = prev[name] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) { const c = { ...prev }; delete c[name]; return c; }
      return { ...prev, [name]: next };
    });
  };

  const totalItems = Object.values(selectedItems).reduce((a, b) => a + b, 0);

  // Build the items payload from the selected catalog items
  const buildItemsPayload = () =>
    Object.entries(selectedItems)
      .filter(([, qty]) => qty > 0)
      .map(([name, quantity]) => {
        const found = ITEM_CATALOG.flatMap(c => c.items).find(i => i.name === name);
        return {
          itemId: null,
          customName: name,
          quantity,
          packingTier,
          customCft: found?.cft,
        };
      });

  const calculateQuote = async () => {
    if (!token.isLoggedIn()) {
      router.push(`/login?next=/quote`);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await quotes.itemized({
        pickupAddress: fullPickupAddress,
        dropAddress: fullDropAddress,
        ...(alternateContactPhone ? { alternateContactPhone } : {}),
        configurationType: configType,
        floorNumber: floor,
        liftAvailable,
        parkingClose,
        scheduledDate,
        scheduledSlot,
        items: buildItemsPayload(),
        addons: technicalWork,
      });
      setQuoteResult(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to calculate quote. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createBooking = async () => {
    if (!token.isLoggedIn()) { router.push(`/login?next=/quote`); return; }
    setError('');
    setBookingCreating(true);
    try {
      const res = await bookings.create({
        pickupAddress: fullPickupAddress,
        dropAddress: fullDropAddress,
        ...(alternateContactPhone ? { alternateContactPhone } : {}),
        configurationType: configType,
        floorNumber: floor,
        liftAvailable,
        parkingClose,
        scheduledDate,
        scheduledSlot,
        items: buildItemsPayload(),
        addons: technicalWork,
      });
      router.push(`/booking/${res.booking.id}/pay`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create booking. Please try again.');
    } finally {
      setBookingCreating(false);
    }
  };

  // Minimum date = tomorrow
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className="container">
          {/* Progress Bar */}
          <div className={styles.progress}>
            {['Shift type', 'Locations', 'Items', 'Schedule & price'].map((label, i) => (
              <div key={label} className={`${styles.progressStep} ${step > i ? styles.done : ''} ${step === i ? styles.current : ''}`}>
                <span className={styles.progressDot}>{step > i ? '✓' : i + 1}</span>
                <span className={styles.progressLabel}>{label}</span>
              </div>
            ))}
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${(step / 3) * 100}%` }} />
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
              ⚠️ {error}
            </div>
          )}

          {step === 0 && (
            <div className={`card ${styles.stepCard} animate-in`}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B45309', letterSpacing: '0.8px' }}>STEP 1 · SHIFT TYPE</span>
              <h2 className={styles.stepTitle}>What are you moving?</h2>
              <p className={styles.stepSubtitle}>Choose a home or office move to start your booking.</p>
              <div className={styles.serviceChoiceGrid}>
                <button type="button" className={styles.serviceChoice} onClick={() => { setQuoteResult(null); setConfigType('2bhk'); setStep(1); }}>
                  <Home size={24} /><strong>Home shifting</strong><span>Household goods, room by room</span><ArrowRight size={16} />
                </button>
                <button type="button" className={styles.serviceChoice} onClick={() => { setQuoteResult(null); setConfigType('office'); setStep(1); }}>
                  <Briefcase size={24} /><strong>Office shifting</strong><span>Workstations, equipment, and records</span><ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Locations and access details */}
          {step === 1 && (
            <div className={`card ${styles.stepCard} animate-in`}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B45309', letterSpacing: '0.8px' }}>
                  STEP 2 · LOCATIONS
                </span>
              </div>
              <h2 className={styles.stepTitle}>Where are you moving?</h2>
              <p className={styles.stepSubtitle}>
                Select your pickup & drop points using our interactive map.
              </p>

              {/* Interactive Banner to open full Map Pinning */}
              <button
                type="button"
                className={styles.mapHeroBanner}
                onClick={() => setMapModalType('pickup')}
              >
                <div className={styles.mapHeroIconBox}>
                  <Compass size={22} strokeWidth={2.4} />
                </div>
                <div className={styles.mapHeroTextCol}>
                  <span className={styles.mapHeroTitle}>Select on Map</span>
                  <span className={styles.mapHeroSub}>
                    Drag the map to pin the exact location
                  </span>
                </div>
                <ArrowRight size={18} className={styles.mapHeroArrow} strokeWidth={2.6} />
              </button>

              {/* Connected Route Visual Card */}
              <div className={styles.connectedRouteCard}>
                {/* Pickup Row */}
                <div className={styles.locationRow}>
                  <div className={styles.routeIndicatorCol}>
                    <div className={styles.pickupDot} />
                    <div className={styles.routeVerticalLine} />
                  </div>
                  <div className={styles.locationInputBlock} ref={pickupWrapRef}>
                    <div className={styles.inputLabelRow}>
                      <span className={styles.inputMicroLabel}>PICKUP LOCATION</span>
                      <div className={styles.labelActions}>
                        <button
                          type="button"
                          className={styles.shortcutGpsBtn}
                          onClick={handleUseGps}
                        >
                          <Crosshair size={11} strokeWidth={2.4} />
                          <span>Use GPS</span>
                        </button>
                        <button
                          type="button"
                          className={styles.pinActionBtn}
                          onClick={() => setMapModalType('pickup')}
                        >
                          <MapPin size={12} strokeWidth={2.4} />
                          <span>Pin on Map</span>
                        </button>
                      </div>
                    </div>
                    <div className={styles.inputContainerRelative}>
                      <input
                        className="input-field"
                        placeholder="Society name, street, or landmark"
                        value={pickup}
                        onChange={e => handlePickupChange(e.target.value)}
                        onFocus={() => { if (pickupSuggestions.length > 0) setShowPickupSuggestions(true); }}
                        autoComplete="off"
                      />
                      {pickupLoading && <span className={styles.inputSpinner} />}
                      {/* Autocomplete Suggestions Dropdown */}
                      {showPickupSuggestions && pickupSuggestions.length > 0 && (
                        <div className={styles.inlineSuggestionsBox}>
                          {pickupSuggestions.map(item => (
                            <button
                              key={item.placeId}
                              type="button"
                              className={styles.inlineSuggestionItem}
                              onClick={() => selectPickupSuggestion(item)}
                            >
                              <MapPin size={14} className={styles.sugPinPickup} />
                              <div className={styles.sugTextCol}>
                                <span className={styles.sugMainText}>{item.mainText}</span>
                                <span className={styles.sugSubText}>{item.secondaryText}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Drop Destination Row */}
                <div className={styles.locationRow}>
                  <div className={styles.routeIndicatorCol}>
                    <div className={styles.dropSquare} />
                  </div>
                  <div className={styles.locationInputBlock} ref={dropWrapRef}>
                    <div className={styles.inputLabelRow}>
                      <span className={styles.inputMicroLabel}>DROP DESTINATION</span>
                      <div className={styles.labelActions}>
                        <button
                          type="button"
                          className={`${styles.pinActionBtn} ${styles.pinActionBtnNavy}`}
                          onClick={() => setMapModalType('drop')}
                        >
                          <Flag size={12} strokeWidth={2.4} />
                          <span>Pin on Map</span>
                        </button>
                      </div>
                    </div>
                    <div className={styles.inputContainerRelative}>
                      <input
                        className="input-field"
                        placeholder="Delivery destination building or area"
                        value={drop}
                        onChange={e => handleDropChange(e.target.value)}
                        onFocus={() => { if (dropSuggestions.length > 0) setShowDropSuggestions(true); }}
                        autoComplete="off"
                      />
                      {dropLoading && <span className={styles.inputSpinner} />}
                      {/* Drop Suggestions Dropdown */}
                      {showDropSuggestions && dropSuggestions.length > 0 && (
                        <div className={styles.inlineSuggestionsBox}>
                          {dropSuggestions.map(item => (
                            <button
                              key={item.placeId}
                              type="button"
                              className={styles.inlineSuggestionItem}
                              onClick={() => selectDropSuggestion(item)}
                            >
                              <Flag size={14} className={styles.sugPinDrop} />
                              <div className={styles.sugTextCol}>
                                <span className={styles.sugMainText}>{item.mainText}</span>
                                <span className={styles.sugSubText}>{item.secondaryText}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Route Preview Card */}
              {currentRouteEstimate && (
                <WebRouteCard
                  pickupAddress={pickup}
                  dropAddress={drop}
                  distanceKm={currentRouteEstimate.distanceKm}
                  durationMins={currentRouteEstimate.durationMins}
                  onOpenMapPicker={() => setMapModalType('pickup')}
                />
              )}

              <button className="btn btn-primary btn-lg" style={{ marginTop: 'var(--space-6)', width: '100%' }} onClick={() => setStep(2)} disabled={!pickup || !drop}>
                Next: Select Items →
              </button>
            </div>
          )}

          {/* Step 2: Inventory */}
          {step === 2 && (
            <div className={`card ${styles.stepCard} animate-in`}>
              <h2 className={styles.stepTitle}>📦 What are you moving?</h2>
              <p className={styles.stepSubtitle}>Select quantities below. All home and office items are available, with {configType === 'office' ? 'office' : 'home'} goods shown first.</p>

              {[...ITEM_CATALOG].sort((a, b) => { const rank = (category: string) => { const value = category.toLowerCase(); const office = ['office', 'electronics', 'records', 'living room', 'bedroom', 'kitchen', 'others']; const home = ['living room', 'bedroom', 'kitchen', 'others', 'electronics', 'office', 'records']; const order = configType === 'office' ? office : home; const index = order.findIndex((name) => value.includes(name)); return index < 0 ? order.length : index; }; return rank(a.category) - rank(b.category); }).map(cat => (
                <div key={cat.category} className={styles.catSection}>
                  <h3 className={styles.catTitle}>{cat.category}</h3>
                  <div className={styles.itemGrid}>
                    {cat.items.map(item => (
                      <div key={item.name} className={`${styles.itemCard} ${(selectedItems[item.name] || 0) > 0 ? styles.itemSelected : ''}`}>
                        <div className={styles.itemInfo}>
                          <span className={styles.itemName}>{item.name}</span>
                          <span className={styles.itemRate}>Select quantity</span>
                        </div>
                        <div className={styles.itemControls}>
                          <button type="button" className={styles.qtyBtn} onClick={() => updateItem(item.name, -1)}>−</button>
                          <span className={styles.qtyVal}>{selectedItems[item.name] || 0}</span>
                          <button type="button" className={styles.qtyBtn} onClick={() => updateItem(item.name, 1)}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-5)', borderTop: '1px solid var(--gray-200)' }}>
                <h3 className={styles.catTitle}>Complete your addresses</h3>
                <p className={styles.stepSubtitle}>Add entry details and access information after choosing your items.</p>
              <div className={styles.formGrid} style={{ marginTop: 'var(--space-4)' }}>
                <div className="input-group">
                  <label>Pickup flat / house number *</label>
                  <input className="input-field" maxLength={100} value={pickupUnit} onChange={e => { setPickupUnit(e.target.value); setQuoteResult(null); }} placeholder="Flat, house, or unit number" />
                </div>
                <div className="input-group">
                  <label>Pickup landmark *</label>
                  <input className="input-field" maxLength={100} value={pickupLandmark} onChange={e => { setPickupLandmark(e.target.value); setQuoteResult(null); }} placeholder="Nearby landmark" />
                </div>
                <div className="input-group">
                  <label>Delivery flat / house number *</label>
                  <input className="input-field" maxLength={100} value={dropUnit} onChange={e => { setDropUnit(e.target.value); setQuoteResult(null); }} placeholder="Flat, house, or unit number" />
                </div>
                <div className="input-group">
                  <label>Delivery landmark *</label>
                  <input className="input-field" maxLength={100} value={dropLandmark} onChange={e => { setDropLandmark(e.target.value); setQuoteResult(null); }} placeholder="Nearby landmark" />
                </div>
                <div className={`input-group ${styles.fullWidthCol}`}>
                  <label>Alternative contact number (optional)</label>
                  <input className="input-field" type="tel" inputMode="numeric" maxLength={10} value={alternateContactPhone} onChange={e => { setAlternateContactPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setQuoteResult(null); }} placeholder="10-digit mobile number" />
                  {!alternatePhoneValid && <small style={{ color: '#dc2626' }}>Enter a valid 10-digit Indian mobile number.</small>}
                </div>
              </div>

              <div className={styles.formGrid} style={{ marginTop: 'var(--space-4)' }}>
                <div className={`input-group ${styles.fullWidthCol}`}>
                  <label>Building Access (Pickup)</label>
                  <div className={styles.toggleRow}>
                    <button
                      type="button"
                      className={`${styles.toggleBtn} ${accessType === 'ground' ? styles.toggleActive : ''}`}
                      onClick={() => {
                        setAccessType('ground');
                        setFloor(0);
                        setLiftAvailable(true);
                        setQuoteResult(null);
                      }}
                    >
                      Ground Floor
                    </button>
                    <button
                      type="button"
                      className={`${styles.toggleBtn} ${accessType === 'floor' ? styles.toggleActive : ''}`}
                      onClick={() => {
                        setAccessType('floor');
                        setFloor(prev => (prev > 0 ? prev : 1));
                        setQuoteResult(null);
                      }}
                    >
                      Floor
                    </button>
                  </div>
                </div>

                {accessType === 'floor' && (
                  <>
                    <div className="input-group">
                      <label>Floor Number</label>
                      <input
                        className="input-field"
                        type="number"
                        min="1"
                        max="80"
                        value={floor || 1}
                        onChange={e => {
                          setFloor(Math.max(1, Number(e.target.value)));
                          setQuoteResult(null);
                        }}
                      />
                    </div>
                    <div className={`input-group ${styles.fullWidthCol}`}>
                      <label>Lift Available?</label>
                      <div className={styles.toggleRow}>
                        <button
                          type="button"
                          className={`${styles.toggleBtn} ${liftAvailable ? styles.toggleActive : ''}`}
                          onClick={() => { setLiftAvailable(true); setQuoteResult(null); }}
                        >
                          Yes (Elevator Available)
                        </button>
                        <button
                          type="button"
                          className={`${styles.toggleBtn} ${!liftAvailable ? styles.toggleActive : ''}`}
                          onClick={() => { setLiftAvailable(false); setQuoteResult(null); }}
                        >
                          No (Staircase Only)
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <div className={`input-group ${styles.fullWidthCol}`}>
                  <label>Can the truck park close to the entrance?</label>
                  <div className={styles.toggleRow}>
                    <button
                      type="button"
                      className={`${styles.toggleBtn} ${parkingClose ? styles.toggleActive : ''}`}
                      onClick={() => { setParkingClose(true); setQuoteResult(null); }}
                    >
                      Yes, nearby
                    </button>
                    <button
                      type="button"
                      className={`${styles.toggleBtn} ${!parkingClose ? styles.toggleActive : ''}`}
                      onClick={() => { setParkingClose(false); setQuoteResult(null); }}
                    >
                      No, farther away
                    </button>
                  </div>
                </div>
              </div>
              </div>

              <div className={styles.stepActions}>
                <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
                <button type="button" className="btn btn-primary btn-lg" onClick={() => setStep(3)} disabled={totalItems === 0 || !pickupUnit.trim() || !pickupLandmark.trim() || !dropUnit.trim() || !dropLandmark.trim() || !alternatePhoneValid}>
                  Next: Schedule ({totalItems} items) →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Schedule, packing, and optional work */}
          {step === 3 && (
            <div className={`card ${styles.stepCard} animate-in`}>
              <h2 className={styles.stepTitle}>STEP 4 · Schedule your move</h2>
              <p className={styles.stepSubtitle}>Choose a date, packing type, and any technical work you need.</p>

              <div className={styles.formGrid}>
                <div className="input-group">
                  <label>Move date *</label>
                  <input className="input-field" type="date" min={minDateStr} value={scheduledDate} onChange={e => { setScheduledDate(e.target.value); setQuoteResult(null); }} />
                </div>
                <div className="input-group">
                  <label>Arrival window</label>
                  <select className="input-field" value={scheduledSlot} onChange={e => { setScheduledSlot(e.target.value); setQuoteResult(null); }}>
                    <option value="morning">Morning (7 AM – 12 PM)</option>
                    <option value="afternoon">Afternoon (12 PM – 5 PM)</option>
                    <option value="evening">Evening (5 PM – 8 PM)</option>
                  </select>
                </div>
              </div>

              <h3 className={styles.catTitle} style={{ marginTop: 'var(--space-5)' }}>Packing type</h3>

              <div className={styles.tierGrid}>
                {PACKING_TIERS.map(tier => (
                  <div
                    key={tier.value}
                    className={`${styles.tierCard} ${packingTier === tier.value ? styles.tierSelected : ''}`}
                    onClick={() => { setPackingTier(tier.value); setQuoteResult(null); }}
                  >
                    <div className={styles.tierHeader}>
                      <span className={styles.tierName}>{tier.label}</span>
                      <span className={styles.tierBadge}>{tier.note}</span>
                    </div>
                    <p className={styles.tierDesc}>{tier.desc}</p>
                    <span className={styles.tierSelectText}>
                      {packingTier === tier.value ? '✓ Selected' : 'Click to select'}
                    </span>
                  </div>
                ))}
              </div>

              <h3 className={styles.catTitle} style={{ marginTop: 'var(--space-5)' }}>Technical work (optional)</h3>
              <p className={styles.stepSubtitle}>Additional charges apply when you request installation or dismantling.</p>
              <div className={styles.technicalChoices}>
                {[
                  ['electrician', 'Electronics installation / uninstallation', 'Extra charge'],
                  ['carpenter', 'Bed or furniture dismantling / assembly', 'Extra charge'],
                ].map(([addon, label, price]) => {
                  const selected = technicalWork.includes(addon);
                  return <button type="button" key={addon} className={`${styles.technicalChoice} ${selected ? styles.technicalChoiceActive : ''}`} onClick={() => { setQuoteResult(null); setTechnicalWork(current => selected ? current.filter(item => item !== addon) : [...current, addon]); }}>
                    <span className={`${styles.checkboxMark} ${selected ? styles.checkboxMarkActive : ''}`}>{selected ? '✓' : ''}</span>
                    <span>{label}</span><strong>{price}</strong>
                  </button>;
                })}
              </div>

              <div className={styles.couponNotice}><Tag size={17} /><span><strong>Coupon</strong><small>No coupons available yet</small></span><em>COMING SOON</em></div>

              <div className={styles.stepActions}>
                <button type="button" className="btn btn-outline" onClick={() => setStep(2)}>← Back</button>
                <button type="button" className="btn btn-primary btn-lg" onClick={calculateQuote} disabled={loading || !scheduledDate}>
                  {loading ? 'Calculating Quote…' : quoteResult ? 'Recalculate price' : 'Calculate price →'}
                </button>
              </div>
            </div>
          )}

          {/* Price appears on the schedule page after calculation. */}
          {step === 3 && quoteResult && (
            <div className={`card ${styles.stepCard} animate-in`}>
              <h2 className={styles.stepTitle}>🎉 Your price</h2>
              <p className={styles.stepSubtitle}>Locked upfront — no hidden charges, guaranteed</p>

              <div className={styles.quoteSummary}>
                <div className={styles.totalBlock}>
                  <span className={styles.totalLabel}>Total Estimated Cost</span>
                  <span className={styles.totalAmount}>₹{quoteResult.quoteAmount.toLocaleString('en-IN')}</span>
                  <span className={styles.totalNote}>Includes GST, toll charges, and basic insurance</span>
                </div>

                <div className={styles.breakdownTable}>
                  <h3 className={styles.breakdownTitle}>Cost Breakdown</h3>
                  <div className={styles.breakdownRow}>
                    <span>Selected goods</span>
                    <span>₹{quoteResult.breakdown.goodsSubtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className={styles.breakdownRow}>
                    <span>Zone &amp; Distance Charge</span>
                    <span>₹{quoteResult.breakdown.zoneCharge.toLocaleString('en-IN')}</span>
                  </div>
                  <div className={styles.breakdownRow}>
                    <span>Labour Charge (loading/unloading)</span>
                    <span>₹{quoteResult.breakdown.labourCharge.toLocaleString('en-IN')}</span>
                  </div>
                  {quoteResult.breakdown.surcharges > 0 && (
                    <div className={styles.breakdownRow}>
                      <span>Floor / Staircase Surcharge</span>
                      <span>₹{quoteResult.breakdown.surcharges.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {quoteResult.breakdown.addonsTotal > 0 && (
                    <div className={styles.breakdownRow}>
                      <span>Add-ons</span>
                      <span>₹{quoteResult.breakdown.addonsTotal.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>

                {/* Payment Option Selection */}
                <div style={{ marginTop: '1.5rem', marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>💳 Payment Option</span>
                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 999, background: 'rgba(16,185,129,0.15)', color: '#34D399', border: '1px solid rgba(16,185,129,0.3)', fontWeight: 600 }}>Zero Advance</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
                    {/* Cash on Delivery / Pay on Move Day Card */}
                    <div
                      style={{
                        padding: '1rem 1.15rem',
                        borderRadius: 14,
                        border: '2px solid #F7A300',
                        background: 'rgba(247,163,0,0.08)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, color: '#F7A300', fontSize: '0.95rem' }}>💵 Cash on Delivery</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981' }}>✓ Selected</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>
                        ₹0 upfront. Pay 100% on shifting day via Cash or UPI to your driver captain.
                      </p>
                      <span style={{ fontSize: '0.72rem', color: '#CBD5E1', fontWeight: 600 }}>
                        🛡️ 100% Risk-Free Guarantee
                      </span>
                    </div>

                    {/* Online Payment Card (Disabled/Coming Soon) */}
                    <div
                      style={{
                        padding: '1rem 1.15rem',
                        borderRadius: 14,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.02)',
                        opacity: 0.65,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, color: '#94A3B8', fontSize: '0.95rem' }}>💳 Online Payment</span>
                        <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.08)', color: '#94A3B8' }}>Coming Soon</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>
                        Cards &amp; Netbanking gateway will be enabled soon. Currently accepting Cash on Delivery.
                      </p>
                    </div>
                  </div>
                </div>

                <div className={styles.advanceBox}>
                  <div className={styles.advanceInfo}>
                    <span className={styles.advanceLabel}>Advance Required Today</span>
                    <span className={styles.advanceAmount} style={{ color: '#10B981' }}>₹0</span>
                    <span className={styles.advanceNote}>
                      Full amount of ₹{quoteResult.quoteAmount.toLocaleString('en-IN')} payable on shifting day via Cash or UPI
                    </span>
                  </div>
                </div>

                {isLoggedIn ? (
                  <div style={{ padding: '0.65rem 1rem', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, fontSize: '0.85rem', color: '#065F46', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', flexShrink: 0 }} />
                    <span>Confirming booking with account: <strong>{user?.name || user?.phone || user?.email || 'Logged In Customer'}</strong></span>
                  </div>
                ) : (
                  <div style={{ padding: '0.65rem 1rem', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, fontSize: '0.85rem', color: '#92400E', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <span>ℹ️ You will be directed to quick OTP login to confirm your move.</span>
                  </div>
                )}

                <div className={styles.stepActions}>
                  <button type="button" className="btn btn-primary btn-lg" onClick={createBooking} disabled={bookingCreating}>
                    {bookingCreating ? 'Preparing payment…' : 'Continue to payment →'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Interactive Map Modal */}
      {mapModalType !== null && (
        <WebMapModal
          isOpen={mapModalType !== null}
          type={mapModalType}
          initialAddress={mapModalType === 'pickup' ? pickup : drop}
          onClose={() => setMapModalType(null)}
          onSelectLocation={handleLocationSelected}
        />
      )}

      <Footer />
    </>
  );
}
