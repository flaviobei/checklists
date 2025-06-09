/* pages/api/checklists/[id].js
 * Rota para gerenciar checklists por ID
  * Permite buscar, atualizar e excluir checklists.
  * Também permite que administradores ativem/desativem checklists.
  * Usuários comuns podem apenas buscar checklists atribuídos a eles.
  */

import { findChecklistById, updateChecklist, deleteChecklist, toggleChecklistStatus } from '../../../lib/checklists';
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
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem gerenciar checklists' });
  }
  
  const { id } = req.query;
  
  // Buscar checklist por ID (GET)
  if (req.method === 'GET') {
    try {
      const checklist = findChecklistById(id);
      
      if (!checklist) {
        return res.status(404).json({ message: 'Checklist não encontrado' });
      }
      
      // Se não for admin, verificar se tem acesso ao checklist
      if (!user.isAdmin && checklist.assignedTo !== user.id && checklist.assignedTo !== null) {
        return res.status(403).json({ message: 'Acesso negado a este checklist' });
      }
      
      return res.status(200).json(checklist);
    } catch (error) {
      console.error('Erro ao buscar checklist:', error);
      return res.status(500).json({ message: 'Erro ao buscar checklist' });
    }
  }
  
  // Atualizar checklist (PUT)
  if (req.method === 'PUT') {
    try {
      const { 
        title, 
        description, 
        clientId, 
        locationId, 
        typeId, 
        assignedTo, 
        periodicity, 
        customDays, 
        requirePhotos, 
        items,
        active
      } = req.body;
      
      // Atualizar checklist
      const updatedChecklist = updateChecklist(id, {
        title,
        description,
        clientId,
        locationId,
        typeId,
        assignedTo,
        periodicity,
        customDays,
        requirePhotos,
        items,
        active
      });
      
      if (!updatedChecklist) {
        return res.status(404).json({ message: 'Checklist não encontrado' });
      }
      
      return res.status(200).json(updatedChecklist);
    } catch (error) {
      console.error('Erro ao atualizar checklist:', error);
      
      if (error.message.includes('não encontrado') || 
          error.message.includes('deve ter pelo menos um item') ||
          error.message.includes('Periodicidade')) {
        return res.status(400).json({ message: error.message });
      }
      
      return res.status(500).json({ message: 'Erro ao atualizar checklist' });
    }
  }
  
  // Excluir checklist (DELETE)
  if (req.method === 'DELETE') {
    try {
      const deleted = deleteChecklist(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Checklist não encontrado' });
      }
      
      return res.status(200).json({ message: 'Checklist excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir checklist:', error);
      return res.status(500).json({ message: 'Erro ao excluir checklist' });
    }
  }
  
  // Método não permitido
  return res.status(405).json({ message: 'Método não permitido' });
}