# Tarefa R1 — Modo Rápido (leigos, 2 salas, sem programar)

## Por quê
Para o público geral do estande: ~5–8 minutos, **sem digitar código**, mantendo a história e o
final (Wireshark → IP:porta → ÔMEGA → decisão). Salas: **Desenvolvimento** e **Sala Secreta**.
Meta: **2 lembranças**. Pré-requisito: tarefa M1.

## O que fazer (tudo condicionado a `modo === 'rapido'`)
1. **Porta**: a porta de cima à direita do Desenvolvimento (hoje leva ao Café) passa a ser a
   **porta da Sala Secreta** no modo rápido — mesmo painel de IP:porta (tarefa 09), mesma validação
   no servidor. A porta da esquerda (QA/Infra) mostra a fala de "área fora da investigação".
2. **Objetivos guiados** no caderno do HUD (só no modo rápido), marcados conforme o progresso:
   1. "Revise o código que a IA gerou" (Git no Dev 1)
   2. "Decifre a mensagem escondida" (Roda de César)
   3. "Encontre o servidor que não deveria falar" (Wireshark)
   4. "Abra a sala que ninguém conhece" (porta)
   5. "Decida o que fazer" (ÔMEGA)
3. **Flag 1 — code review (sem código)**: no Dev 1 aparece o app Git (já existe). Reaproveitar o
   review do PR #214 (flag `retry-E`). No modo rápido, o PR mostra uma instrução simples no topo:
   "Clique nas linhas que tiraram a proteção do sistema e envie a revisão."
4. **Flag 2 — cifra (sem código)**: nova flag `cifra-R` (catálogo de flags, caso `IA`, ficha sobre
   cifra de César/criptografia básica). Edu (Dev, esquerda) entrega um bilhete: "Achei isso no log
   do NEXUS: `R VHUYLGRU TXH GRUPH DLQGD IDOD.` A Lívia sempre usava a chave 3." Pergunta no dossiê
   (só no rápido, tipo escolha): "O que a mensagem decifrada diz?" com 3 opções — a correta
   "O SERVIDOR QUE DORME AINDA FALA." e duas plausíveis → `cifra-R`. A Roda de César fica no Dev 1.
5. **Wireshark simplificado**: no modo rápido, disponível no **Dev 1** (não só no Servidor de
   Infra), liberado com 2 lembranças. Abre com uma dica fixa no topo: "Quase todo o tráfego é
   HTTP. Procure o que é diferente — clique nele para ver de onde vem e para qual porta vai." O
   filtro continua disponível, mas não é necessário.
6. **D.A.N.I.E.L. mais presente**: se o jogador ficar 45 s sem progresso, uma fala curta apontando o
   próximo objetivo (sem dar resposta).
7. **Missões de código**: ocultas no modo rápido (Dev 1 e Dev 2 não pedem código nem senha).
8. Fim: igual ao completo (cena da ÔMEGA, console, decisão).
9. Testes `verify-rapido.cjs`: percurso pela API no modo rápido (review → pergunta da cifra →
   2 lembranças → captura liberada no Dev 1 → porta → ÔMEGA → decisão); captura 403 no Dev 1 fora
   do modo rápido; pergunta `cifra` só aparece no rápido.

## Arquivos que podem mudar
`server/*`, `server/data/*`, `data/maps.js` (porta condicional), `data/dialogs.js` (bilhete do Edu),
`engine/game.js`, `engine/hud.js`, `engine/secret-door.js`, `engine/computer.js`,
`engine/os/apps/*.js` (`availableAt` por modo), `engine/os/apps.js`, `index.html`, `ui/*.css`,
`verify-rapido.cjs` (novo), `AGENTS.md`.

## Prompt para o Codex
```
Leia AGENTS.md, codex/tarefas/M1-modos.md (já concluída) e codex/tarefas/R1-rapido.md.
Execute somente a tarefa R1. Não faça git commit. Ao final, liste arquivos alterados, saída de
todos os verify*.cjs e o roteiro de teste manual.
```
