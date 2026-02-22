import 'dotenv/config';
import express from 'express';
import router from './routes/index.js';
import cors from 'cors';
import fs from 'node:fs';
import https from 'node:https';
import db from './utilities/database.js';
import { imagesRoot } from './utilities/files.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// CORS Configuration
// ============================================================
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://localhost:8100']; // Default for development

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️  Blocked CORS request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

if (process.env.NODE_ENV === 'development') {
  const { default: morgan } = await import('morgan');
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '1mb' }));
app.use('/', router);
app.use('/images', express.static(imagesRoot));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);

    if (err.name === 'MulterError') {
        return res.status(400).json({ message: err.message });
    }

    if (err.message === 'يجب أن تكون الملفات من نوع صورة فقط!') {
        return res.status(400).json({ message: err.message });
    }

    return res.status(500).json({ message: 'خطأ غير متوقع في الخادم' });
});

// Initialize database and start server
const initializeServer = async () => {
  try {
    await db.authenticate();
    console.log('✅ Database connection established successfully');
    
    await db.sync({ alter: true });
    console.log('✅ Database synced successfully');
    
    // Log CORS configuration
    console.log(`🌐 CORS allowed origins: ${allowedOrigins.join(', ')}`);
    
    const httpsKeyPath = process.env.HTTPS_KEY_PATH;
    const httpsCertPath = process.env.HTTPS_CERT_PATH;
    const httpsCaPath = process.env.HTTPS_CA_PATH;

    if (httpsKeyPath && httpsCertPath) {
      const tlsOptions = {
        key: fs.readFileSync(httpsKeyPath),
        cert: fs.readFileSync(httpsCertPath),
      };

      if (httpsCaPath) {
        tlsOptions.ca = fs.readFileSync(httpsCaPath);
      }

      https.createServer(tlsOptions, app).listen(PORT, () => {
        console.log(`✅ HTTPS server is running on port ${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
      });
    } else {
      app.listen(PORT, () => {
        console.log(`✅ Server is running on port ${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
      });
    }
  } catch (error) {
    console.error('❌ Failed to initialize server:', error.message);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await db.close();
  process.exit(0);
});

initializeServer();