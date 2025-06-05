import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/Admin.module.css';

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  
  const router = useRouter();
  
  // Buscar categorias ao carregar a página
  useEffect(() => {
    fetchCategories();
  }, []);
  
  // Função para buscar categorias
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Obter token do localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }
      
      const response = await fetch('/api/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar categorias');
      }
      
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao carregar categorias. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para lidar com mudanças no formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Função para abrir formulário de criação
  const handleCreate = () => {
    setFormData({
      id: '',
      name: '',
      description: ''
    });
    setIsEditing(false);
    setShowForm(true);
  };
  
  // Função para abrir formulário de edição
  const handleEdit = (category) => {
    setFormData({
      id: category.id,
      name: category.name,
      description: category.description || ''
    });
    setIsEditing(true);
    setShowForm(true);
  };
  
  // Função para salvar categoria (criar ou editar)
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
      if (!formData.name) {
        setError('Nome da categoria é obrigatório');
        setLoading(false);
        return;
      }
      
      // Criar ou editar categoria
      const url = isEditing ? `/api/categories/${formData.id}` : '/api/categories';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar categoria');
      }
      
      // Atualizar lista de categorias
      await fetchCategories();
      
      // Fechar formulário
      setShowForm(false);
    } catch (error) {
      console.error('Erro:', error);
      setError(error.message || 'Erro ao salvar categoria. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para excluir categoria
  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) {
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
      
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao excluir categoria');
      }
      
      // Atualizar lista de categorias
      await fetchCategories();
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao excluir categoria. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={styles.container}>
      <header className={styles.header}>
         <div className={styles.logoContainer}>
           <a href='#' onClick={() => router.push('/admin')}><img src='../grupotb_logo.png' alt="Logo Grupo TB" title="Voltar para a Home"></img></a>
      </div>

        <h1>Gerenciamento de Categorias de Profissionais</h1>
        <div className={styles.headerButtons}>
          <button onClick={() => router.push('/admin')} className={styles.backButton}>
            Voltar
          </button>
          <button onClick={handleCreate} className={styles.createButton}>
            Nova Categoria
          </button>
        </div>
      </header>
      
      {error && <div className={styles.error}>{error}</div>}
      
      {showForm && (
        <div className={styles.formContainer}>
          <h2>{isEditing ? 'Editar Categoria' : 'Nova Categoria'}</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
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
              <label htmlFor="description">Descrição:</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
              />
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
        <h2>Lista de Categorias</h2>
        
        {loading && !showForm ? (
          <div className={styles.loading}>Carregando...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan="3" className={styles.noData}>
                    Nenhuma categoria encontrada
                  </td>
                </tr>
              ) : (
                categories.map(category => (
                  <tr key={category.id}>
                    <td>{category.name}</td>
                    <td>{category.description}</td>
                    <td className={styles.actions}>
                      <button
                        onClick={() => handleEdit(category)}
                        className={styles.editButton}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
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
