'use client';

import React, { useState, useRef, useEffect, FormEvent } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Loader2, Sparkles, X, Plus } from 'lucide-react';

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

export default function CleanerPage() {
  const { t } = useLanguage();
  
  const [sourceDir, setSourceDir] = useState('');
  const [destDir, setDestDir] = useState('');
  const [prompt, setPrompt] = useState('');
  const [level, setLevel] = useState('standard'); // soft, standard, aggressive
  
  const [keywords, setKeywords] = useState<string[]>(['aviso', 'comunicado', 'feriado', 'atenção']);
  const [newKeyword, setNewKeyword] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [enableOcr, setEnableOcr] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState({ processed: 0, total: 0 });
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleGenerateRules = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setIsRunning(true);
    setLogs([
      { status: 'info', message: '[SYSTEM] Iniciando geração de palavras-chave...' },
      { status: 'info', message: '[SYSTEM] Conectando ao Ollama em localhost:11434...' },
      { status: 'info', message: '[SYSTEM] Enviando prompt. Aguardando processamento da CPU...' }
    ]);
    try {
      const res = await fetch('/api/cleaner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha na resposta do servidor.');
      }

      if (!res.body) {
        throw new Error('A resposta do stream está vazia.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedText = '';

      setLogs(prev => [
        ...prev,
        { status: 'info', message: '[OLLAMA LIVE]: ' }
      ]);

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          accumulatedText += chunk;
          
          setLogs(prev => {
            const nextLogs = [...prev];
            let lastLiveIdx = -1;
            for (let i = nextLogs.length - 1; i >= 0; i--) {
              const msg = nextLogs[i]?.message;
              if (msg && msg.startsWith('[OLLAMA LIVE]:')) {
                lastLiveIdx = i;
                break;
              }
            }
            if (lastLiveIdx !== -1) {
              nextLogs[lastLiveIdx] = {
                status: 'info',
                message: `[OLLAMA LIVE]: ${accumulatedText}`
              };
            }
            return nextLogs;
          });
        }
      }

      // Limpeza de blocos de código markdown se houver
      const cleanedText = accumulatedText.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
      let parsedKeywords = JSON.parse(cleanedText);
      
      if (!Array.isArray(parsedKeywords)) {
        if (typeof parsedKeywords === 'object' && parsedKeywords !== null) {
          const vals = Object.values(parsedKeywords);
          const potentialArray = vals.find(v => Array.isArray(v));
          parsedKeywords = potentialArray || Object.values(parsedKeywords);
        } else {
          throw new Error('O formato retornado não é um array.');
        }
      }

      // Filtro de Sanidade e Pós-Processamento
      const protectedTerms = ['aluno', 'alunos', 'professor', 'escola', 'pessoal', 'evento'];
      const sanitizedKeywords = parsedKeywords
        .map((k: any) => String(k).trim())
        .filter((k: string) => {
          if (!k) return false;
          if (k.length < 3) return false;
          const lowerWord = k.toLowerCase();
          const isProtected = protectedTerms.some(term => lowerWord.includes(term));
          return !isProtected;
        });

      if (sanitizedKeywords.length === 0) {
        throw new Error('Filtro de sanidade resultou em zero termos válidos.');
      }

      const merged = Array.from(new Set([...keywords, ...sanitizedKeywords]));
      setKeywords(merged);
      setPrompt('');
      setLogs(prev => [
        ...prev,
        { status: 'info', message: `[SYSTEM] Sucesso! ${sanitizedKeywords.length} palavras-chave geradas e adicionadas após filtro.` }
      ]);

    } catch (e: any) {
      console.error(e);
      setLogs(prev => [...prev, { status: 'error', message: `[SYSTEM] Erro: ${e.message}` }]);
      setLogs(prev => [...prev, { status: 'warning', message: '[SYSTEM] Ativando Fallback de Segurança...' }]);
      const fallback = ['aviso', 'nota', 'comunicado', 'informação', 'atenção', 'feriado', 'recesso', 'reunião', 'pais', 'boletim'];
      const merged = Array.from(new Set([...keywords, ...fallback]));
      setKeywords(merged);
    } finally {
      setIsGenerating(false);
      setIsRunning(false);
    }
  };

  const removeKeyword = (kw: string) => {
    setKeywords(keywords.filter(k => k !== kw));
  };

  const addKeyword = (e: FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    
    // Divide por vírgula ou espaço
    const splitWords = newKeyword
      .split(/[\s,]+/)
      .map(w => w.trim())
      .filter(w => w.length > 0);
      
    const uniqueNewWords = splitWords.filter(w => !keywords.includes(w));
    if (uniqueNewWords.length > 0) {
      setKeywords([...keywords, ...uniqueNewWords]);
    }
    setNewKeyword('');
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
          sensitivity: getSensitivityValue(),
          disableOcr: !enableOcr
        }),
      });

      if (!response.body) {
        throw new Error('No readable stream available');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
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
      }
    } catch (error: any) {
      setLogs(prev => [...prev, { status: 'error', message: error.message }]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] mt-16 w-full overflow-hidden flex flex-col md:flex-row gap-4 p-4 md:p-6 bg-[#0a0a0a]">
      
      {/* Configurações (Esquerda) */}
      <section className="w-full md:w-5/12 lg:w-4/12 h-full overflow-y-auto terminal-scrollbar pr-2 pb-10">
        <div className="bg-surface border border-outline-variant p-4 rounded-[4px] md:rounded-[8px] relative overflow-hidden backdrop-blur-md">
          <header className="flex items-center justify-between mb-4 border-b border-outline-variant pb-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-primary rounded-full animate-pulse"></span>
              <h2 className="text-[11px] font-mono uppercase tracking-widest text-on-surface">Copilot Configuration</h2>
            </div>
          </header>

          <div className="space-y-5">
            {/* Source & Destination */}
            <div className="space-y-4">
              <div className="space-y-1 group">
                <label className="text-[11px] font-mono text-on-surface-variant flex items-center justify-between">
                  {t('cleaner.src')}
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-black/80 px-2 py-0.5 rounded text-white">{t('cleaner.srcTooltip')}</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-mono">/</span>
                  <input 
                    className="w-full pl-8 pr-4 py-2 bg-background border border-outline-variant focus:border-primary outline-none font-mono text-[13px] text-on-surface transition-all rounded-[4px]" 
                    placeholder={t('cleaner.srcPlaceholder')} 
                    type="text"
                    value={sourceDir}
                    onChange={(e) => setSourceDir(e.target.value)}
                    disabled={isRunning}
                  />
                </div>
              </div>

              <div className="space-y-1 group">
                <label className="text-[11px] font-mono text-on-surface-variant flex items-center justify-between">
                  {t('cleaner.dest')}
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-black/80 px-2 py-0.5 rounded text-white">{t('cleaner.destTooltip')}</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-mono">/</span>
                  <input 
                    className="w-full pl-8 pr-4 py-2 bg-background border border-outline-variant focus:border-primary outline-none font-mono text-[13px] text-on-surface transition-all rounded-[4px]" 
                    placeholder={t('cleaner.destPlaceholder')} 
                    type="text"
                    value={destDir}
                    onChange={(e) => setDestDir(e.target.value)}
                    disabled={isRunning}
                  />
                </div>
              </div>
            </div>

            {/* AI Prompt Area */}
            <div className="pt-4 border-t border-outline-variant">
              <label className="text-[11px] font-mono text-on-surface-variant block mb-2">{t('cleaner.prompt')}</label>
              <div className="relative group">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t('cleaner.promptPlaceholder')}
                  className="w-full bg-background border border-outline-variant rounded-[4px] pl-3 pr-12 py-3 text-on-surface font-mono text-[12px] placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors resize-none h-20"
                  disabled={isRunning || isGenerating}
                />
                <button
                  onClick={handleGenerateRules}
                  disabled={!prompt || isRunning || isGenerating}
                  className="absolute right-2 bottom-2 p-1.5 bg-primary-container/20 text-primary hover:bg-primary-container disabled:opacity-50 disabled:hover:bg-primary-container/20 rounded-[4px] transition-colors"
                  title={t('cleaner.btn.generate')}
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Keywords */}
            <div className="bg-background/50 p-3 rounded-[4px] border border-outline-variant">
              <div className="text-[11px] font-mono text-on-surface-variant mb-3">{t('cleaner.rules.title')}</div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {keywords.map(kw => (
                  <span key={kw} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-primary-container text-[11px] font-mono text-on-primary-container">
                    {kw}
                    <button onClick={() => removeKeyword(kw)} className="hover:text-white transition-colors" disabled={isRunning}>
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
                  placeholder="Tag manual..."
                  className="flex-1 bg-background border border-outline-variant rounded-[4px] px-2 py-1.5 font-mono text-[11px] text-on-surface focus:outline-none focus:border-primary transition-colors"
                  disabled={isRunning}
                />
                <button type="submit" disabled={!newKeyword || isRunning} className="px-2 py-1.5 bg-surface-container-high text-on-surface-variant rounded-[4px] hover:text-primary transition-colors disabled:opacity-50">
                  <Plus className="w-3 h-3" />
                </button>
              </form>
            </div>

            {/* Level Selection */}
            <div className="pt-2">
              <label className="text-[11px] font-mono text-on-surface-variant flex items-center justify-between mb-3 group">
                {t('cleaner.level')}
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-black/80 px-2 py-0.5 rounded text-white">{t('cleaner.levelTooltip')}</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['soft', 'standard', 'aggressive'].map(lvl => (
                  <button 
                    key={lvl}
                    onClick={() => setLevel(lvl)}
                    disabled={isRunning}
                    className={`flex items-center justify-center gap-1 px-2 py-2 font-mono text-[11px] rounded-[4px] transition-colors border ${level === lvl ? 'bg-primary-container text-white border-primary-container' : 'bg-background border-outline-variant text-on-surface-variant hover:border-on-surface-variant disabled:opacity-50'}`}
                  >
                    {t(`cleaner.level.${lvl}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* OCR Toggle */}
            <div className="pt-4 border-t border-outline-variant mt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={enableOcr}
                    onChange={(e) => setEnableOcr(e.target.checked)}
                    disabled={isRunning}
                  />
                  <div className="w-9 h-5 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-on-surface-variant peer-checked:after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </div>
                <span className="text-[11px] font-mono text-on-surface-variant group-hover:text-on-surface transition-colors">
                  Habilitar OCR Visual (Processamento Lento)
                </span>
              </label>
            </div>

            {/* Start Button */}
            <div className="pt-4 border-t border-outline-variant mt-4">
              <button 
                onClick={startCleaning}
                disabled={!sourceDir || !destDir || isRunning}
                className="w-full bg-primary-container disabled:opacity-50 hover:bg-opacity-90 active:scale-[0.98] transition-all text-white py-4 text-lg font-bold flex items-center justify-center gap-4 rounded-[4px]"
              >
                {isRunning ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>{t('cleaner.btn.start')}</span>}
              </button>
            </div>
            
          </div>
        </div>
      </section>

      {/* Console (Direita) */}
      <section className="w-full md:w-7/12 lg:w-8/12 h-full flex flex-col overflow-hidden">
        <div className="flex-1 bg-[#050505] border border-outline-variant relative overflow-hidden flex flex-col rounded-[4px] md:rounded-[8px]">
          <div className="scanline"></div>
          
          <div className="flex items-center justify-between bg-surface-container-high px-4 py-2 border-b border-outline-variant shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-error"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-secondary"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
              </div>
              <span className="ml-2 font-mono text-[13px] text-on-surface-variant opacity-80">bash — cleaner-worker — 120x40</span>
            </div>
            {isRunning && <Loader2 className="w-3 h-3 text-primary animate-spin" />}
          </div>

          {/* Progress Bar Header */}
          {progress.total > 0 && (
            <div className="bg-[#050505] border-b border-outline-variant px-4 py-1.5 flex items-center gap-4 shrink-0">
               <div className="text-[10px] font-mono text-on-surface-variant">Progress</div>
               <div className="flex-1 h-1 bg-surface rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${(progress.processed / progress.total) * 100}%` }}
                  />
               </div>
               <div className="text-[10px] font-mono text-on-surface-variant w-12 text-right">
                 {Math.round((progress.processed / progress.total) * 100)}%
               </div>
            </div>
          )}
          
          <div className="flex-1 p-4 font-mono text-[13px] overflow-y-auto terminal-scrollbar selection:bg-primary-container selection:text-white pb-10">
             {logs.length === 0 && !isRunning && (
               <div className="text-on-tertiary-container mb-1">[SYSTEM] Ready for cleanup. Configure parameters and click start.</div>
             )}
             <div className="space-y-1">
               {logs.map((log, i) => {
                 let colorClass = 'text-on-surface-variant';
                 let prefix = '';
                 let message = log.message || log.raw || '';

                 if (log.status === 'moved') {
                   colorClass = 'text-warning'; 
                   prefix = '[DISCARDED]';
                   message = `${log.folder} -> Reason: ${log.reason}`;
                 } else if (log.status === 'kept') {
                   colorClass = 'text-green-400';
                   prefix = '[FILTERED]';
                   message = log.folder || '';
                 } else if (log.status === 'error' || log.status === 'stderr') {
                   colorClass = 'text-error';
                   prefix = '[ERROR]';
                 } else if (log.status === 'warning') {
                   colorClass = 'text-secondary';
                   prefix = '[WARN]';
                 } else if (log.status === 'info') {
                   colorClass = 'text-primary';
                   prefix = '[INFO]';
                 } else if (log.status === 'start') {
                   colorClass = 'text-primary';
                   prefix = '[START]';
                   message = `Found ${log.total} folders to process.`;
                 } else if (log.status === 'done') {
                   colorClass = 'text-green-400';
                   prefix = '[DONE]';
                   message = `Finished! Processed ${log.total}. Discarded: ${log.discarded}.`;
                 } else if (log.status === 'progress') {
                   return null; // hide progress from log lines
                 }

                 return (
                   <div key={i} className={`mb-1 ${colorClass} break-words`}>
                     <span className="opacity-40">{`[${new Date().toLocaleTimeString([], {hour12: false})}]`}</span> {prefix} {message}
                   </div>
                 )
               })}
             </div>
            {isRunning && <div className="inline-block w-2 h-4 bg-primary animate-pulse ml-1 mt-1"></div>}
            <div ref={logsEndRef} />
          </div>

          <div className="bg-surface px-4 py-1 border-t border-outline-variant flex justify-between items-center text-[10px] uppercase font-mono tracking-widest text-on-surface-variant opacity-60 shrink-0">
            <div className="flex gap-4">
              <span>Ln: {logs.filter(l => l.status !== 'progress').length}, Col: 1</span>
              <span>UTF-8</span>
            </div>
            <div className="flex gap-4">
              <span>Status: {isRunning ? 'ACTIVE' : 'IDLE'}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
