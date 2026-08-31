const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { startAbandonedCartScheduler } = require('./jobs/abandonedCartJob');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Enable CORS
app.use(cors());

// Raw body parser support for Stripe Webhook signature validation
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const activityRoutes = require('./routes/activityRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const themeRoutes = require('./routes/themeRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Mount API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users/me', activityRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/theme', themeRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

// Static Frontend Client Serving (Expo Web Build)
const getClientBuildPath = () => {
  const candidatePaths = [
    path.join(__dirname, 'web-build'),
    path.join(__dirname, '../web-build'),
    path.join(__dirname, '../../client/web-build'),
    path.join(process.cwd(), 'web-build'),
    path.join(process.cwd(), 'client/web-build'),
    path.join(process.cwd(), 'server/web-build'),
    path.join(process.cwd(), 'server/src/web-build'),
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(path.join(p, 'index.html'))) {
      return p;
    }
  }
  return path.join(__dirname, '../web-build');
};

const clientBuildPath = getClientBuildPath();
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
}

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    service: 'Elevance E-Commerce REST API',
  });
});

// Root Endpoint - Always serve frontend HTML
app.get('/', (req, res, next) => {
  const indexHtml = path.join(clientBuildPath, 'index.html');
  if (fs.existsSync(indexHtml)) {
    return res.sendFile(indexHtml);
  }
  const localSrcHtml = path.join(__dirname, 'web-build/index.html');
  if (fs.existsSync(localSrcHtml)) {
    return res.sendFile(localSrcHtml);
  }
  res.send(`<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>Elevance Fashion</title></head><body><div id="root"></div></body></html>`);
});

// Catch-all SPA Client Routing Fallback - Always serve frontend HTML
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const indexHtml = path.join(clientBuildPath, 'index.html');
  if (fs.existsSync(indexHtml)) {
    return res.sendFile(indexHtml);
  }
  const localSrcHtml = path.join(__dirname, 'web-build/index.html');
  if (fs.existsSync(localSrcHtml)) {
    return res.sendFile(localSrcHtml);
  }
  next();
});

// Global Error Handler Middleware
app.use(errorHandler);

// Start Background Abandoned Cart Scheduler
startAbandonedCartScheduler();

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Elevance E-Commerce Server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
