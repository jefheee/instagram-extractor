import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, targetDir, mode, options } = body;

    let target = url || '';
    
    // 1. Parser and Sanitization via Regex
    target = target.trim();
    target = target.replace(/\?.*$/, ''); // Remove query params
    
    let isShortcode = false;
    let shortcode = '';
    
    const postMatch = target.match(/(?:\/p\/|\/reel\/|\/reels\/)([A-Za-z0-9_-]+)/);
    const storyMatch = target.match(/\/stories\/([A-Za-z0-9_.-]+)\/?([0-9]+)?/);
    
    if (postMatch && mode !== 'saved') {
      isShortcode = true;
      shortcode = postMatch[1];
    } else if (storyMatch && mode !== 'saved') {
      target = storyMatch[1]; // Set target to username
    } else {
      const profileUrlMatch = target.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9_.-]+)/);
      if (profileUrlMatch) {
         target = profileUrlMatch[1];
      }
      if (target.startsWith('@')) target = target.substring(1);
    }

    if (!target && mode !== 'saved') {
      return NextResponse.json({ error: 'URL ou username inválido.' }, { status: 400 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        const sendLog = (msg: string) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ log: msg })}\n\n`));
        };

        sendLog(`[Sistema] Modo Ativo: ${mode.toUpperCase()} | Alvo Identificado: ${mode === 'saved' ? ':saved' : (isShortcode ? shortcode : target)}`);
        
        let finalDirPattern = targetDir && targetDir.trim() !== '' 
          ? `${targetDir.trim()}/{profile}`.replace(/\\/g, '/') 
          : 'downloads/{profile}';

        let args: string[] = [];
        
        // Auth Logic & 400 Mitigation (forceAnonymous)
        if (process.env.IG_USERNAME && (!options || !options.forceAnonymous)) {
           sendLog(`[Sistema] Sessão detectada. Autenticando como: ${process.env.IG_USERNAME}`);
           args.push(`--login=${process.env.IG_USERNAME}`);
        } else if (options && options.forceAnonymous) {
           sendLog(`[Sistema] Executando em MODO ANÔNIMO FORÇADO (Sem Login).`);
        } else {
           sendLog(`[Sistema] MODO ANÔNIMO. Defina IG_USERNAME para conteúdo restrito.`);
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
          if (options.noCaptions) args.push('--no-captions');
          if (options.noMetadata) args.push('--no-metadata-json');
          if (options.noProfilePic) args.push('--no-profile-pic');
          if (options.comments) args.push('--comments');
          if (options.fastUpdate) args.push('--fast-update');
          
          if (!options.noCaptions) {
            args.push('--post-metadata-txt={caption}');
          }
        } else {
          args.push('--post-metadata-txt={caption}');
        }

        args.push('--no-video-thumbnails');
        
        // 2. Mode and Target execution setup
        if (mode === 'saved') {
           args.push(':saved');
        } else if (mode === 'stories') {
           args.push('--stories');
           args.push('--no-posts');
           args.push('--no-profile-pic');
           args.push(target);
        } else if (isShortcode || mode === 'post') {
           let codeToUse = shortcode || target;
           args.push('--');
           args.push(`-${codeToUse}`);
        } else {
           // Profile feed
           args.push(target);
           if (options && options.tagged) {
             args.push(':tagged');
           }
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
