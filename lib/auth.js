/* * lib/auth.js
 * Funções para autenticação usando JWT
  * Utiliza a biblioteca jsonwebtoken para gerar e verificar tokens
  * Importante: em produção, a chave secreta deve ser armazenada em uma variável de ambiente
  * Exemplo de uso:
  * import { generateToken, verifyToken } from './lib/auth';
  * const token = generateToken(userId, isAdmin); 
  * const decoded = verifyToken(token);
  * Se o token for válido, decoded conterá os dados do usuário; caso contrário, será null
 */

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
