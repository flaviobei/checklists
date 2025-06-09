/* pages/api/users/[id].js
 * Rota para gerenciar usuários por ID
  * Permite buscar, atualizar e excluir usuários.
  * Apenas administradores podem gerenciar usuários.
  * Usuários comuns podem apenas buscar seus próprios dados.
  * Usuários comuns não podem atualizar ou excluir outros usuários.
  */

import { findUserById, updateUser, deleteUser } from '../../../lib/users';
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
  
  const { id } = req.query;
  
  // Buscar usuário por ID (GET)
  if (req.method === 'GET') {
    try {
      const user = findUserById(id);
      
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }
      
      // Remover senha dos dados retornados
      const { password, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return res.status(500).json({ message: 'Erro ao buscar usuário' });
    }
  }
  
  // Atualizar usuário (PUT)
  if (req.method === 'PUT') {
    try {
      const { username, password, name, isAdmin } = req.body;
      
      // Atualizar usuário
      const updatedUser = updateUser(id, {
        username,
        password,
        name,
        isAdmin
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }
      
      return res.status(200).json(updatedUser);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      
      if (error.message === 'Username já existe') {
        return res.status(400).json({ message: error.message });
      }
      
      return res.status(500).json({ message: 'Erro ao atualizar usuário' });
    }
  }
  
  // Excluir usuário (DELETE)
  if (req.method === 'DELETE') {
    try {
      const deleted = deleteUser(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }
      
      return res.status(200).json({ message: 'Usuário excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      return res.status(500).json({ message: 'Erro ao excluir usuário' });
    }
  }
  
  // Método não permitido
  return res.status(405).json({ message: 'Método não permitido' });
}