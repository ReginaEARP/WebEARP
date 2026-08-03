import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Briefcase,
  Stethoscope, 
  Calendar, 
  Wallet, 
  FileSpreadsheet, 
  ShieldCheck, 
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface SidebarProps {
  userProfile?: {
    role?: string;
  };
}

export function Sidebar({ userProfile }: SidebarProps) {
  const [roleLocal, setRoleLocal] = useState<string | null>(userProfile?.role || null);
  
  // Hook do router para saber se a rota atual está dentro de processos e manter o menu aberto automaticamente
  const location = useLocation();
  const isProcessosRoute = location.pathname.startsWith('/processos');
  
  // Estado para controlar se o submenu de Processos está aberto ou fechado (já inicia aberto se o usuário estiver em uma rota de processos)
  const [isProcessosOpen, setIsProcessosOpen] = useState(isProcessosRoute);

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
          const roleMeta = user.user_metadata?.role;
          if (roleMeta) {
            setRoleLocal(roleMeta);
            return;
          }

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

  const roleFormatada = (roleLocal || userProfile?.role || '').toLowerCase();
  const podeAcessarUsuarios = 
    roleFormatada === 'admin' || 
    roleFormatada === 'master' || 
    roleFormatada === 'gerente';

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 min-h-screen flex flex-col p-4 select-none">
      <div className="px-3 py-2 mb-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-wide">
          Advocacia ERP
        </h2>
      </div>

      <nav className="space-y-1 flex-1">
        {/* Dashboard */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <LayoutDashboard size={20} className="shrink-0" />
          <span className="truncate">Dashboard</span>
        </NavLink>

        {/* Clientes */}
        <NavLink
          to="/clientes"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <Users size={20} className="shrink-0" />
          <span className="truncate">Clientes</span>
        </NavLink>

        {/* Parceiros & Médicos */}
        <NavLink
          to="/parceiros"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <UserCheck size={20} className="shrink-0" />
          <span className="truncate">Parceiros/Médicos</span>
        </NavLink>

        {/* Menu Expansível: Processos (Administrativo / Jurídico) */}
        <div>
          <button
            onClick={() => setIsProcessosOpen(!isProcessosOpen)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isProcessosRoute 
                ? 'text-blue-600 dark:text-blue-400 font-semibold' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Briefcase size={20} className="shrink-0" />
              <span className="truncate">Processos</span>
            </div>
            {isProcessosOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {/* Submenus */}
          {isProcessosOpen && (
            <div className="ml-4 pl-4 mt-1 border-l border-slate-200 dark:border-slate-800 space-y-1">
              <NavLink
                to="/processos/administrativo"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                Administrativo
              </NavLink>
        
              <NavLink
                to="/processos/juridico"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                Jurídico
              </NavLink>
            </div>
          )}
        </div>

        <NavLink
          to="/clinico"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <Stethoscope size={20} className="shrink-0" />
          <span className="truncate">Clínico</span>
        </NavLink>

        {/* Agenda & Prazos */}
        <NavLink
          to="/agenda"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <Calendar size={20} className="shrink-0" />
          <span className="truncate">Agenda/Prazos</span>
        </NavLink>

        {/* Financeiro */}
        <NavLink
          to="/financeiro"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <Wallet size={20} className="shrink-0" />
          <span className="truncate">Financeiro</span>
        </NavLink>

        {/* Relatórios */}
        <NavLink
          to="/relatorios"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <FileSpreadsheet size={20} className="shrink-0" />
          <span className="truncate">Relatórios</span>
        </NavLink>

        {/* Usuários (Condicional por Permissão) */}
        {podeAcessarUsuarios && (
          <NavLink
            to="/usuarios"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            <ShieldCheck size={20} className="shrink-0" />
            <span className="truncate">Usuários</span>
          </NavLink>
        )}

        {/* Configurações */}
        <NavLink
          to="/configuracoes"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <Settings size={20} className="shrink-0" />
          <span className="truncate">Configurações</span>
        </NavLink>
      </nav>
    </aside>
  );
}