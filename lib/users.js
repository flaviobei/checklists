import fs from 'fs';
import path from 'path';
import {
	v4 as uuidv4
} from 'uuid';
import bcrypt from 'bcryptjs';

// Caminho para o arquivo JSON de usuários
const usersFilePath = path.join(process.cwd(), 'data', 'users.json');

// Garantir que o diretório data existe
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
	fs.mkdirSync(dataDir, {
		recursive: true
	});
}

// Garantir que o arquivo users.json existe
if (!fs.existsSync(usersFilePath)) {
	// Criar usuário admin padrão
	const adminUser = {
		id: uuidv4(),
		username: 'admin',
		password: bcrypt.hashSync('admin123', 10),
		name: 'Administrador',
		isAdmin: true,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	fs.writeFileSync(usersFilePath, JSON.stringify([adminUser], null, 2));
}

// Função para ler todos os usuários
export function getAllUsers() {
	try {
		const data = fs.readFileSync(usersFilePath, 'utf8');
		return JSON.parse(data);
	} catch (error) {
		console.error('Erro ao ler usuários:', error);
		return [];
	}
}

// Função para buscar usuário por ID
export function findUserById(id) {
	const users = getAllUsers();
	return users.find(user => user.id === id);
}

// Função para buscar usuário por username
export function findUserByUsername(username) {
	const users = getAllUsers();
	return users.find(user => user.username === username);
}

// Função para comparar senha
export function comparePassword(password, hash) {
	return bcrypt.compareSync(password, hash);
}

// Função para criar um novo usuário
export function createUser(userData) {
	const users = getAllUsers();

	// Verificar se username já existe
	if (users.some(user => user.username === userData.username)) {
		throw new Error('Username já existe');
	}

	const newUser = {
		id: uuidv4(),
		username: userData.username,
		password: bcrypt.hashSync(userData.password, 10),
		name: userData.name,
		isAdmin: userData.isAdmin || false,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};

	users.push(newUser);
	fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));

	// Retornar usuário sem a senha
	const {
		password,
		...userWithoutPassword
	} = newUser;
	return userWithoutPassword;
}

// Função para atualizar um usuário
export function updateUser(id, userData) {
	const users = getAllUsers();
	const index = users.findIndex(user => user.id === id);

	if (index === -1) return null;

	// Verificar se o novo username já existe (se estiver sendo alterado)
	if (userData.username && userData.username !== users[index].username) {
		if (users.some(user => user.username === userData.username)) {
			throw new Error('Username já existe');
		}
	}

	// Não atualizar senha se não for fornecida
	if (userData.password) {
		userData.password = bcrypt.hashSync(userData.password, 10);
	} else {
		delete userData.password;
	}

	const updatedUser = {
		...users[index],
		...userData,
		updatedAt: new Date().toISOString()
	};

	users[index] = updatedUser;
	fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));

	// Retornar usuário sem a senha
	const {
		password,
		...userWithoutPassword
	} = updatedUser;
	return userWithoutPassword;
}

// Função para excluir um usuário
export function deleteUser(id) {
	const users = getAllUsers();
	const filteredUsers = users.filter(user => user.id !== id);

	if (filteredUsers.length === users.length) return false;

	fs.writeFileSync(usersFilePath, JSON.stringify(filteredUsers, null, 2));
	return true;
}