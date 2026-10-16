import { Client } from '@googlemaps/google-maps-services-js';
import { getEnv } from '../../config/env';
import { getRedis } from '../../config/redis';

const mapsClient = new Client({});

export interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  lat: number;
  lng: number;
  city: string;
}

// Curated list of Indian metropolitan locations for instant, robust fallback & dev mode
const KNOWN_LOCATIONS: PlaceSuggestion[] = [
  // Pune & PCMC
  {
    placeId: 'pune_viman_nagar',
    description: 'Viman Nagar, Pune, Maharashtra, India',
    mainText: 'Viman Nagar',
    secondaryText: 'Pune, Maharashtra',
    lat: 18.5679,
    lng: 73.9143,
    city: 'Pune',
  },
  {
    placeId: 'pune_kothrud',
    description: 'Kothrud, Pune, Maharashtra, India',
    mainText: 'Kothrud',
    secondaryText: 'Pune, Maharashtra',
    lat: 18.5074,
    lng: 73.8077,
    city: 'Pune',
  },
  {
    placeId: 'pune_baner',
    description: 'Baner, Pune, Maharashtra, India',
    mainText: 'Baner',
    secondaryText: 'Pune, Maharashtra',
    lat: 18.559,
    lng: 73.7868,
    city: 'Pune',
  },
  {
    placeId: 'pune_hinjewadi',
    description: 'Hinjewadi Phase 1, Rajiv Gandhi Infotech Park, Pune, Maharashtra',
    mainText: 'Hinjewadi Phase 1',
    secondaryText: 'Pune, Maharashtra',
    lat: 18.5913,
    lng: 73.7389,
    city: 'Pune',
  },
  {
    placeId: 'pune_kharadi',
    description: 'Kharadi, EON Free Zone, Pune, Maharashtra, India',
    mainText: 'Kharadi',
    secondaryText: 'Pune, Maharashtra',
    lat: 18.5516,
    lng: 73.9348,
    city: 'Pune',
  },
  {
    placeId: 'pune_wakad',
    description: 'Wakad, Pimpri-Chinchwad, Pune, Maharashtra',
    mainText: 'Wakad',
    secondaryText: 'Pune, Maharashtra',
    lat: 18.5987,
    lng: 73.7634,
    city: 'Pune',
  },
  {
    placeId: 'pune_magarpatta',
    description: 'Magarpatta City, Hadapsar, Pune, Maharashtra',
    mainText: 'Magarpatta City',
    secondaryText: 'Hadapsar, Pune, Maharashtra',
    lat: 18.5147,
    lng: 73.9261,
    city: 'Pune',
  },
  {
    placeId: 'pune_aundh',
    description: 'Aundh, Pune, Maharashtra, India',
    mainText: 'Aundh',
    secondaryText: 'Pune, Maharashtra',
    lat: 18.558,
    lng: 73.8075,
    city: 'Pune',
  },

  // Mumbai & MMR
  {
    placeId: 'mumbai_bandra_west',
    description: 'Bandra West, Mumbai, Maharashtra, India',
    mainText: 'Bandra West',
    secondaryText: 'Mumbai, Maharashtra',
    lat: 19.0596,
    lng: 72.8295,
    city: 'Mumbai',
  },
  {
    placeId: 'mumbai_andheri_east',
    description: 'Andheri East, Mumbai, Maharashtra, India',
    mainText: 'Andheri East',
    secondaryText: 'Mumbai, Maharashtra',
    lat: 19.1136,
    lng: 72.8697,
    city: 'Mumbai',
  },
  {
    placeId: 'mumbai_powai',
    description: 'Powai, Hiranandani Gardens, Mumbai, Maharashtra',
    mainText: 'Powai (Hiranandani)',
    secondaryText: 'Mumbai, Maharashtra',
    lat: 19.1176,
    lng: 72.906,
    city: 'Mumbai',
  },
  {
    placeId: 'mumbai_south',
    description: 'Nariman Point, South Mumbai, Maharashtra, India',
    mainText: 'Nariman Point',
    secondaryText: 'South Mumbai, Maharashtra',
    lat: 18.9256,
    lng: 72.8242,
    city: 'Mumbai',
  },
  {
    placeId: 'thane_west',
    description: 'Thane West, Ghodbunder Road, Maharashtra, India',
    mainText: 'Thane West',
    secondaryText: 'Thane, Maharashtra',
    lat: 19.2183,
    lng: 72.9781,
    city: 'Thane',
  },
  {
    placeId: 'navi_mumbai_vashi',
    description: 'Vashi Sector 17, Navi Mumbai, Maharashtra, India',
    mainText: 'Vashi Sector 17',
    secondaryText: 'Navi Mumbai, Maharashtra',
    lat: 19.0771,
    lng: 72.9986,
    city: 'Navi Mumbai',
  },

  // Bengaluru
  {
    placeId: 'bengaluru_koramangala',
    description: 'Koramangala 4th Block, Bengaluru, Karnataka, India',
    mainText: 'Koramangala 4th Block',
    secondaryText: 'Bengaluru, Karnataka',
    lat: 12.9352,
    lng: 77.6245,
    city: 'Bengaluru',
  },
  {
    placeId: 'bengaluru_whitefield',
    description: 'Whitefield Main Road, Bengaluru, Karnataka, India',
    mainText: 'Whitefield Main Road',
    secondaryText: 'Bengaluru, Karnataka',
    lat: 12.9698,
    lng: 77.75,
    city: 'Bengaluru',
  },
  {
    placeId: 'bengaluru_indiranagar',
    description: 'Indiranagar 100 Feet Road, Bengaluru, Karnataka, India',
    mainText: 'Indiranagar',
    secondaryText: 'Bengaluru, Karnataka',
    lat: 12.9784,
    lng: 77.6408,
    city: 'Bengaluru',
  },
  {
    placeId: 'bengaluru_hフォーr_layout',
    description: 'HSR Layout Sector 1, Bengaluru, Karnataka, India',
    mainText: 'HSR Layout',
    secondaryText: 'Bengaluru, Karnataka',
    lat: 12.9121,
    lng: 77.6446,
    city: 'Bengaluru',
  },
];

