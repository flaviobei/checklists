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
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function ProfessionalDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  
  // Estados para os dados da API
  const [dailyProgress, setDailyProgress] = useState({ 
    pendingChecklistsToday: [], 
    totalDailyChecklists: 0, 
    completedDailyChecklistsToday: 0 
  });
  const [overallStats, setOverallStats] = useState({ 
    totalCompletedOverall: 0, 
    totalScheduledOverall: 0 
  });
  const [allPendingChecklists, setAllPendingChecklists] = useState([]);

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
      fetchProfessionalData(userData.id, token);
    } catch (error) {
      console.error('Erro ao processar dados do usuário:', error);
      router.push('/login');
    }
  }, [router]);

  const fetchProfessionalData = async (userId, token) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/checklists?userId=${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar dados para o profissional');
      }

      const data = await response.json();
      setDailyProgress(data.dailyProgress);
      setOverallStats(data.overallStats);
      setAllPendingChecklists(data.allPendingChecklistsForDisplay);

    } catch (error) {
      console.error('Erro ao buscar dados para o profissional:', error);
      setDailyProgress({ pendingChecklistsToday: [], totalDailyChecklists: 0, completedDailyChecklistsToday: 0 });
      setOverallStats({ totalCompletedOverall: 0, totalScheduledOverall: 0 });
      setAllPendingChecklists([]);
    } finally {
      setLoading(false);
    }
  };

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

  // Calcular a porcentagem de progresso do dia
  const dailyPercentage = dailyProgress.totalDailyChecklists === 0 
    ? 100 // Se não há checklists diários, 100% concluído
    : Math.round((dailyProgress.completedDailyChecklistsToday / dailyProgress.totalDailyChecklists) * 100);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <img src='/grupotb_logo.png' alt='Logo GrupoTB'></img>
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
              <h2>Meu Desempenho</h2>
              
              {/* Barra de Progresso do Dia */}
              <div className={styles.progressContainer}>
                <h3>Progresso do Dia</h3>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${dailyPercentage}%`, backgroundColor: dailyPercentage === 100 ? '#4caf50' : '#2196f3' }}
                  >
                    {dailyPercentage}%
                  </div>
                </div>
                <p>{dailyProgress.completedDailyChecklistsToday} de {dailyProgress.totalDailyChecklists} checklists diários concluídos hoje</p>
              </div>

              {/* Estatísticas Gerais */}
              <div className={styles.overallStatsContainer}>
                <div className={styles.statBox}>
                  <h4>Total Executado</h4>
                  <p>{overallStats.totalCompletedOverall}</p>
                </div>
                <div className={styles.statBox}>
                  <h4>Total Agendado</h4>
                  <p>{overallStats.totalScheduledOverall}</p>
                </div>
              </div>

              <h3>Checklists Pendentes ({allPendingChecklists.length})</h3>
              {allPendingChecklists.length === 0 ? (
                <div className={styles.noData}>
                  <p>Não há checklists pendentes no momento.</p>
                </div>
              ) : (
                <div className={styles.checklistGrid}>
                  {allPendingChecklists.map((checklist) => (
                    <div key={checklist.id} className={styles.checklistCard}>
                      <h3>{checklist.title}</h3>
                      <p className={styles.checklistDescription}>
                        {checklist.description || "Sem descrição disponível."}
                      </p>
                      <div className={styles.checklistDetails}>
                        <p>Status: Pendente ⏳</p>
                        {checklist.time && <p>Horário: {checklist.time}</p>}
                      </div>
                      <button
                        className={styles.startButton}
                        onClick={() => router.push(`/professional/${checklist.id}`)}
                      >
                        Acessar Checklist
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

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
      </main>
    </div>
  );
}