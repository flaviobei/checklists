import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/Admin.module.css';

export default function ChecklistManagement() {
  const [checklists, setChecklists] = useState([]);
  const [clients, setClients] = useState([]);
  const [locations, setLocations] = useState([]);
  const [checklistTypes, setChecklistTypes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    clientId: '',
    locationId: '',
    typeId: '',
    assignedTo: '',
    periodicity: 'daily',
    customDays: [],
    requirePhotos: false,
    items: [{ description: '', requirePhoto: false }],
    active: true
  });
  const [isEditing, setIsEditing] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [filteredLocations, setFilteredLocations] = useState([]);
  
  const router = useRouter();
  
  // Opções de periodicidade
  const periodicityOptions = [
    { value: 'daily', label: 'Diária' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensal' },
    { value: 'quarterly', label: 'Trimestral' },
    { value: 'semiannual', label: 'Semestral' },
    { value: 'annual', label: 'Anual' },
    { value: 'custom', label: 'Personalizada' }
  ];
  
  // Dias da semana para periodicidade semanal ou personalizada
  const weekDays = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda-feira' },
    { value: 2, label: 'Terça-feira' },
    { value: 3, label: 'Quarta-feira' },
    { value: 4, label: 'Quinta-feira' },
    { value: 5, label: 'Sexta-feira' },
    { value: 6, label: 'Sábado' }
  ];
  
  // Dias do mês para periodicidade mensal ou personalizada
  const monthDays = Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: `Dia ${i + 1}` }));
  
  //edição da função de imprimir qrcode
  
