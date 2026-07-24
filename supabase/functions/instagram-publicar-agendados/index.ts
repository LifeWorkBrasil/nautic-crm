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

Deno.serve(async (req: Request) => {
  if (req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return json({ error: "Não autorizado" }, 401);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: config } = await admin
    .from("instagram_config")
    .select("access_token, instagram_user_id, token_expira_em")
    .limit(1)
    .maybeSingle();

  if (!config?.access_token || !config?.instagram_user_id) {
    return json({ processados: 0, motivo: "Instagram não conectado." });
  }
  if (config.token_expira_em && new Date(config.token_expira_em) < new Date()) {
    return json({ processados: 0, motivo: "Token do Instagram expirado." });
  }

  const accessToken = config.access_token as string;
  const igUserId = config.instagram_user_id as string;

  const { data: pendentes } = await admin
    .from("posts_marketing")
    .select("id, legenda_gerada, foto_urls")
    .eq("status_agendamento", "agendado")
    .lte("agendado_para", new Date().toISOString())
    .is("instagram_media_id", null)
    .order("agendado_para", { ascending: true })
    .limit(5);

  const resultados: { id: string; ok: boolean }[] = [];

  for (const post of pendentes ?? []) {
    const fotoUrl = post.foto_urls?.[0];
    if (!fotoUrl) {
      await admin
        .from("posts_marketing")
        .update({ status_agendamento: "erro", erro_agendamento: "Post sem foto para publicar." })
        .eq("id", post.id);
      resultados.push({ id: post.id, ok: false });
      continue;
    }

    try {
      const containerUrl = new URL(`https://graph.instagram.com/${igUserId}/media`);
      containerUrl.searchParams.set("image_url", fotoUrl);
      containerUrl.searchParams.set("caption", post.legenda_gerada ?? "");
      containerUrl.searchParams.set("access_token", accessToken);
      const containerResp = await fetch(containerUrl, { method: "POST" });
      if (!containerResp.ok) {
        throw new Error(`Falha ao criar container de mídia (${containerResp.status})`);
      }
      const containerData = await containerResp.json();
      const creationId = containerData.id as string;

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

  return json({ processados: resultados.length, resultados });
});
