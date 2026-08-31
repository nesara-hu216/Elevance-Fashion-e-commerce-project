const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product');
const connectDB = require('../config/db');

dotenv.config();

const cleanupDuplicateProducts = async () => {
  try {
    await connectDB();

    console.log('\n========================================');
    console.log('🧹 STARTING DATABASE DUPLICATE CLEANUP');
    console.log('========================================\n');

    const allProducts = await Product.find({}).sort({ createdAt: 1 });
    console.log(`[Cleanup] Scanning ${allProducts.length} total database records...`);

    const seenNames = new Set();
    const seenSlugs = new Set();
    const duplicateIds = [];
    const categoryDups = {
      Women: 0,
      Men: 0,
      Footwear: 0,
      Jewellery: 0,
      Accessories: 0,
      Beauty: 0,
      Kids: 0,
      'Sports & Activewear': 0,
      Other: 0,
    };

    for (const prod of allProducts) {
      const nameKey = (prod.name || '').trim().toLowerCase();
      const slugKey = (prod.slug || '').trim().toLowerCase();

      let isDuplicate = false;

      if (seenNames.has(nameKey) || (slugKey && seenSlugs.has(slugKey))) {
        isDuplicate = true;
      } else {
        seenNames.add(nameKey);
        if (slugKey) seenSlugs.add(slugKey);
      }

      if (isDuplicate) {
        duplicateIds.push(prod._id);
        const cat = prod.category || 'Other';
        if (categoryDups[cat] !== undefined) {
          categoryDups[cat]++;
        } else {
          categoryDups.Other++;
        }
      }
    }

    if (duplicateIds.length > 0) {
      console.log(`[Cleanup] Deleting ${duplicateIds.length} duplicate records...`);
      await Product.deleteMany({ _id: { $in: duplicateIds } });
    } else {
      console.log('[Cleanup] 0 duplicate records found.');
    }

    const remainingCount = await Product.countDocuments();

    console.log('\n----------------------------------------');
    console.log('🎉 DUPLICATE CLEANUP COMPLETE');
    console.log('----------------------------------------');
    console.log('Duplicates Removed:');
    console.log(`Women:               ${categoryDups.Women}`);
    console.log(`Men:                 ${categoryDups.Men}`);
    console.log(`Footwear:            ${categoryDups.Footwear}`);
    console.log(`Jewellery:           ${categoryDups.Jewellery}`);
    console.log(`Accessories:         ${categoryDups.Accessories}`);
    console.log(`Beauty:              ${categoryDups.Beauty}`);
    console.log(`Kids:                ${categoryDups.Kids}`);
    console.log(`Sports & Activewear: ${categoryDups['Sports & Activewear']}`);
    console.log('----------------------------------------');
    console.log(`TOTAL REMOVED:       ${duplicateIds.length}`);
    console.log(`REMAINING UNIQUE:    ${remainingCount}`);
    console.log('----------------------------------------\n');

    if (require.main === module) {
      process.exit(0);
    }
    return { duplicateIds: duplicateIds.length, remainingCount };
  } catch (error) {
    console.error('[Cleanup Error]', error);
    if (require.main === module) {
      process.exit(1);
    }
  }
};

if (require.main === module) {
  cleanupDuplicateProducts();
}

module.exports = cleanupDuplicateProducts;
