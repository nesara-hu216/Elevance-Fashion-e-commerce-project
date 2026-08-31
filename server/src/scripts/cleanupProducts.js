const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product');
const connectDB = require('../config/db');

dotenv.config();

const cleanupProducts = async () => {
  try {
    await connectDB();

    console.log('\n========================================');
    console.log('🧹 STARTING PRODUCT CATALOG DEDUPLICATION');
    console.log('========================================\n');

    const products = await Product.find({});
    console.log(`[Cleanup] Found ${products.length} existing catalog records.`);

    const seenImages = new Set();
    const seenSlugs = new Set();
    const seenFingerprints = new Set();

    let removedCount = 0;

    for (const p of products) {
      const imgUrl = (p.images && p.images[0]) ? p.images[0] : null;
      const fingerprint = `${p.category}_${p.subcategory}_${p.name}_${imgUrl}`;

      let isDuplicate = false;

      if (!imgUrl || seenImages.has(imgUrl)) {
        isDuplicate = true;
      }
      if (p.slug && seenSlugs.has(p.slug)) {
        isDuplicate = true;
      }
      if (seenFingerprints.has(fingerprint)) {
        isDuplicate = true;
      }

      if (isDuplicate) {
        await Product.deleteOne({ _id: p._id });
        removedCount++;
      } else {
        if (imgUrl) seenImages.add(imgUrl);
        if (p.slug) seenSlugs.add(p.slug);
        seenFingerprints.add(fingerprint);
      }
    }

    console.log(`[Cleanup] Removed ${removedCount} duplicate product records.`);
    const remaining = await Product.countDocuments();
    console.log(`[Cleanup] Remaining unique clean records: ${remaining}`);
    console.log('========================================\n');

    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    console.error('[Cleanup Error]', error);
    if (require.main === module) {
      process.exit(1);
    }
  }
};

if (require.main === module) {
  cleanupProducts();
}

module.exports = cleanupProducts;
