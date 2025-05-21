import jwt from 'jsonwebtoken';

// Chave secreta para JWT (em produção, use variável de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'checklist-system-secret-key';

// Gerar token JWT
export function generateToken(userId, isAdmin) {
  return jwt.sign(
    { id: userId, isAdmin },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// Verificar token JWT
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}
