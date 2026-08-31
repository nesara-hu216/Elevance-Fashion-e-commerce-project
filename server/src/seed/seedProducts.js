const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product');
const User = require('../models/User');
const connectDB = require('../config/db');
const { generate2400Products } = require('../utils/catalogGenerator');

dotenv.config();

const seedProducts = async () => {
  try {
    await connectDB();

    console.log('\n========================================');
    console.log('🚀 STARTING 2,400+ PRODUCT DATABASE SEED');
    console.log('========================================\n');

    console.log('[Seed] Clearing existing products collection...');
    await Product.deleteMany();

    console.log('[Seed] Checking demo user credentials...');
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

    const { women, men, footwear, jewellery, accessories, beauty, kids, sports, total, allProducts } = generate2400Products();

    console.log(`\n[Seed] Inserting ${total} products via MongoDB bulkInsert...`);
    const chunkSize = 500;
    for (let i = 0; i < allProducts.length; i += chunkSize) {
      const chunk = allProducts.slice(i, i + chunkSize);
      await Product.insertMany(chunk, { ordered: false });
      console.log(`   --> Inserted chunk ${Math.min(i + chunkSize, total)} / ${total} products...`);
    }

    console.log('\n[Seed] Creating optimized MongoDB database indexes...');
    await Product.createIndexes();

    console.log('\n----------------------------------------');
    console.log('🎉 PRODUCT SEED COMPLETE');
    console.log('----------------------------------------');
    console.log(`Women's Fashion:     ${women}`);
    console.log(`Men's Fashion:       ${men}`);
    console.log(`Footwear:            ${footwear}`);
    console.log(`Jewellery:           ${jewellery}`);
    console.log(`Accessories:         ${accessories}`);
    console.log(`Beauty:              ${beauty}`);
    console.log(`Kids:                ${kids}`);
    console.log(`Sports & Activewear: ${sports}`);
    console.log('----------------------------------------');
    console.log(`TOTAL: ${total} UNIQUE PRODUCTS`);
    console.log('----------------------------------------\n');

    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    console.error('[Seed Error]', error);
    if (require.main === module) {
      process.exit(1);
    }
  }
};

if (require.main === module) {
  seedProducts();
}

module.exports = seedProducts;
