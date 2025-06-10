/* pages/admin/executados.js
 * Listagem de Checklists Executados
 * Permite visualizar checklists por período
 * Inclui filtros por data (hoje ou intervalo), cliente e técnico
 * Diferencia visualmente checklists executados (cinza) e pendentes (verde)
 * Mantém funcionalidade de impressão de QR Codes
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/Admin.module.css';

export default function ExecutedChecklists() {
  const [checklists, setChecklists] = useState([]);
  const [clients, setClients] = useState([]);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [checklistTypes, setChecklistTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtros
  const [dateFilterMode, setDateFilterMode] = useState('today'); // 'today' ou 'range'
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(''); // Alterado de selectedTechnicianId para selectedUserId

  const router = useRouter();

  // Função para imprimir QR Code (mantida igual)
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

  // Funções para buscar dados (mantidas iguais)
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

  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      const response = await fetch('/api/locations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error(`Erro ao buscar locais: ${response.statusText}`);
      }
      const data = await response.json();
      setLocations(data);
    } catch (error) {
      console.error('Erro fetchLocations:', error);
      setError('Erro ao carregar locais.');
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

  // Função para buscar checklists com filtros (modificada para usar userId)
  const fetchChecklists = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      
      // Construir URL com todos os filtros
      let url = '/api/checklists?';
      const params = new URLSearchParams();
      
      if (selectedClientId) params.append('clientId', selectedClientId);
      if (selectedUserId) params.append('userId', selectedUserId); // Alterado para userId
      
      // Configurar filtro de data
      if (dateFilterMode === 'today') {
        params.append('startDate', startDate);
        params.append('endDate', startDate);
      } else {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      }
      
      url += params.toString();
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar checklists');
      }
      
      const data = await response.json();
      
      // Processar dados recebidos
      const processedData = Array.isArray(data) ? data.map(checklist => ({
        ...checklist,
        executed: checklist.status === 'completed',
        executedAt: checklist.completedAt || null,
        scheduledDate: checklist.scheduledDate || checklist.createdAt
      })) : [];
      
      setChecklists(processedData);
    } catch (error) {
      console.error('Erro fetchChecklists:', error);
      setError('Erro ao carregar checklists. Por favor, tente novamente.');
      setChecklists([]);
    } finally {
      setLoading(false);
    }
  };

  // Carregamento inicial (mantido igual)
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
        setError(`Falha ao carregar dados: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // Atualizar checklists quando os filtros mudarem (atualizado para selectedUserId)
  useEffect(() => {
    fetchChecklists();
  }, [dateFilterMode, startDate, endDate, selectedClientId, selectedUserId]);

  // Funções auxiliares (mantidas iguais)
  const getRowClassName = (checklist) => {
    if (checklist.executed) {
      return `${styles.tableRow} ${styles.executedRow}`;
    } else {
      return `${styles.tableRow} ${styles.pendingRow}`;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  if (loading) {
    return <div className={styles.container}><p>Carregando...</p></div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <a href='#' onClick={() => router.push('/admin')}>
            <img src='../grupotb_logo.png' alt="Logo Grupo TB" title="Voltar para a Home" />
          </a>
        </div>

        <h1>Checklists Executados</h1>
        <div className={styles.headerButtons}>
          <button onClick={() => router.push('/admin')} className={styles.backButton}>
            Voltar
          </button>
        </div>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      {/* Filtros */}
      <div className={styles.controls}>
        <div className={styles.filterGroup}>
          <label htmlFor="dateMode">Período:</label>
          <select
            id="dateMode"
            value={dateFilterMode}
            onChange={(e) => {
              setDateFilterMode(e.target.value);
              if (e.target.value === 'today') {
                const today = new Date().toISOString().split('T')[0];
                setStartDate(today);
                setEndDate(today);
              }
            }}
            className={styles.select}
          >
            <option value="today">Hoje</option>
            <option value="range">Intervalo Personalizado</option>
          </select>
        </div>

        {dateFilterMode === 'range' && (
          <>
            <div className={styles.filterGroup}>
              <label htmlFor="startDate">Data Inicial:</label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="endDate">Data Final:</label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className={styles.input}
              />
            </div>
          </>
        )}

        <div className={styles.filterGroup}>
          <label htmlFor="clientFilter">Cliente:</label>
          <select
            id="clientFilter"
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className={styles.select}
          >
            <option value="">Todos os Clientes</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="technicianFilter">Técnico:</label>
          <select
            id="technicianFilter"
            value={selectedUserId} // Alterado para selectedUserId
            onChange={(e) => setSelectedUserId(e.target.value)} // Alterado para setSelectedUserId
            className={styles.select}
          >
            <option value="">Todos os Técnicos</option>
            {users.map(user => (
              !user.isAdmin && (
                <option key={user.id} value={user.id}>{user.name}</option>
              ) 
            ))}
          </select>
            
        </div>
      </div>

      {/* Legenda de cores */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.legendColor} style={{backgroundColor: '#d4edda'}}></span>
          <span>Pendentes</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendColor} style={{backgroundColor: '#f8f9fa'}}></span>
          <span>Executados</span>
        </div>
      </div>

      {/* Tabela de checklists */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Status</th>
            <th>Título</th>
            <th>Cliente</th>
            <th>Local</th>
            <th>Tipo</th>
            <th>Técnico</th>
            <th>Data</th>
            <th>Horário</th>
            <th>Executado em</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {checklists.length === 0 ? (
            <tr>
              <td colSpan="10">Nenhum checklist encontrado para os filtros selecionados.</td>
            </tr>
          ) : (
            checklists.map(checklist => (
              <tr key={checklist.id} className={getRowClassName(checklist)}>
                <td>
                  <span className={checklist.executed ? styles.statusExecuted : styles.statusPending}>
                    {checklist.executed ? 'Executado' : 'Pendente'}
                  </span>
                </td>
                <td>{checklist.title}</td>
                <td>{clients.find(c => c.id === checklist.clientId)?.name || 'N/A'}</td>
                <td>{locations.find(l => l.id === checklist.locationId)?.name || 'N/A'}</td>
                <td>{checklistTypes.find(t => t.id === checklist.typeId)?.name || 'N/A'}</td>
                <td>{users.find(u => u.id === checklist.assignedTo)?.name || 'Não atribuído'}</td>
                <td>{formatDate(checklist.scheduledDate)}</td>
                <td>{formatTime(checklist.time)}</td>
                <td>{checklist.executedAt ? formatDate(checklist.executedAt) : '-'}</td>
                <td>
                  <button 
                    onClick={() => handlePrintQRCode(checklist)} 
                    className={styles.qrButton}
                    title="Imprimir QR Code"
                  >
                    QR Code
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}