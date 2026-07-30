import React from 'react';

interface ConfiguracoesProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

export function Configuracoes({ darkMode, setDarkMode }: ConfiguracoesProps) {
  return (
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
  );
}