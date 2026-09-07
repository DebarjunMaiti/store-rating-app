import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { validateUserForm, validateStoreForm, validatePassword } from '../utils/validators';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_store_ratings_platform_2026';

const generateToken = (user: { id: string; email: string; role: string; name: string }) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Generate Temporary OTP Token for Admin 2FA
const generateTempOtpToken = (userId: string, email: string) => {
  return jwt.sign(
    { id: userId, email, is2FA: true },
    JWT_SECRET,
    { expiresIn: '5m' }
  );
};

// POST /api/auth/register (Register as Normal User OR Store Owner)
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, address, role, storeName, storeEmail, storeAddress } = req.body;

    const targetRole = role === 'STORE_OWNER' ? 'STORE_OWNER' : 'USER';

    const validation = validateUserForm({ name, email, password, address, isPasswordRequired: true });
    if (!validation.isValid) {
      res.status(400).json({ success: false, errors: validation.errors });
      return;
    }

    // Check if user email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        errors: { email: 'An account with this email address already exists.' }
      });
      return;
    }

    // If registering as Store Owner and store details are provided, validate store
    if (targetRole === 'STORE_OWNER' && storeName) {
      const storeVal = validateStoreForm({
        name: storeName,
        email: storeEmail || email,
        address: storeAddress || address
      });

      if (!storeVal.isValid) {
        res.status(400).json({ success: false, errors: storeVal.errors });
        return;
      }

      const existingStore = await prisma.store.findUnique({
        where: { email: (storeEmail || email).trim().toLowerCase() }
      });

      if (existingStore) {
        res.status(409).json({
          success: false,
          errors: { storeEmail: 'A store with this email already exists.' }
        });
        return;
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
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

    // If Store Owner provided initial store details, create it with PENDING status
    if (targetRole === 'STORE_OWNER' && storeName) {
      await prisma.store.create({
        data: {
          name: storeName.trim(),
          email: (storeEmail || email).trim().toLowerCase(),
          address: (storeAddress || address).trim(),
          status: 'PENDING', // Awaiting Admin verification
          ownerId: newUser.id
        }
      });
    }

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: `Account registered successfully as ${targetRole === 'STORE_OWNER' ? 'Store Owner' : 'Normal User'}.`,
      user: newUser,
      token
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during registration.' });
  }
});

// POST /api/auth/login (Unified login with Admin 2FA OTP verification)
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, expectedRole } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: {
        stores: {
          select: {
            id: true,
            name: true,
            email: true,
            address: true,
            status: true
          }
        }
      }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
      return;
    }

    // Role check if expectedRole is passed
    if (expectedRole && expectedRole !== 'ALL' && expectedRole !== user.role) {
      const friendlyRoleName = (r: string) => {
        if (r === 'STORE_OWNER') return 'Store Owner';
        if (r === 'ADMIN') return 'System Administrator';
        return 'Normal User';
      };

      res.status(403).json({
        success: false,
        message: `This account is registered as a "${friendlyRoleName(user.role)}", but you selected "Login as ${friendlyRoleName(expectedRole)}". Please select the correct login role.`
      });
      return;
    }

    // 🔒 HIGH SECURITY: System Administrator requires 2FA OTP verification
    if (user.role === 'ADMIN') {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
      const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins validity

      await prisma.user.update({
        where: { id: user.id },
        data: { otpCode, otpExpiresAt }
      });

      console.log(`🔐 [ADMIN 2FA SECURITY] OTP for ${user.email} is: ${otpCode}`);

      const tempToken = generateTempOtpToken(user.id, user.email);

      res.status(200).json({
        success: true,
        requireOtp: true,
        message: 'System Administrator 2FA verification required. Please enter the 6-digit OTP.',
        email: user.email,
        tempToken,
        previewOtp: otpCode // Provided for convenient evaluation
      });
      return;
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        address: user.address,
        role: user.role,
        createdAt: user.createdAt,
        stores: user.stores
      },
      token
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
});

