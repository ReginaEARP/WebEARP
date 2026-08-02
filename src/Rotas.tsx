import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './services/supabaseClient';

// Importação das páginas prontas
import { Dashboard } from './pages/dashboard/Dashboard';
import { Clientes } from './pages/clientes/Clientes';
import { Parceiros } from './pages/parceiros/Parceiros'
import { Processos } from './pages/processos/Processos';
import { Relatorios } from './pages/relatorios/Relatorios';
import { CentralCustosGpsPage } from './pages/processos/PageGps';
import { Configuracoes } from './pages/configuracao/Configuracoes';
import { Usuarios } from './pages/usuarios/Usuarios';

interface AppRoutesProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

export function AppRoutes({ darkMode, setDarkMode }: AppRoutesProps) {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUserRoleAndStatus() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // 1. Buscamos 'role' E 'status' na tabela perfis
          const { data: perfil, error: perfilError } = await supabase
            .from('perfis')
            .select('role, status')
            .eq('id', user.id)
            .maybeSingle();

          // 2. Trava de segurança: Se for inativo ou der erro, encerra a sessão IMEDIATAMENTE
          if (perfilError || !perfil || perfil.status !== 'ativo') {
            await supabase.auth.signOut();
            setLoading(false);
            return;
          }

          if (perfil?.role) {
            setUserRole(perfil.role.toLowerCase());
          }
        }
      } catch (error) {
        console.error('Erro ao verificar permissões de acesso:', error);
      } finally {
        setLoading(false);
      }
    }

    checkUserRoleAndStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-6 text-slate-500 dark:text-slate-400">
        Carregando permissões...
      </div>
    );
  }

  // Libera a rota de gestão de usuários para Admin, Master e Gerente
  const podeGerenciarUsuarios = 
    userRole === 'admin' || 
    userRole === 'master' || 
    userRole === 'gerente';

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/clientes" element={<Clientes />} />
      <Route path="/parceiros" element={<Parceiros />} />
      <Route path="/processos" element={<Processos />} />
      <Route path="/agenda" element={<div className="p-6">Agenda & Prazos (Em breve)</div>} />
      <Route path="/financeiro" element={<div className="p-6">Módulo Financeiro (Em breve)</div>} />
      <Route path="/relatorios" element={<div className="p-6">Módulo Financeiro (Em breve)</div>} />
      <Route path="/processos/central-custos" element={<CentralCustosGpsPage />} />

      {/* Rota de Gestão de Usuários com proteção de acesso */}
      <Route 
        path="/usuarios" 
        element={
          podeGerenciarUsuarios ? (
            <Usuarios />
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />

      <Route 
        path="/configuracoes" 
        element={<Configuracoes darkMode={darkMode} setDarkMode={setDarkMode} />} 
      />

      {/* Redireciona rotas desconhecidas para a Dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}