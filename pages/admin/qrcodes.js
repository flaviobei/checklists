import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/Admin.module.css';

export default function ActiveChecklistQRCodes() {
  const [checklists, setChecklists] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  
  const router = useRouter();
  
  // Buscar dados ao carregar ou quando o filtro mudar
  useEffect(() => {
    fetchChecklistsAndClients();
  }, [selectedClientId]);
  
  // Função para buscar checklists e clientes da API
  const fetchChecklistsAndClients = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      
      // Construir URL da API com filtro opcional
      const apiUrl = selectedClientId
        ? `/api/checklists/activeqrcodes?clientId=${selectedClientId}`
        : '/api/checklists/activeqrcodes';
        
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Acesso negado. Apenas administradores podem ver esta página.');
        }
        throw new Error(`Erro ao buscar QR Codes: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Dados recebidos da API:', data); // Log para depuração
      setChecklists(data.checklists || []);
      setClients(data.clients || []); // Usar clientes retornados pela API
      
    } catch (error) {
      console.error('Erro detalhado ao buscar dados:', error);
      setError(error.message || 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  // Função para imprimir a página
  const handlePrint = () => {
    window.print();
  };
  
  return (
    <div className={styles.container}>
      <header className={`${styles.header} no-print`}> {/* Adicionar no-print ao header */}
        <div className={styles.logoContainer}>
          <a href='#' onClick={() => router.push('/admin')}><img src='../grupotb_logo.png' alt='Logo GrupoTB'></img></a>
      </div>
        <h1>QR Codes de Checklists Ativos</h1>
        <div className={styles.headerButtons}>
          <button onClick={handlePrint} className={`${styles.actionButton} ${styles.printButton} no-print`}>
            Imprimir QR Codes
          </button>
          <button onClick={() => router.push('/admin')} className={`${styles.backButton} no-print`}>
            Voltar
          </button>
        </div>
      </header>
      
      {error && <div className={`${styles.error} no-print`}>{error}</div>}
      
      <div className={`${styles.controls} no-print`}> {/* Adicionar no-print aos controles */}
        <label htmlFor="clientFilter">Filtrar por Cliente:</label>
        <select 
          id="clientFilter" 
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">Todos os Clientes</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </select>
      </div>
      
      {/* Área de conteúdo principal */}
      <div className={styles.content}>
        {loading ? (
          <div className={`${styles.loading} no-print`}>Carregando...</div>
        ) : (
          <>
            {checklists.length === 0 ? (
              <div className={`${styles.noData} no-print`}>
                Nenhum checklist ativo encontrado {selectedClientId ? 'para este cliente' : ''}.
              </div>
            ) : (
              /* Envolver a grade na div .printableArea */
              <div className="printableArea">
                <div className={styles.qrCodeGrid}>
                  {checklists.map(checklist => (
                    <div key={checklist.id} className={styles.qrCodeCard}>
                      <h3>{checklist.title}</h3>
                      <p><strong>Cliente:</strong> {checklist.clientName}</p>
                      <p><strong>Local:</strong> {checklist.locationName}</p>
                      {checklist.qrCodeSvg ? (
                        <div 
                          className={styles.qrCodeImage}
                          dangerouslySetInnerHTML={{ __html: checklist.qrCodeSvg }}
                        />
                      ) : (
                        <p className={styles.noQrCode}>QR Code não disponível</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Estilos específicos para impressão (Revisados) */}
      <style jsx global>{`
        @media print {
          /* Esconder tudo por padrão */
          body * {
            visibility: hidden;
          }
          /* Tornar a área de impressão e seu conteúdo visíveis */
          .printableArea, .printableArea * {
            visibility: visible;
          }
          /* Posicionar a área de impressão para ocupar a página */
          .printableArea {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 1cm; /* Adicionar margem para impressão */
            box-sizing: border-box;
          }
          /* Garantir que a grade e os cards sejam visíveis */
          .qrCodeGrid {
            visibility: visible !important; /* Forçar visibilidade */
            display: grid;
            /* Ajustar colunas para caber melhor no papel (ex: 3 colunas em A4 retrato) */
            grid-template-columns: repeat(3, 1fr);
            gap: 1cm; /* Espaçamento entre os cards */
            page-break-inside: avoid; /* Tentar evitar quebrar a grade entre páginas */
          }
          .qrCodeCard {
             visibility: visible !important; /* Forçar visibilidade */
             border: 1px solid #000; /* Borda preta simples para impressão */
             padding: 0.5cm;
             text-align: center;
             page-break-inside: avoid; /* Tentar evitar quebrar card entre páginas */
             background-color: white !important; /* Fundo branco */
             color: black !important; /* Texto preto */
             box-shadow: none; /* Remover sombra */
             border-radius: 0; /* Remover bordas arredondadas */
          }
          .qrCodeCard h3 {
             font-size: 10pt;
             margin-bottom: 0.5rem;
             color: black !important;
          }
           .qrCodeCard p {
             font-size: 8pt;
             margin: 0.2rem 0;
             color: black !important;
          }
          .qrCodeImage svg {
            width: 4cm !important; /* Tamanho fixo em cm para impressão */
            height: 4cm !important;
            margin: 0.5rem auto;
            display: block;
          }
          .noQrCode {
             color: #555 !important; /* Cinza escuro para 'não disponível' */
             font-size: 8pt;
          }
          /* Esconder elementos que não devem ser impressos */
          .no-print, .no-print * {
            display: none !important;
            visibility: hidden !important;
            height: 0;
            width: 0;
            overflow: hidden;
          }
        }
      `}</style>
      
    </div>
  );
}

