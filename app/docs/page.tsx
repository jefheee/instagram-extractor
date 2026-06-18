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
            InstaVault Deep Dive Documentation
          </h1>
          <p className="text-lg text-on-surface-variant max-w-2xl">
            Entenda o funcionamento interno da arquitetura local do InstaVault, o fluxo de comunicação de Server-Sent Events, os comandos de autenticação nativos e o que cada switch avançado executa no seu sistema operacional.
          </p>
        </header>

        {/* Section: Architecture */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-6 w-1 bg-primary"></div>
            <h2 className="text-2xl font-semibold text-on-surface">Arquitetura de Comunicação (SSE)</h2>
          </div>
          <p className="text-base text-on-surface-variant mb-6 leading-relaxed">
            O InstaVault não é um "backend na nuvem" tradicional. Ele atua como um <strong>Local Wrapper</strong>, envelopando o CLI do Instaloader de maneira segura e persistente.
            A comunicação flui através de <strong>Server-Sent Events (SSE)</strong>: a interface Next.js despacha configurações para uma rota de API (`/api/download/route.ts`), que invoca um <code>spawn</code> do processo Python no host. Toda a saída padrão (`stdout` e `stderr`) é capturada assincronamente e "streamada" em tempo real de volta para o cliente, alimentando o Terminal View sem timeouts convencionais de HTTP.
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

        {/* Section: Initialization */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-6 w-1 bg-primary"></div>
            <h2 className="text-2xl font-semibold text-on-surface">Guia de Inicialização do Motor Local (Auth)</h2>
          </div>
          <p className="text-base text-on-surface-variant mb-4">
            Para extrair dados contínuos sem bloqueios do Instagram (conteúdo de perfil fechado, stories ou salvos), é necessário gerar um estado de sessão criptografada no sistema operacional host. O InstaVault detectará e reaproveitará essa sessão automaticamente.
          </p>
          <div className="bg-[#050505] rounded-lg overflow-hidden border border-outline-variant font-mono mb-4">
            <div className="p-4 overflow-x-auto text-[13px] leading-relaxed">
              <span className="text-primary">$</span> <span className="text-on-surface">python -m instaloader --login=SEU_USUARIO</span><br />
              <span className="text-outline">[*] O CLI solicitará sua senha.</span><br />
              <span className="text-outline">[*] Após logar, o cookie de sessão é persistido localmente em:</span><br />
              <span className="text-outline">[*] (Windows) %LOCALAPPDATA%\\Instaloader\\session-SEU_USUARIO</span>
            </div>
          </div>
          <p className="text-sm text-on-surface-variant">Após este comando, certifique-se de configurar a variável de ambiente <code>IG_USERNAME</code> no <code>.env.local</code> do projeto Next.js, ou o sistema forçará modo anônimo.</p>
        </section>

        {/* Section: Flags Breakdown */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-6 w-1 bg-primary"></div>
            <h2 className="text-2xl font-semibold text-on-surface">Tabela Exaustiva de Funcionalidades</h2>
          </div>
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm text-on-surface-variant">
              <thead className="text-[11px] uppercase tracking-widest bg-surface-container-high text-on-surface border-b border-outline-variant font-mono">
                <tr>
                  <th scope="col" className="px-6 py-4">Switch UI</th>
                  <th scope="col" className="px-6 py-4">Flag Subjacente</th>
                  <th scope="col" className="px-6 py-4">Ação Exata no Terminal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4 font-mono text-on-surface">Ignorar Vídeos</td>
                  <td className="px-6 py-4 font-mono text-primary">--no-videos</td>
                  <td className="px-6 py-4 text-xs">Pula o download de `.mp4`. Economiza banda ao baixar apenas metadados/fotos.</td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4 font-mono text-on-surface">Ignorar Legendas</td>
                  <td className="px-6 py-4 font-mono text-primary">--no-captions</td>
                  <td className="px-6 py-4 text-xs">Desativa a geração do arquivo `.txt` contendo a legenda descritiva do post.</td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4 font-mono text-on-surface">Ignorar Metadados</td>
                  <td className="px-6 py-4 font-mono text-primary">--no-metadata-json</td>
                  <td className="px-6 py-4 text-xs">Impede a criação do pacote `.json.xz` bruto da Graph API do Instagram.</td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4 font-mono text-on-surface">Ignorar Foto Perfil</td>
                  <td className="px-6 py-4 font-mono text-primary">--no-profile-pic</td>
                  <td className="px-6 py-4 text-xs">Geralmente injetado automaticamente para evitar lixo no diretório de destino.</td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4 font-mono text-on-surface">Baixar Stories/Destaques</td>
                  <td className="px-6 py-4 font-mono text-primary">--stories / --highlights</td>
                  <td className="px-6 py-4 text-xs">Extrai metadados voláteis (Requer Autenticação e Sessão local).</td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4 font-mono text-on-surface">Atualização Rápida</td>
                  <td className="px-6 py-4 font-mono text-primary">--fast-update</td>
                  <td className="px-6 py-4 text-xs">Interrompe a raspagem de um perfil quando o sistema atinge o primeiro arquivo que já existe localmente. Ideal para CRON Jobs.</td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4 font-mono text-on-surface">Filtros de Engajamento</td>
                  <td className="px-6 py-4 font-mono text-primary">--post-filter</td>
                  <td className="px-6 py-4 text-xs">O InstaVault converte "Min Curtidas" e "Min Comentários" para um eval dinâmico: `likes >= X and comments >= Y`.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section: File Breakdown */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-6 w-1 bg-primary"></div>
            <h2 className="text-2xl font-semibold text-on-surface">Breakdown de Arquivos de Saída</h2>
          </div>
          <p className="text-base text-on-surface-variant mb-6">
            O InstaVault estrutura os downloads em diretórios atrelados à tag de perfil (`targetDir/{"{profile}"}`). Dentro desse diretório isolado, cada postagem extraída gera o seguinte conjunto de artefatos padrão:
          </p>
          <div className="space-y-4">
            <div className="p-4 bg-surface-container border border-outline-variant rounded-lg flex flex-col sm:flex-row sm:items-start gap-4">
               <div className="font-mono text-primary bg-background px-3 py-1 rounded text-[13px] border border-outline-variant shrink-0 text-center">.jpg / .mp4</div>
               <div>
                  <h4 className="font-semibold text-on-surface mb-1">Mídia Bruta (Raw Media)</h4>
                  <p className="text-sm text-on-surface-variant">A imagem ou vídeo original em alta resolução. Caso um carrossel seja baixado, o sufixo numérico será incrementado.</p>
               </div>
            </div>
            <div className="p-4 bg-surface-container border border-outline-variant rounded-lg flex flex-col sm:flex-row sm:items-start gap-4">
               <div className="font-mono text-primary bg-background px-3 py-1 rounded text-[13px] border border-outline-variant shrink-0 text-center w-[120px]">.txt</div>
               <div>
                  <h4 className="font-semibold text-on-surface mb-1">Legenda Limpa (Caption Payload)</h4>
                  <p className="text-sm text-on-surface-variant">Instruído pela flag `--post-metadata-txt={"{caption}"}`, o InstaVault gera um arquivo .txt legível que contém unicamente o texto da legenda redigido, pronto para análise semântica ou NLP.</p>
               </div>
            </div>
            <div className="p-4 bg-surface-container border border-outline-variant rounded-lg flex flex-col sm:flex-row sm:items-start gap-4">
               <div className="font-mono text-primary bg-background px-3 py-1 rounded text-[13px] border border-outline-variant shrink-0 text-center w-[120px]">.json.xz</div>
               <div>
                  <h4 className="font-semibold text-on-surface mb-1">Dump da Graph API do Instagram</h4>
                  <p className="text-sm text-on-surface-variant">Um binário compactado via XZ contendo o payload inteiro da API privada do Instagram para a referida mídia. Útil para extrair timestamps absolutos, metadados de localização ou tags em nível de código.</p>
               </div>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