// Função para imprimir QR Code (Modificada para usar SVG)
const handlePrintQRCode = (checklist) => {
  // Verifica se a string SVG do QR Code está disponível
  if (checklist.qrCodePath) { 
    // se estiver gera a janela de impressão

    const printWindow = window.open('', '_blank', 'width=300, height=500, toolbar=no,scrollbars=no,resizable=no');
    printWindow.document.write(`<html>
        <head>
          <title>Impressão de QR Code</title>
          <style>
            .qr-code-svg-container svg {
              max-width: 300px; 
              width: 100%; 
              height: auto; 
              border: 1px solid #ddd; 
              display: block; 
              margin: 0 auto 20px auto; 
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${checklist.title}</h1>
            <p>Escaneie o QR Code para acessar o checklist</p>
            <div class="qr-code-svg-container">
              ${checklist.qrCodePath}  
            </div>
          </div>
          <div class="no-print" style="margin-top: 20px;">
            <button onclick="window.print()">Imprimir</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  } else {
    alert('QR Code SVG não disponível para este checklist');
  }
};
  //fim função qr code
  
  // Buscar dados ao carregar a página
  useEffect(() => {
    fetchClients();
    fetchChecklistTypes();
    fetchUsers();
    fetchChecklists();
  }, []);
  
  // Atualizar locais quando o cliente selecionado mudar
  useEffect(() => {
    if (selectedClientId) {
      fetchLocations(selectedClientId);
    } else {
      setFilteredLocations([]);
    }
  }, [selectedClientId]);
  
  // Atualizar locais filtrados quando o cliente no formulário mudar
  useEffect(() => {
    if (formData.clientId) {
      fetchLocations(formData.clientId);
    } else {
      setFilteredLocations([]);
    }
  }, [formData.clientId]);
  
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
  const fetchLocations = async (clientId) => {
    try {
      // Obter token do localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }
      
      const response = await fetch(`/api/locations?clientId=${clientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar locais');
      }
      
      const data = await response.json();
      setFilteredLocations(data);
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao carregar locais. Por favor, tente novamente.');
    }
  };
  
  // Função para buscar tipos de checklist
  const fetchChecklistTypes = async () => {
    try {
      // Obter token do localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }
      
      console.log('Buscando tipos de checklist...');
      const response = await fetch('/api/checklisttypes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Status da resposta:', response.status);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar tipos de checklist: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Tipos de checklist recebidos:', data);
      setChecklistTypes(data);
    } catch (error) {
      console.error('Erro detalhado:', error);
      setError('Erro ao carregar tipos de checklist. Por favor, tente novamente.');
    }
  };
  
  // Função para buscar usuários
  const fetchUsers = async () => {
    try {
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
    }
  };
  
  // Função para buscar checklists
  const fetchChecklists = async () => {
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
      const url = selectedClientId ? `/api/checklists?clientId=${selectedClientId}` : '/api/checklists';
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar checklists');
      }
      
      const data = await response.json();
      setChecklists(data);
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao carregar checklists. Por favor, tente novamente.');
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
  
  // Função para lidar com mudanças nos itens do checklist
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'requirePhoto' ? value : value
    };
    
    setFormData({
      ...formData,
      items: updatedItems
    });
  };
  
  // Função para adicionar um novo item ao checklist
  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', requirePhoto: false }]
    });
  };
  
  // Função para remover um item do checklist
  const handleRemoveItem = (index) => {
    if (formData.items.length <= 1) {
      setError('O checklist deve ter pelo menos um item');
      return;
    }
    
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    
    setFormData({
      ...formData,
      items: updatedItems
    });
  };
  
  // Função para lidar com mudanças nos dias personalizados
  const handleCustomDayChange = (day, isChecked) => {
    let updatedDays = [...formData.customDays];
    
    if (isChecked) {
      // Adicionar dia se não existir
      if (!updatedDays.includes(day)) {
        updatedDays.push(day);
      }
    } else {
      // Remover dia
      updatedDays = updatedDays.filter(d => d !== day);
    }
    
    setFormData({
      ...formData,
      customDays: updatedDays
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
      title: '',
      description: '',
      clientId: '',
      locationId: '',
      typeId: '',
      assignedTo: '',
      periodicity: 'daily',
      customDays: [],
      requirePhotos: false,
      items: [{ description: '', requirePhoto: false }],
      active: true
    });
    setIsEditing(false);
    setShowForm(true);
  };
  
  // Função para abrir formulário de edição
  const handleEdit = (checklist) => {
    setFormData({
      id: checklist.id,
      title: checklist.title,
      description: checklist.description || '',
      clientId: checklist.clientId,
      locationId: checklist.locationId,
      typeId: checklist.typeId,
      assignedTo: checklist.assignedTo || '',
      periodicity: checklist.periodicity,
      customDays: checklist.customDays || [],
      requirePhotos: checklist.requirePhotos || false,
      items: checklist.items,
      active: checklist.active
    });
    setIsEditing(true);
    setShowForm(true);
  };
  
  // Função para salvar checklist (criar ou editar)
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
      if (!formData.title || !formData.clientId || !formData.locationId || !formData.typeId || !formData.periodicity) {
        setError('Preencha todos os campos obrigatórios');
        setLoading(false);
        return;
      }
      
      // Validar itens
      if (formData.items.length === 0) {
        setError('O checklist deve ter pelo menos um item');
        setLoading(false);
        return;
      }
      
      // Validar descrições dos itens
      for (const item of formData.items) {
        if (!item.description.trim()) {
          setError('Todos os itens devem ter uma descrição');
          setLoading(false);
          return;
        }
      }
      
      // Validar dias personalizados para periodicidade customizada
      if (formData.periodicity === 'custom' && formData.customDays.length === 0) {
        setError('Selecione pelo menos um dia para a periodicidade personalizada');
        setLoading(false);
        return;
      }
      
      // Criar ou editar checklist
      const url = isEditing ? `/api/checklists/${formData.id}` : '/api/checklists';
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
        throw new Error(errorData.message || 'Erro ao salvar checklist');
      }
      
      // Atualizar lista de checklists
      await fetchChecklists();
      
      // Fechar formulário
      setShowForm(false);
    } catch (error) {
      console.error('Erro:', error);
      setError(error.message || 'Erro ao salvar checklist. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para excluir checklist
  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este checklist?')) {
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
      
      const response = await fetch(`/api/checklists/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao excluir checklist');
      }
      
      // Atualizar lista de checklists
      await fetchChecklists();
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao excluir checklist. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para ativar/desativar checklist
  const handleToggleStatus = async (id) => {
    try {
      setLoading(true);
      setError('');
      
      // Obter token do localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }
      
      const response = await fetch(`/api/checklists/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao ativar/desativar checklist');
      }
      
      // Atualizar lista de checklists
      await fetchChecklists();
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao ativar/desativar checklist. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para obter o nome do cliente pelo ID
  const getClientName = (clientId) => {
    const client = clients.find(client => client.id === clientId);
    return client ? client.name : 'Cliente não encontrado';
  };
  
  // Função para obter o nome do local pelo ID
  
const getLocationName = (locationId) => {
  const id = String(locationId); 
  // Primeiro, tente encontrar na lista filtrada (se houver um cliente selecionado no formulário)
  const location = filteredLocations.find(location => String(location.id) === id);
  
  // Se não encontrar na filtrada, procure na lista completa de locais
  if (!location) {
    return locations.find(loc => String(loc.id) === id)?.name || 'Local não encontrado';
  }
  return location.name;
};

  // Função para obter o nome do tipo de checklist pelo ID
  const getChecklistTypeName = (typeId) => {
    const type = checklistTypes.find(type => type.id === typeId);
    return type ? type.name : 'Tipo não encontrado';
  };
  
  // Função para obter o nome do usuário pelo ID
  const getUserName = (userId) => {
    if (!userId) return 'Avulso (Qualquer profissional)';
    const user = users.find(user => user.id === userId);
    return user ? user.name : 'Usuário não encontrado';
  };
  
  // Função para obter o texto da periodicidade
  const getPeriodicityText = (periodicity) => {
    const option = periodicityOptions.find(opt => opt.value === periodicity);
    return option ? option.label : periodicity;
  };
  
  return (
    <div className={styles.container}>
      <header className={styles.header}>

       <div className={styles.logoContainer}>
          <img src='../grupotb_logo.png' alt='Logo GrupoTB'></img>
      </div>
      
        <h1>Gerenciamento de Checklists</h1>
        <div className={styles.headerButtons}>
          <button onClick={() => router.push('/admin')} className={styles.backButton}>
            Voltar
          </button>
          <button onClick={handleCreate} className={styles.createButton}>
            Novo Checklist
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
          <h2>{isEditing ? 'Editar Checklist' : 'Novo Checklist'}</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="title">Título:</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
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
              <label htmlFor="locationId">Local:</label>
              <select
                id="locationId"
                name="locationId"
                value={formData.locationId}
                onChange={handleChange}
                required
                disabled={!formData.clientId}
              >
                <option value="">Selecione um Local</option>
                {filteredLocations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
              {!formData.clientId && (
                <p className={styles.helperText}>Selecione um cliente primeiro</p>
              )}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="typeId">Tipo de Checklist:</label>
              <select
                id="typeId"
                name="typeId"
                value={formData.typeId}
                onChange={handleChange}
                required
              >
                <option value="">Selecione um Tipo</option>
                {checklistTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="assignedTo">Atribuir a:</label>
              <select
                id="assignedTo"
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
              >
                <option value="">Avulso (Qualquer profissional)</option>
                {users.filter(user => !user.isAdmin).map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="periodicity">Periodicidade:</label>
              <select
                id="periodicity"
                name="periodicity"
                value={formData.periodicity}
                onChange={handleChange}
                required
              >
                {periodicityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            {formData.periodicity === 'custom' && (
              <div className={styles.formGroup}>
                <label>Dias Específicos:</label>
                <div className={styles.checkboxGroup}>
                  {weekDays.map(day => (
                    <label key={day.value} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.customDays.includes(day.value)}
                        onChange={(e) => handleCustomDayChange(day.value, e.target.checked)}
                      />
                      {day.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="requirePhotos"
                  checked={formData.requirePhotos}
                  onChange={handleChange}
                />
                Exigir fotos para todos os itens
              </label>
            </div>
            
            <div className={styles.formGroup}>
              <label>Itens do Checklist:</label>
              {formData.items.map((item, index) => (
                <div key={index} className={styles.itemContainer}>
                  <div className={styles.itemRow}>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      placeholder="Descrição do item"
                      className={styles.itemInput}
                      required
                    />
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={item.requirePhoto}
                        onChange={(e) => handleItemChange(index, 'requirePhoto', e.target.checked)}
                      />
                      Exigir foto
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className={styles.removeItemButton}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}


              <button
                type="button"
                onClick={handleAddItem}
                className={styles.addItemButton}
              >
                Adicionar Item
              </button>
            </div>
            
            {isEditing && (
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={handleChange}
                  />
                  Ativo
                </label>
              </div>
            )}
            
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
        <h2>Lista de Checklists</h2>
        
        {loading && !showForm ? (
          <div className={styles.loading}>Carregando...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Título</th>
                <th>Cliente</th>
                <th>Local</th>
                <th>Tipo</th>
                <th>Atribuído a</th>
                <th>Periodicidade</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {checklists.length === 0 ? (
                <tr>
                  <td colSpan="8" className={styles.noData}>
                    Nenhum checklist encontrado
                  </td>
                </tr>
              ) : (
                checklists.map(checklist => (
                  <tr key={checklist.id} className={!checklist.active ? styles.inactiveRow : ''}>
                    <td>{checklist.title}</td>
                    <td>{getClientName(checklist.clientId)}</td>

                    <td>{getLocationName(checklist.locationId)}</td>
                    
                    <td>{getChecklistTypeName(checklist.typeId)}</td>
                    <td>{getUserName(checklist.assignedTo)}</td>
                    <td>{getPeriodicityText(checklist.periodicity)}</td>
                    <td>{checklist.active ? 'Ativo' : 'Inativo'}</td>
                    <td className={styles.actions}>
                      <button
                        onClick={() => handleEdit(checklist)}
                        className={styles.editButton}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleStatus(checklist.id)}
                        className={checklist.active ? styles.deactivateButton : styles.activateButton}
                      >
                        {checklist.active ? 'Desativar' : 'Ativar'}
                      </button>
                      <button
                        onClick={() => handlePrintQRCode(checklist)}
                        className={styles.qrButton}
                      >
                        QR Code
                      </button>
                      <button
                        onClick={() => handleDelete(checklist.id)}
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
