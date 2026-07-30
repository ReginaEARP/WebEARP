import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { 
  X, 
  Loader2, 
  User, 
  MessageCircle, 
  MapPin, 
  FileText
} from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteId?: string | null;
  onSuccess: () => void;
}

const initialFormState = {
  matricula: '',
  nome_completo: '',
  cpf_cnpj: '',
  contato_whatsapp: '',
  contato_secundario: '',
  email: '',
  senha_gov: '',
  tipo_pessoa: 'FISICA',
  rg_ie: '',
  sexo: '',
  data_nascimento: '',
  estado_civil: '',
  profissao: '',
  nome_mae: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  origem_indicacao: '',
  observacoes: '',
  ativo: true,
};

export function ModalCadastroEdicaoClientes({ isOpen, onClose, clienteId, onSuccess }: ModalProps) {
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  // 1. Carrega os dados se for edição, ou limpa se for novo cadastro
  useEffect(() => {
    if (!isOpen) return;

    const carregarDados = async () => {
      setLoading(true);

      try {
        if (clienteId) {
          const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .eq('id', clienteId)
            .single();

          if (error) throw error;

          if (data) {
            setFormData({
              matricula: data.matricula || '',
              nome_completo: data.nome_completo || '',
              cpf_cnpj: data.cpf_cnpj || '',
              contato_whatsapp: data.contato_whatsapp || '',
              contato_secundario: data.contato_secundario || '',
              email: data.email || '',
              senha_gov: data.senha_gov || '',
              tipo_pessoa: data.tipo_pessoa || 'FISICA',
              rg_ie: data.rg_ie || '',
              sexo: data.sexo || '',
              data_nascimento: data.data_nascimento ? data.data_nascimento.split('T')[0] : '',
              estado_civil: data.estado_civil || '',
              profissao: data.profissao || '',
              nome_mae: data.nome_mae || '',
              cep: data.cep || '',
              logradouro: data.logradouro || '',
              numero: data.numero || '',
              complemento: data.complemento || '',
              bairro: data.bairro || '',
              cidade: data.cidade || '',
              estado: data.estado || '',
              origem_indicacao: data.origem_indicacao || '',
              observacoes: data.observacoes || '',
              ativo: data.ativo ?? true,
            });
          }
        } else {
          setFormData(initialFormState);
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        alert('Erro ao carregar dados: ' + errorMessage);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [isOpen, clienteId]);

  // 2. Atualiza a matrícula dinamicamente com base na primeira letra do Nome Completo
  useEffect(() => {
    // Não altera matrícula se for edição de cliente existente ou se a tela não estiver aberta
    if (!isOpen || clienteId) return;

    const nomeLimpo = formData.nome_completo.trim();
    if (!nomeLimpo) {
      setFormData(prev => ({ ...prev, matricula: '' }));
      return;
    }

    const primeiraLetra = nomeLimpo.charAt(0).toUpperCase();

    // Filtra para garantir que é uma letra A-Z
    if (!/[A-Z]/.test(primeiraLetra)) return;

    const buscarProximaMatricula = async () => {
      try {
        const { data: proximaMatricula, error: rpcError } = await supabase.rpc('obter_proxima_matricula', { 
          p_letra: primeiraLetra 
        });

        if (!rpcError && proximaMatricula) {
          setFormData(prev => ({ ...prev, matricula: proximaMatricula }));
        } else {
          setFormData(prev => ({ ...prev, matricula: `${primeiraLetra}1` }));
        }
      } catch (e) {
        console.error('Erro ao buscar matrícula:', e);
      }
    };

    // Debounce leve para evitar chamadas excessivas ao banco enquanto digita
    const timer = setTimeout(() => {
      buscarProximaMatricula();
    }, 300);

    return () => clearTimeout(timer);
  }, [formData.nome_completo, isOpen, clienteId]);

  const handleBuscarCep = async (cepRaw: string) => {
    const cep = cepRaw.replace(/\D/g, '');
    if (cep.length !== 8) return;

    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();

      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          logradouro: data.logradouro || prev.logradouro,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          estado: data.uf || prev.estado,
        }));
      }
    } catch (e) {
      console.error('Erro ao buscar CEP:', e);
    } finally {
      setLoadingCep(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...formData,
      sexo: formData.sexo || null,
      estado_civil: formData.estado_civil || null,
      data_nascimento: formData.data_nascimento || null,
    };

    try {
      if (clienteId) {
        const { error } = await supabase
          .from('clientes')
          .update(payload)
          .eq('id', clienteId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('clientes')
          .insert([payload]);

        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao processar solicitação';
      alert('Erro ao salvar cliente: ' + errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-lg">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <span>{clienteId ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}</span>
                {formData.matricula && (
                  <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 text-xs px-2 py-0.5 rounded font-mono font-bold">
                    {formData.matricula}
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-500">
                {clienteId ? 'Atualize as informações do cliente abaixo.' : 'Preencha os dados do novo cliente no sistema.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="text-xs text-gray-500">Carregando dados...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
            
            {/* SEÇÃO 1: DADOS PESSOAIS */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-1 border-b border-gray-200 dark:border-gray-700 text-blue-600 font-semibold">
                <User className="w-4 h-4" />
                <span className="uppercase text-xs tracking-wider">Dados Pessoais</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome_completo}
                    onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ex: João da Silva"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    CPF / CNPJ *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cpf_cnpj}
                    onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="000.000.000-00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    RG / Inscrição Estadual
                  </label>
                  <input
                    type="text"
                    value={formData.rg_ie}
                    onChange={(e) => setFormData({ ...formData, rg_ie: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={formData.data_nascimento}
                    onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Sexo
                  </label>
                  <select
                    value={formData.sexo}
                    onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Escolha...</option>
                    <option value="MASCULINO">Masculino</option>
                    <option value="FEMININO">Feminino</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Estado Civil
                  </label>
                  <select
                    value={formData.estado_civil}
                    onChange={(e) => setFormData({ ...formData, estado_civil: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Selecione...</option>
                    <option value="SOLTEIRO">Solteiro(a)</option>
                    <option value="CASADO">Casado(a)</option>
                    <option value="DIVORCIADO">Divorciado(a)</option>
                    <option value="VIUVO">Viúvo(a)</option>
                    <option value="UNIAO_ESTAVEL">União Estável</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Profissão
                  </label>
                  <input
                    type="text"
                    value={formData.profissao}
                    onChange={(e) => setFormData({ ...formData, profissao: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Nome da Mãe
                  </label>
                  <input
                    type="text"
                    value={formData.nome_mae}
                    onChange={(e) => setFormData({ ...formData, nome_mae: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: CONTATO E ACESSO GOV */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-1 border-b border-gray-200 dark:border-gray-700 text-blue-600 font-semibold">
                <MessageCircle className="w-4 h-4" />
                <span className="uppercase text-xs tracking-wider">Contato e Acesso GOV</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    WhatsApp / Telefone Principal *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contato_whatsapp}
                    onChange={(e) => setFormData({ ...formData, contato_whatsapp: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="(87) 99999-0000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Contato Secundário
                  </label>
                  <input
                    type="text"
                    value={formData.contato_secundario}
                    onChange={(e) => setFormData({ ...formData, contato_secundario: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Fixo / Recado"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="cliente@email.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Senha GOV.br
                  </label>
                  <input
                    type="text"
                    value={formData.senha_gov}
                    onChange={(e) => setFormData({ ...formData, senha_gov: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    placeholder="Senha do Gov"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Origem / Indicação
                  </label>
                  <input
                    type="text"
                    value={formData.origem_indicacao}
                    onChange={(e) => setFormData({ ...formData, origem_indicacao: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ex: Instagram / Amigo"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Status no Sistema
                  </label>
                  <select
                    value={formData.ativo ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.value === 'true' })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SEÇÃO 3: ENDEREÇO */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-1 border-b border-gray-200 dark:border-gray-700 text-blue-600 font-semibold">
                <MapPin className="w-4 h-4" />
                <span className="uppercase text-xs tracking-wider">Endereço</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    CEP
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.cep}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, cep: val });
                        handleBuscarCep(val);
                      }}
                      className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="56200-000"
                    />
                    {loadingCep && (
                      <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-2.5 text-blue-600" />
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Rua / Logradouro
                  </label>
                  <input
                    type="text"
                    value={formData.logradouro}
                    onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Número
                  </label>
                  <input
                    type="text"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Complemento
                  </label>
                  <input
                    type="text"
                    value={formData.complemento}
                    onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Apto, Sala, Casa..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={formData.bairro}
                    onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Estado (UF)
                  </label>
                  <input
                    type="text"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>

            {/* SEÇÃO 4: OBSERVAÇÕES */}
            <div>
              <div className="flex items-center gap-2 mb-2 text-blue-600 font-semibold">
                <FileText className="w-4 h-4" />
                <span className="uppercase text-xs tracking-wider">Observações Internas</span>
              </div>
              <textarea
                rows={3}
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                className="w-full p-3 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                placeholder="Anotações importantes sobre o cliente..."
              />
            </div>

            {/* Rodapé fixo do modal com os botões */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{clienteId ? 'Salvar Alterações' : 'Cadastrar Cliente'}</span>
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}