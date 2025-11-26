# Avalie Seu Professor

Projeto inicial para portal de avaliacoes de professores.

## Stack definida
- Front-end: JavaScript, layout inicial com Bootstrap (framework adicional opcional).
- Back-end: Node.js/JavaScript (sugestao: Express ou Fastify).
- Banco de dados: PostgreSQL em Docker.

## Ambiente e infraestrutura
1) Crie o arquivo de variaveis: `cp .env.example .env`
2) Suba o Postgres localmente: `docker compose up -d`
   - Conexao padrao: `postgres://POSTGRES_USER:POSTGRES_PASSWORD@localhost:POSTGRES_PORT/POSTGRES_DB`.
   - O `db/schema.sql` e `db/seed.sql` sao aplicados automaticamente na primeira subida (via `/docker-entrypoint-initdb.d`). Para reexecutar, limpe o volume: `docker compose down -v` e suba novamente.
3) Volumes: dados em `postgres_data` (definido no `docker-compose.yml`).

## API (Node/Express)
- Instale dependencias: `npm install`
- Desenvolvimento: `npm run dev` (nodemon)
- Producao local: `npm start`
- Endpoints iniciais: ver `docs/api-rotas.md`.
- Credenciais seed: `aluno@exemplo.com` / `123456` (role student) e `admin@exemplo.com` / `123456`.
- Autenticacao: `POST /auth/login` retorna um JWT (Bearer). Use-o em rotas protegidas (ex.: `POST /professores/:id/avaliacoes`, rotas /admin).

## Proximos passos
- Escolher framework do front (pode iniciar com HTML + Bootstrap e evoluir para React, se necessario).
- Inicializar o back (ex.: `npm install` e configurar Express/Fastify e conexao Postgres).
- Documentar como instalar dependencias, rodar o projeto e executar testes.
- Adicionar informacoes de licenca.
