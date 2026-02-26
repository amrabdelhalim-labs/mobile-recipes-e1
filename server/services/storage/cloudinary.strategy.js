/**
 * Cloudinary Storage Strategy
 *
 * Stores files in Cloudinary cloud service.
 * Requires cloudinary npm package and configuration.
 *
 * Setup:
 * 1. npm install cloudinary
 * 2. Set environment variables: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */

class CloudinaryStorageStrategy {
  constructor(config = {}) {
    this.cloudinary = null;
    this.folder = config.folder || process.env.CLOUDINARY_FOLDER || 'mobile-recipes';

    // Support CLOUDINARY_URL (Heroku addon format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME)
    // Takes precedence over individual vars — individual vars act as fallback
    const cloudinaryUrl = process.env.CLOUDINARY_URL;
    if (cloudinaryUrl) {
      try {
        const url = new URL(cloudinaryUrl);
        this.cloudName = config.cloudName || url.hostname;
        this.apiKey = config.apiKey || url.username;
        this.apiSecret = config.apiSecret || decodeURIComponent(url.password);
      } catch {
        throw new Error('CLOUDINARY_URL is malformed. Expected: cloudinary://API_KEY:API_SECRET@CLOUD_NAME');
      }
    } else {
      // Fallback: individual environment variables
      this.cloudName = config.cloudName || process.env.CLOUDINARY_CLOUD_NAME;
      this.apiKey = config.apiKey || process.env.CLOUDINARY_API_KEY;
      this.apiSecret = config.apiSecret || process.env.CLOUDINARY_API_SECRET;
    }

    if (!this.cloudName || !this.apiKey || !this.apiSecret) {
      throw new Error(
        'Cloudinary credentials missing. Set CLOUDINARY_URL (Heroku) or ' +
        'CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET'
      );
    }

    this._initializeCloudinary();
  }

  async _initializeCloudinary() {
    try {
      const cloudinary = await import('cloudinary');
      this.cloudinary = cloudinary.v2;

      this.cloudinary.config({
        cloud_name: this.cloudName,
        api_key: this.apiKey,
        api_secret: this.apiSecret,
      });

      console.log('✅ Cloudinary storage initialized');
    } catch (error) {
      throw new Error('Failed to load cloudinary package. Install it with: npm install cloudinary');
    }
  }

  /**
   * Upload a single file to Cloudinary
   * @param {Express.Multer.File} file - Multer file object
   * @returns {Promise<{url: string, filename: string, publicId: string}>}
   */
  async uploadFile(file) {
    if (!this.cloudinary) {
      await this._initializeCloudinary();
    }

    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        {
          folder: this.folder,
          resource_type: 'image',
          transformation: [
            { width: 1920, height: 1920, crop: 'limit' }, // Max size
            { quality: 'auto:good' }, // Auto optimize
          ],
        },
        (error, result) => {
          if (error) {
            return reject(new Error(`Cloudinary upload failed: ${error.message}`));
          }

          resolve({
            url: result.secure_url,
            filename: result.public_id,
            publicId: result.public_id,
          });
        }
      );

      uploadStream.end(file.buffer);
    });
  }

  /**
   * Upload multiple files
   * @param {Express.Multer.File[]} files
   * @returns {Promise<Array<{url: string, filename: string, publicId: string}>>}
   */
  async uploadFiles(files) {
    const uploadPromises = files.map((file) => this.uploadFile(file));
    return Promise.all(uploadPromises);
  }

  /**
   * Delete a file from Cloudinary
   * @param {string} publicIdOrUrl - Public ID or URL
   * @returns {Promise<boolean>}
   */
  async deleteFile(publicIdOrUrl) {
    if (!this.cloudinary) {
      await this._initializeCloudinary();
    }

    try {
      const publicId = this._extractPublicId(publicIdOrUrl);
      if (!publicId) return false;

      const result = await this.cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error(`Failed to delete from Cloudinary: ${publicIdOrUrl}`, error.message);
      return false;
    }
  }

  /**
   * Delete multiple files
   * @param {string[]} publicIds - Array of public IDs or URLs
   * @returns {Promise<{success: string[], failed: string[]}>}
   */
  async deleteFiles(publicIds) {
    const results = { success: [], failed: [] };

    for (const id of publicIds) {
      const deleted = await this.deleteFile(id);
      if (deleted) {
        results.success.push(id);
      } else {
        results.failed.push(id);
      }
    }

    return results;
  }

  /**
   * Get public URL (already stored in database, but can be used for transformations)
   * @param {string} publicId
   * @returns {string}
   */
  getFileUrl(publicId) {
    if (publicId.startsWith('http://') || publicId.startsWith('https://')) {
      return publicId;
    }
    return this.cloudinary.url(publicId, {
      secure: true,
      transformation: [{ quality: 'auto:good' }],
    });
  }

  /**
   * Health check
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    if (!this.cloudinary) {
      try {
        await this._initializeCloudinary();
      } catch {
        return false;
      }
    }

    try {
      // Simple API ping
      await this.cloudinary.api.ping();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extract public ID from Cloudinary URL or return as-is if already public ID
   * @private
   */
  _extractPublicId(urlOrId) {
    if (!urlOrId) return null;

    try {
      // If it's a Cloudinary URL, extract public_id
      if (urlOrId.includes('cloudinary.com')) {
        const parts = urlOrId.split('/');
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex !== -1) {
          // Get everything after /upload/v123456789/
          const publicIdWithExtension = parts.slice(uploadIndex + 2).join('/');
          // Remove file extension
          return publicIdWithExtension.replace(/\.[^/.]+$/, '');
        }
      }
      // Otherwise, assume it's already a public ID
      return urlOrId;
    } catch {
      return null;
    }
  }
}

export default CloudinaryStorageStrategy;
