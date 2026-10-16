'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, MapPin, Flag, ArrowRight, Crosshair, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WebMapModal from '../components/WebMapModal';
import WebRouteCard from '../components/WebRouteCard';
import { quotes, bookings, token, ApiError } from '../lib/api';
import styles from './page.module.css';

const ITEM_CATALOG = [
  { category: 'Living Room', items: [
    { name: 'Sofa (3 Seater)', cft: 25 },
    { name: 'Sofa (2 Seater)', cft: 18 },
    { name: 'Center Table', cft: 8 },
    { name: 'TV Unit', cft: 15 },
    { name: 'Bookshelf', cft: 12 },
    { name: 'Shoe Rack', cft: 6 },
  ]},
  { category: 'Bedroom', items: [
    { name: 'Double Bed (with mattress)', cft: 40 },
    { name: 'Single Bed (with mattress)', cft: 25 },
    { name: 'Wardrobe (Large)', cft: 35 },
    { name: 'Wardrobe (Small)', cft: 20 },
    { name: 'Dressing Table', cft: 12 },
    { name: 'Side Table', cft: 4 },
  ]},
  { category: 'Kitchen', items: [
    { name: 'Refrigerator', cft: 20 },
    { name: 'Washing Machine', cft: 15 },
    { name: 'Microwave Oven', cft: 3 },
    { name: 'Kitchen Boxes (per box)', cft: 3 },
    { name: 'Gas Cylinder', cft: 4 },
    { name: 'Water Purifier', cft: 3 },
  ]},
  { category: 'Others', items: [
    { name: 'Dining Table (4 Seater)', cft: 20 },
    { name: 'AC (Split)', cft: 10 },
    { name: 'AC (Window)', cft: 8 },
    { name: 'Bicycle', cft: 12 },
    { name: 'Carton Box (Large)', cft: 5 },
    { name: 'Carton Box (Small)', cft: 3 },
  ]},
];

const PACKING_TIERS = [
  { value: 'lite' as const, label: 'Lite', desc: 'Newspaper + bubble wrap for fragiles', note: '0.8× base rate' },
  { value: 'standard' as const, label: 'Standard', desc: 'Corrugated sheets + foam padding', note: '1× base rate' },
  { value: 'premium' as const, label: 'Premium', desc: 'Wooden crating for all items', note: '1.35× base rate' },
];

const CONFIG_TYPES = ['1bhk', '2bhk', '3bhk', '4bhk', 'villa', 'office', 'studio'] as const;

type SelectedItems = Record<string, number>;
type PackingTier = 'lite' | 'standard' | 'premium';

