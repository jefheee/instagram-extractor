'use client';

import React, { useState, useRef, useEffect, FormEvent } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { FolderSearch, Sparkles, Play, Terminal, HelpCircle, X, Plus } from 'lucide-react';

interface LogEntry {
  status: string;
  message?: string;
  reason?: string;
  folder?: string;
  total?: number;
  processed?: number;
  discarded?: number;
  code?: number;
  raw?: string;
}

export default function ArchiveCleanerPage() {
  const { t } = useLanguage();
  
  const [sourceDir, setSourceDir] = useState('');
  const [destDir, setDestDir] = useState('');
  const [prompt, setPrompt] = useState('');
  const [level, setLevel] = useState('standard'); // soft, standard, aggressive
  
  const [keywords, setKeywords] = useState<string[]>(['aviso', 'comunicado', 'feriado', 'atenção']);
  const [newKeyword, setNewKeyword] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState({ processed: 0, total: 0 });
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleGenerateRules = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/cleaner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (data.keywords && Array.isArray(data.keywords)) {
        // Merge with existing avoiding duplicates
        const merged = Array.from(new Set([...keywords, ...data.keywords]));
        setKeywords(merged);
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao comunicar com Ollama local.');
    } finally {
      setIsGenerating(false);
    }
  };

  const removeKeyword = (kw: string) => {
    setKeywords(keywords.filter(k => k !== kw));
  };

  const addKeyword = (e: FormEvent) => {
    e.preventDefault();
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const getSensitivityValue = () => {
    if (level === 'soft') return 100;
    if (level === 'standard') return 50;
    return 10; // aggressive
  };

  const startCleaning = async () => {
    if (!sourceDir || !destDir) return;
    
    setIsRunning(true);
    setLogs([]);
    setProgress({ processed: 0, total: 0 });

    try {
      const response = await fetch('/api/cleaner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          source: sourceDir, 
          destination: destDir,
          keywords: keywords.join(','), 
          sensitivity: getSensitivityValue() 
        }),
      });

      if (!response.body) {
        throw new Error('No readable stream available');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n').filter(line => line.startsWith('data: '));
        
        for (const line of lines) {
          const jsonStr = line.replace(/^data: /, '');
          try {
            const parsed: LogEntry = JSON.parse(jsonStr);
            parsed.raw = jsonStr;
            setLogs(prev => [...prev, parsed]);
            
            if (parsed.status === 'progress' && parsed.processed !== undefined && parsed.total !== undefined) {
              setProgress({ processed: parsed.processed, total: parsed.total });
            }
          } catch (e) {
            setLogs(prev => [...prev, { status: 'raw', message: jsonStr, raw: jsonStr }]);
          }
        }
      }
    } catch (error: any) {
      setLogs(prev => [...prev, { status: 'error', message: error.message }]);
    } finally {
      setIsRunning(false);
    }
  };

  const getLogColor = (status: string) => {
    switch (status) {
      case 'moved': return 'text-amber-500';
      case 'kept': return 'text-emerald-500';
      case 'error': case 'stderr': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      case 'done': return 'text-blue-500';
      default: return 'text-zinc-300';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 pt-24">
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-zinc-800 rounded-lg">
          <FolderSearch className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{t('cleaner.title')}</h1>
          <p className="text-zinc-400">{t('cleaner.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chat / Configuration Panel */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6 shadow-xl flex flex-col">
          
          <div className="space-y-4">
            <div>
              <label className="flex items-center text-sm font-medium text-zinc-300 mb-1.5 group">
                {t('cleaner.src')}
                <div className="ml-2 text-zinc-500 hover:text-zinc-300 cursor-help relative">
                  <HelpCircle className="w-4 h-4" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-64 bg-zinc-800 text-xs text-zinc-200 p-2 rounded shadow-lg z-10 text-center">
                    {t('cleaner.srcTooltip')}
                  </div>
                </div>
              </label>
              <input
                type="text"
                value={sourceDir}
                onChange={(e) => setSourceDir(e.target.value)}
                placeholder={t('cleaner.srcPlaceholder')}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                disabled={isRunning}
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-zinc-300 mb-1.5 group">
                {t('cleaner.dest')}
                <div className="ml-2 text-zinc-500 hover:text-zinc-300 cursor-help relative">
                  <HelpCircle className="w-4 h-4" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-64 bg-zinc-800 text-xs text-zinc-200 p-2 rounded shadow-lg z-10 text-center">
                    {t('cleaner.destTooltip')}
                  </div>
                </div>
              </label>
              <input
                type="text"
                value={destDir}
                onChange={(e) => setDestDir(e.target.value)}
                placeholder={t('cleaner.destPlaceholder')}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                disabled={isRunning}
              />
            </div>
            
            <div className="pt-2 border-t border-zinc-800">
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                {t('cleaner.prompt')}
              </label>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t('cleaner.promptPlaceholder')}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-4 pr-12 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 h-24 resize-none"
                  disabled={isRunning || isGenerating}
                />
                <button
                  onClick={handleGenerateRules}
                  disabled={!prompt || isRunning || isGenerating}
                  className="absolute right-3 bottom-3 p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-md transition-colors disabled:opacity-50"
                  title={t('cleaner.btn.generate')}
                >
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-zinc-300">{t('cleaner.rules.title')}</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {keywords.map(kw => (
                  <span key={kw} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800 text-xs text-zinc-300">
                    {kw}
                    <button onClick={() => removeKeyword(kw)} className="text-zinc-500 hover:text-zinc-200" disabled={isRunning}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <form onSubmit={addKeyword} className="flex gap-2">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="Adicionar tag..."
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
                  disabled={isRunning}
                />
                <button type="submit" disabled={!newKeyword || isRunning} className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded text-xs hover:bg-zinc-700 disabled:opacity-50">
                  <Plus className="w-3 h-3" />
                </button>
              </form>
            </div>

            <div className="pt-2">
              <label className="flex items-center text-sm font-medium text-zinc-300 mb-2 group">
                {t('cleaner.level')}
                <div className="ml-2 text-zinc-500 hover:text-zinc-300 cursor-help relative">
                  <HelpCircle className="w-4 h-4" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-64 bg-zinc-800 text-xs text-zinc-200 p-2 rounded shadow-lg z-10 text-center">
                    {t('cleaner.levelTooltip')}
                  </div>
                </div>
              </label>
              <div className="flex items-center gap-4">
                {['soft', 'standard', 'aggressive'].map(lvl => (
                  <label key={lvl} className={`flex items-center gap-2 cursor-pointer ${isRunning ? 'opacity-50' : ''}`}>
                    <input
                      type="radio"
                      name="level"
                      value={lvl}
                      checked={level === lvl}
                      onChange={(e) => setLevel(e.target.value)}
                      disabled={isRunning}
                      className="text-emerald-500 focus:ring-emerald-500/50 bg-zinc-900 border-zinc-700"
                    />
                    <span className="text-sm text-zinc-400 capitalize">{t(`cleaner.level.${lvl}`)}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6">
            <button
              onClick={startCleaning}
              disabled={!sourceDir || !destDir || isRunning}
              className="w-full flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white px-4 py-3 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-500/20"
            >
              {isRunning ? (
                <>
                  <div className="w-5 h-5 border-2 border-zinc-500 border-t-emerald-500 rounded-full animate-spin" />
                  <span>{t('cleaner.btn.running')}</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>{t('cleaner.btn.start')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Terminal output */}
        <div className="bg-[#0c0c0c] border border-zinc-800 rounded-xl overflow-hidden flex flex-col h-[600px] shadow-2xl relative">
          <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between z-10">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-zinc-400" />
              <span className="text-sm font-medium text-zinc-300">Live Execution Log</span>
            </div>
            {progress.total > 0 && (
              <div className="flex items-center space-x-3">
                <div className="w-32 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${(progress.processed / progress.total) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-zinc-400">
                  {progress.processed}/{progress.total}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 font-mono text-[13px] leading-relaxed">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-3">
                <Terminal className="w-8 h-8 opacity-20" />
                <span className="italic">Logs will stream here in real-time...</span>
              </div>
            ) : (
              <div className="space-y-1">
                {logs.map((log, i) => (
                  <div key={i} className={`break-words ${getLogColor(log.status)} group`}>
                    <span className="text-zinc-600/50 mr-3 select-none">
                      [{new Date().toLocaleTimeString([], { hour12: false })}]
                    </span>
                    {log.status === 'moved' ? (
                      <span>
                        <span className="font-semibold">[DISCARDED]</span> {log.folder} <span className="text-zinc-500 opacity-70">({log.reason})</span>
                      </span>
                    ) : log.status === 'kept' ? (
                      <span><span className="font-semibold">[FILTERED]</span>  {log.folder}</span>
                    ) : log.status === 'error' || log.status === 'stderr' ? (
                      <span><span className="font-semibold">[ERROR]</span> {log.message}</span>
                    ) : log.status === 'warning' ? (
                      <span><span className="font-semibold">[WARN]</span> {log.message}</span>
                    ) : log.status === 'info' ? (
                      <span className="text-blue-400"><span className="font-semibold">[INFO]</span> {log.message}</span>
                    ) : log.status === 'start' ? (
                      <span className="text-blue-400"><span className="font-semibold">[START]</span> Found {log.total} folders to process.</span>
                    ) : log.status === 'done' ? (
                      <span className="block mt-4 text-emerald-400 font-semibold border-t border-zinc-800/50 pt-2">
                        ✨ Finished! Processed {log.total} folders. Discarded {log.discarded}.
                      </span>
                    ) : log.status === 'progress' ? (
                      null
                    ) : (
                      <span className="opacity-80">{log.raw}</span>
                    )}
                  </div>
                ))}
                <div ref={logsEndRef} className="h-4" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
