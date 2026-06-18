import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, type } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL ou @username é obrigatório.' }, { status: 400 });
    }

    const cleanUrl = url.trim();
    let target = cleanUrl;
    
    if (target.startsWith('@')) {
      target = target.substring(1);
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        const sendLog = (msg: string) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ log: msg })}\n\n`));
        };

        sendLog(`[Sistema] Iniciando extração para: ${target}`);
        
        let args = ['--dirname-pattern=downloads/{profile}', target];
        
        if (process.env.INSTAGRAM_SESSION_ID) {
           sendLog(`[Sistema] INSTAGRAM_SESSION_ID detectado. Utilizando fallback deslogado inicialmente. Se falhar, você deverá logar o instaloader via CLI.`);
        }

        const child = spawn('instaloader', args);

        child.stdout.on('data', (data) => {
          const lines = data.toString().split('\n');
          lines.forEach((line: string) => {
            if (line.trim()) sendLog(`[stdout] ${line.trim()}`);
          });
        });

        child.stderr.on('data', (data) => {
          const lines = data.toString().split('\n');
          lines.forEach((line: string) => {
            if (line.trim()) sendLog(`[stderr] ${line.trim()}`);
          });
        });

        child.on('close', (code) => {
          sendLog(`[Sistema] Processo finalizado com código ${code}`);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
        });
        
        child.on('error', (err) => {
           sendLog(`[Erro] Falha ao iniciar processo: ${err.message}`);
           controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
           controller.close();
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('Request parsing/processing error:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}
