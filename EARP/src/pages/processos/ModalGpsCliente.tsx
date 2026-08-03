import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { X, Loader2, Plus, DollarSign, Trash2, CheckCircle2, AlertCircle, FileText, AlertTriangle, Clock } from 'lucide-react';

interface ModalDespesasGpsProps {
  isOpen: boolean;
  onClose: () => void;
  processoId: string | null;
  numeroProtocolo?: string;
}

export function ModalDespesasGps({ isOpen, onClose, processoId, numeroProtocolo }: ModalDespesasGpsProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [despesas, setDespesas] = useState<any[]>([]);

  // Estados para feedback personalizado e exclusão
  const [mensagemFeedback, setMensagemFeedback] = useState<{ texto: string; tipo: 'sucesso' | 'erro' } | null>(null);
  const [despesaParaExcluir, setDespesaParaExcluir] = useState<string | null>(null);

  // Formulário de nova despesa / GPS
  const [competencia, setCompetencia] = useState('');
  const [valor, setValor] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [statusPagamento, setStatusPagamento] = useState('Pendente');
  const [comprovanteUrl, setComprovanteUrl] = useState('');

  useEffect(() => {
    if (isOpen && processoId) {
      carregarDespesas();
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

  const carregarDespesas = async () => {
    if (!processoId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('processo_despesas_gps')
        .select('*')
        .eq('processo_id', processoId)
        .order('data_vencimento', { ascending: false });

      if (error) throw error;
      if (data) setDespesas(data);
    } catch (err: any) {
      console.error('Erro ao carregar despesas GPS:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const limparFormulario = () => {
    setCompetencia('');
    setValor('');
    setDataVencimento('');
    setStatusPagamento('Pendente');
    setComprovanteUrl('');
  };

  const handleAddDespesa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processoId) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('processo_despesas_gps').insert([
        {
          processo_id: processoId,
          competencia: competencia.trim(),
          valor: parseFloat(valor.replace(',', '.')) || 0,
          data_vencimento: dataVencimento || null,
          status_pagamento: statusPagamento,
          comprovante_url: comprovanteUrl.trim() || null,
        },
      ]);

      if (error) throw error;

      limparFormulario();
      carregarDespesas();
      mostrarFeedback('Guia/Despesa adicionada com sucesso!', 'sucesso');
    } catch (err: any) {
      mostrarFeedback('Erro ao salvar despesa: ' + err.message, 'erro');
    } finally {
      setSaving(false);
    }
  };

  const confirmarExclusao = async () => {
    if (!despesaParaExcluir) return;

    try {
      const { error } = await supabase
        .from('processo_despesas_gps')
        .delete()
        .eq('id', despesaParaExcluir);

      if (error) throw error;
      setDespesaParaExcluir(null);
      carregarDespesas();
      mostrarFeedback('Despesa excluída com sucesso!', 'sucesso');
    } catch (err: any) {
      mostrarFeedback('Erro ao excluir despesa: ' + err.message, 'erro');
      setDespesaParaExcluir(null);
    }
  };

  // Função para calcular o status de vencimento se estiver Pendente
  const calcularAlertaVencimento = (dataVencimentoStr: string, status: string) => {
    if (status === 'Pago' || status === 'Cancelado' || !dataVencimentoStr) return null;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const [ano, mes, dia] = dataVencimentoStr.split('-').map(Number);
    const vencimento = new Date(ano, mes - 1, dia);
    vencimento.setHours(0, 0, 0, 0);

    const diffTime = vencimento.getTime() - hoje.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        texto: `Vencido há ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'dia' : 'dias'}`,
        classe: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900',
        icone: AlertTriangle
      };
    } else if (diffDays === 0) {
      return {
        texto: 'Vence Hoje!',
        classe: 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-900',
        icone: Clock
      };
    } else if (diffDays <= 3) {
      return {
        texto: `Vence em ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`,
        classe: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900',
        icone: Clock
      };
    }
    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl p-5 border border-gray-200 dark:border-gray-700 my-8 relative">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700 mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Gestão de Custos e Guias (GPS)
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

        {/* Mensagem de Feedback */}
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

        {/* Formulário para Nova Despesa / GPS */}
        <form onSubmit={handleAddDespesa} className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700 mb-4 space-y-2.5">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Adicionar Nova Guia / Despesa
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-0.5">
                Competência
              </label>
              <input
                type="text"
                placeholder="Ex: 07/2026"
                value={competencia}
                onChange={(e) => setCompetencia(e.target.value)}
                required
                className="w-full px-2.5 py-1 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-xs text-gray-800 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-0.5">
                Valor (R$)
              </label>
              <input
                type="text"
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
                className="w-full px-2.5 py-1 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-xs text-gray-800 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-0.5">
                Vencimento
              </label>
              <input
                type="date"
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
                className="w-full px-2.5 py-1 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-xs text-gray-800 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-0.5">
                Status
              </label>
              <select
                value={statusPagamento}
                onChange={(e) => setStatusPagamento(e.target.value)}
                className="w-full px-2.5 py-1 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-xs text-gray-800 dark:text-gray-100"
              >
                <option value="Pendente">Pendente</option>
                <option value="Pago">Pago</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-0.5">
              Link do Comprovante <span className="text-gray-400 font-normal">(Opcional)</span>
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={comprovanteUrl}
              onChange={(e) => setComprovanteUrl(e.target.value)}
              className="w-full px-2.5 py-1 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-xs text-gray-800 dark:text-gray-100"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>Adicionar Despesa</span>
            </button>
          </div>
        </form>

        {/* Listagem das Despesas / GPS */}
        <div className="space-y-2.5">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Histórico de Guias e Custos
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
            </div>
          ) : despesas.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
              Nenhuma despesa ou guia registrada para este processo ainda.
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {despesas.map((item) => {
                const alerta = calcularAlertaVencimento(item.data_vencimento, item.status_pagamento);
                const AlertaIcon = alerta?.icone;

                return (
                  <div
                    key={item.id}
                    className="p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        item.status_pagamento === 'Pago'
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : item.status_pagamento === 'Cancelado'
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                          : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}>
                        {item.status_pagamento}
                      </span>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                            Comp: {item.competencia} — <span className="text-emerald-600 dark:text-emerald-400 font-mono">R$ {Number(item.valor).toFixed(2)}</span>
                          </p>

                          {/* Badge de Alerta de Vencimento */}
                          {alerta && AlertaIcon && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${alerta.classe}`}>
                              <AlertaIcon className="w-3 h-3" />
                              <span>{alerta.texto}</span>
                            </span>
                          )}
                        </div>

                        {item.data_vencimento && (
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                            Vencimento: {new Date(item.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.comprovante_url && (
                        <a
                          href={item.comprovante_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-1"
                          title="Ver Comprovante"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => setDespesaParaExcluir(item.id)}
                        className="text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1"
                        title="Excluir despesa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
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
        {despesaParaExcluir && (
          <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 rounded-xl">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-xl max-w-sm w-full text-center space-y-4">
              <div className="w-10 h-10 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Excluir Despesa</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Deseja realmente excluir esta guia/despesa do registro?
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDespesaParaExcluir(null)}
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