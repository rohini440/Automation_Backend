const mongoose = require('mongoose');

const InvoiceItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: true
  }
});

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  clientName: {
    type: String,
    required: [true, 'Please add a client name']
  },
  clientEmail: {
    type: String,
    required: [true, 'Please add a client email'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid client email'
    ]
  },
  items: [InvoiceItemSchema],
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    required: true,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['paid', 'unpaid', 'pending'],
    default: 'pending'
  },
  pdfUrl: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
