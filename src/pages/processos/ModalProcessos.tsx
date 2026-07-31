import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { X, Loader2, Save, Calendar, FileText, Users, Building2 } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  processoId?: string | null;
  onSuccess: () => void;
}

export function ModalCadastroEdicaoProcessos({ isOpen, onClose, processoId, onSuccess }: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Listas auxiliares para os selects
  const [clientes, setClientes] = useState<any[]>([]);
  const [parceiros, setParceiros] = useState<any[]>([]);

  // Estados do Formulário
  const [clienteId, setClienteId] = useState('');
  const [parceiroId, setParceiroId] = useState('');
  const [numeroProtocolo, setNumeroProtocolo] = useState('');
  const [tipoDemanda, setTipoDemanda] = useState('');
  const [status, setStatus] = useState('pendente');
  const [dataLimiteExigencia, setDataLimiteExigencia] = useState('');
  const [procuracaoEntregue, setProcuracaoEntregue] = useState(false);
  const [observacoes, setObservacoes] = useState('');

  // Carregar dados auxiliares (Clientes e Parceiros) ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      carregarDadosAuxiliares();
      if (processoId) {
        carregarProcesso(processoId);
      } else {
        limparFormulario();
      }
    }
  }, [isOpen, processoId]);

  const carregarDadosAuxiliares = async () => {
    try {
      const [resClientes, resParceiros] = await Promise.all([
        supabase.from('clientes').select('id, nome_completo, cpf_cnpj, matricula').order('nome_completo'),
        supabase.from('parceiros').select('id, nome, tipo').eq('status', 'ativo').order('nome')
      ]);

      if (resClientes.data) setClientes(resClientes.data);
      if (resParceiros.data) setParceiros(resParceiros.data);
    } catch (err) {
      console.error('Erro ao carregar selects:', err);
    }
  };

  const carregarProcesso = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('processos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setClienteId(data.cliente_id || '');
        setParceiroId(data.parceiro_id || '');
        setNumeroProtocolo(data.numero_protocolo || '');
        setTipoDemanda(data.tipo_demanda || '');
        setStatus(data.status || 'pendente');
        setDataLimiteExigencia(data.data_limite_exigencia ? data.data_limite_exigencia.split('T')[0] : '');
        setProcuracaoEntregue(data.procuracao_entregue || false);
        setObservacoes(data.observacoes || '');
      }
    } catch (err: any) {
      alert('Erro ao carregar dados do processo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const limparFormulario = () => {
    setClienteId('');
    setParceiroId('');
    setNumeroProtocolo('');
    setTipoDemanda('');
    setStatus('pendente');
    setDataLimiteExigencia('');
    setProcuracaoEntregue(false);
    setObservacoes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId || !numeroProtocolo || !tipoDemanda) {
      alert('Por favor, preencha os campos obrigatórios (Cliente, Protocolo e Demanda).');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        cliente_id: clienteId,
        parceiro_id: parceiroId || null,
        numero_protocolo: numeroProtocolo,
        tipo_demanda: tipoDemanda,
        status,
        data_limite_exigencia: dataLimiteExigencia || null,
        procuracao_entregue: procuracaoEntregue,
        observacoes,
        updated_at: new Date().toISOString()
      };

      if (processoId) {
        const { error } = await supabase
          .from('processos')
          .update(payload)
          .eq('id', processoId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('processos')
          .insert([payload]);
        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      alert('Erro ao salvar processo: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl p-6 border border-gray-200 dark:border-gray-700 my-8">
        
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700 mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            {processoId ? 'Editar Processo Administrativo' : 'Cadastrar Novo Processo'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Linha 1: Cliente e Parceiro/Afiliado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Cliente *
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value)}
                    required
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione o cliente...</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nome_completo} {c.matricula ? `(Mat: ${c.matricula})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Parceiro / Afiliado Local (Ponta)
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={parceiroId}
                    onChange={(e) => setParceiroId(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Nenhum (Demanda Direta)</option>
                    {parceiros.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nome} ({p.tipo})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Linha 2: Número de Protocolo e Tipo de Demanda */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Número de Protocolo *
                </label>
                <input
                  type="text"
                  placeholder="Ex: 123456789"
                  value={numeroProtocolo}
                  onChange={(e) => setNumeroProtocolo(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Demanda *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Aposentadoria por Tempo / BPC"
                  value={tipoDemanda}
                  onChange={(e) => setTipoDemanda(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Linha 3: Status e Data Limite de Exigência */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Status do Processo
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pendente">Pendente</option>
                  <option value="em_analise">Em Análise</option>
                  <option value="exigencia">Em Exigência</option>
                  <option value="deferido">Deferido</option>
                  <option value="indeferido">Indeferido</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-red-500" />
                  Data Limite de Exigência (Prazo Fatal)
                </label>
                <input
                  type="date"
                  value={dataLimiteExigencia}
                  onChange={(e) => setDataLimiteExigencia(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Checkbox de Procuração */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="procuracao"
                checked={procuracaoEntregue}
                onChange={(e) => setProcuracaoEntregue(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="procuracao" className="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                Procuração assinada já foi entregue pelo afiliado/parceiro local
              </label>
            </div>

            {/* Observações */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Observações Operacionais
              </label>
              <textarea
                rows={3}
                placeholder="Detalhes relevantes sobre o protocolo, pendências ou documentos..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Rodapé com botões de ação */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <Save className="w-4 h-4" />
                <span>{saving ? 'Salvando...' : 'Salvar Processo'}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}