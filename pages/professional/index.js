import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/Professional.module.css';
import checklistsData from '../../data/checklists.json';
import executionsData from '../../data/executions.json';

export default function ProfessionalDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [totalChecklists, setTotalChecklists] = useState(0);
  const [realizados, setRealizados] = useState(0);
  const [pendentes, setPendentes] = useState(0);

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

      const atribuídos = checklistsData.filter(
        (item) => item.assignedTo === userData.id
      );

      const total = atribuídos.length;

      const feitos = executionsData.filter(
        (exec) => exec.userId === userData.id
      ).length;

      const pend = total - feitos;

      setTotalChecklists(total);
      setRealizados(feitos);
      setPendentes(pend >= 0 ? pend : 0);
    } catch (error) {
      console.error('Erro ao processar dados do usuário:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, []);

  const porcentagem =
    totalChecklists > 0 ? Math.min((realizados / totalChecklists) * 100, 100) : 0;

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
          <button className={styles.scanButton}>Escanear QR Code</button>
        </div>

        <div className={styles.card}>
          <h2>Meus Checklists</h2>

          {/* 🔥 Barra de Progresso */}
          <div className={styles.progressBarContainer}>
            <div
              className={styles.progressBar}
              style={{ width: `${porcentagem}%` }}
            ></div>
          </div>
          <p>
            Programados: {totalChecklists} | Realizados: {realizados} | Pendentes: {pendentes}
          </p>

          <button onClick={() => router.push('/professional/checklists')}>
            Acessar
          </button>
        </div>

        <div className={styles.checklistsSection}>
          <h2>Meus Checklists</h2>
          {totalChecklists === 0 ? (
            <p>Você não possui checklists atribuídos no momento.</p>
          ) : (
            <p>Consulte seus checklists no botão acima.</p>
          )}
        </div>
      </main>
    </div>
  );
}
