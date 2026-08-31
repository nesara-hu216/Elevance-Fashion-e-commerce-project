const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'supersecret_jwt_key_elevance_2026',
    { expiresIn: '30d' }
  );
};

exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Please provide name, email, and password' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ success: false, message: 'User already exists with this email' });
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        themePreference: user.themePreference,
        role: user.role,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      res.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          themePreference: user.themePreference,
          role: user.role,
        },
        token: generateToken(user._id),
      });
    } else {
      res
        .status(401)
        .json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        themePreference: user.themePreference,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};
