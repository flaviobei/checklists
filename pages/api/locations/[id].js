import { findLocationById, updateLocation, deleteLocation } from '../../../lib/locations';
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
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem gerenciar locais' });
  }
  
  const { id } = req.query;
  
  // Buscar local por ID (GET)
  if (req.method === 'GET') {
    try {
      const location = findLocationById(id);
      
      if (!location) {
        return res.status(404).json({ message: 'Local não encontrado' });
      }
      
      return res.status(200).json(location);
    } catch (error) {
      console.error('Erro ao buscar local:', error);
      return res.status(500).json({ message: 'Erro ao buscar local' });
    }
  }
  
  // Atualizar local (PUT)
  if (req.method === 'PUT') {
    try {
      const { name, address, clientId, description } = req.body;
      
      // Atualizar local
      const updatedLocation = updateLocation(id, {
        name,
        address,
        clientId,
        description
      });
      
      if (!updatedLocation) {
        return res.status(404).json({ message: 'Local não encontrado' });
      }
      
      return res.status(200).json(updatedLocation);
    } catch (error) {
      console.error('Erro ao atualizar local:', error);
      
      if (error.message === 'Cliente não encontrado') {
        return res.status(400).json({ message: error.message });
      }
      
      if (error.message === 'Já existe um local com este nome para o cliente selecionado') {
        return res.status(400).json({ message: error.message });
      }
      
      return res.status(500).json({ message: 'Erro ao atualizar local' });
    }
  }
  
  // Excluir local (DELETE)
  if (req.method === 'DELETE') {
    try {
      const deleted = deleteLocation(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Local não encontrado' });
      }
      
      return res.status(200).json({ message: 'Local excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir local:', error);
      return res.status(500).json({ message: 'Erro ao excluir local' });
    }
  }
  
  // Método não permitido
  return res.status(405).json({ message: 'Método não permitido' });
}