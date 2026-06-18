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
import { useLanguage } from '../context/LanguageContext';

export default function Dashboard() {
  const { t } = useLanguage();
  
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
                  setLogs((prev) => [...prev, data.log]);
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
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
    } catch (err: any) {
      // ignore
    }
  };

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <main className="flex flex-col md:flex-row gap-4 h-[calc(100vh-3.5rem)] p-4 max-w-[1600px] mx-auto w-full">
      
      {/* Left Panel: Controls */}
      <div className="w-full md:w-3/5 lg:w-2/3 flex flex-col gap-4 overflow-y-auto scrollbar-thin scrollbar-thumb-[#262626] pr-2 pb-4">
        
        {/* Block 1 & 2 Container */}
        <div className="flex flex-col xl:flex-row gap-4 shrink-0">
          
          {/* Target Box */}
          <div className="flex-1 bg-[#121212] p-5 rounded-xl border border-[#262626] flex flex-col gap-4">
            <h3 className="text-xs font-semibold text-[#a8a8a8] uppercase tracking-wider">{t('dash.target.title')}</h3>
            <div className="flex flex-col gap-3">
              <div className="relative w-full flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder={mode === 'saved' ? t('dash.target.saved') : t('dash.target.placeholder')}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={mode === 'saved'}
                  className="w-full bg-black pl-10 pr-16 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#262626] border border-[#262626] rounded-lg disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handlePaste}
                  disabled={mode === 'saved'}
                  className="absolute right-2 px-3 py-1 text-xs font-medium text-white hover:bg-[#262626] bg-[#1a1a1a] rounded-md border border-[#262626] transition-colors disabled:opacity-50"
                >
                  {t('dash.target.paste')}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                <div className="relative flex-1 flex items-center">
                  <FolderOpen className="absolute left-3 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder={t('dash.target.dirPlaceholder')}
                    value={targetDir}
                    onChange={(e) => setTargetDir(e.target.value)}
                    className="w-full bg-black pl-10 pr-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#262626] border border-[#262626] rounded-lg"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={loading || (!url.trim() && mode !== 'saved')}
                  className="shrink-0 bg-[#0095f6] hover:bg-[#1877f2] text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed h-[42px]"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{t('dash.target.btn')}</span>}
                </button>
              </div>
            </div>
          </div>

          {/* Mode Box */}
          <div className="xl:w-72 shrink-0 bg-[#121212] p-5 rounded-xl border border-[#262626] flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-[#a8a8a8] uppercase tracking-wider">{t('dash.mode.title')}</h3>
            <div className="grid grid-cols-2 gap-2 flex-1">
              {[
                { id: 'profile', icon: User, label: 'dash.mode.profile' },
                { id: 'post', icon: ImageIcon, label: 'dash.mode.post' },
                { id: 'stories', icon: History, label: 'dash.mode.stories' },
                { id: 'saved', icon: Bookmark, label: 'dash.mode.saved' },
              ].map((m) => (
                <button 
                  key={m.id}
                  onClick={() => setMode(m.id)} 
                  className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-colors ${mode === m.id ? 'bg-[#262626] border-[#404040] text-white' : 'bg-black border-[#262626] text-gray-500 hover:text-white hover:border-[#404040]'}`}
                >
                  <m.icon className="w-4 h-4" /> 
                  <span className="text-[11px] font-medium">{t(m.label)}</span>
                </button>
              ))}
            </div>
            <div 
              onClick={() => toggleOption('forceAnonymous')}
              className={`mt-1 flex items-center justify-between p-2.5 rounded-lg border transition-colors cursor-pointer select-none ${options.forceAnonymous ? 'bg-[#262626] border-[#404040]' : 'bg-black border-[#262626]'}`}
            >
              <span className="text-[11px] font-medium text-gray-300">{t('dash.mode.anon')}</span>
              {options.forceAnonymous ? <ToggleRight className="w-4 h-4 text-white" /> : <ToggleLeft className="w-4 h-4 text-gray-600" />}
            </div>
          </div>
        </div>

        {/* Block 3 & 4 Container */}
        <div className="flex flex-col lg:flex-row gap-4 shrink-0">
          
          {/* Scope Box */}
          <div className="lg:w-1/3 shrink-0 bg-[#121212] p-5 rounded-xl border border-[#262626] flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-[#a8a8a8] uppercase tracking-wider">{t('dash.scope.title')}</h3>
            <div className="flex flex-col gap-2.5 flex-1 pr-1">
              {[
                { key: 'noVideos', label: 'dash.scope.noVideos' },
                { key: 'noCaptions', label: 'dash.scope.noCaptions' },
                { key: 'noMetadata', label: 'dash.scope.noMetadata' },
                { key: 'noProfilePic', label: 'dash.scope.noProfilePic' },
                { key: 'comments', label: 'dash.scope.comments' },
                { key: 'fastUpdate', label: 'dash.scope.fastUpdate' },
                { key: 'tagged', label: 'dash.scope.tagged' }
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-300">{t(label)}</span>
                  <button
                    type="button"
                    onClick={() => toggleOption(key as keyof typeof options)}
                    className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full border border-[#262626] transition-colors duration-200 ease-in-out focus:outline-none ${options[key as keyof typeof options] ? 'bg-white' : 'bg-black'}`}
                  >
                    <span className={`pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full shadow ring-0 transition duration-200 ease-in-out ${options[key as keyof typeof options] ? 'translate-x-3.5 bg-black' : 'translate-x-0.5 bg-gray-500'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Filters Box */}
          <div className="flex-1 bg-[#121212] p-5 rounded-xl border border-[#262626] flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-[#a8a8a8] uppercase tracking-wider">{t('dash.filters.title')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 h-full">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-400">{t('dash.filters.limit')}</label>
                  <input 
                    type="number" 
                    placeholder={t('dash.filters.limitEmpty')} 
                    value={options.count} 
                    onChange={(e) => handleOptionChange('count', e.target.value)}
                    className="w-full bg-black px-3 py-2 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#262626] border border-[#262626] rounded-md"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-gray-400">{t('dash.filters.minLikes')}</label>
                    <input 
                      type="number" 
                      placeholder="100" 
                      value={options.minLikes} 
                      onChange={(e) => handleOptionChange('minLikes', e.target.value)}
                      className="w-full bg-black px-3 py-2 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#262626] border border-[#262626] rounded-md"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-gray-400">{t('dash.filters.minComments')}</label>
                    <input 
                      type="number" 
                      placeholder="10" 
                      value={options.minComments} 
                      onChange={(e) => handleOptionChange('minComments', e.target.value)}
                      className="w-full bg-black px-3 py-2 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#262626] border border-[#262626] rounded-md"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-400">{t('dash.filters.naming')}</label>
                  <select 
                    value={options.filenamePattern}
                    onChange={(e) => handleOptionChange('filenamePattern', e.target.value)}
                    className="w-full bg-black px-3 py-2 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#262626] border border-[#262626] rounded-md appearance-none"
                  >
                    <option value="{date_utc}_UTC">{t('dash.filters.naming.default')}</option>
                    <option value="{shortcode}_{profile}">{t('dash.filters.naming.id')}</option>
                    <option value="{date_utc}_UTC_{shortcode}">{t('dash.filters.naming.full')}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

        </div>

        {error && (
          <div className="shrink-0 bg-[#2b1515] border border-[#5c2b2b] p-3 rounded-xl flex items-center gap-2 text-[#ff6b6b]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="text-xs font-medium">{error}</p>
          </div>
        )}
      </div>

      {/* Right Panel: Terminal */}
      <div className="w-full md:w-2/5 lg:w-1/3 shrink-0 bg-[#121212] rounded-xl overflow-hidden shadow-2xl p-0 flex flex-col border border-[#262626] min-h-[300px] md:min-h-0">
        <div className="bg-black p-3 border-b border-[#262626] flex items-center gap-2 shrink-0">
          <Terminal className="w-4 h-4 text-gray-400" />
          <span className="text-[11px] font-mono font-bold text-gray-300 uppercase tracking-wider">{t('dash.term.title')}</span>
          {loading && <Loader2 className="w-3 h-3 text-[#0095f6] animate-spin ml-auto" />}
        </div>
        
        <div className="flex-1 bg-[#0a0a0a] p-4 overflow-y-auto font-mono text-[11px] text-gray-400 space-y-1.5 scrollbar-thin scrollbar-thumb-[#262626] scrollbar-track-transparent">
          {logs.length === 0 ? (
            <div className="text-[#404040] flex items-center h-full justify-center text-center px-4">
              {t('dash.term.waiting')}
            </div>
          ) : (
            logs.map((log, idx) => {
              let logClass = "text-gray-400";
              if (log.includes("[Erro]") || log.includes("[stderr]")) logClass = "text-[#ff6b6b]";
              if (log.includes("[Sistema]")) logClass = "text-[#0095f6] font-medium";
              
              return (
                <div key={idx} className={`${logClass} break-all leading-relaxed`}>
                  <span className="text-[#404040] mr-2 select-none">&gt;</span>{log}
                </div>
              );
            })
          )}
          <div ref={logsEndRef} />
        </div>
      </div>

    </main>
  );
}
