const mongoose = require('mongoose');

const deviceTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    expoPushToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    platform: {
      type: String,
      default: 'unknown',
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DeviceToken', deviceTokenSchema);
