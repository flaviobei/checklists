import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Image from 'next/image';  // <-- Import necessário para usar <Image />
import styles from '../../styles/Professional.module.css';
import checklistsData from '../../data/checklists.json';


export default function ChecklistPage() {
  const router = useRouter();
  const { id } = router.query;

  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedItems, setCompletedItems] = useState([]);
  const [photos, setPhotos] = useState({}); // Estado para armazenar fotos

  useEffect(() => {
    if (!id) return;

    const foundChecklist = checklistsData.find(cl => cl.id === id);

    if (!foundChecklist) {
      alert('Checklist não encontrado!');
      router.push('/professional');
    } else {
      setChecklist(foundChecklist);
      setCompletedItems(foundChecklist.items?.map(() => false) || []);
      setPhotos({});
      setLoading(false);
    }
  }, [id, router]);

  const handleToggleItem = (index) => {
    const updated = [...completedItems];
    updated[index] = !updated[index];
    setCompletedItems(updated);
  };

  const handlePhotoChange = (index, file) => {
    const updatedPhotos = { ...photos };
    if (file) {
      updatedPhotos[index] = URL.createObjectURL(file); // Cria URL temporária da imagem
    } else {
      delete updatedPhotos[index];
    }
    setPhotos(updatedPhotos);
  };

  const handleSubmit = () => {
    const total = checklist.items.length;
    const done = completedItems.filter(item => item).length;

    const missingPhotos = checklist.items.some((item, index) =>
      item.requirePhoto && !photos[index]
    );

    if (missingPhotos) {
      alert('⚠️ Você precisa adicionar todas as fotos obrigatórias antes de enviar!');
      return;
    }

    alert(`✅ Checklist enviado! Você concluiu ${done} de ${total} itens.`);

    // Aqui você pode futuramente enviar os dados para um backend ou API

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

                  {item.requirePhoto && (
                    <div className={styles.photoUpload}>
                      <button
                        type="button"
                        onClick={() => document.getElementById(`photo-input-${index}`).click()}
                        className={styles.photoButton}
                      >
                        {photos[index] ? 'Trocar Foto' : 'Tirar/Escolher Foto'}
                      </button>
                      <input
                        id={`photo-input-${index}`}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        style={{ display: 'none' }}
                        onChange={(e) =>
                          handlePhotoChange(index, e.target.files[0])
                        }
                      />
                      {photos[index] && (
                        <div className={styles.photoPreview}>
                          <Image src={photos[index]} alt="Foto do item" />
                        </div>
                      )}
                    </div>
                  )}
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
