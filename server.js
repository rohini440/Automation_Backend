require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const { connectDB, getDBMode } = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS for frontend Vite app (typically runs on 5173 or other local ports)
app.use(cors({
  origin: '*', // Allow all for local development, can restrict to frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Helmet security configured with cross-origin policies so local static files are visible
app.use(helmet({
  crossOriginResourcePolicy: false
}));

// HTTP request logger
if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  app.use(morgan('dev'));
}

// Static directories serving
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

const invoicesDir = path.join(__dirname, 'invoices');
if (!fs.existsSync(invoicesDir)) {
  fs.mkdirSync(invoicesDir, { recursive: true });
}

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
    databaseMode: getDBMode() ? 'In-Memory Mock Database' : 'MongoDB Atlas Connected'
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/invoices', invoiceRoutes);

// Global Error Handler
app.use(errorHandler);

const { exec } = require('child_process');

const PORT = process.env.PORT || 5050;

// Initialize Server & Database
const startServer = async () => {
  await connectDB();
  
  const server = app.listen(PORT);
  
  server.on('listening', () => {
    console.log('\x1b[32m%s\x1b[0m', `🚀 Express Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
    console.log('\x1b[36m%s\x1b[0m', `🔗 Healthcheck Endpoint: http://localhost:${PORT}/api/health`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`\x1b[33m⚠️  Port ${PORT} is already in use.\x1b[0m`);
      console.log(`💡 Attempting to automatically free up port ${PORT}...`);
      
      const cmd = process.platform === 'win32'
        ? `powershell -Command "Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force"`
        : `kill -9 $(lsof -t -i:${PORT})`;
        
      exec(cmd, (execErr, stdout, stderr) => {
        if (execErr) {
          console.log(`\x1b[31m❌ Auto-recovery failed:\x1b[0m Port ${PORT} could not be freed: ${execErr.message}`);
          console.log(`💡 Please manually close the process holding port ${PORT} or check permissions.`);
          process.exit(1);
        } else {
          console.log(`\x1b[32m✅ Successfully cleared port ${PORT}!\x1b[0m Restarting server in 1.5 seconds...`);
          setTimeout(() => {
            startServer();
          }, 1500);
        }
      });
    } else {
      console.error('❌ Server error:', err);
    }
  });
};

startServer();

