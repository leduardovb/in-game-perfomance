# In-Game Performance

Web app (PWA, funciona no celular) para acompanhar treinos diários e, nas próximas etapas, a evolução em League of Legends e Counter-Strike 2.

## O que já existe

- **Treino de hoje** por jogo: 1 hora dividida em etapas com check, mais uma meta de partidas.
- **LoL**: um treino para cada rota (mid é a padrão; top, jungle, ADC e suporte também). **CS2**: treino geral.
- **Histórico** dos últimos 60 dias e sequência de dias com treino concluído.
- **Desempenho no LoL**: sincroniza as últimas partidas pela API da Riot e mostra winrate, KDA, CS/min e dano/min, gráficos de evolução e a lista de partidas (filtro Solo/Duo ou todas em Summoner's Rift).
- Acesso protegido por senha única (app de um usuário só).

## Stack

Next.js 16 (App Router, Server Actions) · TypeScript · Tailwind CSS 4 · Postgres com Drizzle ORM · Vitest.

## Estrutura

```
src/
  app/                    Rotas e páginas (login, home, /treino/[game], /treino/[game]/historico)
  components/             Componentes de UI (app-shell, progress-bar, training/*)
  lib/                    Infra compartilhada: env, auth, db, datas, logger, jogos
  modules/training/
    domain/               Regras puras: tipos, templates fixos, progresso, sequência
    repository.ts         Interface de persistência
    infra/                Implementações do repositório (Drizzle e em memória para testes)
    service.ts            Casos de uso (iniciar treino, marcar etapa, partidas, histórico)
    actions.ts            Server Actions: autenticação, validação (zod) e tratamento de erros
  modules/lol/
    domain/               Tipos, filas e métricas (KDA, CS/min, média móvel)
    riot/                 Cliente da API da Riot (validado com zod) e conversão para o domínio
    infra/                Repositórios Drizzle e em memória
    service.ts            Sincronização incremental e visão geral
    actions.ts            Server Action "Atualizar partidas"
  proxy.ts                Redireciona visitantes sem sessão para /login
drizzle/                  Migrações SQL geradas pelo drizzle-kit
```

Os templates de treino ficam em `src/modules/training/domain/templates.ts`. Quando um treino começa, as etapas são copiadas para o banco, então alterar um template não muda o histórico.

## Rodando localmente

1. Crie um projeto gratuito no [Supabase](https://supabase.com) (ou use qualquer Postgres).
2. Copie `.env.example` para `.env.local` e preencha as variáveis.
3. Instale e prepare o banco:

```bash
npm install
npm run db:migrate
npm run dev
```

### League of Legends

- `RIOT_ID` usa o formato `Nome#TAG`. Em arquivos `.env`, coloque entre aspas, porque `#` sem aspas inicia um comentário.
- `RIOT_API_KEY`: a chave de desenvolvimento expira a cada 24h. Para uso contínuo, peça uma Personal API Key em developer.riotgames.com.
- "Atualizar partidas" busca as 20 mais recentes e baixa só as que ainda não estão salvas. As páginas leem apenas do banco, sem chamar a Riot. Se a Riot limitar as requisições no meio, o que já foi baixado fica salvo e a próxima sincronização continua de onde parou.

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm test` | Testes unitários (Vitest) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run db:generate` | Gera uma migração a partir de `src/lib/db/schema.ts` |
| `npm run db:migrate` | Aplica as migrações no `DATABASE_URL` |

## Deploy (Vercel)

1. Importe o repositório na Vercel.
2. Cadastre `DATABASE_URL`, `APP_PASSWORD`, `SESSION_SECRET`, `APP_TIMEZONE`, `RIOT_ID`, `RIOT_PLATFORM` e `RIOT_API_KEY` em Settings > Environment Variables.
3. Rode `npm run db:migrate` apontando para o banco de produção antes do primeiro acesso.

No celular, abra o site e use "Adicionar à tela inicial" para instalar como app.
