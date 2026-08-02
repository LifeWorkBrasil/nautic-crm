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

// Cada item do carrossel precisa terminar de processar (status_code FINISHED) antes de poder
// ser referenciado como "children" do container do carrossel — sem essa espera, o Instagram
// rejeita a criação do carrossel de forma intermitente (falha mais quanto mais fotos tem o post).
async function aguardarContainerPronto(containerId: string, accessToken: string): Promise<void> {
  for (let tentativa = 0; tentativa < 10; tentativa++) {
    const statusUrl = new URL(`https://graph.instagram.com/${containerId}`);
    statusUrl.searchParams.set("fields", "status_code");
    statusUrl.searchParams.set("access_token", accessToken);
    const resp = await fetch(statusUrl);
    if (resp.ok) {
      const data = await resp.json();
      if (data.status_code === "FINISHED") return;
      if (data.status_code === "ERROR") {
        throw new Error("O Instagram não conseguiu processar uma das fotos do carrossel.");
      }
    }
    await sleep(2000);
  }
  throw new Error("O Instagram demorou demais para processar uma das fotos do carrossel.");
}

// Cria o container de mídia a publicar: imagem única, ou carrossel quando o post tem mais de
// uma foto (cria um item container por foto e depois o container do carrossel que os agrupa).
async function criarCreationId(
  igUserId: string,
  accessToken: string,
  fotoUrls: string[],
  caption: string
): Promise<string> {
  const fotos = fotoUrls.filter(Boolean).slice(0, 10);

  if (fotos.length <= 1) {
    const containerUrl = new URL(`https://graph.instagram.com/${igUserId}/media`);
    containerUrl.searchParams.set("image_url", fotos[0]);
    containerUrl.searchParams.set("caption", caption);
    containerUrl.searchParams.set("access_token", accessToken);
    const resp = await fetch(containerUrl, { method: "POST" });
    if (!resp.ok) {
      throw new Error(`Falha ao criar container de mídia (${resp.status}): ${await resp.text()}`);
    }
    const data = await resp.json();
    return data.id as string;
  }

  const itemIds: string[] = [];
  for (const url of fotos) {
    const itemUrl = new URL(`https://graph.instagram.com/${igUserId}/media`);
    itemUrl.searchParams.set("image_url", url);
    itemUrl.searchParams.set("is_carousel_item", "true");
    itemUrl.searchParams.set("access_token", accessToken);
    const resp = await fetch(itemUrl, { method: "POST" });
    if (!resp.ok) {
      throw new Error(`Falha ao criar item do carrossel (${resp.status}): ${await resp.text()}`);
    }
    const data = await resp.json();
    await aguardarContainerPronto(data.id as string, accessToken);
    itemIds.push(data.id as string);
  }

  const carouselUrl = new URL(`https://graph.instagram.com/${igUserId}/media`);
  carouselUrl.searchParams.set("media_type", "CAROUSEL");
  carouselUrl.searchParams.set("children", itemIds.join(","));
  carouselUrl.searchParams.set("caption", caption);
  carouselUrl.searchParams.set("access_token", accessToken);
  const carouselResp = await fetch(carouselUrl, { method: "POST" });
  if (!carouselResp.ok) {
    throw new Error(`Falha ao criar carrossel (${carouselResp.status}): ${await carouselResp.text()}`);
  }
  const carouselData = await carouselResp.json();
  return carouselData.id as string;
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

    const { data: chamador } = await admin
      .from("usuarios_perfil")
      .select("empresa_id")
      .eq("id", user.id)
      .single();

    const { data: post, error: postError } = await admin
      .from("posts_marketing")
      .select("id, legenda_gerada, foto_urls, instagram_media_id, empresa_id")
      .eq("id", post_id)
      .single();
    if (postError || !post) return json({ error: "Post não encontrado." }, 404);
    if (post.empresa_id !== chamador?.empresa_id) {
      return json({ error: "Post não encontrado." }, 404);
    }
    if (post.instagram_media_id) {
      return json({ error: "Este post já foi publicado no Instagram." }, 400);
    }
    const fotoUrls: string[] = post.foto_urls ?? [];
    if (fotoUrls.length === 0) return json({ error: "Este post não tem foto para publicar." }, 400);

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

    let creationId: string;
    try {
      creationId = await criarCreationId(igUserId, accessToken, fotoUrls, post.legenda_gerada ?? "");
    } catch (err) {
      console.error("Erro ao criar container de mídia", err);
      return json({ error: "Falha ao preparar a publicação no Instagram." }, 502);
    }

    // Aguarda o processamento e publica, com algumas tentativas
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
