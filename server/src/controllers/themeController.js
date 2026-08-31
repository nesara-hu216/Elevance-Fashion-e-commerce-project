const User = require('../models/User');

exports.getThemePreference = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      themePreference: user ? user.themePreference : 'system',
    });
  } catch (error) {
    next(error);
  }
};

exports.updateThemePreference = async (req, res, next) => {
  try {
    const { themePreference } = req.body;

    if (!['system', 'light', 'dark'].includes(themePreference)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid theme preference. Must be "system", "light", or "dark".',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { themePreference },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Theme preference updated',
      themePreference: user.themePreference,
    });
  } catch (error) {
    next(error);
  }
};
