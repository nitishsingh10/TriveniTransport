'use client';

import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from './page.module.css';

const ITEM_CATALOG = [
  { category: 'Living Room', items: [
    { name: 'Sofa (3 Seater)', cft: 25, rate: 800 },
    { name: 'Sofa (2 Seater)', cft: 18, rate: 600 },
    { name: 'Center Table', cft: 8, rate: 300 },
    { name: 'TV Unit', cft: 15, rate: 500 },
    { name: 'Bookshelf', cft: 12, rate: 400 },
    { name: 'Shoe Rack', cft: 6, rate: 200 },
  ]},
  { category: 'Bedroom', items: [
    { name: 'Double Bed (with mattress)', cft: 40, rate: 1200 },
    { name: 'Single Bed (with mattress)', cft: 25, rate: 800 },
    { name: 'Wardrobe (Large)', cft: 35, rate: 1500 },
    { name: 'Wardrobe (Small)', cft: 20, rate: 900 },
    { name: 'Dressing Table', cft: 12, rate: 500 },
    { name: 'Side Table', cft: 4, rate: 150 },
  ]},
  { category: 'Kitchen', items: [
    { name: 'Refrigerator', cft: 20, rate: 700 },
    { name: 'Washing Machine', cft: 15, rate: 600 },
    { name: 'Microwave Oven', cft: 3, rate: 200 },
    { name: 'Kitchen Boxes (per box)', cft: 3, rate: 100 },
    { name: 'Gas Cylinder', cft: 4, rate: 150 },
    { name: 'Water Purifier', cft: 3, rate: 200 },
  ]},
  { category: 'Others', items: [
    { name: 'Dining Table (4 Seater)', cft: 20, rate: 700 },
    { name: 'AC (Split)', cft: 10, rate: 800 },
    { name: 'AC (Window)', cft: 8, rate: 600 },
    { name: 'Bicycle', cft: 12, rate: 400 },
    { name: 'Carton Box (Large)', cft: 5, rate: 150 },
    { name: 'Carton Box (Small)', cft: 3, rate: 100 },
  ]},
];

const PACKING_TIERS = [
  { value: 'basic', label: 'Basic', desc: 'Newspaper + bubble wrap for fragiles', multiplier: 1.0 },
  { value: 'standard', label: 'Standard', desc: 'Corrugated sheets + foam padding', multiplier: 1.3 },
  { value: 'premium', label: 'Premium', desc: 'Wooden crating for all items', multiplier: 1.6 },
];

type SelectedItems = Record<string, number>;

