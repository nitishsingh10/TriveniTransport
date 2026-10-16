'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
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

  // API state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quoteResult, setQuoteResult] = useState<Awaited<ReturnType<typeof quotes.itemized>> | null>(null);
  const [, setBookingId] = useState<string | null>(null);
  const [bookingCreating, setBookingCreating] = useState(false);

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
              <h2 className={styles.stepTitle}>📍 Where &amp; When are you moving?</h2>
              <div className={styles.formGrid}>
                <div className="input-group">
                  <label>Pickup Address</label>
                  <input className="input-field" placeholder="Full address with area/locality" value={pickup} onChange={e => setPickup(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Drop Address</label>
                  <input className="input-field" placeholder="Full address with area/locality" value={drop} onChange={e => setDrop(e.target.value)} />
                </div>
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
                <div className="input-group">
                  <label>Lift Available?</label>
                  <div className={styles.toggleRow}>
                    <button type="button" className={`${styles.toggleBtn} ${liftAvailable ? styles.toggleActive : ''}`} onClick={() => setLiftAvailable(true)}>Yes</button>
                    <button type="button" className={`${styles.toggleBtn} ${!liftAvailable ? styles.toggleActive : ''}`} onClick={() => setLiftAvailable(false)}>No</button>
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

          {/* Step 3: Packing */}
          {step === 3 && (
            <div className={`card ${styles.stepCard} animate-in`}>
              <h2 className={styles.stepTitle}>🎁 Choose Packing Tier</h2>
              <div className={styles.tierGrid}>
                {PACKING_TIERS.map(tier => (
                  <button type="button" key={tier.value} className={`${styles.tierCard} ${packingTier === tier.value ? styles.tierActive : ''}`} onClick={() => setPackingTier(tier.value)}>
                    <span className={styles.tierLabel}>{tier.label}</span>
                    <span className={styles.tierDesc}>{tier.desc}</span>
                    <span className={styles.tierMulti}>{tier.note}</span>
                  </button>
                ))}
              </div>
              <div className={styles.stepActions}>
                <button type="button" className="btn btn-outline" onClick={() => setStep(2)}>← Back</button>
                <button type="button" className="btn btn-accent btn-lg" onClick={calculateQuote} disabled={loading}>
                  {loading ? 'Calculating…' : 'Calculate Quote →'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Quote Result */}
          {step === 4 && quoteResult && (
            <div className={`${styles.stepCard} animate-in`}>
              <div className={styles.quoteHeader}>
                <h2 className={styles.stepTitle}>💰 Your Detailed Quote</h2>
                <span className="badge badge-success">Ready to Book</span>
              </div>

              <div className={styles.quoteTable}>
                <div className={styles.quoteRow + ' ' + styles.quoteHeaderRow}>
                  <span>Component</span>
                  <span style={{ textAlign: 'right' }}>Amount</span>
                </div>

                <div className={styles.quoteRow}>
                  <span>Goods handling</span>
                  <span className={styles.quoteAmount}>₹{quoteResult.breakdown.goodsSubtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className={styles.quoteRow}>
                  <span>Zone / Transport</span>
                  <span className={styles.quoteAmount}>₹{quoteResult.breakdown.zoneCharge.toLocaleString('en-IN')}</span>
                </div>
                {quoteResult.breakdown.labourCharge > 0 && (
                  <div className={styles.quoteRow}>
                    <span>Labour</span>
                    <span className={styles.quoteAmount}>₹{quoteResult.breakdown.labourCharge.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {quoteResult.breakdown.surcharges > 0 && (
                  <div className={styles.quoteRow}>
                    <span>Surcharges (floor / monsoon)</span>
                    <span className={styles.quoteAmount}>₹{quoteResult.breakdown.surcharges.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {quoteResult.breakdown.addonsTotal > 0 && (
                  <div className={styles.quoteRow}>
                    <span>Add-ons</span>
                    <span className={styles.quoteAmount}>₹{quoteResult.breakdown.addonsTotal.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className={styles.quoteDivider} />

                <div className={styles.quoteRow + ' ' + styles.quoteGrandTotal}>
                  <span>Total (incl. all charges)</span>
                  <span>₹{quoteResult.quoteAmount.toLocaleString('en-IN')}</span>
                </div>

                <div className={styles.quoteRow} style={{ opacity: 0.7 }}>
                  <span>Volume: {quoteResult.metrics.totalCft} CFT &nbsp;|&nbsp; Weight: {quoteResult.metrics.totalWeightKg} kg</span>
                  <span></span>
                </div>
              </div>

              <div className={styles.quoteFooter}>
                <div className={styles.advanceBox}>
                  <span className={styles.advanceLabel}>Advance to Book (20%)</span>
                  <span className={styles.advanceAmount}>₹{Math.round(quoteResult.quoteAmount * 0.2).toLocaleString('en-IN')}</span>
                </div>
                <div className={styles.stepActions}>
                  <button type="button" className="btn btn-outline" onClick={() => setStep(3)}>← Modify</button>
                  <button
                    type="button"
                    className="btn btn-accent btn-lg"
                    onClick={createBooking}
                    disabled={bookingCreating}
                  >
                    {bookingCreating ? 'Creating Booking…' : 'Confirm & Book →'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
