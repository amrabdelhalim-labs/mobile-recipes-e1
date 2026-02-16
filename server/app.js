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

app.use(cors());
if (process.env.NODE_ENV === 'development') {
  const { default: morgan } = await import('morgan');
  app.use(morgan('dev'));
}
app.use(express.json({ limit: '1mb' }));
app.use('/', router);
app.use('/images', express.static(imagesRoot));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Error handler عام
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