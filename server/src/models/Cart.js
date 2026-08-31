const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  itemKey: {
    type: String,
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  variantId: {
    type: String,
    default: 'default',
  },
  size: {
    type: String,
    default: 'Standard',
  },
  color: {
    type: String,
    default: 'Standard',
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  priceAtAddition: {
    type: Number,
    required: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const savedItemSchema = new mongoose.Schema({
  itemKey: {
    type: String,
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  variantId: {
    type: String,
    default: 'default',
  },
  size: {
    type: String,
    default: 'Standard',
  },
  color: {
    type: String,
    default: 'Standard',
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  priceAtAddition: {
    type: Number,
    required: true,
  },
  savedAt: {
    type: Date,
    default: Date.now,
  },
});

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    items: [cartItemSchema],
    savedItems: [savedItemSchema],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

cartSchema.set('optimisticConcurrency', true);

module.exports = mongoose.model('Cart', cartSchema);