export class GeocodingService {
  private static isRealKey(key: string): boolean {
    return Boolean(key && !key.startsWith('your_') && !key.startsWith('mock_'));
  }

  /**
   * Autocomplete search for places / localities
   */
  static async autocompletePlaces(input: string): Promise<PlaceSuggestion[]> {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return [];

    const { GOOGLE_MAPS_API_KEY } = getEnv();
    const redis = getRedis();
    const cacheKey = `maps:autocomplete:${trimmed}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch {
      // Redis fallback
    }

    // Try Google Maps API if valid key is set
    if (this.isRealKey(GOOGLE_MAPS_API_KEY)) {
      try {
        const response = await mapsClient.placeAutocomplete({
          params: {
            input: trimmed,
            components: ['country:in'],
            key: GOOGLE_MAPS_API_KEY,
          },
        });

        if (response.data.predictions && response.data.predictions.length > 0) {
          const suggestions: PlaceSuggestion[] = response.data.predictions.map((p) => ({
            placeId: p.place_id,
            description: p.description,
            mainText: p.structured_formatting.main_text,
            secondaryText: p.structured_formatting.secondary_text || '',
            lat: 18.5204, // Default center, will be resolved on selection
            lng: 73.8567,
            city: p.structured_formatting.secondary_text?.split(',')[0]?.trim() || 'India',
          }));

          try {
            await redis.set(cacheKey, JSON.stringify(suggestions), 'EX', 86400 * 7);
          } catch {}
          return suggestions;
        }
      } catch (err: any) {
        console.warn('Google Places API call failed, falling back to local dataset:', err?.message);
      }
    }

    // Fallback search in curated dataset
    const matched = KNOWN_LOCATIONS.filter(
      (loc) =>
        loc.description.toLowerCase().includes(trimmed) ||
        loc.mainText.toLowerCase().includes(trimmed) ||
        loc.city.toLowerCase().includes(trimmed)
    );

    // If no direct substring match, return matching city or top suggestions
    const results = matched.length > 0 ? matched : [
      {
        placeId: `custom_${Date.now()}`,
        description: `${input.trim()}, India`,
        mainText: input.trim(),
        secondaryText: 'India',
        lat: 18.5204 + (Math.random() - 0.5) * 0.05,
        lng: 73.8567 + (Math.random() - 0.5) * 0.05,
        city: 'Pune',
      },
      ...KNOWN_LOCATIONS.slice(0, 4),
    ];

    try {
      await redis.set(cacheKey, JSON.stringify(results), 'EX', 86400 * 7);
    } catch {}

    return results;
  }

  /**
   * Geocodes an address string to Lat/Lng coordinates.
   */
  static async geocodeAddress(address: string): Promise<{ lat: number; lng: number; formattedAddress: string }> {
    const { GOOGLE_MAPS_API_KEY } = getEnv();
    const redis = getRedis();
    const cacheKey = `geocode:${address.toLowerCase().trim()}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch {}

    if (this.isRealKey(GOOGLE_MAPS_API_KEY)) {
      try {
        const response = await mapsClient.geocode({
          params: {
            address,
            key: GOOGLE_MAPS_API_KEY,
          },
        });

        if (response.data.results.length > 0) {
          const res = response.data.results[0];
          const result = {
            lat: res.geometry.location.lat,
            lng: res.geometry.location.lng,
            formattedAddress: res.formatted_address,
          };
          try {
            await redis.set(cacheKey, JSON.stringify(result), 'EX', 86400 * 30);
          } catch {}
          return result;
        }
      } catch (error: any) {
        console.warn('Google Maps Geocode Error:', error?.message);
      }
    }

    // Fallback: match known location or return plausible coords
    const match = KNOWN_LOCATIONS.find(
      (loc) =>
        address.toLowerCase().includes(loc.mainText.toLowerCase()) ||
        address.toLowerCase().includes(loc.city.toLowerCase())
    );

    const fallbackResult = match
      ? { lat: match.lat, lng: match.lng, formattedAddress: match.description }
      : { lat: 18.5204, lng: 73.8567, formattedAddress: `${address}, Pune, Maharashtra` };

    try {
      await redis.set(cacheKey, JSON.stringify(fallbackResult), 'EX', 86400 * 30);
    } catch {}

    return fallbackResult;
  }

