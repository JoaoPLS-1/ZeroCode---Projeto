# Tarefa 03 — Sistema de progresso (flags)

## Por quê
No CTF de mundo aberto, quase tudo depende de "o jogador já descobriu X?" — ter lido um arquivo,
ouvido um NPC, capturado uma flag. Hoje só existem pistas (`ClueSystem`). Precisamos de uma base
genérica de **fatos/flags**, usada pelas próximas tarefas (arquivos que aparecem, apps liberados,
perguntas do incidente, Wireshark).

## O que fazer
Criar `engine/progress.js` com a classe `Progress`:
- `set(flag)` → `true` se a flag era nova; `has(flag)`; `all()` (array); `count(prefix)`
  (ex.: `count('flag:')`).
- `on(listener)` → registra callback `(flag) => {}` chamado quando uma flag nova é setada;
  retorna função para remover o listener.
- `requires(cond)` → avalia uma condição de desbloqueio usada pelos dados:
  `undefined`/`null` → `true`; string → `has`; `{all:[...]}`; `{any:[...]}`; `{count:{prefix, min}}`.
  Condições podem ser aninhadas em `all`/`any`.
- Estado só em memória (a partida zera ao recarregar — é desejado para o evento).
- Exportar com `if (typeof module !== 'undefined') module.exports = Progress;`.

Integração mínima:
- Carregar `engine/progress.js` no `index.html` antes de `engine/game.js`.
- No construtor do `Game`: `this.progress = new Progress();`.
- Ao coletar uma pista (`ClueSystem.addClue` bem-sucedido), setar `clue:<id>` no progresso
  (pode ser no callback `onClueFound` já existente em `game.js`).
- Convenção de nomes (documentar no topo do arquivo): `clue:`, `file:` (arquivo lido),
  `talk:` (NPC ouvido), `flag:` (flag de CTF capturada), `q:` (pergunta do incidente respondida),
  `app:` (app liberado).

Testes: criar `verify-progress.cjs` cobrindo set/has/duplicata, listener (chamado uma vez por
flag nova, removível), e todas as formas de `requires`, incluindo aninhamento.

## Arquivos que podem mudar
`engine/progress.js` (novo), `verify-progress.cjs` (novo), `engine/game.js`, `index.html`,
`AGENTS.md` (mencionar `Progress` na seção Arquitetura e o novo teste em "Rodar e testar").

## Critérios de aceite
- `node verify-progress.cjs` passa, e os demais verify continuam passando.
- No navegador, coletar uma pista e rodar no console `__game.progress.all()` → contém `clue:<id>`.
- Nenhuma mudança visível no jogo.

## Prompt para o Codex
```
Leia AGENTS.md e codex/tarefas/03-progresso.md (contexto em codex/PLANO.md, seção 4).
Execute somente a tarefa 03. Ao final, liste arquivos alterados, saída de todos os verify*.cjs
e o teste manual no console do navegador.
```
