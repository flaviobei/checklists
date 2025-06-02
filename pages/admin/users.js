import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/Admin.module.css';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    username: '',
    password: '',
    name: '',
    isAdmin: false
  });
  const [isEditing, setIsEditing] = useState(false);
  
  const router = useRouter();
  
  // Buscar usuários ao carregar a página
  useEffect(() => {
    fetchUsers();
  }, []);
  
  // Função para buscar usuários
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Obter token do localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }
      
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar usuários');
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao carregar usuários. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para lidar com mudanças no formulário
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Função para abrir formulário de criação
  const handleCreate = () => {
    setFormData({
      id: '',
      username: '',
      password: '',
      name: '',
      isAdmin: false
    });
    setIsEditing(false);
    setShowForm(true);
  };
  
  // Função para abrir formulário de edição
  const handleEdit = (user) => {
    setFormData({
      id: user.id,
      username: user.username,
      password: '', // Não preencher senha na edição
      name: user.name,
      isAdmin: user.isAdmin
    });
    setIsEditing(true);
    setShowForm(true);
  };
  
  // Função para salvar usuário (criar ou editar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      // Obter token do localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }
      
      // Validar campos obrigatórios
      if (!formData.username || (!isEditing && !formData.password) || !formData.name) {
        setError('Preencha todos os campos obrigatórios');
        setLoading(false);
        return;
      }
      
      // Criar ou editar usuário
      const url = isEditing ? `/api/users/${formData.id}` : '/api/users';
      const method = isEditing ? 'PUT' : 'POST';
      
      // Remover senha vazia na edição
      const dataToSend = { ...formData };
      if (isEditing && !dataToSend.password) {
        delete dataToSend.password;
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar usuário');
      }
      
      // Atualizar lista de usuários
      await fetchUsers();
      
      // Fechar formulário
      setShowForm(false);
    } catch (error) {
      console.error('Erro:', error);
      setError(error.message || 'Erro ao salvar usuário. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para excluir usuário
  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Obter token do localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }
      
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao excluir usuário');
      }
      
      // Atualizar lista de usuários
      await fetchUsers();
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao excluir usuário. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={styles.container}>
      <header className={styles.header}>
      <div className={styles.logoContainer}>
          <img src='../grupotb_logo.png' alt='Logo GrupoTB'></img>
      </div>

        <h1>Gerenciamento de Usuários</h1>
        <div className={styles.headerButtons}>
          <button onClick={() => router.push('/admin')} className={styles.backButton}>
            Voltar
          </button>
          <button onClick={handleCreate} className={styles.createButton}>
            Novo Usuário
          </button>
        </div>
      </header>
      
      {error && <div className={styles.error}>{error}</div>}
      
      {showForm && (
        <div className={styles.formContainer}>
          <h2>{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="username">Username:</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="password">
                Senha: {isEditing && <span>(Deixe em branco para manter a atual)</span>}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required={!isEditing}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="name">Nome:</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="isAdmin" className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  id="isAdmin"
                  name="isAdmin"
                  checked={formData.isAdmin}
                  onChange={handleChange}
                />
                Administrador
              </label>
            </div>
            
            <div className={styles.formButtons}>
              <button type="submit" className={styles.saveButton} disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className={styles.cancelButton}
                disabled={loading}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className={styles.tableContainer}>
        <h2>Lista de Usuários</h2>
        
        {loading && !showForm ? (
          <div className={styles.loading}>Carregando...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Username</th>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="4" className={styles.noData}>
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.name}</td>
                    <td>{user.isAdmin ? 'Administrador' : 'Operacional'}</td>
                    <td className={styles.actions}>
                      <button
                        onClick={() => handleEdit(user)}
                        className={styles.editButton}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className={styles.deleteButton}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}