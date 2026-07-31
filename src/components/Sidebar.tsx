import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Briefcase, 
  Calendar, 
  Wallet, 
  FileSpreadsheet, 
  ShieldCheck, 
  Settings 
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface SidebarProps {
  userProfile?: {
    role?: string;
  };
}

export function Sidebar({ userProfile }: SidebarProps) {
  const [roleLocal, setRoleLocal] = useState<string | null>(userProfile?.role || null);

  // Mantém o estado sincronizado se a prop userProfile mudar
  useEffect(() => {
    if (userProfile?.role) {
      setRoleLocal(userProfile.role);
    }
  }, [userProfile?.role]);

  // Busca a role diretamente do Supabase caso o prop userProfile não venha preenchido
  useEffect(() => {
    async function carregarRole() {
      if (userProfile?.role) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;

        if (user) {
          // 1. Tenta pegar dos metadados da sessão primeiro
          const roleMeta = user.user_metadata?.role;
          if (roleMeta) {
            setRoleLocal(roleMeta);
            return;
          }

          // 2. Tenta pegar da tabela perfis
          const { data: perfil } = await supabase
            .from('perfis')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

          if (perfil?.role) {
            setRoleLocal(perfil.role);
          }
        }
      } catch (err) {
        console.warn("Não foi possível carregar a role do usuário na Sidebar:", err);
      }
    }

    carregarRole();
  }, [userProfile]);

  // Alinhado com a regra de acesso do AppRoutes (Admin, Master e Gerente)
  const roleFormatada = (roleLocal || userProfile?.role || '').toLowerCase();
  const podeAcessarUsuarios = 
    roleFormatada === 'admin' || 
    roleFormatada === 'master' || 
    roleFormatada === 'gerente';

  const menuItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Clientes', path: '/clientes', icon: Users },
    { label: 'Parceiros & Médicos', path: '/parceiros', icon: UserCheck },
    { label: 'Processos', path: '/processos', icon: Briefcase },
    { label: 'Agenda & Prazos', path: '/agenda', icon: Calendar },
    { label: 'Financeiro', path: '/financeiro', icon: Wallet },
    { label: 'Relatórios', path: '/relatorios', icon: FileSpreadsheet },
    ...(podeAcessarUsuarios ? [{ label: 'Usuários', path: '/usuarios', icon: ShieldCheck }] : []),
    { label: 'Configurações', path: '/configuracoes', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 min-h-screen flex flex-col p-4 select-none">
      <div className="px-3 py-2 mb-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-wide">
          Advocacia ERP
        </h2>
      </div>

      <nav className="space-y-1 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <Icon size={20} className="shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}