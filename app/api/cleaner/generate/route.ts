import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), { status: 400 });
    }

    const systemPrompt = `Você é um assistente especialista em filtragem de arquivos. 
Sua tarefa é converter o texto do usuário em um array JSON estrito contendo palavras-chave curtas em português que representem os itens que ele quer filtrar. 
Retorne APENAS um array JSON, sem texto adicional, sem explicações.
Exemplo de entrada: "Remova avisos de feriado e comunicados de pais"
Exemplo de saída: ["feriado", "comunicado", "pais", "aviso"]`;

    // Attempt to call local Ollama
    const response = await fetch('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3', // or whatever the user has, fallback to something common
        prompt: prompt,
        system: systemPrompt,
        stream: false,
        format: 'json'
      }),
    });

    if (!response.ok) {
      throw new Error('Falha ao conectar com Ollama local.');
    }

    const data = await response.json();
    
    let keywords = [];
    try {
      keywords = JSON.parse(data.response);
      if (!Array.isArray(keywords)) {
        keywords = Object.values(keywords); // Attempt rescue
      }
    } catch (e) {
      console.error("Failed to parse JSON from Ollama:", data.response);
      return new Response(JSON.stringify({ error: 'Ollama retornou formato inválido.' }), { status: 500 });
    }

    return new Response(JSON.stringify({ keywords }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
