const Product = require('../models/Product');
const { getDBMode } = require('../config/db');
const { mockProducts } = require('../models/mockStore');
const { getUploadType } = require('../middleware/uploadMiddleware');

// Helper to construct image URL if uploaded
const getImageUrl = (req) => {
  if (!req.file) return '';
  if (getUploadType() === 'cloudinary') {
    return req.file.path;
  } else {
    const serverUrl = `${req.protocol}://${req.get('host')}`;
    return `${serverUrl}/uploads/${req.file.filename}`;
  }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res) => {
  try {
    if (getDBMode()) {
      res.json({ success: true, count: mockProducts.length, products: mockProducts });
    } else {
      const products = await Product.find().sort({ createdAt: -1 });
      res.json({ success: true, count: products.length, products });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res) => {
  try {
    const { name, sku, price, stock, description } = req.body;

    if (!name || !sku || !price) {
      return res.status(400).json({ success: false, message: 'Please add name, SKU, and price' });
    }

    const imageUrl = getImageUrl(req);

    if (getDBMode()) {
      const skuExists = mockProducts.some(p => p.sku.toLowerCase() === sku.toLowerCase());
      if (skuExists) {
        return res.status(400).json({ success: false, message: 'SKU already exists in mock store' });
      }

      const newProduct = {
        _id: 'prod_' + (mockProducts.length + 1),
        name,
        sku,
        price: parseFloat(price),
        stock: parseInt(stock) || 0,
        description: description || '',
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=600&auto=format&fit=crop',
        createdAt: new Date()
      };

      mockProducts.push(newProduct);
      res.status(201).json({ success: true, product: newProduct });
    } else {
      const skuExists = await Product.findOne({ sku });
      if (skuExists) {
        return res.status(400).json({ success: false, message: 'SKU already exists' });
      }

      const product = await Product.create({
        name,
        sku,
        price,
        stock,
        description,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=600&auto=format&fit=crop'
      });

      res.status(201).json({ success: true, product });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = async (req, res) => {
  try {
    const { name, price, stock, description } = req.body;
    const imageUrl = req.file ? getImageUrl(req) : undefined;

    const updates = {
      ...(name && { name }),
      ...(price && { price: parseFloat(price) }),
      ...(stock !== undefined && { stock: parseInt(stock) }),
      ...(description && { description }),
      ...(imageUrl && { imageUrl })
    };

    if (getDBMode()) {
      const productIndex = mockProducts.findIndex(p => p._id === req.params.id);
      if (productIndex === -1) {
        return res.status(404).json({ success: false, message: 'Product not found in mock store' });
      }

      mockProducts[productIndex] = {
        ...mockProducts[productIndex],
        ...updates
      };

      res.json({ success: true, product: mockProducts[productIndex] });
    } else {
      let product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      product = await Product.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true
      });

      res.json({ success: true, product });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = async (req, res) => {
  try {
    if (getDBMode()) {
      const productIndex = mockProducts.findIndex(p => p._id === req.params.id);
      if (productIndex === -1) {
        return res.status(404).json({ success: false, message: 'Product not found in mock store' });
      }

      mockProducts.splice(productIndex, 1);
      res.json({ success: true, message: 'Product removed from mock store' });
    } else {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      await product.deleteOne();
      res.json({ success: true, message: 'Product removed' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct
};
