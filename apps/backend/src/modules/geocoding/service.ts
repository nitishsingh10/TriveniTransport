import { Client } from '@googlemaps/google-maps-services-js';
import { getEnv } from '../../config/env';
import { getRedis } from '../../config/redis';

const mapsClient = new Client({});

export class GeocodingService {
  /**
   * Geocodes an address string to Lat/Lng coordinates.
   * Caches results in Redis to save API calls.
   */
  static async geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
    const { GOOGLE_MAPS_API_KEY } = getEnv();
    
    // Check Redis cache first
    const cacheKey = `geocode:${address.toLowerCase().trim()}`;
    const redis = getRedis();
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.startsWith('your_')) {
      // Mock mode
      console.log(`[Mock Maps] Geocoding ${address}`);
      const mockResult = { lat: 19.0760, lng: 72.8777 }; // Mumbai center
      await redis.set(cacheKey, JSON.stringify(mockResult), 'EX', 86400 * 30); // Cache 30 days
      return mockResult;
    }

    try {
      const response = await mapsClient.geocode({
        params: {
          address,
          key: GOOGLE_MAPS_API_KEY,
        },
      });

      if (response.data.results.length === 0) {
        throw new Error('Address not found');
      }

      const location = response.data.results[0].geometry.location;
      await redis.set(cacheKey, JSON.stringify(location), 'EX', 86400 * 30);
      return location;
    } catch (error: any) {
      console.error('Google Maps Geocode Error:', error.response?.data || error.message);
      throw new Error('Failed to geocode address');
    }
  }

  /**
   * Calculates driving distance between two addresses.
   */
  static async calculateDistanceKm(origin: string, destination: string): Promise<number> {
    const { GOOGLE_MAPS_API_KEY } = getEnv();

    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.startsWith('your_')) {
      console.log(`[Mock Maps] Distance from ${origin} to ${destination}`);
      return 15.5; // Mock 15.5 km
    }

    try {
      const response = await mapsClient.distancematrix({
        params: {
          origins: [origin],
          destinations: [destination],
          key: GOOGLE_MAPS_API_KEY,
        }
      });

      const element = response.data.rows[0].elements[0];
      if (element.status !== 'OK') {
        throw new Error('Could not calculate distance');
      }

      // value is in meters
      return element.distance.value / 1000;
    } catch (error: any) {
      console.error('Google Maps Distance Error:', error.response?.data || error.message);
      throw new Error('Failed to calculate distance');
    }
  }
}
