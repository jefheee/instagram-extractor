import { NextRequest } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mediaUrl = searchParams.get('url');

  if (!mediaUrl) {
    return new Response('URL parameter is required', { status: 400 });
  }

  // Security Check: Validate hostname is an Instagram CDN
  try {
    const parsedUrl = new URL(mediaUrl);
    const validDomains = ['cdninstagram.com', 'fbcdn.net'];
    const isDomainValid = validDomains.some(domain => parsedUrl.hostname.endsWith(domain));
    
    if (!isDomainValid) {
      return new Response('Access denied: Invalid media domain source', { status: 400 });
    }
  } catch {
    return new Response('Access denied: Invalid URL format', { status: 400 });
  }

  try {
    const axiosConfig: any = {
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      timeout: 15000,
    };

    // Apply Proxy if configured
    if (process.env.PROXY_URL && process.env.PROXY_URL !== 'http://usuario:senha@host:porta') {
      try {
        const proxyUri = new URL(process.env.PROXY_URL);
        axiosConfig.proxy = {
          protocol: proxyUri.protocol.replace(':', ''),
          host: proxyUri.hostname,
          port: parseInt(proxyUri.port, 10),
        };
        if (proxyUri.username || proxyUri.password) {
          axiosConfig.proxy.auth = {
            username: decodeURIComponent(proxyUri.username),
            password: decodeURIComponent(proxyUri.password),
          };
        }
      } catch (err: any) {
        console.error('Proxy loading warning in proxy route:', err.message);
      }
    }

    const response = await axios.get(mediaUrl, axiosConfig);
    const contentType = String(response.headers['content-type'] || 'application/octet-stream');
    
    // Determine suffix extension
    const isVideo = contentType.startsWith('video/');
    const ext = isVideo ? 'mp4' : 'jpg';

    // Stream conversion to Web readable stream
    const nodeStream = response.data;
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk: Buffer) => {
          controller.enqueue(chunk);
        });
        nodeStream.on('end', () => {
          controller.close();
        });
        nodeStream.on('error', (err: any) => {
          controller.error(err);
        });
      },
      cancel() {
        nodeStream.destroy();
      }
    });

    return new Response(webStream, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="instagram-downloader-${Date.now()}.${ext}"`,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error: any) {
    console.error('Media proxy streaming failed:', error.message);
    return new Response(`Failed to proxy media: ${error.message}`, { status: 500 });
  }
}
