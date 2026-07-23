import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autenticado" }, 401);

    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await callerClient.auth.getUser();
    if (!user) return json({ error: "Não autenticado" }, 401);

    const { post_id } = await req.json();
    if (!post_id) return json({ error: "post_id é obrigatório." }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: config } = await admin
      .from("instagram_config")
      .select("access_token, instagram_user_id, token_expira_em")
      .limit(1)
      .maybeSingle();

    if (!config?.access_token || !config?.instagram_user_id) {
      return json({ error: "Instagram não está conectado. Conecte a conta em Marketing antes de publicar." }, 400);
    }
    if (config.token_expira_em && new Date(config.token_expira_em) < new Date()) {
      return json({ error: "O acesso ao Instagram expirou. Reconecte a conta em Marketing." }, 400);
    }

    const { data: post, error: postError } = await admin
      .from("posts_marketing")
      .select("id, legenda_gerada, foto_urls, instagram_media_id")
      .eq("id", post_id)
      .single();
    if (postError || !post) return json({ error: "Post não encontrado." }, 404);
    if (post.instagram_media_id) {
      return json({ error: "Este post já foi publicado no Instagram." }, 400);
    }
    const fotoUrl = post.foto_urls?.[0];
    if (!fotoUrl) return json({ error: "Este post não tem foto para publicar." }, 400);

    const accessToken = config.access_token as string;
    const igUserId = config.instagram_user_id as string;

    // 1. Cria o container de mídia
    const containerUrl = new URL(`https://graph.instagram.com/${igUserId}/media`);
    containerUrl.searchParams.set("image_url", fotoUrl);
    containerUrl.searchParams.set("caption", post.legenda_gerada ?? "");
    containerUrl.searchParams.set("access_token", accessToken);
    const containerResp = await fetch(containerUrl, { method: "POST" });
    if (!containerResp.ok) {
      const errBody = await containerResp.text();
      console.error("Erro ao criar container de mídia", containerResp.status, errBody);
      return json({ error: "Falha ao preparar a publicação no Instagram." }, 502);
    }
    const containerData = await containerResp.json();
    const creationId = containerData.id as string;

    // 2. Aguarda o processamento e publica, com algumas tentativas
    let publishData: { id?: string } | null = null;
    let lastError = "";
    for (let tentativa = 0; tentativa < 4; tentativa++) {
      await sleep(5000);
      const publishUrl = new URL(`https://graph.instagram.com/${igUserId}/media_publish`);
      publishUrl.searchParams.set("creation_id", creationId);
      publishUrl.searchParams.set("access_token", accessToken);
      const publishResp = await fetch(publishUrl, { method: "POST" });
      if (publishResp.ok) {
        publishData = await publishResp.json();
        break;
      }
      lastError = await publishResp.text();
      console.error("Tentativa de publicação falhou", tentativa, lastError);
    }

    if (!publishData?.id) {
      return json({ error: "O Instagram não processou a mídia a tempo. Tente novamente em instantes." }, 502);
    }

    await admin
      .from("posts_marketing")
      .update({ instagram_media_id: publishData.id, publicado_instagram_em: new Date().toISOString() })
      .eq("id", post_id);

    return json({ ok: true, media_id: publishData.id });
  } catch (err) {
    console.error(err);
    return json({ error: err instanceof Error ? err.message : "Erro ao publicar no Instagram." }, 500);
  }
});
