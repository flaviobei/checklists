// /pages/professional/index.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/Professional.module.css';

export default function ProfessionalDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Verificar se o usuário está autenticado
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      // Redirecionar para login se não estiver autenticado
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

        <div className={styles.card}>
  <h2>Meus Checklists</h2>
  <p>Visualizar e executar checklists</p>
  <button onClick={() => router.push('/professional/checklists')}>Acessar</button>
</div>

        <div className={styles.checklistsSection}>
          <h2>Meus Checklists</h2>
          <p>Você não possui checklists atribuídos no momento.</p>
        </div>
      </main>
    </div>
  );
}
