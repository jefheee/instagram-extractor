'use client';

import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function DocsPage() {
  const { t } = useLanguage();

  return (
    <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 w-full flex-1">
      <div className="w-full max-w-[900px] mx-auto">
        <header className="mb-12">
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

        <section className="mb-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-6 w-1 bg-primary"></div>
            <h2 className="text-2xl font-semibold text-on-surface">{t('docs.arch.title')}</h2>
          </div>
          <p className="text-base text-on-surface-variant mb-6 leading-relaxed">
            {t('docs.arch.desc1')}
          </p>

          <div className="bg-[#050505] rounded-lg overflow-hidden border border-outline-variant font-mono">
            <div className="flex items-center justify-between px-4 py-2 bg-surface-container-high border-b border-outline-variant">
              <span className="text-[11px] text-on-surface-variant">route.ts (SSE Stream)</span>
              <span className="text-[10px] tracking-widest text-outline">NODE.JS</span>
            </div>
            <div className="p-4 overflow-x-auto text-[13px] leading-relaxed text-[#0095f6]">
{`const child = spawn('python', ['-m', 'instaloader', ...args]);

child.stdout.on('data', (data) => {
  const lines = data.toString().split('\\n');
  lines.forEach((line) => {
    controller.enqueue(encoder.encode(\`data: \${JSON.stringify({ log: line })}\\n\\n\`));
  });
});`}
            </div>
          </div>
        </section>

        <section className="mb-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-6 w-1 bg-primary"></div>
            <h2 className="text-2xl font-semibold text-on-surface">{t('docs.auth.title')}</h2>
          </div>
          <p className="text-base text-on-surface-variant mb-4">
            {t('docs.auth.desc')}
          </p>
          <div className="bg-[#050505] rounded-lg overflow-hidden border border-outline-variant font-mono mb-4">
            <div className="p-4 overflow-x-auto text-[13px] leading-relaxed">
              <span className="text-primary">$</span> <span className="text-on-surface">python -m instaloader --login=SEU_USUARIO</span><br />
              <span className="text-outline">[*] {t('docs.auth.cli1')}</span><br />
              <span className="text-outline">[*] {t('docs.auth.cli2')}</span><br />
              <span className="text-outline">[*] (Windows) %LOCALAPPDATA%\\Instaloader\\session-SEU_USUARIO</span>
            </div>
          </div>
          <p className="text-sm text-on-surface-variant">{t('docs.auth.footer')}</p>
        </section>

        <section className="mb-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-6 w-1 bg-primary"></div>
            <h2 className="text-2xl font-semibold text-on-surface">{t('docs.flags.title')}</h2>
          </div>
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm text-on-surface-variant">
              <thead className="text-[11px] uppercase tracking-widest bg-surface-container-high text-on-surface border-b border-outline-variant font-mono">
                <tr>
                  <th scope="col" className="px-6 py-4">{t('docs.table.ui')}</th>
                  <th scope="col" className="px-6 py-4">{t('docs.table.flag')}</th>
                  <th scope="col" className="px-6 py-4">{t('docs.table.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4 font-mono text-on-surface">{t('dash.scope.noVideos')}</td>
                  <td className="px-6 py-4 font-mono text-primary">--no-videos</td>
                  <td className="px-6 py-4 text-xs">{t('docs.flag.noVideos.desc')}</td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4 font-mono text-on-surface">{t('dash.scope.noCaptions')}</td>
                  <td className="px-6 py-4 font-mono text-primary">--no-captions</td>
                  <td className="px-6 py-4 text-xs">{t('docs.flag.noCaptions.desc')}</td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4 font-mono text-on-surface">{t('dash.scope.noMetadata')}</td>
                  <td className="px-6 py-4 font-mono text-primary">--no-metadata-json</td>
                  <td className="px-6 py-4 text-xs">{t('docs.flag.noMetadata.desc')}</td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4 font-mono text-on-surface">{t('dash.scope.noProfilePic')}</td>
                  <td className="px-6 py-4 font-mono text-primary">--no-profile-pic</td>
                  <td className="px-6 py-4 text-xs">{t('docs.flag.noProfilePic.desc')}</td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4 font-mono text-on-surface">{t('dash.scope.stories')}</td>
                  <td className="px-6 py-4 font-mono text-primary">--stories / --highlights</td>
                  <td className="px-6 py-4 text-xs">{t('docs.flag.stories.desc')}</td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4 font-mono text-on-surface">{t('dash.scope.fastUpdate')}</td>
                  <td className="px-6 py-4 font-mono text-primary">--fast-update</td>
                  <td className="px-6 py-4 text-xs">{t('docs.flag.fastUpdate.desc')}</td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4 font-mono text-on-surface">{t('dash.filters.title')}</td>
                  <td className="px-6 py-4 font-mono text-primary">--post-filter</td>
                  <td className="px-6 py-4 text-xs">{t('docs.flag.filters.desc')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-6 w-1 bg-primary"></div>
            <h2 className="text-2xl font-semibold text-on-surface">{t('docs.files.title')}</h2>
          </div>
          <p className="text-base text-on-surface-variant mb-6">
            {t('docs.files.desc')}
          </p>
          <div className="space-y-4">
            <div className="p-4 bg-surface-container border border-outline-variant rounded-lg flex flex-col sm:flex-row sm:items-start gap-4">
               <div className="font-mono text-primary bg-background px-3 py-1 rounded text-[13px] border border-outline-variant shrink-0 text-center">.jpg / .mp4</div>
               <div>
                  <h4 className="font-semibold text-on-surface mb-1">{t('docs.files.raw.title')}</h4>
                  <p className="text-sm text-on-surface-variant">{t('docs.files.raw.desc')}</p>
               </div>
            </div>
            <div className="p-4 bg-surface-container border border-outline-variant rounded-lg flex flex-col sm:flex-row sm:items-start gap-4">
               <div className="font-mono text-primary bg-background px-3 py-1 rounded text-[13px] border border-outline-variant shrink-0 text-center w-[120px]">.txt</div>
               <div>
                  <h4 className="font-semibold text-on-surface mb-1">{t('docs.files.txt.title')}</h4>
                  <p className="text-sm text-on-surface-variant">{t('docs.files.txt.desc')}</p>
               </div>
            </div>
            <div className="p-4 bg-surface-container border border-outline-variant rounded-lg flex flex-col sm:flex-row sm:items-start gap-4">
               <div className="font-mono text-primary bg-background px-3 py-1 rounded text-[13px] border border-outline-variant shrink-0 text-center w-[120px]">.json.xz</div>
               <div>
                  <h4 className="font-semibold text-on-surface mb-1">{t('docs.files.json.title')}</h4>
                  <p className="text-sm text-on-surface-variant">{t('docs.files.json.desc')}</p>
               </div>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
