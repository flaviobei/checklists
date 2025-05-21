import { getAllChecklistTypes, createChecklistType } from '../../../lib/checklistTypes';
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
  
  // Listar todos os tipos de checklist (GET)
  if (req.method === 'GET') {
    try {
      const checklistTypes = getAllChecklistTypes();
      return res.status(200).json(checklistTypes);
    } catch (error) {
      console.error('Erro ao listar tipos de checklist:', error);
      return res.status(500).json({ message: 'Erro ao listar tipos de checklist' });
    }
  }
  
  // Criar novo tipo de checklist (POST)
  if (req.method === 'POST') {
    try {
      const { name, description } = req.body;
      
      // Validar campos obrigatórios
      if (!name) {
        return res.status(400).json({ message: 'Nome do tipo de checklist é obrigatório' });
      }
      
      // Criar tipo de checklist
      const newChecklistType = createChecklistType({
        name,
        description
      });
      
      return res.status(201).json(newChecklistType);
    } catch (error) {
      console.error('Erro ao criar tipo de checklist:', error);
      
      if (error.message === 'Nome de tipo de checklist já existe') {
        return res.status(400).json({ message: error.message });
      }
      
      return res.status(500).json({ message: 'Erro ao criar tipo de checklist' });
    }
  }
  
  // Método não permitido
  return res.status(405).json({ message: 'Método não permitido' });
}
