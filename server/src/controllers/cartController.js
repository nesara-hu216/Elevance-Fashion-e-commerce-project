const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

const generateItemKey = (productId, variantId = 'default', size = 'Standard', color = 'Standard') => {
  return `${productId}_${variantId}_${size}_${color}`;
};

const inMemoryCarts = new Map();

const executeCartTransaction = async (userId, operationFn) => {
  if (mongoose.connection.readyState !== 1) {
    let cart = inMemoryCarts.get(userId) || { userId, items: [], savedItems: [] };
    const errorResult = await operationFn(cart);
    if (errorResult && errorResult.isErrorResponse) {
      return errorResult;
    }
    cart.lastUpdated = new Date();
    inMemoryCarts.set(userId, cart);
    return { success: true, cart };
  }

  let retries = 5;
  while (retries > 0) {
    try {
      let cart = await Cart.findOne({ userId });
      if (!cart) {
        cart = await Cart.create({ userId, items: [], savedItems: [] });
      }

      const errorResult = await operationFn(cart);
      if (errorResult && errorResult.isErrorResponse) {
        return errorResult;
      }

      cart.lastUpdated = new Date();
      await cart.save();

      const populatedCart = await Cart.findById(cart._id)
        .populate('items.product')
        .populate('savedItems.product');

      return { success: true, cart: populatedCart };
    } catch (error) {
      if ((error.name === 'VersionError' || error.code === 11000) && retries > 1) {
        retries--;
        await new Promise((r) => setTimeout(r, 50));
        continue;
      }
      throw error;
    }
  }
};

exports.getCart = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const cart = inMemoryCarts.get(req.user.id) || { items: [], savedItems: [] };
      const subtotal = (cart.items || []).reduce((acc, item) => {
        const p = item.product || {};
        const price = p.discountPrice || p.price || 999;
        return acc + price * (item.quantity || 1);
      }, 0);
      const totalItems = (cart.items || []).reduce((acc, item) => acc + (item.quantity || 1), 0);

      return res.json({
        success: true,
        cart: {
          items: cart.items || [],
          savedItems: cart.savedItems || [],
          subtotal,
          totalItems,
        },
      });
    }

    // Filter out deleted products
    const validItems = cart.items.filter((item) => item.product !== null);
    const validSaved = cart.savedItems.filter((item) => item.product !== null);

    const subtotal = validItems.reduce((acc, item) => {
      const price = item.product.discountPrice || item.product.price;
      return acc + price * item.quantity;
    }, 0);

    const totalItems = validItems.reduce((acc, item) => acc + item.quantity, 0);

    res.json({
      success: true,
      cart: {
        _id: cart._id,
        userId: cart.userId,
        items: validItems,
        savedItems: validSaved,
        subtotal,
        totalItems,
      },
    });
  } catch (error) {
    next(error);
  }
};

const findProductByIdOrSlug = async (productId) => {
  let product = null;
  if (mongoose.connection.readyState === 1) {
    try {
      if (mongoose.Types.ObjectId.isValid(productId)) {
        product = await Product.findById(productId);
      }
      if (!product) {
        product = await Product.findOne({ slug: productId });
      }
      if (!product) {
        product = await Product.findOne({ _id: productId });
      }
    } catch (e) {}
  }
  if (!product) {
    const { generate2400Products } = require('../utils/catalogGenerator');
    const { allProducts } = generate2400Products();
    const searchId = (productId || '').toString().toLowerCase();
    product = allProducts.find((p) => (p._id || p.id || p.slug || '').toString().toLowerCase() === searchId);
  }
  return product;
};

exports.addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, variantId = 'default', size = 'Standard', color = 'Standard', quantity = 1 } = req.body;

    const product = await findProductByIdOrSlug(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: `Only ${product.stock} items in stock` });
    }

    const itemKey = generateItemKey(productId, variantId, size, color);
    const currentPrice = product.discountPrice || product.price;

    const result = await executeCartTransaction(userId, async (cart) => {
      // If item was in savedItems, remove it
      cart.savedItems = cart.savedItems.filter((sItem) => sItem.itemKey !== itemKey);

      const existingIndex = cart.items.findIndex((item) => item.itemKey === itemKey);

      if (existingIndex > -1) {
        const newQty = cart.items[existingIndex].quantity + parseInt(quantity, 10);
        if (product.stock < newQty) {
          return { isErrorResponse: true, status: 400, message: `Insufficient stock for total requested quantity (${product.stock} available)` };
        }
        cart.items[existingIndex].quantity = newQty;
        cart.items[existingIndex].priceAtAddition = currentPrice;
      } else {
        cart.items.push({
          itemKey,
          product: productId,
          variantId,
          size,
          color,
          quantity: parseInt(quantity, 10),
          priceAtAddition: currentPrice,
        });
      }
    });

    if (result.isErrorResponse) {
      return res.status(result.status).json({ success: false, message: result.message });
    }

    res.json({ success: true, message: 'Item added to cart', cart: result.cart });
  } catch (error) {
    next(error);
  }
};

