const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true
  },
  sku: {
    type: String,
    required: [true, 'Please add a SKU'],
    unique: true,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Please add a product price']
  },
  stock: {
    type: Number,
    required: [true, 'Please add stock quantity'],
    default: 0
  },
  description: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', ProductSchema);
