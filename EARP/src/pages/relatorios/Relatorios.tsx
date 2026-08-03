import React from 'react';
import { Cake, MessageCircle, Filter, Sparkles } from 'lucide-react';

export function Relatorios() {
  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          Ambiente de Testes: Ideias para Aniversariantes
        </h2>
        <p className="text-xs text-gray-500">
          Compare as abordagens abaixo antes de implementar na página oficial de Clientes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* IDEIA 1: BANNER / CARD DE NOTIFICAÇÃO NO TOPO */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-2.5 py-1 rounded-full">
                Ideia 1
              </span>
              <Sparkles className="w-4 h-4 text-purple-500" />
            </div>
            <h3 className="font-bold text-gray-800 dark:text-white mb-1">Banner Alerta no Topo</h3>
            <p className="text-xs text-gray-500 mb-4">
              Aparece em destaque no topo da página quando houver aniversariantes hoje.
            </p>

            {/* Simulação do Card do Topo */}
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg p-4 text-white shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Cake className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">2 Aniversariantes Hoje!</h4>
                    <p className="text-xs text-purple-100">J56 (João) e A12 (Ana)</p>
                  </div>
                </div>
                <button className="text-xs bg-white text-purple-700 font-semibold px-3 py-1.5 rounded-md hover:bg-purple-50 transition-colors">
                  Ver Lista
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500">
            <strong>Vantagem:</strong> Chama a atenção de forma imediata assim que entra na tela.
          </div>
        </div>

        {/* IDEIA 2: ABA DEDICADA DE NAVEGAÇÃO */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2.5 py-1 rounded-full">
                Ideia 2
              </span>
              <Filter className="w-4 h-4 text-blue-500" />
            </div>
            <h3 className="font-bold text-gray-800 dark:text-white mb-1">Aba "Aniversariantes"</h3>
            <p className="text-xs text-gray-500 mb-4">
              Integra-se como uma 4ª aba na navegação atual (Todos, Ativos, Inativos).
            </p>

            {/* Simulação das Abas */}
            <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
              <span className="text-xs text-gray-400 font-medium px-2 py-1">Todos (120)</span>
              <span className="text-xs text-purple-600 border-b-2 border-purple-600 font-bold px-2 py-1 flex items-center gap-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-t">
                <Cake className="w-3.5 h-3.5 text-purple-600" />
                Aniversários
                <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.2 rounded-full">2</span>
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500">
            <strong>Vantagem:</strong> Mantém a tela limpa usando o padrão visual que você já possui.
          </div>
        </div>

        {/* IDEIA 3: AÇÃO RÁPIDA DE DISPARO DE MENSAGEM */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full">
                Ideia 3
              </span>
              <MessageCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <h3 className="font-bold text-gray-800 dark:text-white mb-1">Botão WhatsApp Automático</h3>
            <p className="text-xs text-gray-500 mb-4">
              Selo na linha da tabela com botão para mensagem pré-formatada.
            </p>

            {/* Simulação de Linha na Tabela */}
            <div className="border border-gray-100 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-700/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-2 py-1 rounded">
                  J56
                </span>
                <div>
                  <p className="text-xs font-medium text-gray-800 dark:text-white">João da Silva</p>
                  <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
                    <Cake className="w-3 h-3" /> Hoje!
                  </p>
                </div>
              </div>

              <button className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1.5 rounded-md transition-colors">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Parabenizar</span>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500">
            <strong>Vantagem:</strong> Um clique abre o WhatsApp com o texto de parabéns pronto.
          </div>
        </div>

      </div>
    </div>
  );
}