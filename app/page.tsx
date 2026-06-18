'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Loader2, 
  AlertCircle, 
  Terminal,
  FolderOpen,
  User,
  Image as ImageIcon,
  History,
  Bookmark,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [targetDir, setTargetDir] = useState('');
  const [mode, setMode] = useState('profile');
  
  const [options, setOptions] = useState({
    noVideos: false,
    noCaptions: false,
    noMetadata: false,
    noProfilePic: false,
    tagged: false,
    comments: false,
    fastUpdate: false,
    forceAnonymous: false,
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
    if (!url.trim() && mode !== 'saved') return;

    setLoading(true);
    setError(null);
    setLogs([]);

    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, targetDir, mode, options }),
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
      alert("Permissão negada ou restrição. Cole manualmente.");
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
          v4.0 // Bento Architecture
        </div>
      </header>

      <section className="max-w-7xl mx-auto mt-12 flex flex-col gap-6">
        <div className="text-center mb-6 max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            Extraction <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-500 bg-clip-text text-transparent">Dashboard</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Controle granular e execução nativa em lote para Instagram.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Bloco 1: Omnibox Inteligente (Col 1-2) */}
          <div className="md:col-span-2 glass-panel p-6 rounded-2xl shadow-2xl flex flex-col gap-4 border border-zinc-800/50">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Alvo & Diretório</h3>
            
            <div className="flex flex-col gap-4">
              <div className="relative w-full flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder={mode === 'saved' ? 'Posts Salvos (Ignora este campo)' : 'URL, Shortcode ou @username...'}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={mode === 'saved'}
                  className="w-full bg-zinc-900/50 pl-12 pr-20 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-sm md:text-base border border-zinc-800/50 rounded-xl disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handlePaste}
                  disabled={mode === 'saved'}
                  className="absolute right-3 px-2.5 py-1 text-xs text-indigo-400 font-medium hover:text-indigo-300 transition-colors bg-indigo-500/10 rounded-md border border-indigo-500/20 disabled:opacity-50"
                >
                  Colar
                </button>
              </div>

              <div className="relative w-full flex items-center">
                <FolderOpen className="absolute left-4 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Caminho Absoluto de Salvamento (Padrão: ./downloads/)"
                  value={targetDir}
                  onChange={(e) => setTargetDir(e.target.value)}
                  className="w-full bg-zinc-900/50 pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-sm md:text-base border border-zinc-800/50 rounded-xl"
                />
              </div>

              <button
                type="button"
                onClick={handleSearch}
                disabled={loading || (!url.trim() && mode !== 'saved')}
                className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium text-sm md:text-base px-8 py-3.5 rounded-xl shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Iniciar Extração</span>}
              </button>
            </div>
          </div>

          {/* Bloco 2: Modo de Operação (Col 3) */}
          <div className="md:col-span-1 glass-panel p-6 rounded-2xl shadow-2xl flex flex-col gap-4 border border-zinc-800/50">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Modo de Operação</h3>
            
            <div className="grid grid-cols-2 gap-3 flex-1">
              <button onClick={() => setMode('profile')} className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${mode === 'profile' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-zinc-900/50 border-zinc-800/50 text-slate-400 hover:bg-zinc-800'}`}>
                <User className="w-5 h-5" /> <span className="text-xs font-semibold">Perfil</span>
              </button>
              <button onClick={() => setMode('post')} className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${mode === 'post' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-zinc-900/50 border-zinc-800/50 text-slate-400 hover:bg-zinc-800'}`}>
                <ImageIcon className="w-5 h-5" /> <span className="text-xs font-semibold">Post/Reel</span>
              </button>
              <button onClick={() => setMode('stories')} className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${mode === 'stories' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-zinc-900/50 border-zinc-800/50 text-slate-400 hover:bg-zinc-800'}`}>
                <History className="w-5 h-5" /> <span className="text-xs font-semibold">Stories</span>
              </button>
              <button onClick={() => setMode('saved')} className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${mode === 'saved' ? 'bg-pink-500/20 border-pink-500 text-pink-300' : 'bg-zinc-900/50 border-zinc-800/50 text-slate-400 hover:bg-zinc-800'}`}>
                <Bookmark className="w-5 h-5" /> <span className="text-xs font-semibold">Salvos</span>
              </button>
            </div>

            <div 
              onClick={() => toggleOption('forceAnonymous')}
              className={`mt-2 flex items-center justify-between p-3.5 rounded-xl border transition-colors cursor-pointer select-none ${options.forceAnonymous ? 'bg-indigo-500/10 border-indigo-500/40' : 'bg-zinc-900/50 border-zinc-800/50'}`}
            >
              <span className="text-xs font-medium text-slate-300">Modo Anônimo (Evita Erro 400)</span>
              {options.forceAnonymous ? <ToggleRight className="w-5 h-5 text-indigo-400" /> : <ToggleLeft className="w-5 h-5 text-zinc-600" />}
            </div>
          </div>

          {/* Bloco 3: Switches de Mídia (Col 1) */}
          <div className="md:col-span-1 glass-panel p-6 rounded-2xl shadow-2xl flex flex-col gap-4 border border-zinc-800/50">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Exclusões & Escopo</h3>
            <div className="flex flex-col gap-3">
              {[
                { key: 'noVideos', label: 'Ignorar Vídeos' },
                { key: 'noCaptions', label: 'Ignorar Legendas (.txt)' },
                { key: 'noMetadata', label: 'Ignorar Metadados (.json)' },
                { key: 'noProfilePic', label: 'Ignorar Foto de Perfil' },
                { key: 'comments', label: 'Baixar Comentários' },
                { key: 'fastUpdate', label: 'Atualização Rápida (Pular)' },
                { key: 'tagged', label: 'Posts Marcados (Tagged)' }
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

          {/* Bloco 4: Filtros & Nomenclatura (Col 2-3) */}
          <div className="md:col-span-2 glass-panel p-6 rounded-2xl shadow-2xl flex flex-col gap-4 border border-zinc-800/50">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Filtros Avançados & Nomenclatura</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              <div className="flex flex-col gap-4 justify-between">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400">Limite de Posts (--count)</label>
                  <input 
                    type="number" 
                    placeholder="Deixe em branco para ilimitado" 
                    value={options.count} 
                    onChange={(e) => handleOptionChange('count', e.target.value)}
                    className="w-full bg-zinc-900/60 px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 border border-zinc-800/80 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400">Mín. Curtidas</label>
                    <input 
                      type="number" 
                      placeholder="Ex: 100" 
                      value={options.minLikes} 
                      onChange={(e) => handleOptionChange('minLikes', e.target.value)}
                      className="w-full bg-zinc-900/60 px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 border border-zinc-800/80 rounded-lg"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400">Mín. Comments</label>
                    <input 
                      type="number" 
                      placeholder="Ex: 10" 
                      value={options.minComments} 
                      onChange={(e) => handleOptionChange('minComments', e.target.value)}
                      className="w-full bg-zinc-900/60 px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 border border-zinc-800/80 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 justify-start">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400">Padrão de Nomenclatura de Arquivos</label>
                  <select 
                    value={options.filenamePattern}
                    onChange={(e) => handleOptionChange('filenamePattern', e.target.value)}
                    className="w-full bg-zinc-900/60 px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 border border-zinc-800/80 rounded-lg appearance-none"
                  >
                    <option value="{date_utc}_UTC">Padrão (Data e Hora UTC)</option>
                    <option value="{shortcode}_{profile}">ID do Post + Usuário</option>
                    <option value="{date_utc}_UTC_{shortcode}">Cronológico Completo</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="md:col-span-3 glass-panel border-red-500/30 p-4 rounded-xl flex items-start gap-3 text-red-400 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-semibold text-sm">Falha no Processamento</h3>
                <p className="text-xs text-slate-400 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Bloco 5: Terminal View (Col 1-3) */}
          <div className="md:col-span-3 glass-panel rounded-2xl overflow-hidden shadow-2xl p-0 flex flex-col h-96 border border-zinc-800/60">
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

        </div>
      </section>
    </main>
  );
}
