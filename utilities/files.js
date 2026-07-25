import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import StorageService from '../services/storage/storage.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imagesRoot = path.resolve(__dirname, '../public/images');

/**
 * Extract filename from URL or path
 */
const extractFileName = (imageUrl) => {
  if (!imageUrl) return null;
  try {
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      const urlObj = new URL(imageUrl);
      return path.basename(urlObj.pathname);
    }
    return path.basename(imageUrl);
  } catch {
    return null;
  }
};

/**
 * Multer configuration - stores files in memory buffer
 * The storage service will handle actual persistence
 */
const upload = multer({
  storage: multer.memoryStorage(), // Store in memory, let storage service handle persistence
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('يجب أن تكون الملفات من نوع صورة فقط!'), false);
    }
  },
});

/**
 * Get the storage service instance
 */
const getStorageService = () => StorageService.getInstance();

export { upload, imagesRoot, extractFileName, getStorageService };
