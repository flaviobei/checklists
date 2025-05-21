// /pages/index.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirecionar para a página de login
    router.push('/login');
  }, []);
  
  return null;
}
