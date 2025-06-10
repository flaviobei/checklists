/* pages/api/executions/index.js
 * Endpoint para registrar a execução de um checklist
 * Recebe dados do checklist executado e salva em um arquivo JSON
 * Permite que usuários registrem execuções sem duplicação
 */ 

import fs from 'fs';
import path from 'path';

// Caminho para o arquivo de execuções
const executionsFilePath = path.join(process.cwd(), 'data', 'executions.json');

export default async function handler(req, res) {
  // Apenas método POST é permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // Obter dados da requisição
    const { checklistId, userId, photos, completedItems } = req.body;

    // Validar dados obrigatórios
    if (!checklistId || !userId) {
      return res.status(400).json({ message: 'checklistId e userId são obrigatórios' });
    }

    // Ler arquivo de execuções existente
    let executions = [];
    try {
      const data = fs.readFileSync(executionsFilePath, 'utf8');
      executions = JSON.parse(data);
    } catch (error) {
      // Se o arquivo não existir ou estiver vazio, começamos com um array vazio
      console.error('Erro ao ler arquivo de execuções:', error);
    }

    // Verificar se este checklist já foi executado por este usuário
    const alreadyExecuted = executions.some(
      exec => exec.checklistId === checklistId && exec.userId === userId
    );

    if (alreadyExecuted) {
      return res.status(400).json({ message: 'Este checklist já foi executado por este usuário' });
    }

    // Criar novo registro de execução
    const newExecution = {
      checklistId,
      userId,
      completedAt: new Date().toISOString(),
      photos: photos || {}, // Salvar referências às fotos
      completedItems: completedItems || [] // Salvar status dos itens
    };

    // Adicionar ao array de execuções
    executions.push(newExecution);

    // Salvar arquivo atualizado
    fs.writeFileSync(executionsFilePath, JSON.stringify(executions, null, 2));

    // Retornar sucesso
    return res.status(201).json({ message: 'Execução registrada com sucesso', execution: newExecution });
  } catch (error) {
    console.error('Erro ao registrar execução:', error);
    return res.status(500).json({ message: 'Erro ao registrar execução' });
  }
}
