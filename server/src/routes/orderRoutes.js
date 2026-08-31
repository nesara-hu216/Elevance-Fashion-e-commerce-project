const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  requestReturn,
  reorder,
  downloadInvoice,
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.put('/:id/status', updateOrderStatus);
router.post('/:id/cancel', cancelOrder);
router.post('/:id/return', requestReturn);
router.post('/:id/reorder', reorder);
router.get('/:id/invoice', downloadInvoice);

module.exports = router;

