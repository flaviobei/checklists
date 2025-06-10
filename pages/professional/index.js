/* pages/professional/index.js 
  * Dashboard do Profissional
  * Permite que profissionais acessem seus checklists e escaneiem QR Codes.
  * 
  * Requisitos:
  * - Exibir progresso dos checklists atribuídos ao profissional.
  * - Permitir escaneamento de QR Codes para acessar checklists específicos.
  * - Exibir informações do usuário logado.
*/

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/Professional.module.css';
// Removendo importações de arquivos JSON estáticos
// import checklistsData from '../../data/checklists.json';
// import executionsData from '../../data/executions.json';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function ProfessionalDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [pendingChecklists, setPendingChecklists] = useState([]);
  // Mantendo estados para o progresso, mas eles serão atualizados pela API
  const [totalChecklists, setTotalChecklists] = useState(0);
  const [completedChecklists, setCompletedChecklists] = useState(0);
  const router = useRouter();

  const scannerRef = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      router.push('/login');
      return;
    }

    try {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      
      // Chamar a função para buscar checklists da API
      fetchChecklistsForProfessional(userData.id, token);
    } catch (error) {
      console.error('Erro ao processar dados do usuário:', error);
      router.push('/login');
    } finally {
      // O loading agora será controlado pela função fetchChecklistsForProfessional
    }
  }, [router]);

  // Função para buscar checklists para o profissional da API
  const fetchChecklistsForProfessional = async (userId, token) => {
    setLoading(true);
    try {
      // Buscar checklists atribuídos ao usuário ou avulsos usando a API
      // A API /api/checklists para usuários não-admin já retorna apenas os checklists devidos.
      const response = await fetch(`/api/checklists?userId=${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar checklists para o profissional');
      }

      const data = await response.json();
      setPendingChecklists(data);
      
      // Para a barra de progresso, a API /api/checklists para o profissional
      // precisa retornar o total de checklists atribuídos e o total de concluídos.
      // Como a API atual só retorna os PENDENTES, vamos ajustar o cálculo aqui.
      // Idealmente, o backend deveria fornecer esses totais.
      // Por enquanto, vamos considerar que o 'totalChecklists' é o número de checklists que o usuário deveria ter,
      // e 'completedChecklists' é o que já foi feito.
      // Para uma solução completa, a API /api/checklists precisaria ser aprimorada para retornar:
      // { pending: [...], totalAssigned: N, completedCount: M }
      
      // Por simplicidade e para manter a barra de progresso funcionando (mesmo que de forma limitada):
      // Vamos assumir que 'totalChecklists' é a soma dos pendentes e dos já concluídos (que não estão na lista).
      // Isso exigiria uma chamada adicional ou que a API retornasse mais dados.
      // Para evitar complexidade excessiva no frontend sem suporte do backend, 
      // vamos exibir a barra de progresso de forma mais simples ou indicar que não há dados.
      
      // Se a API retorna apenas os pendentes, não temos como calcular o total de atribuídos e concluídos diretamente.
      // Vamos ajustar a exibição da barra de progresso para refletir isso.
      setTotalChecklists(data.length); // Total de checklists que estão devidos agora
      setCompletedChecklists(0); // Não temos como saber os concluídos sem outra chamada ou dado da API

    } catch (error) {
      console.error('Erro ao buscar checklists para o profissional:', error);
      setPendingChecklists([]);
      setTotalChecklists(0);
      setCompletedChecklists(0);
    } finally {
      setLoading(false);
    }
  };

  // Efeito para inicializar e limpar o scanner (mantido)
  useEffect(() => {
    if (showScanner) {
      const config = {
        fps: 16,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        supportedScanTypes: [0]
      };

      const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        console.log(`QR Code lido: ${decodedText}`, decodedResult);
        const checklistId = decodedText;
        if (checklistId) {
          router.push(`/professional/${checklistId}`);
        } else {
          alert('Checklist não encontrado ou não acessível');
        }
        setShowScanner(false);
      };

      const qrCodeErrorCallback = (errorMessage) => {
        // console.warn(`Erro no scanner: ${errorMessage}`);
      };

      const html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader",
        config,
        false
      );
      html5QrcodeScanner.render(qrCodeSuccessCallback, qrCodeErrorCallback);
      scannerRef.current = html5QrcodeScanner;

      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(error => {
            console.error("Falha ao limpar o Html5QrcodeScanner.", error);
          });
          scannerRef.current = null;
        }
      };
    }
  }, [showScanner, router]);

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  // Calcular a porcentagem de progresso (ajustado para refletir apenas os pendentes)
  // Se totalChecklists representa apenas os pendentes, então completedChecklists é 0
  // e a porcentagem será sempre 0 se houver pendentes, ou 100% se não houver.
  // Para uma barra de progresso significativa, o backend precisa fornecer o total de atribuídos.
  const percentage = pendingChecklists.length === 0 
    ? 100 // Se não há pendentes, 100% concluído (dos que deveriam aparecer)
    : 0; // Se há pendentes, não podemos calcular a porcentagem real sem o total atribuído

  return (
    <div className={styles.container}>
      <header className={styles.header}>
      <div className={styles.logoContainer}>
          <img src='/grupotb_logo.png' alt='Logo GrupoTB'></img> {/* Caminho corrigido */}
      </div>
        <h1>Área do Profissional</h1>
        <div className={styles.userInfo}>
          <span>Olá, {user?.name}</span>
          <button
            className={styles.logoutButton}
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              router.push('/login');
            }}
          >
            Sair
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Seção do Scanner */}
        {showScanner && (
          <div className={styles.scannerContainer}>
            <h2>Escaneando QR Code...</h2>
            <div id="qr-reader" style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}></div>
            <button
              className={styles.closeScannerButton}
              onClick={() => {
                setShowScanner(false);
                if (scannerRef.current) {
                  scannerRef.current.clear().catch(error => {
                    console.error("Falha ao limpar o Html5QrcodeScanner.", error);
                  });
                  scannerRef.current = null;
                }
              }}
            >
              Fechar Scanner
            </button>
          </div>
        )}

        {/* Conteúdo principal, escondido se o scanner estiver ativo */}
        {!showScanner && (
          <>
            <div className={styles.scanSection}>
              <h2>Escanear QR Code</h2>
              <p>Escaneie o QR Code para acessar um checklist</p>
              <button
                className={styles.scanButton}
                onClick={() => setShowScanner(true)}
              >
                Escanear QR Code 📷
              </button>
            </div>

            <div className={styles.cardbarra}>
              <h2>Meus Checklists</h2>
              <div className={styles.progressContainer}>
                <h3>Progresso</h3>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${percentage}%`, backgroundColor: pendingChecklists.length === 0 ? '#4caf50' : 'gray' }}
                  >
                    {pendingChecklists.length === 0 ? "100% Concluído" : "Pendentes"}
                  </div>
                </div>
                {pendingChecklists.length === 0 ? (
                  <p>Todos os checklists devidos foram concluídos.</p>
                ) : (
                  <p>{pendingChecklists.length} checklists pendentes</p>
                )}
              </div>

              <h3>Checklists Pendentes</h3>
              {pendingChecklists.length === 0 ? (
                <div className={styles.noData}>
                  <p>Não há checklists pendentes no momento.</p>
                </div>
              ) : (
                <div className={styles.checklistGrid}>
                  {pendingChecklists.map((checklist) => (
                    <div key={checklist.id} className={styles.checklistCard}>
                      <h3>{checklist.title}</h3>
                      <p className={styles.checklistDescription}>
                        {checklist.description || "Sem descrição disponível."}
                      </p>
                      <div className={styles.checklistDetails}>
                        <p>Status: Pendente ⏳</p>
                        {checklist.validity && <p>Válido até: {new Date(checklist.validity).toLocaleDateString()}</p>}
                        {checklist.time && <p>Horário: {checklist.time}</p>}
                        <p>Itens no Checklist: {checklist.items ? checklist.items.length : 0}</p>
                        
                      </div>
                      <button
                        className={styles.startButton}
                        onClick={() =>
                          router.push(`/professional/${checklist.id}`)
                        }
                      >
                        Acessar Checklist
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.debug}>
              <h2>DEBUG</h2>
              <p>Checklists Pendentes (da API): {pendingChecklists.length}</p>
              <p>User ID: {user?.id}</p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}


