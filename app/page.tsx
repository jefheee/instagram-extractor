'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from './context/LanguageContext';
import { Terminal, Database, Shield, Zap } from 'lucide-react';

export default function LandingPage() {
  const { t } = useLanguage();

  return (
    <main className="flex flex-col min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
      <div className="max-w-3xl w-full text-center space-y-8">
        {/* Logo/Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#feda75] via-[#fa7e1e] to-[#d62976] p-1 shadow-2xl">
            <div className="w-full h-full bg-[#000000] rounded-xl flex items-center justify-center">
              <Terminal className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>

        {/* Headlines */}
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white">
          {t('landing.title')}
        </h1>
        <p className="text-lg md:text-xl text-[#a8a8a8] font-medium max-w-2xl mx-auto">
          {t('landing.subtitle')}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link 
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-3 bg-[#0095f6] hover:bg-[#1877f2] text-white font-semibold rounded-lg transition-colors flex items-center justify-center"
          >
            {t('landing.btn.dashboard')}
          </Link>
          <Link 
            href="/docs"
            className="w-full sm:w-auto px-8 py-3 bg-[#121212] hover:bg-[#262626] border border-[#262626] text-white font-semibold rounded-lg transition-colors flex items-center justify-center"
          >
            {t('landing.btn.docs')}
          </Link>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-16 text-left">
          <div className="p-5 bg-[#121212] border border-[#262626] rounded-xl">
            <Zap className="w-6 h-6 text-[#0095f6] mb-3" />
            <h3 className="text-sm font-semibold text-white mb-1">CORS Bypass</h3>
            <p className="text-xs text-[#a8a8a8]">Arquitetura local Next.js isolada de bloqueios de API.</p>
          </div>
          <div className="p-5 bg-[#121212] border border-[#262626] rounded-xl">
            <Database className="w-6 h-6 text-[#0095f6] mb-3" />
            <h3 className="text-sm font-semibold text-white mb-1">Batch Download</h3>
            <p className="text-xs text-[#a8a8a8]">Extração de perfis completos, highlights e posts salvos.</p>
          </div>
          <div className="p-5 bg-[#121212] border border-[#262626] rounded-xl">
            <Shield className="w-6 h-6 text-[#0095f6] mb-3" />
            <h3 className="text-sm font-semibold text-white mb-1">Session Auth</h3>
            <p className="text-xs text-[#a8a8a8]">Gere e mantenha sua própria sessão em segurança no host.</p>
          </div>
        </div>

        {/* Credits */}
        <div className="pt-16 pb-8">
          <p className="text-xs text-[#737373] uppercase tracking-widest font-mono mb-2">
            {t('landing.credits')}
          </p>
          <div className="flex items-center justify-center gap-4">
            <a 
              href="https://github.com/instaloader/instaloader" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-white underline underline-offset-4 decoration-[#262626] transition-colors"
            >
              Instaloader Core
            </a>
            <span className="text-[#262626]">•</span>
            <a 
              href="https://instaloader.github.io/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-white underline underline-offset-4 decoration-[#262626] transition-colors"
            >
              Documentação Oficial
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
