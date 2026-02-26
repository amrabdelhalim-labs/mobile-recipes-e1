import bcrypt from 'bcrypt';
import * as jwt from '../utilities/jwt.js';
import { getStorageService } from '../utilities/files.js';
import { getRepositoryManager } from '../repositories/index.js';

const DEFAULT_PROFILE_IMAGE = 'default-profile.svg';

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const repositories = getRepositoryManager();

    const existingUser = await repositories.user.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'الإيميل مستخدم بالفعل' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await repositories.user.create({
      name,
      email,
      password: hashedPassword,
    });

    console.log(`User registered: ${name} ${email}`);
    return res.status(201).json({ message: 'تم إنشاء الحساب بنجاح' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const repositories = getRepositoryManager();
    const user = await repositories.user.findByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'الإيميل أو كلمة المرور غير صحيحة' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'الإيميل أو كلمة المرور غير صحيحة' });
    }

    const token = jwt.generate({ id: user.id, email: user.email });
    return res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.currentUser?.id;
    if (!userId) {
      return res.status(401).json({ message: 'غير مصرح' });
    }

    const repositories = getRepositoryManager();
    const user = await repositories.user.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    const sanitizeUser = user.toJSON();
    delete sanitizeUser.password;

    return res.status(200).json({ user: sanitizeUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

const updateImage = async (req, res) => {
  let uploadedFile = null;

  try {
    const userId = req.currentUser?.id;
    if (!userId) {
      return res.status(401).json({ message: 'غير مصرح' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'لم يتم تحميل صورة' });
    }

    const repositories = getRepositoryManager();
    const user = await repositories.user.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    const previousImageUrl = user.ImageUrl;
    const storage = getStorageService();

    // Upload new image
    const uploadResult = await storage.uploadFile(req.file);
    uploadedFile = uploadResult;

    // Update database
    await repositories.user.update(userId, { ImageUrl: uploadResult.url });

    const sanitizeUser = user.toJSON();
    delete sanitizeUser.password;

    // Delete old image
    if (previousImageUrl && !previousImageUrl.includes(DEFAULT_PROFILE_IMAGE)) {
      await storage.deleteFile(previousImageUrl).catch((err) => {
        console.error('Failed to delete old profile picture:', err);
      });
    }

    return res
      .status(200)
      .json({ message: 'تم تحديث صورة الملف الشخصي بنجاح', user: sanitizeUser });
  } catch (error) {
    console.error('Error updating profile image:', error);

    // Cleanup uploaded image on error
    if (uploadedFile) {
      const storage = getStorageService();
      await storage.deleteFile(uploadedFile.filename).catch((err) => {
        console.error('Failed to cleanup uploaded image:', err);
      });
    }

    return res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

const resetImage = async (req, res) => {
  try {
    const userId = req.currentUser?.id;
    if (!userId) {
      return res.status(401).json({ message: 'غير مصرح' });
    }

    const repositories = getRepositoryManager();
    const user = await repositories.user.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    const previousImageUrl = user.ImageUrl;
    // Use an externally configured default URL when a cloud storage provider is active,
    // so the stored value is a valid absolute URL rather than a local /images/ path.
    // Set DEFAULT_PROFILE_IMAGE_URL on Heroku to the Cloudinary URL of the default avatar.
    const newImageUrl = process.env.DEFAULT_PROFILE_IMAGE_URL || `/images/${DEFAULT_PROFILE_IMAGE}`;

    await repositories.user.update(userId, { ImageUrl: newImageUrl });

    const sanitizeUser = user.toJSON();
    delete sanitizeUser.password;

    // Delete old image
    if (previousImageUrl && !previousImageUrl.includes(DEFAULT_PROFILE_IMAGE)) {
      const storage = getStorageService();
      await storage.deleteFile(previousImageUrl).catch((err) => {
        console.error('Failed to delete old profile picture:', err);
      });
    }

    return res
      .status(200)
      .json({ message: 'تمت إعادة الصورة الافتراضية بنجاح', user: sanitizeUser });
  } catch (error) {
    console.error('Error resetting profile image:', error);
    return res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

const updateInfo = async (req, res) => {
  try {
    const userId = req.currentUser?.id;
    if (!userId) {
      return res.status(401).json({ message: 'غير مصرح' });
    }

    const payload = req.body || {};
    const updates = {};

    if (payload.name !== undefined) {
      if (typeof payload.name !== 'string' || !payload.name.trim()) {
        return res.status(400).json({ message: 'الاسم غير صالح' });
      }

      updates.name = payload.name.trim();
    }

    if (payload.password !== undefined) {
      if (typeof payload.password !== 'string' || !payload.password) {
        return res.status(400).json({ message: 'كلمة المرور غير صالحة' });
      }

      const hashedPassword = await bcrypt.hash(payload.password, 10);
      updates.password = hashedPassword;
    }

    if (!updates.name && !updates.password) {
      return res.status(400).json({ message: 'لا توجد بيانات لتحديثها' });
    }

    const repositories = getRepositoryManager();
    const user = await repositories.user.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    await repositories.user.update(userId, updates);

    const sanitizeUser = user.toJSON();
    delete sanitizeUser.password;

    return res.status(200).json({ message: 'تم تحديث بيانات المستخدم بنجاح', user: sanitizeUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = req.currentUser?.id;
    if (!userId) {
      return res.status(401).json({ message: 'غير مصرح' });
    }

    const repositories = getRepositoryManager();
    const user = await repositories.user.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    const userImageUrl = user.ImageUrl;

    // Collect user's post images for deletion
    const userPosts = await repositories.post.findByUser(userId, 1, 1000);
    const filesToDelete = [];

    // Collect post images
    for (const post of userPosts.rows) {
      if (post.images && post.images.length > 0) {
        for (const img of post.images) {
          filesToDelete.push(img.imageUrl);
        }
      }
    }

    // Add profile image
    if (userImageUrl && !userImageUrl.includes(DEFAULT_PROFILE_IMAGE)) {
      filesToDelete.push(userImageUrl);
    }

    // Delete user (CASCADE will delete posts, comments, and likes)
    await repositories.user.delete(userId);

    // Delete files from storage
    if (filesToDelete.length > 0) {
      const storage = getStorageService();
      await storage.deleteFiles(filesToDelete).catch((err) => {
        console.error('Failed to delete user files from storage:', err);
      });
    }

    return res.status(200).json({ message: 'تم حذف الحساب بنجاح' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

export { register, login, getProfile, updateImage, resetImage, updateInfo, deleteUser };
