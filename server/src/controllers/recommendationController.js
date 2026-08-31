const Product = require('../models/Product');
const BrowsingHistory = require('../models/BrowsingHistory');
const ProductActivity = require('../models/ProductActivity');
const Wishlist = require('../models/Wishlist');
const Order = require('../models/Order');

exports.getRecommendations = async (req, res, next) => {
  try {
    const { currentProductId, limit = 10 } = req.query;
    const limitNum = parseInt(limit, 10);

    const excludeProductIds = new Set();
    if (currentProductId) {
      excludeProductIds.add(currentProductId.toString());
    }

    // Default Fallback: Trending / Best Sellers for Anonymous users
    if (!req.user) {
      const fallbackProducts = await Product.find({
        stock: { $gt: 0 },
        _id: { $nin: Array.from(excludeProductIds) },
      })
        .sort({ isTrending: -1, salesCount: -1, rating: -1 })
        .limit(limitNum);

      return res.json({
        success: true,
        personalized: false,
        recommendations: fallbackProducts,
      });
    }

    const userId = req.user.id;

    // 1. Fetch User Data in Parallel
    const [browsing, activities, wishlist, orders] = await Promise.all([
      BrowsingHistory.find({ userId }).sort({ viewedAt: -1 }).limit(50).populate('productId'),
      ProductActivity.find({ userId }).sort({ viewedAt: -1 }).limit(20).populate('productId'),
      Wishlist.findOne({ userId }).populate('items.product'),
      Order.find({ userId }).limit(20),
    ]);

    // Track purchased products to exclude from recommendations
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.product) excludeProductIds.add(item.product.toString());
      });
    });

    // Calculate Category Affinity Scores
    const categoryScores = new Map();

    const addScore = (category, weight) => {
      if (!category) return;
      categoryScores.set(category, (categoryScores.get(category) || 0) + weight);
    };

    // Browsing History (weight: 2)
    browsing.forEach((item) => {
      if (item.productId && item.productId.category) {
        addScore(item.productId.category, 2);
      }
    });

    // Recently Viewed (weight: 3)
    activities.forEach((item) => {
      if (item.productId && item.productId.category) {
        addScore(item.productId.category, 3);
      }
    });

    // Wishlist Items (weight: 5)
    if (wishlist && wishlist.items) {
      wishlist.items.forEach((wItem) => {
        if (wItem.product && wItem.product.category) {
          addScore(wItem.product.category, 5);
        }
      });
    }

    // Sort categories by score descending
    const sortedCategories = Array.from(categoryScores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat);

    let recommendedProducts = [];

    if (sortedCategories.length > 0) {
      // Query top products in user's favorite categories
      recommendedProducts = await Product.find({
        category: { $in: sortedCategories },
        stock: { $gt: 0 },
        _id: { $nin: Array.from(excludeProductIds) },
      })
        .sort({ rating: -1, salesCount: -1 })
        .limit(limitNum);
    }

    // If recommended count is below limit, fill with Trending / Best Sellers
    if (recommendedProducts.length < limitNum) {
      const existingIds = new Set([
        ...Array.from(excludeProductIds),
        ...recommendedProducts.map((p) => p._id.toString()),
      ]);

      const fillCount = limitNum - recommendedProducts.length;
      const fillProducts = await Product.find({
        stock: { $gt: 0 },
        _id: { $nin: Array.from(existingIds) },
      })
        .sort({ salesCount: -1, isTrending: -1, rating: -1 })
        .limit(fillCount);

      recommendedProducts = [...recommendedProducts, ...fillProducts];
    }

    res.json({
      success: true,
      personalized: sortedCategories.length > 0,
      count: recommendedProducts.length,
      recommendations: recommendedProducts,
    });
  } catch (error) {
    next(error);
  }
};
