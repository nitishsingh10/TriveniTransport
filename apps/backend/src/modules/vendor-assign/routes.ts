import { Router } from 'express';

const router: Router = Router();

router.get('/jobs', (req, res) => {
  res.json({ message: 'Vendor jobs (mock)' });
});

router.patch('/jobs/:id/status', (req, res) => {
  res.json({ message: 'Job status updated (mock)' });
});

router.post('/bookings/manual', (req, res) => {
  res.json({ message: 'Manual booking created (mock)' });
});

export default router;
