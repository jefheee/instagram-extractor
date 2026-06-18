'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  Loader2, 
} from 'lucide-react';

export default function Dashboard() {
  const { t } = useLanguage();
  
  const [url, setUrl] = useState('');
  const [targetDir, setTargetDir] = useState('/mnt/vault/extraction/temp');
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
    count: '100',
    minLikes: '500',
    minComments: '20',
    filenamePattern: '{date_utc}_UTC'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<{type: string, text: string}[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const handleOptionChange = (key: keyof typeof options, value: string) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = async () => {
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
        throw new Error(errData.error || t('dash.err.comm'));
      }

      if (!res.body) {
         throw new Error(t('dash.err.stream'));
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
                  let logType = 'data';
                  if (data.log.includes('[Erro]') || data.log.includes('[stderr]')) logType = 'error';
                  if (data.log.includes('[Sistema]')) logType = 'info';
                  if (data.log.includes('Concluído') || data.log.includes('Sucesso')) logType = 'success';
                  setLogs((prev) => [...prev, { type: logType, text: data.log }]);
                }
                if (data.done) {
                  setLoading(false);
                }
              } catch (e) {
                 // ignore
              }
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || t('dash.err.comm'));
      setLoading(false);
      setLogs((prev) => [...prev, { type: 'error', text: err.message }]);
    }
  };

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="flex-1 grid grid-cols-12 gap-4 p-4 md:p-6 overflow-hidden h-full">
      {/* Left Column: Configuration */}
      <section className="col-span-12 lg:col-span-5 xl:col-span-4 space-y-4 overflow-y-auto pr-2 pb-20 terminal-scrollbar">
        <div className="bg-surface border border-outline-variant p-4 rounded-[4px] md:rounded-[8px]">
          <header className="flex items-center justify-between mb-4 border-b border-outline-variant pb-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-primary rounded-full animate-pulse"></span>
              <h2 className="text-[11px] font-mono uppercase tracking-widest text-on-surface">Configuração</h2>
            </div>
          </header>

          <div className="space-y-4">
            {/* Alvo & Diretório */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-on-surface-variant">Alvo &amp; Diretório</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">@</span>
                <input 
                  className="w-full pl-8 pr-4 py-2 bg-background border border-outline-variant focus:border-primary-container outline-none font-mono text-[13px] text-on-surface transition-all rounded-[4px]" 
                  placeholder={mode === 'saved' ? t('dash.target.saved') : "username ou URL"} 
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={mode === 'saved'}
                />
              </div>
            </div>

            {/* Caminho Absoluto */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-on-surface-variant">Caminho Absoluto</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">/</span>
                <input 
                  className="w-full pl-8 pr-4 py-2 bg-background border border-outline-variant focus:border-primary-container outline-none font-mono text-[13px] text-on-surface transition-all rounded-[4px]" 
                  type="text" 
                  value={targetDir}
                  onChange={(e) => setTargetDir(e.target.value)}
                />
              </div>
            </div>

            {/* Modo de Operação */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-on-surface-variant">Modo de Operação</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'profile', label: 'Profile' },
                  { id: 'post', label: 'Post/Reel' },
                  { id: 'stories', label: 'Stories' },
                  { id: 'saved', label: 'Saved' }
                ].map(m => (
                  <button 
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`flex items-center gap-2 px-4 py-2 font-mono text-[13px] font-bold rounded-[4px] transition-colors border ${mode === m.id ? 'bg-primary-container text-white border-primary-container' : 'bg-background border-outline-variant text-on-surface-variant hover:border-on-surface-variant'}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtros Avançados */}
            <div className="pt-4 border-t border-outline-variant mt-4">
              <label className="text-[11px] font-mono text-on-surface-variant block mb-4">Filtros Avançados</label>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono text-[13px] text-on-surface-variant">Count:</span>
                  <input 
                    className="w-24 px-2 py-1 bg-background border border-outline-variant font-mono text-[13px] text-primary text-right rounded-[4px]" 
                    type="number" 
                    value={options.count}
                    onChange={(e) => handleOptionChange('count', e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono text-[13px] text-on-surface-variant">Min Likes:</span>
                  <input 
                    className="w-24 px-2 py-1 bg-background border border-outline-variant font-mono text-[13px] text-primary text-right rounded-[4px]" 
                    type="number" 
                    value={options.minLikes}
                    onChange={(e) => handleOptionChange('minLikes', e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono text-[13px] text-on-surface-variant">Min Comments:</span>
                  <input 
                    className="w-24 px-2 py-1 bg-background border border-outline-variant font-mono text-[13px] text-primary text-right rounded-[4px]" 
                    type="number" 
                    value={options.minComments}
                    onChange={(e) => handleOptionChange('minComments', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-6">
              <button 
                onClick={handleSearch}
                disabled={loading || (!url.trim() && mode !== 'saved')}
                className="w-full bg-primary-container disabled:opacity-50 hover:bg-opacity-90 active:scale-[0.98] transition-all text-white py-4 text-lg font-bold flex items-center justify-center gap-4 rounded-[4px]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>INICIAR EXTRAÇÃO</span>}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Right Column: Terminal Simulation */}
      <section className="col-span-12 lg:col-span-7 xl:col-span-8 flex flex-col h-full overflow-hidden">
        <div className="flex-1 bg-[#050505] border-t border-outline-variant relative overflow-hidden flex flex-col rounded-none">
          <div className="scanline"></div>
          
          {/* Terminal Header */}
          <div className="flex items-center justify-between bg-surface-container-high px-4 py-2 border-b border-outline-variant">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-error"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-secondary"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
              </div>
              <span className="ml-2 font-mono text-[13px] text-on-surface-variant opacity-80">bash — instavault-cli — 120x40</span>
            </div>
            {loading && <Loader2 className="w-3 h-3 text-primary animate-spin" />}
          </div>
          
          {/* Terminal Logs Body */}
          <div className="flex-1 p-4 font-mono text-[13px] overflow-y-auto terminal-scrollbar selection:bg-primary-container selection:text-white pb-10">
             {logs.length === 0 && !loading && (
               <div className="text-on-tertiary-container mb-1">[SYSTEM] Waiting for execution...</div>
             )}
             {logs.map((log, idx) => {
                let colorClass = 'text-on-surface-variant';
                let prefix = '';
                switch(log.type) {
                    case 'info': colorClass = 'text-primary'; prefix = '[INFO]'; break;
                    case 'success': colorClass = 'text-green-400'; prefix = '[SUCCESS]'; break;
                    case 'error': colorClass = 'text-error'; prefix = '[ERROR]'; break;
                    case 'data': colorClass = 'text-on-surface'; prefix = '[DATA]'; break;
                }
                return (
                  <div key={idx} className={`mb-1 ${colorClass}`}>
                    <span className="opacity-40">{`[${new Date().toLocaleTimeString()}]`}</span> {prefix} {log.text}
                  </div>
                )
             })}
            {loading && <div className="inline-block w-2 h-4 bg-primary animate-pulse ml-1"></div>}
            <div ref={logsEndRef} />
          </div>

          {/* Terminal Footer Stats */}
          <div className="bg-surface px-4 py-1 border-t border-outline-variant flex justify-between items-center text-[10px] uppercase font-mono tracking-widest text-on-surface-variant opacity-60">
            <div className="flex gap-4">
              <span>Ln: {logs.length}, Col: 1</span>
              <span>UTF-8</span>
            </div>
            <div className="flex gap-4">
              <span>Status: {loading ? 'ACTIVE' : 'IDLE'}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
