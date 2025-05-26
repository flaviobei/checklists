import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/Professional.module.css';

export default function ProfessionalChecklists() {
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  
  const router = useRouter();
  
  // Buscar dados do usuário e checklists ao carregar a página
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    
    if (!storedUser) {
      router.push('/login');
      return;
    }
    
    try {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      fetchChecklists(userData.id);
    } catch (error) {
      console.error('Erro ao processar dados do usuário:', error);
      router.push('/login');
    }
  }, []);
  
  // Função para buscar checklists
  const fetchChecklists = async (userId) => {
    try {
      setLoading(true);
      setError('');
      
      // Obter token do localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }
      
      const response = await fetch(`/api/checklists?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar checklists');
      }
      
      const data = await response.json();
      setChecklists(data);
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao carregar checklists. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para iniciar um checklist
  const handleStartChecklist = (id) => {
    router.push(`/professional/execute-checklist/${id}`);
  };
  
  // Função para obter o texto da periodicidade
  const getPeriodicityText = (periodicity) => {
    const periodicityMap = {
      'daily': 'Diária',
      'weekly': 'Semanal',
      'monthly': 'Mensal',
      'quarterly': 'Trimestral',
      'semiannual': 'Semestral',
      'annual': 'Anual',
      'custom': 'Personalizada'
    };
    
    return periodicityMap[periodicity] || periodicity;
  };
  
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Meus Checklists</h1>
        <div className={styles.headerButtons}>
          <button onClick={() => router.push('/professional')} className={styles.backButton}>
            Voltar
          </button>
        </div>
      </header>
      
      {error && <div className={styles.error}>{error}</div>}
      
      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading}>Carregando...</div>
        ) : (
          <>
            {checklists.length === 0 ? (
              <div className={styles.noData}>
                Nenhum checklist encontrado para você.
              </div>
            ) : (
              <div className={styles.checklistGrid}>
                {checklists.filter(checklist => checklist.active).map(checklist => (
                  <div key={checklist.id} className={styles.checklistCard}>
                    <h2>{checklist.title}</h2>
                    <p className={styles.checklistDescription}>
                      {checklist.description || 'Sem descrição'}
                    </p>
                    <div className={styles.checklistDetails}>
                      <p><strong>Periodicidade:</strong> {getPeriodicityText(checklist.periodicity)}</p>
                      <p><strong>Itens:</strong> {checklist.items.length}</p>
                      <p><strong>Fotos Obrigatórias:</strong> {checklist.requirePhotos ? 'Sim' : 'Não'}</p>
                    </div>
                    <button
                      onClick={() => handleStartChecklist(checklist.id)}
                      className={styles.startButton}
                    >
                      Iniciar Checklist
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
