# Estaleiro CRM — Orçamentos Náuticos

Sistema de orçamentos e CRM para venda/fabricação de embarcações, substituindo a
planilha de preços. Stack: React + Vite + TypeScript + Tailwind + Supabase.

## Login

O sistema agora exige autenticação (Supabase Auth) — é o que faz as políticas de RLS
funcionarem de verdade nas escritas.

**Credenciais do admin já criado:**
- E-mail: `admin@estaleiro.local`
- Senha: `admin1245`

⚠️ Essa senha é fraca de propósito só pra você começar rápido. Troque assim que possível em
Supabase Dashboard → Authentication → Users, ou peça pra eu trocar por algo mais forte.
Para cadastrar outros vendedores, use o mesmo painel (Authentication → Users → Add user).

## Status atual

✅ Estrutura de front-end (layout, navegação, 4 telas: CRM, Parametrização, Orçamentos, Empresa)
✅ Schema SQL completo com RLS (`supabase/migrations/0001_init.sql`)
✅ Tabela e storage de configuração da empresa/logo (`supabase/migrations/0002_empresa_config_and_storage.sql`)
✅ Projeto Supabase real já criado e com dados reais migrados da planilha
✅ Conectado ao Supabase de verdade — CRUD completo (criar/editar/excluir) em Modelos, Motores, Acessórios, Leads
✅ Upload de foto por modelo e upload de logo da empresa (Supabase Storage)
✅ Geração de orçamento grava no banco (`orcamentos` + `orcamentos_acessorios`)
✅ Login com Supabase Auth protegendo o app inteiro (usuário admin já criado)
✅ Geração de PDF de verdade da proposta (captura a pré-visualização com logo, foto e preços)
⬜ Link público de cotação (compartilhável sem login)
⬜ Vínculo de vídeos do YouTube aos modelos (tabela `videos_modelos` já existe, falta a UI)

### O que ainda precisa da sua revisão nos dados migrados
- **CatFish 30** está com preço base **R$ 0,00** — a planilha original não tinha essa linha. Edite em Parametrização → Modelos.
- Categorias dos acessórios foram inferidas por palavra-chave; vale conferir.
- Potência de alguns motores (ex: "450R", "VERADO 400XXL V10") foi extraída do texto — confira.

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencha com a URL e a anon key do seu projeto Supabase
npm run dev
```

## Banco de dados

Já existe um projeto Supabase real rodando para este sistema (`nautic-crm`, org ACN SINAL
VERDE, região São Paulo) com o schema e os dados da planilha aplicados. O `.env` deste pacote
já vem preenchido com a URL e a `anon key` desse projeto — é a chave pública, segura para uso
no front-end.

Se quiser recriar do zero em outro projeto:

1. Crie um projeto em [supabase.com](https://supabase.com)
2. No SQL Editor, rode `supabase/migrations/0001_init.sql` e depois `0002_empresa_config_and_storage.sql`
3. Copie a URL do projeto e a `anon key` (Settings → API) para o seu `.env`

## Empresa & Marca (logo, dados do orçamento)

A aba **Empresa & Marca** no menu lateral permite:
- Enviar/trocar o logo (fica salvo no bucket `branding` do Supabase Storage)
- Editar nome, CNPJ, contato, endereço
- Definir a validade padrão dos orçamentos (em dias)
- Escrever os termos e condições que aparecem no rodapé da proposta

Esses dados alimentam automaticamente o cabeçalho da proposta gerada no passo 4 do
Gerador de Orçamentos.

## Subindo para o GitHub

Este ambiente não tem um conector de GitHub configurado, então o push precisa
ser feito por você:

```bash
cd nautic-crm
git init
git add .
git commit -m "Estrutura inicial do Estaleiro CRM"
git branch -M main
git remote add origin <URL_DO_SEU_REPOSITORIO>
git push -u origin main
```

## Estrutura de pastas

```
src/
  components/   Layout e componentes compartilhados
  pages/        CRM.tsx · Parametrizacao.tsx · Orcamentos.tsx
  lib/          cliente Supabase
  types/        tipos TypeScript espelhando o schema do banco
supabase/
  migrations/   SQL versionado
```

## Próximos passos sugeridos

1. Trocar os arrays `_MOCK` em cada página por chamadas `supabase.from(...).select()`
2. Implementar CRUD real na aba Parametrização (formulários de criar/editar)
3. Adicionar upload de imagens para o bucket do Supabase Storage
4. Implementar geração de PDF (sugestão: `@react-pdf/renderer`) no passo 4 do
   gerador de orçamentos
5. Importar os modelos/preços reais a partir da planilha enviada
