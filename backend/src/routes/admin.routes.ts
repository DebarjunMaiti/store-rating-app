import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { validateUserForm, validateStoreForm } from '../utils/validators';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();

// Protect all admin routes
router.use(authenticateToken, requireRoles('ADMIN'));

// GET /api/admin/dashboard-stats
router.get('/dashboard-stats', async (req: Request, res: Response) => {
  try {
    const [totalUsers, totalStores, pendingStoresCount, approvedStoresCount, deletionRequestsCount, totalRatings] = await Promise.all([
      prisma.user.count(),
      prisma.store.count(),
      prisma.store.count({ where: { status: 'PENDING' } }),
      prisma.store.count({ where: { status: 'APPROVED' } }),
      prisma.store.count({ where: { status: 'PENDING_DELETION' } }),
      prisma.rating.count()
    ]);

    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    const normalUserCount = await prisma.user.count({ where: { role: 'USER' } });
    const storeOwnerCount = await prisma.user.count({ where: { role: 'STORE_OWNER' } });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalStores,
        pendingStoresCount,
        approvedStoresCount,
        deletionRequestsCount,
        totalRatings,
        roleCounts: {
          admin: adminCount,
          user: normalUserCount,
          storeOwner: storeOwnerCount
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats.' });
  }
});

// POST /api/admin/users
router.post('/users', async (req: Request, res: Response) => {
  try {
    const { name, email, password, address, role } = req.body;

    const validRoles = ['ADMIN', 'USER', 'STORE_OWNER'];
    const targetRole = role && validRoles.includes(role.toUpperCase()) ? role.toUpperCase() : 'USER';

    const validation = validateUserForm({ name, email, password, address, isPasswordRequired: true });
    if (!validation.isValid) {
      res.status(400).json({ success: false, errors: validation.errors });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        errors: { email: 'A user with this email address already exists.' }
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        address: address.trim(),
        role: targetRole
      },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        role: true,
        createdAt: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      user: newUser
    });
  } catch (error: any) {
    console.error('Admin create user error:', error);
    res.status(500).json({ success: false, message: 'Failed to create user.' });
  }
});

// GET /api/admin/users
router.get('/users', async (req: Request, res: Response) => {
  try {
    const { search, name, email, address, role, sortBy, sortOrder } = req.query;

    const where: any = {};

    if (search && typeof search === 'string') {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { address: { contains: q } }
      ];
    }

    if (name && typeof name === 'string' && name.trim()) {
      where.name = { contains: name.trim() };
    }

    if (email && typeof email === 'string' && email.trim()) {
      where.email = { contains: email.trim() };
    }

    if (address && typeof address === 'string' && address.trim()) {
      where.address = { contains: address.trim() };
    }

    if (role && typeof role === 'string' && role.trim() && role !== 'ALL') {
      where.role = role.trim().toUpperCase();
    }

    const allowedSortFields = ['name', 'email', 'address', 'role', 'createdAt'];
    const sortField = typeof sortBy === 'string' && allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const direction = sortOrder === 'asc' ? 'asc' : 'desc';

    const users = await prisma.user.findMany({
      where,
      orderBy: { [sortField]: direction },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        role: true,
        createdAt: true,
        stores: {
          select: {
            id: true,
            name: true,
            status: true,
            ratings: {
              select: {
                value: true
              }
            }
          }
        }
      }
    });

    const formattedUsers = users.map((u) => {
      let storeRating: number | null = null;
      let totalRatingsCount = 0;
      let ownedStoreName: string | null = null;

      if (u.role === 'STORE_OWNER' && u.stores.length > 0) {
        const store = u.stores[0];
        ownedStoreName = store.name;
        if (store.ratings.length > 0) {
          totalRatingsCount = store.ratings.length;
          const sum = store.ratings.reduce((acc: number, r: { value: number }) => acc + r.value, 0);
          storeRating = parseFloat((sum / store.ratings.length).toFixed(1));
        }
      }

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        address: u.address,
        role: u.role,
        createdAt: u.createdAt,
        storeRating,
        totalRatingsCount,
        ownedStoreName
      };
    });

    res.status(200).json({
      success: true,
      users: formattedUsers,
      total: formattedUsers.length
    });
  } catch (error: any) {
    console.error('Admin get users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
});

// GET /api/admin/users/:id
router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        stores: {
          include: {
            ratings: {
              include: {
                user: {
                  select: { id: true, name: true, email: true }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    let storeRating: number | null = null;
    let storeDetails: any = null;

    if (user.role === 'STORE_OWNER' && user.stores.length > 0) {
      const store = user.stores[0];
      const sum = store.ratings.reduce((acc: number, r: { value: number }) => acc + r.value, 0);
      storeRating = store.ratings.length > 0 ? parseFloat((sum / store.ratings.length).toFixed(1)) : null;
      storeDetails = {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address,
        status: store.status,
        averageRating: storeRating,
        totalRatings: store.ratings.length,
        ratings: store.ratings.map((r: any) => ({
          id: r.id,
          value: r.value,
          userName: r.user.name,
          userEmail: r.user.email,
          createdAt: r.createdAt
        }))
      };
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        address: user.address,
        role: user.role,
        createdAt: user.createdAt,
        storeRating,
        storeDetails
      }
    });
  } catch (error: any) {
    console.error('Admin get user details error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user details.' });
  }
});