export default function QuotePage() {
  const router = useRouter();

  // Form state
  const [step, setStep] = useState(1);
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [floor, setFloor] = useState(0);
  const [liftAvailable, setLiftAvailable] = useState(true);
  const [configType, setConfigType] = useState<string>('1bhk');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledSlot, setScheduledSlot] = useState('morning');
  const [selectedItems, setSelectedItems] = useState<SelectedItems>({});
  const [packingTier, setPackingTier] = useState<PackingTier>('standard');

  // Map modal & route estimate state
  const [mapModalType, setMapModalType] = useState<'pickup' | 'drop' | null>(null);
  const [routeEstimate, setRouteEstimate] = useState<{ distanceKm: number; durationMins: number } | null>(null);

  // API state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quoteResult, setQuoteResult] = useState<Awaited<ReturnType<typeof quotes.itemized>> | null>(null);
  const [, setBookingId] = useState<string | null>(null);
  const [bookingCreating, setBookingCreating] = useState(false);

  // Automatically calculate route distance & time when pickup & drop are set
  useEffect(() => {
    if (pickup.trim().length > 3 && drop.trim().length > 3) {
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/v1/maps/distance?origin=${encodeURIComponent(pickup)}&destination=${encodeURIComponent(drop)}`);
          if (res.ok) {
            const data = await res.json();
            setRouteEstimate(data);
          } else {
            setRouteEstimate({ distanceKm: 14.5, durationMins: 38 });
          }
        } catch {
          setRouteEstimate({ distanceKm: 14.5, durationMins: 38 });
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setRouteEstimate(null);
    }
  }, [pickup, drop]);

  const handleLocationSelected = (loc: { address: string; lat: number; lng: number; city: string; type: 'pickup' | 'drop' }) => {
    if (loc.type === 'pickup') {
      setPickup(loc.address);
    } else {
      setDrop(loc.address);
    }
    setMapModalType(null);
  };

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
        pickupAddress: pickup,
        dropAddress: drop,
        configurationType: configType,
        floorNumber: floor,
        liftAvailable,
        scheduledDate,
        scheduledSlot,
        items: buildItemsPayload(),
        addons: [],
      });
      setQuoteResult(result);
      setStep(4);
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
        pickupAddress: pickup,
        dropAddress: drop,
        configurationType: configType,
        floorNumber: floor,
        liftAvailable,
        scheduledDate,
        scheduledSlot,
        items: buildItemsPayload(),
        addons: [],
      });
      setBookingId(res.booking.id);
      router.push(`/booking/${res.booking.id}`);
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
            {['Location', 'Inventory', 'Packing', 'Quote'].map((label, i) => (
              <div key={label} className={`${styles.progressStep} ${step > i ? styles.done : ''} ${step === i + 1 ? styles.current : ''}`}>
                <span className={styles.progressDot}>{step > i + 1 ? '✓' : i + 1}</span>
                <span className={styles.progressLabel}>{label}</span>
              </div>
            ))}
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${((step - 1) / 3) * 100}%` }} />
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Step 1: Location + Date */}
          {step === 1 && (
            <div className={`card ${styles.stepCard} animate-in`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Sparkles size={14} color="#D98C00" />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B45309', letterSpacing: '0.8px' }}>
                  STEP 1 · RELOCATION ROUTE
                </span>
              </div>
              <h2 className={styles.stepTitle}>Where &amp; When are you moving?</h2>
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
                  <div className={styles.locationInputBlock}>
                    <div className={styles.inputLabelRow}>
                      <span className={styles.inputMicroLabel}>PICKUP LOCATION</span>
                      <button
                        type="button"
                        className={styles.shortcutGpsBtn}
                        onClick={() => {
                          if (typeof navigator !== 'undefined' && navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                              async pos => {
                                const lat = pos.coords.latitude;
                                const lng = pos.coords.longitude;
                                try {
                                  const res = await fetch(`/api/v1/maps/reverse?lat=${lat}&lng=${lng}`);
                                  if (res.ok) {
                                    const data = await res.json();
                                    setPickup(data.address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
                                  } else {
                                    setPickup(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
                                  }
                                } catch {
                                  setPickup(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
                                }
                              },
                              () => setPickup('Viman Nagar, Pune, Maharashtra')
                            );
                          } else {
                            setPickup('Viman Nagar, Pune, Maharashtra');
                          }
                        }}
                      >
                        <Crosshair size={11} strokeWidth={2.4} />
                        <span>Use GPS</span>
                      </button>
                    </div>
                    <input
                      className="input-field"
                      placeholder="Society name, street, or landmark"
                      value={pickup}
                      onChange={e => setPickup(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className={styles.pinActionBtn}
                    onClick={() => setMapModalType('pickup')}
                  >
                    <MapPin size={13} strokeWidth={2.4} />
                    <span>Pin Map</span>
                  </button>
                </div>

                {/* Drop Destination Row */}
                <div className={styles.locationRow}>
                  <div className={styles.routeIndicatorCol}>
                    <div className={styles.dropSquare} />
                  </div>
                  <div className={styles.locationInputBlock}>
                    <div className={styles.inputLabelRow}>
                      <span className={styles.inputMicroLabel}>DROP DESTINATION</span>
                    </div>
                    <input
                      className="input-field"
                      placeholder="Delivery destination building or area"
                      value={drop}
                      onChange={e => setDrop(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className={`${styles.pinActionBtn} ${styles.pinActionBtnNavy}`}
                    onClick={() => setMapModalType('drop')}
                  >
                    <Flag size={13} strokeWidth={2.4} />
                    <span>Pin Map</span>
                  </button>
                </div>

                {/* Quick Area Shortcuts */}
                <div className={styles.quickShortcutsRow}>
                  <span style={{ fontSize: '11px', color: 'var(--gray-400)', alignSelf: 'center' }}>Popular:</span>
                  {['Viman Nagar', 'Baner', 'Hinjewadi', 'Powai', 'Bandra', 'Thane West'].map(area => (
                    <button
                      key={area}
                      type="button"
                      className={styles.shortcutAreaBtn}
                      onClick={() => setDrop(`${area}, Maharashtra`)}
                    >
                      +{area}
                    </button>
                  ))}
                </div>
              </div>

              {/* Route Preview Card */}
              {routeEstimate && (
                <WebRouteCard
                  pickupAddress={pickup}
                  dropAddress={drop}
                  distanceKm={routeEstimate.distanceKm}
                  durationMins={routeEstimate.durationMins}
                  onOpenMapPicker={() => setMapModalType('pickup')}
                />
              )}

              <div className={styles.formGrid} style={{ marginTop: 'var(--space-4)' }}>
                <div className="input-group">
                  <label>Home Configuration</label>
                  <select className="input-field" value={configType} onChange={e => setConfigType(e.target.value)}>
                    {CONFIG_TYPES.map(c => (
                      <option key={c} value={c}>{c.toUpperCase().replace('BHK', ' BHK')}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label>Floor Number</label>
                  <input className="input-field" type="number" min="0" value={floor} onChange={e => setFloor(Number(e.target.value))} />
                </div>
                <div className="input-group">
                  <label>Preferred Move Date</label>
                  <input className="input-field" type="date" min={minDateStr} value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Preferred Time Slot</label>
                  <select className="input-field" value={scheduledSlot} onChange={e => setScheduledSlot(e.target.value)}>
                    <option value="morning">Morning (7 AM – 12 PM)</option>
                    <option value="afternoon">Afternoon (12 PM – 5 PM)</option>
                    <option value="evening">Evening (5 PM – 8 PM)</option>
                  </select>
                </div>
                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label>Lift Available?</label>
                  <div className={styles.toggleRow}>
                    <button type="button" className={`${styles.toggleBtn} ${liftAvailable ? styles.toggleActive : ''}`} onClick={() => setLiftAvailable(true)}>Yes (Elevator Available)</button>
                    <button type="button" className={`${styles.toggleBtn} ${!liftAvailable ? styles.toggleActive : ''}`} onClick={() => setLiftAvailable(false)}>No (Staircase Only)</button>
                  </div>
                </div>
              </div>
              <button className="btn btn-primary btn-lg" style={{ marginTop: 'var(--space-6)', width: '100%' }} onClick={() => setStep(2)} disabled={!pickup || !drop || !scheduledDate}>
                Next: Select Items →
              </button>
            </div>
          )}

          {/* Step 2: Inventory */}
          {step === 2 && (
            <div className={`card ${styles.stepCard} animate-in`}>
              <h2 className={styles.stepTitle}>📦 What are you moving?</h2>
              <p className={styles.stepSubtitle}>Select items and quantities from the catalog below</p>

              {ITEM_CATALOG.map(cat => (
                <div key={cat.category} className={styles.catSection}>
                  <h3 className={styles.catTitle}>{cat.category}</h3>
                  <div className={styles.itemGrid}>
                    {cat.items.map(item => (
                      <div key={item.name} className={`${styles.itemCard} ${(selectedItems[item.name] || 0) > 0 ? styles.itemSelected : ''}`}>
                        <div className={styles.itemInfo}>
                          <span className={styles.itemName}>{item.name}</span>
                          <span className={styles.itemRate}>{item.cft} CFT</span>
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

              <div className={styles.stepActions}>
                <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
                <button type="button" className="btn btn-primary btn-lg" onClick={() => setStep(3)} disabled={totalItems === 0}>
                  Next: Packing ({totalItems} items) →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Packing Tier */}
          {step === 3 && (
            <div className={`card ${styles.stepCard} animate-in`}>
              <h2 className={styles.stepTitle}>🛡️ Choose Packing Protection</h2>
              <p className={styles.stepSubtitle}>All tiers include loading, unloading, and transit insurance</p>

              <div className={styles.tierGrid}>
                {PACKING_TIERS.map(tier => (
                  <div
                    key={tier.value}
                    className={`${styles.tierCard} ${packingTier === tier.value ? styles.tierSelected : ''}`}
                    onClick={() => setPackingTier(tier.value)}
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

              <div className={styles.stepActions}>
                <button type="button" className="btn btn-outline" onClick={() => setStep(2)}>← Back</button>
                <button type="button" className="btn btn-primary btn-lg" onClick={calculateQuote} disabled={loading}>
                  {loading ? 'Calculating Quote…' : 'Calculate My Quote →'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Quote Breakdown */}
          {step === 4 && quoteResult && (
            <div className={`card ${styles.stepCard} animate-in`}>
              <h2 className={styles.stepTitle}>🎉 Your Itemised Quote</h2>
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
                    <span>Goods Base Rate ({quoteResult.metrics.totalCft} CFT, {quoteResult.metrics.totalWeightKg} kg)</span>
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

                <div className={styles.advanceBox}>
                  <div className={styles.advanceInfo}>
                    <span className={styles.advanceLabel}>Advance Required to Book</span>
                    <span className={styles.advanceAmount}>₹{Math.round(quoteResult.quoteAmount * 0.2).toLocaleString('en-IN')}</span>
                    <span className={styles.advanceNote}>20% advance · Pay balance 80% on delivery</span>
                  </div>
                </div>

                <div className={styles.stepActions}>
                  <button type="button" className="btn btn-outline" onClick={() => setStep(3)}>← Edit Options</button>
                  <button type="button" className="btn btn-primary btn-lg" onClick={createBooking} disabled={bookingCreating}>
                    {bookingCreating ? 'Creating Booking…' : 'Book Now & Pay Advance →'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Interactive Map Modal */}
      <WebMapModal
        isOpen={mapModalType !== null}
        type={mapModalType || 'pickup'}
        initialAddress={mapModalType === 'pickup' ? pickup : drop}
        onClose={() => setMapModalType(null)}
        onSelectLocation={handleLocationSelected}
      />

      <Footer />
    </>
  );
}
