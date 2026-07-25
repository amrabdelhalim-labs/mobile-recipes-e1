import * as jwt from '../utilities/jwt.js';

const isAuthenticated = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'رمز غير صالح' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token);
    if (!decoded) {
      return res.status(401).json({ message: 'غير مصرح' });
    }

    req.currentUser = decoded;
    return next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: 'غير مصرح' });
  }
};

export { isAuthenticated };
