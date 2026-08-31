const { Expo } = require('expo-server-sdk');
const DeviceToken = require('../models/DeviceToken');
const NotificationLog = require('../models/NotificationLog');
const NotificationPreference = require('../models/NotificationPreference');

const expo = new Expo();

exports.sendPushNotification = async ({ userId, type, title, message, relatedEntityId = null }) => {
  try {
    // 1. Check User Notification Preferences
    let preferences = await NotificationPreference.findOne({ userId });
    if (!preferences) {
      preferences = await NotificationPreference.create({ userId });
    }

    // Category mappings
    const categoryMap = {
      order_status: preferences.orderUpdates,
      price_drop: preferences.wishlistAlerts,
      back_in_stock: preferences.backInStock,
      abandoned_cart: preferences.cartReminders,
      promotion: preferences.promotions,
    };

    if (categoryMap[type] === false) {
      console.log(`[Notification Service] User ${userId} disabled notifications for type: ${type}`);
      return { success: false, reason: 'Disabled by user preference' };
    }

    // 2. Fetch Active Device Tokens
    const deviceTokens = await DeviceToken.find({ userId, isEnabled: true });
    if (!deviceTokens || deviceTokens.length === 0) {
      return { success: false, reason: 'No active device tokens found' };
    }

    const messages = [];
    for (const dt of deviceTokens) {
      if (!Expo.isExpoPushToken(dt.expoPushToken)) {
        console.warn(`[Push Warning] Invalid Expo token format: ${dt.expoPushToken}`);
        await DeviceToken.deleteOne({ _id: dt._id }); // Automatically clean invalid tokens
        continue;
      }

      messages.push({
        to: dt.expoPushToken,
        sound: 'default',
        title,
        body: message,
        data: { type, relatedEntityId },
      });
    }

    if (messages.length === 0) {
      return { success: false, reason: 'No valid Expo push tokens' };
    }

    // 3. Send Notification Chunks via Expo SDK
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('[Expo Send Chunk Error]', error.message);
      }
    }

    // 4. Inspect Receipts / Errors & Log Notifications
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      const targetToken = messages[i]?.to;

      const logStatus = ticket.status === 'ok' ? 'sent' : 'failed';
      const errorMsg = ticket.message || (ticket.details ? JSON.stringify(ticket.details) : null);

      await NotificationLog.create({
        userId,
        type,
        title,
        message,
        relatedEntityId,
        deviceToken: targetToken,
        sentAt: new Date(),
        status: logStatus,
        errorInfo: errorMsg,
      });

      // Cleanup invalid / unregistered device tokens
      if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
        console.log(`[Push Cleanup] Deactivating unregistered token: ${targetToken}`);
        await DeviceToken.deleteOne({ expoPushToken: targetToken });
      }
    }

    return { success: true, count: tickets.length };
  } catch (error) {
    console.error('[Notification Service Exception]', error.message);
    return { success: false, error: error.message };
  }
};
