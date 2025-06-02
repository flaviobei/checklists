import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/Admin.module.css';

export default function LocationManagement() {
  const [locations, setLocations] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    address: '',
    clientId: '',
    description: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  
  const router = useRouter();
  
  // Buscar locais e clientes ao carregar a página
  useEffect(() => {
    fetchClients();
    fetchLocations();
  }, []);
  
  // Atualizar locais quando o cliente selecionado mudar
  useEffect(() => {
    fetchLocations(selectedClientId);
  }, [selectedClientId]);
  
  // Função para buscar clientes
  const fetchClients = async () => {
    try {
      // Obter token do localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }
      
      const response = await fetch('/api/clients', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar clientes');
      }
      
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao carregar clientes. Por favor, tente novamente.');
    }
  };
  
  // Função para buscar locais
  const fetchLocations = async (clientId = '') => {
    try {
      setLoading(true);
      setError('');
      
      // Obter token do localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }
      
      // Construir URL com ou sem filtro de cliente
      const url = clientId ? `/api/locations?clientId=${clientId}` : '/api/locations';
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar locais');
      }
      
      const data = await response.json();
      setLocations(data);
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao carregar locais. Por favor, tente novamente.');
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
  
  // Função para lidar com mudanças no filtro de cliente
  const handleClientFilterChange = (e) => {
    setSelectedClientId(e.target.value);
  };
  
  // Função para abrir formulário de criação
  const handleCreate = () => {
    setFormData({
      id: '',
      name: '',
      address: '',
      clientId: selectedClientId || '',
      description: ''
    });
    setIsEditing(false);
    setShowForm(true);
  };
  
  // Função para abrir formulário de edição
  const handleEdit = (location) => {
    setFormData({
      id: location.id,
      name: location.name,
      address: location.address || '',
      clientId: location.clientId,
      description: location.description || ''
    });
    setIsEditing(true);
    setShowForm(true);
  };
  
  // Função para salvar local (criar ou editar)
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
      if (!formData.name || !formData.clientId) {
        setError('Nome e cliente são obrigatórios');
        setLoading(false);
        return;
      }
      
      // Criar ou editar local
      const url = isEditing ? `/api/locations/${formData.id}` : '/api/locations';
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
        throw new Error(errorData.message || 'Erro ao salvar local');
      }
      
      // Atualizar lista de locais
      await fetchLocations(selectedClientId);
      
      // Fechar formulário
      setShowForm(false);
    } catch (error) {
      console.error('Erro:', error);
      setError(error.message || 'Erro ao salvar local. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para excluir local
  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este local?')) {
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
      
      const response = await fetch(`/api/locations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao excluir local');
      }
      
      // Atualizar lista de locais
      await fetchLocations(selectedClientId);
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao excluir local. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para obter o nome do cliente pelo ID
  const getClientName = (clientId) => {
    const client = clients.find(client => client.id === clientId);
    return client ? client.name : 'Cliente não encontrado';
  };
  
  return (
    <div className={styles.container}>
      <header className={styles.header}>
       <div className={styles.logoContainer}>
          <img src='../grupotb_logo.png' alt='Logo GrupoTB'></img>
      </div>
        <h1>Gerenciamento de Locais</h1>
        <div className={styles.headerButtons}>
          <button onClick={() => router.push('/admin')} className={styles.backButton}>
            Voltar
          </button>
          <button onClick={handleCreate} className={styles.createButton}>
            Novo Local
          </button>
        </div>
      </header>
      
      {error && <div className={styles.error}>{error}</div>}
      
      <div className={styles.filterContainer}>
        <label htmlFor="clientFilter">Filtrar por Cliente:</label>
        <select
          id="clientFilter"
          value={selectedClientId}
          onChange={handleClientFilterChange}
          className={styles.filterSelect}
        >
          <option value="">Todos os Clientes</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>
      
      {showForm && (
        <div className={styles.formContainer}>
          <h2>{isEditing ? 'Editar Local' : 'Novo Local'}</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="clientId">Cliente:</label>
              <select
                id="clientId"
                name="clientId"
                value={formData.clientId}
                onChange={handleChange}
                required
              >
                <option value="">Selecione um Cliente</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
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
              <label htmlFor="address">Endereço/Localização:</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
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
        <h2>Lista de Locais</h2>
        
        {loading && !showForm ? (
          <div className={styles.loading}>Carregando...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Cliente</th>
                <th>Endereço/Localização</th>
                <th>Descrição</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {locations.length === 0 ? (
                <tr>
                  <td colSpan="5" className={styles.noData}>
                    Nenhum local encontrado
                  </td>
                </tr>
              ) : (
                locations.map(location => (
                  <tr key={location.id}>
                    <td>{location.name}</td>
                    <td>{getClientName(location.clientId)}</td>
                    <td>{location.address}</td>
                    <td>{location.description}</td>
                    <td className={styles.actions}>
                      <button
                        onClick={() => handleEdit(location)}
                        className={styles.editButton}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(location.id)}
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
