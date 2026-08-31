const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'order_status',
        'price_drop',
        'back_in_stock',
        'abandoned_cart',
        'promotion',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedEntityId: { type: String },
    deviceToken: { type: String },
    sentAt: { type: Date, default: Date.now, index: true },
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'failed'],
      default: 'pending',
    },
    errorInfo: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
