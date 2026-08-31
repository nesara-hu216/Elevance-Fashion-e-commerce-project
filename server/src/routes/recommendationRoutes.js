const express = require('express');
const router = express.Router();
const { getRecommendations } = require('../controllers/recommendationController');
const { optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, getRecommendations);

module.exports = router;
