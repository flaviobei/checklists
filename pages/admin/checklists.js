/* pages/admin/checklists.js
 * Gerenciamento de Checklists
  * Permite criar, editar, excluir e ativar/desativar checklists
  * Utiliza autenticação via token JWT armazenado no localStorage
  * Inclui funcionalidades para imprimir QR Codes dos checklists
  * Filtra checklists por cliente selecionado
  */

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
    active: true,
    validity: '', // Adicionado o campo validity
    time: '' // Adicionado o campo time
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
      requirePhotos: false, items: [{ description: '', requirePhoto: false }], active: true,
      validity: '', // Resetar validity ao criar novo
      time: '' // Resetar time ao criar novo
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
      active: checklist.active,
      validity: checklist.validity ? checklist.validity.split('T')[0] : '', // Preencher validity, formatando para input type="date"
      time: checklist.time || '' // Preencher time
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
    // Validação para o campo validity
    if (formData.periodicity !== 'loose' && !formData.validity) {
      setError('A data de validade é obrigatória para checklists periódicos.');
      return;
    }
    // Validação para o campo time
    if (formData.periodicity !== 'loose' && !formData.time) {
      setError('O horário é obrigatório para checklists periódicos.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }

      const url = isEditing ? `/api/checklists/${formData.id}` : '/api/checklists';
      const method = isEditing ? 'PUT' : 'POST';

      // Ajustar o formato da data de validade para ISO string se for preenchida
      const dataToSend = { ...formData };
      if (dataToSend.validity) {
        dataToSend.validity = new Date(dataToSend.validity).toISOString();
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(dataToSend)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro ao salvar checklist' }));
        throw new Error(errorData.message || 'Erro ao salvar checklist');
      }
      await fetchChecklists(); // Re-busca checklists para atualizar a lista
      setShowForm(false);
    } catch (error) {
      console.error('Erro ao salvar checklist:', error);
      setError(error.message || 'Erro ao salvar checklist.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este checklist?')) return;

    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }

      const response = await fetch(`/api/checklists/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro ao excluir checklist' }));
        throw new Error(errorData.message || 'Erro ao excluir checklist');
      }
      await fetchChecklists(); // Re-busca checklists para atualizar a lista
    } catch (error) {
      console.error('Erro ao excluir checklist:', error);
      setError(error.message || 'Erro ao excluir checklist.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }

      const response = await fetch(`/api/checklists/${id}/toggle`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro ao alterar status' }));
        throw new Error(errorData.message || 'Erro ao alterar status');
      }
      await fetchChecklists(); // Re-busca checklists para atualizar a lista
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      setError(error.message || 'Erro ao alterar status.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.container}><p>Carregando...</p></div>;
  }

  return (
<div className={styles.container}>
      <header className={styles.header}>
         <div className={styles.logoContainer}>
           <a href='#' onClick={() => router.push('/admin')}><img src='../grupotb_logo.png' alt="Logo Grupo TB" title="Voltar para a Home"></img></a>
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

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.controls}>
        
        <div className={styles.filterGroup}>
          <label htmlFor="clientFilter">Filtrar por Cliente:</label>
          <select
            id="clientFilter"
            value={selectedClientId}
            onChange={handleClientFilterChange}
            className={styles.select}
          >
            <option value="">Todos os Clientes</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>
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
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Descrição:</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={styles.textarea}
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
                className={styles.select}
              >
                <option value="">Selecione um Cliente</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
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
                className={styles.select}
                disabled={!formData.clientId} // Desabilita se nenhum cliente for selecionado
              >
                <option value="">Selecione um Local</option>
                {filteredLocations.map(location => (
                  <option key={location.id} value={location.id}>{location.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="typeId">Tipo de Checklist:</label>
              <select
                id="typeId"
                name="typeId"
                value={formData.typeId}
                onChange={handleChange}
                required
                className={styles.select}
              >
                <option value="">Selecione um Tipo</option>
                {checklistTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="assignedTo">Atribuído a (Opcional):</label>
              <select
                id="assignedTo"
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="">Nenhum (Avulso)</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
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
                className={styles.select}
              >
                {periodicityOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {formData.periodicity === 'custom' && (
              <div className={styles.formGroup}>
                <label>Dias Personalizados:</label>
                <div className={styles.checkboxGroup}>
                  {weekDays.map(day => (
                    <label key={day.value} className={styles.checkboxLabel}>
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

            {/* Novo campo de Validade */}
            {formData.periodicity !== 'loose' && (
              <div className={styles.formGroup}>
                <label htmlFor="validity">Data de Validade:</label>
                <input
                  type="date"
                  id="validity"
                  name="validity"
                  value={formData.validity}
                  onChange={handleChange}
                  required={formData.periodicity !== 'loose'} // Obrigatório apenas para periódicos
                  disabled={formData.periodicity === 'loose'} // Desabilitado para avulsos
                  className={styles.input}
                />
              </div>
            )}

            {/* Novo campo de Horário */}
            {formData.periodicity !== 'loose' && (
              <div className={styles.formGroup}>
                <label htmlFor="time">Horário:</label>
                <input
                  type="time"
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required={formData.periodicity !== 'loose'} // Obrigatório apenas para periódicos
                  disabled={formData.periodicity === 'loose'} // Desabilitado para avulsos
                  className={styles.input}
                />
              </div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="requirePhotos" className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  id="requirePhotos"
                  name="requirePhotos"
                  checked={formData.requirePhotos}
                  onChange={handleChange}
                />
                Exigir Fotos
              </label>
            </div>

            <h3>Itens do Checklist</h3>
            {formData.items.map((item, index) => (
              <div key={index} className={styles.itemGroup}>
                <div className={styles.formGroup}>
                  <label htmlFor={`item-description-${index}`}>Descrição do Item:</label>
                  <input
                    type="text"
                    id={`item-description-${index}`}
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    required
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor={`item-requirePhoto-${index}`} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      id={`item-requirePhoto-${index}`}
                      checked={item.requirePhoto}
                      onChange={(e) => handleItemChange(index, 'requirePhoto', e.target.checked)}
                    />
                    Exigir Foto para este Item
                  </label>
                </div>
                <button type="button" onClick={() => handleRemoveItem(index)} className={styles.removeButton}>Remover Item</button>
              </div>
            ))}
            <button type="button" onClick={handleAddItem} className={styles.button}>Adicionar Item</button>

            <div className={styles.formActions}>
              <button type="submit" className={styles.button}>Salvar Checklist</button>
              <button type="button" onClick={() => setShowForm(false)} className={styles.buttonSecondary}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Título</th>
              <th>Cliente</th>
              <th>Local</th>
              <th>Tipo</th>
              <th>Atribuído a</th>
              <th>Periodicidade</th>
              <th>Validade</th> {/* Nova coluna para Validade */}
              <th>Horário</th> {/* Nova coluna para Horário */}
              <th>Ativo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {checklists.length === 0 ? (
              <tr>
                <td colSpan="10">Nenhum checklist encontrado.</td>
              </tr>
            ) : (
              checklists.map(checklist => (
                <tr key={checklist.id}>
                  <td>{checklist.title}</td>
                  <td>{clients.find(c => c.id === checklist.clientId)?.name || 'N/A'}</td>
                  <td>{locations.find(l => l.id === checklist.locationId)?.name || 'N/A'}</td>
                  <td>{checklistTypes.find(t => t.id === checklist.typeId)?.name || 'N/A'}</td>
                  <td>{users.find(u => u.id === checklist.assignedTo)?.name || 'Avulso'}</td>
                  <td>{periodicityOptions.find(p => p.value === checklist.periodicity)?.label || checklist.periodicity}</td>
                  <td>{checklist.validity ? new Date(checklist.validity).toLocaleDateString() : 'N/A'}</td> {/* Exibir validade */}
                  <td>{checklist.time || 'N/A'}</td> {/* Exibir horário */}
                  <td>{checklist.active ? 'Sim' : 'Não'}</td>
                  <td>
                    <button onClick={() => handleEdit(checklist)} className={styles.actionButton}>Editar</button>
                    <button onClick={() => handleDelete(checklist.id)} className={styles.actionButtonDanger}>Excluir</button>
                    <button onClick={() => handleToggleStatus(checklist.id, checklist.active)} className={styles.actionButton}>
                      {checklist.active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button onClick={() => handlePrintQRCode(checklist)} className={styles.printButton}>Imprimir QR</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

