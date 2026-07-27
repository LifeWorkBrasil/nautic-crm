# Handoff — Estaleiro CRM (nautic-crm)

Documento de transição para continuar o desenvolvimento no Claude Code. Este projeto foi
iniciado numa conversa no claude.ai (chat), incluindo criação real de infraestrutura no
Supabase. Tudo abaixo reflete o estado real do sistema, não um plano hipotético.

> ⚠️ **Este documento está desatualizado em relação ao schema atual.** As seções 2–4 abaixo
> descrevem o estado de `supabase/migrations/0001` e `0002`, mas o projeto já tem 40
> migrações (`supabase/migrations/`) — incluindo multi-tenancy completo (tabela `empresas`,
> `empresa_id` em todas as tabelas, RLS reescrita), módulo de Marketing/Instagram (posts,
> agendamento, geração de Reels) e mais. Antes de assumir que a seção 2–4 é o estado atual,
> confira `supabase/migrations/` e `src/pages/`. A seção 5 (backlog) segue recebendo itens
> novos conforme surgem.

---

## 1. O que é o projeto

Sistema de orçamentos e CRM para venda/fabricação de embarcações (RedFish 167, 280T, 340T,
CatOpen 30, CatFish 30, VTR 350 FB, CatFish 39, CatFly 42, CatHT 42), substituindo uma
planilha Excel de preços. Stack: **React + Vite + TypeScript + Tailwind CSS + Supabase**.

Requisito original completo (prompt inicial do usuário) está preservado no histórico da
conversa anterior — resumo funcional abaixo.

---

## 2. Infraestrutura já criada (real, não simulada)

### Supabase
- **Projeto:** `nautic-crm`
- **Project ref / ID:** `rsncpbhcgmthmsjfobey`
- **Organização:** ACN SINAL VERDE (`egvljexpcxnsmahzshdl`)
- **Região:** `sa-east-1` (São Paulo)
- **Plano:** gratuito (R$ 0/mês)
- **URL:** `https://rsncpbhcgmthmsjfobey.supabase.co`
- A `anon key` (pública, segura para uso no front-end) está no arquivo `.env` local do
  projeto — **não está neste documento por não ser necessário repeti-la aqui**; confirme em
  `.env` na raiz do projeto.

### Migrações aplicadas (nesta ordem, via SQL direto no projeto — ainda **não versionadas
como arquivos de migration formais rodados via CLI/`supabase db push`**, foram aplicadas
manualmente durante o desenvolvimento):

1. `supabase/migrations/0001_init.sql` — schema principal:
   - `modelos_barcos`, `fotos_modelos`, `videos_modelos`, `motores`, `acessorios`,
     `clientes_leads`, `orcamentos`, `orcamentos_acessorios`
   - FKs com `on delete cascade`/`restrict` conforme especificado no prompt original
   - RLS habilitado em todas, política `for all to authenticated using (true)`

2. `supabase/migrations/0002_empresa_config_and_storage.sql`:
   - Tabela `empresa_config` (singleton — 1 linha só) para logo/dados usados nas propostas
   - RLS: leitura pública (`anon`), escrita só autenticado
   - Buckets de Storage: `branding` (logo da empresa) e `modelos` (fotos dos barcos), ambos
     públicos para leitura, escrita restrita a autenticados

### Dados reais migrados da planilha original (`Tabela_de_preços_2023_revisada.xlsx`)
- 9 modelos de barco
- 26 motores (Mercury, Yamaha, Hidea)
- 172 acessórios (166 vinculados a modelos específicos + 6 universais)

**Pendências de qualidade de dados** (o usuário está ciente e pode ajustar via UI):
- `CatFish 30` está com `preco_base = 0` — a aba dela na planilha original não tinha uma
  linha de "casco standard". Precisa do valor real.
- Categorias dos acessórios (`Elétrica`/`Conforto`/`Estrutura`/`Acessório`) foram inferidas
  por palavra-chave via script Python, não vieram da planilha — vale revisão.
