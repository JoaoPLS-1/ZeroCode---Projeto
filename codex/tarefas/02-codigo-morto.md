# Tarefa 02 — Remover código morto

## Objetivo
Eliminar duplicações que confundem futuras alterações, sem mudar o comportamento do jogo.

## Itens
1. `engine/computer.js` é cópia literal do trecho de `case.js` que começa em
   `// ZeroOS lab: per-machine state persists...` (classe `ZeroComputer` + patches de
   `CaseExperience.prototype.terminal/close`). Carregado depois, ele redeclara `class ZeroComputer`
   e gera erro no console. **Mover** a fonte única para `engine/computer.js` e **remover** o trecho
   duplicado de `case.js` (assim `verify-computer.cjs`, que lê `engine/computer.js`, continua
   testando o código real). Confirme que a ordem no `index.html` mantém `case.js` antes de
   `computer.js` e `computer.js` antes de `explorer.js`.
2. `CHALLENGES` em `case.js` e o caminho de múltipla escolha em `CaseExperience.terminal` não são
   mais usados (todos os PCs estão em `CODE_MISSIONS`). Remover o array e simplificar `terminal`
   para não depender dele, mantendo o comportamento atual dos PCs.
3. Atualizar `AGENTS.md` (seção "Armadilhas conhecidas") removendo os dois itens resolvidos e
   indicando que a lógica dos PCs fica em `engine/computer.js`.

## Arquivos que podem mudar
`engine/case.js`, `engine/computer.js`, `AGENTS.md`, `verify.cjs` (só se referenciar `CHALLENGES`).

## Critérios de aceite
- Os quatro `verify*.cjs` passam.
- Nenhum erro no console ao abrir o jogo (`node server.cjs`, http://localhost:8000).
- Teste manual: iniciar, ir ao Computador Dev 1, escolher sistema, abrir Arquivos, ler
  `instrucoes.txt`, executar a solução
  `return input.status === 503 && input.attempt < 3;` → evidência coletada e senha exibida.
  Abrir o Computador Dev 2 → pede senha. Esc fecha o PC.

## Prompt para o Codex
```
Leia AGENTS.md e codex/tarefas/02-codigo-morto.md. Execute somente a tarefa 02.
Não mude comportamento do jogo. Ao final, liste arquivos alterados, saída dos verify*.cjs
e confirme o roteiro de teste manual que eu devo executar no navegador.
```
