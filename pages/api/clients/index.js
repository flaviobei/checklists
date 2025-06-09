/* pages/api/clients/index.js
 * Rota para gerenciar clientes
  * Permite listar todos os clientes e criar novos clientes.
  * Apenas administradores podem criar clientes.
  * Usuários comuns podem apenas listar clientes.
  *  
  * Esta rota não permite operações de atualização ou exclusão de clientes.
  */

import { getAllClients, createClient } from '../../../lib/clients';
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
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem gerenciar clientes' });
  }
  
  // Listar todos os clientes (GET)
  if (req.method === 'GET') {
    try {
      const clients = getAllClients();
      return res.status(200).json(clients);
    } catch (error) {
      console.error('Erro ao listar clientes:', error);
      return res.status(500).json({ message: 'Erro ao listar clientes' });
    }
  }
  
  // Criar novo cliente (POST)
  if (req.method === 'POST') {
    try {
      const { name, contactPerson, phone, email, address } = req.body;
      
      // Validar campos obrigatórios
      if (!name) {
        return res.status(400).json({ message: 'Nome do cliente é obrigatório' });
      }
      
      // Criar cliente
      const newClient = createClient({
        name,
        contactPerson,
        phone,
        email,
        address
      });
      
      return res.status(201).json(newClient);
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      
      if (error.message === 'Nome de cliente já existe') {
        return res.status(400).json({ message: error.message });
      }
      
      return res.status(500).json({ message: 'Erro ao criar cliente' });
    }
  }
  
  // Método não permitido
  return res.status(405).json({ message: 'Método não permitido' });
}