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
    <main className="h-screen w-screen overflow-hidden flex flex-col mesh-gradient relative px-4 md:px-6">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Cabeçalho Compacto */}
      <header className="w-full shrink-0 flex items-center justify-between py-3 bg-transparent">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold tracking-widest text-indigo-400 uppercase">
            IV // InstaVault
          </span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono bg-zinc-900/60 px-2 py-1 rounded-full border border-zinc-850 uppercase tracking-wide">
          v5.0 // No-Scroll Edition
        </div>
      </header>

      {/* Dashboard Principal - Ocupando todo o restante */}
      <section className="w-full max-w-7xl mx-auto flex-1 flex flex-col min-h-0 pb-4">
        
        {/* Bloco Superior Fixo (Bento Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0 mb-3">
          
          {/* Bloco 1: Alvo (Col 1-2) */}
          <div className="md:col-span-2 glass-panel p-4 rounded-xl shadow-xl flex flex-col gap-3 border border-zinc-800/50">
            <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Alvo & Diretório</h3>
            
            <div className="flex flex-col gap-2.5">
              <div className="relative w-full flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder={mode === 'saved' ? 'Posts Salvos (Ignora este campo)' : 'URL, Shortcode ou @username...'}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={mode === 'saved'}
                  className="w-full bg-zinc-900/50 pl-9 pr-16 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-xs border border-zinc-800/50 rounded-lg disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handlePaste}
                  disabled={mode === 'saved'}
                  className="absolute right-2 px-2 py-0.5 text-[10px] text-indigo-400 font-medium hover:text-indigo-300 transition-colors bg-indigo-500/10 rounded border border-indigo-500/20 disabled:opacity-50"
                >
                  Colar
                </button>
              </div>

              <div className="flex gap-2 items-center">
                <div className="relative w-full flex items-center">
                  <FolderOpen className="absolute left-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Caminho Absoluto (Padrão: ./downloads/)"
                    value={targetDir}
                    onChange={(e) => setTargetDir(e.target.value)}
                    className="w-full bg-zinc-900/50 pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-xs border border-zinc-800/50 rounded-lg"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={loading || (!url.trim() && mode !== 'saved')}
                  className="shrink-0 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium text-xs px-6 py-2 rounded-lg shadow-lg shadow-indigo-500/10 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer h-[34px]"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Iniciar Extração</span>}
                </button>
              </div>
            </div>
          </div>

          {/* Bloco 2: Modo de Operação (Col 3) */}
          <div className="md:col-span-1 glass-panel p-4 rounded-xl shadow-xl flex flex-col gap-2 border border-zinc-800/50">
            <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Modo de Operação</h3>
            
            <div className="grid grid-cols-4 gap-1.5 flex-1">
              <button onClick={() => setMode('profile')} className={`p-1.5 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${mode === 'profile' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-zinc-900/50 border-zinc-800/50 text-slate-400 hover:bg-zinc-800'}`}>
                <User className="w-4 h-4" /> <span className="text-[9px] font-semibold">Perfil</span>
              </button>
              <button onClick={() => setMode('post')} className={`p-1.5 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${mode === 'post' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-zinc-900/50 border-zinc-800/50 text-slate-400 hover:bg-zinc-800'}`}>
                <ImageIcon className="w-4 h-4" /> <span className="text-[9px] font-semibold">Post/Reel</span>
              </button>
              <button onClick={() => setMode('stories')} className={`p-1.5 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${mode === 'stories' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-zinc-900/50 border-zinc-800/50 text-slate-400 hover:bg-zinc-800'}`}>
                <History className="w-4 h-4" /> <span className="text-[9px] font-semibold">Stories</span>
              </button>
              <button onClick={() => setMode('saved')} className={`p-1.5 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${mode === 'saved' ? 'bg-pink-500/20 border-pink-500 text-pink-300' : 'bg-zinc-900/50 border-zinc-800/50 text-slate-400 hover:bg-zinc-800'}`}>
                <Bookmark className="w-4 h-4" /> <span className="text-[9px] font-semibold">Salvos</span>
              </button>
            </div>

            <div 
              onClick={() => toggleOption('forceAnonymous')}
              className={`mt-1 flex items-center justify-between p-2 rounded-lg border transition-colors cursor-pointer select-none ${options.forceAnonymous ? 'bg-indigo-500/10 border-indigo-500/40' : 'bg-zinc-900/50 border-zinc-800/50'}`}
            >
              <span className="text-[10px] font-medium text-slate-300">Modo Anônimo (Ignorar Login)</span>
              {options.forceAnonymous ? <ToggleRight className="w-4 h-4 text-indigo-400" /> : <ToggleLeft className="w-4 h-4 text-zinc-600" />}
            </div>
          </div>

          {/* Bloco 3: Switches de Mídia (Col 1) */}
          <div className="md:col-span-1 glass-panel p-3 rounded-xl shadow-xl flex flex-col gap-2 border border-zinc-800/50 h-32">
            <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Escopo</h3>
            <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700">
              {[
                { key: 'noVideos', label: 'Ignorar Vídeos' },
                { key: 'noCaptions', label: 'Ignorar .txt' },
                { key: 'noMetadata', label: 'Ignorar .json' },
                { key: 'noProfilePic', label: 'Ignorar Avatar' },
                { key: 'comments', label: 'Comentários' },
                { key: 'fastUpdate', label: 'Pular Antigos' },
                { key: 'tagged', label: 'Posts Marcados' }
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-[9px] font-medium text-slate-300 whitespace-nowrap overflow-hidden text-ellipsis mr-1">{label}</span>
                  <button
                    type="button"
                    onClick={() => toggleOption(key as keyof typeof options)}
                    className={`relative inline-flex h-3.5 w-6 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${options[key as keyof typeof options] ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                  >
                    <span className={`pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${options[key as keyof typeof options] ? 'translate-x-2.5' : 'translate-x-px'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Bloco 4: Filtros & Nomenclatura (Col 2-3) */}
          <div className="md:col-span-2 glass-panel p-3 rounded-xl shadow-xl flex flex-col gap-2 border border-zinc-800/50 h-32">
            <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Filtros Avançados</h3>
            
            <div className="grid grid-cols-2 gap-4 h-full">
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400">Limite (--count)</label>
                  <input 
                    type="number" 
                    placeholder="Vazio = Iltd" 
                    value={options.count} 
                    onChange={(e) => handleOptionChange('count', e.target.value)}
                    className="w-full bg-zinc-900/60 px-2 py-1.5 text-white text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500/50 border border-zinc-800/80 rounded"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400">Mín. Curtidas</label>
                  <input 
                    type="number" 
                    placeholder="Ex: 100" 
                    value={options.minLikes} 
                    onChange={(e) => handleOptionChange('minLikes', e.target.value)}
                    className="w-full bg-zinc-900/60 px-2 py-1.5 text-white text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500/50 border border-zinc-800/80 rounded"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400">Mín. Comments</label>
                  <input 
                    type="number" 
                    placeholder="Ex: 10" 
                    value={options.minComments} 
                    onChange={(e) => handleOptionChange('minComments', e.target.value)}
                    className="w-full bg-zinc-900/60 px-2 py-1.5 text-white text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500/50 border border-zinc-800/80 rounded"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-end">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400">Nomenclatura (--filename-pattern)</label>
                  <select 
                    value={options.filenamePattern}
                    onChange={(e) => handleOptionChange('filenamePattern', e.target.value)}
                    className="w-full bg-zinc-900/60 px-2 py-1.5 text-white text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500/50 border border-zinc-800/80 rounded appearance-none"
                  >
                    <option value="{date_utc}_UTC">Data e Hora UTC</option>
                    <option value="{shortcode}_{profile}">ID do Post + Usuário</option>
                    <option value="{date_utc}_UTC_{shortcode}">Cronológico Completo</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="shrink-0 glass-panel border-red-500/30 p-2 mb-3 rounded-lg flex items-center gap-2 text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="text-[10px]">{error}</p>
          </div>
        )}

        {/* Bloco Inferior Flexível (Terminal) - Ocupará o resto da tela */}
        <div className="glass-panel rounded-xl overflow-hidden shadow-2xl p-0 flex flex-col border border-zinc-800/60 flex-1 min-h-0">
          <div className="bg-zinc-950/80 p-2 border-b border-zinc-800/60 flex items-center gap-2 shrink-0">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider">Terminal</span>
            {loading && <Loader2 className="w-3 h-3 text-indigo-400 animate-spin ml-auto" />}
          </div>
          
          <div className="flex-1 bg-black/60 p-3 overflow-y-auto font-mono text-[11px] text-slate-300 space-y-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
            {logs.length === 0 ? (
              <div className="text-slate-600 flex items-center h-full justify-center">
                Aguardando inicialização...
              </div>
            ) : (
              logs.map((log, idx) => {
                let logClass = "text-slate-300";
                if (log.includes("[Erro]") || log.includes("[stderr]")) logClass = "text-red-400";
                if (log.includes("[Sistema]")) logClass = "text-indigo-400 font-medium";
                
                return (
                  <div key={idx} className={`${logClass} break-all leading-tight`}>
                    <span className="text-slate-600 mr-1.5 select-none">~</span>{log}
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
