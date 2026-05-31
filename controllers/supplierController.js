const Supplier = require('../models/Supplier');
const { getDBMode } = require('../config/db');
const { mockSuppliers } = require('../models/mockStore');

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private
const getSuppliers = async (req, res) => {
  try {
    if (getDBMode()) {
      res.json({ success: true, count: mockSuppliers.length, suppliers: mockSuppliers });
    } else {
      const suppliers = await Supplier.find().sort({ createdAt: -1 });
      res.json({ success: true, count: suppliers.length, suppliers });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new supplier
// @route   POST /api/suppliers
// @access  Private
const createSupplier = async (req, res) => {
  try {
    const { name, contactPerson, email, phone, address } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Please add name and email' });
    }

    if (getDBMode()) {
      const emailExists = mockSuppliers.some(s => s.email.toLowerCase() === email.toLowerCase());
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Supplier with this email already exists in mock store' });
      }

      const newSupplier = {
        _id: 'sup_' + (mockSuppliers.length + 1),
        name,
        contactPerson: contactPerson || '',
        email: email.toLowerCase(),
        phone: phone || '',
        address: address || '',
        createdAt: new Date()
      };

      mockSuppliers.push(newSupplier);
      res.status(201).json({ success: true, supplier: newSupplier });
    } else {
      const emailExists = await Supplier.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Supplier with this email already exists' });
      }

      const supplier = await Supplier.create({
        name,
        contactPerson,
        email: email.toLowerCase(),
        phone,
        address
      });

      res.status(201).json({ success: true, supplier });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private
const updateSupplier = async (req, res) => {
  try {
    const { name, contactPerson, email, phone, address } = req.body;

    const updates = {
      ...(name && { name }),
      ...(contactPerson && { contactPerson }),
      ...(email && { email: email.toLowerCase() }),
      ...(phone && { phone }),
      ...(address && { address })
    };

    if (getDBMode()) {
      const supplierIndex = mockSuppliers.findIndex(s => s._id === req.params.id);
      if (supplierIndex === -1) {
        return res.status(404).json({ success: false, message: 'Supplier not found in mock store' });
      }

      mockSuppliers[supplierIndex] = {
        ...mockSuppliers[supplierIndex],
        ...updates
      };

      res.json({ success: true, supplier: mockSuppliers[supplierIndex] });
    } else {
      let supplier = await Supplier.findById(req.params.id);
      if (!supplier) {
        return res.status(404).json({ success: false, message: 'Supplier not found' });
      }

      supplier = await Supplier.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true
      });

      res.json({ success: true, supplier });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private
const deleteSupplier = async (req, res) => {
  try {
    if (getDBMode()) {
      const supplierIndex = mockSuppliers.findIndex(s => s._id === req.params.id);
      if (supplierIndex === -1) {
        return res.status(404).json({ success: false, message: 'Supplier not found in mock store' });
      }

      mockSuppliers.splice(supplierIndex, 1);
      res.json({ success: true, message: 'Supplier removed from mock store' });
    } else {
      const supplier = await Supplier.findById(req.params.id);
      if (!supplier) {
        return res.status(404).json({ success: false, message: 'Supplier not found' });
      }

      await supplier.deleteOne();
      res.json({ success: true, message: 'Supplier removed' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier
};
