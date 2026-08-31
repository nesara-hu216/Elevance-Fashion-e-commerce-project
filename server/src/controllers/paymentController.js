const PaymentEvent = require('../models/PaymentEvent');
const Order = require('../models/Order');

exports.handleWebhook = async (req, res, next) => {
  try {
    const event = req.body;
    const providerEventId = event.id || `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const eventType = event.type || 'payment_intent.succeeded';

    // 1. Enforce Idempotency — Check if event was already processed
    const existingEvent = await PaymentEvent.findOne({ providerEventId });
    if (existingEvent) {
      console.log(`[Payment Webhook] Duplicate event ignored: ${providerEventId}`);
      return res.json({ success: true, message: 'Event already processed' });
    }

    const dataObject = event.data ? event.data.object : event;
    const orderId = dataObject.metadata?.orderId || dataObject.orderId;
    const amount = dataObject.amount ? dataObject.amount / 100 : dataObject.amountTotal || 0;
    const currency = dataObject.currency ? dataObject.currency.toUpperCase() : 'INR';

    // 2. Audit Log Entry
    const paymentAudit = await PaymentEvent.create({
      orderId,
      provider: 'stripe',
      transactionId: dataObject.id || `txn_${Date.now()}`,
      eventType,
      amount,
      currency,
      status: 'processed',
      providerEventId,
      rawMetadata: dataObject,
      timestamp: new Date(),
    });

    // 3. Process Event Action
    if (orderId && eventType === 'payment_intent.succeeded') {
      const order = await Order.findOne({ orderId });
      if (order) {
        order.paymentStatus = 'paid';
        order.orderStatus = 'confirmed';
        order.deliveryTimeline.push({
          status: 'confirmed',
          message: 'Payment confirmed via webhook.',
          timestamp: new Date(),
        });
        await order.save();
      }
    } else if (orderId && eventType === 'payment_intent.payment_failed') {
      const order = await Order.findOne({ orderId });
      if (order) {
        order.paymentStatus = 'failed';
        await order.save();
      }
    }

    res.json({ success: true, message: 'Webhook processed successfully', auditId: paymentAudit._id });
  } catch (error) {
    next(error);
  }
};
