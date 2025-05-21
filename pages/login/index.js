// /pages/login/index.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/Login.module.css';
import Image from 'next/image';


export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();
  
  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Validação básica
    if (!username.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao fazer login');
      }
      
      // Armazenar token e dados do usuário
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        id: data.id,
        username: data.username,
        name: data.name,
        isAdmin: data.isAdmin
      }));
      
      // Redirecionar com base no tipo de usuário
      if (data.isAdmin) {
        router.push('/admin');
      } else {
        router.push('/professional');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h1 className={styles.title}>Sistema de Checklist</h1>
        <p className={styles.subtitle}>Manutenção Predial</p>
        
        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="username">Usuário</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          
          {error && <p className={styles.error}>{error}</p>}
          
          <button 
            type="submit" 
            className={styles.button}
            disabled={loading}
          >
            {loading ? 'Carregando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
