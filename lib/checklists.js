import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { findClientById } from './clients';
import { findLocationById } from './locations';
import { findUserById } from './users';
import { findChecklistTypeById } from './checklistTypes';
import QRCode from 'qrcode';

// Caminho para o arquivo JSON de checklists
const checklistsFilePath = path.join(process.cwd(), 'data', 'checklists.json');

// Garantir que o diretório data existe
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Garantir que o arquivo checklists.json existe
if (!fs.existsSync(checklistsFilePath)) {
  fs.writeFileSync(checklistsFilePath, JSON.stringify([], null, 2));
}

// Função para gerar QR Code SVG para um checklist
export async function generateQRCodeSVG(checklistId) {
  try {
    const checklistUrl = `/professional/execute-checklist/${checklistId}`; // Mantenha como estava ou use URL absoluta

    // Gerar QR Code como string SVG
    const svgString = await QRCode.toString(checklistUrl, {
      type: 'svg',
      color: {
        dark: '#000',  // Cor dos módulos escuros
        light: '#fff' // Cor do fundo (transparente se omitido ou com alpha)
      },

      margin: 1 // Margem em módulos QR
    });

    // Retornar a string SVG
    return svgString;

  } catch (error) {
    console.error('Erro ao gerar QR Code SVG:', error);
    return null; // Retorna null em caso de erro
  }
}


