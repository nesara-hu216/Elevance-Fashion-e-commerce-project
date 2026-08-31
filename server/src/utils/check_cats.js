const connectDB = require('../config/db');
const Product = require('../models/Product');

async function check() {
  await connectDB();
  const cats = await Product.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);
  console.log('--- CATEGORY BREAKDOWN IN DB ---');
  console.log(cats);

  const subcats = await Product.aggregate([
    { $group: { _id: { category: '$category', subcategory: '$subcategory' }, count: { $sum: 1 } } }
  ]);
  console.log('--- SUBCATEGORY BREAKDOWN IN DB ---');
  console.log(subcats);

  // Check Women category for men items
  const womenItems = await Product.find({ category: 'Women' });
  console.log('--- WOMEN PRODUCTS SAMPLE ---');
  womenItems.forEach(p => {
    console.log(`- ID: ${p._id}, Name: ${p.name}, Sub: ${p.subcategory}, Gender: ${p.gender}, Img: ${p.images[0]}`);
  });

  process.exit(0);
}

check();
