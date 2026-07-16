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

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: perfil } = await adminClient
      .from("usuarios_perfil")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    if (!perfil?.is_admin) {
      return json({ error: "Apenas administradores podem gerenciar usuários" }, 403);
    }

    const body = await req.json();

    if (body.action === "criar_usuario") {
      if (!body.nome || !body.email || !body.senha) {
        return json({ error: "Nome, e-mail e senha são obrigatórios." }, 400);
      }

      const { data: created, error } = await adminClient.auth.admin.createUser({
        email: body.email,
        password: body.senha,
        email_confirm: true,
      });
      if (error) throw error;

      const { error: perfilError } = await adminClient.from("usuarios_perfil").insert({
        id: created.user.id,
        nome: body.nome,
        email: body.email,
        comissao_percentual: body.comissao_percentual ?? 0,
        is_admin: false,
        ativo: true,
      });
      if (perfilError) throw perfilError;

      if (Array.isArray(body.tab_keys) && body.tab_keys.length > 0) {
        const { error: permError } = await adminClient
          .from("permissoes_usuario")
          .insert(body.tab_keys.map((k: string) => ({ usuario_id: created.user.id, tab_key: k })));
        if (permError) throw permError;
      }

      return json({ ok: true });
    }

    if (body.action === "atualizar_permissoes") {
      if (!body.usuario_id) return json({ error: "usuario_id é obrigatório." }, 400);

      const { error: deleteError } = await adminClient
        .from("permissoes_usuario")
        .delete()
        .eq("usuario_id", body.usuario_id);
      if (deleteError) throw deleteError;

      if (Array.isArray(body.tab_keys) && body.tab_keys.length > 0) {
        const { error: insertError } = await adminClient
          .from("permissoes_usuario")
          .insert(body.tab_keys.map((k: string) => ({ usuario_id: body.usuario_id, tab_key: k })));
        if (insertError) throw insertError;
      }

      return json({ ok: true });
    }

    if (body.action === "atualizar_usuario") {
      if (!body.usuario_id) return json({ error: "usuario_id é obrigatório." }, 400);

      const { error: updateError } = await adminClient
        .from("usuarios_perfil")
        .update({
          nome: body.nome,
          comissao_percentual: body.comissao_percentual,
          ativo: body.ativo,
        })
        .eq("id", body.usuario_id);
      if (updateError) throw updateError;

      return json({ ok: true });
    }

    return json({ error: "Ação desconhecida." }, 400);
  } catch (err) {
    console.error(err);
    return json({ error: err instanceof Error ? err.message : "Erro ao processar solicitação." }, 500);
  }
});
