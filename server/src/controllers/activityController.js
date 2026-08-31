const ProductActivity = require('../models/ProductActivity');
const BrowsingHistory = require('../models/BrowsingHistory');
const Product = require('../models/Product');
const Order = require('../models/Order');

exports.getRecentlyViewed = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const activities = await ProductActivity.find({ userId })
      .sort({ viewedAt: -1 })
      .limit(20)
      .populate('productId');

    const products = activities
      .filter((act) => act.productId !== null)
      .map((act) => ({
        ...act.productId.toObject(),
        viewedAt: act.viewedAt,
      }));

    res.json({
      success: true,
      count: products.length,
      recentlyViewed: products,
    });
  } catch (error) {
    next(error);
  }
};

exports.syncRecentlyViewed = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { localItems = [] } = req.body; // [{ productId, viewedAt }]

    // 1. Fetch server activities
    const serverActivities = await ProductActivity.find({ userId });

    // 2. Map of productId -> latest timestamp
    const itemMap = new Map();

    serverActivities.forEach((act) => {
      if (act.productId) {
        itemMap.set(act.productId.toString(), new Date(act.viewedAt).getTime());
      }
    });

    localItems.forEach((item) => {
      const pId = item.productId || item._id;
      if (!pId) return;
      const localTime = new Date(item.viewedAt || Date.now()).getTime();
      const existingTime = itemMap.get(pId.toString());

      if (!existingTime || localTime > existingTime) {
        itemMap.set(pId.toString(), localTime);
      }
    });

    // 3. Sort entries by timestamp descending
    const sortedProductActivity = Array.from(itemMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    const sortedBrowsingHistory = Array.from(itemMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50);

    // 4. Update Database atomically for Recently Viewed (ProductActivity: top 20)
    await ProductActivity.deleteMany({ userId });
    const newDocs = sortedProductActivity.map(([productId, timestamp]) => ({
      userId,
      productId,
      viewedAt: new Date(timestamp),
      activityType: 'view',
    }));
    if (newDocs.length > 0) {
      await ProductActivity.insertMany(newDocs);
    }

    // 5. Update BrowsingHistory (top 50) for Recommendation engine
    await BrowsingHistory.deleteMany({ userId });
    const historyDocs = sortedBrowsingHistory.map(([productId, timestamp]) => ({
      userId,
      productId,
      viewedAt: new Date(timestamp),
    }));
    if (historyDocs.length > 0) {
      await BrowsingHistory.insertMany(historyDocs);
    }

    // 5. Fetch updated populated products
    const updatedActivities = await ProductActivity.find({ userId })
      .sort({ viewedAt: -1 })
      .populate('productId');

    const mergedProducts = updatedActivities
      .filter((act) => act.productId !== null)
      .map((act) => ({
        ...act.productId.toObject(),
        viewedAt: act.viewedAt,
      }));

    res.json({
      success: true,
      count: mergedProducts.length,
      recentlyViewed: mergedProducts,
    });
  } catch (error) {
    next(error);
  }
};

exports.getContinueShopping = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch user recently viewed
    const activities = await ProductActivity.find({ userId })
      .sort({ viewedAt: -1 })
      .limit(20)
      .populate('productId');

    const viewedProducts = activities
      .filter((act) => act.productId !== null)
      .map((act) => act.productId);

    // Fetch user recent orders within 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentOrders = await Order.find({
      userId,
      createdAt: { $gte: thirtyDaysAgo },
      orderStatus: { $ne: 'cancelled' },
    });

    const purchasedProductIds = new Set();
    recentOrders.forEach((order) => {
      order.items.forEach((item) => {
        purchasedProductIds.add(item.product.toString());
      });
    });

    // Filter products: not purchased recently & available/in stock prioritize
    const continueShoppingItems = viewedProducts
      .filter((product) => !purchasedProductIds.has(product._id.toString()))
      .slice(0, 10);

    res.json({
      success: true,
      count: continueShoppingItems.length,
      products: continueShoppingItems,
    });
  } catch (error) {
    next(error);
  }
};
