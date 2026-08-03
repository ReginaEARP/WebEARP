import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { X, Loader2, Plus, Clock, Trash2, User, AlertCircle, CheckCircle2, Calendar } from 'lucide-react';

interface ModalConsultaProps {
  isOpen: boolean;
  onClose: () => void;
  consultaId: string | number | null;
  numeroProtocolo?: string;
  onSuccess?: () => void;
}

export function ModalConsultaAndamento({ isOpen, onClose, consultaId, numeroProtocolo, onSuccess }: ModalConsultaProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [historico, setHistorico] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Estados para feedback e exclusão
  const [mensagemFeedback, setMensagemFeedback] = useState<{ texto: string; tipo: 'sucesso' | 'erro' } | null>(null);
  const [itemParaExcluir, setItemParaExcluir] = useState<string | null>(null);

  // Formulário do Dia da Consulta
  const [dataMovimentacao, setDataMovimentacao] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [statusComparecimento, setStatusComparecimento] = useState('Compareceu'); 
  const [dataRemarcacao, setDataRemarcacao] = useState('');
  const [descricao, setDescricao] = useState('');

  useEffect(() => {
    if (isOpen && consultaId) {
      carregarUsuarioLogado();
      carregarHistorico();
      limparFormulario();
      setMensagemFeedback(null);
    }
  }, [isOpen, consultaId]);

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

  const carregarHistorico = async () => {
    if (!consultaId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('consulta_historico')
        .select('*')
        .eq('consulta_id', consultaId)
        .order('data_movimentacao', { ascending: false });

      if (error) throw error;
      
      if (data) {
        const historicoComPerfis = await Promise.all(
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
        setHistorico(historicoComPerfis);
      }
    } catch (err: any) {
      console.error('Erro ao carregar histórico da consulta:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const limparFormulario = () => {
    setDataMovimentacao(new Date().toISOString().split('T')[0]);
    setStatusComparecimento('Compareceu');
    setDataRemarcacao('');
    setDescricao('');
  };

  const handleSalvarAtendimento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultaId) return;

    const exigeData = statusComparecimento === 'Remarcar' || statusComparecimento === 'Retorno';

    if (exigeData && !dataRemarcacao) {
      mostrarFeedback('Por favor, informe a data correspondente.', 'erro');
      return;
    }

    setSaving(true);
    try {
      // 1. Insere o registro no histórico salvando a data de retorno/remarcação na coluna 'nova_data'
      const { error: errHistorico } = await supabase.from('consulta_historico').insert([
        {
          consulta_id: consultaId,
          data_movimentacao: dataMovimentacao,
          status_movimentacao: statusComparecimento,
          nova_data: exigeData ? dataRemarcacao : null, // Salva na coluna nova_data
          observacoes: descricao.trim() || null,
          usuario_id: userId,
        },
      ]);

      if (errHistorico) throw errHistorico;

      // 2. Atualiza apenas o status na tabela principal (sem mexer na coluna 'data' da tabela principal)
      const dadosAtualizacao: any = {
        status: statusComparecimento,
        updated_at: new Date().toISOString()
      };

      const { error: errUpdate } = await supabase
        .from('consultas_exames')
        .update(dadosAtualizacao)
        .eq('id', consultaId);

      if (errUpdate) {
        console.warn('Aviso: Histórico salvo, mas a tabela principal não foi atualizada:', errUpdate.message);
      }

      limparFormulario();
      carregarHistorico();

      if (onSuccess) onSuccess();
      window.dispatchEvent(new CustomEvent('consultaAtualizada'));

      mostrarFeedback('Status da consulta atualizado com sucesso!', 'sucesso');
    } catch (err: any) {
      mostrarFeedback('Erro ao salvar atendimento: ' + err.message, 'erro');
    } finally {
      setSaving(false);
    }
  };

  const confirmarExclusao = async () => {
    if (!itemParaExcluir) return;

    try {
      const { error } = await supabase
        .from('consulta_historico')
        .delete()
        .eq('id', itemParaExcluir);

      if (error) throw error;
      setItemParaExcluir(null);
      carregarHistorico();
      mostrarFeedback('Registro excluído com sucesso!', 'sucesso');
    } catch (err: any) {
      mostrarFeedback('Erro ao excluir registro: ' + err.message, 'erro');
      setItemParaExcluir(null);
    }
  };

  if (!isOpen) return null;

  const exibeCampoData = statusComparecimento === 'Remarcar' || statusComparecimento === 'Retorno';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl p-5 border border-gray-200 dark:border-gray-700 my-8 relative">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700 mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Controle de Atendimento da Consulta
            </h2>
            {numeroProtocolo && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Identificador / Protocolo: <span className="font-mono font-semibold">{numeroProtocolo}</span>
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

        {/* Feedback */}
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

        {/* Formulário do Dia da Consulta */}
        <form onSubmit={handleSalvarAtendimento} className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700 mb-4 space-y-2.5">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Registrar Movimentação
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-0.5">
                Data da Ocorrência
              </label>
              <input
                type="date"
                value={dataMovimentacao}
                onChange={(e) => setDataMovimentacao(e.target.value)}
                required
                className="w-full px-2.5 py-1 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-xs text-gray-800 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-0.5">
                Status da Consulta
              </label>
              <select
                value={statusComparecimento}
                onChange={(e) => setStatusComparecimento(e.target.value)}
                className="w-full px-2.5 py-1 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-xs text-gray-800 dark:text-gray-100"
              >
                <option value="Compareceu">Compareceu</option>
                <option value="Faltou">Faltou</option>
                <option value="Remarcar">Remarcar</option>
                <option value="Retorno">Retorno</option>
                <option value="Arquivar">Arquivar</option>
              </select>
            </div>
          </div>

          {/* Campo Condicional: Exibido se for Remarcar ou Retorno */}
          {exibeCampoData && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg animate-fadeIn">
              <label className="block text-[11px] font-semibold text-amber-800 dark:text-amber-300 mb-0.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                {statusComparecimento === 'Retorno' ? 'Data do Retorno' : 'Nova Data para Remarcação'}
              </label>
              <input
                type="date"
                value={dataRemarcacao}
                onChange={(e) => setDataRemarcacao(e.target.value)}
                required={exibeCampoData}
                className="w-full md:w-1/2 px-2.5 py-1 border border-amber-300 dark:border-amber-700 rounded-lg bg-white dark:bg-gray-900 text-xs text-gray-800 dark:text-gray-100"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-0.5">
              Observações / Justificativa <span className="text-gray-400 font-normal">(Opcional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Digite detalhes sobre o atendimento, falta ou motivo..."
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
              <span>Salvar Registro</span>
            </button>
          </div>
        </form>

        {/* Histórico / Linha do Tempo */}
        <div className="space-y-2.5">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Histórico de Movimentações
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            </div>
          ) : historico.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
              Nenhum registro de atendimento para esta consulta ainda.
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {historico.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm flex flex-col gap-1 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      item.status_movimentacao === 'Compareceu' 
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : item.status_movimentacao === 'Remarcar' || item.status_movimentacao === 'Retorno' || item.status_movimentacao === 'Remarcado'
                        ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        : item.status_movimentacao === 'Arquivar' || item.status_movimentacao === 'Arquivado'
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                    }`}>
                      {item.status_movimentacao || 'Registro'}
                    </span>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-400 font-mono">
                          {new Date(item.data_movimentacao + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                        <button
                          onClick={() => setItemParaExcluir(item.id)}
                          className="text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-0.5"
                          title="Excluir registro"
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

                  {item.nova_data && (
                    <div className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      Data Agendada / Retorno: {new Date(item.nova_data + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </div>
                  )}

                  {(item.observacoes || item.observacao) && (
                    <p className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap mt-0.5">
                      {item.observacoes || item.observacao}
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

        {/* Modal Interno de Confirmação de Exclusão */}
        {itemParaExcluir && (
          <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 rounded-xl">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-xl max-w-sm w-full text-center space-y-4">
              <div className="w-10 h-10 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Excluir Registro</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Deseja realmente excluir este registro do histórico?
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setItemParaExcluir(null)}
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