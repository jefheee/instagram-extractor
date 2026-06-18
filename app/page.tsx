'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';

export default function LandingPage() {
  const { t } = useLanguage();
  const [mockLogs, setMockLogs] = useState<string[]>([]);
  
  const simulationLogs = [
    '[Sistema] Initializing InstaVault Environment...',
    '[Sistema] Load configuration: config.json (Success)',
    '[Sistema] Proxy rotation service: ONLINE (142 endpoints)',
    '[stdout] Estabelecendo conexão segura com endpoint...',
    '[stdout] Handshake SSL completo.',
    '[success] Autenticação bem-sucedida: @instavault_agent_01',
    '[stdout] Iniciando varredura no alvo...',
    '[data] -> Buscando metadados do perfil: 100%',
    '[data] -> Extraindo lista de posts (Modo: Post/Reel)',
    '[success] ✓ Post extraído: ID 92837412 (Media Type: Image)',
    '[stdout] 2026-06-13_01.jpg',
    '[success] ✓ Post extraído: ID 92837415 (Media Type: Video)',
    '[stdout] 2026-06-13_02.mp4',
    '[error] ✖ Erro no download do item 92837418: Tentando novamente (1/3)...',
    '[success] ✓ Post extraído: ID 92837418 (Recuperado)',
    '[data] -> Progresso: [||||||||||          ] 50%'
  ];

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < simulationLogs.length) {
        setMockLogs(prev => {
           const newLogs = [...prev, simulationLogs[index]];
           return newLogs.length > 8 ? newLogs.slice(1) : newLogs;
        });
        index++;
      } else {
        index = 0; 
        setMockLogs([]);
      }
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="relative flex-1">
      {/* Hero Section */}
      <section className="relative min-h-[921px] flex flex-col items-center justify-center technical-grid px-gutter text-center overflow-hidden border-b border-outline-variant">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none opacity-20"></div>
        <div className="z-10 max-w-4xl pt-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-md glass-panel rounded-full border border-outline-variant">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            <span className="font-mono text-[11px] text-on-surface-variant uppercase tracking-widest">Version 2.4.0-Stable</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface mb-md">
            {t('landing.title')}
          </h1>
          <p className="text-lg text-on-surface-variant mb-xl max-w-2xl mx-auto">
            {t('landing.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-md">
            <Link 
              href="/dashboard"
              className="w-full sm:w-auto px-10 py-4 bg-primary-container text-white font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all text-center"
            >
              {t('landing.btn.dashboard')}
            </Link>
            <Link 
              href="/docs"
              className="w-full sm:w-auto px-10 py-4 border border-outline-variant text-on-surface font-bold rounded-lg hover:border-primary transition-all text-center bg-surface-container-low"
            >
              {t('landing.btn.docs')}
            </Link>
          </div>
        </div>

        {/* Dashboard Preview Mockup */}
        <div className="mt-xl w-full max-w-5xl mx-auto px-md z-10 animate-fade-in-up">
          <div className="glass-panel rounded-t-xl p-1 border-b-0 shadow-2xl">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-outline-variant bg-[#050505]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-error border border-error"></div>
                <div className="w-3 h-3 rounded-full bg-secondary border border-secondary"></div>
                <div className="w-3 h-3 rounded-full bg-primary border border-primary"></div>
              </div>
              <div className="ml-6 px-4 py-1 bg-surface-container-high rounded text-xs text-on-surface-variant font-mono">instavault.cli --scrapers.init</div>
            </div>
            <div className="relative overflow-hidden h-[300px] md:h-[400px] bg-[#050505] p-4 font-mono text-[13px] text-left">
               <div className="scanline"></div>
               {mockLogs.map((log, i) => (
                 <div key={i} className={`mb-1 ${log.includes('✓') || log.includes('[success]') ? 'text-green-400' : log.includes('✖') || log.includes('[error]') ? 'text-error' : log.includes('[Sistema]') ? 'text-primary' : 'text-on-surface-variant'}`}>
                   <span className="opacity-40">[{new Date().toLocaleTimeString()}]</span> {log.replace(/\[.*?\]/, '')}
                 </div>
               ))}
               <div className="inline-block w-2 h-4 bg-primary animate-pulse ml-1 mt-1"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-20 px-gutter max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-panel p-8 rounded-xl glow-hover transition-all group flex flex-col h-full">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors text-primary text-2xl font-bold font-mono">
               C
            </div>
            <h3 className="text-2xl font-semibold text-on-surface mb-2">CORS Bypass</h3>
            <p className="text-on-surface-variant flex-grow">Arquitetura local Next.js isolada de bloqueios de API e proteção de borda do Instagram.</p>
            <div className="mt-4 pt-4 border-t border-outline-variant font-mono text-sm text-primary">proxy_mode: "stealth"</div>
          </div>
          <div className="glass-panel p-8 rounded-xl glow-hover transition-all group flex flex-col h-full">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors text-primary text-2xl font-bold font-mono">
               B
            </div>
            <h3 className="text-2xl font-semibold text-on-surface mb-2">Batch Download</h3>
            <p className="text-on-surface-variant flex-grow">Extração de perfis completos, highlights e posts salvos diretamente para seu armazenamento local.</p>
            <div className="mt-4 pt-4 border-t border-outline-variant font-mono text-sm text-primary">workers: 128</div>
          </div>
          <div className="glass-panel p-8 rounded-xl glow-hover transition-all group flex flex-col h-full">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors text-primary text-2xl font-bold font-mono">
               S
            </div>
            <h3 className="text-2xl font-semibold text-on-surface mb-2">Session Auth</h3>
            <p className="text-on-surface-variant flex-grow">Gere e mantenha sua própria sessão em segurança no host com persistência robusta.</p>
            <div className="mt-4 pt-4 border-t border-outline-variant font-mono text-sm text-primary">auth: "hot_swap"</div>
          </div>
        </div>
      </section>
    </main>
  );
}
