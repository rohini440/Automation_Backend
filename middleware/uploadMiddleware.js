const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');
const fs = require('fs');

let storage;
let uploadType = 'local';

const useCloudinary =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (useCloudinary) {
  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'inventory_products',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 500, height: 500, crop: 'limit' }]
    }
  });
  uploadType = 'cloudinary';
  console.log('\x1b[32m%s\x1b[0m', '☁️  Cloudinary Cloud Storage configured successfully for product images.');
} else {
  // Fallback to local files storage in backend/uploads/
  const uploadDir = path.join(__dirname, '../uploads'); // Adjusted path from ../../uploads because we are at root/middleware/ now, so uploads/ is at root/uploads/
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
  uploadType = 'local';
  console.log('\x1b[33m%s\x1b[0m', '📁 Cloudinary keys not found. Falling back to local file upload in backend/uploads/.');
}

// File filter to allow only image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const getUploadType = () => uploadType;

module.exports = { upload, getUploadType };
