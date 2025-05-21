import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Caminho para o arquivo JSON de clientes
const clientsFilePath = path.join(process.cwd(), 'data', 'clients.json');

// Garantir que o diretório data existe
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Garantir que o arquivo clients.json existe
if (!fs.existsSync(clientsFilePath)) {
  // Criar clientes padrão
  const defaultClients = [
    {
      id: uuidv4(),
      name: "Condomínio Residencial Parque das Flores",
      contactPerson: "Maria Silva",
      phone: "(11) 98765-4321",
      email: "admin@parquedasflores.com.br",
      address: "Av. das Flores, 1000 - São Paulo/SP",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: "Edifício Comercial Central Tower",
      contactPerson: "João Oliveira",
      phone: "(11) 91234-5678",
      email: "administracao@centraltower.com.br",
      address: "Rua Augusta, 500 - São Paulo/SP",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  
  fs.writeFileSync(clientsFilePath, JSON.stringify(defaultClients, null, 2));
}

// Função para ler todos os clientes
export function getAllClients() {
  try {
    const data = fs.readFileSync(clientsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao ler clientes:', error);
    return [];
  }
}

// Função para buscar cliente por ID
export function findClientById(id) {
  const clients = getAllClients();
  return clients.find(client => client.id === id);
}

// Função para buscar cliente por nome
export function findClientByName(name) {
  const clients = getAllClients();
  return clients.find(client => client.name.toLowerCase() === name.toLowerCase());
}

// Função para criar um novo cliente
export function createClient(clientData) {
  const clients = getAllClients();
  
  // Verificar se nome já existe
  if (clients.some(client => client.name.toLowerCase() === clientData.name.toLowerCase())) {
    throw new Error('Nome de cliente já existe');
  }
  
  const newClient = {
    id: uuidv4(),
    name: clientData.name,
    contactPerson: clientData.contactPerson || '',
    phone: clientData.phone || '',
    email: clientData.email || '',
    address: clientData.address || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  clients.push(newClient);
  fs.writeFileSync(clientsFilePath, JSON.stringify(clients, null, 2));
  
  return newClient;
}

// Função para atualizar um cliente
export function updateClient(id, clientData) {
  const clients = getAllClients();
  const index = clients.findIndex(client => client.id === id);
  
  if (index === -1) return null;
  
  // Verificar se o novo nome já existe (se estiver sendo alterado)
  if (
    clientData.name && 
    clientData.name.toLowerCase() !== clients[index].name.toLowerCase() && 
    clients.some(client => client.name.toLowerCase() === clientData.name.toLowerCase())
  ) {
    throw new Error('Nome de cliente já existe');
  }
  
  const updatedClient = {
    ...clients[index],
    ...clientData,
    updatedAt: new Date().toISOString()
  };
  
  clients[index] = updatedClient;
  fs.writeFileSync(clientsFilePath, JSON.stringify(clients, null, 2));
  
  return updatedClient;
}

// Função para excluir um cliente
export function deleteClient(id) {
  const clients = getAllClients();
  const filteredClients = clients.filter(client => client.id !== id);
  
  if (filteredClients.length === clients.length) return false;
  
  fs.writeFileSync(clientsFilePath, JSON.stringify(filteredClients, null, 2));
  return true;
}
