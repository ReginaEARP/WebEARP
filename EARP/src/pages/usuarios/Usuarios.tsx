import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Edit2, Shield, Phone, Mail, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { ModalUsuarios } from '../usuarios/ModalUsuarios';

export interface UsuarioData {
  id?: string;
  nome: string;
  email: string;
  cpf?: string;
  telefone?: string;
  status?: string;
  role: 'admin' | 'gerente' | 'operador' | 'estagiario';
  created_at?: string;
}

export function Usuarios() {
  const [usuarios, setUsuarios] = useState<UsuarioData[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [usuarioLogadoRole, setUsuarioLogadoRole] = useState<string>('operador');
  const [usuarioLogadoId, setUsuarioLogadoId] = useState<string>('');

  // Estados dos Modais e Notificações Personalizadas
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usuarioEdicao, setUsuarioEdicao] = useState<UsuarioData | null>(null);
  const [notificacao, setNotificacao] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const exibirNotificacao = (tipo: 'sucesso' | 'erro', mensagem: string) => {
    setNotificacao({ tipo, mensagem });
    setTimeout(() => setNotificacao(null), 4000); // Exclui o aviso após 4s
  };

  const carregarDados = async () => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUsuarioLogadoId(session.user.id);

        const { data: perfilLogado } = await supabase
          .from('perfis')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        if (perfilLogado) {
          setUsuarioLogadoRole(perfilLogado.role);
        }
      }

      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      if (data) setUsuarios(data);

    } catch (err: any) {
      exibirNotificacao('erro', 'Erro ao carregar usuários: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirModalNovo = () => {
    setUsuarioEdicao(null);
    setIsModalOpen(true);
  };

  const handleAbrirModalEditar = (usuario: UsuarioData) => {
    setUsuarioEdicao(usuario);
    setIsModalOpen(true);
  };

  const usuariosFiltrados = usuarios.filter(u => 
    (u.nome?.toLowerCase() || '').includes(busca.toLowerCase()) ||
    (u.cpf?.toLowerCase() || '').includes(busca.toLowerCase()) ||
    (u.email?.toLowerCase() || '').includes(busca.toLowerCase()) ||
    (u.telefone?.toLowerCase() || '').includes(busca.toLowerCase()) ||
    (u.role?.toLowerCase() || '').includes(busca.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 relative">
      {/* Toast / Banner de Notificação Personalizada */}
      {notificacao && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all animate-bounce ${
          notificacao.tipo === 'sucesso' 
            ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200'
            : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200'
        }`}>
          {notificacao.tipo === 'sucesso' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{notificacao.mensagem}</span>
          <button onClick={() => setNotificacao(null)} className="ml-2 text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Topo com Barra de Pesquisa Automática e Botão Novo Usuário */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 size-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF, e-mail, telefone..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleAbrirModalNovo}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm shrink-0"
        >
          <UserPlus size={18} />
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 animate-pulse">Carregando lista de usuários...</div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nenhum usuário encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3.5">Nome</th>
                  <th className="px-6 py-3.5">CPF</th>
                  <th className="px-6 py-3.5">Contato</th>
                  <th className="px-6 py-3.5">Perfil</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {usuariosFiltrados.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {usuario.nome || 'Sem Nome'}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {usuario.cpf || '---'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                          <Mail size={13} className="text-gray-400 shrink-0" />
                          <span>{usuario.email}</span>
                        </div>
                        {usuario.telefone && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                            <Phone size={12} className="text-gray-400 shrink-0" />
                            <span>{usuario.telefone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        usuario.role === 'admin' 
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400'
                          : usuario.role === 'gerente'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                          : usuario.role === 'estagiario'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        <Shield size={10} />
                        {usuario.role || 'operador'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        usuario.status === 'inativo'
                          ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400'
                          : 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400'
                      }`}>
                        {usuario.status || 'ativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleAbrirModalEditar(usuario)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors"
                          title="Editar Usuário"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Componente Modal de Criação / Edição */}
      <ModalUsuarios
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={carregarDados}
        usuarioEdicao={usuarioEdicao}
      />
    </div>
  );
}