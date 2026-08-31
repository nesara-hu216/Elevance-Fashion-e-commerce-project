const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

exports.getWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let wishlist = await Wishlist.findOne({ userId }).populate('items.product');

    if (!wishlist) {
      wishlist = await Wishlist.create({ userId, items: [] });
    }

    const validItems = wishlist.items.filter((item) => item.product !== null);

    res.json({
      success: true,
      count: validItems.length,
      wishlist: validItems,
    });
  } catch (error) {
    next(error);
  }
};

exports.addToWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = await Wishlist.create({ userId, items: [] });
    }

    const exists = wishlist.items.some(
      (item) => item.product.toString() === productId.toString()
    );

    if (!exists) {
      wishlist.items.push({
        product: productId,
        priceAtAddition: product.discountPrice || product.price,
        addedAt: new Date(),
      });
      await wishlist.save();
    }

    const updated = await Wishlist.findById(wishlist._id).populate('items.product');
    res.json({ success: true, message: 'Product added to wishlist', wishlist: updated.items });
  } catch (error) {
    next(error);
  }
};

exports.removeFromWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    let wishlist = await Wishlist.findOne({ userId });
    if (wishlist) {
      wishlist.items = wishlist.items.filter(
        (item) => item.product.toString() !== productId.toString()
      );
      await wishlist.save();
    }

    const updated = await Wishlist.findOne({ userId }).populate('items.product');
    res.json({
      success: true,
      message: 'Product removed from wishlist',
      wishlist: updated ? updated.items : [],
    });
  } catch (error) {
    next(error);
  }
};
