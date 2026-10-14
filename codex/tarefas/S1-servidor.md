# Tarefa S1 — Servidor do jogo (base)

## Por quê
Hoje o jogo é 100% navegador: qualquer F12 mostra respostas. A arquitetura-alvo está em
`codex/PLANO.md` §4 ("o servidor é a fonte da verdade"). Esta tarefa cria só a **base** do servidor;
nenhuma regra do jogo muda ainda.

Contexto: execução no estande (`localhost`), sem ranking, sem persistência entre partidas.
Existem dois servidores improvisados (`server.cjs` porta 8000 e `serve.cjs` porta 8765) — serão
substituídos.

## O que fazer
1. Pasta `server/`, Node **22.13 ou superior**, só módulos nativos (`node:http`, `node:crypto`, `node:fs`,
   `node:path`), CommonJS (`.cjs`):
   - `server/index.cjs` — sobe o servidor em `127.0.0.1` (porta `PORT` ou 8000); ao iniciar, avisa
     e encerra se a versão do Node for < 22.13.
   - `server/app.cjs` — exporta `createApp()` que devolve o `http.Server` **sem** chamar `listen`
     (para os testes subirem em porta aleatória).
   - `server/router.cjs` — roteador mínimo (método + caminho → handler), leitura de corpo JSON com
     limite de 64 KB, respostas JSON padronizadas (`{ ok: true, ... }` / `{ ok: false, erro }`) e
     404/405/413 corretos.
   - `server/sessions.cjs` — sessões em memória: id aleatório (`crypto.randomBytes(24)`) em cookie
     `zc_sid` com `HttpOnly; SameSite=Strict; Path=/`; expiração após 2 h sem uso; `get(req)`,
     `create(res)`, `reset(sessao)`. Estado inicial da sessão: `{ criadaEm, progresso: [] }`.
2. **Arquivos estáticos com lista explícita**: servir apenas `index.html`, `style.css`,
   `main.js`, e as pastas `assets/`, `data/`, `engine/`, `ui/`. Qualquer outro caminho
   (`server/`, `codex/`, `AGENTS.md`, `verify*.cjs`, `.git/`, `*.ps1`…) → 404. Bloquear `..`,
   caminhos codificados e barras invertidas. Tipos MIME corretos (incluindo `.woff2`, `.svg`).
3. **Cabeçalhos de segurança** em todas as respostas: `X-Content-Type-Options: nosniff`,
   `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY` e uma
   `Content-Security-Policy` compatível com o jogo atual (scripts e estilos do próprio domínio,
   imagens `self` e `data:`, `worker-src 'self'`, `connect-src 'self'`). Se o jogo atual depender
   de algo inline, liste no resumo em vez de afrouxar a política sem avisar. `Cache-Control:
   no-store` para a API.
4. API inicial em `/api/jogo`:
   - `POST /api/jogo/nova-partida` → cria (ou zera) a sessão; responde `{ ok: true }`.
   - `GET /api/jogo/estado` → `{ ok: true, progresso: [...] }` (exige sessão; sem sessão → 401).
5. Cliente: `engine/api.js` com `api.get(caminho)` e `api.post(caminho, corpo)` (mesma origem,
   JSON, erro tratado). O botão **INICIAR INVESTIGAÇÃO** chama `nova-partida` antes de seguir (se o
   servidor não responder, mostrar mensagem clara na tela inicial em vez de travar). "Sair para o
   início" na pausa também deve iniciar uma partida nova.
6. Remover `server.cjs` e `serve.cjs`. Atualizar `README.md` ("Jogar": `node server/index.cjs` e
   abrir http://localhost:8000) e `AGENTS.md` (seção "Rodar e testar", Node 22.13+, nova pasta
   `server/`, regra "o navegador nunca recebe respostas").
7. `verify-server.cjs`: sobe `createApp()` em porta 0 e testa: `index.html` 200 com cabeçalhos de
   segurança; `AGENTS.md`, `server/app.cjs`, `codex/PLANO.md`, `/../AGENTS.md`, `%2e%2e/` → 404;
   `GET /api/jogo/estado` sem sessão → 401; `nova-partida` define cookie `HttpOnly` e depois
   `estado` responde 200; corpo > 64 KB → 413; rota inexistente da API → 404 JSON.

## Arquivos que podem mudar
`server/*` (novos), `engine/api.js` (novo), `verify-server.cjs` (novo), `engine/game.js`,
`engine/case.js` (só o "Sair para o início"), `index.html`, `README.md`, `AGENTS.md`;
remover `server.cjs` e `serve.cjs`.

## Critérios de aceite
- `node verify-server.cjs` e todos os demais `verify*.cjs` passam.
- `node server/index.cjs` → abrir http://localhost:8000 → o jogo funciona como antes, incluindo a
  missão do Computador Dev 1 (o Worker precisa carregar com a CSP).
- http://localhost:8000/AGENTS.md e http://localhost:8000/codex/PLANO.md → 404.
- Console do navegador sem erros de CSP.

## Prompt para o Codex
```
Leia AGENTS.md, codex/PLANO.md (seção 4) e codex/tarefas/S1-servidor.md. Execute somente a
tarefa S1: base do servidor, sem mover regras do jogo para ele ainda. Ao final, liste arquivos
alterados, saída de todos os verify*.cjs e o roteiro de teste manual.
```
