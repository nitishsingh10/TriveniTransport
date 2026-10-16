import { Router } from 'express';
import { MapsController } from './controller';
import { mapsRateLimiter } from '../../middleware/rateLimiter';

const router: Router = Router();

// Public maps endpoints with Redis caching & rate limit protection
router.use(mapsRateLimiter);

router.get('/places', MapsController.autocomplete);
router.get('/geocode', MapsController.geocode);
router.get('/reverse', MapsController.reverse);
router.get('/distance', MapsController.distance);

export default router;
