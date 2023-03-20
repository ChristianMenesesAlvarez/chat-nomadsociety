import jwt from 'jsonwebtoken';

export function verifyToken(token) {
  try {
    const verifyToken = jwt.verify(token, process.env.AUTH_SECRET_KEY)
    return verifyToken;
  } catch (error) {
    throw new Error('Invalid token')
  }
}