exports.updateQuantity = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { itemKey } = req.params;
    const { quantity } = req.body;

    const newQty = parseInt(quantity, 10);

    const result = await executeCartTransaction(userId, async (cart) => {
      const itemIndex = cart.items.findIndex((item) => item.itemKey === itemKey);
      if (itemIndex === -1) {
        return { isErrorResponse: true, status: 404, message: 'Item not found in cart' };
      }

      if (newQty <= 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        const product = await Product.findById(cart.items[itemIndex].product);
        if (product && product.stock < newQty) {
          return { isErrorResponse: true, status: 400, message: `Only ${product.stock} items available in stock` };
        }
        cart.items[itemIndex].quantity = newQty;
      }
    });

    if (result.isErrorResponse) {
      return res.status(result.status).json({ success: false, message: result.message });
    }

    res.json({ success: true, message: 'Cart updated', cart: result.cart });
  } catch (error) {
    next(error);
  }
};

exports.removeFromCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { itemKey } = req.params;

    const result = await executeCartTransaction(userId, async (cart) => {
      cart.items = cart.items.filter((item) => item.itemKey !== itemKey);
    });

    res.json({ success: true, message: 'Item removed', cart: result.cart });
  } catch (error) {
    next(error);
  }
};

exports.saveForLater = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { itemKey } = req.params;

    const result = await executeCartTransaction(userId, async (cart) => {
      const itemIndex = cart.items.findIndex((item) => item.itemKey === itemKey);
      if (itemIndex === -1) {
        return { isErrorResponse: true, status: 404, message: 'Item not found in cart' };
      }

      const cartItem = cart.items[itemIndex];
      cart.items.splice(itemIndex, 1);

      const savedIndex = cart.savedItems.findIndex((s) => s.itemKey === itemKey);
      if (savedIndex > -1) {
        cart.savedItems[savedIndex].quantity += cartItem.quantity;
      } else {
        cart.savedItems.push({
          itemKey: cartItem.itemKey,
          product: cartItem.product,
          variantId: cartItem.variantId,
          size: cartItem.size,
          color: cartItem.color,
          quantity: cartItem.quantity,
          priceAtAddition: cartItem.priceAtAddition,
          savedAt: new Date(),
        });
      }
    });

    if (result.isErrorResponse) {
      return res.status(result.status).json({ success: false, message: result.message });
    }

    res.json({ success: true, message: 'Item saved for later', cart: result.cart });
  } catch (error) {
    next(error);
  }
};

exports.moveToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { itemKey } = req.params;

    const result = await executeCartTransaction(userId, async (cart) => {
      const savedIndex = cart.savedItems.findIndex((item) => item.itemKey === itemKey);
      if (savedIndex === -1) {
        return { isErrorResponse: true, status: 404, message: 'Item not found in saved list' };
      }

      const savedItem = cart.savedItems[savedIndex];
      const product = await Product.findById(savedItem.product);

      if (!product || product.stock <= 0) {
        return { isErrorResponse: true, status: 400, message: 'Sorry, this product is currently out of stock' };
      }

      cart.savedItems.splice(savedIndex, 1);

      const existingCartIndex = cart.items.findIndex((item) => item.itemKey === itemKey);
      if (existingCartIndex > -1) {
        cart.items[existingCartIndex].quantity += savedItem.quantity;
      } else {
        cart.items.push({
          itemKey: savedItem.itemKey,
          product: savedItem.product,
          variantId: savedItem.variantId,
          size: savedItem.size,
          color: savedItem.color,
          quantity: savedItem.quantity,
          priceAtAddition: product.discountPrice || product.price,
        });
      }
    });

    if (result.isErrorResponse) {
      return res.status(result.status).json({ success: false, message: result.message });
    }

    res.json({ success: true, message: 'Item moved back to cart', cart: result.cart });
  } catch (error) {
    next(error);
  }
};

exports.validateCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ userId }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const warnings = [];
    const unavailableItems = [];
    let validSubtotal = 0;
    let hasIssues = false;

    for (const item of cart.items) {
      if (!item.product) {
        unavailableItems.push({ itemKey: item.itemKey, reason: 'Product deleted' });
        hasIssues = true;
        continue;
      }

      const product = item.product;
      const currentPrice = product.discountPrice || product.price;

      // Check Stock
      if (product.stock < item.quantity) {
        unavailableItems.push({
          itemKey: item.itemKey,
          name: product.name,
          requested: item.quantity,
          available: product.stock,
          reason: product.stock === 0 ? 'Out of stock' : `Only ${product.stock} left in stock`,
        });
        hasIssues = true;
      }

      // Check Price Change
      if (item.priceAtAddition !== currentPrice) {
        warnings.push({
          itemKey: item.itemKey,
          name: product.name,
          oldPrice: item.priceAtAddition,
          newPrice: currentPrice,
          message: `Price updated for "${product.name}" from ₹${item.priceAtAddition} to ₹${currentPrice}.`,
        });
      }

      validSubtotal += currentPrice * item.quantity;
    }

    const tax = Math.round(validSubtotal * 0.18); // 18% GST standard
    const shipping = validSubtotal > 999 ? 0 : 99;
    const grandTotal = validSubtotal + tax + shipping;

    res.json({
      success: !hasIssues,
      hasIssues,
      warnings,
      unavailableItems,
      totals: {
        subtotal: validSubtotal,
        tax,
        shipping,
        grandTotal,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.clearCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await executeCartTransaction(userId, async (cart) => {
      cart.items = [];
    });

    res.json({ success: true, message: 'Cart cleared successfully', cart: result.cart });
  } catch (error) {
    next(error);
  }
};

