import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT =
  "Você escreve mensagens de WhatsApp para um vendedor de uma revenda de embarcações e veículos de lazer enviar propostas comerciais personalizadas a um cliente específico. Use português do Brasil, tom cordial e profissional, sem emojis exagerados (0 a 2). Dirija-se ao cliente pelo nome, mencione o produto e resuma as condições de pagamento informadas, e convide o cliente a tirar dúvidas ou confirmar o interesse. Não invente informações que não foram fornecidas. Responda apenas com o texto da mensagem, sem saudações genéricas como 'Prezado(a)' e sem explicações.";

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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`,
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
    const { provider, clienteNome, produtoNome, valorTotal, entradaPercentual, parcelas, dataPrevistaEntrega, nomeEmpresa } =
      await req.json();

    if (!clienteNome || !produtoNome) {
      return new Response(JSON.stringify({ error: "clienteNome e produtoNome são obrigatórios." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const promptPartes = [
      `Cliente: ${clienteNome}`,
      `Produto: ${produtoNome}`,
      valorTotal ? `Valor total: R$ ${Number(valorTotal).toLocaleString("pt-BR")}` : null,
      entradaPercentual ? `Entrada: ${entradaPercentual}%` : null,
      Array.isArray(parcelas) && parcelas.length > 0
        ? `Parcelamento: ${parcelas.map((p: { percentual: number }, i: number) => `${i + 1}ª parcela ${p.percentual}%`).join(", ")}`
        : null,
      dataPrevistaEntrega ? `Previsão de entrega: ${dataPrevistaEntrega}` : null,
      nomeEmpresa ? `Empresa: ${nomeEmpresa}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const prompt = `${promptPartes}\n\nEscreva a mensagem de WhatsApp para enviar essa proposta ao cliente.`;

    const mensagem = provider === "gemini" ? await gerarComGemini(prompt) : await gerarComClaude(prompt);

    return new Response(JSON.stringify({ mensagem }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Erro ao gerar mensagem." }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
