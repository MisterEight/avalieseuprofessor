# Rotas iniciais da API - Avalie Seu Professor

Baseado nos artefatos do projeto (documento de visao, APF e atas), estas rotas cobrem o escopo inicial. Ajuste conforme as decisoes de implementacao e autenticacao.

## Autenticacao/Contas
- `POST /auth/register` - cadastrar aluno.
- `POST /auth/login` - login local (usuario/senha).
- `POST /auth/logout` - encerrar sessao/token.
- `GET /auth/me` - obter dados do usuario autenticado.

## Professores
- `GET /professores` - busca/listagem com filtros (instituicao, departamento, avaliacao minima, nome).
- `GET /professores/top` - ranking de professores mais bem avaliados.
- `GET /professores/:id` - perfil do professor (media, contagem e resumo de avaliacoes).
- `GET /professores/:id/avaliacoes` - avaliacoes do professor (paginadas).
- (Admin, opcional) `POST /professores` / `PATCH /professores/:id` - CRUD de professores/instituicoes.

## Avaliacoes
- `POST /professores/:id/avaliacoes` - submeter avaliacao.
- `GET /avaliacoes/:id` - detalhar uma avaliacao (opcional).
- `GET /avaliacoes/:id/confirmacao` - confirmacao de submissao/status.
- `PATCH /avaliacoes/:id` - editar a propria avaliacao (reenvia para moderacao).
- `DELETE /avaliacoes/:id` - remover a propria avaliacao.

## Moderacao (Admin)
- `GET /admin/avaliacoes/pendentes` - fila de moderacao.
- `POST /admin/avaliacoes/:id/aprovar` - aprovar avaliacao.
- `POST /admin/avaliacoes/:id/rejeitar` - rejeitar avaliacao.

## Instituicoes/Departamentos (suporte a filtros)
- `GET /instituicoes` - listar instituicoes.
- `GET /instituicoes/:id/departamentos` - listar departamentos de uma instituicao.

## Confirmacao
- `GET /avaliacoes/:id/confirmacao` (ou resposta direta do POST de avaliacao) - confirmacao de submissao.

## Admin - CRUD de catalogo
- `POST /admin/instituicoes` / `PATCH /admin/instituicoes/:id` / `DELETE /admin/instituicoes/:id`
- `POST /admin/departamentos` / `PATCH /admin/departamentos/:id` / `DELETE /admin/departamentos/:id`
- `POST /admin/professores` / `PATCH /admin/professores/:id` / `DELETE /admin/professores/:id`
