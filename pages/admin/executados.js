/* pages/admin/executados.js
 * Listagem de Checklists Executados
 * Permite visualizar checklists do dia com status de execução
 * Inclui filtros por data, cliente e técnico
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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Data atual
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');

  const router = useRouter();

  // Função para imprimir QR Code (mantida)
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

  // Função para buscar todos os locais
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

  // Função para buscar usuários/técnicos
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

  // Função para buscar checklists com filtros
  const fetchChecklists = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      
      // Usar o endpoint existente, aplicando filtro de cliente se selecionado
      const url = selectedClientId ? `/api/checklists?clientId=${selectedClientId}` : '/api/checklists';
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar checklists');
      }
      const data = await response.json();
      
      // Aplicar filtros no frontend
      let filteredData = data;
      
      // Filtro por data (comparando com a data agendada ou data atual para checklists do dia)
      if (selectedDate) {
        const filterDate = new Date(selectedDate);
        filteredData = filteredData.filter(checklist => {
          // Se o checklist tem uma data específica, usar ela
          if (checklist.scheduledDate) {
            const checklistDate = new Date(checklist.scheduledDate);
            return checklistDate.toDateString() === filterDate.toDateString();
          }
          // Se não, verificar se é um checklist que deveria ser executado hoje baseado na periodicidade
          return shouldExecuteToday(checklist, filterDate);
        });
      }
      
      // Filtro por técnico
      if (selectedTechnicianId) {
        filteredData = filteredData.filter(checklist => 
          checklist.assignedTo === selectedTechnicianId
        );
      }
      
      // Adicionar status de execução simulado (você pode substituir por lógica real)
      filteredData = filteredData.map(checklist => ({
        ...checklist,
       executed: checklist.executed || false,
       executedAt: checklist.executedAt || null,
        scheduledDate: selectedDate || new Date().toISOString().split('T')[0]
      }));
      
      setChecklists(filteredData);
    } catch (error) {
      console.error('Erro fetchChecklists:', error);
      setError('Erro ao carregar checklists. Por favor, tente novamente.');
      setChecklists([]);
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para determinar se um checklist deveria ser executado em uma data específica
  const shouldExecuteToday = (checklist, targetDate) => {
    const today = new Date();
    const target = new Date(targetDate);
    
    switch (checklist.periodicity) {
      case 'daily':
        return true;
      case 'weekly':
        return target.getDay() === today.getDay();
      case 'monthly':
        return target.getDate() === today.getDate();
      case 'loose':
        return false; // Checklists avulsos não têm data específica
      default:
        return true;
    }
  };

  // Carregamento inicial
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
        await fetchExecutedChecklists();
      } catch (err) {
        console.error("Erro no carregamento de dados iniciais:", err);
        setError('Falha ao carregar todos os dados iniciais. Verifique o console para detalhes.');
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // Atualizar checklists quando os filtros mudarem
  useEffect(() => {
    if (!loading) {
      fetchExecutedChecklists();
    }
  }, [selectedDate, selectedClientId, selectedTechnicianId]);

  // Função para determinar a classe CSS baseada no status
  const getRowClassName = (checklist) => {
    if (checklist.executed) {
      return `${styles.tableRow} ${styles.executedRow}`; // Cinza para executados
    } else {
      return `${styles.tableRow} ${styles.pendingRow}`; // Verde para pendentes
    }
  };

  // Função para formatar data
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Função para formatar horário
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
          <label htmlFor="dateFilter">Data Inicial:</label>
          <input
            type="date"
            id="dateFilter"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className={styles.input}
          />

           <label htmlFor="dateFilterFinal">Data Final:</label>
          <input
            type="date"
            id="dateFilter"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className={styles.input}
          />
        </div>

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
            value={selectedTechnicianId}
            onChange={(e) => setSelectedTechnicianId(e.target.value)}
            className={styles.select}
          >
            <option value="">Todos os Técnicos</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.name}</option>
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