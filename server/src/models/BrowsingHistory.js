const mongoose = require('mongoose');

const browsingHistorySchema = new mongoose.Schema(
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
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

browsingHistorySchema.index({ userId: 1, viewedAt: -1 });
browsingHistorySchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('BrowsingHistory', browsingHistorySchema);
