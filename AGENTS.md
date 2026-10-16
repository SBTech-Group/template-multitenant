# {{PRODUTO_NOME}} — instruções para agentes

- Tipo: `{{MODALIDADE}}`
- Segue: SBAGENTS v{{SBAGENTS_VERSAO}} (padrões em `../SBAGENTS/standards/00-index.md`, somente leitura)
- Branches: `hml` (homologação, recebe os PRs) · `main` (produção, só recebe PR de `hml`). Agentes trabalham em `agente/<nome>/<assunto>`.
- Repo: `SBTech-Group/{{PRODUTO_SLUG}}`. Criado pelo Admin Hub a partir de `template-{{TEMPLATE}}`.

## O que este sistema faz

{{PRODUTO_DESCRICAO}}

Clientes entram pelo Admin Hub: o Hub cria cada ambiente chamando `tenant-provision` (ver Integrações).

## Como rodar e testar

```bash
cp .env.example .env    # preencha VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY e VITE_DEV_TENANT_SLUG
npm install
npm run dev
npm run typecheck && npm run build && npm test
deno test --allow-env --no-lock supabase/functions/_shared
```

Todo PR roda esses passos no CI (`.github/workflows/ci.yml`).

## Módulos

A lista que o Hub lê está em `supabase/functions/_shared/modules.ts`. Cada módulo do frontend fica em `src/modules/<chave>/index.ts` e é registrado em `src/app/menu.tsx`.

{{MODULOS_TABELA}}

## Integrações ativas

Cada uma segue o guia em `../SBAGENTS/integracoes/`.

{{INTEGRACOES}}

## Isolamento

Multi-tenant: um tenant por empresa, endereço `<slug>.<domínio>`.

- Toda tabela de domínio tem `tenant_id uuid not null references tenants`, índice e policy com `current_tenant_id()` (MT-02).
- `current_tenant_id()` vem de `app_metadata.tenant_id`, gravado pela `tenant-provision`.
- Superadmin da SB Tech: `app_metadata.is_system_admin`, função `is_system_admin()` (MT-05).
- Antes do login o app usa a RPC `tenant_publico(slug)`, que devolve só id e identidade visual.

## Edge Functions

| Função | Quem chama | Autenticação |
|---|---|---|
| `tenant-provision` | Admin Hub | Bearer `HUB_PROVISIONING_TOKEN` (`_shared/hub.ts > isHub`) |
| `tenant-modules` | Admin Hub | Bearer `HUB_PROVISIONING_TOKEN` |

Toda função nova que usa a service role autentica quem chama dentro da função (SEC-06).

## Secrets (só nomes)

| Nome | Onde |
|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Build no Coolify |
| `HUB_PROVISIONING_TOKEN` | Supabase do produto. Mesmo valor de `{{TOKEN_REF}}` no Supabase do Hub |
| `PRODUCT_DOMAIN`, `SYSTEM_ADMIN_EMAIL` | Supabase do produto |

## Ambientes

Projeto no Coolify com dois environments: `homologação` (servidor Homologação, branch `hml`, `<slug>-hlg.sbtech-group.com`) e `produção` (servidor Produção, branch `main`, `<slug>.sbtech-group.com`). `VITE_SUPABASE_*` são manuais por ambiente e o deploy só roda depois delas. Detalhes em `../SBAGENTS/standards/arquitetura.md > Ambientes`. Erros de log e deploy falho chegam como cards em Tarefas do Hub (Sentinela).

## Pontos sensíveis

| Área | Por que é sensível |
|---|---|
| `tenant-provision` | Idempotência; erro duplica tenant ou perde módulos |
| `supabase/migrations/0001_core.sql`, `0002_hub_e_superadmin.sql` | Base do isolamento; correção é migration nova |

## Contratos externos

| Função | Consumidor |
|---|---|
| `tenant-provision`, `tenant-modules` | Admin Hub (`../SBAGENTS/integracoes/hub.md`) |

## Desvios aceitos do padrão

Nenhum.

## Não tocar

- `.env*`, chaves e certificados
- Migrations já aplicadas
- `src/styles/sb-tech-base.css` (identidade da casa, FE-02)
- `.github/workflows/`
