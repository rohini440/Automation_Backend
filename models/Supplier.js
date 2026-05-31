const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a supplier name'],
    trim: true
  },
  contactPerson: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add a supplier email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Supplier', SupplierSchema);
