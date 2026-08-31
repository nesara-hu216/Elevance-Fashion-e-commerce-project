const Cart = require('../models/Cart');
const Order = require('../models/Order');
const NotificationLog = require('../models/NotificationLog');
const { sendPushNotification } = require('../services/notificationService');

const runAbandonedCartCheck = async () => {
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    // Find carts modified more than 2 hours ago that contain items
    const idleCarts = await Cart.find({
      'items.0': { $exists: true },
      lastUpdated: { $lte: twoHoursAgo },
    }).populate('items.product');

    console.log(`[Scheduled Job] Running Abandoned Cart check. Found ${idleCarts.length} idle carts.`);

    for (const cart of idleCarts) {
      // Check if user placed an order since last cart update
      const recentOrder = await Order.findOne({
        userId: cart.userId,
        createdAt: { $gte: cart.lastUpdated },
      });

      if (!recentOrder) {
        // Prevent duplicate push reminders within 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const existingLog = await NotificationLog.findOne({
          userId: cart.userId,
          type: 'abandoned_cart',
          sentAt: { $gte: twentyFourHoursAgo },
        });

        if (existingLog) {
          continue;
        }

        const firstItem = cart.items[0]?.product?.name || 'items';
        const itemCount = cart.items.reduce((acc, i) => acc + i.quantity, 0);

        await sendPushNotification({
          userId: cart.userId,
          type: 'abandoned_cart',
          title: '🛒 Forgot something in your cart?',
          message: `You left ${itemCount} item(s) including "${firstItem}" in your cart. Complete your order before items sell out!`,
          relatedEntityId: cart._id.toString(),
        });
      }
    }
  } catch (error) {
    console.error('[Abandoned Cart Job Error]', error.message);
  }
};

const startAbandonedCartScheduler = (intervalMs = 3600000) => { // Hourly default
  console.log('[Scheduler] Starting Abandoned Cart background job...');
  setInterval(runAbandonedCartCheck, intervalMs);
};

module.exports = { runAbandonedCartCheck, startAbandonedCartScheduler };
