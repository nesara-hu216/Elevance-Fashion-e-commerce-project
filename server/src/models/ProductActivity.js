const mongoose = require('mongoose');

const productActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    activityType: {
      type: String,
      enum: ['view', 'cart_add', 'wishlist_add'],
      default: 'view',
    },
    viewedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    deviceId: {
      type: String,
    },
  },
  { timestamps: true }
);

productActivitySchema.index({ userId: 1, viewedAt: -1 });
productActivitySchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('ProductActivity', productActivitySchema);
