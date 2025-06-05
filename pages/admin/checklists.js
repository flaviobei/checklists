import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/Admin.module.css';

export default function ChecklistManagement() {
  const [checklists, setChecklists] = useState([]);
  const [clients, setClients] = useState([]);
  const [locations, setLocations] = useState([]); // Armazenará TODOS os locais
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
  const [selectedClientId, setSelectedClientId] = useState(''); // Para o filtro da TABELA
  const [filteredLocations, setFilteredLocations] = useState([]); // Para o dropdown de locais no FORMULÁRIO

  const router = useRouter();

  // Opções de periodicidade (mantido)
  const periodicityOptions = [
    { value: 'loose', label: 'Avulso/Emergência' },
    { value: 'daily', label: 'Diária' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensal' },
    { value: 'quarterly', label: 'Trimestral' },
    { value: 'semiannual', label: 'Semestral' },
    { value: 'annual', label: 'Anual' },
    { value: 'custom', label: 'Personalizada' }
  ];

  // Dias da semana (mantido)
  const weekDays = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda-feira' },
    { value: 1, label: 'Terça-feira' },
    { value: 1, label: 'Quarta-feira' },
    { value: 1, label: 'Quinta-feira' },
    { value: 1, label: 'Sexta-feira' },
    { value: 1, label: 'Sábado' },
    // ... resto dos dias
  ];

  // Dias do mês (mantido)
  const monthDays = Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: `Dia ${i + 1}` }));

  // Função para imprimir QR Code (mantida)
  const handlePrintQRCode = (checklist) => {
    // ... (código existente)
    if (checklist.qrCodePath) {
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
                    }
                    body { font-family: sans-serif; text-align: center; }
                    .container { padding: 20px; }
                    .no-print { margin-top: 20px; }
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
                <div class="no-print">
                    <button onclick="window.print()">Imprimir</button>
                    <button onclick="window.close()">Fechar</button>
                </div>
                <script>
                    window.onload = function() {
                        // Opcional: imprimir automaticamente
                        // window.print();
                    }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    } else {
        alert('QR Code SVG não disponível para este checklist');
    }
  };

  // Função para buscar clientes
  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }
      const response = await fetch('/api/clients', { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Erro ao buscar clientes');
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Erro fetchClients:', error);
      setError('Erro ao carregar clientes.');
    }
  };

  // Função para buscar locais (MODIFICADA)
  // Se clientId for fornecido, busca locais para filteredLocations (formulário).
  // Se clientId NÃO for fornecido, busca TODOS os locais para o estado 'locations'.
  const fetchLocations = async (clientId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      const url = clientId ? `/api/locations?clientId=${clientId}` : '/api/locations'; // API deve suportar /api/locations para todos
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error(`Erro ao buscar locais: ${response.statusText}`);
      }
      const data = await response.json();
      if (clientId) {
        setFilteredLocations(data); // Para o dropdown do formulário
      } else {
        setLocations(data); // Armazena todos os locais
      }
    } catch (error) {
      console.error('Erro fetchLocations:', error);
      // Não defina erro global aqui se for chamada para filteredLocations,
      // a menos que seja um erro crítico. A mensagem de erro no formulário pode ser mais específica.
      if (!clientId) { // Apenas define erro global se estava buscando todos os locais
          setError('Erro ao carregar locais.');
      } else {
          // Para o formulário, talvez uma mensagem local ou console.error seja suficiente
          console.error(`Erro ao buscar locais para o cliente ${clientId}:`, error);
          setFilteredLocations([]); // Limpa para evitar dados inconsistentes
      }
    }
  };

  // Função para buscar tipos de checklist
  const fetchChecklistTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }
      const response = await fetch('/api/checklisttypes', { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Erro ao buscar tipos de checklist');
      const data = await response.json();
      setChecklistTypes(data);
    } catch (error) {
      console.error('Erro fetchChecklistTypes:', error);
      setError('Erro ao carregar tipos de checklist.');
    }
  };

  // Função para buscar usuários
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }
      const response = await fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Erro ao buscar usuários');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Erro fetchUsers:', error);
      setError('Erro ao carregar usuários.');
    }
  };

  // Função para buscar checklists (MODIFICADA para ser chamada também ao mudar selectedClientId)
  const fetchChecklists = async () => {
    setLoading(true); // Sempre inicia o carregamento ao buscar checklists
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return; // setLoading(false) será chamado no finally
      }
      // Usa selectedClientId do filtro da tabela. Se vazio, busca todos.
      const url = selectedClientId ? `/api/checklists?clientId=${selectedClientId}` : '/api/checklists';
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error('Erro ao buscar checklists');
      }
      const data = await response.json();
      setChecklists(data);
    } catch (error) {
      console.error('Erro fetchChecklists:', error);
      setError('Erro ao carregar checklists. Por favor, tente novamente.');
      setChecklists([]); // Limpa checklists em caso de erro para evitar dados obsoletos
    } finally {
      setLoading(false);
    }
  };

  // Buscar dados iniciais ao carregar a página (MODIFICADO)
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError('');
      try {
        // Carrega clientes, tipos, usuários e TODOS os locais em paralelo
        await Promise.all([
          fetchClients(),
          fetchChecklistTypes(),
          fetchUsers(),
          fetchLocations() // Busca TODOS os locais e armazena em 'locations'
        ]);
        // Após os dados base estarem carregados, busca os checklists
        await fetchChecklists(); // Busca inicial de checklists (todos, pois selectedClientId é "" inicialmente)
      } catch (err) {
        // Promise.all rejeitará se qualquer uma das promessas internas rejeitar.
        // As funções fetch individuais já logam seus erros.
        // Aqui podemos definir um erro mais genérico se o carregamento geral falhar.
        console.error("Erro no carregamento de dados iniciais:", err);
        setError('Falha ao carregar todos os dados iniciais. Verifique o console para detalhes.');
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []); // Array de dependências vazio, executa apenas uma vez no mount

  // Atualizar checklists QUANDO O FILTRO DE CLIENTE DA TABELA (selectedClientId) mudar (NOVO/MODIFICADO)
  useEffect(() => {
    // Não precisa de uma verificação para evitar a chamada no mount inicial,
    // pois fetchChecklists() já é chamado no useEffect de mount.
    // Este useEffect garantirá que fetchChecklists seja chamado sempre que selectedClientId mudar APÓS o mount.
    if (!loading) { // Opcional: evitar re-fetch se já estiver carregando algo do mount inicial
        fetchChecklists();
    }
  }, [selectedClientId]);

  // Atualizar locais filtrados (para o dropdown no FORMULÁRIO) quando o cliente NO FORMULÁRIO mudar (MANTIDO)
  useEffect(() => {
    if (formData.clientId) {
      fetchLocations(formData.clientId); // Busca locais para 'filteredLocations' (dropdown do formulário)
    } else {
      setFilteredLocations([]); // Limpa se nenhum cliente estiver selecionado no formulário
    }
  }, [formData.clientId]);


  // --- Funções handleChange, handleItemChange, handleAddItem, handleRemoveItem, handleCustomDayChange ---
  // (Mantidas como estavam, parecem corretas)
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value // 'requirePhoto' já é boolean, não precisa de ternário
    };
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', requirePhoto: false }]
    }));
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length <= 1) {
      setError('O checklist deve ter pelo menos um item');
      return;
    }
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const handleCustomDayChange = (day, isChecked) => {
    setFormData(prev => {
      const currentCustomDays = prev.customDays || [];
      let updatedDays;
      if (isChecked) {
        updatedDays = currentCustomDays.includes(day) ? currentCustomDays : [...currentCustomDays, day];
      } else {
        updatedDays = currentCustomDays.filter(d => d !== day);
      }
      return { ...prev, customDays: updatedDays.sort((a, b) => a - b) }; // Opcional: manter ordenado
    });
  };


  // Função para lidar com mudanças no filtro de cliente DA TABELA (MANTIDO)
  const handleClientFilterChange = (e) => {
    setSelectedClientId(e.target.value);
    // A chamada fetchChecklists() agora é tratada pelo useEffect de selectedClientId
  };

  // --- Funções handleCreate, handleEdit, handleSubmit, handleDelete, handleToggleStatus ---
  // (Mantidas como estavam, mas note que fetchChecklists() será chamado após operações bem-sucedidas)
  const handleCreate = () => {
    setFormData({
      id: '', title: '', description: '', clientId: '', locationId: '',
      typeId: '', assignedTo: '', periodicity: 'daily', customDays: [],
      requirePhotos: false, items: [{ description: '', requirePhoto: false }], active: true
    });
    setIsEditing(false);
    setShowForm(true);
    setError(''); // Limpa erros ao abrir o formulário
    setFilteredLocations([]); // Limpa locais do formulário ao criar novo
  };

  const handleEdit = (checklist) => {
    setFormData({
      id: checklist.id,
      title: checklist.title,
      description: checklist.description || '',
      clientId: checklist.clientId, // Isso vai disparar o useEffect para carregar filteredLocations
      locationId: checklist.locationId,
      typeId: checklist.typeId,
      assignedTo: checklist.assignedTo || '',
      periodicity: checklist.periodicity,
      customDays: checklist.customDays || [],
      requirePhotos: checklist.requirePhotos || false,
      items: checklist.items && checklist.items.length > 0 ? checklist.items : [{ description: '', requirePhoto: false }],
      active: checklist.active
    });
    setIsEditing(true);
    setShowForm(true);
    setError(''); // Limpa erros ao abrir o formulário
    // filteredLocations será atualizado pelo useEffect de formData.clientId
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // ... (validações existentes) ...
    if (!formData.title || !formData.clientId || !formData.locationId || !formData.typeId || !formData.periodicity) {
        setError('Preencha todos os campos obrigatórios (Título, Cliente, Local, Tipo, Periodicidade)');
        return;
    }
    if (formData.items.length === 0 || formData.items.some(item => !item.description.trim())) {
        setError('O checklist deve ter pelo menos um item e todos os itens devem ter descrição.');
        return;
    }
    if (formData.periodicity === 'custom' && (!formData.customDays || formData.customDays.length === 0)) {
        setError('Selecione pelo menos um dia para a periodicidade personalizada');
        return;
    }

    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }

      const url = isEditing ? `/api/checklists/${formData.id}` : '/api/checklists';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro ao salvar checklist' }));
        throw new Error(errorData.message || 'Erro ao salvar checklist');
      }
      await fetchChecklists(); // Re-busca checklists para atualizar a lista
      setShowForm(false);
    } catch (error) {
      console.error('Erro handleSubmit:', error);
      setError(error.message || 'Erro ao salvar checklist.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este checklist?')) return;
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }
      const response = await fetch(`/api/checklists/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erro ao excluir checklist');
      await fetchChecklists(); // Re-busca checklists
    } catch (error) {
      console.error('Erro handleDelete:', error);
      setError('Erro ao excluir checklist.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }
      const response = await fetch(`/api/checklists/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erro ao ativar/desativar checklist');
      await fetchChecklists(); // Re-busca checklists
    } catch (error) {
      console.error('Erro handleToggleStatus:', error);
      setError('Erro ao ativar/desativar checklist.');
    } finally {
      setLoading(false);
    }
  };

  // --- Funções get...Name ---
  // (getClientName, getChecklistTypeName, getUserName, getPeriodicityText mantidas)

  const getClientName = (clientId) => {
    const client = clients.find(client => String(client.id) === String(clientId));
    return client ? client.name : 'Cliente não encontrado';
  };

  // Função para obter o nome do local pelo ID (MODIFICADA para usar 'locations')
  const getLocationName = (locationId) => {
    if (!locationId) return 'Local não especificado';
    // Busca na lista 'locations' que deve conter todos os locais
    const location = locations.find(loc => String(loc.id) === String(locationId));
    return location ? location.name : 'Local não encontrado';
  };

  const getChecklistTypeName = (typeId) => {
    const type = checklistTypes.find(type => String(type.id) === String(typeId));
    return type ? type.name : 'Tipo não encontrado';
  };

  const getUserName = (userId) => {
    if (!userId) return 'Avulso (Qualquer profissional)';
    const user = users.find(user => String(user.id) === String(userId));
    return user ? user.name : 'Usuário não encontrado';
  };

  const getPeriodicityText = (periodicity) => {
    const option = periodicityOptions.find(opt => opt.value === periodicity);
    return option ? option.label : periodicity;
  };

  // --- JSX de Renderização ---
  // (O JSX permanece o mesmo, pois as mudanças são na lógica de dados)
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <a href='#' onClick={() => router.push('/admin')}><img src='../grupotb_logo.png' alt='Logo GrupoTB'></img></a>
        </div>
        <h1>Gerenciamento de Checklists</h1>
        <div className={styles.headerButtons}>
          <button onClick={() => router.push('/admin')} className={styles.backButton}>Voltar</button>
          <button onClick={handleCreate} className={styles.createButton}>Novo Checklist</button>
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
            {/* Título */}
            <div className={styles.formGroup}>
              <label htmlFor="title">Título:</label>
              <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required />
            </div>
            {/* Descrição */}
            <div className={styles.formGroup}>
              <label htmlFor="description">Descrição:</label>
              <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows="3" />
            </div>
            {/* Cliente */}
            <div className={styles.formGroup}>
              <label htmlFor="clientId">Cliente:</label>
              <select id="clientId" name="clientId" value={formData.clientId} onChange={handleChange} required>
                <option value="">Selecione um Cliente</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
            {/* Local */}
            <div className={styles.formGroup}>
              <label htmlFor="locationId">Local:</label>
              <select
                id="locationId" name="locationId" value={formData.locationId} onChange={handleChange}
                required disabled={!formData.clientId || filteredLocations.length === 0}
              >
                <option value="">{formData.clientId ? (filteredLocations.length > 0 ? 'Selecione um Local' : 'Nenhum local para este cliente') : 'Selecione um cliente primeiro'}</option>
                {filteredLocations.map(location => (
                  <option key={location.id} value={location.id}>{location.name}</option>
                ))}
              </select>
              {!formData.clientId && <p className={styles.helperText}>Selecione um cliente para ver os locais.</p>}
              {formData.clientId && filteredLocations.length === 0 && <p className={styles.helperText}>Nenhum local cadastrado para este cliente.</p>}
            </div>
            {/* Tipo de Checklist */}
            <div className={styles.formGroup}>
              <label htmlFor="typeId">Tipo de Checklist:</label>
              <select id="typeId" name="typeId" value={formData.typeId} onChange={handleChange} required>
                <option value="">Selecione um Tipo</option>
                {checklistTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>
            {/* Atribuir a */}
            <div className={styles.formGroup}>
              <label htmlFor="assignedTo">Atribuir a:</label>
              <select id="assignedTo" name="assignedTo" value={formData.assignedTo} onChange={handleChange}>
                <option value="">Avulso (Qualquer profissional)</option>
                {users.filter(user => !user.isAdmin).map(user => ( // Exemplo: não atribuir a admins
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
            {/* Periodicidade */}
            <div className={styles.formGroup}>
              <label htmlFor="periodicity">Periodicidade:</label>
              <select id="periodicity" name="periodicity" value={formData.periodicity} onChange={handleChange} required>
                {periodicityOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            {/* Dias Personalizados (se periodicidade for 'custom') */}
            {formData.periodicity === 'custom' && (
              <div className={styles.formGroup}>
                <label>Dias Específicos (para periodicidade personalizada):</label>
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
                 {/* Adicionar aqui monthDays se necessário para 'custom' */}
              </div>
            )}
            {/* Exigir Fotos */}
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" name="requirePhotos" checked={formData.requirePhotos} onChange={handleChange} />
                Exigir fotos para todos os itens (padrão)
              </label>
            </div>
            {/* Itens do Checklist */}
            <div className={styles.formGroup}>
              <label>Itens do Checklist:</label>
              {formData.items.map((item, index) => (
                <div key={index} className={styles.itemContainer}>
                  <div className={styles.itemRow}>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      placeholder={`Descrição do item ${index + 1}`}
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
                    <button type="button" onClick={() => handleRemoveItem(index)} className={styles.removeItemButton}>Remover</button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={handleAddItem} className={styles.addItemButton}>Adicionar Item</button>
            </div>
            {/* Ativo (apenas na edição) */}
            {isEditing && (
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" name="active" checked={formData.active} onChange={handleChange} />
                  Ativo
                </label>
              </div>
            )}
            {/* Botões do Formulário */}
            <div className={styles.formButtons}>
              <button type="submit" className={styles.saveButton} disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className={styles.cancelButton} disabled={loading}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.tableContainer}>
        <h2>Lista de Checklists</h2>
        {loading && !showForm ? ( // Mostra loading da tabela apenas se o formulário não estiver aberto e estiver carregando
          <div className={styles.loading}>Carregando checklists...</div>
        ) : checklists.length === 0 && !loading ? ( // Se não estiver carregando e não houver checklists
          <div className={styles.noData}>Nenhum checklist encontrado {selectedClientId ? `para o cliente selecionado` : ''}.</div>
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
              {checklists.map(checklist => (
                <tr key={checklist.id} className={!checklist.active ? styles.inactiveRow : ''}>
                  <td>{checklist.title}</td>
                  <td>{getClientName(checklist.clientId)}</td>
                  <td>{getLocationName(checklist.locationId)}</td>
                  <td>{getChecklistTypeName(checklist.typeId)}</td>
                  <td>{getUserName(checklist.assignedTo)}</td>
                  <td>{getPeriodicityText(checklist.periodicity)}</td>
                  <td>{checklist.active ? 'Ativo' : 'Inativo'}</td>
                  <td className={styles.actions}>
                    <button onClick={() => handleEdit(checklist)} className={styles.editButton}>Editar</button>
                    <button onClick={() => handleToggleStatus(checklist.id)} className={checklist.active ? styles.deactivateButton : styles.activateButton}>
                      {checklist.active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button onClick={() => handlePrintQRCode(checklist)} className={styles.qrButton} disabled={!checklist.qrCodePath}>QR Code</button>
                    <button onClick={() => handleDelete(checklist.id)} className={styles.deleteButton}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}