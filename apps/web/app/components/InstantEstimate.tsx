'use client';

import { useState } from 'react';
import { Home, Building2, Briefcase, LandPlot, MapPin, Flag, Crosshair, Map } from 'lucide-react';
import styles from './InstantEstimate.module.css';
import WebMapModal from './WebMapModal';

const CONFIG_TYPES = [
  { value: '1bhk', label: '1 BHK', Icon: Home },
  { value: '2bhk', label: '2 BHK', Icon: LandPlot },
  { value: '3bhk', label: '3 BHK', Icon: Building2 },
  { value: 'office', label: 'Office', Icon: Briefcase },
];

export default function InstantEstimate() {
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [config, setConfig] = useState('');
  const [estimate, setEstimate] = useState<{ min: number; max: number } | null>(null);
  const [loading, setLoading] = useState(false);

  // Map modal state
  const [mapModalType, setMapModalType] = useState<'pickup' | 'drop' | null>(null);

  const getEstimate = () => {
    if (!pickup || !drop || !config) return;
    setLoading(true);

    const baseRates: Record<string, number> = {
      '1bhk': 3000,
      '2bhk': 5000,
      '3bhk': 8000,
      'office': 12000,
    };
    const base = baseRates[config] || 5000;

    setTimeout(() => {
      setEstimate({
        min: Math.round(base * 0.9),
        max: Math.round(base * 1.3),
      });
      setLoading(false);
    }, 600);
  };

  const handleLocationSelected = (loc: {
    address: string;
    lat: number;
    lng: number;
    city: string;
    type: 'pickup' | 'drop';
  }) => {
    if (loc.type === 'pickup') setPickup(loc.address);
    else setDrop(loc.address);
    setMapModalType(null);
  };

  const handleGps = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async pos => {
          const { latitude: lat, longitude: lng } = pos.coords;
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
        () => setPickup('Viman Nagar, Pune, Maharashtra'),
        { timeout: 6000 },
      );
    } else {
      setPickup('Viman Nagar, Pune, Maharashtra');
    }
  };

  return (
    <>
      <div className={styles.widget}>
        <div className={styles.header}>
          <h2 className={styles.title}>Instant Estimate</h2>
          <p className={styles.subtitle}>
            Get a quick price range for your move — no commitment
          </p>
        </div>

        <div className={styles.form}>
          {/* Connected Route Card — same style as quote page */}
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
                    onClick={handleGps}
                    title="Use current GPS location"
                  >
                    <Crosshair size={10} strokeWidth={2.4} />
                    <span>GPS</span>
                  </button>
                </div>
                <input
                  id="ie-pickup"
                  className={styles.locationInput}
                  type="text"
                  placeholder="Society name, street or landmark"
                  value={pickup}
                  onChange={e => setPickup(e.target.value)}
                />
              </div>
              <button
                type="button"
                className={styles.pinActionBtn}
                onClick={() => setMapModalType('pickup')}
                title="Pin on map"
              >
                <MapPin size={12} strokeWidth={2.4} />
                <span>Pin</span>
              </button>
            </div>

            {/* Drop Row */}
            <div className={styles.locationRow}>
              <div className={styles.routeIndicatorCol}>
                <div className={styles.dropSquare} />
              </div>
              <div className={styles.locationInputBlock}>
                <div className={styles.inputLabelRow}>
                  <span className={styles.inputMicroLabel}>DROP DESTINATION</span>
                </div>
                <input
                  id="ie-drop"
                  className={styles.locationInput}
                  type="text"
                  placeholder="Delivery destination building or area"
                  value={drop}
                  onChange={e => setDrop(e.target.value)}
                />
              </div>
              <button
                type="button"
                className={`${styles.pinActionBtn} ${styles.pinActionBtnNavy}`}
                onClick={() => setMapModalType('drop')}
                title="Pin on map"
              >
                <Flag size={12} strokeWidth={2.4} />
                <span>Pin</span>
              </button>
            </div>
          </div>

          {/* Map Shortcut Banner */}
          <button
            type="button"
            className={styles.mapBanner}
            onClick={() => setMapModalType('pickup')}
          >
            <Map size={16} strokeWidth={2} className={styles.mapBannerIcon} />
            <span className={styles.mapBannerText}>Select pickup &amp; drop on map</span>
            <span className={styles.mapBannerArrow}>→</span>
          </button>

          <div>
            <p className={styles.label} style={{ marginBottom: 'var(--space-3)' }}>Property Type</p>
            <div className={styles.configGrid}>
              {CONFIG_TYPES.map((ct) => (
                <button
                  key={ct.value}
                  type="button"
                  className={`${styles.configBtn} ${config === ct.value ? styles.active : ''}`}
                  onClick={() => setConfig(ct.value)}
                >
                  <ct.Icon size={22} strokeWidth={1.75} className={styles.configIcon} />
                  <span className={styles.configLabel}>{ct.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className={styles.cta}
            onClick={getEstimate}
            disabled={!pickup || !drop || !config || loading}
          >
            {loading ? (
              <span className={styles.spinner} />
            ) : (
              'Get Estimate →'
            )}
          </button>
        </div>

        {estimate && (
          <div className={styles.result}>
            <span className={styles.resultLabel}>Estimated Range</span>
            <span className={styles.resultPrice}>
              ₹{estimate.min.toLocaleString('en-IN')} – ₹{estimate.max.toLocaleString('en-IN')}
            </span>
            <span className={styles.resultNote}>
              Final price calculated after itemised inventory review
            </span>
            <a href="/quote" className={styles.resultCta}>
              Get Detailed Quote →
            </a>
          </div>
        )}
      </div>

      {/* Interactive map modal */}
      <WebMapModal
        isOpen={mapModalType !== null}
        type={mapModalType || 'pickup'}
        initialAddress={mapModalType === 'pickup' ? pickup : drop}
        onClose={() => setMapModalType(null)}
        onSelectLocation={handleLocationSelected}
      />
    </>
  );
}
