import { findChecklistTypeById, updateChecklistType, deleteChecklistType } from '../../../lib/checklistTypes';
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
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem gerenciar tipos de checklist' });
  }
  
  const { id } = req.query;
  
  // Buscar tipo de checklist por ID (GET)
  if (req.method === 'GET') {
    try {
      const checklistType = findChecklistTypeById(id);
      
      if (!checklistType) {
        return res.status(404).json({ message: 'Tipo de checklist não encontrado' });
      }
      
      return res.status(200).json(checklistType);
    } catch (error) {
      console.error('Erro ao buscar tipo de checklist:', error);
      return res.status(500).json({ message: 'Erro ao buscar tipo de checklist' });
    }
  }
  
  // Atualizar tipo de checklist (PUT)
  if (req.method === 'PUT') {
    try {
      const { name, description } = req.body;
      
      // Atualizar tipo de checklist
      const updatedChecklistType = updateChecklistType(id, {
        name,
        description
      });
      
      if (!updatedChecklistType) {
        return res.status(404).json({ message: 'Tipo de checklist não encontrado' });
      }
      
      return res.status(200).json(updatedChecklistType);
    } catch (error) {
      console.error('Erro ao atualizar tipo de checklist:', error);
      
      if (error.message === 'Nome de tipo de checklist já existe') {
        return res.status(400).json({ message: error.message });
      }
      
      return res.status(500).json({ message: 'Erro ao atualizar tipo de checklist' });
    }
  }
  
  // Excluir tipo de checklist (DELETE)
  if (req.method === 'DELETE') {
    try {
      const deleted = deleteChecklistType(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Tipo de checklist não encontrado' });
      }
      
      return res.status(200).json({ message: 'Tipo de checklist excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir tipo de checklist:', error);
      return res.status(500).json({ message: 'Erro ao excluir tipo de checklist' });
    }
  }
  
  // Método não permitido
  return res.status(405).json({ message: 'Método não permitido' });
}
