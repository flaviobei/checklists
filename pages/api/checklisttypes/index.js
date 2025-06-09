/* pages/api/checklisttypes/index.js */
// Rota para gerenciar tipos de checklist
// Permite listar todos os tipos de checklist e criar novos tipos.
// Apenas administradores podem criar tipos de checklist.


import { getAllChecklistTypes, createChecklistType } from '../../../lib/checklistTypes';

export default function handler(req, res) {
  if (req.method === 'GET') {
    const types = getAllChecklistTypes();
    res.status(200).json(types);
  } else if (req.method === 'POST') {
    try {
      const newType = createChecklistType(req.body);
      res.status(201).json(newType);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}