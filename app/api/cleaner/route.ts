import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { directory, keywords, sensitivity } = body;

    if (!directory) {
      return new Response(JSON.stringify({ error: 'Directory is required' }), { status: 400 });
    }

    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      start(controller) {
        const scriptPath = path.join(process.cwd(), 'cleaner_worker.py');
        
        const args = [
          scriptPath,
          '--dir', directory,
          '--sensitivity', (sensitivity || 0).toString()
        ];
        
        if (keywords && keywords.trim()) {
          args.push('--keywords', keywords.trim());
        }

        // Add PYTHONUNBUFFERED=1 to ensure Python stdout is flushed instantly
        const pythonProcess = spawn('python', args, {
          env: { ...process.env, PYTHONUNBUFFERED: '1' }
        });

        pythonProcess.stdout.on('data', (data) => {
          const text = data.toString();
          const lines = text.split('\n').filter((line: string) => line.trim());
          for (const line of lines) {
            controller.enqueue(encoder.encode(`data: ${line}\n\n`));
          }
        });

        pythonProcess.stderr.on('data', (data) => {
          const text = data.toString();
          const log = JSON.stringify({ status: 'stderr', message: text.trim() });
          controller.enqueue(encoder.encode(`data: ${log}\n\n`));
        });

        pythonProcess.on('close', (code) => {
          const log = JSON.stringify({ status: 'process_closed', code });
          controller.enqueue(encoder.encode(`data: ${log}\n\n`));
          controller.close();
        });

        pythonProcess.on('error', (err) => {
          const log = JSON.stringify({ status: 'error', message: err.message });
          controller.enqueue(encoder.encode(`data: ${log}\n\n`));
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
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
