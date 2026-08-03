import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { X, Loader2, Handshake, Plus } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  parceiroId?: string | null;
  onSuccess: () => void;
}

interface ItemCadastroGeral {
  id: string;
  nome: string;
}

const initialFormState = {
  nome: '',
  tipo_parceiro: 'MEDICO',
  cpf_cnpj: '',
  telefone: '',
  email: '',
  crm: '',
  uf_crm: '',
  especialidade: '',
  tipo_remuneracao: 'PORCENTAGEM',
  valor_remuneracao: 0,
  porcentagem_comissao: 0,
  chave_pix: '',
  status: 'ATIVO',
};

export function ModalCadastroParceiro({ isOpen, onClose, parceiroId, onSuccess }: ModalProps) {
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estados para buscar e gerenciar especialidades da tabela 'cadastros_gerais'
  const [especialidades, setEspecialidades] = useState<ItemCadastroGeral[]>([]);
  const [showAddEspecialidade, setShowAddEspecialidade] = useState(false);
  const [novaEspecialidade, setNovaEspecialidade] = useState('');
  const [savingEspecialidade, setSavingEspecialidade] = useState(false);

  // Função para carregar as especialidades cadastradas
  const carregarEspecialidades = async () => {
    try {
      const { data, error } = await supabase
        .from('cadastros_gerais')
        .select('id, nome')
        .eq('categoria', 'ESPECIALIDADE')
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (error) throw error;
      setEspecialidades(data || []);
    } catch (err: unknown) {
      console.error('Erro ao buscar especialidades:', err);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    carregarEspecialidades();

    if (parceiroId) {
      const carregarParceiro = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('parceiros')
            .select('*')
            .eq('id', parceiroId)
            .single();

          if (error) throw error;

          if (data) {
            setFormData({
              nome: data.nome || '',
              tipo_parceiro: data.tipo || 'MEDICO',
              cpf_cnpj: data.cpf_cnpj || '',
              telefone: data.telefone || '',
              email: data.email || '',
              crm: data.crm || '',
              uf_crm: data.uf_crm || '',
              especialidade: data.especialidade || '',
              tipo_remuneracao: data.tipo_remuneracao || 'PORCENTAGEM',
              valor_remuneracao: data.valor_remuneracao || 0,
              porcentagem_comissao: data.porcentagem_comissao || 0,
              chave_pix: data.chave_pix || '',
              status: data.status || 'ATIVO',
            });
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Erro desconhecido';
          alert('Erro ao buscar parceiro: ' + msg);
        } finally {
          setLoading(false);
        }
      };

      carregarParceiro();
    } else {
      setFormData(initialFormState);
    }
  }, [isOpen, parceiroId]);

  // Função para salvar nova especialidade rápida pelo botão '+'
  const handleCadastrarEspecialidade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaEspecialidade.trim()) return;

    setSavingEspecialidade(true);
    try {
      const nomeFormatado = novaEspecialidade.trim();

      const { error } = await supabase
        .from('cadastros_gerais')
        .insert([{ categoria: 'ESPECIALIDADE', nome: nomeFormatado, ativo: true }]);

      if (error) throw error;

      await carregarEspecialidades();
      setFormData((prev) => ({ ...prev, especialidade: nomeFormatado }));
      setNovaEspecialidade('');
      setShowAddEspecialidade(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar';
      alert('Erro ao cadastrar especialidade: ' + msg);
    } finally {
      setSavingEspecialidade(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      nome: formData.nome,
      tipo: formData.tipo_parceiro,
      cpf_cnpj: formData.cpf_cnpj || null,
      telefone: formData.telefone,
      email: formData.email || null,
      crm: formData.crm || null,
      uf_crm: formData.uf_crm || null,
      especialidade: formData.especialidade || null,
      tipo_remuneracao: formData.tipo_remuneracao,
      valor_remuneracao: Number(formData.valor_remuneracao) || 0,
      porcentagem_comissao: Number(formData.porcentagem_comissao) || 0,
      chave_pix: formData.chave_pix || null,
      status: formData.status,
    };

    try {
      if (parceiroId) {
        const { error } = await supabase
          .from('parceiros')
          .update(payload)
          .eq('id', parceiroId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('parceiros')
          .insert([payload]);

        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar';
      alert('Erro do Supabase: ' + msg);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden relative">
        
        {/* Modal Rápido para Adicionar Especialidade (+) */}
        {showAddEspecialidade && (
          <div className="absolute inset-0 z-10 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-gray-800 dark:text-white text-sm">
                  Nova Especialidade
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddEspecialidade(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCadastrarEspecialidade} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome da Especialidade *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={novaEspecialidade}
                    onChange={(e) => setNovaEspecialidade(e.target.value)}
                    placeholder="Ex: Neurologia"
                    className="w-full p-2 text-sm border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddEspecialidade(false)}
                    className="px-3 py-1.5 text-xs border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingEspecialidade}
                    className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 disabled:opacity-50"
                  >
                    {savingEspecialidade && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>Salvar</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Handshake className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-gray-800 dark:text-white">
              {parceiroId ? 'Editar Parceiro' : 'Novo Parceiro'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo do Formulário */}
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
            <p className="text-xs text-gray-500 mt-2">Carregando dados...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-sm">
            
            {/* Tipo e Nome */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Tipo *</label>
                <select
                  value={formData.tipo_parceiro}
                  onChange={(e) => setFormData({ ...formData, tipo_parceiro: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                >
                  <option value="MEDICO">Médico</option>
                  <option value="CLINICA">Clínica</option>
                  <option value="INDICADOR">Indicador</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1">Nome *</label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                  placeholder="Nome do parceiro ou clínica"
                />
              </div>
            </div>

            {/* Documentos e Contato */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">CPF / CNPJ</label>
                <input
                  type="text"
                  value={formData.cpf_cnpj}
                  onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Telefone *</label>
                <input
                  type="text"
                  required
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">E-mail</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                />
              </div>
            </div>

            {/* Dados Médicos */}
            {formData.tipo_parceiro === 'MEDICO' && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-3 border border-emerald-200 dark:border-emerald-800">
                <div>
                  <label className="block text-xs font-medium mb-1">CRM</label>
                  <input
                    type="text"
                    value={formData.crm}
                    onChange={(e) => setFormData({ ...formData, crm: e.target.value })}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">UF CRM</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={formData.uf_crm}
                    onChange={(e) => setFormData({ ...formData, uf_crm: e.target.value.toUpperCase() })}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 uppercase"
                  />
                </div>

                {/* Especialidade com Select + Botão + */}
                <div>
                  <label className="block text-xs font-medium mb-1">Especialidade</label>
                  <div className="flex gap-1">
                    <select
                      value={formData.especialidade}
                      onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
                      className="w-full p-2 border rounded bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                    >
                      <option value="">Selecione...</option>
                      {especialidades.map((esp) => (
                        <option key={esp.id} value={esp.nome}>
                          {esp.nome}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      title="Adicionar Especialidade"
                      onClick={() => setShowAddEspecialidade(true)}
                      className="px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Remuneração e Status */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Tipo Remuneração</label>
                <select
                  value={formData.tipo_remuneracao}
                  onChange={(e) => setFormData({ ...formData, tipo_remuneracao: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                >
                  <option value="PORCENTAGEM">Porcentagem (%)</option>
                  <option value="VALOR_FIXO">Valor Fixo (R$)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Comissão (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.porcentagem_comissao}
                  onChange={(e) => setFormData({ ...formData, porcentagem_comissao: Number(e.target.value) })}
                  className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Valor Fixo (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.valor_remuneracao}
                  onChange={(e) => setFormData({ ...formData, valor_remuneracao: Number(e.target.value) })}
                  className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                >
                  <option value="ATIVO">Ativo</option>
                  <option value="INATIVO">Inativo</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Chave PIX</label>
              <input
                type="text"
                value={formData.chave_pix}
                onChange={(e) => setFormData({ ...formData, chave_pix: e.target.value })}
                className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                placeholder="Informe a chave PIX do parceiro"
              />
            </div>

            {/* Botoes */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Salvar</span>
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}