// POST /api/admin/stores (Admin adds pre-approved store)
router.post('/stores', async (req: Request, res: Response) => {
  try {
    const { name, email, address, ownerId } = req.body;

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

    if (ownerId) {
      const owner = await prisma.user.findUnique({ where: { id: ownerId } });
      if (!owner) {
        res.status(400).json({ success: false, errors: { ownerId: 'Selected store owner does not exist.' } });
        return;
      }
      if (owner.role !== 'STORE_OWNER') {
        await prisma.user.update({
          where: { id: ownerId },
          data: { role: 'STORE_OWNER' }
        });
      }
    }

    const newStore = await prisma.store.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        address: address.trim(),
        status: 'APPROVED',
        ownerId: ownerId || null
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Store created and approved successfully.',
      store: newStore
    });
  } catch (error: any) {
    console.error('Admin create store error:', error);
    res.status(500).json({ success: false, message: 'Failed to create store.' });
  }
});

// GET /api/admin/stores
router.get('/stores', async (req: Request, res: Response) => {
  try {
    const { search, name, email, address, status, sortBy, sortOrder } = req.query;

    const where: any = {};

    if (search && typeof search === 'string') {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { address: { contains: q } }
      ];
    }

    if (name && typeof name === 'string' && name.trim()) {
      where.name = { contains: name.trim() };
    }

    if (email && typeof email === 'string' && email.trim()) {
      where.email = { contains: email.trim() };
    }

    if (address && typeof address === 'string' && address.trim()) {
      where.address = { contains: address.trim() };
    }

    if (status && typeof status === 'string' && status.trim() && status !== 'ALL') {
      where.status = status.trim().toUpperCase();
    }

    const allowedSortFields = ['name', 'email', 'address', 'status', 'createdAt'];
    const sortField = typeof sortBy === 'string' && allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const direction = sortOrder === 'asc' ? 'asc' : 'desc';

    const stores = await prisma.store.findMany({
      where,
      orderBy: { [sortField]: direction },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        ratings: {
          select: { value: true }
        }
      }
    });

    const formattedStores = stores.map((store) => {
      const totalRatings = store.ratings.length;
      const sum = store.ratings.reduce((acc: number, r: { value: number }) => acc + r.value, 0);
      const overallRating = totalRatings > 0 ? parseFloat((sum / totalRatings).toFixed(1)) : 0;

      return {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address,
        status: store.status,
        overallRating,
        totalRatings,
        owner: store.owner,
        createdAt: store.createdAt
      };
    });

    if (sortBy === 'rating') {
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
    console.error('Admin get stores error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stores.' });
  }
});

// PUT /api/admin/stores/:storeId/status (Approve, Reject, or Approve Deletion)
router.put('/stores/:storeId/status', async (req: Request, res: Response) => {
  try {
    const storeId = req.params.storeId as string;
    const { status } = req.body;

    const validStatuses = ['APPROVED', 'REJECTED', 'PENDING', 'APPROVE_DELETION', 'REJECT_DELETION', 'DELETED'];
    if (!status || !validStatuses.includes(status.toUpperCase())) {
      res.status(400).json({ success: false, message: 'Invalid status specified.' });
      return;
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId }
    });

    if (!store) {
      res.status(404).json({ success: false, message: 'Store not found.' });
      return;
    }

    // If Admin is approving a store deletion request
    if (status.toUpperCase() === 'APPROVE_DELETION' || status.toUpperCase() === 'DELETED') {
      await prisma.store.delete({
        where: { id: storeId }
      });

      res.status(200).json({
        success: true,
        message: `Store "${store.name}" deletion has been approved and permanently removed from the platform.`,
        deletedStoreId: storeId
      });
      return;
    }

    // If Admin is rejecting a store deletion request
    if (status.toUpperCase() === 'REJECT_DELETION') {
      const restoredStore = await prisma.store.update({
        where: { id: storeId },
        data: { status: 'APPROVED' },
        include: {
          owner: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      res.status(200).json({
        success: true,
        message: `Store deletion request for "${restoredStore.name}" was rejected. Store restored to active status.`,
        store: restoredStore
      });
      return;
    }

    // Standard approval / rejection of store registration
    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: { status: status.toUpperCase() },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: `Store "${updatedStore.name}" has been ${status.toUpperCase() === 'APPROVED' ? 'approved and is now live!' : status.toLowerCase()}.`,
      store: updatedStore
    });
  } catch (error: any) {
    console.error('Update store status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update store verification status.' });
  }
});

// DELETE /api/admin/stores/:storeId (Direct store deletion by Admin)
router.delete('/stores/:storeId', async (req: Request, res: Response) => {
  try {
    const storeId = req.params.storeId as string;

    const store = await prisma.store.findUnique({
      where: { id: storeId }
    });

    if (!store) {
      res.status(404).json({ success: false, message: 'Store not found.' });
      return;
    }

    await prisma.store.delete({
      where: { id: storeId }
    });

    res.status(200).json({
      success: true,
      message: `Store "${store.name}" has been deleted.`
    });
  } catch (error: any) {
    console.error('Admin delete store error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete store.' });
  }
});

// GET /api/admin/store-owners
router.get('/store-owners', async (req: Request, res: Response) => {
  try {
    const owners = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'STORE_OWNER' },
          { role: 'USER' }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      },
      orderBy: { name: 'asc' }
    });

    res.status(200).json({ success: true, owners });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch store owners.' });
  }
});

export default router;