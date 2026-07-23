import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const INSTAGRAM_APP_ID = Deno.env.get("INSTAGRAM_APP_ID")!;
const INSTAGRAM_APP_SECRET = Deno.env.get("INSTAGRAM_APP_SECRET")!;
const FRONTEND_URL = Deno.env.get("FRONTEND_URL") ?? "https://lifeworkbrasil.github.io/nautic-crm";

function redirectComStatus(status: "conectado" | "erro", mensagem?: string) {
  const url = new URL(`${FRONTEND_URL}/marketing`);
  url.searchParams.set("instagram", status);
  if (mensagem) url.searchParams.set("instagram_msg", mensagem);
  return Response.redirect(url.toString(), 302);
}

Deno.serve(async (req: Request) => {
  try {
    const reqUrl = new URL(req.url);
    const code = reqUrl.searchParams.get("code");
    const errorParam = reqUrl.searchParams.get("error_description") ?? reqUrl.searchParams.get("error");

    if (errorParam) {
      return redirectComStatus("erro", errorParam);
    }
    if (!code) {
      return redirectComStatus("erro", "Código de autorização ausente.");
    }

    const redirectUri = `${SUPABASE_URL}/functions/v1/instagram-oauth-callback`;

    // 1. Troca o code pelo token de curta duração
    const tokenForm = new URLSearchParams({
      client_id: INSTAGRAM_APP_ID,
      client_secret: INSTAGRAM_APP_SECRET,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    });
    const tokenResp = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      body: tokenForm,
    });
    if (!tokenResp.ok) {
      const errBody = await tokenResp.text();
      console.error("Erro ao trocar code por token", tokenResp.status, errBody);
      return redirectComStatus("erro", "Falha ao autenticar com o Instagram.");
    }
    const tokenData = await tokenResp.json();
    const shortLivedToken = tokenData.access_token as string;

    // 2. Troca o token de curta duração por um de longa duração (60 dias)
    const exchangeUrl = new URL("https://graph.instagram.com/access_token");
    exchangeUrl.searchParams.set("grant_type", "ig_exchange_token");
    exchangeUrl.searchParams.set("client_secret", INSTAGRAM_APP_SECRET);
    exchangeUrl.searchParams.set("access_token", shortLivedToken);
    const exchangeResp = await fetch(exchangeUrl);
    if (!exchangeResp.ok) {
      const errBody = await exchangeResp.text();
      console.error("Erro ao trocar por token de longa duração", exchangeResp.status, errBody);
      return redirectComStatus("erro", "Falha ao obter token de longa duração do Instagram.");
    }
    const exchangeData = await exchangeResp.json();
    const longLivedToken = exchangeData.access_token as string;
    const expiraEm = new Date(Date.now() + (exchangeData.expires_in ?? 5184000) * 1000).toISOString();

    // 3. Busca o username da conta conectada
    const meUrl = new URL("https://graph.instagram.com/me");
    meUrl.searchParams.set("fields", "id,username");
    meUrl.searchParams.set("access_token", longLivedToken);
    const meResp = await fetch(meUrl);
    const meData = meResp.ok ? await meResp.json() : {};

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: existente } = await admin.from("instagram_config").select("id").limit(1).maybeSingle();

    const payload = {
      access_token: longLivedToken,
      token_expira_em: expiraEm,
      instagram_user_id: meData.id ?? tokenData.user_id ?? null,
      instagram_username: meData.username ?? null,
      atualizado_em: new Date().toISOString(),
    };

    if (existente?.id) {
      await admin.from("instagram_config").update(payload).eq("id", existente.id);
    } else {
      await admin.from("instagram_config").insert(payload);
    }

    return redirectComStatus("conectado");
  } catch (err) {
    console.error(err);
    return redirectComStatus("erro", "Erro inesperado ao conectar o Instagram.");
  }
});
