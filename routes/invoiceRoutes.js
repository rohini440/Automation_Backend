const express = require('express');
const router = express.Router();
const { getInvoices, createInvoice, downloadInvoicePDF, updateInvoiceStatus } = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');

// Public download route for client invoice PDFs (e.g., accessed from emails)
router.get('/download/:invoiceNumber', downloadInvoicePDF);

// Protected dashboard routes
router.get('/', protect, getInvoices);
router.post('/', protect, createInvoice);
router.put('/:id/status', protect, updateInvoiceStatus);

module.exports = router;
