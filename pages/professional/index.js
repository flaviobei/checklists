/* pages/professional/index.js 
  * Dashboard do Profissional
  * Permite que profissionais acessem seus checklists e escaneiem QR Codes.
  * 
  * Requisitos:
  * - Exibir progresso dos checklists atribuídos ao profissional.
  * - Permitir escaneamento de QR Codes para acessar checklists específicos.
  * - Exibir informações do usuário logado.
*/

import { useEffect, useState, useRef } from 'react'; // Adicione useRef
import { useRouter } from 'next/router';
import styles from '../../styles/Professional.module.css';
import checklistsData from '../../data/checklists.json';
import executionsData from '../../data/executions.json'; // Importar execuções
import { Html5QrcodeScanner } from 'html5-qrcode'; // Importe a biblioteca

export default function ProfessionalDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false); // Estado para controlar a visibilidade do scanner
  const [pendingChecklists, setPendingChecklists] = useState([]); // Estado para checklists pendentes
  const [totalChecklists, setTotalChecklists] = useState(0); // Total de checklists atribuídos
  const [completedChecklists, setCompletedChecklists] = useState(0); // Checklists concluídos
  const router = useRouter();

  // Referência para o elemento do scanner (opcional, mas pode ser útil)
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
      
      // Filtrar checklists pendentes (não executados pelo usuário atual)
      filterPendingChecklists(userData.id);
    } catch (error) {
      console.error('Erro ao processar dados do usuário:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Função para filtrar checklists pendentes
  const filterPendingChecklists = (userId) => {
    // Obter todos os checklists atribuídos ao usuário ou avulsos
    const userChecklists = checklistsData.filter(
      (checklist) =>
      (checklist.assignedTo === userId || checklist.assignedTo === null) &&
      checklist.active === true
    );
    
    // Contar o total de checklists atribuídos ao usuário
    const totalAssigned = userChecklists.length;
    
    // Filtrar os que já foram executados pelo usuário
    const pending = userChecklists.filter(checklist => {
      // Verificar se este checklist já foi executado por este usuário
      const alreadyExecuted = executionsData.some(
        exec => exec.checklistId === checklist.id && exec.userId === userId
      );
      
      // Retornar apenas os não executados
      return !alreadyExecuted;
    });
    
    // Calcular quantos foram executados
    const executed = totalAssigned - pending.length;
    
    // Atualizar estados
    setPendingChecklists(pending);
    setCompletedChecklists(executed);
    setTotalChecklists(totalAssigned);
  };

  // Efeito para inicializar e limpar o scanner
  useEffect(() => {
    if (showScanner) {
      // Configurações do scanner
      const config = {
        fps: 16, // Frames por segundo para escanear
        qrbox: { width: 250, height: 250 }, // Tamanho da caixa de escaneamento (opcional)
        rememberLastUsedCamera: true, // Lembrar a última câmera usada
        supportedScanTypes: [0] // 0 para QR_CODE_SCAN_TYPE_CAMERA (Html5QrcodeScanType.SCAN_TYPE_CAMERA)
      };

      // Callback de sucesso
      const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        console.log(`QR Code lido: ${decodedText}`, decodedResult);

        const checklistId = decodedText;
        
        //const foundChecklist = checklistsData.find(cl => cl.id === checklistId && cl.active === true && (cl.assignedTo === user?.id || cl.assignedTo === null));

        if (checklistId) {
          router.push(`/professional/${checklistId}`);
          //alert(`Redirecionando para o checklist com ID: ${checklistId}`);
        } else {
          alert('Checklist não encontrado ou não acessível');
        }

        setShowScanner(false); // Esconde o scanner após a leitura
      };

      // Callback de erro (opcional)
      const qrCodeErrorCallback = (errorMessage) => {
        // console.warn(`Erro no scanner: ${errorMessage}`);
        // Não fazer nada em caso de erro comum (ex: QR Code não encontrado no frame)
      };

      const html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader", // ID do elemento div onde o scanner será renderizado
        config,
        false // verbose
      );
      html5QrcodeScanner.render(qrCodeSuccessCallback, qrCodeErrorCallback);

      // Guardar a instância para poder limpar depois
      scannerRef.current = html5QrcodeScanner;

      // Função de limpeza ao desmontar o componente ou esconder o scanner
      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(error => {
            console.error("Falha ao limpar o Html5QrcodeScanner.", error);
          });
          scannerRef.current = null;
        }
      };
    }
  }, [showScanner, router, user?.id]); // Adicionar user?.id às dependências

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  // Calcular a porcentagem de progresso
  const percentage = totalChecklists === 0 
    ? 0 
    : Math.round((completedChecklists / totalChecklists) * 100);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
       <div className={styles.logoContainer}>
          <img src='../grupotb_logo.png' alt='Logo GrupoTB'></img>
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
            {/* Elemento onde o scanner será renderizado */}
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
                onClick={() => setShowScanner(true)} // Mostra o scanner ao clicar
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
                    style={{ width: `${percentage}%`, backgroundColor: totalChecklists === 0 ? 'gray' : '#4caf50' }}
                  >
                    {totalChecklists === 0 ? "Nenhum checklist" : `${percentage}%`}
                  </div>
                </div>
                {totalChecklists === 0 ? (
                  <p>Sem checklists atribuídos no momento.</p>
                ) : (
                  <p>{completedChecklists} de {totalChecklists} concluídos</p>
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
                        <p>Itens no Checklist: {checklist.items ? checklist.items.length : 0}</p>
                        <p>Responsável: {checklist.assignedTo ? checklist.assignedTo : "Avulso"}</p>
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
              <p>Total de Checklists atribuídos: {totalChecklists}</p>
              <p>Total de Checklists concluídos: {completedChecklists}</p>
              <p>% Concluídos: {percentage}%</p>
              <p>User ID: {user?.id}</p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
