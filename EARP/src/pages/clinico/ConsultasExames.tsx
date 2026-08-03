import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Loader2, Plus, CheckCircle2, Clock, Trash2, Search, PlayCircle, Archive, Pencil, Calendar, Send } from 'lucide-react';
import { ModalCadastroExameConsulta } from './ModalCadastroExameConsulta';
import { ModalConsultaAndamento } from './ModalHistoricoConsulta';

export function CentralConsultasExamesPage() {
  const [loading, setLoading] = useState(false);
  const [lancandoLote, setLancandoLote] = useState(false);
  
  const [registros, setRegistros] = useState<any[]>([]);
  const [processos, setProcessos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  
  // Estados para Seleção Múltipla e Lote
  const [selecionados, setSelecionados] = useState<string[]>([]);
  
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('em_andamento');

  const [showForm, setShowForm] = useState(false);
  const [itemParaEditar, setItemParaEditar] = useState<any | null>(null);

  // Estados para o Modal de Andamento/Comparecimento
  const [isModalAndamentoOpen, setIsModalAndamentoOpen] = useState(false);
  const [consultaSelecionadaId, setConsultaSelecionadaId] = useState<string | null>(null);
  const [protocoloSelecionado, setProtocoloSelecionado] = useState<string | undefined>(undefined);

  useEffect(() => {
    carregarDados();

    // Ouve o evento disparado pelo modal para atualizar a tela na mesma hora
    const handleAtualizarLista = () => {
      carregarDados();
    };

    window.addEventListener('consultaAtualizada', handleAtualizarLista);
    return () => {
      window.removeEventListener('consultaAtualizada', handleAtualizarLista);
    };
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const { data: resProcessos, error: errProc } = await supabase
        .from('processos')
        .select(`
          id,
          numero_protocolo,
          tipo_demanda,
          clientes (
            id,
            nome_completo,
            cpf_cnpj
          )
        `)
        .order('created_at', { ascending: false });

      if (errProc) throw errProc;
      if (resProcessos) setProcessos(resProcessos);

      const { data: resClientes, error: errCli } = await supabase
        .from('clientes')
        .select('id, nome_completo, cpf_cnpj')
        .order('nome_completo', { ascending: true });

      if (errCli) throw errCli;
      if (resClientes) setClientes(resClientes);

      const { data: resRegistros, error: errReg } = await supabase
        .from('consultas_exames')
        .select(`
          *,
          processos (
            numero_protocolo,
            tipo_demanda,
            clientes (
              nome_completo,
              cpf_cnpj
            )
          ),
          clientes (
            nome_completo,
            cpf_cnpj
          ),
          consulta_historico (
            nova_data,
            data_movimentacao,
            status_movimentacao
          )
        `)
        .order('data_agenda', { ascending: true });

      if (errReg) throw errReg;
      
      if (resRegistros) {
        const registrosTratados = resRegistros.map((item: any) => {
          const historicosComData = item.consulta_historico 
            ? item.consulta_historico.filter((h: any) => h.nova_data) 
            : [];
          
          historicosComData.sort((a: any, b: any) => new Date(b.data_movimentacao).getTime() - new Date(a.data_movimentacao).getTime());

          const ultimaNovaData = historicosComData.length > 0 ? historicosComData[0].nova_data : null;

          return {
            ...item,
            data_retorno_calculada: ultimaNovaData
          };
        });

        setRegistros(registrosTratados);
      }
      
      setSelecionados([]);

    } catch (err: any) {
      console.error('Erro ao carregar central:', err);
      alert('Erro ao carregar dados: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const excluirRegistro = async (id: string) => {
    if (!confirm('Deseja realmente excluir este registro?')) return;
    try {
      const { error } = await supabase
        .from('consultas_exames')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setRegistros(registros.filter(r => r.id !== id));
      setSelecionados(selecionados.filter(sId => sId !== id));
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  // Funções de Seleção Múltipla
  const toggleSelecionarTudo = () => {
    if (selecionados.length === registrosFiltrados.length) {
      setSelecionados([]);
    } else {
      setSelecionados(registrosFiltrados.map(r => r.id));
    }
  };

  const toggleSelecionarItem = (id: string) => {
    if (selecionados.includes(id)) {
      setSelecionados(selecionados.filter(sId => sId !== id));
    } else {
      setSelecionados([...selecionados, id]);
    }
  };

  // Cálculo do valor total acumulado dos itens selecionados
  const valorTotalSelecionado = registros
    .filter(r => selecionados.includes(r.id))
    .reduce((acc, curr) => acc + Number(curr.valor || 0), 0);

  // Ação de Lançar para o Financeiro em Lote
  const handleLancarFinanceiro = async () => {
    if (selecionados.length === 0) return;
    
    if (!confirm(`Deseja realmente lançar ${selecionados.length} atendimento(s) selecionado(s) totalizando R$ ${valorTotalSelecionado.toFixed(2).replace('.', ',')} para o financeiro?`)) {
      return;
    }

    setLancandoLote(true);
    try {
      const itensParaLancar = registros.filter(r => selecionados.includes(r.id));

      for (const item of itensParaLancar) {
        const nomeCli = item.processos?.clientes?.nome_completo || item.clientes?.nome_completo || 'Cliente avulso';
        const prot = item.processos?.numero_protocolo || 'N/A';

        const payloadFinanceiro = {
          descricao: `Consulta/Exame (${item.tipo}) - ${nomeCli} (Prot: ${prot})`,
          valor: item.valor || 0,
          data_vencimento: item.data_agenda || null,
          tipo: 'receita', // Ajuste conforme a regra de negócio do seu financeiro (receita/despesa)
          status: 'pendente',
          referencia_id: item.id
        };

        const { error: errFin } = await supabase
          .from('financeiro') // Substitua pelo nome correto da tabela do seu financeiro, caso mude
          .insert([payloadFinanceiro]);

        if (errFin) throw errFin;
      }

      alert('Registros lançados para o financeiro com sucesso!');
      setSelecionados([]);
      await carregarDados();
    } catch (err: any) {
      alert('Erro ao lançar para o financeiro: ' + err.message);
    } finally {
      setLancandoLote(false);
    }
  };

  const countEmAndamento = registros.filter(r => r.status !== 'Compareceu' && r.status !== 'Faltou').length;
  const countConcluidas = registros.filter(r => r.status === 'Compareceu' || r.status === 'Faltou').length;
  const countArquivadas = 0;

  const registrosFiltrados = registros.filter(r => {
    const nomeCliente = r.processos?.clientes?.nome_completo || r.clientes?.nome_completo || '';
    const cpfCnpjCliente = r.processos?.clientes?.cpf_cnpj || r.clientes?.cpf_cnpj || '';
    const protocolo = r.processos?.numero_protocolo || '';
    const tipoItemStr = r.tipo || '';
    const termo = busca.toLowerCase();

    const matchBusca = nomeCliente.toLowerCase().includes(termo) || 
                       cpfCnpjCliente.toLowerCase().includes(termo) || 
                       protocolo.toLowerCase().includes(termo) || 
                       tipoItemStr.toLowerCase().includes(termo);

    let matchStatus = true;
    const statusAtual = r.status || 'Pendente';
    if (filtroStatus === 'em_andamento') {
      matchStatus = statusAtual !== 'Compareceu' && statusAtual !== 'Faltou';
    } else if (filtroStatus === 'concluidas') {
      matchStatus = statusAtual === 'Compareceu' || statusAtual === 'Faltou';
    } else if (filtroStatus === 'arquivadas') {
      matchStatus = false;
    }

    return matchBusca && matchStatus;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* PAINEL DE ACUMULADO / AÇÃO EM LOTE */}
      {selecionados.length > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
          <div>
            <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
              {selecionados.length} registro(s) selecionado(s)
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

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, CPF/CNPJ, protocolo ou tipo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          onClick={() => {
            setItemParaEditar(null);
            setShowForm(true);
          }}
          className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Consulta / Exame</span>
        </button>
      </div>

      <div className="flex items-center gap-6 border-b border-gray-200 dark:border-gray-700 text-sm">
        <button
          onClick={() => setFiltroStatus('em_andamento')}
          className={`flex items-center gap-2 pb-3 font-medium transition-colors relative ${
            filtroStatus === 'em_andamento'
              ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <PlayCircle className="w-4 h-4" />
          <span>Em andamento</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${filtroStatus === 'em_andamento' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
            {countEmAndamento}
          </span>
        </button>

        <button
          onClick={() => setFiltroStatus('concluidas')}
          className={`flex items-center gap-2 pb-3 font-medium transition-colors relative ${
            filtroStatus === 'concluidas'
              ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Concluídas</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${filtroStatus === 'concluidas' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
            {countConcluidas}
          </span>
        </button>

        <button
          onClick={() => setFiltroStatus('arquivadas')}
          className={`flex items-center gap-2 pb-3 font-medium transition-colors relative ${
            filtroStatus === 'arquivadas'
              ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>Arquivadas</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${filtroStatus === 'arquivadas' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
            {countArquivadas}
          </span>
        </button>
      </div>

      <ModalCadastroExameConsulta
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setItemParaEditar(null);
        }}
        onSucesso={carregarDados}
        processos={processos}
        clientes={clientes}
        registroParaEditar={itemParaEditar}
      />

      <ModalConsultaAndamento
        isOpen={isModalAndamentoOpen}
        onClose={() => setIsModalAndamentoOpen(false)}
        consultaId={consultaSelecionadaId}
        numeroProtocolo={protocoloSelecionado}
        onSuccess={carregarDados}
      />

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>
        ) : registrosFiltrados.length === 0 ? (
          <div className="text-center py-20 text-gray-500 text-sm">
            Nenhum registro encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm table-fixed">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 uppercase text-xs border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="p-3 w-10">
                    <input
                      type="checkbox"
                      checked={selecionados.length === registrosFiltrados.length && registrosFiltrados.length > 0}
                      onChange={toggleSelecionarTudo}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </th>
                  <th className="p-3 w-[24%]">Cliente / Processo</th>
                  <th className="p-3 w-[15%]">Tipo / Especialidade</th>
                  <th className="p-3 w-[12%]">Valor</th>
                  <th className="p-3 w-[18%]">Data da Consulta</th>
                  <th className="p-3 w-[14%]">Remarcação</th>
                  <th className="p-3 w-[10%]">Status</th>
                  <th className="p-3 text-right w-[10%]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {registrosFiltrados.map((item) => {
                  const nomeCliente = item.processos?.clientes?.nome_completo || item.clientes?.nome_completo || 'Cliente avulso';
                  const cpfCnpjCliente = item.processos?.clientes?.cpf_cnpj || item.clientes?.cpf_cnpj;
                  const protocolo = item.processos?.numero_protocolo ? `Prot: ${item.processos.numero_protocolo}` : 'Sem processo';
                  
                  const isChecked = selecionados.includes(item.id);

                  const statusAtendimento = item.status || 'Pendente';
                  const badgeStatusClass = 
                    statusAtendimento === 'Compareceu' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                    statusAtendimento === 'Faltou' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                    statusAtendimento === 'Remarcado' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300';

                  const dataAgenda = item.data_agenda;
                  const dataRemarcacao = item.data;

                  return (
                    <tr key={item.id} className={`hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors ${isChecked ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''}`}>
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelecionarItem(item.id)}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>
                      
                      <td className="p-3 truncate">
                        <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {nomeCliente}
                        </div>
                        {cpfCnpjCliente && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                            {cpfCnpjCliente}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-0.5 truncate">{protocolo}</div>
                      </td>

                      <td className="p-3 truncate">
                        <span className="inline-block px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded text-xs font-semibold truncate max-w-full">
                          {item.tipo}
                        </span>
                      </td>

                      <td className="p-3 font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap text-xs">
                        R$ {Number(item.valor || 0).toFixed(2).replace('.', ',')}
                      </td>

                      <td className="p-3 text-xs text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="text-[11px]">{dataAgenda ? new Date(dataAgenda + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informada'}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 text-gray-500 dark:text-gray-400">
                          <Calendar className="w-3 h-3 text-blue-500 shrink-0" />
                          <span className="text-[10px]">Ret: {item.data_retorno_calculada ? new Date(item.data_retorno_calculada + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informada'}</span>
                        </div>
                      </td>

                      <td className="p-3 text-xs text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-amber-600 shrink-0" />
                          <span className="text-[11px]">{dataRemarcacao ? new Date(dataRemarcacao + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</span>
                        </div>
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${badgeStatusClass}`}>
                          {statusAtendimento}
                        </span>
                      </td>

                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setConsultaSelecionadaId(item.id);
                              setProtocoloSelecionado(item.processos?.numero_protocolo);
                              setIsModalAndamentoOpen(true);
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded transition-colors"
                            title="Histórico e Controle de Atendimento / Remarcação"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>

                          <button 
                            onClick={() => {
                              setItemParaEditar(item);
                              setShowForm(true);
                            }} 
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-900 rounded transition-colors" 
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          
                          <button 
                            onClick={() => excluirRegistro(item.id)} 
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded transition-colors" 
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
    </div>
  );
}