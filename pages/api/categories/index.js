import { getAllCategories, createCategory } from '../../../lib/categories';
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
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem gerenciar categorias' });
  }
  
  // Listar todas as categorias (GET)
  if (req.method === 'GET') {
    try {
      const categories = getAllCategories();
      return res.status(200).json(categories);
    } catch (error) {
      console.error('Erro ao listar categorias:', error);
      return res.status(500).json({ message: 'Erro ao listar categorias' });
    }
  }
  
  // Criar nova categoria (POST)
  if (req.method === 'POST') {
    try {
      const { name, description } = req.body;
      
      // Validar campos obrigatórios
      if (!name) {
        return res.status(400).json({ message: 'Nome da categoria é obrigatório' });
      }
      
      // Criar categoria
      const newCategory = createCategory({
        name,
        description
      });
      
      return res.status(201).json(newCategory);
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      
      if (error.message === 'Nome de categoria já existe') {
        return res.status(400).json({ message: error.message });
      }
      
      return res.status(500).json({ message: 'Erro ao criar categoria' });
    }
  }
  
  // Método não permitido
  return res.status(405).json({ message: 'Método não permitido' });
}
