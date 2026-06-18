'use client';

import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Terminal, Shield, Settings, Info } from 'lucide-react';

export default function DocsPage() {
  const { t } = useLanguage();

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 pb-20">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
          {t('docs.title')}
        </h1>
        <p className="text-[#a8a8a8] text-lg">
          {t('docs.intro')}
        </p>
      </div>

      <div className="space-y-12">
        {/* Auth Section */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-[#0095f6]" />
            <h2 className="text-xl font-bold text-white">{t('docs.auth.title')}</h2>
          </div>
          <div className="bg-[#121212] border border-[#262626] rounded-xl p-5">
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              {t('docs.auth.desc')}
            </p>
            <div className="bg-black p-4 rounded-lg border border-[#262626] font-mono text-sm text-gray-300">
              <span className="text-gray-500">$</span> python -m instaloader --login=USERNAME
            </div>
            <p className="text-xs text-gray-500 mt-3">
              * A sessão gerada será criptografada e armazenada automaticamente no seu diretório local (`~/.config/instaloader` ou `%LOCALAPPDATA%`).
            </p>
          </div>
        </section>

        {/* Core Architecture */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-6 h-6 text-[#0095f6]" />
            <h2 className="text-xl font-bold text-white">Arquitetura de Extração</h2>
          </div>
          <div className="bg-[#121212] border border-[#262626] rounded-xl p-5">
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              O InstaVault atua como um <strong>Local Wrapper</strong>. O backend Node.js nunca envia requisições HTTP diretas para o Instagram. Em vez disso, ele empacota suas configurações na UI e injeta parâmetros diretamente no binário Python no SO host.
            </p>
            <pre className="bg-black p-4 rounded-lg border border-[#262626] font-mono text-xs text-[#0095f6] overflow-x-auto">
              {`spawn('python', [
  '-m', 'instaloader',
  '--dirname-pattern=downloads/{profile}',
  '--post-filter=likes >= 100',
  ':saved'
]);`}
            </pre>
          </div>
        </section>

        {/* Flags Table */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Terminal className="w-6 h-6 text-[#0095f6]" />
            <h2 className="text-xl font-bold text-white">{t('docs.flags.title')}</h2>
          </div>
          <div className="bg-[#121212] border border-[#262626] rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="text-xs uppercase bg-[#1a1a1a] text-gray-300 border-b border-[#262626]">
                <tr>
                  <th scope="col" className="px-6 py-4">{t('docs.table.flag')}</th>
                  <th scope="col" className="px-6 py-4">{t('docs.table.desc')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                <tr className="hover:bg-[#1a1a1a]/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-[#0095f6]">--count=N</td>
                  <td className="px-6 py-4">Limita a extração aos primeiros N posts do perfil. Excelente para testar o bypass.</td>
                </tr>
                <tr className="hover:bg-[#1a1a1a]/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-[#0095f6]">--post-filter="expr"</td>
                  <td className="px-6 py-4">Permite avaliar metadados dinamicamente. O InstaVault converte inputs (Mín. Curtidas) para: `likes >= X and comments >= Y`.</td>
                </tr>
                <tr className="hover:bg-[#1a1a1a]/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-[#0095f6]">:saved</td>
                  <td className="px-6 py-4">Alvo mágico que instrui a CLI a ignorar alvos textuais e baixar a coleção de posts salvos da sua conta (Requer Sessão Ativa).</td>
                </tr>
                <tr className="hover:bg-[#1a1a1a]/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-[#0095f6]">:tagged</td>
                  <td className="px-6 py-4">Modificador de alvo que extrai fotos onde o perfil alvo foi marcado.</td>
                </tr>
                <tr className="hover:bg-[#1a1a1a]/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-[#0095f6]">--fast-update</td>
                  <td className="px-6 py-4">Pula automaticamente extrações caso a mídia já exista no diretório de destino. Previne API limits.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
