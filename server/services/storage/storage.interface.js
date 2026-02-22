/**
 * Storage Service Interface
 * 
 * Defines the contract for all storage strategies.
 * Any storage implementation (local, S3, Cloudinary, etc.) must implement these methods.
 */

/**
 * @typedef {Object} UploadResult
 * @property {string} url - Public URL to access the uploaded file
 * @property {string} filename - The filename (or key/identifier) in storage
 * @property {string} [publicId] - Optional public ID (used by Cloudinary)
 */

/**
 * @typedef {Object} StorageStrategy
 * @property {function(Express.Multer.File): Promise<UploadResult>} uploadFile - Uploads a single file
 * @property {function(Express.Multer.File[]): Promise<UploadResult[]>} uploadFiles - Uploads multiple files
 * @property {function(string): Promise<boolean>} deleteFile - Deletes a file by filename/key
 * @property {function(string[]): Promise<{success: string[], failed: string[]}>} deleteFiles - Deletes multiple files
 * @property {function(string): string} getFileUrl - Gets the public URL for a file
 * @property {function(): Promise<boolean>} healthCheck - Checks if the storage service is accessible
 */

export default {};
