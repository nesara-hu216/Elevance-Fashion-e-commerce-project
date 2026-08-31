const express = require('express');
const router = express.Router();
const { handleWebhook } = require('../controllers/paymentController');
const { verifyStripeWebhook } = require('../middleware/webhookAuth');

router.post('/webhook', express.raw({ type: 'application/json' }), verifyStripeWebhook, handleWebhook);

module.exports = router;
