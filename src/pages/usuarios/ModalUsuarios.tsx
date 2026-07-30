import React, { useState, useEffect } from 'react';
import { X, User, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { UsuarioData } from './Usuarios';

interface ModalUsuariosProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  usuarioEdicao?: UsuarioData | null;
}

const SENHA_PADRAO = '123456';

export function ModalUsuarios({ isOpen, onClose, onSuccess, usuarioEdicao }: ModalUsuariosProps) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [status, setStatus] = useState('ativo');
  const [role, setRole] = useState<'admin' | 'gerente' | 'operador' | 'estagiario'>('operador');
  const [senha, setSenha] = useState(SENHA_PADRAO);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  useEffect(() => {
    if (usuarioEdicao) {
      setNome(usuarioEdicao.nome || '');
      setEmail(usuarioEdicao.email || '');
      setCpf(usuarioEdicao.cpf || '');
      setTelefone(usuarioEdicao.telefone || '');
      setStatus(usuarioEdicao.status || 'ativo');
      setRole(usuarioEdicao.role || 'operador');
      setSenha('');
    } else {
      setNome('');
      setEmail('');
      setCpf('');
      setTelefone('');
      setStatus('ativo');
      setRole('operador');
      setSenha(SENHA_PADRAO);
    }
    setMensagem(null);
  }, [usuarioEdicao, isOpen]);

  if (!isOpen) return null;

  // Formatação em tempo real do CPF
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    setCpf(v);
  };

  // Formatação em tempo real do Telefone
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
    v = v.replace(/(\d{5})(\d)/, '$1-$2');
    setTelefone(v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem(null);
    setLoading(true);

    try {
      if (usuarioEdicao?.id) {
        // EDIÇÃO DE USUÁRIO EXISTENTE
        const { error } = await supabase
          .from('perfis')
          .update({
            nome,
            cpf,
            telefone,
            status,
            role,
          })
          .eq('id', usuarioEdicao.id);

        if (error) throw error;
        setMensagem({ tipo: 'sucesso', texto: 'Usuário atualizado com sucesso!' });
      } else {
        // CADASTRO DE NOVO USUÁRIO
        const senhaParaCadastro = senha || SENHA_PADRAO;

        if (senhaParaCadastro.length < 6) {
          setMensagem({ tipo: 'erro', texto: 'A senha inicial deve ter no mínimo 6 caracteres.' });
          setLoading(false);
          return;
        }

        // 1. Cria a conta no Auth do Supabase
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password: senhaParaCadastro,
          options: {
            data: { nome, cpf, telefone, role },
          },
        });

        if (authError) throw authError;

        // 2. Insere/Atualiza na tabela 'perfis'
        if (authData.user) {
          const { error: perfilError } = await supabase
            .from('perfis')
            .upsert({
              id: authData.user.id,
              nome,
              email,
              cpf,
              telefone,
              status,
              role,
            });

          if (perfilError) throw perfilError;
        }

        setMensagem({ tipo: 'sucesso', texto: 'Usuário cadastrado com sucesso!' });
      }

      // Fecha o modal e atualiza a lista após confirmação
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);

    } catch (err: any) {
      setMensagem({
        tipo: 'erro',
        texto: err.message || 'Erro ao salvar usuário.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-xl relative animate-in zoom-in-95">
        
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Título do Modal */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-blue-50 dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-xl">
            <User size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {usuarioEdicao ? 'Editar Usuário' : 'Novo Usuário'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {usuarioEdicao ? 'Altere as informações do perfil abaixo' : 'Preencha os dados para criar uma nova conta'}
            </p>
          </div>
        </div>

        {/* Mensagem de Feedback */}
        {mensagem && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
            mensagem.tipo === 'sucesso' 
              ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400 border border-green-200 dark:border-green-800' 
              : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800'
          }`}>
            {mensagem.tipo === 'sucesso' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{mensagem.texto}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Nome Completo */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Ex: Maria Silva"
              />
            </div>

            {/* E-mail */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                E-mail *
              </label>
              <input
                type="email"
                required
                disabled={!!usuarioEdicao}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="maria@empresa.com"
              />
            </div>

            {/* CPF */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                CPF
              </label>
              <input
                type="text"
                value={cpf}
                onChange={handleCpfChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="000.000.000-00"
              />
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Telefone / Celular
              </label>
              <input
                type="text"
                value={telefone}
                onChange={handleTelefoneChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="(00) 00000-0000"
              />
            </div>

            {/* Perfil (Role) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Perfil / Cargo *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="operador">Operador</option>
                <option value="estagiario">Estagiário</option>
                <option value="gerente">Gerente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>

            {/* Senha Inicial Padrão (Informativo apenas na criação) */}
            {!usuarioEdicao && (
              <div className="sm:col-span-2 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-xl p-3 flex items-center gap-3 text-blue-800 dark:text-blue-300">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                  <KeyRound size={18} />
                </div>
                <div className="text-xs space-y-0.5">
                  <p className="font-semibold">Senha Padrão de Primeiro Acesso</p>
                  <p className="text-blue-600 dark:text-blue-400">
                    A conta será criada com a senha: <code className="bg-blue-100 dark:bg-blue-900/80 px-1.5 py-0.5 rounded font-mono font-bold text-blue-900 dark:text-blue-100">{SENHA_PADRAO}</code>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}