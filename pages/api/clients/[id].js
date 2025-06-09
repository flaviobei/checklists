/* pages/api/clients/[id].js
  * Rota para gerenciar clientes por ID
  * Permite buscar, atualizar e excluir clientes.
  * Apenas administradores podem gerenciar clientes.
  * Usuários comuns podem apenas buscar clientes.
  */
 

import { findClientById, updateClient, deleteClient } from '../../../lib/clients';
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
  
  const { id } = req.query;
  
  // Buscar cliente por ID (GET)
  if (req.method === 'GET') {
    try {
      const client = findClientById(id);
      
      if (!client) {
        return res.status(404).json({ message: 'Cliente não encontrado' });
      }
      
      return res.status(200).json(client);
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      return res.status(500).json({ message: 'Erro ao buscar cliente' });
    }
  }
  
  // Atualizar cliente (PUT)
  if (req.method === 'PUT') {
    try {
      const { name, contactPerson, phone, email, address } = req.body;
      
      // Atualizar cliente
      const updatedClient = updateClient(id, {
        name,
        contactPerson,
        phone,
        email,
        address
      });
      
      if (!updatedClient) {
        return res.status(404).json({ message: 'Cliente não encontrado' });
      }
      
      return res.status(200).json(updatedClient);
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      
      if (error.message === 'Nome de cliente já existe') {
        return res.status(400).json({ message: error.message });
      }
      
      return res.status(500).json({ message: 'Erro ao atualizar cliente' });
    }
  }
  
  // Excluir cliente (DELETE)
  if (req.method === 'DELETE') {
    try {
      const deleted = deleteClient(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Cliente não encontrado' });
      }
      
      return res.status(200).json({ message: 'Cliente excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      return res.status(500).json({ message: 'Erro ao excluir cliente' });
    }
  }
  
  // Método não permitido
  return res.status(405).json({ message: 'Método não permitido' });
}