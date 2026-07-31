import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2, 
  UserCheck, 
  UserX, 
  AlertTriangle,
  Handshake
} from 'lucide-react';

// Importação atualizada com o nome correto do componente:
import { ModalCadastroParceiro } from './ModalCadastroParceiro';

interface Parceiro {
  id: string;
  nome: string;
  cpf_cnpj: string;
  contato_whatsapp: string;
  email?: string;
  comissao_porcentagem?: number;
  ativo: boolean;
}

export function Parceiros() {
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  
  // Controle de Permissão
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);

  // Controle do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedParceiroId, setSelectedParceiroId] = useState<string | null>(null);

  // Modal Exclusão
  const [parceiroParaExcluir, setParceiroParaExcluir] = useState<Parceiro | null>(null);
  const [deleting, setDeleting] = useState(false);

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

          if (!error && data?.role) {
            setUserRole(data.role.toLowerCase());
          }
        }
      } catch (err: any) {
        console.error('Erro ao buscar perfil:', err.message);
      } finally {
        setLoadingRole(false);
      }
    }

    fetchUserRole();
  }, []);

  const fetchParceiros = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('parceiros')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      setParceiros(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar parceiros:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParceiros();
  }, []);

  const podeExcluir = userRole === 'admin' || userRole === 'master' || userRole === 'gerente';

  const handleOpenNew = () => {
    setSelectedParceiroId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (id: string) => {
    setSelectedParceiroId(id);
    setIsModalOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!parceiroParaExcluir) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('parceiros')
        .delete()
        .eq('id', parceiroParaExcluir.id);

      if (error) throw error;

      setParceiros(prev => prev.filter(p => p.id !== parceiroParaExcluir.id));
      setParceiroParaExcluir(null);
    } catch (err: any) {
      alert('Erro ao excluir parceiro: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const filteredParceiros = parceiros.filter(parceiro => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (parceiro.nome && parceiro.nome.toLowerCase().includes(term)) ||
      (parceiro.cpf_cnpj && parceiro.cpf_cnpj.includes(term)) ||
      (parceiro.contato_whatsapp && parceiro.contato_whatsapp.includes(term));

    if (activeTab === 'ativos') return matchesSearch && (parceiro.ativo ?? true);
    if (activeTab === 'inativos') return matchesSearch && !(parceiro.ativo ?? true);
    return matchesSearch;
  });

  const countTodos = parceiros.length;
  const countAtivos = parceiros.filter(p => p.ativo ?? true).length;
  const countInativos = parceiros.filter(p => !(p.ativo ?? true)).length;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por Nome, CPF/CNPJ ou Telefone..."
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
          <span>Novo Parceiro</span>
        </button>
      </div>

      {/* Abas */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('todos')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'todos'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Handshake className="w-4 h-4" />
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
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
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
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <UserX className="w-4 h-4 text-rose-500" />
          <span>Inativos</span>
          <span className="bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 px-2 py-0.5 rounded-full text-xs font-semibold">
            {countInativos}
          </span>
        </button>
      </div>

      {/* Tabela de Parceiros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : filteredParceiros.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
            Nenhum parceiro encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3 font-semibold">Nome</th>
                  <th className="px-6 py-3 font-semibold">CPF / CNPJ</th>
                  <th className="px-6 py-3 font-semibold">Contato</th>
                  <th className="px-6 py-3 font-semibold">Comissão (%)</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-800 dark:text-gray-200">
                {filteredParceiros.map((parceiro) => (
                  <tr key={parceiro.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 font-medium whitespace-nowrap">
                      {parceiro.nome}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                      {parceiro.cpf_cnpj || '-'}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                      {parceiro.contato_whatsapp || '-'}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-indigo-600 dark:text-indigo-400">
                      {parceiro.comissao_porcentagem ? `${parceiro.comissao_porcentagem}%` : '0%'}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        parceiro.ativo 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' 
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}>
                        {parceiro.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(parceiro.id)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Editar Parceiro"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {!loadingRole && podeExcluir && (
                          <button
                            onClick={() => setParceiroParaExcluir(parceiro)}
                            className="p-1.5 text-gray-500 hover:text-rose-600 dark:text-gray-400 hover:bg-rose-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Excluir Parceiro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Cadastro / Edição */}
      <ModalCadastroParceiro
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        parceiroId={selectedParceiroId}
        onSuccess={fetchParceiros}
      />

      {/* Modal Exclusão */}
      {parceiroParaExcluir && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm p-6 border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/60 text-rose-600 rounded-full mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                Deseja excluir o parceiro {parceiroParaExcluir.nome}?
              </h3>
              <p className="text-xs text-rose-500 dark:text-rose-400 mt-2 font-medium">
                Esta ação não poderá ser desfeita.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 w-full">
              <button
                type="button"
                onClick={() => setParceiroParaExcluir(null)}
                disabled={deleting}
                className="w-full py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={deleting}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 transition-colors"
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