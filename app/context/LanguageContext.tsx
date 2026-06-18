'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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
    'landing.feat1.title': 'CORS Bypass',
    'landing.feat1.desc': 'Arquitetura local Next.js isolada de bloqueios de API e proteção de borda do Instagram.',
    'landing.feat2.title': 'Batch Download',
    'landing.feat2.desc': 'Extração de perfis completos, highlights e posts salvos diretamente para seu armazenamento local.',
    'landing.feat3.title': 'Session Auth',
    'landing.feat3.desc': 'Gere e mantenha sua própria sessão em segurança no host com persistência robusta.',
    'landing.credits.docs': 'Documentação Oficial',
    
    // Dashboard - Target
    'dash.config': 'Configuração',
    'dash.target.title': 'Alvo & Diretório',
    'dash.target.placeholder': 'URL, Shortcode ou @username...',
    'dash.target.saved': 'Posts Salvos (Ignora este campo)',
    'dash.target.dir': 'Caminho Absoluto',
    'dash.target.dirPlaceholder': 'Ex: C:\\Users\\...\\Downloads',
    'dash.target.btn': 'INICIAR EXTRAÇÃO',
    
    // Dashboard - Mode
    'dash.mode.title': 'Modo de Operação',
    'dash.mode.profile': 'Profile',
    'dash.mode.post': 'Post/Reel',
    'dash.mode.stories': 'Stories',
    'dash.mode.saved': 'Saved',
    
    // Dashboard - Scope
    'dash.scope.title': 'Parâmetros Booleanos',
    'dash.scope.noVideos': 'Ignorar Vídeos',
    'dash.scope.noCaptions': 'Ignorar Legendas',
    'dash.scope.noMetadata': 'Ignorar Metadados',
    'dash.scope.noProfilePic': 'Ignorar Foto Perfil',
    'dash.scope.stories': 'Baixar Stories',
    'dash.scope.highlights': 'Baixar Destaques',
    'dash.scope.comments': 'Baixar Comentários',
    'dash.scope.fastUpdate': 'Atualização Rápida',
    'dash.scope.tagged': 'Posts Marcados',
    'dash.scope.saved': 'Posts Salvos',
    
    // Dashboard - Filters
    'dash.filters.title': 'Filtros de Engajamento e Escopo',
    'dash.filters.limit': 'Limite de Posts:',
    'dash.filters.minLikes': 'Min Curtidas:',
    'dash.filters.minComments': 'Min Comentários:',
    
    // Dashboard - Terminal
    'dash.term.waiting': '[SYSTEM] Aguardando execução...',
    'dash.err.stream': 'Stream não suportada pelo navegador.',
    'dash.err.comm': 'Falha de comunicação com o servidor.',
    
    // Docs
    'docs.title': 'InstaVault Deep Dive Documentation',
    'docs.intro': 'Entenda o funcionamento interno da arquitetura local do InstaVault, o fluxo de comunicação de Server-Sent Events, os comandos de autenticação nativos e o que cada switch avançado executa no seu sistema operacional.',
    'docs.arch.title': 'Arquitetura de Comunicação (SSE)',
    'docs.arch.desc1': 'O InstaVault não é um "backend na nuvem" tradicional. Ele atua como um Wrapper Local, envelopando o CLI do Instaloader de maneira segura e persistente. A comunicação flui através de Server-Sent Events (SSE): a interface Next.js despacha configurações para uma rota de API (`/api/download/route.ts`), que invoca um spawn do processo Python no host. Toda a saída padrão (stdout e stderr) é capturada assincronamente e "streamada" em tempo real de volta para o cliente, alimentando o Terminal View sem timeouts convencionais de HTTP.',
    'docs.auth.title': 'Guia de Inicialização do Motor Local (Auth)',
    'docs.auth.desc': 'Para extrair dados contínuos sem bloqueios do Instagram (conteúdo de perfil fechado, stories ou salvos), é necessário gerar um estado de sessão criptografada no sistema operacional host. O InstaVault detectará e reaproveitará essa sessão automaticamente.',
    'docs.auth.cli1': 'O CLI solicitará sua senha.',
    'docs.auth.cli2': 'Após logar, o cookie de sessão é persistido localmente em:',
    'docs.auth.footer': 'Após este comando, certifique-se de configurar a variável de ambiente IG_USERNAME no .env.local do projeto Next.js, ou o sistema forçará modo anônimo.',
    'docs.flags.title': 'Tabela Exaustiva de Funcionalidades',
    'docs.table.ui': 'Switch UI',
    'docs.table.flag': 'Flag Subjacente',
    'docs.table.action': 'Ação Exata no Terminal',
    'docs.flag.noVideos.desc': 'Pula o download de `.mp4`. Economiza banda ao baixar apenas metadados/fotos.',
    'docs.flag.noCaptions.desc': 'Desativa a geração do arquivo `.txt` contendo a legenda descritiva do post.',
    'docs.flag.noMetadata.desc': 'Impede a criação do pacote `.json.xz` bruto da Graph API do Instagram.',
    'docs.flag.noProfilePic.desc': 'Geralmente injetado automaticamente para evitar lixo no diretório de destino.',
    'docs.flag.stories.desc': 'Extrai metadados voláteis (Requer Autenticação e Sessão local).',
    'docs.flag.fastUpdate.desc': 'Interrompe a raspagem de um perfil quando o sistema atinge o primeiro arquivo que já existe localmente. Ideal para CRON Jobs.',
    'docs.flag.filters.desc': 'O InstaVault converte "Min Curtidas" e "Min Comentários" para um eval dinâmico: `likes >= X and comments >= Y`.',
    'docs.files.title': 'Breakdown de Arquivos de Saída',
    'docs.files.desc': 'O InstaVault estrutura os downloads em diretórios atrelados à tag de perfil (`targetDir/{"{profile}"}`). Dentro desse diretório isolado, cada postagem extraída gera o seguinte conjunto de artefatos padrão:',
    'docs.files.raw.title': 'Mídia Bruta (Raw Media)',
    'docs.files.raw.desc': 'A imagem ou vídeo original em alta resolução. Caso um carrossel seja baixado, o sufixo numérico será incrementado.',
    'docs.files.txt.title': 'Legenda Limpa (Caption Payload)',
    'docs.files.txt.desc': 'Instruído pela flag `--post-metadata-txt={"{caption}"}`, o InstaVault gera um arquivo .txt legível que contém unicamente o texto da legenda redigido, pronto para análise semântica ou NLP.',
    'docs.files.json.title': 'Dump da Graph API do Instagram',
    'docs.files.json.desc': 'Um binário compactado via XZ contendo o payload inteiro da API privada do Instagram para a referida mídia. Útil para extrair timestamps absolutos, metadados de localização ou tags em nível de código.',
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
    'landing.feat1.title': 'CORS Bypass',
    'landing.feat1.desc': 'Local Next.js architecture isolated from API blocks and Instagram edge protection.',
    'landing.feat2.title': 'Batch Download',
    'landing.feat2.desc': 'Extract entire profiles, highlights, and saved posts directly to your local storage.',
    'landing.feat3.title': 'Session Auth',
    'landing.feat3.desc': 'Generate and maintain your own session safely on the host with robust persistence.',
    'landing.credits.docs': 'Official Documentation',
    
    // Dashboard - Target
    'dash.config': 'Configuration',
    'dash.target.title': 'Target & Directory',
    'dash.target.placeholder': 'URL, Shortcode or @username...',
    'dash.target.saved': 'Saved Posts (Ignores this field)',
    'dash.target.dir': 'Absolute Path',
    'dash.target.dirPlaceholder': 'Ex: C:\\Users\\...\\Downloads',
    'dash.target.btn': 'START EXTRACTION',
    
    // Dashboard - Mode
    'dash.mode.title': 'Operation Mode',
    'dash.mode.profile': 'Profile',
    'dash.mode.post': 'Post/Reel',
    'dash.mode.stories': 'Stories',
    'dash.mode.saved': 'Saved',
    
    // Dashboard - Scope
    'dash.scope.title': 'Boolean Parameters',
    'dash.scope.noVideos': 'Skip Videos',
    'dash.scope.noCaptions': 'Skip Captions',
    'dash.scope.noMetadata': 'Skip Metadata',
    'dash.scope.noProfilePic': 'Skip Profile Pic',
    'dash.scope.stories': 'Download Stories',
    'dash.scope.highlights': 'Download Highlights',
    'dash.scope.comments': 'Download Comments',
    'dash.scope.fastUpdate': 'Fast Update',
    'dash.scope.tagged': 'Tagged Posts',
    'dash.scope.saved': 'Saved Posts',
    
    // Dashboard - Filters
    'dash.filters.title': 'Engagement Filters & Scope',
    'dash.filters.limit': 'Post Limit:',
    'dash.filters.minLikes': 'Min Likes:',
    'dash.filters.minComments': 'Min Comments:',
    
    // Dashboard - Terminal
    'dash.term.waiting': '[SYSTEM] Waiting for execution...',
    'dash.err.stream': 'Stream not supported by browser.',
    'dash.err.comm': 'Server communication failed.',
    
    // Docs
    'docs.title': 'InstaVault Deep Dive Documentation',
    'docs.intro': 'Understand the inner workings of InstaVault\'s local architecture, the Server-Sent Events communication flow, native authentication commands, and what each advanced switch executes on your OS.',
    'docs.arch.title': 'Communication Architecture (SSE)',
    'docs.arch.desc1': 'InstaVault is not a traditional "cloud backend". It acts as a Local Wrapper, securely and persistently wrapping the Instaloader CLI. Communication flows through Server-Sent Events (SSE): the Next.js UI dispatches settings to an API route (`/api/download/route.ts`), which invokes a Python process spawn on the host. All standard output (stdout and stderr) is captured asynchronously and streamed back to the client in real time, feeding the Terminal View without conventional HTTP timeouts.',
    'docs.auth.title': 'Local Engine Initialization Guide (Auth)',
    'docs.auth.desc': 'To extract continuous data without Instagram blocks (private profile content, stories, or saved posts), you must generate an encrypted session state on the host OS. InstaVault will detect and reuse this session automatically.',
    'docs.auth.cli1': 'The CLI will prompt for your password.',
    'docs.auth.cli2': 'After logging in, the session cookie is persisted locally at:',
    'docs.auth.footer': 'After this command, make sure to set the IG_USERNAME environment variable in the Next.js project\'s .env.local, or the system will force anonymous mode.',
    'docs.flags.title': 'Exhaustive Features Table',
    'docs.table.ui': 'UI Switch',
    'docs.table.flag': 'Underlying Flag',
    'docs.table.action': 'Exact Terminal Action',
    'docs.flag.noVideos.desc': 'Skips `.mp4` downloads. Saves bandwidth by downloading only metadata/photos.',
    'docs.flag.noCaptions.desc': 'Disables generation of the `.txt` file containing the post\'s descriptive caption.',
    'docs.flag.noMetadata.desc': 'Prevents creation of the raw `.json.xz` bundle from Instagram\'s Graph API.',
    'docs.flag.noProfilePic.desc': 'Usually injected automatically to prevent clutter in the destination directory.',
    'docs.flag.stories.desc': 'Extracts volatile metadata (Requires Authentication and Local Session).',
    'docs.flag.fastUpdate.desc': 'Stops scraping a profile when the system reaches the first file that already exists locally. Ideal for CRON Jobs.',
    'docs.flag.filters.desc': 'InstaVault converts "Min Likes" and "Min Comments" into a dynamic eval: `likes >= X and comments >= Y`.',
    'docs.files.title': 'Output Files Breakdown',
    'docs.files.desc': 'InstaVault structures downloads into directories tied to the profile tag (`targetDir/{"{profile}"}`). Inside this isolated directory, each extracted post generates the following standard set of artifacts:',
    'docs.files.raw.title': 'Raw Media',
    'docs.files.raw.desc': 'The original high-resolution image or video. If a carousel is downloaded, the numerical suffix will be incremented.',
    'docs.files.txt.title': 'Caption Payload',
    'docs.files.txt.desc': 'Instructed by the `--post-metadata-txt={"{caption}"}` flag, InstaVault generates a readable .txt file containing solely the redacted caption text, ready for semantic analysis or NLP.',
    'docs.files.json.title': 'Instagram Graph API Dump',
    'docs.files.json.desc': 'An XZ-compressed binary containing the entire private Instagram API payload for the media. Useful for extracting absolute timestamps, location metadata, or code-level tags.',
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

  // Load preferred language from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('instavault_lang');
    if (stored === 'en' || stored === 'pt') {
      setLanguage(stored);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('instavault_lang', lang);
  };

  const t = (key: string) => {
    return dictionary[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
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
