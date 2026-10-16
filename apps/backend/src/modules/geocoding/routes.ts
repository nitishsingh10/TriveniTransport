import { Router } from 'express';
import { MapsController } from './controller';

const router: Router = Router();

// Public maps endpoints with Redis caching & rate limit friendly design
router.get('/places', MapsController.autocomplete);
router.get('/geocode', MapsController.geocode);
router.get('/reverse', MapsController.reverse);
router.get('/distance', MapsController.distance);

export default router;
