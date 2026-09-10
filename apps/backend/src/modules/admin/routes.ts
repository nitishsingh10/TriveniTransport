import { Router } from 'express';

const router: Router = Router();

router.get('/metrics', (req, res) => {
  res.json({ message: 'Metrics (mock)' });
});

router.get('/zones', (req, res) => {
  res.json({ message: 'Zones list (mock)' });
});

router.get('/items', (req, res) => {
  res.json({ message: 'Items list (mock)' });
});

export default router;
