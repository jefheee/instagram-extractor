'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';
import { Github, Globe } from 'lucide-react';

export function Navbar() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#000000]/80 backdrop-blur-md border-b border-[#262626]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-sm font-mono font-bold tracking-widest text-white uppercase">
                InstaVault
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-4">
              <Link href="/dashboard" className="text-xs font-medium text-gray-400 hover:text-white transition-colors">
                {t('nav.dashboard')}
              </Link>
              <Link href="/docs" className="text-xs font-medium text-gray-400 hover:text-white transition-colors">
                {t('nav.docs')}
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors"
              title="Change Language"
            >
              <Globe className="w-4 h-4" />
              <span className="uppercase">{language}</span>
            </button>
            <a
              href="https://github.com/jefheee/instagram-extractor"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs font-medium bg-[#121212] hover:bg-[#262626] border border-[#262626] text-white px-3 py-1.5 rounded-md transition-colors"
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">{t('nav.repo')}</span>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
