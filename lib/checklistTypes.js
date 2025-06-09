/* * @file lib/checklistTypes.js
 * Funções para gerenciar tipos de checklist
 * Inclui criação, atualização, exclusão e busca de tipos de checklist
 * Utiliza UUID para IDs únicos
*/

import fs from 'fs';
import path from 'path';
import {
	v4 as uuidv4
} from 'uuid';

// Caminho para o arquivo JSON de tipos de checklist
const checklistTypesFilePath = path.join(process.cwd(), 'data', 'checklistTypes.json');

// Garantir que o diretório data existe
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
	fs.mkdirSync(dataDir, {
		recursive: true
	});
}

// Garantir que o arquivo checklistTypes.json existe
if (!fs.existsSync(checklistTypesFilePath)) {
	// Criar tipos de checklist padrão
	const defaultChecklistTypes = [{
			id: uuidv4(),
			name: "Manutenção Preventiva",
			description: "Checklist para manutenção preventiva de equipamentos e instalações",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		},
		{
			id: uuidv4(),
			name: "Limpeza",
			description: "Checklist para verificação de limpeza de áreas comuns",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		},
		{
			id: uuidv4(),
			name: "Segurança",
			description: "Checklist para verificação de itens de segurança",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		}
	];

	fs.writeFileSync(checklistTypesFilePath, JSON.stringify(defaultChecklistTypes, null, 2));
}

// Função para ler todos os tipos de checklist
export function getAllChecklistTypes() {
	try {
		const data = fs.readFileSync(checklistTypesFilePath, 'utf8');
		return JSON.parse(data);
	} catch (error) {
		console.error('Erro ao ler tipos de checklist:', error);
		return [];
	}
}

// Função para buscar tipo de checklist por ID
export function findChecklistTypeById(id) {
	const checklistTypes = getAllChecklistTypes();
	return checklistTypes.find(type => type.id === id);
}

// Função para buscar tipo de checklist por nome
export function findChecklistTypeByName(name) {
	const checklistTypes = getAllChecklistTypes();
	return checklistTypes.find(type => type.name.toLowerCase() === name.toLowerCase());
}

// Função para criar um novo tipo de checklist
export function createChecklistType(checklistTypeData) {
	const checklistTypes = getAllChecklistTypes();

	// Verificar se nome já existe
	if (checklistTypes.some(type => type.name.toLowerCase() === checklistTypeData.name.toLowerCase())) {
		throw new Error('Nome de tipo de checklist já existe');
	}

	const newChecklistType = {
		id: uuidv4(),
		name: checklistTypeData.name,
		description: checklistTypeData.description || '',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	checklistTypes.push(newChecklistType);
	fs.writeFileSync(checklistTypesFilePath, JSON.stringify(checklistTypes, null, 2));

	return newChecklistType;
}

// Função para atualizar um tipo de checklist
export function updateChecklistType(id, checklistTypeData) {
	const checklistTypes = getAllChecklistTypes();
	const index = checklistTypes.findIndex(type => type.id === id);

	if (index === -1) return null;

	// Verificar se o novo nome já existe (se estiver sendo alterado)
	if (
		checklistTypeData.name &&
		checklistTypeData.name.toLowerCase() !== checklistTypes[index].name.toLowerCase() &&
		checklistTypes.some(type => type.name.toLowerCase() === checklistTypeData.name.toLowerCase())
	) {
		throw new Error('Nome de tipo de checklist já existe');
	}

	const updatedChecklistType = {
		...checklistTypes[index],
		...checklistTypeData,
		updatedAt: new Date().toISOString()
	};

	checklistTypes[index] = updatedChecklistType;
	fs.writeFileSync(checklistTypesFilePath, JSON.stringify(checklistTypes, null, 2));

	return updatedChecklistType;
}

// Função para excluir um tipo de checklist
export function deleteChecklistType(id) {
	const checklistTypes = getAllChecklistTypes();
	const filteredChecklistTypes = checklistTypes.filter(type => type.id !== id);

	if (filteredChecklistTypes.length === checklistTypes.length) return false;

	fs.writeFileSync(checklistTypesFilePath, JSON.stringify(filteredChecklistTypes, null, 2));
	return true;
}