import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/Admin.module.css';

export default function ChecklistManagement() {
  const [checklists, setChecklists] = useState([]);
  const [clients, setClients] = useState([]);
  // State to hold ALL locations fetched initially
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
  // State for the client filter dropdown
  const [selectedClientId, setSelectedClientId] = useState(''); 
  // State for locations filtered by client *in the form*
  const [filteredLocations, setFilteredLocations] = useState([]); 
  
  const router = useRouter();
  
  // Opções de periodicidade (mantido como original)
  const periodicityOptions = [
    { value: 'daily', label: 'Diária' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensal' },
    { value: 'quarterly', label: 'Trimestral' },
    { value: 'semiannual', label: 'Semestral' },
    { value: 'annual', label: 'Anual' },
    { value: 'custom', label: 'Personalizada' }
  ];
  
  // Dias da semana (mantido como original)
  const weekDays = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda-feira' },
    { value: 2, label: 'Terça-feira' },
    { value: 3, label: 'Quarta-feira' },
    { value: 4, label: 'Quinta-feira' },
    { value: 5, label: 'Sexta-feira' },
    { value: 6, label: 'Sábado' }
  ];
  
  // Dias do mês (mantido como original)
  const monthDays = Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: `Dia ${i + 1}` }));
  
  // Função para imprimir QR Code (mantido como original)
  const handlePrintQRCode = (checklist) => {
    if (checklist.qrCodePath) { 
      const printWindow = window.open('', '_blank', 'width=300, height=500, toolbar=no,scrollbars=no,resizable=no');
      printWindow.document.write(`<html><head><title>Impressão de QR Code</title><style>.qr-code-svg-container svg { max-width: 300px; width: 100%; height: auto; border: 1px solid #ddd; display: block; margin: 0 auto 20px auto; }</style></head><body><div class="container"><h1>${checklist.title}</h1><p>Escaneie o QR Code para acessar o checklist</p><div class="qr-code-svg-container">${checklist.qrCodePath}</div></div><div class="no-print" style="margin-top: 20px;"><button onclick="window.print()">Imprimir</button></div></body></html>`);
      printWindow.document.close();
    } else {
      alert('QR Code SVG não disponível para este checklist');
    }
  };

  // *** CORREÇÃO: Buscar dados iniciais (exceto checklists) e TODOS os locais ***
  useEffect(() => {
    const initialFetch = async () => {
        // setLoading(true); // Loading is handled by fetchChecklists now
        setError('');
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            // setLoading(false); 
            return;
        }
        try {
            // Fetch clients, all locations, types, and users in parallel
            await Promise.all([
                fetchClients(token),
                fetchAllLocations(token), // Fetch ALL locations here
                fetchChecklistTypes(token),
                fetchUsers(token)
            ]);
        } catch (error) {
            console.error('Erro no carregamento inicial (dados base):', error);
            // setError might be set within individual fetch functions
        } 
        // No finally setLoading(false) here, fetchChecklists handles it
    };
    initialFetch();
  }, [router]); // Dependência apenas no router

  // *** CORREÇÃO: useEffect para buscar checklists baseado no filtro selectedClientId ***
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
        // This will run on initial load (selectedClientId is '') and on filter change
        fetchChecklists(token, selectedClientId);
    } else if (!token && router.pathname !== '/login') { // Avoid redirect loop if already on login
        router.push('/login');
    }
  }, [selectedClientId, router]); // Depend on selectedClientId and router

  // *** CORREÇÃO: useEffect para buscar locais PARA O FORMULÁRIO quando cliente no formulário muda ***
  useEffect(() => {
    if (formData.clientId) {
      fetchLocationsForForm(formData.clientId); // Use specific function for form
    } else {
      setFilteredLocations([]); // Clear form locations if no client selected in form
    }
  }, [formData.clientId]);

  // Função para buscar clientes (passando token)
  const fetchClients = async (token) => {
    try {
      const response = await fetch('/api/clients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erro ao buscar clientes');
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Erro fetchClients:', error);
      setError(prev => prev + '\nErro ao carregar clientes.');
      throw error; // Re-throw for Promise.all
    }
  };

  // *** NOVO: Função para buscar TODOS os locais ***
  const fetchAllLocations = async (token) => {
    try {
      const response = await fetch('/api/locations', { // Endpoint sem filtro
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erro ao buscar todos os locais');
      const data = await response.json();
      setLocations(data); // Atualiza o state 'locations' com todos os locais
    } catch (error) {
      console.error('Erro fetchAllLocations:', error);
      setError(prev => prev + '\nErro ao carregar lista completa de locais.');
      throw error; // Re-throw for Promise.all
    }
  };

  // Função para buscar locais PARA O FORMULÁRIO (filtrados por cliente)
  // Renamed from fetchLocations to fetchLocationsForForm
  const fetchLocationsForForm = async (clientId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      const response = await fetch(`/api/locations?clientId=${clientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erro ao buscar locais para o formulário');
      const data = await response.json();
      setFilteredLocations(data); // Atualiza a lista para o dropdown do formulário
    } catch (error) {
      console.error('Erro fetchLocationsForForm:', error);
      setError(prev => prev + '\nErro ao carregar locais para o formulário.');
      // Don't re-throw here, as it's not part of the initial Promise.all
    }
  };

  // Função para buscar tipos de checklist (passando token)
  const fetchChecklistTypes = async (token) => {
    try {
      const response = await fetch('/api/checklisttypes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`Erro ao buscar tipos: ${response.status}`);
      const data = await response.json();
      setChecklistTypes(data);
    } catch (error) {
      console.error('Erro fetchChecklistTypes:', error);
      setError(prev => prev + '\nErro ao carregar tipos de checklist.');
      throw error; // Re-throw for Promise.all
    }
  };

  // Função para buscar usuários (passando token)
  const fetchUsers = async (token) => {
    try {
      const response = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erro ao buscar usuários');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Erro fetchUsers:', error);
      setError(prev => prev + '\nErro ao carregar usuários.');
      throw error; // Re-throw for Promise.all
    }
  };

  // *** CORREÇÃO: Função para buscar checklists (aceita token e clientId) ***
  const fetchChecklists = async (token, clientId = '') => {
    try {
      setLoading(true); // Set loading true when fetching checklists
      setError('');

      // Construir URL com ou sem filtro de cliente
      const url = clientId ? `/api/checklists?clientId=${clientId}` : '/api/checklists';
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        // Try to read error message from response body
        let errorMsg = 'Erro ao buscar checklists';
        try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
        } catch (parseError) {
            // Ignore if response body is not JSON or empty
        }
        throw new Error(errorMsg);
      }
      
      const data = await response.json();
      setChecklists(data);
    } catch (error) {
      console.error('Erro fetchChecklists:', error);
      setError(`Erro ao carregar checklists: ${error.message}. Por favor, tente novamente.`);
    } finally {
      setLoading(false); // Set loading false after fetch attempt
    }
  };

  // Função para lidar com mudanças no formulário (mantido como original)
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Função para lidar com mudanças nos itens do checklist (mantido como original)
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'requirePhoto' ? value : value // Corrected logic for checkbox
    };
    setFormData({ ...formData, items: updatedItems });
  };

  // Função para adicionar um novo item ao checklist (mantido como original)
  const handleAddItem = () => {
    setFormData({ ...formData, items: [...formData.items, { description: '', requirePhoto: false }] });
  };

  // Função para remover um item do checklist (mantido como original)
  const handleRemoveItem = (index) => {
    if (formData.items.length <= 1) {
      setError('O checklist deve ter pelo menos um item');
      return;
    }
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    setFormData({ ...formData, items: updatedItems });
  };

  // Função para lidar com mudanças nos dias personalizados (mantido como original)
  const handleCustomDayChange = (day, isChecked) => {
    let updatedDays = [...formData.customDays];
    if (isChecked) {
      if (!updatedDays.includes(day)) updatedDays.push(day);
    } else {
      updatedDays = updatedDays.filter(d => d !== day);
    }
    setFormData({ ...formData, customDays: updatedDays });
  };

  // *** CORREÇÃO: Função para lidar com mudanças no filtro de cliente (APENAS atualiza o state) ***
  const handleClientFilterChange = (e) => {
    setSelectedClientId(e.target.value);
    // A busca de checklists agora é acionada pelo useEffect [selectedClientId]
  };

  // Função para abrir formulário de criação (mantido como original, mas limpa filteredLocations)
  const handleCreate = () => {
    setFormData({
      id: '', title: '', description: '', clientId: '', locationId: '', typeId: '',
      assignedTo: '', periodicity: 'daily', customDays: [], requirePhotos: false,
      items: [{ description: '', requirePhoto: false }], active: true
    });
    setIsEditing(false);
    setShowForm(true);
    setFilteredLocations([]); // Limpa locais do formulário ao criar
  };

  // Função para abrir formulário de edição (mantido como original, mas chama fetchLocationsForForm)
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
      // Ensure items is always an array, even if null/undefined from API
      items: Array.isArray(checklist.items) ? checklist.items : [{ description: '', requirePhoto: false }], 
      active: checklist.active
    });
    setIsEditing(true);
    setShowForm(true);
    // Busca locais para o formulário baseado no cliente do checklist sendo editado
    if(checklist.clientId) fetchLocationsForForm(checklist.clientId); 
  };

  // Função para salvar checklist (criar ou editar) (mantido como original, mas re-fetches allLocations)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Validações (mantidas como original)
      if (!formData.title || !formData.clientId || !formData.locationId || !formData.typeId || !formData.periodicity) {
        setError('Preencha todos os campos obrigatórios: Título, Cliente, Local, Tipo, Periodicidade');
        setLoading(false);
        return;
      }
      if (!formData.items || formData.items.length === 0 || formData.items.some(item => !item.description.trim())) {
          setError('O checklist deve ter pelo menos um item e todos os itens devem ter descrição.');
          setLoading(false);
          return;
      }
      if (formData.periodicity === 'custom' && (!formData.customDays || formData.customDays.length === 0)) {
          setError('Selecione pelo menos um dia para a periodicidade personalizada.');
          setLoading(false);
          return;
      }

      const url = isEditing ? `/api/checklists/${formData.id}` : '/api/checklists';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar checklist');
      }
      
      // Atualizar lista de checklists E lista completa de locais (caso um novo local tenha sido usado)
      await Promise.all([
          fetchChecklists(token, selectedClientId), // Rebusca checklists com filtro atual
          fetchAllLocations(token) // Rebusca todos os locais
      ]);
      
      setShowForm(false);
    } catch (error) {
      console.error('Erro handleSubmit:', error);
      setError(error.message || 'Erro ao salvar checklist. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para excluir checklist (mantido como original)
  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este checklist?')) return;
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      const response = await fetch(`/api/checklists/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erro ao excluir checklist');
      // Atualizar lista de checklists (usando o filtro atual)
      await fetchChecklists(token, selectedClientId);
    } catch (error) {
      console.error('Erro handleDelete:', error);
      setError('Erro ao excluir checklist. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para ativar/desativar checklist (mantido como original)
  const handleToggleStatus = async (id) => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      const response = await fetch(`/api/checklists/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erro ao ativar/desativar checklist');
      // Atualizar lista de checklists (usando o filtro atual)
      await fetchChecklists(token, selectedClientId);
    } catch (error) {
      console.error('Erro handleToggleStatus:', error);
      setError('Erro ao ativar/desativar checklist. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para obter o nome do cliente pelo ID (mantido como original, com conversão para string)
  const getClientName = (clientId) => {
    const idStr = String(clientId);
    const client = clients.find(client => String(client.id) === idStr);
    return client ? client.name : 'Cliente não encontrado';
  };

  // *** CORREÇÃO: Função para obter o nome do local pelo ID (usa a lista completa 'locations') ***
  const getLocationName = (locationId) => {
    const idStr = String(locationId);
    // Busca na lista completa 'locations' que foi carregada inicialmente
    const location = locations.find(loc => String(loc.id) === idStr);
    return location ? location.name : 'Local não encontrado';
  };

  // Função para obter o nome do tipo de checklist pelo ID (mantido como original, com conversão para string)
  const getChecklistTypeName = (typeId) => {
    const idStr = String(typeId);
    const type = checklistTypes.find(type => String(type.id) === idStr);
    return type ? type.name : 'Tipo não encontrado';
  };

  // Função para obter o nome do usuário pelo ID (mantido como original, com conversão para string)
  const getUserName = (userId) => {
    if (!userId) return 'N/A';
    const idStr = String(userId);
    const user = users.find(user => String(user.id) === idStr);
    return user ? user.name : 'Usuário não encontrado';
  };

  // Renderização do componente (JSX mantido como original, apenas usando as funções corrigidas)
  return (
    <div className={styles.container}>
      <h1>Gerenciamento de Checklists</h1>
      
      {error && <p className={styles.error}>{error}</p>}
      
      <div className={styles.controls}>
        <button onClick={handleCreate} className={styles.button}>Novo Checklist</button>
        <div className={styles.filter}>
          <label htmlFor="clientFilter">Filtrar por Cliente:</label>
          <select 
            id="clientFilter" 
            value={selectedClientId} 
            onChange={handleClientFilterChange} // Chama a função corrigida
            className={styles.select}
          >
            <option value="">Todos os Clientes</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Indicador de carregamento agora controlado pelo fetchChecklists */}
      {loading && <p>Carregando checklists...</p>} 
      
      {!loading && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Título</th>
              <th>Cliente</th>
              <th>Local</th>
              <th>Tipo</th>
              <th>Responsável</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {checklists.length > 0 ? (
              checklists.map(checklist => (
                <tr key={checklist.id}>
                  <td>{checklist.title}</td>
                  <td>{getClientName(checklist.clientId)}</td>
                  {/* Usa a função getLocationName corrigida */}
                  <td>{getLocationName(checklist.locationId)}</td> 
                  <td>{getChecklistTypeName(checklist.typeId)}</td>
                  <td>{getUserName(checklist.assignedTo)}</td>
                  <td>{checklist.active ? 'Ativo' : 'Inativo'}</td>
                  <td>
                    <button onClick={() => handleEdit(checklist)} className={`${styles.button} ${styles.editButton}`}>Editar</button>
                    <button onClick={() => handleDelete(checklist.id)} className={`${styles.button} ${styles.deleteButton}`}>Excluir</button>
                    <button onClick={() => handleToggleStatus(checklist.id)} className={`${styles.button} ${styles.toggleButton}`}>
                      {checklist.active ? 'Desativar' : 'Ativar'}
                    </button>
                     <button onClick={() => handlePrintQRCode(checklist)} className={`${styles.button} ${styles.printButton}`}>Imprimir QR</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                {/* Mensagem ajustada para quando não há checklists após o carregamento */}  
                <td colSpan="7">{selectedClientId ? 'Nenhum checklist encontrado para este cliente.' : 'Nenhum checklist encontrado.'}</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
      
      {/* Formulário Modal (JSX mantido como original, mas usa filteredLocations para o dropdown) */}
      {showForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>{isEditing ? 'Editar Checklist' : 'Novo Checklist'}</h2>
            <form onSubmit={handleSubmit}>
              {/* Título */}
              <div className={styles.formGroup}>
                <label htmlFor="title">Título:</label>
                <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required className={styles.input}/>
              </div>
              
              {/* Descrição */}
              <div className={styles.formGroup}>
                  <label htmlFor="description">Descrição:</label>
                  <textarea id="description" name="description" value={formData.description} onChange={handleChange} className={styles.textarea}></textarea>
              </div>

              {/* Cliente */}
              <div className={styles.formGroup}>
                <label htmlFor="clientId">Cliente:</label>
                <select id="clientId" name="clientId" value={formData.clientId} onChange={handleChange} required className={styles.select}>
                  <option value="">Selecione um Cliente</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Local (usa filteredLocations, populado por fetchLocationsForForm) */}
              <div className={styles.formGroup}>
                <label htmlFor="locationId">Local:</label>
                <select id="locationId" name="locationId" value={formData.locationId} onChange={handleChange} required disabled={!formData.clientId} className={styles.select}>
                  <option value="">{formData.clientId ? 'Selecione um Local' : 'Selecione um Cliente primeiro'}</option>
                  {/* Mapeia sobre filteredLocations para o dropdown do formulário */}
                  {filteredLocations.map(location => (
                    <option key={location.id} value={location.id}>{location.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Tipo de Checklist */}
              <div className={styles.formGroup}>
                <label htmlFor="typeId">Tipo de Checklist:</label>
                <select id="typeId" name="typeId" value={formData.typeId} onChange={handleChange} required className={styles.select}>
                  <option value="">Selecione um Tipo</option>
                  {checklistTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Usuário Responsável */}
              <div className={styles.formGroup}>
                <label htmlFor="assignedTo">Responsável:</label>
                <select id="assignedTo" name="assignedTo" value={formData.assignedTo} onChange={handleChange} className={styles.select}>
                  <option value="">Ninguém atribuído</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>

              {/* Periodicidade */}
              <div className={styles.formGroup}>
                  <label htmlFor="periodicity">Periodicidade:</label>
                  <select id="periodicity" name="periodicity" value={formData.periodicity} onChange={handleChange} required className={styles.select}>
                      {periodicityOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                  </select>
              </div>

              {/* Dias Personalizados (condicional) */}
              {formData.periodicity === 'custom' && (
                  <div className={styles.formGroup}>
                      <label>Dias Personalizados:</label>
                      <div className={styles.checkboxGroup}>
                          {weekDays.map(day => (
                              <label key={day.value}>
                                  <input 
                                      type="checkbox" 
                                      value={day.value} 
                                      checked={formData.customDays.includes(day.value)} 
                                      onChange={(e) => handleCustomDayChange(day.value, e.target.checked)} 
                                  />
                                  {day.label}
                              </label>
                          ))}
                      </div>
                  </div>
              )}
              
              {/* Exigir Fotos Geral */}
              <div className={styles.formGroup}>
                  <label>
                      <input 
                          type="checkbox" 
                          name="requirePhotos" 
                          checked={formData.requirePhotos} 
                          onChange={handleChange} 
                      />
                      Exigir fotos para todos os itens?
                  </label>
              </div>

              {/* Itens do Checklist */}
              <div className={styles.formGroup}>
                <label>Itens do Checklist:</label>
                {/* Garante que formData.items exista antes de mapear */}
                {formData.items && formData.items.map((item, index) => (
                  <div key={index} className={styles.itemRow}>
                    <input 
                      type="text" 
                      placeholder={`Descrição do Item ${index + 1}`} 
                      value={item.description} 
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)} 
                      required 
                      className={styles.itemInput}
                    />
                    <label className={styles.itemCheckboxLabel}>
                      <input 
                        type="checkbox" 
                        checked={item.requirePhoto} 
                        onChange={(e) => handleItemChange(index, 'requirePhoto', e.target.checked)} 
                      />
                      Exigir Foto?
                    </label>
                    {formData.items.length > 1 && (
                      <button type="button" onClick={() => handleRemoveItem(index)} className={styles.removeButton}>Remover</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={handleAddItem} className={styles.addButton}>Adicionar Item</button>
              </div>
              
              {/* Status Ativo */}
              <div className={styles.formGroup}>
                  <label>
                      <input 
                          type="checkbox" 
                          name="active" 
                          checked={formData.active} 
                          onChange={handleChange} 
                      />
                      Checklist Ativo
                  </label>
              </div>

              {/* Botões do Formulário */}
              <div className={styles.formActions}>
                <button type="submit" disabled={loading} className={styles.button}>{loading ? 'Salvando...' : 'Salvar'}</button>
                <button type="button" onClick={() => setShowForm(false)} className={`${styles.button} ${styles.cancelButton}`}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

