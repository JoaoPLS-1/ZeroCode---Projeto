# Tarefa M1 — Modos de jogo (Rápido · Pitch · Completo)

## Por quê
O mentor do TechSummit pediu três versões do mesmo jogo, adaptando o que existe (não reescrever):
**Rápido** (leigos, 2 salas, ~5–8 min), **Pitch** (apresentação ao vivo do autor) e **Completo**
(o jogo atual, público técnico). Esta tarefa cria só a **infraestrutura de modos**; o conteúdo de
Pitch e Rápido vem nas tarefas P1 e R1.

## O que fazer
1. `server/data/modos.cjs`:
   ```js
   module.exports = {
     completo: { nome: 'Completo', salas: '*', metaLembrancas: 5 },
     rapido:   { nome: 'Rápido',   salas: ['room_dev', 'room_secret'], metaLembrancas: 2 },
     pitch:    { nome: 'Pitch',    salas: '*', metaLembrancas: 5 },
   };
   ```
2. `POST /api/jogo/nova-partida { modo }` → valida contra a lista (padrão `completo`), guarda
   `sessao.modo`; `GET /api/jogo/estado` devolve `modo` e `metaLembrancas`.
3. **Meta de lembranças por modo**: `server/flags.cjs` libera `app:wireshark` e
   `evento:senha-lembrada` quando `count('mem:')` atinge `metaLembrancas` do modo (hoje fixo em 5).
   `GET /api/jogo/flags` devolve `meta` do modo. O caderno mostra `Lembranças X/meta`.
4. **Salas por modo**: o cliente recebe a lista de salas permitidas; tentar usar uma porta para
   sala fora do modo mostra uma fala curta de D.A.N.I.E.L. ("Essa área não faz parte desta
   investigação.") em vez de trocar de sala. O minimapa mostra só as salas do modo.
5. **Tela inicial**: trocar o botão único por três cartões lado a lado (visual sóbrio, mesmo estilo
   atual da tela inicial): **Rápido** ("5 minutos · para todos"), **Completo** ("Investigação
   completa · para quem é da área") e, menor/discreto abaixo, **Modo apresentação** (pitch).
   Cada um chama `nova-partida` com o modo. Tecla `P` na tela inicial também abre o pitch.
6. Testes `verify-modos.cjs`: modo inválido → completo; meta 2 no rápido libera o Wireshark com 2
   flags; meta 5 no completo continua; estado devolve modo/salas; nova partida troca de modo.
   `verify-e2e.cjs` continua passando no modo completo.

## Arquivos que podem mudar
`server/data/modos.cjs` (novo), `server/*`, `engine/game.js`, `engine/hud.js`, `engine/api.js`,
`engine/flags-ui.js`, `index.html`, `style.css`, `verify-modos.cjs` (novo), testes existentes
(só se precisarem passar o modo), `AGENTS.md`.

## Prompt para o Codex
```
Leia AGENTS.md e codex/tarefas/M1-modos.md. Execute somente a tarefa M1. Não faça git commit.
Ao final, liste arquivos alterados, saída de todos os verify*.cjs e o roteiro de teste manual.
```
