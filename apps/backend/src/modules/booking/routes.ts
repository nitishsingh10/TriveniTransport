import { Router } from 'express';

const router: Router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'List bookings (mock)' });
});

router.get('/:id', (req, res) => {
  res.json({ message: 'Booking detail (mock)' });
});

router.post('/:id/hold', (req, res) => {
  res.json({ message: 'Booking held (mock)' });
});

router.post('/:id/confirm', (req, res) => {
  res.json({ message: 'Booking confirmed (mock)' });
});

router.post('/:id/cancel', (req, res) => {
  res.json({ message: 'Booking cancelled (mock)' });
});

export default router;
