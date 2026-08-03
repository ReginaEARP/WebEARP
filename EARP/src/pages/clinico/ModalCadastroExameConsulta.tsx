import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Loader2 } from 'lucide-react';

interface ModalCadastroExameConsultaProps {
  isOpen: boolean;
  onClose: () => void;
  onSucesso: () => void;
  processos: any[];
  clientes: any[];
  registroParaEditar?: any | null;
}

export function ModalCadastroExameConsulta({
  isOpen,
  onClose,
  onSucesso,
  processos,
  clientes,
  registroParaEditar = null,
}: ModalCadastroExameConsultaProps) {
  const [saving, setSaving] = useState(false);
  const [tipoVinculo, setTipoVinculo] = useState<'processo' | 'cliente'>('processo');
  const [processoId, setProcessoId] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [tipoItem, setTipoItem] = useState('Consulta');
  const [valor, setValor] = useState('');
  const [dataAgenda, setDataAgenda] = useState('');
  const [dataRetorno, setDataRetorno] = useState(''); // <--- Novo estado para data de retorno
  const [linkComprovante, setLinkComprovante] = useState('');

  useEffect(() => {
    if (registroParaEditar) {
      if (registroParaEditar.processo_id) {
        setTipoVinculo('processo');
        setProcessoId(registroParaEditar.processo_id);
        setClienteId('');
      } else {
        setTipoVinculo('cliente');
        setClienteId(registroParaEditar.cliente_id || '');
        setProcessoId('');
      }
      setTipoItem(registroParaEditar.tipo || 'Consulta');
      setValor(registroParaEditar.valor ? String(registroParaEditar.valor).replace('.', ',') : '');
      setDataAgenda(registroParaEditar.data_agenda || '');
      setDataRetorno(registroParaEditar.data_retorno || ''); // <--- Carrega a data de retorno ao editar
      setLinkComprovante(registroParaEditar.comprovante_url || '');
    } else {
      setTipoVinculo('processo');
      setProcessoId('');
      setClienteId('');
      setTipoItem('Consulta');
      setValor('');
      setDataAgenda('');
      setDataRetorno(''); // <--- Limpa a data de retorno ao criar novo
      setLinkComprovante('');
    }
  }, [registroParaEditar, isOpen]);

  if (!isOpen) return null;

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tipoVinculo === 'processo' && !processoId) {
      alert('Por favor, selecione o processo.');
      return;
    }
    if (tipoVinculo === 'cliente' && !clienteId) {
      alert('Por favor, selecione o cliente.');
      return;
    }
    if (!valor) {
      alert('Por favor, informe o valor.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        processo_id: tipoVinculo === 'processo' ? processoId : null,
        cliente_id: tipoVinculo === 'cliente' ? clienteId : null,
        tipo: tipoItem,
        valor: parseFloat(valor.replace(',', '.')) || 0,
        data_agenda: dataAgenda || null,
        data_retorno: dataRetorno || null, // <--- Incluído no payload enviado ao Supabase
        comprovante_url: linkComprovante || null,
      };

      if (registroParaEditar?.id) {
        const { error } = await supabase
          .from('consultas_exames')
          .update(payload)
          .eq('id', registroParaEditar.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('consultas_exames')
          .insert([payload]);

        if (error) throw error;
      }
      
      onSucesso();
      onClose();
    } catch (err: any) {
      alert('Erro ao salvar registro: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
            {registroParaEditar ? 'Editar Agendamento / Guia' : 'Novo Agendamento / Guia'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-sm">✕</button>
        </div>

        <form onSubmit={handleSalvar} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Vincular a:</label>
            <div className="flex gap-4 mb-3">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input 
                  type="radio" 
                  name="vinculo" 
                  checked={tipoVinculo === 'processo'} 
                  onChange={() => setTipoVinculo('processo')} 
                  className="text-emerald-600"
                />
                Processo Existente
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input 
                  type="radio" 
                  name="vinculo" 
                  checked={tipoVinculo === 'cliente'} 
                  onChange={() => setTipoVinculo('cliente')} 
                  className="text-emerald-600"
                />
                Cliente Avulso (Sem Processo)
              </label>
            </div>

            {tipoVinculo === 'processo' ? (
              <select
                value={processoId}
                onChange={(e) => setProcessoId(e.target.value)}
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
            ) : (
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100"
              >
                <option value="">Selecione o cliente...</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nome_completo}</option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Tipo / Categoria</label>
              <select
                value={tipoItem}
                onChange={(e) => setTipoItem(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100"
              >
                <option value="Consulta">Consulta</option>
                <option value="Exame">Exame</option>
                <option value="Retorno">Retorno</option>
                <option value="Procedimento">Procedimento</option>
              </select>
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
          </div>

          {/* Grid organizado lado a lado para Data da Agenda e Data de Retorno */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Data da Agenda / Consulta</label>
              <input
                type="date"
                value={dataAgenda}
                onChange={(e) => setDataAgenda(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Data de Retorno (Opcional)</label>
              <input
                type="date"
                value={dataRetorno}
                onChange={(e) => setDataRetorno(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 bg-white hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-sm"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Salvar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}