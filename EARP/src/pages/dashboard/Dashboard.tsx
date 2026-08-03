import React from 'react';
import { LayoutGrid, HardHat } from 'lucide-react';

export function Dashboard() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/50 rounded-full flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
        <HardHat className="w-8 h-8 animate-bounce" />
      </div>

      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
        Painel Dashboard em Construção
      </h2>

      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
        Estamos preparando os indicadores e gráficos do seu ERP. Em breve você terá uma visão completa dos processos, clientes e financeiro aqui.
      </p>

      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium">
        <LayoutGrid className="w-3.5 h-3.5" />
        <span>Advocacia ERP v1.0</span>
      </div>
    </div>
  );
}