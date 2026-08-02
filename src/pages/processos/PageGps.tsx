import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { ArrowLeft, Loader2, Plus, CheckCircle2, Clock, AlertTriangle, Trash2, Search, Bell, Send } from 'lucide-react';

export function CentralCustosGpsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lancandoLote, setLancandoLote] = useState(false);
  const [despesas, setDespesas] = useState<any[]>([]);
  const [processos, setProcessos] = useState<any[]>([]);
  
  // Seleção múltipla para lote
  const [selecionados, setSelecionados] = useState<string[]>([]);
  
  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  // Formulário do Modal Geral
  const [showForm, setShowForm] = useState(false);
  const [processoIdSelecionado, setProcessoIdSelecionado] = useState('');
  const [competencia, setCompetencia] = useState('');
  const [valor, setValor] = useState('');
  const [vencimento, setVencimento] = useState('');
  const [statusPagamento, setStatusPagamento] = useState('pendente');
  const [linkComprovante, setLinkComprovante] = useState('');

  useEffect(() => {
    carregarCentral();
  }, []);

  const carregarCentral = async () => {
    setLoading(true);
    try {
      const { data: resProcessos, error: errProc } = await supabase
        .from('processos')
        .select(`
          id,
          numero_protocolo,
          tipo_demanda,
          clientes (
            nome_completo
          )
        `)
        .order('created_at', { ascending: false });

      if (errProc) throw errProc;
      if (resProcessos) setProcessos(resProcessos);

      const { data: resDespesas, error: errDesp } = await supabase
        .from('processo_despesas_gps')
        .select(`
          *,
          processos (
            numero_protocolo,
            tipo_demanda,
            clientes (
              nome_completo
            )
          )
        `)
        .order('data_vencimento', { ascending: true });

      if (errDesp) throw errDesp;
      if (resDespesas) setDespesas(resDespesas);
      setSelecionados([]); // Limpa seleção ao recarregar

    } catch (err: any) {
      console.error('Erro ao carregar central de custos:', err);
      alert('Erro ao carregar dados da central: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarDespesa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processoIdSelecionado || !valor) {
      alert('Por favor, selecione o processo e informe o valor.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        processo_id: processoIdSelecionado,
        competencia: competencia.trim() || 'GPS', 
        valor: parseFloat(valor.replace(',', '.'))  || 0,
        data_vencimento: vencimento || null,
        status_pagamento: statusPagamento,
        comprovante_url: linkComprovante || null,
      };

      const { error } = await supabase
        .from('processo_despesas_gps')
        .insert([payload]);

      if (error) throw error;

      setProcessoIdSelecionado('');
      setCompetencia('');
      setValor('');
      setVencimento('');
      setStatusPagamento('pendente');
      setLinkComprovante('');
      setShowForm(false);
     
      await carregarCentral();
    } catch (err: any) {
      alert('Erro ao salvar despesa/guia: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const alternarStatusPagamento = async (id: string, statusAtual: string) => {
    const novoStatus = statusAtual === 'pago' ? 'pendente' : 'pago';
    try {
      const { error } = await supabase
        .from('processo_despesas_gps')
        .update({ status_pagamento: novoStatus })
        .eq('id', id);

      if (error) throw error;
      setDespesas(despesas.map(d => d.id === id ? { ...d, status_pagamento: novoStatus } : d));
    } catch (err: any) {
      alert('Erro ao atualizar status: ' + err.message);
    }
  };

  const excluirDespesa = async (id: string) => {
    if (!confirm('Deseja realmente excluir este registro?')) return;
    try {
      const { error } = await supabase
        .from('processo_despesas_gps')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setDespesas(despesas.filter(d => d.id !== id));
      setSelecionados(selecionados.filter(sId => sId !== id));
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const notificarCliente = (item: any) => {
    const nome = item.processos?.clientes?.nome_completo || 'Cliente';
    const tipo = item.tipo;
    const valorFmt = Number(item.valor || 0).toFixed(2).replace('.', ',');
    const dataFmt = item.data_vencimento ? new Date(item.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR') : '';
    
    const texto = `Olá ${nome}, informamos que a sua guia/despesa (${tipo}) no valor de R$ ${valorFmt} vence hoje (${dataFmt}). Por favor, confirme o pagamento ou entre em contato para mais detalhes.`;
    
    navigator.clipboard.writeText(texto);
    alert(`Mensagem de aviso copiada para a área de transferência!\n\n"${texto}"`);
  };

  // Funções de Seleção Múltipla
  const toggleSelecionarTudo = () => {
    if (selecionados.length === despesasFiltradas.length) {
      setSelecionados([]);
    } else {
      setSelecionados(despesasFiltradas.map(d => d.id));
    }
  };

  const toggleSelecionarItem = (id: string) => {
    if (selecionados.includes(id)) {
      setSelecionados(selecionados.filter(sId => sId !== id));
    } else {
      setSelecionados([...selecionados, id]);
    }
  };

  // Cálculo do acumulado dos itens selecionados
  const valorTotalSelecionado = despesas
    .filter(d => selecionados.includes(d.id))
    .reduce((acc, curr) => acc + Number(curr.valor || 0), 0);

  // Ação de Lançar para o Financeiro
  const handleLancarFinanceiro = async () => {
    if (selecionados.length === 0) return;
    
    if (!confirm(`Deseja realmente lançar ${selecionados.length} guia(s) selecionada(s) totalizando R$ ${valorTotalSelecionado.toFixed(2).replace('.', ',')} para o financeiro?`)) {
      return;
    }

    setLancandoLote(true);
    try {
      // Exemplo de lógica de integração: Insere em uma tabela de lançamentos financeiros
      // (Certifique-se de ajustar o nome da tabela do financeiro conforme seu banco de dados)
      const itensParaLancar = despesas.filter(d => selecionados.includes(d.id));

      for (const item of itensParaLancar) {
        const payloadFinanceiro = {
          descricao: `Guia/GPS - ${item.processos?.clientes?.nome_completo || 'Cliente'} (Prot: ${item.processos?.numero_protocolo || 'N/A'})`,
          valor: item.valor,
          data_vencimento: item.data_vencimento,
          tipo: 'despesa',
          status: 'pendente', // ou pago
          referencia_id: item.id
        };

        const { error: errFin } = await supabase
          .from('financeiro') // Substitua pelo nome real da tabela do seu financeiro se for diferente
          .insert([payloadFinanceiro]);

        if (errFin) throw errFin;

        // Opcional: Atualizar status na tabela atual para indicar que já foi enviado ao financeiro
        await supabase
          .from('processo_despesas_gps')
          .update({ status_pagamento: 'pago' }) // ou outro campo de controle
          .eq('id', item.id);
      }

      alert('Guias lançadas para o financeiro com sucesso!');
      setSelecionados([]);
      await carregarCentral();
    } catch (err: any) {
      alert('Erro ao lançar para o financeiro: ' + err.message);
    } finally {
      setLancandoLote(false);
    }
  };

  const despesasFiltradas = despesas.filter(d => {
    const nomeCliente = d.processos?.clientes?.nome_completo?.toLowerCase() || '';
    const protocolo = d.processos?.numero_protocolo?.toLowerCase() || '';
    const tipoD = d.tipo?.toLowerCase() || '';
    const termo = busca.toLowerCase();

    const matchBusca = nomeCliente.includes(termo) || protocolo.includes(termo) || tipoD.includes(termo);
    const matchStatus = filtroStatus === 'todos' || d.status_pagamento === filtroStatus;

    return matchBusca && matchStatus;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-200 transition-colors"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Gestão de Custos e Guias (GPS)
            </h1>
          </div>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Guia</span>
        </button>
      </div>

      {/* PAINEL DE ACUMULADO / AÇÃO EM LOTE */}
      {selecionados.length > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
          <div>
            <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
              {selecionados.length} guia(s) selecionada(s)
            </span>
            <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
              Total Acumulado: R$ {valorTotalSelecionado.toFixed(2).replace('.', ',')}
            </div>
          </div>
          <button
            onClick={handleLancarFinanceiro}
            disabled={lancandoLote}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow transition-colors disabled:opacity-50"
          >
            {lancandoLote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Lançar Selecionadas para o Financeiro</span>
          </button>
        </div>
      )}

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, protocolo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100"
          >
            <option value="todos">Todos os Status</option>
            <option value="pendente">Pendentes</option>
            <option value="pago">Pagos</option>
          </select>
        </div>
      </div>

      {/* MODAL DE CADASTRO */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-gray-200 dark:border-gray-700 animate-fadeIn">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
                Adicionar Nova Guia / Despesa
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarDespesa} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Processo / Cliente</label>
                <select
                  value={processoIdSelecionado}
                  onChange={(e) => setProcessoIdSelecionado(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100"
                >
                  <option value="">Selecione o processo...</option>
                  {processos.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.clientes?.nome_completo || 'Cliente'} — Prot: {p.numero_protocolo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Competência</label>
                  <input
                    type="text"
                    placeholder="Ex: 07/2026"
                    value={competencia}
                    onChange={(e) => setCompetencia(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Valor (R$)</label>
                  <input
                    type="text"
                    placeholder="0,00"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Vencimento</label>
                  <input
                    type="date"
                    value={vencimento}
                    onChange={(e) => setVencimento(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select
                    value={statusPagamento}
                    onChange={(e) => setStatusPagamento(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="pago">Pago</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Link do Comprovante <span className="text-gray-400 font-normal">(Opcional)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={linkComprovante}
                  onChange={(e) => setLinkComprovante(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <Plus className="w-4 h-4" />
                  <span>Salvar</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Tabela de Registros */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>
        ) : despesasFiltradas.length === 0 ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400 text-sm">
            Nenhuma guia ou custo encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 uppercase text-xs border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      checked={selecionados.length === despesasFiltradas.length && despesasFiltradas.length > 0}
                      onChange={toggleSelecionarTudo}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </th>
                  <th className="p-4">Cliente / Protocolo</th>
                  <th className="p-4">Competência</th>
                  <th className="p-4">Valor</th>
                  <th className="p-4">Vencimento</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {despesasFiltradas.map((item) => {
                  const hoje = new Date();
                  hoje.setHours(0, 0, 0, 0);

                  const dataVencObj = item.data_vencimento ? new Date(item.data_vencimento + 'T00:00:00') : null;
                  
                  const vencido = dataVencObj && dataVencObj < hoje && item.status_pagamento !== 'pago';
                  const venceHoje = dataVencObj && dataVencObj.getTime() === hoje.getTime() && item.status_pagamento !== 'pago';
                  const isChecked = selecionados.includes(item.id);

                  return (
                    <tr key={item.id} className={`hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors ${isChecked ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''}`}>
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelecionarItem(item.id)}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {item.processos?.clientes?.nome_completo || 'Cliente não identificado'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Prot: {item.processos?.numero_protocolo || 'N/A'} ({item.processos?.tipo_demanda})
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-block px-2.5 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded text-xs font-semibold">
                          {item.tipo}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-gray-900 dark:text-gray-100">
                        R$ {Number(item.valor || 0).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="p-4 text-xs text-gray-600 dark:text-gray-400">
                        {item.data_vencimento ? new Date(item.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR') : 'Sem data'}
                        {vencido && (
                          <span className="flex items-center gap-1 text-red-600 font-bold mt-0.5">
                            <AlertTriangle className="w-3 h-3" /> Vencido
                          </span>
                        )}
                        {venceHoje && (
                          <span className="flex items-center gap-1 text-amber-600 font-bold mt-0.5">
                            <Clock className="w-3 h-3" /> Vence Hoje!
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => alternarStatusPagamento(item.id, item.status_pagamento)}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                            item.status_pagamento === 'pago'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 hover:bg-green-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 hover:bg-yellow-200'
                          }`}
                        >
                          {item.status_pagamento === 'pago' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                          <span className="capitalize">{item.status_pagamento}</span>
                        </button>
                      </td>
                      <td className="p-4 text-right flex items-center justify-end gap-2">
                        {venceHoje && (
                          <button
                            onClick={() => notificarCliente(item)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/40 transition-colors rounded"
                            title="Avisar cliente sobre o vencimento de hoje"
                          >
                            <Bell className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => excluirDespesa(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}