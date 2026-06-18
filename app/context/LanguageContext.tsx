'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'pt' | 'en';

type Dictionary = {
  [key in Language]: {
    [key: string]: string;
  };
};

const dictionary: Dictionary = {
  pt: {
    // Navbar
    'nav.dashboard': 'Dashboard',
    'nav.docs': 'Documentação',
    'nav.repo': 'Repositório GitHub',
    
    // Landing Page
    'landing.title': 'InstaVault',
    'landing.subtitle': 'Wrapper avançado em Next.js para extração em lote do Instagram via Instaloader.',
    'landing.btn.dashboard': 'Acessar Dashboard',
    'landing.btn.docs': 'Ver Documentação',
    'landing.credits': 'Powered by',
    
    // Dashboard - Target
    'dash.target.title': 'Alvo & Diretório',
    'dash.target.placeholder': 'URL, Shortcode ou @username...',
    'dash.target.saved': 'Posts Salvos (Ignora este campo)',
    'dash.target.paste': 'Colar',
    'dash.target.dirPlaceholder': 'Caminho Absoluto (Padrão: ./downloads/)',
    'dash.target.btn': 'Iniciar Extração',
    
    // Dashboard - Mode
    'dash.mode.title': 'Modo de Operação',
    'dash.mode.profile': 'Perfil',
    'dash.mode.post': 'Post/Reel',
    'dash.mode.stories': 'Stories',
    'dash.mode.saved': 'Salvos',
    'dash.mode.anon': 'Modo Anônimo (Ignorar Login)',
    
    // Dashboard - Scope
    'dash.scope.title': 'Escopo',
    'dash.scope.noVideos': 'Ignorar Vídeos',
    'dash.scope.noCaptions': 'Ignorar .txt',
    'dash.scope.noMetadata': 'Ignorar .json',
    'dash.scope.noProfilePic': 'Ignorar Avatar',
    'dash.scope.comments': 'Comentários',
    'dash.scope.fastUpdate': 'Pular Antigos',
    'dash.scope.tagged': 'Posts Marcados',
    
    // Dashboard - Filters
    'dash.filters.title': 'Filtros Avançados',
    'dash.filters.limit': 'Limite (--count)',
    'dash.filters.limitEmpty': 'Vazio = Iltd',
    'dash.filters.minLikes': 'Mín. Curtidas',
    'dash.filters.minComments': 'Mín. Comments',
    'dash.filters.naming': 'Nomenclatura (--filename-pattern)',
    'dash.filters.naming.default': 'Data e Hora UTC',
    'dash.filters.naming.id': 'ID do Post + Usuário',
    'dash.filters.naming.full': 'Cronológico Completo',
    
    // Dashboard - Terminal
    'dash.term.title': 'Terminal',
    'dash.term.waiting': 'Aguardando inicialização...',
    'dash.err.stream': 'Stream não suportada pelo navegador.',
    'dash.err.comm': 'Falha de comunicação com o servidor.',
    
    // Docs
    'docs.title': 'Documentação do InstaVault',
    'docs.intro': 'Aprenda como utilizar o wrapper e as flags nativas do Instaloader.',
    'docs.auth.title': '1. Autenticação Local (Sessão)',
    'docs.auth.desc': 'Para extrair conteúdos restritos ou salvos, você deve gerar a sessão do Python via CLI do sistema host primeiro. A senha nunca trafega pela interface web.',
    'docs.flags.title': '2. Comandos e Flags Suportadas',
    'docs.table.flag': 'Flag CLI',
    'docs.table.desc': 'Descrição',
  },
  en: {
    // Navbar
    'nav.dashboard': 'Dashboard',
    'nav.docs': 'Documentation',
    'nav.repo': 'GitHub Repository',
    
    // Landing Page
    'landing.title': 'InstaVault',
    'landing.subtitle': 'Advanced Next.js wrapper for Instagram batch extraction via Instaloader.',
    'landing.btn.dashboard': 'Open Dashboard',
    'landing.btn.docs': 'Read Docs',
    'landing.credits': 'Powered by',
    
    // Dashboard - Target
    'dash.target.title': 'Target & Directory',
    'dash.target.placeholder': 'URL, Shortcode or @username...',
    'dash.target.saved': 'Saved Posts (Ignores this field)',
    'dash.target.paste': 'Paste',
    'dash.target.dirPlaceholder': 'Absolute Path (Default: ./downloads/)',
    'dash.target.btn': 'Start Extraction',
    
    // Dashboard - Mode
    'dash.mode.title': 'Operation Mode',
    'dash.mode.profile': 'Profile',
    'dash.mode.post': 'Post/Reel',
    'dash.mode.stories': 'Stories',
    'dash.mode.saved': 'Saved',
    'dash.mode.anon': 'Anonymous Mode (Skip Login)',
    
    // Dashboard - Scope
    'dash.scope.title': 'Scope',
    'dash.scope.noVideos': 'Skip Videos',
    'dash.scope.noCaptions': 'Skip .txt',
    'dash.scope.noMetadata': 'Skip .json',
    'dash.scope.noProfilePic': 'Skip Avatar',
    'dash.scope.comments': 'Comments',
    'dash.scope.fastUpdate': 'Skip Existing',
    'dash.scope.tagged': 'Tagged Posts',
    
    // Dashboard - Filters
    'dash.filters.title': 'Advanced Filters',
    'dash.filters.limit': 'Limit (--count)',
    'dash.filters.limitEmpty': 'Empty = Unltd',
    'dash.filters.minLikes': 'Min Likes',
    'dash.filters.minComments': 'Min Comments',
    'dash.filters.naming': 'Naming (--filename-pattern)',
    'dash.filters.naming.default': 'Date and Time UTC',
    'dash.filters.naming.id': 'Post ID + User',
    'dash.filters.naming.full': 'Full Chronological',
    
    // Dashboard - Terminal
    'dash.term.title': 'Terminal',
    'dash.term.waiting': 'Waiting for initialization...',
    'dash.err.stream': 'Stream not supported by browser.',
    'dash.err.comm': 'Server communication failed.',
    
    // Docs
    'docs.title': 'InstaVault Documentation',
    'docs.intro': 'Learn how to use the wrapper and native Instaloader flags.',
    'docs.auth.title': '1. Local Authentication (Session)',
    'docs.auth.desc': 'To extract restricted or saved content, you must generate the Python session via host CLI first. Passwords never travel through the web UI.',
    'docs.flags.title': '2. Supported Commands and Flags',
    'docs.table.flag': 'CLI Flag',
    'docs.table.desc': 'Description',
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('pt');

  const t = (key: string) => {
    return dictionary[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
