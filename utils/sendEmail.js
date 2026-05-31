const nodemailer = require('nodemailer');

let transporter;

const createTransporter = async () => {
  if (transporter) return transporter;

  const hasSmtpConfig =
    process.env.EMAIL_HOST &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS;

  if (hasSmtpConfig) {
    // Configure production SMTP
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: parseInt(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    console.log('\x1b[32m%s\x1b[0m', '📧 Production SMTP email transporter configured successfully.');
  } else {
    try {
      // Create Ethereal test account on the fly for developer experience
      console.log('\x1b[33m%s\x1b[0m', '📧 Email SMTP credentials not found in environment.');
      console.log('\x1b[36m%s\x1b[0m', '✨ Creating a temporary developer Ethereal Mail inbox...');
      
      const testAccount = await nodemailer.createTestAccount();
      
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      
      console.log('\x1b[32m%s\x1b[0m', `📧 Temporary Ethereal Mail account created: ${testAccount.user}`);
      console.log('\x1b[36m%s\x1b[0m', '💡 You can preview sent emails in your terminal logs via the generated URL.');
    } catch (error) {
      console.error('❌ Failed to create Ethereal test email account:', error.message);
      console.log('\x1b[33m%s\x1b[0m', '📝 Email utilities will fall back to direct console logs.');
      transporter = null;
    }
  }

  return transporter;
};

/**
 * Sends an email notification with optional attachments
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML email body
 * @param {Array} attachments - Optional list of file attachments
 */
const sendEmail = async (to, subject, html, attachments = []) => {
  const mailTransporter = await createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Inventory Systems" <noreply@inventoryapp.com>',
    to,
    subject,
    html,
    attachments
  };

  if (mailTransporter) {
    try {
      const info = await mailTransporter.sendMail(mailOptions);
      console.log('\x1b[32m%s\x1b[0m', `✉️  Email sent successfully! Message ID: ${info.messageId}`);
      
      // Ethereal URLs are returned under nodemailer.getTestMessageUrl(info)
      const testUrl = nodemailer.getTestMessageUrl(info);
      if (testUrl) {
        console.log('\x1b[35m%s\x1b[0m', `🔗 [Ethereal Preview URL]: ${testUrl}`);
        return { success: true, previewUrl: testUrl };
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error sending email via SMTP:', error.message);
      return { success: false, error: error.message };
    }
  } else {
    // Offline / Fallback log
    console.log('\x1b[33m%s\x1b[0m', '📣 [MOCK EMAIL DISPATCH]');
    console.log(`TO: ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`BODY SUMMARY: ${html.substring(0, 150)}...`);
    if (attachments.length > 0) {
      console.log(`ATTACHMENTS: ${attachments.map(a => a.filename).join(', ')}`);
    }
    return { success: true, isMocked: true };
  }
};

module.exports = sendEmail;
