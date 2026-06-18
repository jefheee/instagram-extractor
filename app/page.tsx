'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Loader2,
  AlertCircle,
  ChevronRight,
  Terminal,
  FolderOpen,
  Settings
} from 'lucide-react';

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export default function Home() {
  const [url, setUrl] = useState('');
  const [targetDir, setTargetDir] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState({
    noVideos: false,
    noCaptions: false,
    noMetadata: false,
    noProfilePic: false,
    stories: false,
    highlights: false,
    comments: false,
    fastUpdate: false,
    tagged: false,
    saved: false,
    count: '',
    minLikes: '',
    minComments: '',
    filenamePattern: '{date_utc}_UTC'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const toggleOption = (key: keyof typeof options) => {
    setOptions(prev => ({ ...prev, [key]: typeof prev[key] === 'boolean' ? !prev[key] : prev[key] }));
  };

  const handleOptionChange = (key: keyof typeof options, value: string) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setLogs([]);

    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, type: 'auto', targetDir, options }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Ocorreu um erro ao iniciar a extração.');
      }

      if (!res.body) {
        throw new Error("Stream não suportada pelo navegador.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.log) {
                  setLogs((prev) => [...prev, data.log]);
                }
                if (data.done) {
                  setLoading(false);
                }
              } catch (e) {
                // ignore parse errors
              }
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Falha de comunicação com o servidor.');
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
    } catch (err: any) {
      alert("Permissão negada ou restrição de HTTP. Pressione Ctrl+V para colar na barra.");
      console.error(err);
    }
  };

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <main className="min-h-screen mesh-gradient relative pb-20 px-4 md:px-8">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <header className="w-full flex items-center justify-between p-4 bg-transparent">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono font-bold tracking-widest text-indigo-400 uppercase">
            IV // InstaVault
          </span>
        </div>
        <div className="text-xs text-slate-400 font-mono bg-zinc-900/60 px-3.5 py-1.5 rounded-full border border-zinc-850 uppercase tracking-wide">
          v3.0 // Instaloader Core
        </div>
      </header>

      <section className="max-w-6xl mx-auto mt-16 md:mt-24 flex flex-col items-center">
        <div className="text-center mb-8 max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            Extração Nativa via <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-500 bg-clip-text text-transparent">Instaloader</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Insira a URL do post, story ou usuário para extrair as mídias em background e baixar em lote.
          </p>
        </div>

        <form onSubmit={handleSearch} className="w-full max-w-3xl mb-4">
          <div className="glass-panel p-3 rounded-2xl shadow-2xl flex flex-col gap-3">
            <div className="flex flex-col md:flex-row items-center gap-2">
              <div className="relative w-full flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Insira a URL ou @username..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-transparent pl-12 pr-20 py-3.5 text-white placeholder-slate-500 focus:outline-none text-sm md:text-base border border-zinc-800/30 rounded-xl"
                />
                <button
                  type="button"
                  onClick={handlePaste}
                  className="absolute right-3 px-2.5 py-1 text-xs text-indigo-400 font-medium hover:text-indigo-300 transition-colors bg-indigo-500/10 rounded-md border border-indigo-500/20"
                >
                  Colar
                </button>
              </div>
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="w-full md:w-auto bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium text-sm md:text-base px-8 py-3.5 rounded-xl shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Extrair</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </div>

            <div className="relative w-full flex items-center border-t border-zinc-800/30 pt-3">
              <FolderOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 mt-1.5" />
              <input
                type="text"
                placeholder="Caminho de Salvamento (Opcional, ex: C:\Acervo)"
                value={targetDir}
                onChange={(e) => setTargetDir(e.target.value)}
                className="w-full bg-transparent pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none text-sm md:text-base"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowOptions(!showOptions)}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-indigo-400 transition-colors mt-1 w-fit"
            >
              <Settings className="w-4 h-4" />
              <span>Opções Avançadas</span>
              <ChevronRight className={`w-4 h-4 transition-transform ${showOptions ? 'rotate-90' : ''}`} />
            </button>

            {showOptions && (
              <div className="flex flex-col gap-6 mt-3 p-4 md:p-6 bg-zinc-950/40 rounded-xl border border-zinc-800/40">
                {/* A) Filtros e Limites de Volume */}
                <div>
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">Filtros e Volume</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-slate-400">Limite de Posts (--count)</label>
                      <input 
                        type="number" 
                        placeholder="Ex: 50" 
                        value={options.count} 
                        onChange={(e) => handleOptionChange('count', e.target.value)}
                        className="w-full bg-zinc-900 px-3 py-2 text-white text-sm focus:outline-none border border-zinc-800 rounded-lg"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-slate-400">Mínimo de Curtidas</label>
                      <input 
                        type="number" 
                        placeholder="Ex: 100" 
                        value={options.minLikes} 
                        onChange={(e) => handleOptionChange('minLikes', e.target.value)}
                        className="w-full bg-zinc-900 px-3 py-2 text-white text-sm focus:outline-none border border-zinc-800 rounded-lg"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-slate-400">Mínimo de Comentários</label>
                      <input 
                        type="number" 
                        placeholder="Ex: 10" 
                        value={options.minComments} 
                        onChange={(e) => handleOptionChange('minComments', e.target.value)}
                        className="w-full bg-zinc-900 px-3 py-2 text-white text-sm focus:outline-none border border-zinc-800 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* B) Escopo e Alvos Especiais */}
                <div>
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">Escopo e Comportamento</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
                    {[
                      { key: 'noVideos', label: 'Ignorar Vídeos (Apenas Imagens)' },
                      { key: 'noCaptions', label: 'Ignorar Legendas (.txt)' },
                      { key: 'noMetadata', label: 'Ignorar Metadados (.json)' },
                      { key: 'noProfilePic', label: 'Ignorar Foto de Perfil' },
                      { key: 'stories', label: 'Baixar Stories' },
                      { key: 'highlights', label: 'Baixar Destaques' },
                      { key: 'comments', label: 'Baixar Comentários' },
                      { key: 'fastUpdate', label: 'Atualização Rápida (Pular existentes)' },
                      { key: 'tagged', label: 'Baixar Posts Marcados (Tagged)' },
                      { key: 'saved', label: 'Baixar Posts Salvos (Requer login)' }
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-300">{label}</span>
                        <button
                          type="button"
                          onClick={() => toggleOption(key as keyof typeof options)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${options[key as keyof typeof options] ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${options[key as keyof typeof options] ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* C) Customização de Arquivos */}
                <div>
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">Customização de Arquivos</h4>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400">Padrão de Nome de Arquivo (--filename-pattern)</label>
                    <select 
                      value={options.filenamePattern}
                      onChange={(e) => handleOptionChange('filenamePattern', e.target.value)}
                      className="w-full bg-zinc-900 px-3 py-2.5 text-white text-sm focus:outline-none border border-zinc-800 rounded-lg"
                    >
                      <option value="{date_utc}_UTC">Padrão (Data e Hora UTC)</option>
                      <option value="{shortcode}_{profile}">ID do Post + Usuário</option>
                      <option value="{date_utc}_UTC_{shortcode}">Cronológico Completo</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        <p className="text-amber-400/80 text-xs text-center font-medium max-w-xl mb-12">
          Aviso: Extrações em lote rodarão os arquivos para a pasta local ./downloads. Certifique-se de estar rodando em ambiente localhost.
        </p>

        {error && (
          <div className="w-full max-w-3xl glass-panel border-red-500/30 p-4 rounded-xl flex items-start gap-3 text-red-400 mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-sm">Falha no Processamento</h3>
              <p className="text-xs text-slate-400 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Terminal View */}
        <div className="w-full max-w-3xl glass-panel rounded-2xl overflow-hidden shadow-2xl p-0 flex flex-col h-96 border border-zinc-800/60 animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-zinc-950/80 p-3 border-b border-zinc-800/60 flex items-center gap-3">
            <Terminal className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">Terminal Instaloader</span>
            {loading && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin ml-auto" />}
          </div>

          <div className="flex-1 bg-black/60 p-4 overflow-y-auto font-mono text-xs md:text-sm text-slate-300 space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
            {logs.length === 0 ? (
              <div className="text-slate-600 flex items-center h-full justify-center">
                Aguardando inicialização do processo...
              </div>
            ) : (
              logs.map((log, idx) => {
                let logClass = "text-slate-300";
                if (log.includes("[Erro]") || log.includes("[stderr]")) logClass = "text-red-400";
                if (log.includes("[Sistema]")) logClass = "text-indigo-400 font-medium";

                return (
                  <div key={idx} className={`${logClass} break-all`}>
                    <span className="text-slate-600 mr-2 select-none">~</span>{log}
                  </div>
                );
              })
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

      </section>
    </main>
  );
}
