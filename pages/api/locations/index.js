import { getAllLocations, createLocation, findLocationsByClientId } from '../../../lib/locations';
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
  
  // Listar todos os locais ou filtrar por cliente (GET)
  if (req.method === 'GET') {
    try {
      const { clientId } = req.query;
      
      // Se clientId for fornecido, filtrar locais por cliente
      const locations = clientId 
        ? findLocationsByClientId(clientId)
        : getAllLocations();
      
      return res.status(200).json(locations);
    } catch (error) {
      console.error('Erro ao listar locais:', error);
      return res.status(500).json({ message: 'Erro ao listar locais' });
    }
  }
  
  // Criar novo local (POST)
  if (req.method === 'POST') {
    try {
      const { name, address, clientId, description } = req.body;
      
      // Validar campos obrigatórios
      if (!name || !clientId) {
        return res.status(400).json({ message: 'Nome e cliente são obrigatórios' });
      }
      
      // Criar local
      const newLocation = createLocation({
        name,
        address,
        clientId,
        description
      });
      
      return res.status(201).json(newLocation);
    } catch (error) {
      console.error('Erro ao criar local:', error);
      
      if (error.message === 'Cliente não encontrado') {
        return res.status(400).json({ message: error.message });
      }
      
      if (error.message === 'Já existe um local com este nome para o cliente selecionado') {
        return res.status(400).json({ message: error.message });
      }
      
      return res.status(500).json({ message: 'Erro ao criar local' });
    }
  }
  
  // Método não permitido
  return res.status(405).json({ message: 'Método não permitido' });
}
