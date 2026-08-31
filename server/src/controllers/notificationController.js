const DeviceToken = require('../models/DeviceToken');
const NotificationPreference = require('../models/NotificationPreference');
const NotificationLog = require('../models/NotificationLog');

exports.registerDeviceToken = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { expoPushToken, platform = 'unknown' } = req.body;

    if (!expoPushToken) {
      return res.status(400).json({ success: false, message: 'expoPushToken is required' });
    }

    const tokenDoc = await DeviceToken.findOneAndUpdate(
      { expoPushToken },
      { userId, platform, isEnabled: true, lastActiveAt: new Date() },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Device token registered', token: tokenDoc });
  } catch (error) {
    next(error);
  }
};

exports.getPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let preferences = await NotificationPreference.findOne({ userId });

    if (!preferences) {
      preferences = await NotificationPreference.create({ userId });
    }

    res.json({ success: true, preferences });
  } catch (error) {
    next(error);
  }
};

exports.updatePreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    let preferences = await NotificationPreference.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true, upsert: true }
    );

    res.json({ success: true, message: 'Preferences updated', preferences });
  } catch (error) {
    next(error);
  }
};

exports.getNotificationLogs = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await NotificationLog.countDocuments({ userId });
    const logs = await NotificationLog.find({ userId })
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      count: logs.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      logs,
    });
  } catch (error) {
    next(error);
  }
};
