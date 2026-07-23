import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT =
  "Você escreve legendas curtas para posts de redes sociais (Instagram/Facebook) de uma revenda de embarcações e veículos de lazer (Náutica, Adventure e Projetos Especiais). Use português do Brasil, linguagem envolvente, poucos emojis (0 a 3), inclua uma chamada para ação no final e sugira de 3 a 6 hashtags relevantes. Responda apenas com a legenda final, sem explicações.";

async function gerarComClaude(prompt: string): Promise<string> {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    console.error("Anthropic API error", resp.status, errBody);
    let mensagem = `Erro na API da Anthropic (${resp.status})`;
    try {
      const parsed = JSON.parse(errBody);
      if (parsed?.error?.message) mensagem = parsed.error.message;
    } catch {
      // mantém mensagem padrão
    }
    throw new Error(mensagem);
  }

  const data = await resp.json();
  return data.content?.find((b: { type: string }) => b.type === "text")?.text ?? "";
}

async function gerarComGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini não está configurado. Peça ao administrador para configurar o secret GEMINI_API_KEY.");
  }

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  if (!resp.ok) {
    const errBody = await resp.text();
    console.error("Gemini API error", resp.status, errBody);
    let mensagem = `Erro na API do Gemini (${resp.status})`;
    try {
      const parsed = JSON.parse(errBody);
      if (parsed?.error?.message) mensagem = parsed.error.message;
    } catch {
      // mantém mensagem padrão
    }
    throw new Error(mensagem);
  }

  const data = await resp.json();
  return data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { nome, descricao, tom, precoBase, provider } = await req.json();

    if (!nome) {
      return new Response(JSON.stringify({ error: "Campo 'nome' é obrigatório." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const promptPartes = [
      `Produto: ${nome}`,
      descricao ? `Descrição: ${descricao}` : null,
      precoBase ? `Preço: R$ ${Number(precoBase).toLocaleString("pt-BR")}` : null,
      `Tom desejado: ${tom || "profissional e atrativo"}`,
    ]
      .filter(Boolean)
      .join("\n");

    const prompt = `${promptPartes}\n\nEscreva a legenda para o post.`;

    const legenda = provider === "gemini" ? await gerarComGemini(prompt) : await gerarComClaude(prompt);

    return new Response(JSON.stringify({ legenda }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Erro ao gerar legenda." }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
