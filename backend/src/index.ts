import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import userRoutes from './routes/user.routes';
import storeOwnerRoutes from './routes/storeOwner.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for dev/evaluation
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Middleware for API route prefix normalizer on Vercel
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    // Already prefixed
    next();
  } else {
    // Add /api prefix for internal routing
    req.url = '/api' + req.url;
    next();
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/store-owner', storeOwnerRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

// Only listen on port when not running as a Vercel serverless function
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Store Rating Backend Server running at http://localhost:${PORT}`);
  });
}

export default app;