// Função para ler todos os checklists
export function getAllChecklists() {
  try {
    const data = fs.readFileSync(checklistsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao ler checklists:', error);
    return [];
  }
}

// Função para buscar checklist por ID
export function findChecklistById(id) {
  const checklists = getAllChecklists();
  return checklists.find(checklist => checklist.id === id);
}

// Função para buscar checklists por cliente
export function findChecklistsByClientId(clientId) {
  const checklists = getAllChecklists();
  return checklists.filter(checklist => checklist.clientId === clientId);
}

// Função para buscar checklists por local
export function findChecklistsByLocationId(locationId) {
  const checklists = getAllChecklists();
  return checklists.filter(checklist => checklist.locationId === locationId);
}

// Função para buscar checklists por profissional
export function findChecklistsByUserId(userId) {
  const checklists = getAllChecklists();
  return checklists.filter(checklist => 
    checklist.assignedTo === userId || checklist.assignedTo === null
  );
}

// Função para criar um novo checklist
export function createChecklist(checklistData) {
  const checklists = getAllChecklists();
  
  // Verificar se o cliente existe
  if (checklistData.clientId) {
    const client = findClientById(checklistData.clientId);
    if (!client) {
      throw new Error('Cliente não encontrado');
    }
  }
  
  // Verificar se o local existe
  if (checklistData.locationId) {
    const location = findLocationById(checklistData.locationId);
    if (!location) {
      throw new Error('Local não encontrado');
    }
  }
  
  // Verificar se o tipo de checklist existe
  if (checklistData.typeId) {
    const checklistType = findChecklistTypeById(checklistData.typeId);
    if (!checklistType) {
      throw new Error('Tipo de checklist não encontrado');
    }
  }
  
  // Verificar se o usuário existe (se atribuído)
  if (checklistData.assignedTo) {
    const user = findUserById(checklistData.assignedTo);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
  }
  
  // Validar itens do checklist
  if (!checklistData.items || !Array.isArray(checklistData.items) || checklistData.items.length === 0) {
    throw new Error('O checklist deve ter pelo menos um item');
  }
  
  // Validar periodicidade
  const validPeriodicities = ['daily', 'weekly', 'monthly', 'quarterly', 'semiannual', 'annual', 'custom'];
  if (!validPeriodicities.includes(checklistData.periodicity)) {
    throw new Error('Periodicidade inválida');
  }
  
  // Validar dias específicos para periodicidade customizada
  if (checklistData.periodicity === 'custom' && 
      (!checklistData.customDays || !Array.isArray(checklistData.customDays) || checklistData.customDays.length === 0)) {
    throw new Error('Periodicidade customizada deve ter dias específicos');
  }
  
  const newChecklist = {
    id: uuidv4(),
    title: checklistData.title,
    description: checklistData.description || '',
    clientId: checklistData.clientId,
    locationId: checklistData.locationId,
    typeId: checklistData.typeId,
    assignedTo: checklistData.assignedTo || null, // null significa que é avulso
    periodicity: checklistData.periodicity,
    customDays: checklistData.customDays || [],
    requirePhotos: checklistData.requirePhotos || false,
    items: checklistData.items.map(item => ({
      id: uuidv4(),
      description: item.description,
      requirePhoto: item.requirePhoto || false
    })),
    active: true,
    qrCodePath: null, // Será preenchido após a geração do QR Code
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  checklists.push(newChecklist);
  fs.writeFileSync(checklistsFilePath, JSON.stringify(checklists, null, 2));
  
  return newChecklist;
}

// Função para atualizar um checklist
export function updateChecklist(id, checklistData) {
  const checklists = getAllChecklists();
  const index = checklists.findIndex(checklist => checklist.id === id);
  
  if (index === -1) return null;
  
  // Verificar se o cliente existe
  if (checklistData.clientId) {
    const client = findClientById(checklistData.clientId);
    if (!client) {
      throw new Error('Cliente não encontrado');
    }
  }
  
  // Verificar se o local existe
  if (checklistData.locationId) {
    const location = findLocationById(checklistData.locationId);
    if (!location) {
      throw new Error('Local não encontrado');
    }
  }
  
  // Verificar se o tipo de checklist existe
  if (checklistData.typeId) {
    const checklistType = findChecklistTypeById(checklistData.typeId);
    if (!checklistType) {
      throw new Error('Tipo de checklist não encontrado');
    }
  }
  
  // Verificar se o usuário existe (se atribuído)
  if (checklistData.assignedTo) {
    const user = findUserById(checklistData.assignedTo);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
  }
  
  // Validar itens do checklist
  if (checklistData.items && (!Array.isArray(checklistData.items) || checklistData.items.length === 0)) {
    throw new Error('O checklist deve ter pelo menos um item');
  }
  
  // Validar periodicidade
  const validPeriodicities = ['daily', 'weekly', 'monthly', 'quarterly', 'semiannual', 'annual', 'custom'];
  if (checklistData.periodicity && !validPeriodicities.includes(checklistData.periodicity)) {
    throw new Error('Periodicidade inválida');
  }
  
  // Validar dias específicos para periodicidade customizada
  if (checklistData.periodicity === 'custom' && 
      (!checklistData.customDays || !Array.isArray(checklistData.customDays) || checklistData.customDays.length === 0)) {
    throw new Error('Periodicidade customizada deve ter dias específicos');
  }
  
  // Preparar itens atualizados
  let updatedItems = checklists[index].items;
  if (checklistData.items) {
    updatedItems = checklistData.items.map(item => {
      if (item.id) {
        // Item existente
        return {
          id: item.id,
          description: item.description,
          requirePhoto: item.requirePhoto || false
        };
      } else {
        // Novo item
        return {
          id: uuidv4(),
          description: item.description,
          requirePhoto: item.requirePhoto || false
        };
      }
    });
  }
  
  const updatedChecklist = {
    ...checklists[index],
    ...checklistData,
    items: updatedItems,
    updatedAt: new Date().toISOString()
  };
  
  checklists[index] = updatedChecklist;
  fs.writeFileSync(checklistsFilePath, JSON.stringify(checklists, null, 2));
  
  return updatedChecklist;
}

// Função para excluir um checklist
export function deleteChecklist(id) {
  const checklists = getAllChecklists();
  const filteredChecklists = checklists.filter(checklist => checklist.id !== id);
  
  if (filteredChecklists.length === checklists.length) return false;
  
  fs.writeFileSync(checklistsFilePath, JSON.stringify(filteredChecklists, null, 2));
  return true;
}

// Função para ativar/desativar um checklist
export function toggleChecklistStatus(id) {
  const checklists = getAllChecklists();
  const index = checklists.findIndex(checklist => checklist.id === id);
  
  if (index === -1) return null;
  
  checklists[index].active = !checklists[index].active;
  checklists[index].updatedAt = new Date().toISOString();
  
  fs.writeFileSync(checklistsFilePath, JSON.stringify(checklists, null, 2));
  
  return checklists[index];
}
