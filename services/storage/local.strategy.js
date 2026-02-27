import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Local Storage Strategy
 *
 * Stores files in the local filesystem and serves them via Express static middleware.
 * Suitable for development and small-scale deployments.
 */
class LocalStorageStrategy {
  constructor(config = {}) {
    // Default to server/public/images
    this.uploadsDir = config.uploadsDir || path.resolve(__dirname, '../../public/images');
    this.baseUrl = config.baseUrl || '/images'; // URL path to access files

    // Ensure directory exists
    this._ensureDirectoryExists();
  }

  _ensureDirectoryExists() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
      console.log(`✅ Created uploads directory: ${this.uploadsDir}`);
    }
  }

  /**
   * Upload a single file
   * @param {Express.Multer.File} file - Multer file object
   * @returns {Promise<{url: string, filename: string}>}
   */
  async uploadFile(file) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    const filename = uniqueSuffix + fileExtension;

    const filePath = path.join(this.uploadsDir, filename);

    // Write file to disk
    await fs.promises.writeFile(filePath, file.buffer);

    return {
      url: `${this.baseUrl}/${filename}`,
      filename: filename,
    };
  }

  /**
   * Upload multiple files
   * @param {Express.Multer.File[]} files - Array of Multer file objects
   * @returns {Promise<Array<{url: string, filename: string}>>}
   */
  async uploadFiles(files) {
    const uploadPromises = files.map((file) => this.uploadFile(file));
    return Promise.all(uploadPromises);
  }

  /**
   * Delete a file
   * @param {string} filename - Filename to delete (or full URL)
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async deleteFile(filename) {
    try {
      // Extract filename from URL if needed
      const cleanFilename = this._extractFilename(filename);
      if (!cleanFilename) return false;

      const filePath = path.join(this.uploadsDir, cleanFilename);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.warn(`File not found for deletion: ${cleanFilename}`);
        return false;
      }

      await fs.promises.unlink(filePath);
      return true;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`Failed to delete file ${filename}:`, error.message);
      }
      return false;
    }
  }

  /**
   * Delete multiple files
   * @param {string[]} filenames - Array of filenames or URLs
   * @returns {Promise<{success: string[], failed: string[]}>}
   */
  async deleteFiles(filenames) {
    const results = { success: [], failed: [] };

    for (const filename of filenames) {
      const deleted = await this.deleteFile(filename);
      if (deleted) {
        results.success.push(filename);
      } else {
        results.failed.push(filename);
      }
    }

    return results;
  }

  /**
   * Get public URL for a file
   * @param {string} filename - Filename
   * @returns {string} - Full URL
   */
  getFileUrl(filename) {
    // If it's already a full URL, return as-is
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
      return filename;
    }
    // If it already has the base path, return as-is
    if (filename.startsWith(this.baseUrl)) {
      return filename;
    }
    // Otherwise, prepend base URL
    return `${this.baseUrl}/${filename}`;
  }

  /**
   * Health check
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      // Check if directory exists and is writable
      await fs.promises.access(this.uploadsDir, fs.constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extract filename from URL or path
   * @private
   */
  _extractFilename(imageUrl) {
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
  }
}

export default LocalStorageStrategy;
