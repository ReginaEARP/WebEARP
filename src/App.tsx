import React, { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { supabase } from './services/supabaseClient';
import { Layout } from './components/Layout';
import { Login } from './pages/login/index';
import { AppRoutes } from './Rotas';

interface UserProfile {
  id: string;
  role?: string;
  status?: string;
}

export function App() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Estado do Modo Escuro Global
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // Efeito do Modo Escuro
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Função auxiliar para validar se o perfil do usuário está ativo
  const validarSessaoEStatus = async (currentSession: any) => {
    if (!currentSession) {
      setSession(null);
      setUserProfile(null);
      setLoading(false);
      return;
    }

    try {
      // Busca 'role' e 'status' na tabela 'perfis'
      const { data: perfil, error } = await supabase
        .from('perfis')
        .select('id, role, status')
        .eq('id', currentSession.user.id)
        .maybeSingle();

      if (!error && perfil && perfil.status === 'ativo') {
        setSession(currentSession);
        setUserProfile(perfil);
      } else {
        // Se inativo, sem perfil ou com erro, encerra sessão
        await supabase.auth.signOut();
        setSession(null);
        setUserProfile(null);
      }
    } catch (err) {
      console.error('Erro ao checar status do usuário:', err);
      setSession(null);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // Gerenciamento da Sessão com trava de status
  useEffect(() => {
    // Busca sessão inicial
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      validarSessaoEStatus(currentSession);
    });

    // Escuta mudanças no estado de autenticação (Login / Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      validarSessaoEStatus(currentSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
        <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">
          Carregando ERP...
        </p>
      </div>
    );
  }

  // Se NÃO estiver autenticado ou estiver INATIVO, exibe apenas a página de Login
  if (!session) {
    return <Login />;
  }

  // Se estiver autenticado e ATIVO, exibe o Layout abraçando as Rotas
  return (
    <BrowserRouter>
      <Layout userProfile={userProfile}>
        <AppRoutes 
          darkMode={darkMode} 
          setDarkMode={setDarkMode} 
        />
      </Layout>
    </BrowserRouter>
  );
}