/* lib/locarions.js
 * Biblioteca para gerenciar locais (locations) de clientes
 * Funções para ler, criar, atualizar e excluir locais
 */

import fs from 'fs';
import path from 'path';
import {
	v4 as uuidv4
} from 'uuid';
import {
	findClientById
} from './clients';

// Caminho para o arquivo JSON de locais
const locationsFilePath = path.join(process.cwd(), 'data', 'locations.json');

// Garantir que o diretório data existe
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
	fs.mkdirSync(dataDir, {
		recursive: true
	});
}

// Garantir que o arquivo locations.json existe
if (!fs.existsSync(locationsFilePath)) {
	// Criar locais padrão
	const defaultLocations = [{
			id: uuidv4(),
			name: "Hall de Entrada",
			address: "Térreo",
			clientId: "1", // ID do cliente Condomínio Residencial Parque das Flores
			description: "Hall de entrada principal do condomínio",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		},
		{
			id: uuidv4(),
			name: "Área da Piscina",
			address: "Área externa - Piso 1",
			clientId: "1", // ID do cliente Condomínio Residencial Parque das Flores
			description: "Área de lazer com piscina e deck",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		},
		{
			id: uuidv4(),
			name: "Recepção",
			address: "Térreo",
			clientId: "2", // ID do cliente Edifício Comercial Central Tower
			description: "Recepção principal do edifício comercial",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		}
	];

	fs.writeFileSync(locationsFilePath, JSON.stringify(defaultLocations, null, 2));
}

// Função para ler todos os locais
export function getAllLocations() {
	try {
		const data = fs.readFileSync(locationsFilePath, 'utf8');
		return JSON.parse(data);
	} catch (error) {
		console.error('Erro ao ler arquivo de locais:', error);
		// Se o arquivo não existir ou estiver vazio, retornar array vazio
		if (error.code === 'ENOENT') {
			return [];
		}
		throw error; // Relançar outros erros
	}
}


// Função para buscar local por ID
export function findLocationById(id) {
	const locations = getAllLocations();
	return locations.find(location => location.id === id);
}

// Função para buscar locais por cliente
export function findLocationsByClientId(clientId) {
	const locations = getAllLocations();
	return locations.filter(location => location.clientId === clientId);
}

// Função para criar um novo local
export function createLocation(locationData) {
	const locations = getAllLocations();

	// Verificar se o cliente existe
	const client = findClientById(locationData.clientId);
	if (!client) {
		throw new Error('Cliente não encontrado');
	}

	// Verificar se já existe um local com o mesmo nome para o mesmo cliente
	if (locations.some(location =>
			location.name.toLowerCase() === locationData.name.toLowerCase() &&
			location.clientId === locationData.clientId
		)) {
		throw new Error('Já existe um local com este nome para o cliente selecionado');
	}

	const newLocation = {
		id: uuidv4(),
		name: locationData.name,
		address: locationData.address || '',
		clientId: locationData.clientId,
		description: locationData.description || '',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	locations.push(newLocation);
	fs.writeFileSync(locationsFilePath, JSON.stringify(locations, null, 2));

	return newLocation;
}

// Função para atualizar um local
export function updateLocation(id, locationData) {
	const locations = getAllLocations();
	const index = locations.findIndex(location => location.id === id);

	if (index === -1) return null;

	// Verificar se o cliente existe (se estiver sendo alterado)
	if (locationData.clientId && locationData.clientId !== locations[index].clientId) {
		const client = findClientById(locationData.clientId);
		if (!client) {
			throw new Error('Cliente não encontrado');
		}
	}

	// Verificar se já existe um local com o mesmo nome para o mesmo cliente (se estiver sendo alterado)
	const clientId = locationData.clientId || locations[index].clientId;
	if (
		locationData.name &&
		locationData.name.toLowerCase() !== locations[index].name.toLowerCase() &&
		locations.some(location =>
			location.name.toLowerCase() === locationData.name.toLowerCase() &&
			location.clientId === clientId
		)
	) {
		throw new Error('Já existe um local com este nome para o cliente selecionado');
	}

	const updatedLocation = {
		...locations[index],
		...locationData,
		updatedAt: new Date().toISOString()
	};

	locations[index] = updatedLocation;
	fs.writeFileSync(locationsFilePath, JSON.stringify(locations, null, 2));

	return updatedLocation;
}

// Função para excluir um local
export function deleteLocation(id) {
	const locations = getAllLocations();
	const filteredLocations = locations.filter(location => location.id !== id);

	if (filteredLocations.length === locations.length) return false;

	fs.writeFileSync(locationsFilePath, JSON.stringify(filteredLocations, null, 2));
	return true;
}