import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, LogOut, ChevronDown, Mail, KeyRound, X, Eye, EyeOff, CheckCircle2, AlertCircle, Bell } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface PerfilUsuario {
  id?: string;
  nome?: string;
  email?: string;
  role?: string;
  avatar_url?: string;
}

interface NavbarProps {
  onLogout?: () => void;
}

export function Navbar({ onLogout }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<PerfilUsuario | null>(null);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Estado para controlar a exibição do modal de senha
  const [isModalSenhaOpen, setIsModalSenhaOpen] = useState(false);

  // Mapeamento de títulos para o cabeçalho
  const titulos: Record<string, string> = {
    '/': 'Dashboard',
    '/clientes': 'Clientes',
    '/parceiros': 'Parceiros & Médicos',
    '/processos': 'Processos',
    '/agenda': 'Agenda & Prazos',
    '/financeiro': 'Financeiro',
    '/relatorios': 'Relatórios',
    '/usuarios': 'Gestão de Usuários',
    '/configuracoes': 'Configurações do Sistema',
    '/processos/central-custos': 'Gestão de Custos e Guias (GPS)',
  };

  const tituloAtual = titulos[location.pathname] || 'Sistema';

  // Busca o perfil autônomo do Supabase
    useEffect(() => {
      async function fetchPerfil() {
      // Função auxiliar para extrair apenas o 1º e 2º nome
      const pegarDoisPrimeirosNomes = (texto: string) => {
        if (!texto) return '';
        const partes = texto.trim().split(/\s+/); // Separa por qualquer quantidade de espaços
        return partes.slice(0, 2).join(' ');   // Pega os 2 primeiros e junta com espaço
      };

      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;

        if (!user) return;

        // Extrai os 2 primeiros nomes dos metadados ou do e-mail
        const nomeBrutoSessao = user.user_metadata?.nome || user.user_metadata?.full_name || user.email?.split('@')[0] || '';
        const doisNomesSessao = pegarDoisPrimeirosNomes(nomeBrutoSessao);

        // 1. DADOS DE FALLBACK IMEDIATOS
        const dadosSessao: PerfilUsuario = {
          id: user.id,
          nome: doisNomesSessao,
          email: user.email,
          role: user.user_metadata?.role || 'operador',
          avatar_url: user.user_metadata?.avatar_url
        };

        // Define os dados da sessão imediatamente
        setUserProfile(dadosSessao);

        // 2. Tenta buscar dados complementares na tabela 'perfis'
        const { data: perfil, error } = await supabase
          .from('perfis')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        // Se a busca no banco der certo e trouxer dados, atualiza extraindo os 2 primeiros nomes
        if (perfil && !error) {
          const nomeBrutoBanco = perfil.nome || perfil.nome_completo || '';
          const doisNomesBanco = nomeBrutoBanco ? pegarDoisPrimeirosNomes(nomeBrutoBanco) : dadosSessao.nome;

          setUserProfile({
            id: perfil.id || dadosSessao.id,
            nome: doisNomesBanco,
            email: perfil.email || dadosSessao.email,
            role: perfil.role || dadosSessao.role,
            avatar_url: perfil.avatar_url || dadosSessao.avatar_url,
          });
        }
      } catch (err) {
        console.warn('Aviso: Não foi possível ler a tabela perfis. Mantendo dados da sessão:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPerfil();
  }, []);

  // Event listener para fechar o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      setIsOpen(false);
      const emailSalvo = localStorage.getItem('earp_remembered_email');
      
      await supabase.auth.signOut();
      sessionStorage.clear();
      localStorage.clear();

      if (emailSalvo) {
        localStorage.setItem('earp_remembered_email', emailSalvo);
      }

      if (onLogout) {
        onLogout();
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      navigate('/login');
    }
  };

  const roleFormatada = (userProfile?.role || 'operador').toUpperCase();

  return (
    <>
      <header className="h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between px-6 relative z-40">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">
          {tituloAtual}
        </h1>

        <div className="flex items-center gap-4">
          {/* Sino de Notificação */}
          <button
            type="button"
            className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative focus:outline-none"
            aria-label="Notificações"
          >
            <Bell className="w-5 h-5" />
            {/* Indicador opcional de notificação ativa */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white dark:ring-gray-800" />
          </button>

          <div className="flex items-center gap-3 relative" ref={dropdownRef}>
            {loading ? (
              <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
            ) : (
              <>
                {/* Botão Clicável - Avatar + Ícone Chevron */}
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-gray-700 flex items-center justify-center text-blue-600 dark:text-blue-400 overflow-hidden border border-blue-200 dark:border-gray-600">
                    {userProfile?.avatar_url ? (
                      <img
                        src={userProfile.avatar_url}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>

                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown de Opções */}
                {isOpen && (
                  <div className="absolute right-0 top-12 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 transition-all z-50">
                    
                    {/* Bloco de Informações do Usuário */}
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                        Conectado como
                      </p>
                      
                      {/* Nome + Badge de Nível ao lado */}
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                          {userProfile?.nome || 'Usuário'}
                        </p>
                        <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50 shrink-0">
                          {roleFormatada}
                        </span>
                      </div>

                      {/* E-mail */}
                      <div className="flex items-center gap-1.5 mt-1">
                        <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
                          {userProfile?.email || 'usuario@sistema.com'}
                        </p>
                      </div>
                    </div>

                    {/* Ações abaixo do divisor */}
                    <div className="pt-1">
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          setIsModalSenhaOpen(true);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors font-medium"
                      >
                        <KeyRound className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span>Alterar Senha</span>
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sair</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Modal de Alterar Senha */}
      {isModalSenhaOpen && (
        <ModalAlterarSenha 
          onClose={() => setIsModalSenhaOpen(false)} 
          userEmail={userProfile?.email}
        />
      )}
    </>
  );
}

{/* Subcomponente Modal de Alterar Senha integrado ao Supabase */}
function ModalAlterarSenha({ onClose, userEmail }: { onClose: () => void; userEmail?: string }) {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem(null);

    if (novaSenha.length < 6) {
      setMensagem({ tipo: 'erro', texto: 'A nova senha deve ter no mínimo 6 caracteres.' });
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setMensagem({ tipo: 'erro', texto: 'As senhas não coincidem.' });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: novaSenha
      });

      if (error) throw error;

      setMensagem({ tipo: 'sucesso', texto: 'Senha alterada com sucesso!' });
      
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err: any) {
      setMensagem({
        tipo: 'erro',
        texto: err.message || 'Erro ao alterar a senha. Tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-blue-50 dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-xl">
            <KeyRound size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Alterar Senha</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {userEmail ? `Segurança para ${userEmail}` : 'Digite sua nova senha de acesso'}
            </p>
          </div>
        </div>

        {mensagem && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
            mensagem.tipo === 'sucesso' 
              ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400 border border-green-200 dark:border-green-800' 
              : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800'
          }`}>
            {mensagem.tipo === 'sucesso' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{mensagem.texto}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Nova Senha
            </label>
            <input
              type={mostrarSenha ? 'text' : 'password'}
              required
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="No mínimo 6 caracteres"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Confirmar Nova Senha
            </label>
            <input
              type={mostrarSenha ? 'text' : 'password'}
              required
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Digite a nova senha novamente"
            />
          </div>

          <button
            type="button"
            onClick={() => setMostrarSenha(!mostrarSenha)}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1.5 pt-1"
          >
            {mostrarSenha ? <EyeOff size={14} /> : <Eye size={14} />}
            {mostrarSenha ? 'Ocultar senhas' : 'Mostrar senhas'}
          </button>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}