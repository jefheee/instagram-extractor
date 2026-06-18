import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, type, targetDir, options } = body;

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
        
        let finalDirPattern = targetDir && targetDir.trim() !== '' 
          ? `${targetDir.trim()}/{profile}`.replace(/\\/g, '/') 
          : 'downloads/{profile}';

        let args: string[] = [];
        
        if (process.env.IG_USERNAME) {
           sendLog(`[Sistema] IG_USERNAME detectado. Iniciando sessão com: ${process.env.IG_USERNAME}`);
           args.push(`--login=${process.env.IG_USERNAME}`);
        } else {
           sendLog(`[Sistema] Modo anônimo. Defina IG_USERNAME no .env para conteúdo restrito.`);
        }

        args.push(`--dirname-pattern=${finalDirPattern}`);
        
        if (options) {
          if (options.count && options.count.trim() !== '') {
            args.push(`--count=${options.count}`);
          }
          
          let filterConditions = [];
          if (options.minLikes && options.minLikes.toString().trim() !== '' && Number(options.minLikes) > 0) {
            filterConditions.push(`likes >= ${options.minLikes}`);
          }
          if (options.minComments && options.minComments.toString().trim() !== '' && Number(options.minComments) > 0) {
            filterConditions.push(`comments >= ${options.minComments}`);
          }
          if (filterConditions.length > 0) {
            args.push(`--post-filter=${filterConditions.join(' and ')}`);
          }

          if (options.filenamePattern && options.filenamePattern.trim() !== '') {
            args.push(`--filename-pattern=${options.filenamePattern}`);
          }

          if (options.noVideos) args.push('--no-videos');
          
          if (options.noCaptions) {
            args.push('--no-captions');
          } else {
            args.push('--post-metadata-txt={caption}');
          }

          if (options.noMetadata) {
            args.push('--no-metadata-json');
          }

          if (options.noProfilePic) args.push('--no-profile-pic');
          if (options.stories) args.push('--stories');
          if (options.highlights) args.push('--highlights');
          if (options.comments) args.push('--comments');
          if (options.fastUpdate) args.push('--fast-update');
        } else {
          args.push('--post-metadata-txt={caption}');
        }

        args.push('--no-video-thumbnails');
        
        if (options && options.saved) {
           args.push(':saved');
        } else if (options && options.tagged) {
           args.push(target);
           args.push(':tagged');
        } else {
           args.push(target);
        }

        const child = spawn('python', ['-m', 'instaloader', ...args]);

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
