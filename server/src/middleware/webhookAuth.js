const crypto = require('crypto');

const verifyStripeWebhook = (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('[Webhook Warning] STRIPE_WEBHOOK_SECRET is not set. Allowing request in dev mode.');
    return next();
  }

  if (!signature) {
    return res.status(400).json({ success: false, message: 'Missing Stripe signature header' });
  }

  try {
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const elements = signature.split(',');
    let timestamp = '';
    let signatures = [];

    elements.forEach((element) => {
      const [key, value] = element.trim().split('=');
      if (key === 't') timestamp = value;
      if (key === 'v1') signatures.push(value);
    });

    const payload = `${timestamp}.${rawBody}`;
    const hmac = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');

    if (signatures.includes(hmac)) {
      next();
    } else {
      res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }
  } catch (error) {
    console.error('[Webhook Verification Error]', error.message);
    res.status(400).json({ success: false, message: 'Webhook signature verification failed' });
  }
};

module.exports = { verifyStripeWebhook };
