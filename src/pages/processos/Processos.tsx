import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // <--- 1. IMPORTADO O USE-NAVIGATE
import { supabase } from '../../services/supabaseClient';
import { ModalCadastroEdicaoProcessos } from './ModalNovoProcessos';
import { ModalHistoricoAndamento } from './ModalHistoricoAndamento';
import { ModalDespesasGps } from './ModalGpsCliente';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2, 
  FileText, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Calendar,
  Users,
  Building2,
  DollarSign
} from 'lucide-react';

interface Processo {
  id: string;
  numero_protocolo: string;
  tipo_demanda: string;
  status: 'Protocolado / Entrada' | 'Em análise' | 'Em exigência' | 'Deferido' | 'Indeferido';
  data_limite_exigencia?: string;
  procuracao_entregue: boolean;
  observacoes?: string;
  clientes?: {
    nome_completo: string;
    cpf_cnpj: string;
    matricula: string;
  };
  parceiros?: {
    nome: string;
    tipo: string;
  };
}

export function Processos() {
  const navigate = useNavigate(); // <--- 2. INICIALIZADO O NAVIGATE
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>('Em análise');
  
  const [processoHistoricoId, setProcessoHistoricoId] = useState<string | null>(null);
  const [protocoloHistorico, setProtocoloHistorico] = useState<string>('');

  // Estados para o Modal Individual de Custos / GPS por Processo
  const [processoCustosId, setProcessoCustosId] = useState<string | null>(null);
  const [protocoloCustos, setProtocoloCustos] = useState<string>('');

  // Controle de Permissão do Usuário Logado
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);

  // Controle do Modal de Cadastro / Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processoParaEditar, setProcessoParaEditar] = useState<Processo | null>(null);

  // Controle do Modal de Exclusão
  const [processoParaExcluir, setProcessoParaExcluir] = useState<Processo | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const fetchProcessos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('processos')
        .select(`
          *,
          clientes (nome_completo, cpf_cnpj, matricula),
          parceiros (nome, tipo)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProcessos(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar processos:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcessos();
  }, []);

  const podeExcluir = userRole === 'admin' || userRole === 'gerente';

  const handleExecuteDelete = async () => {
    if (!processoParaExcluir) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('processos')
        .delete()
        .eq('id', processoParaExcluir.id);

      if (error) throw error;

      setProcessos(prev => prev.filter(p => p.id !== processoParaExcluir.id));
      setProcessoParaExcluir(null);
    } catch (err: any) {
      alert('Erro ao excluir processo: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'protocolado':
      case 'entrada':
        return <span className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><Clock className="w-3 h-3"/> Protocolado</span>;
      case 'pendente':
        return <span className="bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><Clock className="w-3 h-3"/> Pendente</span>;
      case 'em_analise':
      case 'em analise':
      case 'em análise':
        return <span className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><FileText className="w-3 h-3"/> Em Análise</span>;
      case 'exigencia':
      case 'exigência':
      case 'em exigencia':
      case 'em exigência':
        return <span className="bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><AlertTriangle className="w-3 h-3"/> Exigência</span>;
      case 'deferido':
        return <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3"/> Deferido</span>;
      case 'indeferido':
        return <span className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><XCircle className="w-3 h-3"/> Indeferido</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 px-2.5 py-1 rounded-full text-xs font-semibold">{status}</span>;
    }
  };

  const filteredProcessos = processos.filter(proc => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (proc.numero_protocolo && proc.numero_protocolo.toLowerCase().includes(term)) ||
      (proc.tipo_demanda && proc.tipo_demanda.toLowerCase().includes(term)) ||
      (proc.clientes?.nome_completo && proc.clientes.nome_completo.toLowerCase().includes(term)) ||
      (proc.clientes?.matricula && proc.clientes.matricula.toLowerCase().includes(term)) ||
      (proc.parceiros?.nome && proc.parceiros.nome.toLowerCase().includes(term));

    if (activeTab === 'todos') return matchesSearch;
    return matchesSearch && proc.status === activeTab;
  });

  const countTab = (status: string) => {
    if (status === 'todos') return processos.length;
    return processos.filter(p => p.status === status).length;
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      
      {/* Topo: Campo de Pesquisa, Botão Central Geral e Botão Novo */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por protocolo, demanda, cliente ou parceiro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* <--- 3. BOTÃO AGORA NAVEGA PARA A PÁGINA OCULTA */}
          <button
            onClick={() => navigate('/processos/central-custos')}
            className="w-full sm:w-auto bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors shadow-sm"
          >
            <DollarSign className="w-4 h-4" />
            <span>GPS</span>
          </button>

          {/* Botão Novo Processo */}
          <button
            onClick={() => {
              setProcessoParaEditar(null);
              setIsModalOpen(true);
            }}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Processo</span>
          </button>
        </div>
      </div>

      {/* Abas de Filtro por Status */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {[
          { id: 'Protocolado / Entrada', label: 'Pendentes', icon: Clock },
          { id: 'Em análise', label: 'Em Análise', icon: FileText },
          { id: 'Em exigência', label: 'Exigência', icon: AlertTriangle },
          { id: 'Deferido', label: 'Deferidos', icon: CheckCircle },
          { id: 'Indeferido', label: 'Indeferidos', icon: XCircle },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-xs font-semibold">
                {countTab(tab.id)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tabela de Processos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : filteredProcessos.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
            Nenhum processo encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3 font-semibold">Protocolo / Demanda</th>
                  <th className="px-6 py-3 font-semibold">Cliente</th>
                  <th className="px-6 py-3 font-semibold">Parceiro / Afiliado</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Prazo Exigência</th>
                  <th className="px-6 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-800 dark:text-gray-200">
                {filteredProcessos.map((proc) => (
                  <tr key={proc.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                    
                    <td className="px-6 py-4">
                      <div className="font-bold text-blue-600 dark:text-blue-400">{proc.numero_protocolo}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{proc.tipo_demanda}</div>
                    </td>

                    <td className="px-6 py-4 font-medium whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span>{proc.clientes?.nome_completo || 'Cliente não vinculado'}</span>
                      </div>
                      <div className="text-xs text-gray-400 font-mono mt-0.5">
                        Mat: {proc.clientes?.matricula || '-'}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {proc.parceiros?.nome ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-100 dark:border-purple-900">
                          <Building2 className="w-3 h-3" />
                          <span>{proc.parceiros.nome}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Direto / Escritório</span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(proc.status)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {proc.data_limite_exigencia ? (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2.5 py-1 rounded-md border border-red-100 dark:border-red-900 w-fit">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(proc.data_limite_exigencia).toLocaleDateString('pt-BR')}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Sem prazo fatal</span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Botão de Histórico / Andamentos */}
                        <button
                          onClick={() => {
                            setProcessoHistoricoId(proc.id);
                            setProtocoloHistorico(proc.numero_protocolo);
                          }}
                          className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
                          title="Ver Histórico de Andamentos"
                        >
                          <Clock className="w-4 h-4" />
                        </button>

                        {/* Botão Individual de Custos e Guias (GPS) */}
                        <button
                          onClick={() => {
                            setProcessoCustosId(proc.id);
                            setProtocoloCustos(proc.numero_protocolo);
                          }}
                          className="p-1.5 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-gray-700 transition-colors"
                          title="Gestão de Custos e Guias (GPS) deste Processo"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setProcessoParaEditar(proc);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
                          title="Editar Processo"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {!loadingRole && podeExcluir && (
                          <button
                            onClick={() => setProcessoParaExcluir(proc)}
                            className="p-1.5 text-gray-500 hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-gray-700 transition-colors"
                            title="Excluir Processo"
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

      {/* MODAL DE CADASTRO / EDIÇÃO DE PROCESSOS */}
      <ModalCadastroEdicaoProcessos
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setProcessoParaEditar(null);
        }}
        processoId={processoParaEditar?.id || null}
        onSuccess={() => {
          setIsModalOpen(false);
          setProcessoParaEditar(null);
          fetchProcessos();
        }}
      />

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {processoParaExcluir && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/60 text-rose-600 rounded-full mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                Excluir o protocolo {processoParaExcluir.numero_protocolo}?
              </h3>
              <p className="text-xs text-rose-500 dark:text-rose-400 mt-2 font-medium">
                Esta ação não poderá ser desfeita e removerá os dados vinculados.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 w-full">
              <button
                type="button"
                onClick={() => setProcessoParaExcluir(null)}
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

      {/* MODAL DE HISTÓRICO DE ANDAMENTOS */}
      <ModalHistoricoAndamento
        isOpen={!!processoHistoricoId}
        onClose={async () => {
          setProcessoHistoricoId(null);
          await fetchProcessos(); // Atualiza a tabela sempre que o modal fechar
        }}
        processoId={processoHistoricoId}
        numeroProtocolo={protocoloHistorico}
      />

      {/* MODAL INDIVIDUAL DE CUSTOS E GUIAS (GPS) */}
      <ModalDespesasGps
        isOpen={!!processoCustosId}
        onClose={() => setProcessoCustosId(null)}
        processoId={processoCustosId}
        numeroProtocolo={protocoloCustos}
      />

    </div>
  );
}