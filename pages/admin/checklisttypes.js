import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/Admin.module.css';

export default function ChecklistTypeManagement() {
  const [checklistTypes, setChecklistTypes] = useState([]);
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
  
  // Buscar tipos de checklist ao carregar a página
  useEffect(() => {
    fetchChecklistTypes();
  }, []);
  
  // Função para buscar tipos de checklist
  const fetchChecklistTypes = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Obter token do localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }
      
      const response = await fetch('/api/checklisttypes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar tipos de checklist');
      }
      
      const data = await response.json();
      setChecklistTypes(data);
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao carregar tipos de checklist. Por favor, tente novamente.');
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
  const handleEdit = (checklistType) => {
    setFormData({
      id: checklistType.id,
      name: checklistType.name,
      description: checklistType.description || ''
    });
    setIsEditing(true);
    setShowForm(true);
  };
  
  // Função para salvar tipo de checklist (criar ou editar)
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
        setError('Nome do tipo de checklist é obrigatório');
        setLoading(false);
        return;
      }
      
      // Criar ou editar tipo de checklist
      const url = isEditing ? `/api/checklisttypes/${formData.id}` : '/api/checklisttypes';
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
        throw new Error(errorData.message || 'Erro ao salvar tipo de checklist');
      }
      
      // Atualizar lista de tipos de checklist
      await fetchChecklistTypes();
      
      // Fechar formulário
      setShowForm(false);
    } catch (error) {
      console.error('Erro:', error);
      setError(error.message || 'Erro ao salvar tipo de checklist. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para excluir tipo de checklist
  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este tipo de checklist?')) {
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
      
      const response = await fetch(`/api/checklisttypes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao excluir tipo de checklist');
      }
      
      // Atualizar lista de tipos de checklist
      await fetchChecklistTypes();
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao excluir tipo de checklist. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Gerenciamento de Tipos de Checklist</h1>
        <div className={styles.headerButtons}>
          <button onClick={() => router.push('/admin')} className={styles.backButton}>
            Voltar
          </button>
          <button onClick={handleCreate} className={styles.createButton}>
            Novo Tipo de Checklist
          </button>
        </div>
      </header>
      
      {error && <div className={styles.error}>{error}</div>}
      
      {showForm && (
        <div className={styles.formContainer}>
          <h2>{isEditing ? 'Editar Tipo de Checklist' : 'Novo Tipo de Checklist'}</h2>
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
        <h2>Lista de Tipos de Checklist</h2>
        
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
              {checklistTypes.length === 0 ? (
                <tr>
                  <td colSpan="3" className={styles.noData}>
                    Nenhum tipo de checklist encontrado
                  </td>
                </tr>
              ) : (
                checklistTypes.map(checklistType => (
                  <tr key={checklistType.id}>
                    <td>{checklistType.name}</td>
                    <td>{checklistType.description}</td>
                    <td className={styles.actions}>
                      <button
                        onClick={() => handleEdit(checklistType)}
                        className={styles.editButton}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(checklistType.id)}
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
