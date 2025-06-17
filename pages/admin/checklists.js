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
    active: true,
    validity: '',
    time: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [filteredLocations, setFilteredLocations] = useState([]);

  const router = useRouter();
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
  const weekDays = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda-feira' },
    { value: 1, label: 'Terça-feira' },
    { value: 1, label: 'Quarta-feira' },
    { value: 1, label: 'Quinta-feira' },
    { value: 1, label: 'Sexta-feira' },
    { value: 1, label: 'Sábado' },
  ];
  const monthDays = Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: `Dia ${i + 1}` }));

  const handlePrintQRCode = (checklist) => {
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
  const fetchLocations = async (clientId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      const url = clientId ? `/api/locations?clientId=${clientId}` : '/api/locations';
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error(`Erro ao buscar locais: ${response.statusText}`);
      }
      const data = await response.json();
      if (clientId) {
        setFilteredLocations(data);
      } else {
        setLocations(data);
      }
    } catch (error) {
      console.error('Erro fetchLocations:', error);
      if (!clientId) { // Apenas define erro global se estava buscando todos os locais
          setError('Erro ao carregar locais.');
      } else {
          console.error(`Erro ao buscar locais para o cliente ${clientId}:`, error);
          setFilteredLocations([]);
      }
    }
  };
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
  const fetchChecklists = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
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
      setChecklists([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError('');
      try {
        await Promise.all([
          fetchClients(),
          fetchChecklistTypes(),
          fetchUsers(),
          fetchLocations()
        ]);
        await fetchChecklists();
      } catch (err) {
        console.error("Erro no carregamento de dados iniciais:", err);
        setError('Falha ao carregar todos os dados iniciais. Verifique o console para detalhes.');
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);
  useEffect(() => {
    if (!loading) { // Opcional: evitar re-fetch se já estiver carregando algo do mount inicial
        fetchChecklists();
    }
  }, [selectedClientId]);
  useEffect(() => {
    if (formData.clientId) {
      fetchLocations(formData.clientId);
    } else {
      setFilteredLocations([]);
    }
  }, [formData.clientId]);
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
      [field]: value
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
      return { ...prev, customDays: updatedDays.sort((a, b) => a - b) };
    });
  };
  const handleClientFilterChange = (e) => {
    setSelectedClientId(e.target.value);
  };
  const handleCreate = () => {
    setFormData({
      id: '', title: '', description: '', clientId: '', locationId: '',
      typeId: '', assignedTo: '', periodicity: 'daily', customDays: [],
      requirePhotos: false, items: [{ description: '', requirePhoto: false }], active: true,
      validity: '',
      time: ''
    });
    setIsEditing(false);
    setShowForm(true);
    setError('');
    setFilteredLocations([]);
  };

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
      items: checklist.items && checklist.items.length > 0 ? checklist.items : [{ description: '', requirePhoto: false }],
      active: checklist.active,
      validity: checklist.validity ? checklist.validity.split('T')[0] : '',
      time: checklist.time || ''
    });
    setIsEditing(true);
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    if (formData.periodicity !== 'loose' && !formData.validity) {
      setError('A data de validade é obrigatória para checklists periódicos.');
      return;
    }
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
      await fetchChecklists();
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
      await fetchChecklists();
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
      await fetchChecklists();
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
                disabled={!formData.clientId}
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
                  required={formData.periodicity !== 'loose'}
                  disabled={formData.periodicity === 'loose'}
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
                  required={formData.periodicity !== 'loose'}
                  disabled={formData.periodicity === 'loose'}
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
  <div className={styles.actionsGrid4Buttons}>
    <button onClick={() => handleEdit(checklist)} className={styles.editButton}>Editar</button>
    <button onClick={() => handleDelete(checklist.id)} className={styles.deleteButton}>Excluir</button>
    <button onClick={() => handleToggleStatus(checklist.id, checklist.active)} className={styles.activateButton}>
      {checklist.active ? 'Desativar' : 'Ativar'}
    </button>
    <button onClick={() => handlePrintQRCode(checklist)} className={styles.qrButton}>Imprimir QR</button>
  </div>
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

