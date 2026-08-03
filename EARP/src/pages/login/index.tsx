import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';

export function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [salvarEmail, setSalvarEmail] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const emailSalvo = localStorage.getItem('earp_remembered_email');
    if (emailSalvo) {
      setEmail(emailSalvo);
      setSalvarEmail(true);
    }
  }, []);

  // Função para lidar com a alteração do checkbox em tempo real
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const marcado = e.target.checked;
    setSalvarEmail(marcado);

    if (marcado && email.trim() !== '') {
      localStorage.setItem('earp_remembered_email', email);
    } else {
      localStorage.removeItem('earp_remembered_email');
    }
  };

  // Atualiza também no localStorage caso o usuário digite o e-mail com a caixa já marcada
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novoEmail = e.target.value;
    setEmail(novoEmail);

    if (salvarEmail) {
      if (novoEmail.trim() !== '') {
        localStorage.setItem('earp_remembered_email', novoEmail);
      } else {
        localStorage.removeItem('earp_remembered_email');
      }
    }
  };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    setErro(null);

    try {
      // 1. Tenta a autenticação nativa do Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: senha,
      });

      if (authError) {
        if (authError.message === 'Invalid login credentials') {
          setErro('E-mail ou senha incorretos.');
        } else if (authError.message === 'Email not confirmed') {
          setErro('Por favor, confirme seu e-mail antes de acessar o sistema.');
        } else {
          setErro(authError.message);
        }
        setCarregando(false);
        return;
      }

      // 2. Consulta o status na tabela 'perfis'
      if (authData?.user) {
        const { data: perfil, error: perfilError } = await supabase
          .from('perfis')
          .select('status')
          .eq('id', authData.user.id)
          .maybeSingle();

        // SE INATIVO, COM ERRO OU SEM PERFIL
        if (perfilError || !perfil || perfil.status !== 'ativo') {
          // Desloga antes de setar o erro
          await supabase.auth.signOut(); 
          
          // Mantém a mensagem fixa no estado sem recarregar
          setErro('Sua conta está inativa. Entre em contato com o suporte.');
          setCarregando(false);
          return; // INTERROMPE O FLUXO
        }
      }

      // 3. SE ESTIVER ATIVO: Garante o salvamento do e-mail e entra no sistema
      if (salvarEmail) {
        localStorage.setItem('earp_remembered_email', email);
      } else {
        localStorage.removeItem('earp_remembered_email');
      }

      // Redireciona via JS apenas quando o usuário está confirmado como ativo
      window.location.href = '/';

    } catch (err) {
      console.error('Erro ao efetuar login:', err);
      setErro('Ocorreu um erro ao validar seu acesso.');
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Sistema EARP</h2>
          <p className="text-sm text-slate-500 mt-2">Digite suas credenciais para acessar o painel</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Alerta de erro em vermelho */}
          {erro && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-xl border border-red-200 flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{erro}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={handleEmailChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Senha</label>
            <div className="relative">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                tabIndex={-1}
              >
                {mostrarSenha ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12c1.074 4.008 4.784 7 9.264 7 4.48 0 8.19-2.992 9.264-7-1.074-4.008-4.784-7-9.264-7-4.48 0-8.19 2.992-9.264 7z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={salvarEmail}
                onChange={handleCheckboxChange}
                className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 accent-slate-900 cursor-pointer"
              />
              Lembrar e-mail
            </label>
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {carregando ? 'Carregando...' : 'Acessar Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}