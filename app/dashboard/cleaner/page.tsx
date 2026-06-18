'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FolderSearch, Settings2, Play, AlertCircle, CheckCircle2, Trash2, Terminal } from 'lucide-react';

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
  const [directory, setDirectory] = useState('');
  const [keywords, setKeywords] = useState('');
  const [sensitivity, setSensitivity] = useState(50);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState({ processed: 0, total: 0 });
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const startCleaning = async () => {
    if (!directory) return;
    
    setIsRunning(true);
    setLogs([]);
    setProgress({ processed: 0, total: 0 });

    try {
      const response = await fetch('/api/cleaner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directory, keywords, sensitivity }),
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
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-zinc-800 rounded-lg">
          <FolderSearch className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Archive Cleaner</h1>
          <p className="text-zinc-400">Filter out digital flyers and text-heavy images from your extractions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6 shadow-xl">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Target Directory (Absolute Path)
              </label>
              <input
                type="text"
                value={directory}
                onChange={(e) => setDirectory(e.target.value)}
                placeholder="C:\Users\...\instagram-extractor\data"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                disabled={isRunning}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5 flex items-center justify-between">
                <span>Keywords to Drop</span>
                <span className="text-xs text-zinc-500 font-normal">Comma-separated</span>
              </label>
              <textarea
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="promoção, aviso, sorteio, link na bio"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 h-24 resize-none"
                disabled={isRunning}
              />
            </div>

            <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800/50">
              <label className="flex items-center justify-between text-sm font-medium text-zinc-300 mb-2">
                <span className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-zinc-400" />
                  OCR Sensitivity
                </span>
                <span className="text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded">
                  {sensitivity} chars
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="200"
                value={sensitivity}
                onChange={(e) => setSensitivity(parseInt(e.target.value))}
                className="w-full accent-emerald-500 mt-2"
                disabled={isRunning}
              />
              <p className="text-xs text-zinc-500 mt-3 leading-relaxed">
                Moves images with more than {sensitivity} characters detected using pytesseract. Set to 0 to disable OCR entirely.
              </p>
            </div>
          </div>

          <button
            onClick={startCleaning}
            disabled={!directory || isRunning}
            className="w-full flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white px-4 py-3 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-500/20"
          >
            {isRunning ? (
              <>
                <div className="w-5 h-5 border-2 border-zinc-500 border-t-emerald-500 rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>Start Cleaning</span>
              </>
            )}
          </button>
        </div>

        {/* Terminal output */}
        <div className="lg:col-span-2 bg-[#0c0c0c] border border-zinc-800 rounded-xl overflow-hidden flex flex-col h-[600px] shadow-2xl relative">
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
                        <span className="font-semibold">[MOVED]</span> {log.folder} <span className="text-zinc-500 opacity-70">({log.reason})</span>
                      </span>
                    ) : log.status === 'kept' ? (
                      <span><span className="font-semibold">[KEPT]</span>  {log.folder}</span>
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
                      null // Hide raw progress logs to avoid spam, we use the progress bar instead
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
