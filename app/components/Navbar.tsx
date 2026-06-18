'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';
import { Globe, Terminal } from 'lucide-react';

export function Navbar() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-md border-b border-outline-variant h-16">
      <div className="w-full flex items-center justify-between h-full px-4 md:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 text-primary hover:brightness-110 transition-all">
            <Terminal className="w-5 h-5" />
            <span className="font-headline-lg font-black tracking-tighter">
              InstaVault
            </span>
          </Link>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4">
            <Link href="/dashboard" className="text-[13px] font-mono text-on-surface-variant hover:text-primary transition-colors uppercase tracking-widest">
              {t('nav.dashboard')}
            </Link>
            <Link href="/docs" className="text-[13px] font-mono text-on-surface-variant hover:text-primary transition-colors uppercase tracking-widest">
              {t('nav.docs')}
            </Link>
          </div>
          
          <div className="flex items-center gap-2 border-l border-outline-variant pl-6">
            <button
              onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')}
              className="flex items-center gap-1.5 text-[11px] font-mono text-on-surface-variant hover:text-primary transition-colors uppercase"
              title="Change Language"
            >
              <Globe className="w-4 h-4" />
              <span>{language}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
