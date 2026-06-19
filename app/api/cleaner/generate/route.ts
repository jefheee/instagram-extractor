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

    // Attempt to call local Ollama
    const response = await fetch('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2:1.5b',
        prompt: prompt,
        system: systemPrompt,
        stream: false,
        format: 'json'
      }),
    });

    if (!response.ok) {
      throw new Error('Falha ao conectar com Ollama local em localhost:11434.');
    }

    const data = await response.json();
    let rawOutput = data.response || "";

    // Limpeza de string backend (Regex) para remover eventuais blocos de markdown
    rawOutput = rawOutput.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

    let keywords = [];
    try {
      keywords = JSON.parse(rawOutput);
      if (!Array.isArray(keywords)) {
        if (typeof keywords === 'object' && keywords !== null) {
          // Attempt rescue if it returned an object like {"keywords": [...]}
          const vals = Object.values(keywords);
          const potentialArray = vals.find(v => Array.isArray(v));
          keywords = potentialArray || Object.values(keywords); 
        } else {
          throw new Error('Parsed JSON is not an array.');
        }
      }
    } catch (e) {
      console.error("Failed to parse JSON from Ollama:", rawOutput);
      return new Response(JSON.stringify({ error: 'Ollama JSON Parse Error: O modelo retornou um formato inválido ou não converteu para JSON.' }), { status: 500 });
    }

    if (!keywords || keywords.length === 0) {
      return new Response(JSON.stringify({ error: 'Ollama retornou um array vazio.' }), { status: 500 });
    }

    return new Response(JSON.stringify({ keywords }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
