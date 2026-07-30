import React from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-colors">
        {/* Navbar busca os dados da sessão do Supabase de forma autônoma */}
        <Navbar />
        <main className="p-6 bg-slate-50 dark:bg-slate-950 transition-colors flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}