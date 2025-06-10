/* pages/api/checklists/index.js 
  * Rota para gerenciar checklists
  * Permite listar, criar e filtrar checklists por cliente, local ou usuário.
  * Usuários comuns podem ver apenas checklists atribuídos a eles ou avulsos.
  * Administradores podem gerenciar todos os checklists.
*/


import { getAllChecklists, createChecklist, findChecklistsByClientId, findChecklistsByLocationId, findChecklistsByUserId, generateQRCodeSVG, updateChecklist } from '../../../lib/checklists';
import { verifyToken } from '../../../lib/auth';
import fs from 'fs';
import path from 'path';

// Caminho para o arquivo de execuções
const executionsFilePath = path.join(process.cwd(), 'data', 'executions.json');

// Função auxiliar para verificar se um checklist está devido para execução AGORA
const isChecklistDue = (checklist, userId, allExecutions) => {
  // Adicionar verificação de validade
  if (checklist.validity && new Date(checklist.validity) < new Date()) {
    return false; // Checklist expirado
  }

  const userExecutions = allExecutions.filter(exec => exec.checklistId === checklist.id && exec.userId === userId);
  userExecutions.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  const lastExecution = userExecutions.length > 0 ? userExecutions[0] : null;

  if (!lastExecution) {
    return true; // Nunca foi executado, então está devido
  }

  const lastCompletedAt = new Date(lastExecution.completedAt);
  const now = new Date();

  // Lógica de periodicidade com horário
  switch (checklist.periodicity) {
    case 'loose':
      return false; // Já foi executado, não é devido novamente
    case 'daily':
      // Se a última execução foi hoje, verificar o horário
      if (lastCompletedAt.toDateString() === now.toDateString()) {
        if (checklist.time) {
          const [hours, minutes] = checklist.time.split(':').map(Number);
          const dueTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
          return now > dueTime && lastCompletedAt < dueTime; // Se já passou do horário e não foi executado depois do horário
        } else {
          return false; // Já executado hoje, sem horário definido, não devido
        }
      } else {
        return true; // Última execução foi antes de hoje, devido
      }
    case 'weekly':
      // Devido se a última execução foi antes desta semana
      const startOfWeekLastExecution = new Date(lastCompletedAt);
      startOfWeekLastExecution.setDate(lastCompletedAt.getDate() - lastCompletedAt.getDay());
      const startOfWeekNow = new Date(now);
      startOfWeekNow.setDate(now.getDate() - now.getDay());
      
      if (startOfWeekLastExecution.toDateString() === startOfWeekNow.toDateString()) {
        if (checklist.time) {
          const [hours, minutes] = checklist.time.split(':').map(Number);
          const dueTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
          return now > dueTime && lastCompletedAt < dueTime; // Se já passou do horário e não foi executado depois do horário
        } else {
          return false; // Já executado esta semana, sem horário definido, não devido
        }
      } else {
        return true; // Última execução foi antes desta semana, devido
      }
    case 'monthly':
      // Devido se a última execução foi antes deste mês
      if (lastCompletedAt.getMonth() === now.getMonth() && lastCompletedAt.getFullYear() === now.getFullYear()) {
        if (checklist.time) {
          const [hours, minutes] = checklist.time.split(':').map(Number);
          const dueTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
          return now > dueTime && lastCompletedAt < dueTime; // Se já passou do horário e não foi executado depois do horário
        } else {
          return false; // Já executado este mês, sem horário definido, não devido
        }
      } else {
        return true; // Última execução foi antes deste mês, devido
      }
    default:
      return true; // Periodicidade desconhecida ou não implementada, assume que está sempre devido
  }
};

export default async function handler(req, res) {
  const token = req.headers.authorization?.split(' ')[1];
  const user = verifyToken(token);
  
  if (!user) {
    return res.status(401).json({ message: 'Não autorizado' });
  }
  
  if (req.method !== 'GET' && !user.isAdmin) {
    return res.status(403).json({ message: 'Acesso negado.' });
  }
  
  if (req.method === 'GET') {
    try {
      const { clientId, locationId, userId } = req.query;
      
      if (userId) {
        // Lógica específica para a dashboard do profissional
        const allUserChecklists = findChecklistsByUserId(userId);
        let allExecutions = [];
        try {
          const data = fs.readFileSync(executionsFilePath, 'utf8');
          allExecutions = JSON.parse(data);
        } catch (error) {
          // Arquivo pode não existir ou estar vazio, não é um erro fatal
          console.warn('Não foi possível ler o arquivo de execuções ou ele está vazio:', error.message);
        }

        const now = new Date();
        const todayString = now.toDateString();

        // --- Daily Progress Calculation ---
        let pendingChecklistsToday = [];
        let totalDailyChecklists = 0;
        let completedDailyChecklistsToday = 0;

        // Filter for daily checklists assigned to the user
        const dailyChecklistsAssigned = allUserChecklists.filter(c => c.periodicity === 'daily');

        dailyChecklistsAssigned.forEach(checklist => {
          totalDailyChecklists++; // Count all daily checklists assigned

          const userExecutionsForThisChecklist = allExecutions.filter(exec => exec.checklistId === checklist.id && exec.userId === userId);
          userExecutionsForThisChecklist.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
          const lastExecution = userExecutionsForThisChecklist.length > 0 ? userExecutionsForThisChecklist[0] : null;

          let isCompletedToday = false;
          if (lastExecution && new Date(lastExecution.completedAt).toDateString() === todayString) {
            isCompletedToday = true;
          }

          if (isCompletedToday) {
            completedDailyChecklistsToday++;
          } else {
            // Check if it's due today based on time (if specified)
            let isDueBasedOnTime = true; // Assume true if no time specified or time has passed
            if (checklist.time) {
              const [hours, minutes] = checklist.time.split(':').map(Number);
              const dueTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
              if (now < dueTime) { // If current time is before due time, it's not yet due for today
                isDueBasedOnTime = false;
              }
            }

            // If not completed today and due based on time, add to pending today
            if (isDueBasedOnTime) {
              pendingChecklistsToday.push(checklist);
            }
          }
        });

        // --- Overall Stats Calculation ---
        // Total de checklists únicos que o profissional já executou pelo menos uma vez
        const totalCompletedOverall = new Set(allExecutions.filter(e => e.userId === userId).map(e => e.checklistId)).size;
        
        // Total de checklists periódicos (não avulsos) atribuídos ao usuário e válidos
        const totalScheduledOverall = allUserChecklists.filter(c => 
          c.periodicity !== 'loose' && 
          (!c.validity || new Date(c.validity) >= now)
        ).length;

        return res.status(200).json({
          dailyProgress: {
            pendingChecklistsToday: pendingChecklistsToday,
            totalDailyChecklists: totalDailyChecklists,
            completedDailyChecklistsToday: completedDailyChecklistsToday
          },
          overallStats: {
            totalCompletedOverall: totalCompletedOverall,
            totalScheduledOverall: totalScheduledOverall
          }
        });

      } else {
        // Lógica para admin (listagem geral ou filtrada)
        let checklists = getAllChecklists();
        if (clientId) {
          checklists = findChecklistsByClientId(clientId);
        } else if (locationId) {
          checklists = findChecklistsByLocationId(locationId);
        }
        return res.status(200).json(checklists);
      }
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
        items,
        validity,
        time 
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
        items,
        validity,
        time 
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


