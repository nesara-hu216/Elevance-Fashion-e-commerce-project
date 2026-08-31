const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const fetchFromApi = () => {
  return new Promise((resolve) => {
    http.get('http://localhost:5000/api/products?limit=5000', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.products || parsed.data || null);
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
};

const validateProducts = async () => {
  try {
    console.log('\n=========================================');
    console.log('PRODUCT CATALOG VALIDATION');
    console.log('=========================================\n');

    let products = await fetchFromApi();

    if (!products) {
      const Product = require('./src/models/Product');
      const connectDB = require('./src/config/db');
      await connectDB();
      products = await Product.find({});
    }

    const totalProducts = products.length;

    const ids = new Set();
    const skus = new Set();
    const slugs = new Set();
    const images = new Set();
    const fingerprints = new Set();

    let dupImages = 0;
    let dupSKUs = 0;
    let dupSlugs = 0;
    let dupFingerprints = 0;

    let wrongCategories = 0;
    let wrongSubcategories = 0;
    let wrongCategoryImages = 0;
    let missingImages = 0;

    const validCategories = [
      'Women',
      'Men',
      'Footwear',
      'Jewellery',
      'Accessories',
      'Beauty',
      'Kids',
      'Sports & Activewear',
    ];

    for (const p of products) {
      const pId = p._id ? p._id.toString() : p.id;
      ids.add(pId);

      if (!validCategories.includes(p.category)) {
        wrongCategories++;
      }

      if (!p.subcategory || p.subcategory.trim() === '') {
        wrongSubcategories++;
      }

      if (p.variants && p.variants.length > 0) {
        for (const v of p.variants) {
          if (v.sku) {
            if (skus.has(v.sku)) dupSKUs++;
            else skus.add(v.sku);
          }
        }
      }

      if (p.slug) {
        if (slugs.has(p.slug)) dupSlugs++;
        else slugs.add(p.slug);
      }

      if (!p.images || p.images.length === 0 || !p.images[0]) {
        missingImages++;
      } else {
        const imgUrl = p.images[0];
        if (images.has(imgUrl)) dupImages++;
        else images.add(imgUrl);

        const fp = `${p.category}_${p.subcategory}_${p.name}_${imgUrl}`;
        if (fingerprints.has(fp)) dupFingerprints++;
        else fingerprints.add(fp);
      }
    }

    const isPass =
      totalProducts > 0 &&
      dupImages === 0 &&
      dupSKUs === 0 &&
      dupSlugs === 0 &&
      dupFingerprints === 0 &&
      wrongCategories === 0 &&
      wrongSubcategories === 0 &&
      wrongCategoryImages === 0 &&
      missingImages === 0;

    console.log(`Total Products:          ${totalProducts}`);
    console.log(`Unique Product IDs:      ${ids.size}`);
    console.log(`Unique SKUs:             ${skus.size}`);
    console.log(`Unique Slugs:            ${slugs.size}`);
    console.log(`Unique Image URLs:       ${images.size}\n`);

    console.log(`Duplicate Images:        ${dupImages}`);
    console.log(`Duplicate SKUs:          ${dupSKUs}`);
    console.log(`Duplicate Slugs:         ${dupSlugs}`);
    console.log(`Duplicate Fingerprints:  ${dupFingerprints}\n`);

    console.log(`Wrong Categories:        ${wrongCategories}`);
    console.log(`Wrong Subcategories:     ${wrongSubcategories}`);
    console.log(`Wrong Category Images:   ${wrongCategoryImages}`);
    console.log(`Missing Images:          ${missingImages}\n`);

    console.log('=========================================');
    console.log(`STATUS:                  ${isPass ? 'PASS ✅' : 'FAIL ❌'}`);
    console.log('=========================================\n');

    if (require.main === module) {
      process.exit(0);
    }
    return { isPass, totalProducts, dupImages, dupSKUs, dupSlugs, dupFingerprints };
  } catch (error) {
    console.error('[Validation Error]', error);
    if (require.main === module) {
      process.exit(1);
    }
  }
};

if (require.main === module) {
  validateProducts();
}

module.exports = validateProducts;
