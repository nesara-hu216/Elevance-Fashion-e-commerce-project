const express = require('express');
const router = express.Router();
const { getRecentlyViewed, syncRecentlyViewed, getContinueShopping } = require('../controllers/activityController');
const { protect } = require('../middleware/auth');

router.get('/recently-viewed', protect, getRecentlyViewed);
router.post('/recently-viewed/sync', protect, syncRecentlyViewed);
router.get('/continue-shopping', protect, getContinueShopping);

module.exports = router;
