import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }
  console.warn('JWT_SECRET is not set; using a development fallback');
}

const SECRET = JWT_SECRET || 'dev_jwt_secret';

const generate = (payload) => {
  return jwt.sign(payload, SECRET, { expiresIn: '30d' });
};

const verify = (token) => {
  try {
    return jwt.verify(token, SECRET);
  } catch (error) {
    return null;
  }
};

export { generate, verify };
