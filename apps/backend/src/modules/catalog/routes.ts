import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';

const router: Router = Router();

router.get('/items', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const items = await prisma.item.findMany({
      where: {
        active: true,
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
      },
      select: {
        id: true,
        name: true,
        category: true,
        defaultCft: true,
        defaultWeightKg: true,
        baseHandlingRate: true,
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    res.status(200).json(items);
  } catch (error) {
    next(error);
  }
});

export default router;
