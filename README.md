# Bibliotecário — Projeto Final (Desenvolvimento Fullstack)

Disciplina: [Desenvolvimento Full Stack](https://pucpr.instructure.com/courses/51253)

---

## Visão Geral
API REST para gerenciar uma biblioteca com CRUD completo para `autores`, `livros`, `usuarios` e `emprestimos`, com autenticação. Todas as respostas seguem o padrão JSON:

```json
{ "status": "ok|erro", "mensagem": "texto", "data": ... }
```

## Tecnologias

- Backend: Node.js + TypeScript, Express
- Banco: MySQL (via `mysql2`)
- Segurança: `bcryptjs` (hash de senhas), `jsonwebtoken` (JWT)
- Config / Dev: `dotenv`, `cors`, `tsx`, `typescript`
- Frontend (cliente): HTML5, CSS3, Bootstrap 5 (CDN), JavaScript puro (Vanilla JS)
- Controle de versão: Git / GitHub

---

## Pré-requisitos

- Node.js (recomendado >=18)
- MySQL (XAMPP / phpMyAdmin)
- Git

---

## Instalação e execução (backend)

1. Abrir terminal e instalar dependências:

```bash
cd backend
npm install
```

2. Criar arquivo `.env` na pasta `backend` com as variáveis:

```
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=biblioteca
DB_USER=root
DB_PASS=
JWT_SECRET=uma_chave_secreta_comprida
```

3. Importar schema e seeds (cria banco, tabelas e registros iniciais):

```bash
mysql -u root -p < backend/database/schema.sql
```

4. Rodar em desenvolvimento:

```bash
npm run dev
```

API base: `http://localhost:3000/api`

---

## Scripts (package.json)

- `npm run dev` — ambiente de desenvolvimento (tsx watch)
- `npm run build` — transpila TypeScript
- `npm run start` — executa a versão buildada

---

## Autenticação

- `POST /api/auth/login` — recebe `{ "email", "senha" }` e retorna `{ token, usuario }`.
- O token JWT deve ser enviado em todas as rotas protegidas via header:

```
Authorization: Bearer <token>
```

- `POST /api/auth/logout` — retorna mensagem de logout (stateless JWT).

---

## Endpoints

Observação: todas as rotas abaixo exigem `Authorization` com JWT, exceto `POST /api/auth/login`.

1) Autores
- `GET /api/autores` — lista autores ativos
- `GET /api/autores/:id` — retorna autor por id
- `POST /api/autores` — cria autor; corpo: `{ "nome": "...", "nacionalidade": "..." }`
- `PUT /api/autores/:id` — atualiza autor
- `DELETE /api/autores/:id` — exclusão lógica (`ativo = 0`)

2) Livros
- `GET /api/livros` — lista livros (inclui `autor_nome`)
- `GET /api/livros/:id` — busca por id
- `POST /api/livros` — cria livro; corpo exemplo:

```json
{ "titulo": "Dom Casmurro", "autor_id": 1, "isbn": "978-...", "ano": 1899, "disponivel": 1 }
```
- `PUT /api/livros/:id` — atualiza livro
- `DELETE /api/livros/:id` — exclusão lógica

3) Usuários
- `GET /api/usuarios`
- `GET /api/usuarios/:id`
- `POST /api/usuarios` — criar usuário; validações: `nome`, `email` válido, `senha` mínimo 6 chars. Corpo exemplo:

```json
{ "nome": "Joao Silva", "email": "joao@ex.com", "senha": "senha123" }
```
- `PUT /api/usuarios/:id` — atualizar (senha opcional)
- `DELETE /api/usuarios/:id` — exclusão lógica

4) Empréstimos
- `GET /api/emprestimos`
- `GET /api/emprestimos/:id`
- `POST /api/emprestimos` — criar; validações obrigatórias: `livro_id`, `usuario_id`, `data_saida`, `data_prevista`. Corpo exemplo:

```json
{
  "livro_id": 1,
  "usuario_id": 2,
  "data_saida": "2026-06-01",
  "data_prevista": "2026-06-15"
}
```
- `PUT /api/emprestimos/:id` — atualizar
- `PATCH /api/emprestimos/:id/devolver` — registra `data_devolucao`
- `DELETE /api/emprestimos/:id` — exclusão lógica

---

## Regras de negócio e validações principais

- Campos obrigatórios (validados em `src/middlewares/validacao.ts`):
  - Login: `email` (formato válido) e `senha`.
  - Autor: `nome`.
  - Livro: `titulo` e `autor_id`.
  - Usuário: `nome`, `email` (criação exige `senha` >= 6 caracteres).
  - Empréstimo: `livro_id`, `usuario_id`, `data_saida`, `data_prevista`.
- Senha armazenada com hash (`bcryptjs`).
- `data_prevista` deve ser posterior a `data_saida`.
- Exclusões são lógicas (`ativo = 0`).
- Todas as queries usam prepared statements (`?` + parâmetros) para evitar SQL injection.

---

## Exemplos de requisições (cURL)

1) Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@biblioteca.com","senha":"admin123"}'
```

Resposta (sucesso):

```json
{
  "status": "ok",
  "mensagem": "Login realizado com sucesso.",
  "data": {
    "token": "eyJhbGciOiJI...",
    "usuario": { "id": 1, "nome": "Administrador", "email": "admin@biblioteca.com" }
  }
}
```

2) Listar livros (com token)

```bash
curl http://localhost:3000/api/livros \
  -H "Authorization: Bearer <token>" \
  -H "Accept: application/json"
```

3) Criar livro

```bash
curl -X POST http://localhost:3000/api/livros \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Novo Livro","autor_id":1,"isbn":"123","ano":2026,"disponivel":1}'
```

Erro de validação (exemplo):

```json
{ "status": "erro", "mensagem": "Titulo e obrigatorio.", "data": null }
```

---

## Banco de dados (schema e seeds)

- Arquivo: `backend/database/schema.sql` — cria as tabelas `autores`, `usuarios`, `livros`, `emprestimos` e insere seeds (autores, livros, usuário admin).
- Usuário admin seed: `admin@biblioteca.com` / senha `admin123` (senha já hash armazenada no seed).

---

## Segurança e boas práticas

- Não versionar `.env` (evitar expor `DB_PASS` e `JWT_SECRET`).
- Usar JWT para rotas protegidas e `bcryptjs` para senhas.
- Validar entrada tanto no front quanto no back.

---

## Testes rápidos

1. `npm run dev` no diretório `backend`.
2. Fazer login com o usuário seed e testar `GET /api/livros` com o token retornado.

---

## Créditos / Referências

- Disciplina: Desenvolvimento Full Stack — PUC PR
- Professor: Prof. Giulio Domenico Bordin

---