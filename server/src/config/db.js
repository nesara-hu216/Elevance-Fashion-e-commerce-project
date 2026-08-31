const mongoose = require('mongoose');

const autoSeedIfNeeded = async () => {
  try {
    const Product = require('../models/Product');
    const User = require('../models/User');
    const count = await Product.countDocuments();
    if (count === 0) {
      console.log('[MongoDB Auto-Seed] Populating 117 clean catalog items across all 8 departments...');
      const { generate2400Products } = require('../utils/catalogGenerator');
      const { total, allProducts } = generate2400Products();
      await Product.insertMany(allProducts, { ordered: false });

      const demoUser = await User.findOne({ email: 'alex@example.com' });
      if (!demoUser) {
        await User.create({
          name: 'Alex Johnson',
          email: 'alex@example.com',
          password: 'password123',
          themePreference: 'system',
          role: 'user',
        });
      }
      console.log(`[MongoDB Auto-Seed] Successfully inserted ${total} unique products across all 8 categories!`);
    }
  } catch (err) {
    console.error('[MongoDB Auto-Seed Error]', err.message);
  }
};

let isConnected = false;

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return;
  }
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/elevance_ecommerce';

    try {
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 2000,
      });
      isConnected = true;
      console.log(`[MongoDB] Connected to Host: ${conn.connection.host}`);
      await autoSeedIfNeeded();
      return;
    } catch (err) {
      console.log(`[MongoDB Warning] Local Mongo not found on ${mongoUri}. Starting in-memory database...`);
      const fs = require('fs');
      const dbPath = 'D:\\tmp\\mongo_dbdata';
      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
      }
      if (!process.env.MONGOMS_DOWNLOAD_DIR) {
        process.env.MONGOMS_DOWNLOAD_DIR = 'D:\\tmp\\mongodb';
      }
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create({
        binary: { downloadDir: process.env.MONGOMS_DOWNLOAD_DIR },
        instance: { dbPath }
      });
      const inMemoryUri = mongod.getUri();
      const conn = await mongoose.connect(inMemoryUri);
      console.log(`[MongoDB Memory Server] Connected cleanly at: ${inMemoryUri}`);
      await autoSeedIfNeeded();
    }
  } catch (error) {
    console.error(`[MongoDB Error] ${error.message}`);
  }
};

module.exports = connectDB;
