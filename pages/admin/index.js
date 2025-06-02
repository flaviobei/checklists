// /pages/admin/index.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/Admin.module.css';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Verificar se o usuário está autenticado e é admin
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      // Redirecionar para login se não estiver autenticado
      router.push('/login');
      return;
    }

    try {
      const userData = JSON.parse(storedUser);
      
      if (!userData.isAdmin) {
        // Redirecionar para área de profissional se não for admin
        router.push('/professional');
        return;
      }
      
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
      
      <div className={styles.logoContainer}>
          <img src='grupotb_logo.png' alt='Logo GrupoTB'></img>
      </div>

        <h1>Painel de Administração</h1>
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
        <div className={styles.grid}>
          <div className={styles.card}>
            <h2>Usuários</h2>
            <p>Gerenciar usuários do sistema</p>
            <button onClick={() => router.push('/admin/users')}>Acessar</button>
          </div>
          
          <div className={styles.card}>
            <h2>Categorias</h2>
            <p>Gerenciar categorias de profissionais</p>
            <button onClick={() => router.push('/admin/categories')}>Acessar</button>
          </div>
          
          <div className={styles.card}>
            <h2>Clientes</h2>
            <p>Gerenciar clientes</p>
            <button onClick={() => router.push('/admin/clients')}>Acessar</button>
          </div>
          
          <div className={styles.card}>
            <h2>Locais</h2>
            <p>Gerenciar locais</p>
            <button onClick={() => router.push('/admin/locations')}>Acessar</button>
          </div>
          
          <div className={styles.card}>
            <h2>Tipos de Checklist</h2>
            <p>Gerenciar tipos de checklist</p>
            <button onClick={() => router.push('/admin/checklisttypes')}>Acessar</button>
          </div>
          
          <div className={styles.card}>
            <h2>Checklists</h2>
            <p>Gerenciar checklists</p>
            <button onClick={() => router.push('/admin/checklists')}>Acessar</button>
          </div>
        </div>
      </main>
    </div>
  );
}
