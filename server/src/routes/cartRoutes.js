const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  syncCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  saveForLater,
  moveToCart,
  validateCart,
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getCart);
router.post('/', addToCart);
router.post('/sync', syncCart);
router.post('/items', addToCart);
router.put('/:itemKey', updateQuantity);
router.patch('/items/:itemKey', updateQuantity);
router.delete('/', clearCart);
router.delete('/:itemKey', removeFromCart);
router.delete('/items/:itemKey', removeFromCart);
router.post('/items/:itemKey/save', saveForLater);
router.post('/saved-items/:itemKey/move', moveToCart);
router.post('/validate', validateCart);

module.exports = router;

