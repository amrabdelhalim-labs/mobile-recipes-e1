import { validationResult } from 'express-validator';
import fs from 'node:fs';
import path from 'node:path';
import { imagesRoot } from '../utilities/files.js';

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const files = [];
    if (Array.isArray(req.files)) {
      files.push(...req.files);
    } else if (req.file) {
      files.push(req.file);
    }

    if (files.length > 0) {
      for (const file of files) {
        const filePath = path.join(imagesRoot, file.filename);
        fs.promises.unlink(filePath).catch((err) => {
          if (err?.code !== 'ENOENT') {
            console.error('Failed to delete uploaded image:', err.message);
          }
        });
      }
    }

    return res.status(400).json({ errors: errors.array() });
  }

  return next();
};

export { validateRequest };
