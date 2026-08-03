import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { X, Loader2, Plus, Clock, Trash2, User, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ModalHistoricoProps {
  isOpen: boolean;
  onClose: () => void;
  processoId: string | null;
  numeroProtocolo?: string;
  onSuccess?: () => void;
}

export function ModalHistoricoAndamento({ isOpen, onClose, processoId, numeroProtocolo }: ModalHistoricoProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [andamentos, setAndamentos] = useState<any[]>([]);
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Estados para feedback personalizado e modais internos
  const [mensagemFeedback, setMensagemFeedback] = useState<{ texto: string; tipo: 'sucesso' | 'erro' } | null>(null);
  const [andamentoParaExcluir, setAndamentoParaExcluir] = useState<string | null>(null);
  const [isModalNovoStatusOpen, setIsModalNovoStatusOpen] = useState(false);
  const [novoStatusInput, setNovoStatusInput] = useState('');
  const [salvandoStatus, setSalvandoStatus] = useState(false);

  // Formulário de novo andamento
  const [dataMovimentacao, setDataMovimentacao] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [descricao, setDescricao] = useState('');
  const [statusEtapa, setStatusEtapa] = useState('');
  const [dataLimiteExigencia, setDataLimiteExigencia] = useState('');

  useEffect(() => {
    if (isOpen && processoId) {
      carregarUsuarioLogado();
      carregarAndamentos();
      carregarStatusGerais();
      limparFormulario();
      setMensagemFeedback(null);
    }
  }, [isOpen, processoId]);

  const mostrarFeedback = (texto: string, tipo: 'sucesso' | 'erro') => {
    setMensagemFeedback({ texto, tipo });
    setTimeout(() => {
      setMensagemFeedback(null);
    }, 4000);
  };

  const carregarUsuarioLogado = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    } catch (err: any) {
      console.error('Erro ao buscar usuário logado:', err.message);
    }
  };

  const carregarAndamentos = async () => {
    if (!processoId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('processo_andamentos')
        .select('*')
        .eq('processo_id', processoId)
        .order('data_movimentacao', { ascending: false });

      if (error) throw error;
      
      if (data) {
        const andamentosComPerfis = await Promise.all(
          data.map(async (item) => {
            let nomeUsuario = 'Usuário';
            if (item.usuario_id) {
              const { data: perfilData } = await supabase
                .from('perfis')
                .select('nome')
                .eq('id', item.usuario_id)
                .single();
              if (perfilData?.nome) {
                nomeUsuario = perfilData.nome;
              }
            }
            return { ...item, nome_usuario: nomeUsuario };
          })
        );
        setAndamentos(andamentosComPerfis);
      }
    } catch (err: any) {
      console.error('Erro ao carregar andamentos:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const carregarStatusGerais = async () => {
    try {
      const { data, error } = await supabase
        .from('cadastros_gerais')
        .select('nome')
        .eq('categoria', 'STATUS_ANDAMENTO')
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const lista = data.map((item) => item.nome);
        setStatusOptions(lista);
        setStatusEtapa(lista[0]);
      } else {
        const padroes = ['Protocolado / Entrada', 'Em Análise', 'Exigência', 'Deferido', 'Indeferido'];
        
        for (const padrao of padroes) {
          await supabase.from('cadastros_gerais').insert([
            { categoria: 'STATUS_ANDAMENTO', nome: padrao, ativo: true }
          ]);
        }

        setStatusOptions(padroes);
        setStatusEtapa(padroes[0]);
      }
    } catch (err: any) {
      console.error('Erro ao carregar status gerais:', err.message);
    }
  };

  const limparFormulario = () => {
    setDataMovimentacao(new Date().toISOString().split('T')[0]);
    setDescricao('');
    setDataLimiteExigencia('');
  };

  const handleCadastrarNovoStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoStatusInput.trim()) return;

    const nomeFormatado = novoStatusInput.trim();
    setSalvandoStatus(true);

    try {
      const { error } = await supabase.from('cadastros_gerais').insert([
        {
          categoria: 'STATUS_ANDAMENTO',
          nome: nomeFormatado,
          ativo: true,
        },
      ]);

      if (error) throw error;

      await carregarStatusGerais();
      setStatusEtapa(nomeFormatado);
      setNovoStatusInput('');
      setIsModalNovoStatusOpen(false);
      mostrarFeedback('Novo status cadastrado com sucesso!', 'sucesso');
    } catch (err: any) {
      mostrarFeedback('Erro ao cadastrar novo status: ' + err.message, 'erro');
    } finally {
      setSalvandoStatus(false);
    }
  };

  const handleAddAndamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processoId) return;

    setSaving(true);
    try {
      // 1. Insere o andamento na tabela de histórico
      const { error } = await supabase.from('processo_andamentos').insert([
        {
          processo_id: processoId,
          data_movimentacao: dataMovimentacao,
          descricao_andamento: descricao.trim() || null,
          status_etapa: statusEtapa,
          usuario_id: userId,
        },
      ]);

      if (error) throw error;

      // 2. MONTA OS DADOS PARA ATUALIZAR O PROCESSO PRINCIPAL
      const isExigencia = statusEtapa.toLowerCase().includes('exigencia') || statusEtapa.toLowerCase().includes('exigência');
      
      const dadosAtualizacao: any = {
        status: statusEtapa,
        updated_at: new Date().toISOString()
      };

      // Se for exigência e o usuário preencheu a data, atualiza o prazo fatal; se não preencheu, pode limpar ou manter
      if (isExigencia) {
        dadosAtualizacao.data_limite_exigencia = dataLimiteExigencia || null;
      } else {
        // Se mudou para outro status que não é exigência, limpa o prazo fatal anterior se desejar
        dadosAtualizacao.data_limite_exigencia = null;
      }

      // 3. ATUALIZA O STATUS PRINCIPAL NA TABELA DE PROCESSOS
      const { error: errUpdateProcesso } = await supabase
        .from('processos')
        .update(dadosAtualizacao)
        .eq('id', processoId);

      if (errUpdateProcesso) throw errUpdateProcesso;

      limparFormulario();
      carregarAndamentos();

      // 4. Dispara um aviso global para a página principal atualizar a tabela sozinha
      window.dispatchEvent(new CustomEvent('processoAtualizado'));

      mostrarFeedback('Andamento adicionado e status atualizado com sucesso!', 'sucesso');
    } catch (err: any) {
      mostrarFeedback('Erro ao salvar andamento: ' + err.message, 'erro');
    } finally {
      setSaving(false);
    }
  };

  const confirmarExclusao = async () => {
    if (!andamentoParaExcluir) return;

    try {
      const { error } = await supabase
        .from('processo_andamentos')
        .delete()
        .eq('id', andamentoParaExcluir);

      if (error) throw error;
      setAndamentoParaExcluir(null);
      carregarAndamentos();
      mostrarFeedback('Andamento excluído com sucesso!', 'sucesso');
    } catch (err: any) {
      mostrarFeedback('Erro ao excluir andamento: ' + err.message, 'erro');
      setAndamentoParaExcluir(null);
    }
  };

  if (!isOpen) return null;

  const isExigenciaSelecionada = statusEtapa.toLowerCase().includes('exigencia') || statusEtapa.toLowerCase().includes('exigência');

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl p-5 border border-gray-200 dark:border-gray-700 my-8 relative">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700 mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Histórico de Andamentos Administrativos
            </h2>
            {numeroProtocolo && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Protocolo: <span className="font-mono font-semibold">{numeroProtocolo}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensagem de Feedback Personalizada */}
        {mensagemFeedback && (
          <div className={`mb-4 p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
            mensagemFeedback.tipo === 'sucesso' 
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800' 
              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
          }`}>
            {mensagemFeedback.tipo === 'sucesso' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{mensagemFeedback.texto}</span>
          </div>
        )}

        {/* Formulário para Novo Andamento */}
        <form onSubmit={handleAddAndamento} className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700 mb-4 space-y-2.5">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Adicionar Nova Movimentação
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-0.5">
                Data da Movimentação
              </label>
              <input
                type="date"
                value={dataMovimentacao}
                onChange={(e) => setDataMovimentacao(e.target.value)}
                required
                className="w-full px-2.5 py-1 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-xs text-gray-800 dark:text-gray-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-0.5">
                Status / Etapa
              </label>
              <div className="flex items-center gap-1.5">
                <select
                  value={statusEtapa}
                  onChange={(e) => setStatusEtapa(e.target.value)}
                  className="w-full px-2.5 py-1 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-xs text-gray-800 dark:text-gray-100"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setNovoStatusInput('');
                    setIsModalNovoStatusOpen(true);
                  }}
                  className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center shrink-0 shadow-sm"
                  title="Cadastrar novo status"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Campo condicional para Data Limite de Exigência (Prazo Fatal) */}
          {isExigenciaSelecionada && (
            <div className="p-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 rounded-lg animate-fadeIn">
              <label className="block text-[11px] font-semibold text-orange-800 dark:text-orange-300 mb-0.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-orange-600" />
                Data Limite de Exigência (Prazo Fatal)
              </label>
              <input
                type="date"
                value={dataLimiteExigencia}
                onChange={(e) => setDataLimiteExigencia(e.target.value)}
                required={isExigenciaSelecionada}
                className="w-full md:w-1/2 px-2.5 py-1 border border-orange-300 dark:border-orange-700 rounded-lg bg-white dark:bg-gray-900 text-xs text-gray-800 dark:text-gray-100"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-0.5">
              Descrição Detalhada do Andamento <span className="text-gray-400 font-normal">(Opcional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Descreva o que ocorreu nesta movimentação..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full px-2.5 py-1 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-xs text-gray-800 dark:text-gray-100 resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>Adicionar Andamento</span>
            </button>
          </div>
        </form>

        {/* Listagem do Histórico (Linha do Tempo Compacta) */}
        <div className="space-y-2.5">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Linha do Tempo do Processo
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            </div>
          ) : andamentos.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
              Nenhum andamento registrado para este processo ainda.
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {andamentos.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm flex flex-col gap-1 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded">
                      {item.status_etapa || 'Movimentação'}
                    </span>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-400 font-mono">
                          {new Date(item.data_movimentacao + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                        <button
                          onClick={() => setAndamentoParaExcluir(item.id)}
                          className="text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-0.5"
                          title="Excluir andamento"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                        <User className="w-2.5 h-2.5 text-gray-400" />
                        <span>{item.nome_usuario}</span>
                      </div>
                    </div>
                  </div>
                  {item.descricao_andamento && (
                    <p className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                      {item.descricao_andamento}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-end pt-3 mt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-medium transition-colors"
          >
            Fechar
          </button>
        </div>

        {/* Modal Interno para Cadastro de Novo Status */}
        {isModalNovoStatusOpen && (
          <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 rounded-xl">
            <form onSubmit={handleCadastrarNovoStatus} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-xl max-w-sm w-full space-y-4">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto">
                <Plus className="w-5 h-5" />
              </div>
              <div className="text-center">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Cadastrar Novo Status</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Digite o nome do novo status/etapa para o andamento:
                </p>
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Ex: Em Diligência"
                  value={novoStatusInput}
                  onChange={(e) => setNovoStatusInput(e.target.value)}
                  autoFocus
                  required
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsModalNovoStatusOpen(false)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoStatus}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm flex items-center gap-1 disabled:opacity-50"
                >
                  {salvandoStatus && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Cadastrar</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal Interno de Confirmação de Exclusão */}
        {andamentoParaExcluir && (
          <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 rounded-xl">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-xl max-w-sm w-full text-center space-y-4">
              <div className="w-10 h-10 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Excluir Andamento</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Deseja realmente excluir este andamento do histórico?
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAndamentoParaExcluir(null)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarExclusao}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}