  /**
   * Reverse geocoding from Lat/Lng to formatted address
   */
  static async reverseGeocode(lat: number, lng: number): Promise<{ address: string; city: string }> {
    const { GOOGLE_MAPS_API_KEY } = getEnv();
    const redis = getRedis();
    const cacheKey = `reverse_geocode:${lat.toFixed(4)},${lng.toFixed(4)}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch {}

    if (this.isRealKey(GOOGLE_MAPS_API_KEY)) {
      try {
        const response = await mapsClient.reverseGeocode({
          params: {
            latlng: { lat, lng },
            key: GOOGLE_MAPS_API_KEY,
          },
        });
        if (response.data.results.length > 0) {
          const res = response.data.results[0];
          const result = {
            address: res.formatted_address,
            city: 'Pune',
          };
          try {
            await redis.set(cacheKey, JSON.stringify(result), 'EX', 86400 * 30);
          } catch {}
          return result;
        }
      } catch (err: any) {
        console.warn('Google reverse geocode error:', err?.message);
      }
    }

    // Find closest match in known locations
    let closest = KNOWN_LOCATIONS[0];
    let minDistance = Number.MAX_VALUE;

    for (const loc of KNOWN_LOCATIONS) {
      const d = Math.hypot(loc.lat - lat, loc.lng - lng);
      if (d < minDistance) {
        minDistance = d;
        closest = loc;
      }
    }

    const result = {
      address: closest.description,
      city: closest.city,
    };

    try {
      await redis.set(cacheKey, JSON.stringify(result), 'EX', 86400 * 30);
    } catch {}

    return result;
  }

  /**
   * Calculates driving distance, duration, and route summary
   */
  static async calculateDistanceKm(
    origin: string,
    destination: string
  ): Promise<{ distanceKm: number; durationMins: number }> {
    const { GOOGLE_MAPS_API_KEY } = getEnv();
    const redis = getRedis();
    const cacheKey = `maps:route:${origin.toLowerCase().trim()}|${destination.toLowerCase().trim()}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch {}

    if (this.isRealKey(GOOGLE_MAPS_API_KEY)) {
      try {
        const response = await mapsClient.distancematrix({
          params: {
            origins: [origin],
            destinations: [destination],
            key: GOOGLE_MAPS_API_KEY,
          },
        });

        const element = response.data.rows[0]?.elements[0];
        if (element && element.status === 'OK') {
          const distanceKm = Math.round((element.distance.value / 1000) * 10) / 10;
          const durationMins = Math.round(element.duration.value / 60);
          const result = { distanceKm, durationMins };

          try {
            await redis.set(cacheKey, JSON.stringify(result), 'EX', 86400 * 14);
          } catch {}
          return result;
        }
      } catch (error: any) {
        console.warn('Google Maps Distance Matrix Error:', error?.message);
      }
    }

    // Realistic fallback based on coordinate delta
    const originGeo = await this.geocodeAddress(origin);
    const destGeo = await this.geocodeAddress(destination);

    // Haversine formula
    const R = 6371; // km
    const dLat = ((destGeo.lat - originGeo.lat) * Math.PI) / 180;
    const dLon = ((destGeo.lng - originGeo.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((originGeo.lat * Math.PI) / 180) *
        Math.cos((destGeo.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightKm = R * c;

    // Road routing factor (typically ~1.35x straight line in cities)
    const distanceKm = Math.max(3.5, Math.round(straightKm * 1.38 * 10) / 10);
    // Average urban shifting speed ~25 km/h + 10 mins buffer
    const durationMins = Math.max(15, Math.round((distanceKm / 24) * 60 + 10));

    const result = { distanceKm, durationMins };
    try {
      await redis.set(cacheKey, JSON.stringify(result), 'EX', 86400 * 14);
    } catch {}

    return result;
  }
}
