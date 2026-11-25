# In-Game Performance

Web app (PWA, funciona no celular) para acompanhar treinos diários e, nas próximas etapas, a evolução em League of Legends e Counter-Strike 2.

## O que já existe

- **Treino de hoje** por jogo: 1 hora dividida em etapas com check, mais uma meta de partidas.
- **LoL**: um treino para cada rota (mid é a padrão; top, jungle, ADC e suporte também). **CS2**: treino geral.
- **Histórico** dos últimos 60 dias e sequência de dias com treino concluído.
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
2. Cadastre `DATABASE_URL`, `APP_PASSWORD`, `SESSION_SECRET` e `APP_TIMEZONE` em Settings > Environment Variables.
3. Rode `npm run db:migrate` apontando para o banco de produção antes do primeiro acesso.

No celular, abra o site e use "Adicionar à tela inicial" para instalar como app.