- Potência de alguns motores foi extraída por regex do texto da descrição (ex: "VERADO 300
  CXL..." → 300 HP). Casos como "450R" e "VERADO 400XXL V10" merecem conferência manual.
- A aba genérica "Acessórios" da planilha (181 linhas agrupadas por prefixo tipo "Cat42")
  **não foi usada** — era ambíguo demais decidir se "Cat42" cobria CatFly42, CatHT42, ou os
  dois. Fica como possível segunda passada.

### Autenticação (Supabase Auth)
- Um usuário admin foi criado **via SQL direto** (inserção manual em `auth.users` +
  `auth.identities`, com `crypt()`/pgcrypto para o hash de senha), não pelo fluxo normal de
  signup. Isso funcionou, mas **não é o caminho recomendado para criar usuários em
  produção** — prefira o Supabase Dashboard (Authentication → Users → Add user) ou
  `supabase.auth.admin.createUser()` via service role a partir de agora.
- **Credenciais atuais:**
  - E-mail: `admin@estaleiro.local`
  - Senha: `admin1245`
  - ⚠️ Senha fraca, criada assim a pedido do usuário para agilizar o início. **Trocar assim
    que possível.**
- Bug já corrigido: colunas de texto (`email_change`, `confirmation_token`, etc.) tinham
  ficado `NULL` em vez de string vazia, causando erro 500 no login (`Database error
  querying schema`). Foram corrigidas com `UPDATE ... coalesce(coluna, '')`. Se criar novos
  usuários via SQL direto no futuro, **preencha esses campos com `''`, nunca deixe `NULL`.**

---

## 3. O que já está implementado no front-end

Stack: Vite + React 18 + TypeScript + Tailwind (tema náutico customizado — cores `hull`
(navy), `wake` (teal), `brass` (dourado), `foam` (branco/cinza); fontes Fraunces (display) +
IBM Plex Sans/Mono).

| Área | Status |
|---|---|
| Login (Supabase Auth) protegendo o app inteiro | ✅ |
| CRM — Kanban de leads, criar lead, mudar status | ✅ (conectado ao banco real) |
| Parametrização → Modelos — CRUD completo + upload de foto | ✅ |
| Parametrização → Motores — CRUD completo | ✅ |
| Parametrização → Acessórios — CRUD completo, vínculo a modelo ou universal | ✅ |
| Empresa & Marca — edição de logo, nome, CNPJ, contato, validade padrão, termos | ✅ |
| Gerador de Orçamentos — wizard de 4 passos, soma dinâmica | ✅ |
| Orçamento grava no banco (`orcamentos` + `orcamentos_acessorios`) | ✅ |
| Geração de PDF real da proposta (`html2pdf.js`, carregado sob demanda) | ✅ |
| Link público de cotação (sem login) | ❌ não implementado |
| Vínculo de vídeos do YouTube aos modelos (tabela `videos_modelos` já existe) | ❌ falta UI |
| Diferenciação de papéis (admin vs. vendedor) | ❌ hoje é um usuário único |

### Estrutura de pastas
```
src/
  components/    Layout.tsx (sidebar), Modal.tsx (reutilizável nos CRUDs)
  pages/         Login.tsx, CRM.tsx, Parametrizacao.tsx, Orcamentos.tsx, Empresa.tsx
  lib/           supabase.ts (client), api.ts (TODAS as queries/mutações centralizadas aqui)
  types/         index.ts (tipos de domínio), html2pdf.d.ts (tipos ambiente da lib de PDF)
supabase/
  migrations/    0001_init.sql, 0002_empresa_config_and_storage.sql
```

`src/lib/api.ts` é o único lugar que fala com o Supabase — todas as páginas importam funções
de lá (`listModelos`, `createLead`, `criarOrcamento`, `uploadLogoEmpresa`, etc.). Ao
continuar o projeto, manter esse padrão evita espalhar chamadas Supabase pelas páginas.

---

## 4. Ambiente local (o que já foi resolvido)

- Node.js instalado e funcionando (`v24.18.0`)
- O `PATH` do sistema Windows tinha uma entrada corrompida (aspas soltas + `;` sobrando)
  que impedia o `cmd.exe` (usado internamente pelo `npm install`) de achar o `node` — já
  corrigido nas Variáveis de Ambiente do Windows.
- Projeto foi movido para fora do OneDrive (`C:\APP\Nautic`) porque a sincronização do
  OneDrive conflitava com o `npm install` (erros `EPERM` apagando `node_modules`).
- Setup local:
  ```powershell
  cd C:\APP\Nautic
  npm install
  npm run dev
  ```
  Abre em `http://localhost:5173`.

---

## 5. Próximos passos sugeridos (backlog)

Em ordem de valor prático, mas ajustável:

1. **Revisar os dados migrados** — corrigir `CatFish 30` (preço base zerado), conferir
   categorias de acessórios e potência de motores extraídos por regex.
2. **Trocar a senha do admin** e, se fizer sentido, criar usuários individuais por vendedor
   (Supabase Dashboard → Authentication).
3. **Link público de cotação** — hoje o botão existe na UI mas está desabilitado. Precisa de
   uma rota pública (sem exigir login) que leia um orçamento específico por ID/token e
   mostre a mesma pré-visualização da proposta. Vai exigir ajustar RLS de `orcamentos` para
   permitir leitura pública por ID (hoje só autenticados podem ler).
4. **Vincular vídeos do YouTube aos modelos** — tabela `videos_modelos` já existe no banco,
   falta a interface em Parametrização → Modelos (campo pra colar URL + embed via iframe na
   proposta).
5. **Code splitting** — o build já mostra aviso de chunk grande (~440kB no bundle
   principal). `html2pdf.js` já foi isolado com import dinâmico; vale revisar se outras
   libs pesadas merecem o mesmo tratamento.
6. **Responsividade mobile** — não foi testada a fundo ainda; o layout usa Tailwind
   responsivo básico (`sm:`, `md:`, `lg:`), mas não houve validação dedicada em telas
   pequenas.
7. **Testes automatizados** — não existem ainda (nem unitários nem e2e).
8. **Gerar Flyer (imagem) para Instagram a partir do Banco de Mídia** — pedido pelo usuário
   em conversa fora deste repo (2026-07-27), depois de eu ter prototipado localmente (Node,
   fora do sistema) remoção de fundo + montagem de flyer pra um tenant (CuraLabs3D). Spec
   levantada nessa conversa, pronta pra implementar:
   - **Onde entra na UI**: botão "Gerar Flyer" ao lado de "Gerar Reels" em `Marketing.tsx`
     (o botão "Gerar Reels" está por volta da linha 576, abre `GerarReelsModal.tsx`). Um
     `GerarFlyerModal.tsx` novo seguindo o mesmo padrão (recebe `fotoUrls`/`legenda`, mostra
     preview, publica).
   - **Remoção de fundo**: usar `@imgly/background-removal` (pacote **browser**, WASM/ONNX
     Runtime Web — não confundir com `@imgly/background-removal-node`, que é binding nativo
     e não roda em navegador). Mesma filosofia do `gerarReels.ts`: tudo no cliente, sem
     serviço externo. Primeira execução baixa o modelo (~40–80MB); vale cachear
     (Cache API/IndexedDB) pra não repetir o download a cada uso.
   - **Composição do flyer**: usar `<canvas>` 2D, no mesmo padrão de `desenharImagemCover()`
     em `src/lib/gerarReels.ts` (que já faz cover-fit de imagem em canvas). Não dá pra reusar
     a abordagem SVG+`sharp` do protótipo Node — texto customizado no canvas via `FontFace`
     API carregando `.ttf` como asset estático do projeto.
   - **Branding dinâmico por tenant**: puxar `nome_empresa` e `logo_url` de
     `empresa_config`/`empresas` (já existem, migração 0002/0021). **Faltam campos**: cor
     primária/destaque de marca e URL do site não têm coluna hoje — ou cria
     `cor_primaria`/`site_url` em migração nova, ou usa paleta neutra fixa configurável por
     enquanto. O @ do Instagram **não precisa de campo novo**: já dá pra pegar de
     `getInstagramStatus().instagram_username` (conta conectada via OAuth).
   - **Upload e publicação**: reaproveita o fluxo existente, sem edge function nova. Criar
     `uploadFlyerMarketing(empresaId, postId, blob)` em `src/lib/api.ts` análogo a
     `uploadVideoReels()` (linha ~1190), fazer upload pro Storage, atualizar `foto_urls` do
     post com a URL do flyer, e seguir com `publicarNoInstagram(postId)` normalmente (essa
     função já publica posts de imagem a partir de `foto_urls` — só o Reels precisa de rota
     própria porque vídeo no Graph API tem upload resumível).
   - **Variante extra pedida**: template "antes/depois" (peça danificada vs. peça
     fabricada), pro caso de uso de reposição/reparo sob encomenda. Provavelmente um segundo
     template opcional, não o padrão — usuário escolhe qual template ao gerar.
   - **Protótipo de referência** (fora deste repo, ambiente local do usuário, não é código
     pra copiar — roda em Node, não no navegador): scripts em
     `%TEMP%\claude\...\scratchpad\bgremoval\` (`flyer.mjs`, `studio.mjs`,
     `comparison.mjs`) — úteis como referência de layout/proporções/paleta.

---

## 6. Decisões de design (para manter consistência)

- Paleta: `hull-900` (navy escuro, sidebar), `wake-500` (teal, links/destaque), `brass-500`
  (dourado, ações principais/seleção), `foam-100` (fundo geral claro).
- Tipografia: `font-display` (Fraunces) para títulos, corpo padrão (IBM Plex Sans), números
  monetários/técnicos em `font-mono` (IBM Plex Mono).
- Padrão visual "wake-underline" (sublinhado em gradiente dourado) usado nos títulos de
  página e item de navegação ativo — está em `src/index.css`.
- Modais de CRUD sempre usam o componente `Modal.tsx` compartilhado.
