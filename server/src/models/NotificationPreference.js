const mongoose = require('mongoose');

const notificationPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    orderUpdates: { type: Boolean, default: true },
    paymentUpdates: { type: Boolean, default: true },
    shippingUpdates: { type: Boolean, default: true },
    wishlistAlerts: { type: Boolean, default: true },
    backInStock: { type: Boolean, default: true },
    promotions: { type: Boolean, default: false },
    cartReminders: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  'NotificationPreference',
  notificationPreferenceSchema
);
