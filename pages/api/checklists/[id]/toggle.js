/* pages/api/checklists/[id]/toggle.js
 * Rota para ativar/desativar checklists
  * Permite que administradores ativem ou desativem checklists.
  */
 

import { toggleChecklistStatus } from '../../../../lib/checklists';
import { verifyToken } from '../../../../lib/auth';

export default async function handler(req, res) {
  // Verificar autenticação
  const token = req.headers.authorization?.split(' ')[1];
  const user = verifyToken(token);
  
  if (!user) {
    return res.status(401).json({ message: 'Não autorizado' });
  }
  
  // Verificar se é admin
  if (!user.isAdmin) {
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem ativar/desativar checklists' });
  }
  
  const { id } = req.query;
  
  // Ativar/desativar checklist (PATCH)
  if (req.method === 'PATCH') {
    try {
      const updatedChecklist = toggleChecklistStatus(id);
      
      if (!updatedChecklist) {
        return res.status(404).json({ message: 'Checklist não encontrado' });
      }
      
      return res.status(200).json(updatedChecklist);
    } catch (error) {
      console.error('Erro ao ativar/desativar checklist:', error);
      return res.status(500).json({ message: 'Erro ao ativar/desativar checklist' });
    }
  }
  
  // Método não permitido
  return res.status(405).json({ message: 'Método não permitido' });
}