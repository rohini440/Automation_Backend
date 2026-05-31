const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generates an elegant, highly structured Invoice PDF using PDFKit
 * @param {Object} invoice - The invoice data
 * @returns {Promise<string>} - The absolute path of the generated PDF file
 */
const generateInvoicePDF = (invoice) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const invoicesDir = path.join(__dirname, '../invoices'); // Re-adjusted paths because utils/ is at backend root, so invoices/ is at backend/invoices
      
      if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir, { recursive: true });
      }

      const fileName = `Invoice_${invoice.invoiceNumber}.pdf`;
      const filePath = path.join(invoicesDir, fileName);
      const writeStream = fs.createWriteStream(filePath);

      doc.pipe(writeStream);

      // --- HEADER & LOGO ---
      const primaryColor = '#10b981';
      const textColor = '#374151';
      const lightGray = '#f3f4f6';

      doc
        .fillColor(primaryColor)
        .fontSize(22)
        .text('INVENTORY SYSTEMS INC.', 50, 50, { bold: true })
        .fontSize(10)
        .fillColor(textColor)
        .text('128 Business Park Suite, Silicon Valley, CA', 50, 75)
        .text('support@inventorycorp.com | +1 (555) 019-2834', 50, 90);

      // Invoice metadata
      doc
        .fillColor(textColor)
        .fontSize(24)
        .text('INVOICE', 400, 50, { align: 'right' })
        .fontSize(10)
        .text(`Invoice No: ${invoice.invoiceNumber}`, 400, 80, { align: 'right' })
        .text(`Date: ${new Date(invoice.createdAt || Date.now()).toLocaleDateString()}`, 400, 95, { align: 'right' })
        .text(`Status: ${invoice.status.toUpperCase()}`, 400, 110, { align: 'right' });

      doc.moveTo(50, 135).lineTo(550, 135).strokeColor('#e5e7eb').lineWidth(1).stroke();

      // --- BILL TO INFO ---
      doc
        .fontSize(12)
        .fillColor(primaryColor)
        .text('BILL TO:', 50, 155, { bold: true })
        .fontSize(11)
        .fillColor(textColor)
        .text(invoice.clientName, 50, 175, { bold: true })
        .text(invoice.clientEmail, 50, 190)
        .text('Client Corporate Office Address', 50, 205);

      // --- TABLE OF ITEMS ---
      let y = 245;

      doc.rect(50, y, 500, 22).fill(lightGray);

      doc
        .fontSize(10)
        .fillColor(textColor)
        .text('Item Description', 60, y + 6, { bold: true })
        .text('Price', 280, y + 6, { width: 80, align: 'right', bold: true })
        .text('Qty', 370, y + 6, { width: 50, align: 'right', bold: true })
        .text('Total', 460, y + 6, { width: 80, align: 'right', bold: true });

      y += 22;

      invoice.items.forEach((item, index) => {
        if (index % 2 === 1) {
          doc.rect(50, y, 500, 20).fill('#fafafa');
        }

        doc
          .fontSize(10)
          .fillColor(textColor)
          .text(item.name, 60, y + 5)
          .text(`$${Number(item.price).toFixed(2)}`, 280, y + 5, { width: 80, align: 'right' })
          .text(item.quantity.toString(), 370, y + 5, { width: 50, align: 'right' })
          .text(`$${(item.quantity * item.price).toFixed(2)}`, 460, y + 5, { width: 80, align: 'right' });

        y += 20;
      });

      doc.moveTo(50, y + 10).lineTo(550, y + 10).strokeColor('#e5e7eb').lineWidth(1).stroke();
      y += 15;

      // --- TOTALS BLOCK ---
      doc
        .fontSize(10)
        .text('Subtotal:', 350, y, { width: 100, align: 'right' })
        .text(`$${Number(invoice.subtotal).toFixed(2)}`, 460, y, { width: 80, align: 'right' });

      y += 18;
      doc
        .text('Tax (8%):', 350, y, { width: 100, align: 'right' })
        .text(`$${Number(invoice.tax).toFixed(2)}`, 460, y, { width: 80, align: 'right' });

      y += 18;
      doc
        .fontSize(12)
        .fillColor(primaryColor)
        .text('Total Due:', 350, y, { width: 100, align: 'right', bold: true })
        .text(`$${Number(invoice.total).toFixed(2)}`, 460, y, { width: 80, align: 'right', bold: true });

      // --- FOOTER NOTE ---
      doc
        .fontSize(9)
        .fillColor('#9ca3af')
        .text('Thank you for your business! Payment is expected within 30 days of invoice date.', 50, 720, { align: 'center' })
        .text('For queries regarding this invoice, contact billing@inventorycorp.com', 50, 735, { align: 'center' });

      doc.end();

      writeStream.on('finish', () => {
        resolve(filePath);
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateInvoicePDF };
