# Tarefa 01 — Atualizar testes desatualizados

## Objetivo
Fazer `verify.cjs` e `verify-player-frames.cjs` passarem **refletindo o comportamento atual do jogo**.
Os testes ficaram para trás em relação ao código; o jogo não deve mudar nesta tarefa.

## Diagnóstico conhecido
- `verify.cjs` linha ~21: espera `player.walkDistance === 0` ao parar; o `Player` atual preserva
  `walkDistance` (ciclo de passos contínuo). Ajustar a asserção para o comportamento atual
  (ex.: verificar `moving === false` e que `walkDistance` não cresce parado).
- `verify-player-frames.cjs`: `measurePlayerFrames` hoje devolve `anchorX` em cada frame e o atlas
  também recebe `referenceHeight`. A expectativa precisa incluir `anchorX` calculado.
- Bloco "Progressão" de `verify.cjs` testa o fluxo antigo de múltipla escolha (`CHALLENGES`) e o
  bloqueio do terminal final com 0/5. Hoje os 5 PCs usam missões de código (`CODE_MISSIONS`,
  já cobertas por `verify-computer.cjs`) e a decisão final está liberada em modo de teste.
  Reescreva esse bloco para cobrir o que existe hoje (ex.: coleta de pista por `addClue`, cálculo
  da classificação S/A/B em `_showResult`, contagem de hipóteses incorretas) ou remova as partes que
  testam comportamento inexistente — sem enfraquecer os demais testes (colisão, transição,
  diálogo, avisos).
- Podem existir outras falhas depois da primeira; corrija uma por vez, sempre do lado do teste.

## Arquivos que podem mudar
`verify.cjs`, `verify-player-frames.cjs`. **Nenhum arquivo do jogo.**

## Se encontrar um bug real no jogo
Não corrija. Descreva no resumo final (arquivo, linha, cenário) para decidirmos depois.

## Critérios de aceite
- Os quatro comandos terminam sem erro e imprimem suas mensagens de aprovação:
  `node verify.cjs`, `node verify-computer.cjs`, `node verify-npc-animation.cjs`,
  `node verify-player-frames.cjs`.
- `git diff --stat` mostra apenas os dois arquivos de teste.
- Atualize em `AGENTS.md` a seção "Rodar e testar" removendo a nota de que os testes já falham.

## Prompt para o Codex
```
Leia AGENTS.md, codex/PLANO.md (apenas contexto) e codex/tarefas/01-testes.md.
Execute somente a tarefa 01. Não altere arquivos do jogo e não avance para outras tarefas.
Ao final, liste os arquivos alterados, a saída dos quatro verify*.cjs e qualquer bug real
do jogo que você tenha notado (sem corrigi-lo).
```
