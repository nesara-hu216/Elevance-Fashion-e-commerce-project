const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product');
const connectDB = require('../config/db');

dotenv.config();

const validateCatalog = async () => {
  try {
    await connectDB();

    console.log('\n========================================');
    console.log('🔍 PRODUCT CATALOG VALIDATION');
    console.log('========================================\n');

    const products = await Product.find({});
    const totalCount = products.length;

    const skus = new Set();
    const slugs = new Set();
    const names = new Set();
    const images = new Set();

    let dupSKUs = 0;
    let dupSlugs = 0;
    let dupNames = 0;
    let dupImages = 0;
    let missingImages = 0;

    const categoryCounts = {};

    for (const p of products) {
      const cat = p.category || 'Other';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

      // SKU check
      if (p.variants && p.variants.length > 0) {
        for (const v of p.variants) {
          if (v.sku) {
            if (skus.has(v.sku)) dupSKUs++;
            else skus.add(v.sku);
          }
        }
      }

      // Slug check
      if (p.slug) {
        if (slugs.has(p.slug)) dupSlugs++;
        else slugs.add(p.slug);
      }

      // Name check
      const pName = (p.name || '').trim().toLowerCase();
      if (names.has(pName)) dupNames++;
      else names.add(pName);

      // Image check
      if (!p.images || p.images.length === 0) {
        missingImages++;
      } else {
        const mainImg = p.images[0];
        if (images.has(mainImg)) dupImages++;
        else images.add(mainImg);
      }
    }

    const isPass = totalCount > 0 && dupNames === 0 && dupSlugs === 0 && dupImages === 0 && missingImages === 0;

    console.log(`Total Products:       ${totalCount}`);
    console.log('Category Counts:');
    Object.keys(categoryCounts).forEach((cat) => {
      console.log(`  - ${cat}: ${categoryCounts[cat]}`);
    });

    console.log('\n----------------------------------------');
    console.log(`Unique SKUs:          ${skus.size} (Duplicates: ${dupSKUs})`);
    console.log(`Unique Slugs:         ${slugs.size} (Duplicates: ${dupSlugs})`);
    console.log(`Unique Product Names: ${names.size} (Duplicates: ${dupNames})`);
    console.log(`Unique Image URLs:    ${images.size} (Duplicates: ${dupImages})`);
    console.log(`Missing Images:       ${missingImages}`);
    console.log('----------------------------------------');
    console.log(`STATUS:               ${isPass ? 'PASS ✅' : 'WARN ⚠️'}`);
    console.log('----------------------------------------\n');

    if (require.main === module) {
      process.exit(0);
    }
    return { isPass, totalCount, dupNames, dupSlugs, dupImages, missingImages };
  } catch (error) {
    console.error('[Validation Error]', error);
    if (require.main === module) {
      process.exit(1);
    }
  }
};

if (require.main === module) {
  validateCatalog();
}

module.exports = validateCatalog;
