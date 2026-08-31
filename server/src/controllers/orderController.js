const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ReturnRequest = require('../models/ReturnRequest');
const { generateInvoicePDF } = require('../services/invoiceService');
const { sendPushNotification } = require('../services/notificationService');

const findOrderByIdOrNumber = async (id, userId) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  const conditions = isObjectId ? [{ _id: id }, { orderId: id }] : [{ orderId: id }];
  return await Order.findOne({ $or: conditions, userId });
};

exports.createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { deliveryAddress, paymentMethod = 'card' } = req.body;

    if (!deliveryAddress || !deliveryAddress.fullName || !deliveryAddress.addressLine1 || !deliveryAddress.city || !deliveryAddress.zipCode) {
      return res.status(400).json({ success: false, message: 'Complete delivery address is required' });
    }

    const cart = await Cart.findOne({ userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cannot place order with an empty cart' });
    }

    // 1. Stock & Price Validation
    const orderItems = [];
    let subtotal = 0;

    for (const item of cart.items) {
      if (!item.product) {
        return res.status(400).json({ success: false, message: 'One or more products in your cart are no longer available' });
      }

      const product = item.product;
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Stock insufficient for "${product.name}". Only ${product.stock} items left.`,
        });
      }

      const itemPrice = product.discountPrice || product.price;

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.images[0] || '',
        variantId: item.variantId,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        price: itemPrice,
      });

      subtotal += itemPrice * item.quantity;
    }

    // 2. Calculate Totals
    const taxTotal = Math.round(subtotal * 0.18);
    const shippingTotal = subtotal > 999 ? 0 : 99;
    const grandTotal = subtotal + taxTotal + shippingTotal;

    // 3. Generate Order IDs
    const timestamp = Date.now();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderId = `ORD-${timestamp}-${randomSuffix}`;
    const invoiceNumber = `INV-${timestamp}`;

    // 4. Deduct Stock Atomically
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity, salesCount: item.quantity },
      });
    }

    // 5. Create Order Document
    const order = await Order.create({
      orderId,
      invoiceNumber,
      userId,
      items: orderItems,
      subtotal,
      taxTotal,
      shippingTotal,
      grandTotal,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
      orderStatus: 'placed',
      deliveryAddress,
      deliveryTimeline: [
        {
          status: 'placed',
          message: 'Order placed successfully.',
          timestamp: new Date(),
        },
      ],
    });

    // 6. Clear Cart Items
    cart.items = [];
    cart.lastUpdated = new Date();
    await cart.save();

    // 7. Send Order Confirmation Push Notification
    sendPushNotification({
      userId,
      type: 'order_status',
      title: '📦 Order Placed Successfully!',
      message: `Your order #${orderId} for ₹${grandTotal} has been confirmed and is being processed.`,
      relatedEntityId: orderId,
    });

    res.status(201).json({ success: true, message: 'Order created successfully', order });
  } catch (error) {
    next(error);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status, paymentMethod, sort = '-createdAt' } = req.query;

    const query = { userId };
    if (status) query.orderStatus = status;
    if (paymentMethod) query.paymentMethod = paymentMethod;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      count: orders.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      orders,
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await findOrderByIdOrNumber(id, req.user.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

exports.cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await findOrderByIdOrNumber(id, req.user.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Cancellation Rule Enforcement
    const cancellableStatuses = ['placed', 'confirmed', 'processing'];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status "${order.orderStatus}". Orders that are shipped or delivered cannot be cancelled directly.`,
      });
    }

    // Restore Product Stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, salesCount: -item.quantity },
      });
    }

    order.orderStatus = 'cancelled';
    order.deliveryTimeline.push({
      status: 'cancelled',
      message: 'Order cancelled by customer.',
      timestamp: new Date(),
    });

    await order.save();

    sendPushNotification({
      userId: req.user.id,
      type: 'order_status',
      title: '❌ Order Cancelled',
      message: `Your order #${order.orderId} has been cancelled.`,
      relatedEntityId: order.orderId,
    });

    res.json({ success: true, message: 'Order cancelled successfully', order });
  } catch (error) {
    next(error);
  }
};

exports.requestReturn = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, items } = req.body;

    const order = await findOrderByIdOrNumber(id, req.user.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.orderStatus !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Return requests can only be placed for delivered orders.',
      });
    }

    // Check 7-day eligibility window
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const deliveredTimeline = order.deliveryTimeline.find((t) => t.status === 'delivered');
    const deliveryDate = deliveredTimeline ? new Date(deliveredTimeline.timestamp) : new Date(order.updatedAt);

    if (Date.now() - deliveryDate.getTime() > sevenDaysMs) {
      return res.status(400).json({
        success: false,
        message: 'Return window expired. Returns must be requested within 7 days of delivery.',
      });
    }

    const returnReq = await ReturnRequest.create({
      orderId: order.orderId,
      userId: req.user.id,
      items: items || order.items.map((i) => ({ product: i.product, variantId: i.variantId, quantity: i.quantity })),
      reason: reason || 'Not satisfied with item',
      status: 'pending',
      requestedAt: new Date(),
    });

    res.status(201).json({ success: true, message: 'Return request submitted', returnRequest: returnReq });
  } catch (error) {
    next(error);
  }
};

exports.reorder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await findOrderByIdOrNumber(id, userId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({ userId, items: [], savedItems: [] });
    }

    const addedItems = [];
    const unavailableItems = [];

    for (const orderItem of order.items) {
      const product = await Product.findById(orderItem.product);
      if (!product || product.stock <= 0) {
        unavailableItems.push(orderItem.name);
        continue;
      }

      const itemKey = `${orderItem.product}_${orderItem.variantId}_${orderItem.size}_${orderItem.color}`;
      const currentPrice = product.discountPrice || product.price;

      const existingIndex = cart.items.findIndex((i) => i.itemKey === itemKey);
      if (existingIndex > -1) {
        cart.items[existingIndex].quantity += orderItem.quantity;
      } else {
        cart.items.push({
          itemKey,
          product: orderItem.product,
          variantId: orderItem.variantId,
          size: orderItem.size,
          color: orderItem.color,
          quantity: Math.min(orderItem.quantity, product.stock),
          priceAtAddition: currentPrice,
        });
      }
      addedItems.push(orderItem.name);
    }

    cart.lastUpdated = new Date();
    await cart.save();

    const updatedCart = await Cart.findById(cart._id).populate('items.product');

    res.json({
      success: true,
      message: `Reordered ${addedItems.length} items.`,
      addedItems,
      unavailableItems,
      cart: updatedCart,
    });
  } catch (error) {
    next(error);
  }
};

exports.downloadInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await findOrderByIdOrNumber(id, req.user.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const pdfBuffer = await generateInvoicePDF(order, req.user);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice_${order.invoiceNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { orderStatus, message } = req.body;

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const conditions = isObjectId ? [{ _id: id }, { orderId: id }] : [{ orderId: id }];
    const order = await Order.findOne({ $or: conditions });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (orderStatus) {
      order.orderStatus = orderStatus;
      order.deliveryTimeline.push({
        status: orderStatus,
        message: message || `Order status updated to ${orderStatus}.`,
        timestamp: new Date(),
      });
      await order.save();
    }

    res.json({ success: true, message: 'Order status updated', order });
  } catch (error) {
    next(error);
  }
};

