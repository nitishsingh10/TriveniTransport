import { Router } from 'express';

const router: Router = Router();

router.post('/instant-estimate', (req, res) => {
  res.json({ message: 'Instant estimate (mock)' });
});

router.post('/itemized', (req, res) => {
  res.json({ message: 'Itemized quote (mock)' });
});

export default router;
