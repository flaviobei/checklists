// /pages/professional/index.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/Professional.module.css';
import checklistsData from '../../data/checklists.json';

export default function ProfessionalDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const totalChecklists = checklistsData.length;
  const completedChecklists = checklistsData.filter(cl => cl.completed).length;
  const percentage = totalChecklists === 0 ? 0 : Math.round((completedChecklists / totalChecklists) * 100);

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
    } catch (error) {
      console.error('Erro ao processar dados do usuário:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
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
        <div className={styles.scanSection}>
          <h2>Escanear QR Code</h2>
          <p>Escaneie o QR Code para acessar um checklist</p>
          <button className={styles.scanButton}>
            Escanear QR Code
          </button>
        </div>

        {/* 🔥 Card Meus Checklists com Progresso */}
        <div className={styles.cardbarra}>
          <h2>Meus Checklists</h2>
          
          {/* Barra de progresso dentro do card */}
          <div className={styles.progressContainer}>
            <h3>Progresso</h3>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${percentage}%` }}
              >
                {percentage}%
              </div>
            </div>
            <p>{completedChecklists} de {totalChecklists} concluídos</p>
          </div>

  {checklistsData.length === 0 ? (
    <div className={styles.noData}>
      <p>Você não possui checklists atribuídos no momento.</p>
    </div>
  ) : (
    <div className={styles.checklistGrid}>
      {checklistsData.map((checklist) => (
        <div key={checklist.id} className={styles.checklistCard}>
          <h3>{checklist.title}</h3>
          <p className={styles.checklistDescription}>
            {checklist.description || "Sem descrição disponível."}
          </p>

          <div className={styles.checklistDetails}>
            <p>Status: {checklist.completed ? "Concluído: ✅" : "Pendente: ⏳"}</p>
            <p>Itens no Checklist: {checklist.items ? checklist.items.length : 0}</p>
            <p>{checklist.completed} </p> 
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

      </main>
    </div>
  );
}