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

    const { post_id, video_url } = await req.json();
    if (!post_id || !video_url) {
      return json({ error: "post_id e video_url são obrigatórios." }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: chamador } = await admin
      .from("usuarios_perfil")
      .select("empresa_id")
      .eq("id", user.id)
      .single();

    const { data: post, error: postError } = await admin
      .from("posts_marketing")
      .select("id, legenda_gerada, instagram_media_id, empresa_id")
      .eq("id", post_id)
      .single();
    if (postError || !post) return json({ error: "Post não encontrado." }, 404);
    if (post.empresa_id !== chamador?.empresa_id) {
      return json({ error: "Post não encontrado." }, 404);
    }
    if (post.instagram_media_id) {
      return json({ error: "Este post já foi publicado no Instagram." }, 400);
    }

    const { data: config } = await admin
      .from("instagram_config")
      .select("access_token, instagram_user_id, token_expira_em")
      .eq("empresa_id", post.empresa_id)
      .maybeSingle();

    if (!config?.access_token || !config?.instagram_user_id) {
      return json({ error: "Instagram não está conectado. Conecte a conta em Marketing antes de publicar." }, 400);
    }
    if (config.token_expira_em && new Date(config.token_expira_em) < new Date()) {
      return json({ error: "O acesso ao Instagram expirou. Reconecte a conta em Marketing." }, 400);
    }

    const accessToken = config.access_token as string;
    const igUserId = config.instagram_user_id as string;

    // 1. Cria o container de Reels (vídeo)
    const containerUrl = new URL(`https://graph.instagram.com/${igUserId}/media`);
    containerUrl.searchParams.set("media_type", "REELS");
    containerUrl.searchParams.set("video_url", video_url);
    containerUrl.searchParams.set("caption", post.legenda_gerada ?? "");
    containerUrl.searchParams.set("access_token", accessToken);
    const containerResp = await fetch(containerUrl, { method: "POST" });
    if (!containerResp.ok) {
      const errBody = await containerResp.text();
      console.error("Erro ao criar container de Reels", containerResp.status, errBody);
      return json({ error: "Falha ao preparar o Reels no Instagram." }, 502);
    }
    const containerData = await containerResp.json();
    const creationId = containerData.id as string;

    // 2. Aguarda o Instagram processar o vídeo (demora mais que imagem)
    let pronto = false;
    let statusFinal = "";
    for (let tentativa = 0; tentativa < 14; tentativa++) {
      await sleep(3000);
      const statusUrl = new URL(`https://graph.instagram.com/${creationId}`);
      statusUrl.searchParams.set("fields", "status_code");
      statusUrl.searchParams.set("access_token", accessToken);
      const statusResp = await fetch(statusUrl);
      if (!statusResp.ok) continue;
      const statusData = await statusResp.json();
      statusFinal = statusData.status_code;
      if (statusFinal === "FINISHED") {
        pronto = true;
        break;
      }
      if (statusFinal === "ERROR") {
        return json({ error: "O Instagram não conseguiu processar o vídeo gerado." }, 502);
      }
    }

    if (!pronto) {
      return json(
        { error: "O vídeo ainda está sendo processado pelo Instagram. Tente publicar novamente em cerca de 1 minuto." },
        202
      );
    }

    // 3. Publica
    const publishUrl = new URL(`https://graph.instagram.com/${igUserId}/media_publish`);
    publishUrl.searchParams.set("creation_id", creationId);
    publishUrl.searchParams.set("access_token", accessToken);
    const publishResp = await fetch(publishUrl, { method: "POST" });
    if (!publishResp.ok) {
      const errBody = await publishResp.text();
      console.error("Erro ao publicar Reels", publishResp.status, errBody);
      return json({ error: "Falha ao publicar o Reels no Instagram." }, 502);
    }
    const publishData = await publishResp.json();

    await admin
      .from("posts_marketing")
      .update({
        instagram_media_id: publishData.id,
        publicado_instagram_em: new Date().toISOString(),
        video_url,
      })
      .eq("id", post_id);

    return json({ ok: true, media_id: publishData.id });
  } catch (err) {
    console.error(err);
    return json({ error: err instanceof Error ? err.message : "Erro ao publicar Reels no Instagram." }, 500);
  }
});
