import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Loader2, 
  UserCheck, 
  UserX, 
  Users,
  Cake,
  MessageCircle,
  AlertTriangle,
  X
} from 'lucide-react';
import { ModalCadastroEdicaoClientes } from './ModalCadastroEdicaoClientes';

interface Cliente {
  id: string;
  matricula: string;
  nome_completo: string;
  cpf_cnpj: string;
  contato_whatsapp: string;
  email?: string;
  senha_gov?: string;
  ativo: boolean;
  data_nascimento?: string;
}

export function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  
  // Controle de Permissão do Usuário Logado
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);

  // Controle do Modal Cadastro/Edicao
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);

  // Controle do Modal de Exclusão
  const [clienteParaExcluir, setClienteParaExcluir] = useState<Cliente | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Senha GOV
  const [showGovPasswords, setShowGovPasswords] = useState<Record<string, boolean>>({});

  // Busca perfil/role do usuário logado
  useEffect(() => {
    async function fetchUserRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('perfis')
            .select('role')
            .eq('id', user.id)
            .single();

          if (!error && data) {
            setUserRole(data.role);
          }
        }
      } catch (err: any) {
        console.error('Erro ao buscar perfil do usuário:', err.message);
      } finally {
        setLoadingRole(false);
      }
    }

    fetchUserRole();
  }, []);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('criado_em', { ascending: false });

      if (error) throw error;
      setClientes(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar clientes:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  // Define se o usuário tem permissão para excluir clientes
  const podeExcluir = userRole === 'admin' || userRole === 'gerente';

  // Identifica os aniversariantes do dia de hoje (sem bug de fuso horário)
  const hoje = new Date();
  const diaAtual = hoje.getDate();
  const mesAtual = hoje.getMonth() + 1;

  const aniversariantesHoje = clientes.filter(cliente => {
    if (!cliente.data_nascimento) return false;
    const partes = cliente.data_nascimento.split('T')[0].split('-');
    if (partes.length < 3) return false;

    const mesNasc = parseInt(partes[1], 10);
    const diaNasc = parseInt(partes[2], 10);

    return mesNasc === mesAtual && diaNasc === diaAtual;
  });

  const handleParabenizar = (cliente: Cliente) => {
    const telefoneLimpo = cliente.contato_whatsapp.replace(/\D/g, '');
    const primeiroNome = cliente.nome_completo.split(' ')[0];
    const mensagem = encodeURIComponent(
      `Olá, ${primeiroNome}! 🎉 Desejamos um feliz aniversário! Que seu dia seja abençoado e repleto de conquistas. Forte abraço de toda a nossa equipe!`
    );
    window.open(`https://wa.me/55${telefoneLimpo}?text=${mensagem}`, '_blank');
  };

  const toggleGovVisibility = (id: string) => {
    setShowGovPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenNew = () => {
    setSelectedClienteId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (id: string) => {
    setSelectedClienteId(id);
    setIsModalOpen(true);
  };

  // Solicita confirmação de exclusão
  const handleConfirmDelete = (cliente: Cliente) => {
    setClienteParaExcluir(cliente);
  };

  // Executa a exclusão após o clique no botão "Excluir" do modal customizado
  const handleExecuteDelete = async () => {
    if (!clienteParaExcluir) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', clienteParaExcluir.id);

      if (error) throw error;

      setClientes(prev => prev.filter(c => c.id !== clienteParaExcluir.id));
      setClienteParaExcluir(null);
    } catch (err: any) {
      alert('Erro ao excluir cliente: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const filteredClientes = clientes.filter(cliente => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (cliente.matricula && cliente.matricula.toLowerCase().includes(term)) ||
      (cliente.nome_completo && cliente.nome_completo.toLowerCase().includes(term)) ||
      (cliente.cpf_cnpj && cliente.cpf_cnpj.includes(term)) ||
      (cliente.contato_whatsapp && cliente.contato_whatsapp.includes(term));

    if (activeTab === 'ativos') return matchesSearch && (cliente.ativo ?? true);
    if (activeTab === 'inativos') return matchesSearch && !(cliente.ativo ?? true);
    return matchesSearch;
  });

  const countTodos = clientes.length;
  const countAtivos = clientes.filter(c => c.ativo ?? true).length;
  const countInativos = clientes.filter(c => !(c.ativo ?? true)).length;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      
      {/* BANNER DE ANIVERSARIANTES */}
      {aniversariantesHoje.length > 0 && (
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-4 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
              <Cake className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                Aniversariantes do Dia! 🎉
              </h3>
              <p className="text-xs text-purple-100">
                {aniversariantesHoje.map(c => `${c.nome_completo} (${c.matricula})`).join(', ')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {aniversariantesHoje.map(cliente => (
              <button
                key={cliente.id}
                onClick={() => handleParabenizar(cliente)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Parabenizar {cliente.nome_completo.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Topo: Campo de Pesquisa e Botão Novo */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por Matrícula (ex: J56), Nome, CPF ou Telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleOpenNew}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Abas de Filtro */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('todos')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'todos'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Todos</span>
          <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-xs font-semibold">
            {countTodos}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ativos')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'ativos'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <UserCheck className="w-4 h-4 text-emerald-500" />
          <span>Ativos</span>
          <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full text-xs font-semibold">
            {countAtivos}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('inativos')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'inativos'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <UserX className="w-4 h-4 text-rose-500" />
          <span>Inativos</span>
          <span className="bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 px-2 py-0.5 rounded-full text-xs font-semibold">
            {countInativos}
          </span>
        </button>
      </div>

      {/* Tabela de Clientes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : filteredClientes.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
            Nenhum cliente encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3 font-semibold">Matrícula</th>
                  <th className="px-6 py-3 font-semibold">Nome</th>
                  <th className="px-6 py-3 font-semibold">CPF / CNPJ</th>
                  <th className="px-6 py-3 font-semibold">Senha GOV</th>
                  <th className="px-6 py-3 font-semibold">Telefone / Whats</th>
                  <th className="px-6 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-800 dark:text-gray-200">
                {filteredClientes.map((cliente) => {
                  const ehAniversariante = aniversariantesHoje.some(a => a.id === cliente.id);

                  return (
                    <tr key={cliente.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {cliente.matricula || '-'}
                      </td>

                      <td className="px-6 py-4 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>{cliente.nome_completo}</span>
                          {ehAniversariante && (
                            <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                              <Cake className="w-3 h-3" /> Niver Hoje!
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                        {cliente.cpf_cnpj}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {cliente.senha_gov ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded text-xs">
                              {showGovPasswords[cliente.id] ? cliente.senha_gov : '••••••••'}
                            </span>
                            <button
                              onClick={() => toggleGovVisibility(cliente.id)}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                              title={showGovPasswords[cliente.id] ? "Ocultar Senha" : "Exibir Senha"}
                            >
                              {showGovPasswords[cliente.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Não informada</span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                        {cliente.contato_whatsapp}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {ehAniversariante && (
                            <button
                              onClick={() => handleParabenizar(cliente)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                              title="Enviar Parabéns no WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(cliente.id)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
                            title="Editar Cliente"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* BOTÃO DE EXCLUIR: Oculto para quem não é Admin ou Gerente */}
                          {!loadingRole && podeExcluir && (
                            <button
                              onClick={() => handleConfirmDelete(cliente)}
                              className="p-1.5 text-gray-500 hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-gray-700 transition-colors"
                              title="Excluir Cliente"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Cadastro / Edição */}
      <ModalCadastroEdicaoClientes
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        clienteId={selectedClienteId}
        onSuccess={fetchClientes}
      />

      {/* MODAL ESTILIZADO DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {clienteParaExcluir && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm p-6 border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/60 text-rose-600 rounded-full mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                Deseja realmente excluir o cliente {clienteParaExcluir.matricula}?
              </h3>

              <p className="text-xs text-rose-500 dark:text-rose-400 mt-2 font-medium">
                Esta ação não poderá ser desfeita.
              </p>
            </div>

            {/* Ações */}
            <div className="flex items-center justify-center gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 w-full">
              <button
                type="button"
                onClick={() => setClienteParaExcluir(null)}
                disabled={deleting}
                className="w-full py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Cancelar
              </button>
              
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={deleting}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{deleting ? 'Excluindo...' : 'Excluir'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}