/* pages/api/users/index.js */
// Rota para gerenciar usuários
// Permite listar todos os usuários e criar novos usuários.
// Apenas administradores podem gerenciar usuários.


import { getAllUsers, createUser } from '../../../lib/users';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  // Verificar autenticação
  const token = req.headers.authorization?.split(' ')[1];
  const user = verifyToken(token);
  
  if (!user) {
    return res.status(401).json({ message: 'Não autorizado' });
  }
  
  // Verificar se é admin
  if (!user.isAdmin) {
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem gerenciar usuários' });
  }
  
  // Listar todos os usuários (GET)
  if (req.method === 'GET') {
    try {
      const users = getAllUsers().map(user => {
        // Remover senha dos dados retornados
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      return res.status(200).json(users);
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      return res.status(500).json({ message: 'Erro ao listar usuários' });
    }
  }
  
  // Criar novo usuário (POST)
  if (req.method === 'POST') {
    try {
      const { username, password, name, isAdmin } = req.body;
      
      // Validar campos obrigatórios
      if (!username || !password || !name) {
        return res.status(400).json({ message: 'Campos obrigatórios: username, password, name' });
      }
      
      // Criar usuário
      const newUser = createUser({
        username,
        password,
        name,
        isAdmin: isAdmin || false
      });
      
      return res.status(201).json(newUser);
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      
      if (error.message === 'Username já existe') {
        return res.status(400).json({ message: error.message });
      }
      
      return res.status(500).json({ message: 'Erro ao criar usuário' });
    }
  }
  
  // Método não permitido
  return res.status(405).json({ message: 'Método não permitido' });
}