import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
      throw new Error(`Falha ao criar container de mídia (${resp.status})`);
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
      throw new Error(`Falha ao criar item do carrossel (${resp.status})`);
    }
    const data = await resp.json();
    itemIds.push(data.id as string);
  }

  const carouselUrl = new URL(`https://graph.instagram.com/${igUserId}/media`);
  carouselUrl.searchParams.set("media_type", "CAROUSEL");
  carouselUrl.searchParams.set("children", itemIds.join(","));
  carouselUrl.searchParams.set("caption", caption);
  carouselUrl.searchParams.set("access_token", accessToken);
  const carouselResp = await fetch(carouselUrl, { method: "POST" });
  if (!carouselResp.ok) {
    throw new Error(`Falha ao criar carrossel (${carouselResp.status})`);
  }
  const carouselData = await carouselResp.json();
  return carouselData.id as string;
}

Deno.serve(async (req: Request) => {
  if (req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return json({ error: "Não autorizado" }, 401);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: configs } = await admin
    .from("instagram_config")
    .select("empresa_id, access_token, instagram_user_id, token_expira_em")
    .not("access_token", "is", null)
    .not("instagram_user_id", "is", null);

  const resultados: { id: string; ok: boolean }[] = [];

  for (const config of configs ?? []) {
    if (config.token_expira_em && new Date(config.token_expira_em) < new Date()) {
      continue;
    }

    const accessToken = config.access_token as string;
    const igUserId = config.instagram_user_id as string;

    const { data: pendentes } = await admin
      .from("posts_marketing")
      .select("id, legenda_gerada, foto_urls")
      .eq("empresa_id", config.empresa_id)
      .eq("status_agendamento", "agendado")
      .lte("agendado_para", new Date().toISOString())
      .is("instagram_media_id", null)
      .order("agendado_para", { ascending: true })
      .limit(5);

    for (const post of pendentes ?? []) {
      const fotoUrls: string[] = post.foto_urls ?? [];
      if (fotoUrls.length === 0) {
        await admin
          .from("posts_marketing")
          .update({ status_agendamento: "erro", erro_agendamento: "Post sem foto para publicar." })
          .eq("id", post.id);
        resultados.push({ id: post.id, ok: false });
        continue;
      }

      try {
        const creationId = await criarCreationId(igUserId, accessToken, fotoUrls, post.legenda_gerada ?? "");

        let publishData: { id?: string } | null = null;
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
        }

        if (!publishData?.id) {
          throw new Error("O Instagram não processou a mídia a tempo.");
        }

        await admin
          .from("posts_marketing")
          .update({
            instagram_media_id: publishData.id,
            publicado_instagram_em: new Date().toISOString(),
            status_agendamento: "publicado",
          })
          .eq("id", post.id);
        resultados.push({ id: post.id, ok: true });
      } catch (err) {
        console.error("Falha ao publicar post agendado", post.id, err);
        await admin
          .from("posts_marketing")
          .update({
            status_agendamento: "erro",
            erro_agendamento: err instanceof Error ? err.message : "Erro ao publicar no Instagram.",
          })
          .eq("id", post.id);
        resultados.push({ id: post.id, ok: false });
      }
    }
  }

  return json({ processados: resultados.length, resultados });
});
