import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Plus, Edit2, Trash2, Loader2, Settings, Stethoscope, Building2 } from 'lucide-react';

interface ConfiguracoesProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

interface CadastroGeral {
  id: string;
  categoria: string;
  nome: string;
  ativo: boolean;
}

export function Configuracoes({ darkMode, setDarkMode }: ConfiguracoesProps) {
  // Estados para a gestão de Cadastros Gerais (Aba padrão: ESPECIALIDADE)
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('ESPECIALIDADE');
  const [itens, setItens] = useState<CadastroGeral[]>([]);
  const [loadingItens, setLoadingItens] = useState(false);

  // Estados do Modal de Criação / Edição de Cadastros
  const [modalOpen, setModalOpen] = useState(false);
  const [itemEmEdicao, setItemEmEdicao] = useState<CadastroGeral | null>(null);
  const [nomeInput, setNomeInput] = useState('');
  const [ativoInput, setAtivoInput] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const carregarItens = async () => {
    setLoadingItens(true);
    try {
      const { data, error } = await supabase
        .from('cadastros_gerais')
        .select('*')
        .eq('categoria', categoriaSelecionada)
        .order('nome', { ascending: true });

      if (error) throw error;
      setItens(data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('Erro ao carregar cadastros gerais:', msg);
    } finally {
      setLoadingItens(false);
    }
  };

  useEffect(() => {
    carregarItens();
  }, [categoriaSelecionada]);

  const abrirModalNovo = () => {
    setItemEmEdicao(null);
    setNomeInput('');
    setAtivoInput(true);
    setModalOpen(true);
  };

  const abrirModalEditar = (item: CadastroGeral) => {
    setItemEmEdicao(item);
    setNomeInput(item.nome);
    setAtivoInput(item.ativo);
    setModalOpen(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeInput.trim()) return;

    setSalvando(true);
    try {
      if (itemEmEdicao) {
        // Atualizar registro existente
        const { error } = await supabase
          .from('cadastros_gerais')
          .update({ nome: nomeInput.trim(), ativo: ativoInput })
          .eq('id', itemEmEdicao.id);

        if (error) throw error;
      } else {
        // Inserir novo registro
        const { error } = await supabase
          .from('cadastros_gerais')
          .insert([{ categoria: categoriaSelecionada, nome: nomeInput.trim(), ativo: ativoInput }]);

        if (error) throw error;
      }

      setModalOpen(false);
      carregarItens();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar';
      alert('Erro ao salvar: ' + msg);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (id: string) => {
    if (!confirm('Deseja realmente excluir este registro?')) return;

    try {
      const { error } = await supabase
        .from('cadastros_gerais')
        .delete()
        .eq('id', id);

      if (error) throw error;
      carregarItens();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir';
      alert('Erro ao excluir: ' + msg);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Bloco de Aparência (Modo Escuro) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors">
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-medium text-slate-800 dark:text-white">
              Aparência
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Escolha entre o tema claro e o tema escuro para a interface do sistema.
            </p>
          </div>

          {/* Linha da opção com o Switch Deslizante */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              {/* Ícone dinâmico (Sol / Lua) */}
              {darkMode ? (
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Modo Escuro
              </span>
            </div>

            {/* Botão Switch Deslizante */}
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                darkMode ? 'bg-blue-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  darkMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Bloco de Central de Ajustes (Cadastros Gerais) com Abas */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-base font-medium text-slate-800 dark:text-white">
                Cadastros Gerais & Especialidades
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Gerencie os itens auxiliares exibidos nos formulários do sistema.
              </p>
            </div>
          </div>
          
          <button
            onClick={abrirModalNovo}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Item</span>
          </button>
        </div>

        {/* Sistema de Abas Superiores */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
          <button
            onClick={() => setCategoriaSelecionada('ESPECIALIDADE')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              categoriaSelecionada === 'ESPECIALIDADE'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Especialidades Médicas</span>
          </button>

          <button
            onClick={() => setCategoriaSelecionada('ESCRITORIO')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              categoriaSelecionada === 'ESCRITORIO'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Escritórios / Filiais</span>
          </button>
        </div>

        {/* Tabela de Listagem */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {loadingItens ? (
            <div className="p-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-4 font-medium">Nome</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {itens.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-slate-500 dark:text-slate-400">
                      Nenhum registro encontrado nesta categoria.
                    </td>
                  </tr>
                ) : (
                  itens.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{item.nome}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                          item.ativo 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}>
                          {item.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-1">
                        <button
                          onClick={() => abrirModalEditar(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors inline-flex items-center"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExcluir(item.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors inline-flex items-center"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de Criação / Edição de Registro */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white text-base">
              {itemEmEdicao ? 'Editar Registro' : 'Novo Registro'}
            </h3>

            <form onSubmit={handleSalvar} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={nomeInput}
                  onChange={(e) => setNomeInput(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder={categoriaSelecionada === 'ESPECIALIDADE' ? 'Ex: Cardiologia' : 'Ex: Escritório Central'}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Status
                </label>
                <select
                  value={ativoInput ? 'true' : 'false'}
                  onChange={(e) => setAtivoInput(e.target.value === 'true')}
                  className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-2 disabled:opacity-50 transition-colors"
                >
                  {salvando && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Salvar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}