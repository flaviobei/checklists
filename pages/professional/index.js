import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import styles from '../../styles/Professional.module.css';
import checklistsData from '../../data/checklists.json';

export default function ChecklistPage() {
  const router = useRouter();
  const { id } = router.query;

  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedItems, setCompletedItems] = useState([]);

  useEffect(() => {
    if (!id) return; // Espera o id carregar da URL

    const foundChecklist = checklistsData.find(cl => cl.id === id);

    if (!foundChecklist) {
      alert('Checklist não encontrado!');
      router.push('/professional');
    } else {
      setChecklist(foundChecklist);
      setCompletedItems(foundChecklist.items?.map(() => false) || []);
      setLoading(false);
    }
  }, [id, router]);

  const handleToggleItem = (index) => {
    const updated = [...completedItems];
    updated[index] = !updated[index];
    setCompletedItems(updated);
  };

  const handleSubmit = () => {
    const total = checklist.items.length;
    const done = completedItems.filter(item => item).length;

    alert(`✅ Checklist enviado! Você concluiu ${done} de ${total} itens.`);

    // 🔥 Aqui você pode adicionar lógica para salvar os dados, enviar para API ou backend futuramente

    router.push('/professional');
  };

  if (loading) return <div className={styles.loading}>Carregando...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>{checklist.title}</h1>
        <button
          className={styles.logoutButton}
          onClick={() => router.push('/professional')}
        >
          Voltar
        </button>
      </header>

      <main className={styles.main}>
        <p className={styles.checklistDescription}>{checklist.description}</p>

        {checklist.items?.length > 0 ? (
          <div className={styles.checklistForm}>
            <h2>Itens do Checklist</h2>
            <ul className={styles.itemList}>
              {checklist.items.map((item, index) => (
                <li key={item.id || index} className={styles.item}>
                  <label>
                    <input
                      type="checkbox"
                      checked={completedItems[index]}
                      onChange={() => handleToggleItem(index)}
                    />
                    {item.description}
                    {item.requirePhoto && (
                      <span className={styles.photoRequired}>
                        {' '}📷 (Foto obrigatória)
                      </span>
                    )}
                  </label>
                </li>
              ))}
            </ul>

            <button
              className={styles.submitButton}
              onClick={handleSubmit}
            >
              Enviar Checklist
            </button>
          </div>
        ) : (
          <p>Esse checklist não possui itens cadastrados.</p>
        )}
      </main>
    </div>
  );
}
