import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Caminho para o arquivo JSON de categorias
const categoriesFilePath = path.join(process.cwd(), 'data', 'categories.json');

// Garantir que o diretório data existe
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Garantir que o arquivo categories.json existe
if (!fs.existsSync(categoriesFilePath)) {
  // Criar categorias padrão
  const defaultCategories = [
    {
      id: uuidv4(),
      name: 'Manutenção Geral',
      description: 'Profissionais de manutenção geral do prédio',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Eletricista',
      description: 'Profissionais especializados em sistemas elétricos',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Encanador',
      description: 'Profissionais especializados em sistemas hidráulicos',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Faxina',
      description: 'Profissionais de limpeza e conservação',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  
  fs.writeFileSync(categoriesFilePath, JSON.stringify(defaultCategories, null, 2));
}

// Função para ler todas as categorias
export function getAllCategories() {
  try {
    const data = fs.readFileSync(categoriesFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao ler categorias:', error);
    return [];
  }
}

// Função para buscar categoria por ID
export function findCategoryById(id) {
  const categories = getAllCategories();
  return categories.find(category => category.id === id);
}

// Função para buscar categoria por nome
export function findCategoryByName(name) {
  const categories = getAllCategories();
  return categories.find(category => category.name.toLowerCase() === name.toLowerCase());
}

// Função para criar uma nova categoria
export function createCategory(categoryData) {
  const categories = getAllCategories();
  
  // Verificar se nome já existe
  if (categories.some(category => category.name.toLowerCase() === categoryData.name.toLowerCase())) {
    throw new Error('Nome de categoria já existe');
  }
  
  const newCategory = {
    id: uuidv4(),
    name: categoryData.name,
    description: categoryData.description || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  categories.push(newCategory);
  fs.writeFileSync(categoriesFilePath, JSON.stringify(categories, null, 2));
  
  return newCategory;
}

// Função para atualizar uma categoria
export function updateCategory(id, categoryData) {
  const categories = getAllCategories();
  const index = categories.findIndex(category => category.id === id);
  
  if (index === -1) return null;
  
  // Verificar se o novo nome já existe (se estiver sendo alterado)
  if (
    categoryData.name && 
    categoryData.name.toLowerCase() !== categories[index].name.toLowerCase() && 
    categories.some(category => category.name.toLowerCase() === categoryData.name.toLowerCase())
  ) {
    throw new Error('Nome de categoria já existe');
  }
  
  const updatedCategory = {
    ...categories[index],
    ...categoryData,
    updatedAt: new Date().toISOString()
  };
  
  categories[index] = updatedCategory;
  fs.writeFileSync(categoriesFilePath, JSON.stringify(categories, null, 2));
  
  return updatedCategory;
}

// Função para excluir uma categoria
export function deleteCategory(id) {
  const categories = getAllCategories();
  const filteredCategories = categories.filter(category => category.id !== id);
  
  if (filteredCategories.length === categories.length) return false;
  
  fs.writeFileSync(categoriesFilePath, JSON.stringify(filteredCategories, null, 2));
  return true;
}
