const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  trackProductView,
  createProduct,
  updateProduct,
  deleteProduct,
  seedProducts,
  validateProducts,
} = require('../controllers/productController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/', getProducts);
router.get('/seed', seedProducts);
router.post('/seed', seedProducts);
router.get('/validate', validateProducts);
router.get('/:id', getProductById);
router.post('/:id/view', optionalAuth, trackProductView);

router.post('/', protect, createProduct);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;

