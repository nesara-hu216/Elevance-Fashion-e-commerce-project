const express = require('express');
const router = express.Router();
const { getThemePreference, updateThemePreference } = require('../controllers/themeController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getThemePreference);
router.patch('/', updateThemePreference);

module.exports = router;
