const Product = require('../models/Product');
const ProductActivity = require('../models/ProductActivity');
const BrowsingHistory = require('../models/BrowsingHistory');

exports.getProducts = async (req, res, next) => {
  try {
    const { category, subcategory, gender, brand, search, trending, page = 1, limit = 100, sort = '-createdAt' } = req.query;

    const query = {};
    if (category && category !== 'All') query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (gender) query.gender = gender;
    if (brand) query.brand = brand;
    if (trending === 'true') query.isTrending = true;

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [
        { name: searchRegex },
        { brand: searchRegex },
        { category: searchRegex },
        { subcategory: searchRegex },
        { tags: searchRegex },
      ];
    }

    let sortOptions = { createdAt: -1 };
    if (sort === 'price_asc') sortOptions = { price: 1 };
    else if (sort === 'price_desc') sortOptions = { price: -1 };
    else if (sort === 'rating') sortOptions = { rating: -1 };
    else if (sort === 'discount') sortOptions = { discountPercentage: -1 };
    else if (sort === 'popularity') sortOptions = { salesCount: -1 };
    else if (sort === 'newest') sortOptions = { createdAt: -1 };

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const mongoose = require('mongoose');
    const { generate2400Products } = require('../utils/catalogGenerator');

    if (mongoose.connection.readyState !== 1) {
      const { allProducts } = generate2400Products();
      let filtered = [...allProducts];

      if (category && category !== 'All') {
        filtered = filtered.filter((p) => p.category === category);
      }
      if (subcategory) {
        filtered = filtered.filter((p) => p.subcategory === subcategory);
      }
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(s) ||
            p.brand.toLowerCase().includes(s) ||
            p.category.toLowerCase().includes(s) ||
            p.subcategory.toLowerCase().includes(s)
        );
      }
      if (trending === 'true') {
        filtered = filtered.filter((p) => p.isTrending);
      }

      const total = filtered.length;
      const paginated = filtered.slice(skip, skip + limitNum);

      return res.json({
        success: true,
        count: paginated.length,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        products: paginated,
      });
    }

    let total = await Product.countDocuments(query);
    if (total === 0 && Object.keys(query).length === 0) {
      const { allProducts } = generate2400Products();
      try {
        await Product.insertMany(allProducts, { ordered: false });
        total = await Product.countDocuments(query);
      } catch (err) {
        return res.json({
          success: true,
          count: allProducts.length,
          total: allProducts.length,
          page: 1,
          pages: 1,
          products: allProducts,
        });
      }
    }

    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      products,
    });
  } catch (error) {
    next(error);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState !== 1) {
      const { allProducts } = generate2400Products();
      const product = allProducts.find(
        (p) => (p._id && p._id.toString() === id) || (p.slug && p.slug === id) || (p.id && p.id.toString() === id)
      ) || allProducts[0];

      return res.json({ success: true, product });
    }

    let product = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id);
    }
    if (!product) {
      product = await Product.findOne({ slug: id });
    }

    if (!product) {
      const { allProducts } = generate2400Products();
      product = allProducts.find(
        (p) => (p._id && p._id.toString() === id) || (p.slug && p.slug === id)
      ) || allProducts[0];
    }

    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

exports.trackProductView = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const { deviceId } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: 'Product not found' });
    }

    if (req.user) {
      const userId = req.user.id;

      // 1. Update/Upsert ProductActivity for Recently Viewed (latest 20 unique)
      await ProductActivity.findOneAndUpdate(
        { userId, productId },
        { activityType: 'view', viewedAt: new Date(), deviceId },
        { upsert: true, new: true }
      );

      // Enforce limit of 20 for ProductActivity
      const userActivities = await ProductActivity.find({ userId }).sort({ viewedAt: -1 });
      if (userActivities.length > 20) {
        const toDelete = userActivities.slice(20).map((act) => act._id);
        await ProductActivity.deleteMany({ _id: { $in: toDelete } });
      }

      // 2. Update/Upsert BrowsingHistory for Recommendation Engine (latest 50 unique)
      await BrowsingHistory.findOneAndUpdate(
        { userId, productId },
        { viewedAt: new Date() },
        { upsert: true, new: true }
      );

      const userHistory = await BrowsingHistory.find({ userId }).sort({ viewedAt: -1 });
      if (userHistory.length > 50) {
        const toDeleteHistory = userHistory.slice(50).map((h) => h._id);
        await BrowsingHistory.deleteMany({ _id: { $in: toDeleteHistory } });
      }
    }

    res.json({ success: true, message: 'View tracked successfully' });
  } catch (error) {
    next(error);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, category, price, discountPrice, stock, images, variants, isTrending } = req.body;
    if (!name || !description || !category || price === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide name, description, category, and price' });
    }

    const product = await Product.create({
      name,
      description,
      category,
      price,
      discountPrice,
      stock: stock || 0,
      images: images || [],
      variants: variants || [],
      isTrending: !!isTrending,
    });

    res.status(201).json({ success: true, message: 'Product created successfully', product });
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, message: 'Product updated successfully', product });
  } catch (error) {
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.seedProducts = async (req, res, next) => {
  try {
    const { generate2400Products } = require('../utils/catalogGenerator');
    await Product.deleteMany();
    const { allProducts } = generate2400Products();
    await Product.insertMany(allProducts, { ordered: false });
    const count = await Product.countDocuments();
    res.json({
      success: true,
      message: `Seeded ${count} products successfully across all 8 categories!`,
      count,
    });
  } catch (error) {
    next(error);
  }
};

exports.validateProducts = async (req, res, next) => {
  try {
    const products = await Product.find({});
    const skus = new Set();
    const slugs = new Set();
    const names = new Set();
    const images = new Set();

    let dupSKUs = 0;
    let dupSlugs = 0;
    let dupNames = 0;
    let dupImages = 0;
    let missingImages = 0;

    for (const p of products) {
      if (p.variants) {
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
      const pName = (p.name || '').trim().toLowerCase();
      if (names.has(pName)) dupNames++;
      else names.add(pName);

      if (!p.images || p.images.length === 0) {
        missingImages++;
      } else {
        const mainImg = p.images[0];
        if (images.has(mainImg)) dupImages++;
        else images.add(mainImg);
      }
    }

    const isPass = products.length > 0 && dupNames === 0 && dupSlugs === 0 && dupImages === 0 && missingImages === 0;

    res.json({
      success: true,
      result: {
        isPass,
        totalCount: products.length,
        dupNames,
        dupSlugs,
        dupImages,
        missingImages,
      },
    });
  } catch (error) {
    next(error);
  }
};

