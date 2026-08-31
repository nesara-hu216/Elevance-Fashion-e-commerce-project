const mongoose = require('mongoose');

const paymentEventSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      index: true,
    },
    provider: {
      type: String,
      default: 'stripe',
    },
    transactionId: {
      type: String,
    },
    eventType: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      required: true,
    },
    providerEventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    rawMetadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PaymentEvent', paymentEventSchema);
