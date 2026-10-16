import { Request, Response, NextFunction } from 'express';
import { GeocodingService } from './service';

export class MapsController {
  static async autocomplete(req: Request, res: Response, next: NextFunction) {
    try {
      const input = (req.query.input as string) || '';
      if (!input.trim()) {
        return res.status(200).json([]);
      }
      const suggestions = await GeocodingService.autocompletePlaces(input);
      res.status(200).json(suggestions);
    } catch (e) {
      next(e);
    }
  }

  static async geocode(req: Request, res: Response, next: NextFunction) {
    try {
      const address = (req.query.address as string) || '';
      if (!address.trim()) {
        return res.status(400).json({ error: 'Address query parameter is required' });
      }
      const result = await GeocodingService.geocodeAddress(address);
      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  }

  static async reverse(req: Request, res: Response, next: NextFunction) {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);
      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ error: 'Valid lat and lng query parameters required' });
      }
      const result = await GeocodingService.reverseGeocode(lat, lng);
      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  }

  static async distance(req: Request, res: Response, next: NextFunction) {
    try {
      const origin = (req.query.origin as string) || '';
      const destination = (req.query.destination as string) || '';
      if (!origin.trim() || !destination.trim()) {
        return res.status(400).json({ error: 'Both origin and destination query parameters are required' });
      }
      const result = await GeocodingService.calculateDistanceKm(origin, destination);
      res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  }
}