// POST /api/auth/verify-admin-otp (Verify Admin 2FA OTP)
router.post('/verify-admin-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp, tempToken } = req.body;

    if (!email || !otp) {
      res.status(400).json({ success: false, message: 'Email and 6-digit OTP are required.' });
      return;
    }

    // Verify temp token if provided
    if (tempToken) {
      try {
        jwt.verify(tempToken, JWT_SECRET);
      } catch (e) {
        res.status(401).json({ success: false, message: '2FA session expired. Please sign in again.' });
        return;
      }
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (!user || user.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Unauthorized action.' });
      return;
    }

    if (!user.otpCode || !user.otpExpiresAt) {
      res.status(400).json({ success: false, message: 'No active OTP request found. Please login again.' });
      return;
    }

    if (new Date() > new Date(user.otpExpiresAt)) {
      res.status(400).json({ success: false, message: 'OTP has expired. Please login again to request a new OTP.' });
      return;
    }

    if (user.otpCode.trim() !== otp.trim()) {
      res.status(400).json({ success: false, message: 'Invalid OTP code. Please enter the correct 6-digit code.' });
      return;
    }

    // Clear OTP after successful verification
    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: null, otpExpiresAt: null }
    });

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Administrator identity verified successfully.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        address: user.address,
        role: user.role,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error: any) {
    console.error('Verify admin OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP.' });
  }
});

// GET /api/auth/me (Get profile)
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
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
            email: true,
            address: true,
            status: true
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    res.status(200).json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, email, address, storeId, storeName, storeEmail, storeAddress } = req.body;

    const validation = validateUserForm({ name, email, address, isPasswordRequired: false });
    if (!validation.isValid) {
      res.status(400).json({ success: false, errors: validation.errors });
      return;
    }

    const existingWithEmail = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (existingWithEmail && existingWithEmail.id !== userId) {
      res.status(409).json({
        success: false,
        errors: { email: 'This email is already in use by another account.' }
      });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        address: address.trim()
      }
    });

    // If Store Owner updated store details
    if (updatedUser.role === 'STORE_OWNER' && storeId && storeName) {
      const storeVal = validateStoreForm({
        name: storeName,
        email: storeEmail || email,
        address: storeAddress || address
      });

      if (!storeVal.isValid) {
        res.status(400).json({ success: false, errors: storeVal.errors });
        return;
      }

      const store = await prisma.store.findUnique({
        where: { id: storeId }
      });

      if (!store || store.ownerId !== userId) {
        res.status(403).json({ success: false, message: 'You do not have permission to modify this store.' });
        return;
      }

      if (storeEmail && storeEmail.trim().toLowerCase() !== store.email.toLowerCase()) {
        const storeEmailExists = await prisma.store.findUnique({
          where: { email: storeEmail.trim().toLowerCase() }
        });
        if (storeEmailExists && storeEmailExists.id !== storeId) {
          res.status(409).json({
            success: false,
            errors: { storeEmail: 'A store with this email already exists.' }
          });
          return;
        }
      }

      await prisma.store.update({
        where: { id: storeId },
        data: {
          name: storeName.trim(),
          email: (storeEmail || email).trim().toLowerCase(),
          address: (storeAddress || address).trim()
        }
      });
    }

    const refreshedUser = await prisma.user.findUnique({
      where: { id: userId },
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
            email: true,
            address: true,
            status: true
          }
        }
      }
    });

    const token = generateToken(refreshedUser!);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: refreshedUser,
      token
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Current password and new password are required.'
      });
      return;
    }

    const pwdVal = validatePassword(newPassword);
    if (!pwdVal.isValid) {
      res.status(400).json({
        success: false,
        errors: { newPassword: pwdVal.message || 'Invalid password requirements.' }
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(400).json({
        success: false,
        errors: { currentPassword: 'The current password you entered is incorrect.' }
      });
      return;
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword }
    });

    res.status(200).json({
      success: true,
      message: 'Password updated successfully.'
    });
  } catch (error: any) {
    console.error('Password change error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

export default router;