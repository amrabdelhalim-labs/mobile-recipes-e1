/**
 * AWS S3 Storage Strategy
 *
 * Stores files in Amazon S3.
 * Requires @aws-sdk/client-s3 package.
 *
 * Setup:
 * 1. npm install @aws-sdk/client-s3
 * 2. Set environment variables: AWS_S3_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
 */

class S3StorageStrategy {
  constructor(config = {}) {
    this.s3Client = null;
    this.bucket = config.bucket || process.env.AWS_S3_BUCKET;
    this.region = config.region || process.env.AWS_REGION || 'us-east-1';
    this.accessKeyId = config.accessKeyId || process.env.AWS_ACCESS_KEY_ID;
    this.secretAccessKey = config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;
    this.folder = config.folder || 'uploads/images';

    if (!this.bucket || !this.accessKeyId || !this.secretAccessKey) {
      throw new Error(
        'AWS S3 credentials are required: AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY'
      );
    }

    this._initializeS3();
  }

  async _initializeS3() {
    try {
      const { S3Client } = await import('@aws-sdk/client-s3');

      this.s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey,
        },
      });

      console.log('✅ AWS S3 storage initialized');
    } catch (error) {
      throw new Error(
        'Failed to load @aws-sdk/client-s3. Install it with: npm install @aws-sdk/client-s3'
      );
    }
  }

  /**
   * Upload a single file to S3
   * @param {Express.Multer.File} file
   * @returns {Promise<{url: string, filename: string}>}
   */
  async uploadFile(file) {
    if (!this.s3Client) {
      await this._initializeS3();
    }

    const { PutObjectCommand } = await import('@aws-sdk/client-s3');

    // Generate unique key
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileExtension = file.originalname.split('.').pop();
    const key = `${this.folder}/${uniqueSuffix}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read', // Make publicly accessible
    });

    await this.s3Client.send(command);

    const url = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

    return {
      url,
      filename: key,
    };
  }

  /**
   * Upload multiple files
   * @param {Express.Multer.File[]} files
   * @returns {Promise<Array<{url: string, filename: string}>>}
   */
  async uploadFiles(files) {
    const uploadPromises = files.map((file) => this.uploadFile(file));
    return Promise.all(uploadPromises);
  }

  /**
   * Delete a file from S3
   * @param {string} keyOrUrl - S3 key or full URL
   * @returns {Promise<boolean>}
   */
  async deleteFile(keyOrUrl) {
    if (!this.s3Client) {
      await this._initializeS3();
    }

    try {
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');

      const key = this._extractKey(keyOrUrl);
      if (!key) return false;

      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      console.error(`Failed to delete from S3: ${keyOrUrl}`, error.message);
      return false;
    }
  }

  /**
   * Delete multiple files
   * @param {string[]} keys
   * @returns {Promise<{success: string[], failed: string[]}>}
   */
  async deleteFiles(keys) {
    const results = { success: [], failed: [] };

    for (const key of keys) {
      const deleted = await this.deleteFile(key);
      if (deleted) {
        results.success.push(key);
      } else {
        results.failed.push(key);
      }
    }

    return results;
  }

  /**
   * Get public URL for a file
   * @param {string} key
   * @returns {string}
   */
  getFileUrl(key) {
    if (key.startsWith('http://') || key.startsWith('https://')) {
      return key;
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  /**
   * Health check
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    if (!this.s3Client) {
      try {
        await this._initializeS3();
      } catch {
        return false;
      }
    }

    try {
      const { HeadBucketCommand } = await import('@aws-sdk/client-s3');
      const command = new HeadBucketCommand({ Bucket: this.bucket });
      await this.s3Client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extract S3 key from URL or return as-is
   * @private
   */
  _extractKey(urlOrKey) {
    if (!urlOrKey) return null;

    try {
      // If it's an S3 URL, extract the key
      if (urlOrKey.includes('s3.') && urlOrKey.includes('.amazonaws.com')) {
        const url = new URL(urlOrKey);
        return url.pathname.substring(1); // Remove leading /
      }
      // Otherwise, assume it's already a key
      return urlOrKey;
    } catch {
      return null;
    }
  }
}

export default S3StorageStrategy;