export default function QuotePage() {
  const [step, setStep] = useState(1);
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [floor, setFloor] = useState(0);
  const [liftAvailable, setLiftAvailable] = useState(true);
  const [selectedItems, setSelectedItems] = useState<SelectedItems>({});
  const [packingTier, setPackingTier] = useState('standard');
  const [quote, setQuote] = useState<any>(null);

  const updateItem = (name: string, delta: number) => {
    setSelectedItems(prev => {
      const current = prev[name] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      }
      return { ...prev, [name]: next };
    });
  };

  const totalItems = Object.values(selectedItems).reduce((a, b) => a + b, 0);

  const calculateQuote = () => {
    const tier = PACKING_TIERS.find(t => t.value === packingTier)!;
    let totalCft = 0;
    let itemsTotal = 0;

    const lineItems: any[] = [];
    for (const cat of ITEM_CATALOG) {
      for (const item of cat.items) {
        const qty = selectedItems[item.name] || 0;
        if (qty > 0) {
          const lineTotal = item.rate * tier.multiplier * qty;
          totalCft += item.cft * qty;
          itemsTotal += lineTotal;
          lineItems.push({
            name: item.name,
            qty,
            rate: item.rate,
            tierMultiplier: tier.multiplier,
            lineTotal: Math.round(lineTotal),
          });
        }
      }
    }

    // Floor surcharge
    const floorCharge = !liftAvailable && floor > 0 ? floor * 200 : 0;
    
    // Labour (1 labourer per 150 CFT, min 2)
    const labourCount = Math.max(2, Math.ceil(totalCft / 150));
    const labourCharge = labourCount * 500;

    const subtotal = itemsTotal + floorCharge + labourCharge;
    const gst = Math.round(subtotal * 0.18);
    const total = subtotal + gst;

    setQuote({
      lineItems,
      totalCft,
      itemsTotal: Math.round(itemsTotal),
      floorCharge,
      labourCount,
      labourCharge,
      packingTier: tier.label,
      subtotal,
      gst,
      total,
      advance: Math.round(total * 0.2),
    });

    setStep(4);
  };

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

          {/* Step 1: Location */}
          {step === 1 && (
            <div className={`card ${styles.stepCard} animate-in`}>
              <h2 className={styles.stepTitle}>📍 Where are you moving?</h2>
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
                  <label>Floor Number</label>
                  <input className="input-field" type="number" min="0" value={floor} onChange={e => setFloor(Number(e.target.value))} />
                </div>
                <div className="input-group">
                  <label>Lift Available?</label>
                  <div className={styles.toggleRow}>
                    <button className={`${styles.toggleBtn} ${liftAvailable ? styles.toggleActive : ''}`} onClick={() => setLiftAvailable(true)}>Yes</button>
                    <button className={`${styles.toggleBtn} ${!liftAvailable ? styles.toggleActive : ''}`} onClick={() => setLiftAvailable(false)}>No</button>
                  </div>
                </div>
              </div>
              <button className="btn btn-primary btn-lg" style={{ marginTop: 'var(--space-6)', width: '100%' }} onClick={() => setStep(2)} disabled={!pickup || !drop}>
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
                          <span className={styles.itemRate}>₹{item.rate}</span>
                        </div>
                        <div className={styles.itemControls}>
                          <button className={styles.qtyBtn} onClick={() => updateItem(item.name, -1)}>−</button>
                          <span className={styles.qtyVal}>{selectedItems[item.name] || 0}</span>
                          <button className={styles.qtyBtn} onClick={() => updateItem(item.name, 1)}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className={styles.stepActions}>
                <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
                <button className="btn btn-primary btn-lg" onClick={() => setStep(3)} disabled={totalItems === 0}>
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
                  <button key={tier.value} className={`${styles.tierCard} ${packingTier === tier.value ? styles.tierActive : ''}`} onClick={() => setPackingTier(tier.value)}>
                    <span className={styles.tierLabel}>{tier.label}</span>
                    <span className={styles.tierDesc}>{tier.desc}</span>
                    <span className={styles.tierMulti}>{tier.multiplier}x base rate</span>
                  </button>
                ))}
              </div>
              <div className={styles.stepActions}>
                <button className="btn btn-outline" onClick={() => setStep(2)}>← Back</button>
                <button className="btn btn-accent btn-lg" onClick={calculateQuote}>
                  Calculate Quote →
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Quote Result */}
          {step === 4 && quote && (
            <div className={`${styles.stepCard} animate-in`}>
              <div className={styles.quoteHeader}>
                <h2 className={styles.stepTitle}>💰 Your Detailed Quote</h2>
                <span className="badge badge-success">Ready to Book</span>
              </div>

              <div className={styles.quoteTable}>
                <div className={styles.quoteRow + ' ' + styles.quoteHeaderRow}>
                  <span>Item</span>
                  <span>Qty</span>
                  <span>Rate</span>
                  <span>Total</span>
                </div>
                {quote.lineItems.map((li: any) => (
                  <div key={li.name} className={styles.quoteRow}>
                    <span>{li.name}</span>
                    <span>{li.qty}</span>
                    <span>₹{li.rate} × {li.tierMultiplier}</span>
                    <span className={styles.quoteAmount}>₹{li.lineTotal.toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div className={styles.quoteDivider} />
                <div className={styles.quoteRow}>
                  <span>Packing Tier: {quote.packingTier}</span>
                  <span></span><span></span>
                  <span>Included</span>
                </div>
                {quote.floorCharge > 0 && (
                  <div className={styles.quoteRow}>
                    <span>Floor Surcharge (Floor {floor}, No Lift)</span>
                    <span></span><span></span>
                    <span className={styles.quoteAmount}>₹{quote.floorCharge.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className={styles.quoteRow}>
                  <span>Labour ({quote.labourCount} workers)</span>
                  <span></span><span></span>
                  <span className={styles.quoteAmount}>₹{quote.labourCharge.toLocaleString('en-IN')}</span>
                </div>
                <div className={styles.quoteDivider} />
                <div className={styles.quoteRow + ' ' + styles.quoteTotalRow}>
                  <span>Subtotal</span><span></span><span></span>
                  <span>₹{quote.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className={styles.quoteRow}>
                  <span>GST (18%)</span><span></span><span></span>
                  <span>₹{quote.gst.toLocaleString('en-IN')}</span>
                </div>
                <div className={styles.quoteRow + ' ' + styles.quoteGrandTotal}>
                  <span>Total</span><span></span><span></span>
                  <span>₹{quote.total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className={styles.quoteFooter}>
                <div className={styles.advanceBox}>
                  <span className={styles.advanceLabel}>Advance to Book (20%)</span>
                  <span className={styles.advanceAmount}>₹{quote.advance.toLocaleString('en-IN')}</span>
                </div>
                <div className={styles.stepActions}>
                  <button className="btn btn-outline" onClick={() => setStep(3)}>← Modify</button>
                  <button className="btn btn-accent btn-lg">
                    Pay Advance & Book →
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
