# Tarefa 03 — Progresso no servidor (flags) + espelho no cliente

## Por quê
No CTF de mundo aberto, quase tudo depende de "o jogador já descobriu X?". Essa resposta precisa
vir do **servidor** (ver `codex/PLANO.md` §4): o navegador só exibe. Esta tarefa cria a base usada
por arquivos, apps liberados, lembranças e Wireshark.

## Convenção de nomes
`clue:` pista · `file:` arquivo lido · `talk:` NPC ouvido · `flag:` flag de CTF capturada ·
`q:` pergunta do incidente respondida · `app:` app liberado · `mem:` lembrança recuperada.

## O que fazer
1. `server/progress.cjs` (sobre a sessão da S1):
   - `set(sessao, chave)` → `true` se nova; `has`; `all`; `count(sessao, prefixo)`.
   - `requires(sessao, cond)`: `undefined/null` → true; string → `has`; `{all:[...]}`;
     `{any:[...]}`; `{count:{prefix, min}}`; aninhável.
   - **Quem pode setar o quê**: `flag:`, `clue:`, `mem:`, `app:` e `q:` só são setados por código
     do servidor (validação de desafio). O cliente pode **relatar** apenas `talk:<npcId>` e
     `file:<id>` por `POST /api/jogo/eventos { chave }` — e só para ids existentes em uma lista
     permitida (NPCs de `data/npcs.js`; arquivos do VFS, tarefa 04). Qualquer outra chave → 403.
2. Rotas: `GET /api/jogo/estado` passa a devolver `{ progresso, contagem: { flags, lembrancas } }`;
   `POST /api/jogo/eventos`.
3. Cliente: `engine/progress.js` — classe `Progress` **espelho**: `has`, `all`, `count`,
   `requires` (mesma semântica, para decidir o que mostrar), `sincronizar(estado)` a partir das
   respostas da API, e `on(listener)` disparado para cada chave nova recebida.
   `Game` cria `this.progress` e sincroniza ao iniciar a partida e após cada resposta da API que
   traga `progresso`. Ao concluir diálogo de NPC, relatar `talk:<npcId>`.
4. Pistas: as pistas de missão já vêm do servidor (S2). As de diálogo continuam no cliente por
   enquanto (não são segredo); registrar também `talk:`.
5. Testes: `verify-progress.cjs` cobre `requires` (todas as formas e aninhamento), set/has/count,
   lista permitida de eventos (aceita `talk:npc_qa`, recusa `flag:x`, `talk:inexistente`,
   `mem:1`) e o espelho do cliente (`sincronizar` dispara `on` só para chaves novas).

## Arquivos que podem mudar
`server/progress.cjs` (novo), `server/*` (rotas), `engine/progress.js` (novo),
`verify-progress.cjs` (novo), `engine/game.js`, `engine/api.js`, `index.html`, `AGENTS.md`.

## Critérios de aceite
- Todos os `verify*.cjs` passam.
- No navegador: conversar com o Mark → `__game.progress.all()` contém `talk:npc_qa`; resolver a
  missão do Dev 1 → contém `clue:...`. No console, `fetch('/api/jogo/eventos', {method:'POST',
  headers:{'content-type':'application/json'}, body:'{"chave":"flag:teste"}'})` → 403.

## Prompt para o Codex
```
Leia AGENTS.md, codex/PLANO.md (seção 4) e codex/tarefas/03-progresso.md.
Pré-requisitos: S1 e S2 concluídas. Execute somente a tarefa 03. Ao final, liste arquivos
alterados, saída de todos os verify*.cjs e o teste manual.
```
