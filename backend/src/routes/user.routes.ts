import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/user/stores (Only return APPROVED stores to normal users)
router.get('/stores', authenticateToken, async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user!.id;
    const { search, name, address, sortBy, sortOrder } = req.query;

    const where: any = {
      status: 'APPROVED' // Only approved stores are live for shoppers
    };

    if (search && typeof search === 'string') {
      const q = search.trim();
      where.AND = [
        {
          OR: [
            { name: { contains: q } },
            { address: { contains: q } }
          ]
        }
      ];
    }

    if (name && typeof name === 'string' && name.trim()) {
      where.name = { contains: name.trim() };
    }

    if (address && typeof address === 'string' && address.trim()) {
      where.address = { contains: address.trim() };
    }

    const allowedSortFields = ['name', 'address', 'createdAt'];
    const sortField = typeof sortBy === 'string' && allowedSortFields.includes(sortBy) ? sortBy : 'name';
    const direction = sortOrder === 'desc' ? 'desc' : 'asc';

    const stores = await prisma.store.findMany({
      where,
      orderBy: { [sortField]: direction },
      include: {
        ratings: {
          select: {
            id: true,
            value: true,
            userId: true
          }
        }
      }
    });

    const formattedStores = stores.map((store) => {
      const totalRatings = store.ratings.length;
      const sum = store.ratings.reduce((acc, r) => acc + r.value, 0);
      const overallRating = totalRatings > 0 ? parseFloat((sum / totalRatings).toFixed(1)) : 0;

      const myRatingRecord = store.ratings.find(r => r.userId === currentUserId);
      const userSubmittedRating = myRatingRecord ? myRatingRecord.value : null;

      return {
        id: store.id,
        name: store.name,
        address: store.address,
        overallRating,
        totalRatings,
        userSubmittedRating,
        createdAt: store.createdAt
      };
    });

    if (sortBy === 'rating' || sortBy === 'overallRating') {
      formattedStores.sort((a, b) => {
        return direction === 'asc' ? a.overallRating - b.overallRating : b.overallRating - a.overallRating;
      });
    }

    res.status(200).json({
      success: true,
      stores: formattedStores,
      total: formattedStores.length
    });
  } catch (error: any) {
    console.error('User get stores error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stores.' });
  }
});

// POST /api/user/ratings (Submit rating for approved store)
router.post('/ratings', authenticateToken, async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user!.id;
    const { storeId, rating } = req.body;

    if (!storeId) {
      res.status(400).json({ success: false, message: 'Store ID is required.' });
      return;
    }

    const ratingVal = parseInt(rating, 10);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5.' });
      return;
    }

    // Verify store exists and is APPROVED
    const store = await prisma.store.findUnique({
      where: { id: storeId }
    });

    if (!store) {
      res.status(404).json({ success: false, message: 'Store not found.' });
      return;
    }

    if (store.status !== 'APPROVED') {
      res.status(400).json({ success: false, message: 'This store is pending administrator verification and cannot receive ratings yet.' });
      return;
    }

    // Upsert rating
    const savedRating = await prisma.rating.upsert({
      where: {
        userId_storeId: {
          userId: currentUserId,
          storeId
        }
      },
      update: {
        value: ratingVal
      },
      create: {
        userId: currentUserId,
        storeId,
        value: ratingVal
      }
    });

    const allStoreRatings = await prisma.rating.findMany({
      where: { storeId },
      select: { value: true }
    });

    const totalRatings = allStoreRatings.length;
    const sum = allStoreRatings.reduce((acc, r) => acc + r.value, 0);
    const overallRating = totalRatings > 0 ? parseFloat((sum / totalRatings).toFixed(1)) : 0;

    res.status(200).json({
      success: true,
      message: 'Rating submitted successfully.',
      rating: savedRating,
      overallRating,
      totalRatings
    });
  } catch (error: any) {
    console.error('Submit rating error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit rating.' });
  }
});

export default router;