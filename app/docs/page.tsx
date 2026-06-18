'use client';

import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function DocsPage() {
  const { t } = useLanguage();

  return (
    <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 w-full flex-1">
      <div className="w-full max-w-[800px] mx-auto">
        {/* Hero Section */}
        <header className="mb-10">
          <div className="inline-flex items-center px-2 py-1 bg-surface-container-high rounded-sm mb-4">
            <span className="text-[11px] font-mono text-primary">RELEASE NOTES</span>
            <span className="mx-2 text-outline">•</span>
            <span className="text-[11px] font-mono text-on-surface-variant">LATEST: V2.4.0</span>
          </div>
          <h1 className="text-4xl text-on-surface mb-4 font-bold">
            {t('docs.title')}
          </h1>
          <p className="text-lg text-on-surface-variant max-w-2xl">
            {t('docs.intro')}
          </p>
        </header>

        {/* Section 1: Autenticação Local */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-6 w-1 bg-primary"></div>
            <h2 className="text-2xl font-semibold text-on-surface">{t('docs.auth.title')}</h2>
          </div>
          <p className="text-base text-on-surface-variant mb-6">
            {t('docs.auth.desc')}
          </p>

          {/* Terminal Code Block */}
          <div className="bg-[#050505] rounded-lg overflow-hidden border border-outline-variant font-mono">
            <div className="flex items-center justify-between px-4 py-2 bg-surface-container-high border-b border-outline-variant">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-error"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-secondary"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-primary-container"></div>
                <span className="text-[11px] text-on-surface-variant ml-2 tracking-widest">BASH</span>
              </div>
            </div>
            <div className="p-4 overflow-x-auto text-[13px] leading-relaxed">
              <span className="text-primary">$</span> <span className="text-on-surface">python -m instaloader --login=USERNAME</span><br />
              <span className="text-outline">[*] A sessão gerada será criptografada e armazenada no diretório local.</span>
            </div>
          </div>
        </section>

        <div className="h-px w-full bg-outline-variant my-12 opacity-30"></div>

        {/* Section 2: Arquitetura de Extração */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-6 w-1 bg-primary"></div>
            <h2 className="text-2xl font-semibold text-on-surface">Arquitetura de Extração</h2>
          </div>
          <p className="text-base text-on-surface-variant mb-6">
            O InstaVault atua como um <strong>Local Wrapper</strong>. O backend Node.js nunca envia requisições HTTP diretas para o Instagram. Em vez disso, ele empacota suas configurações na UI e injeta parâmetros diretamente no binário Python no SO host.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-surface-container border border-outline-variant rounded-lg">
              <h4 className="text-[11px] font-mono text-on-surface mb-1">NODE.JS MASTER</h4>
              <p className="text-[12px] text-on-surface-variant">Gerencia o pooling de conexões e a persistência em banco SQLite.</p>
            </div>
            <div className="p-4 bg-surface-container border border-outline-variant rounded-lg">
              <h4 className="text-[11px] font-mono text-on-surface mb-1">PYTHON WORKER</h4>
              <p className="text-[12px] text-on-surface-variant">Executa o scraping real usando threads isoladas e proxies rotativos.</p>
            </div>
            <div className="p-4 bg-surface-container border border-outline-variant rounded-lg">
              <h4 className="text-[11px] font-mono text-on-surface mb-1">IPC BRIDGE</h4>
              <p className="text-[12px] text-on-surface-variant">Comunicação via Standard Streams (STDIN/STDOUT) em formato JSON.</p>
            </div>
          </div>

          <div className="bg-[#050505] rounded-lg overflow-hidden border border-outline-variant font-mono">
            <div className="flex items-center justify-between px-4 py-2 bg-surface-container-high border-b border-outline-variant">
              <span className="text-[11px] text-on-surface-variant">worker_spawner.js</span>
              <span className="text-[10px] tracking-widest text-outline">NODE.JS v18+</span>
            </div>
            <div className="p-4 overflow-x-auto text-[13px] leading-relaxed text-[#0095f6]">
{`spawn('python', [
  '-m', 'instaloader',
  '--dirname-pattern=downloads/{profile}',
  '--post-filter=likes >= 100',
  ':saved'
]);`}
            </div>
          </div>
        </section>
        
        {/* Flags Table */}
        <section className="mb-20">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-6 w-1 bg-primary"></div>
            <h2 className="text-2xl font-semibold text-on-surface">{t('docs.flags.title')}</h2>
          </div>
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm text-on-surface-variant">
              <thead className="text-[11px] uppercase tracking-widest bg-surface-container-high text-on-surface border-b border-outline-variant font-mono">
                <tr>
                  <th scope="col" className="px-6 py-4">{t('docs.table.flag')}</th>
                  <th scope="col" className="px-6 py-4">{t('docs.table.desc')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4 font-mono text-primary">--count=N</td>
                  <td className="px-6 py-4">Limita a extração aos primeiros N posts do perfil.</td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4 font-mono text-primary">--post-filter="expr"</td>
                  <td className="px-6 py-4">Permite avaliar metadados dinamicamente. O InstaVault converte inputs (Mín. Curtidas) para: \`likes >= X and comments >= Y\`.</td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4 font-mono text-primary">:saved</td>
                  <td className="px-6 py-4">Alvo mágico que instrui a CLI a ignorar alvos textuais e baixar a coleção de posts salvos.</td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4 font-mono text-primary">--fast-update</td>
                  <td className="px-6 py-4">Pula automaticamente extrações caso a mídia já exista no diretório de destino.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </main>
  );
}
