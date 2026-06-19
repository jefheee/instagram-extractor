import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), { status: 400 });
    }

    const systemPrompt = `Você é um Especialista em Triagem de Dados e Engenharia de Prompt.
Sua tarefa é analisar o pedido do usuário e gerar NO MÍNIMO 20 palavras-chave, frases curtas ou expressões regulares comuns (em pt-br) que aparecem no tipo de conteúdo indesejado que ele deseja filtrar (panfletos, avisos, texto sobreposto).
Você DEVE retornar ESTRITAMENTE um array JSON válido de strings.
Não inclua texto conversacional, markdown ou pontuações isoladas. NÃO ESCREVA ABSOLUTAMENTE NADA ALÉM DO ARRAY JSON.
Exemplo de saída esperada:
["feriado", "comunicado", "reunião de pais", "recesso escolar", "atenção responsáveis", "nota de falecimento", "boletim"]`;

    // Call Ollama with stream: true
    const ollamaResponse = await fetch('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2:1.5b',
        prompt: prompt,
        system: systemPrompt,
        stream: true,
        format: 'json'
      }),
    });

    if (!ollamaResponse.ok) {
      throw new Error('Falha ao conectar com Ollama local em localhost:11434.');
    }

    if (!ollamaResponse.body) {
      throw new Error('A resposta do Ollama está vazia (no body).');
    }

    const reader = ollamaResponse.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const parsed = JSON.parse(line);
                if (parsed.response) {
                  controller.enqueue(encoder.encode(parsed.response));
                }
              } catch (e) {
                // Ignore parsing errors for partial or malformed lines
              }
            }
          }

          if (buffer.trim()) {
            try {
              const parsed = JSON.parse(buffer);
              if (parsed.response) {
                controller.enqueue(encoder.encode(parsed.response));
              }
            } catch (e) {
              // Ignore
            }
          }
          controller.close();
        } catch (err: any) {
          controller.error(err);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
