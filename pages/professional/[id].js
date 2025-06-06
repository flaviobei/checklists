import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from '../../styles/Professional.module.css'; // Corrigido
import checklistsData from '../../data/checklists.json'; // Corrigido

export default function ChecklistPage() {
  const router = useRouter();
  const { id: checklistId } = router.query; // Renomear para clareza

  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); // Estado para mensagens de erro/acesso negado
  const [isAuthorized, setIsAuthorized] = useState(false); // Estado para controlar autorização
  const [user, setUser] = useState(null); // Estado para guardar dados do usuário

  // Estados para os itens 
  const [completedItems, setCompletedItems] = useState([]);
  const [photos, setPhotos] = useState({});

  useEffect(() => {
    // Não fazer nada até que o ID esteja disponível na URL
    if (!checklistId) {
      setLoading(false); // Parar o loading se não houver ID
      return;
    }

    setLoading(true);
    setError('');
    setIsAuthorized(false); // Resetar autorização

    // 1. Obter dados do usuário logado
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      setError('Usuário não encontrado. Faça login novamente.');
      setLoading(false);
      // Opcional: redirecionar para login após um tempo
      setTimeout(() => router.push('/login'), 2000);
      return;
    }

    let currentUser;
    try {
      currentUser = JSON.parse(storedUser);
      setUser(currentUser); // Guardar dados do usuário
      console.log('Usuário logado:', currentUser);
    } catch (e) {
      console.error("Erro ao parsear usuário do localStorage", e);
      setError('Erro ao carregar dados do usuário. Faça login novamente.');
      setLoading(false);
      setTimeout(() => router.push('/login'), 2000);
      return;
    }

    // 2. Encontrar o checklist nos dados importados
    console.log(`Procurando checklist com ID: ${checklistId}`);
    const foundChecklist = checklistsData.find(cl => cl.id === checklistId);
    console.log('Checklist encontrado:', foundChecklist);

    if (!foundChecklist) {
      setError('Checklist não encontrado!');
      setLoading(false);
      // Opcional: redirecionar
      setTimeout(() => router.push('/professional'), 2000);
    } else {
      // 3. Verificar Autorização
      const assignedTo = foundChecklist.assignedTo;
      const isAvulso = assignedTo === null || assignedTo === '' || !assignedTo;
      console.log(`Checklist atribuído a: ${assignedTo}, É avulso: ${isAvulso}, ID usuário atual: ${currentUser.id}`);

      if (assignedTo === currentUser.id || isAvulso) {
        console.log('Autorização concedida.');
        setChecklist(foundChecklist);
        // Inicializar estados dos itens 
        setCompletedItems(foundChecklist.items?.map(() => false) || []);
        setPhotos({});
        setIsAuthorized(true); // Marcar como autorizado
      } else {
        console.log('Autorização negada.');
        setError('Você não tem permissão para executar este checklist.');
        setIsAuthorized(false); // Marcar como não autorizado
        setChecklist(null); // Limpar checklist para não exibir dados
      }
      setLoading(false); // Finalizar carregamento
    }
  }, [checklistId, router]); // Depender apenas do checklistId e router

  // Funções handleToggleItem, handlePhotoChange, handleSubmit
  const handleToggleItem = (index) => {
    if (!isAuthorized) return; // Não permitir interação se não autorizado
    const updated = [...completedItems];
    updated[index] = !updated[index];
    setCompletedItems(updated);
  };

  const handlePhotoChange = (index, file) => {
    if (!isAuthorized) return;
    const updatedPhotos = { ...photos };
    if (file) {
      updatedPhotos[index] = URL.createObjectURL(file);
    } else {
      delete updatedPhotos[index];
    }
    setPhotos(updatedPhotos);
  };

  const handleSubmit = () => {
    if (!isAuthorized || !checklist) return;

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
    // a partir daqui será enviado pra API pra gravar a execução
    /* a ser executado */
  
    router.push('/professional/'); // Redirecionar para a lista após envio
  };

  // Renderização Condicional
  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  // Se houver erro (incluindo acesso negado)
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.aviso}>
          <div className={styles.logoContainer}>
          <img src='../aviso.png' alt='ERRO'></img>
          </div>
          <h2>{isAuthorized ? 'Erro' : 'Acesso Negado'}</h2>
          <p>Verifique se o checklist foi atribuído ao seu usuário</p>
          <p>Também é possível que esse checklist já tenha sido executado por outro usuário</p>
          <button onClick={() => router.push('/professional')} className={styles.backButton}>
            Voltar para Meus Checklists...
          </button>
        </div>
      </div>
    );
  }

  // Se não estiver autorizado ou checklist for nulo (caso extra de segurança)
  if (!isAuthorized || !checklist) {
     return (
        <div className={styles.container}>
          <div className={styles.aviso}>
            <h2>Acesso Negado</h2>
            <p>Você não tem permissão para acessar este checklist.</p>
            <button onClick={() => router.push('/professional')} className={styles.backButton}>
              Voltar para Meus Checklists
            </button>
          </div>
        </div>
      );
  }

  // Renderizar a interface de execução APENAS se autorizado
  return (
    <div className={styles.container}>
      <header className={styles.header}>
          <div className={styles.logoContainer}>
          <a href='#' onClick={() => router.push('/professional')}><img src='../grupotb_logo.png' alt='Logo GrupoTB' title="Voltar para meus Checklists"></img></a>
      </div>
        <h1>{checklist.title}</h1>
        <button
          className={styles.logoutButton} // Usando a classe existente para o botão voltar
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
                        {' '} 📷 ( Foto obrigatória )
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
                          <Image
                            src={photos[index]}
                            alt="Foto do item"
                            fill
                            style={{ objectFit: 'cover' }}
                            onLoadingComplete={() => URL.revokeObjectURL(photos[index])} // Limpar URL temporária
                            onError={() => console.error(`Erro ao carregar imagem ${index}`)}
                          />
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