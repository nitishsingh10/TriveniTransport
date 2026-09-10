import { Router } from 'express';

const router: Router = Router();

router.get('/:bookingId/revisions', (req, res) => {
  res.json({ message: 'List revisions (mock)' });
});

router.post('/:bookingId/revisions', (req, res) => {
  res.json({ message: 'Revision created (mock)' });
});

router.post('/:bookingId/revisions/:revisionId/approve', (req, res) => {
  res.json({ message: 'Revision approved (mock)' });
});

router.post('/:bookingId/revisions/:revisionId/decline', (req, res) => {
  res.json({ message: 'Revision declined (mock)' });
});

export default router;
