const Invoice = require('../models/Invoice');
const { getDBMode } = require('../config/db');
const { mockInvoices } = require('../models/mockStore');
const { generateInvoicePDF } = require('../utils/generateInvoice');
const sendEmail = require('../utils/sendEmail');
const path = require('path');
const fs = require('fs');

// Helper to generate Invoice Number (e.g., INV-2026-005)
const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  let nextNumber = 1;

  if (getDBMode()) {
    if (mockInvoices.length > 0) {
      const lastInvoice = mockInvoices[mockInvoices.length - 1];
      const match = lastInvoice.invoiceNumber.match(/(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[0]) + 1;
      }
    }
  } else {
    const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });
    if (lastInvoice) {
      const match = lastInvoice.invoiceNumber.match(/(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[0]) + 1;
      }
    }
  }

  const paddedNum = String(nextNumber).padStart(3, '0');
  return `INV-${year}-${paddedNum}`;
};

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
const getInvoices = async (req, res) => {
  try {
    if (getDBMode()) {
      res.json({ success: true, count: mockInvoices.length, invoices: mockInvoices });
    } else {
      const invoices = await Invoice.find().sort({ createdAt: -1 });
      res.json({ success: true, count: invoices.length, invoices });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Private
const createInvoice = async (req, res) => {
  try {
    const { clientName, clientEmail, items } = req.body;

    if (!clientName || !clientEmail || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Please add client details and items' });
    }

    // Calculations
    const subtotal = items.reduce((acc, item) => acc + (parseFloat(item.price) * parseInt(item.quantity)), 0);
    const tax = Math.round((subtotal * 0.08) * 100) / 100; // 8% tax
    const total = Math.round((subtotal + tax) * 100) / 100;
    
    const invoiceNumber = await generateInvoiceNumber();

    let newInvoice;

    if (getDBMode()) {
      newInvoice = {
        _id: 'inv_' + (mockInvoices.length + 1),
        invoiceNumber,
        clientName,
        clientEmail: clientEmail.toLowerCase(),
        items: items.map((it, idx) => ({
          _id: `inv_item_${idx}`,
          name: it.name,
          price: parseFloat(it.price),
          quantity: parseInt(it.quantity)
        })),
        subtotal,
        tax,
        total,
        status: 'pending',
        pdfUrl: null,
        createdAt: new Date()
      };
      
      const pdfPath = await generateInvoicePDF(newInvoice);
      newInvoice.pdfUrl = `/api/invoices/download/${newInvoice.invoiceNumber}`;

      mockInvoices.push(newInvoice);
      
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #10b981; margin-bottom: 20px;">Invoice Generated!</h2>
          <p>Dear <strong>${newInvoice.clientName}</strong>,</p>
          <p>We are pleased to send you invoice <strong>${newInvoice.invoiceNumber}</strong>. Details are summary below:</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p><strong>Invoice Number:</strong> ${newInvoice.invoiceNumber}</p>
          <p><strong>Total Amount:</strong> $${newInvoice.total.toFixed(2)}</p>
          <p><strong>Status:</strong> Pending Payment</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p>A copy of your detailed invoice is attached as a PDF to this email.</p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">Thank you for your business!<br>Inventory Systems Corp.</p>
        </div>
      `;

      await sendEmail(
        newInvoice.clientEmail,
        `Invoice ${newInvoice.invoiceNumber} from Inventory Systems`,
        emailBody,
        [{ filename: `Invoice_${newInvoice.invoiceNumber}.pdf`, path: pdfPath }]
      );

      res.status(201).json({ success: true, invoice: newInvoice });
    } else {
      newInvoice = await Invoice.create({
        invoiceNumber,
        clientName,
        clientEmail: clientEmail.toLowerCase(),
        items: items.map(it => ({
          name: it.name,
          price: parseFloat(it.price),
          quantity: parseInt(it.quantity)
        })),
        subtotal,
        tax,
        total,
        status: 'pending'
      });

      const pdfPath = await generateInvoicePDF(newInvoice);
      
      newInvoice.pdfUrl = `/api/invoices/download/${newInvoice.invoiceNumber}`;
      await newInvoice.save();

      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #10b981; margin-bottom: 20px;">Invoice Generated!</h2>
          <p>Dear <strong>${newInvoice.clientName}</strong>,</p>
          <p>We are pleased to send you invoice <strong>${newInvoice.invoiceNumber}</strong>. Details are summary below:</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p><strong>Invoice Number:</strong> ${newInvoice.invoiceNumber}</p>
          <p><strong>Total Amount:</strong> $${newInvoice.total.toFixed(2)}</p>
          <p><strong>Status:</strong> Pending Payment</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p>A copy of your detailed invoice is attached as a PDF to this email.</p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">Thank you for your business!<br>Inventory Systems Corp.</p>
        </div>
      `;

      await sendEmail(
        newInvoice.clientEmail,
        `Invoice ${newInvoice.invoiceNumber} from Inventory Systems`,
        emailBody,
        [{ filename: `Invoice_${newInvoice.invoiceNumber}.pdf`, path: pdfPath }]
      );

      res.status(201).json({ success: true, invoice: newInvoice });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Download generated Invoice PDF
// @route   GET /api/invoices/download/:invoiceNumber
// @access  Public
const downloadInvoicePDF = async (req, res) => {
  try {
    const { invoiceNumber } = req.params;
    const pdfPath = path.join(__dirname, `../invoices/Invoice_${invoiceNumber}.pdf`); // Re-adjusted relative path from controllers/ to invoices/

    if (fs.existsSync(pdfPath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="Invoice_${invoiceNumber}.pdf"`);
      return res.sendFile(pdfPath);
    } else {
      let invoice;
      if (getDBMode()) {
        invoice = mockInvoices.find(inv => inv.invoiceNumber === invoiceNumber);
      } else {
        invoice = await Invoice.findOne({ invoiceNumber });
      }

      if (!invoice) {
        return res.status(404).json({ success: false, message: 'Invoice PDF not found' });
      }

      const freshPdfPath = await generateInvoicePDF(invoice);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="Invoice_${invoiceNumber}.pdf"`);
      return res.sendFile(freshPdfPath);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update invoice payment status
// @route   PUT /api/invoices/:id/status
// @access  Private
const updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['paid', 'unpaid', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status type' });
    }

    if (getDBMode()) {
      const invoice = mockInvoices.find(inv => inv._id === req.params.id);
      if (!invoice) {
        return res.status(404).json({ success: false, message: 'Invoice not found in mock store' });
      }

      invoice.status = status;
      res.json({ success: true, invoice });
    } else {
      const invoice = await Invoice.findById(req.params.id);
      if (!invoice) {
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }

      invoice.status = status;
      await invoice.save();
      res.json({ success: true, invoice });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getInvoices,
  createInvoice,
  downloadInvoicePDF,
  updateInvoiceStatus
};
