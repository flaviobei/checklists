/* pages/api/auth/login.js
* Rota de autenticação para login de usuários
* Recebe username e password, valida as credenciais e retorna um token JWT.
*/


import jwt from 'jsonwebtoken';
import { findUserByUsername, comparePassword } from '../../../lib/db/users';

// Chave secreta para JWT (em produção, use variáveis de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'checklist-system-secret-key';

export default async function handler(req, res) {
  // Verificar se é uma requisição POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { username, password } = req.body;
    
    // Validar campos obrigatórios
    if (!username || !password) {
      return res.status(400).json({ message: 'Usuário e senha são obrigatórios' });
    }
    
    // Buscar usuário pelo username
    const user = findUserByUsername(username);
    
    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }
    
    // Verificar senha
    const passwordIsValid = comparePassword(password, user.password);
    
    if (!passwordIsValid) {
      return res.status(401).json({ message: 'Senha inválida' });
    }
    
    // Gerar token JWT
    const token = jwt.sign(
      { id: user.id, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Retornar dados do usuário e token
    return res.status(200).json({
      id: user.id,
      username: user.username,
      name: user.name,
      isAdmin: user.isAdmin,
      token
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
} // 👈 Aqui estava faltando essa chave
