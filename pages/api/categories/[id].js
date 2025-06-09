/* pages/api/categories/[id].js
 * Rota para gerenciar categorias por ID
 * Permite buscar, atualizar e excluir categorias.
 */ 

import { findCategoryById, updateCategory, deleteCategory } from '../../../lib/categories';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  // Verificar autenticação
  const token = req.headers.authorization?.split(' ')[1];
  const user = verifyToken(token);
  
  if (!user) {
    return res.status(401).json({ message: 'Não autorizado' });
  }
  
  // Verificar se é admin para operações de escrita
  if (req.method !== 'GET' && !user.isAdmin) {
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem gerenciar categorias' });
  }
  
  const { id } = req.query;
  
  // Buscar categoria por ID (GET)
  if (req.method === 'GET') {
    try {
      const category = findCategoryById(id);
      
      if (!category) {
        return res.status(404).json({ message: 'Categoria não encontrada' });
      }
      
      return res.status(200).json(category);
    } catch (error) {
      console.error('Erro ao buscar categoria:', error);
      return res.status(500).json({ message: 'Erro ao buscar categoria' });
    }
  }
  
  // Atualizar categoria (PUT)
  if (req.method === 'PUT') {
    try {
      const { name, description } = req.body;
      
      // Atualizar categoria
      const updatedCategory = updateCategory(id, {
        name,
        description
      });
      
      if (!updatedCategory) {
        return res.status(404).json({ message: 'Categoria não encontrada' });
      }
      
      return res.status(200).json(updatedCategory);
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      
      if (error.message === 'Nome de categoria já existe') {
        return res.status(400).json({ message: error.message });
      }
      
      return res.status(500).json({ message: 'Erro ao atualizar categoria' });
    }
  }
  
  // Excluir categoria (DELETE)
  if (req.method === 'DELETE') {
    try {
      const deleted = deleteCategory(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Categoria não encontrada' });
      }
      
      return res.status(200).json({ message: 'Categoria excluída com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      return res.status(500).json({ message: 'Erro ao excluir categoria' });
    }
  }
  
  // Método não permitido
  return res.status(405).json({ message: 'Método não permitido' });
}
