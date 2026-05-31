const express = require('express');
const router = express.Router();
const { getProducts, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

// All product routes are protected
router.use(protect);

router.route('/')
  .get(getProducts)
  .post(upload.single('image'), createProduct);

router.route('/:id')
  .put(upload.single('image'), updateProduct)
  .delete(deleteProduct);

module.exports = router;
