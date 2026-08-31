const mongoose = require('mongoose');
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const { generate2400Products } = require('../utils/catalogGenerator');

const inMemoryWishlists = new Map();

exports.getWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (mongoose.connection.readyState !== 1) {
      const items = inMemoryWishlists.get(userId) || [];
      return res.json({
        success: true,
        count: items.length,
        wishlist: items,
      });
    }

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

    if (mongoose.connection.readyState !== 1) {
      const { allProducts } = generate2400Products();
      const productObj = allProducts.find(
        (p) => (p._id && p._id.toString() === productId) || (p.slug && p.slug === productId)
      ) || { _id: productId, id: productId, name: 'Fashion Item', price: 999, images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600'] };

      let items = inMemoryWishlists.get(userId) || [];
      const exists = items.some(
        (item) => (item.product?._id || item.product?.id || item._id) === productId
      );

      if (!exists) {
        items.push({
          _id: 'w_' + Date.now(),
          product: productObj,
          priceAtAddition: productObj.discountPrice || productObj.price,
          addedAt: new Date(),
        });
        inMemoryWishlists.set(userId, items);
      }

      return res.json({
        success: true,
        message: 'Product added to wishlist',
        wishlist: items,
      });
    }

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

    if (mongoose.connection.readyState !== 1) {
      let items = inMemoryWishlists.get(userId) || [];
      items = items.filter(
        (item) => (item.product?._id || item.product?.id || item._id) !== productId
      );
      inMemoryWishlists.set(userId, items);
      return res.json({
        success: true,
        message: 'Product removed from wishlist',
        wishlist: items,
      });
    }

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
