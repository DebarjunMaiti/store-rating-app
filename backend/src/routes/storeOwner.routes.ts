import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { validateStoreForm } from '../utils/validators';

const router = Router();

// Protect store owner routes
router.use(authenticateToken, requireRoles('STORE_OWNER', 'ADMIN'));

// GET /api/store-owner/dashboard
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const { sortBy, sortOrder } = req.query;

    const stores = await prisma.store.findMany({
      where: { ownerId },
      include: {
        ratings: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                address: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!stores || stores.length === 0) {
      res.status(200).json({
        success: true,
        hasStore: false,
        message: 'You have not added any stores yet. Click "Add Another Store" to register your store.',
        stores: []
      });
      return;
    }

    const direction = sortOrder === 'asc' ? 'asc' : 'desc';

    const formattedStores = stores.map((store) => {
      const totalRatings = store.ratings.length;
      const sum = store.ratings.reduce((acc: number, r: { value: number }) => acc + r.value, 0);
      const averageRating = totalRatings > 0 ? parseFloat((sum / totalRatings).toFixed(1)) : 0;

      let reviewers = store.ratings.map((r: any) => ({
        id: r.id,
        rating: r.value,
        userName: r.user.name,
        userEmail: r.user.email,
        userAddress: r.user.address,
        submittedAt: r.createdAt,
        updatedAt: r.updatedAt
      }));

      // Sort reviewers
      if (sortBy === 'rating') {
        reviewers.sort((a: any, b: any) => direction === 'asc' ? a.rating - b.rating : b.rating - a.rating);
      } else if (sortBy === 'name') {
        reviewers.sort((a: any, b: any) => direction === 'asc' ? a.userName.localeCompare(b.userName) : b.userName.localeCompare(a.userName));
      } else if (sortBy === 'email') {
        reviewers.sort((a: any, b: any) => direction === 'asc' ? a.userEmail.localeCompare(b.userEmail) : b.userEmail.localeCompare(a.userEmail));
      } else {
        reviewers.sort((a: any, b: any) => {
          const timeA = new Date(a.submittedAt).getTime();
          const timeB = new Date(b.submittedAt).getTime();
          return direction === 'asc' ? timeA - timeB : timeB - timeA;
        });
      }

      return {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address,
        status: store.status, // "PENDING", "APPROVED", "REJECTED"
        averageRating,
        totalRatings,
        reviewers
      };
    });

    res.status(200).json({
      success: true,
      hasStore: true,
      stores: formattedStores
    });
  } catch (error: any) {
    console.error('Store owner dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch store owner dashboard.' });
  }
});

// POST /api/store-owner/stores (Add another store - defaults to PENDING status)
router.post('/stores', async (req: Request, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const { name, email, address } = req.body;

    const validation = validateStoreForm({ name, email, address });
    if (!validation.isValid) {
      res.status(400).json({ success: false, errors: validation.errors });
      return;
    }

    const existingStore = await prisma.store.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (existingStore) {
      res.status(409).json({
        success: false,
        errors: { email: 'A store with this email address already exists.' }
      });
      return;
    }

    const newStore = await prisma.store.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        address: address.trim(),
        status: 'PENDING', // Awaiting Admin verification
        ownerId
      }
    });

    res.status(201).json({
      success: true,
      message: 'New store submitted for Administrator verification. It will be live once approved!',
      store: newStore
    });
  } catch (error: any) {
    console.error('Add store error:', error);
    res.status(500).json({ success: false, message: 'Failed to add store.' });
  }
});

// PUT /api/store-owner/stores/:storeId
router.put('/stores/:storeId', async (req: Request, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const storeId = req.params.storeId as string;
    const { name, email, address } = req.body;

    const validation = validateStoreForm({ name, email, address });
    if (!validation.isValid) {
      res.status(400).json({ success: false, errors: validation.errors });
      return;
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId }
    });

    if (!store || (store.ownerId !== ownerId && req.user!.role !== 'ADMIN')) {
      res.status(403).json({ success: false, message: 'Store not found or you do not have permission to edit it.' });
      return;
    }

    if (email.trim().toLowerCase() !== store.email.toLowerCase()) {
      const emailExists = await prisma.store.findUnique({
        where: { email: email.trim().toLowerCase() }
      });
      if (emailExists && emailExists.id !== storeId) {
        res.status(409).json({
          success: false,
          errors: { email: 'A store with this email already exists.' }
        });
        return;
      }
    }

    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        address: address.trim()
      }
    });

    res.status(200).json({
      success: true,
      message: 'Store details updated successfully.',
      store: updatedStore
    });
  } catch (error: any) {
    console.error('Update store error:', error);
    res.status(500).json({ success: false, message: 'Failed to update store.' });
  }
});

// POST /api/store-owner/stores/:storeId/re-verify (Submit rejected store for re-verification)
router.post('/stores/:storeId/re-verify', async (req: Request, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const storeId = req.params.storeId as string;

    const store = await prisma.store.findUnique({
      where: { id: storeId }
    });

    if (!store || store.ownerId !== ownerId) {
      res.status(403).json({ success: false, message: 'Store not found or you do not have permission to modify it.' });
      return;
    }

    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: { status: 'PENDING' }
    });

    res.status(200).json({
      success: true,
      message: `Store "${updatedStore.name}" has been resubmitted for Administrator verification!`,
      store: updatedStore
    });
  } catch (error: any) {
    console.error('Re-verify store error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit store for re-verification.' });
  }
});

// POST /api/store-owner/stores/:storeId/request-delete (Request Store Deletion - sends for Admin Verification)
router.post('/stores/:storeId/request-delete', async (req: Request, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const storeId = req.params.storeId as string;

    const store = await prisma.store.findUnique({
      where: { id: storeId }
    });

    if (!store || store.ownerId !== ownerId) {
      res.status(403).json({ success: false, message: 'Store not found or you do not have permission to delete it.' });
      return;
    }

    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: { status: 'PENDING_DELETION' }
    });

    res.status(200).json({
      success: true,
      message: `Store deletion request submitted for "${updatedStore.name}". A System Administrator will review and approve the deletion.`,
      store: updatedStore
    });
  } catch (error: any) {
    console.error('Request store deletion error:', error);
    res.status(500).json({ success: false, message: 'Failed to request store deletion.' });
  }
});

// POST /api/store-owner/stores/:storeId/cancel-delete (Cancel Store Deletion Request)
router.post('/stores/:storeId/cancel-delete', async (req: Request, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const storeId = req.params.storeId as string;

    const store = await prisma.store.findUnique({
      where: { id: storeId }
    });

    if (!store || store.ownerId !== ownerId) {
      res.status(403).json({ success: false, message: 'Store not found or you do not have permission to modify it.' });
      return;
    }

    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: { status: 'APPROVED' }
    });

    res.status(200).json({
      success: true,
      message: `Store deletion request cancelled. "${updatedStore.name}" remains active and approved.`,
      store: updatedStore
    });
  } catch (error: any) {
    console.error('Cancel store deletion error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel store deletion.' });
  }
});

export default router;