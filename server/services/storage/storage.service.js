import LocalStorageStrategy from './local.strategy.js';
import CloudinaryStorageStrategy from './cloudinary.strategy.js';
import S3StorageStrategy from './s3.strategy.js';

/**
 * Storage Service Factory
 *
 * Creates and manages the appropriate storage strategy based on configuration.
 * Supports: local, cloudinary, s3
 *
 * Usage:
 * const storage = StorageService.getInstance();
 * const result = await storage.uploadFile(file);
 *
 * Configuration via environment variables:
 * - STORAGE_TYPE: 'local' | 'cloudinary' | 's3' (default: 'local')
 *
 * Local Storage (default for development):
 * - No additional config needed
 * - Files stored in server/public/images
 *
 * Cloudinary:
 * - Option A (Heroku addon): CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
 * - Option B (manual):       CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET
 * - Optional:                CLOUDINARY_FOLDER (default: mobile-recipes)
 *
 * AWS S3:
 * - AWS_S3_BUCKET
 * - AWS_REGION
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 */
class StorageService {
  static instance = null;
  static strategy = null;

  /**
   * Get singleton instance
   * @returns {StorageStrategy}
   */
  static getInstance() {
    if (!StorageService.instance) {
      StorageService.instance = StorageService.createStrategy();
    }
    return StorageService.instance;
  }

  /**
   * Create storage strategy based on environment config
   * @private
   */
  static createStrategy() {
    const storageType = (process.env.STORAGE_TYPE || 'local').toLowerCase();

    console.log(`🗄️  Initializing storage strategy: ${storageType}`);

    switch (storageType) {
      case 'cloudinary':
        return new CloudinaryStorageStrategy({
          cloudName: process.env.CLOUDINARY_CLOUD_NAME,
          apiKey: process.env.CLOUDINARY_API_KEY,
          apiSecret: process.env.CLOUDINARY_API_SECRET,
          folder: process.env.CLOUDINARY_FOLDER || 'mobile-recipes',
        });

      case 's3':
        return new S3StorageStrategy({
          bucket: process.env.AWS_S3_BUCKET,
          region: process.env.AWS_REGION,
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          folder: process.env.AWS_S3_FOLDER || 'uploads/images',
        });

      case 'local':
      default:
        return new LocalStorageStrategy({
          uploadsDir: process.env.LOCAL_UPLOADS_DIR,
          baseUrl: process.env.LOCAL_BASE_URL || '/images',
        });
    }
  }

  /**
   * Reset instance (useful for testing)
   */
  static reset() {
    StorageService.instance = null;
  }

  /**
   * Get current storage type
   * @returns {string}
   */
  static getStorageType() {
    return (process.env.STORAGE_TYPE || 'local').toLowerCase();
  }
}

export default StorageService;
