import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { nome, descricao, tom, precoBase } = await req.json();

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
        system:
          "Você escreve legendas curtas para posts de redes sociais (Instagram/Facebook) de uma revenda de embarcações e veículos de lazer (Náutica, Adventure e Projetos Especiais). Use português do Brasil, linguagem envolvente, poucos emojis (0 a 3), inclua uma chamada para ação no final e sugira de 3 a 6 hashtags relevantes. Responda apenas com a legenda final, sem explicações.",
        messages: [
          {
            role: "user",
            content: `${promptPartes}\n\nEscreva a legenda para o post.`,
          },
        ],
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
      return new Response(JSON.stringify({ error: mensagem }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const legenda = data.content?.find((b: { type: string }) => b.type === "text")?.text ?? "";

    return new Response(JSON.stringify({ legenda }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Erro ao gerar legenda." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
