import { getAllChecklists, createChecklist, findChecklistsByClientId, findChecklistsByLocationId, findChecklistsByUserId, generateQRCodeSVG, updateChecklist } from '../../../lib/checklists';
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
  
  // Listar todos os checklists ou filtrar (GET)
  if (req.method === 'GET') {
    try {
      const { clientId, locationId, userId } = req.query;
      
      let checklists;
      
      // Filtrar por cliente
      if (clientId) {
        checklists = findChecklistsByClientId(clientId);
      }
      // Filtrar por local
      else if (locationId) {
        checklists = findChecklistsByLocationId(locationId);
      }
      // Filtrar por usuário
      else if (userId) {
        checklists = findChecklistsByUserId(userId);
      }
      // Listar todos
      else {
        checklists = getAllChecklists();
      }
      
      // Se não for admin, filtrar apenas os checklists atribuídos ao usuário ou avulsos
      if (!user.isAdmin) {
        checklists = checklists.filter(checklist => 
          checklist.assignedTo === user.id || checklist.assignedTo === null
        );
      }
      
      return res.status(200).json(checklists);
    } catch (error) {
      console.error('Erro ao listar checklists:', error);
      return res.status(500).json({ message: 'Erro ao listar checklists' });
    }
  }
  
  // Criar novo checklist (POST)
  if (req.method === 'POST') {
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
        items 
      } = req.body;
      
      // Validar campos obrigatórios
      if (!title || !clientId || !locationId || !typeId || !periodicity || !items || items.length === 0) {
        return res.status(400).json({ 
          message: 'Campos obrigatórios: título, cliente, local, tipo, periodicidade e pelo menos um item' 
        });
      }
      
      // Criar checklist
      const newChecklist = createChecklist({
        title,
        description,
        clientId,
        locationId,
        typeId,
        assignedTo,
        periodicity,
        customDays,
        requirePhotos,
        items
      });
      
      // Gerar QR Code
      try {
        const qrCodePath = await generateQRCodeSVG(newChecklist.id);
        
        // Atualizar checklist com o caminho do QR Code
        if (qrCodePath) {
          updateChecklist(newChecklist.id, { qrCodePath });
          newChecklist.qrCodePath = qrCodePath;
        }
      } catch (qrError) {
        console.error('Erro ao gerar QR Code:', qrError);
        // Não falhar a criação do checklist se o QR Code falhar
      }
      
      return res.status(201).json(newChecklist);
    } catch (error) {
      console.error('Erro ao criar checklist:', error);
      
      if (error.message.includes('não encontrado') || 
          error.message.includes('deve ter pelo menos um item') ||
          error.message.includes('Periodicidade')) {
        return res.status(400).json({ message: error.message });
      }
      
      return res.status(500).json({ message: 'Erro ao criar checklist' });
    }
  }
  
  // Método não permitido
  return res.status(405).json({ message: 'Método não permitido' });
}
