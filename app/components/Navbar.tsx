'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';
import { Globe, Terminal } from 'lucide-react';

const GithubIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
    <path d="M9 18c-4.51 2-5-2-7-2"/>
  </svg>
);

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
            <a href="https://github.com/jefheee/instagram-extractor" target="_blank" rel="noopener noreferrer" className="ml-2 text-on-surface-variant hover:text-primary transition-colors">
              <GithubIcon className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
