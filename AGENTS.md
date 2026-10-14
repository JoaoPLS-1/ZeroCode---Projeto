# AGENTS.md — ZeroCode / Protocolo Zero

Guia para agentes de código (Codex etc.). Leia antes de qualquer alteração.

## Visão do jogo
Jogo de investigação top-down em HTML/CSS/JS puro que une **cibersegurança e desenvolvimento**.
A fase é pensada como um **CTF de mundo aberto**: o jogador explora livremente as salas, sem caminho
predefinido, e combina pistas (diálogos, arquivos, logs, computadores) com conceitos de cyber/dev
para cumprir objetivos. Novas mecânicas devem favorecer **várias rotas** e **descoberta**, não
sequências lineares obrigatórias.

- Protagonista: **Kael** (investigador). Assistente da decisão final: **D.A.N.I.E.L.** (sigla em aberto).
- Caso 01: às 02:14 o deploy 2.1 do NEXUS removeu o limite de retries (commit 7f2) → 1 requisição
  virou 4.096 tentativas internas. Vírus narrativo dos PCs: **LoopZero**.
- Todo texto visível ao jogador é **português do Brasil**.
- Será apresentado no **TechSummit** (tema IA). História, estrutura da fase e arquitetura-alvo:
  `codex/PLANO.md`.

## Fluxo de trabalho (importante)
- O trabalho é feito em **fragmentos**: cada prompt indica **uma** tarefa em `codex/tarefas/NN-*.md`.
- Execute **somente** a tarefa indicada. Não adiante tarefas seguintes, não "aproveite para melhorar"
  outras partes. Se notar algo fora do escopo, apenas relate no resumo final.
- Altere apenas os arquivos listados na tarefa (ou explique por que precisou de outro).
- Ao terminar: liste os arquivos alterados, a saída de todos os `verify*.cjs` e o roteiro de teste
  manual no navegador.
- Não marque status no `codex/PLANO.md`; o autor faz isso após revisar.

## Rodar e testar
- `node server.cjs` → http://localhost:8000 (ou `node serve.cjs` → :8765). As missões de código usam
  Web Worker e **exigem HTTP**; abrir `index.html` via file:// quebra essa parte.
- Testes (Node, sem dependências): `node verify.cjs`, `node verify-computer.cjs`,
  `node verify-npc-animation.cjs`, `node verify-player-frames.cjs`.
- Estado atual (13/10/2026): `verify-computer` e `verify-npc-animation` passam; `verify.cjs` (linha 21,
  `walkDistance` ao parar) e `verify-player-frames.cjs` **já falham** — testes desatualizados em relação
  ao código, não regressão sua. Não "conserte" o jogo para satisfazê-los sem confirmar a intenção.
- Sem build, sem npm, sem frameworks. Não adicione dependências.

## Arquitetura
Scripts clássicos carregados em ordem pelo `index.html` (globais compartilhadas). **A ordem importa.**

- `data/` — conteúdo:
  - `maps.js`: salas (`ROOMS`), `bounds`, `spawns`, `doors`, `obstacles`. Coordenadas no espaço do
    fundo (~1672×941), nunca da viewport. Obstáculo = retângulo ou `{points}` **convexo**
    (formas em U/L = várias peças).
  - `npcs.js`, `objects.js`: pontos de interação (`type`: npc, computer, computer_final, item, manager, door).
  - `dialogs.js`, `clues.js`: falas e pistas (`relevant: true` = registro técnico).
  - `code-missions.js`: missões JS (corpo de função `input → return`, testes `[input, esperado]`).
  - `missions.js`: hipóteses da decisão final.
- `engine/game.js` — loop, estados (`start`, `briefing`, `playing`, `transition`, `case`, `phone`,
  `result`, `complete`, `gameover`), troca de sala, interação.
- **Extensões por monkey-patch** de `Game.prototype` / `DialogueSystem.prototype` /
  `ZeroComputer.prototype` / `CaseExperience.prototype`, nesta ordem de carga:
  `case.js` (pausa, dossiê, marcadores, nota S/A/B, `ZeroComputer`) → `explorer.js` (ZeroFiles) →
  `manager.js` (Dante, Passe Ômega, bloqueio da Sala Secreta) → `main.js` → `windows-pixel.js` →
  `os-setup.js` (escolha ZeroOS/Windows) → `nexus-result.js`.
  Para novas mecânicas, prefira **módulos novos e explícitos** chamados pelo `Game` em vez de mais
  camadas de patch; se precisar patchar, guarde e chame o método original.
- Outros: `phone.js` (bolso + Teams narrativo), `hud.js` (caderno + minimapa 2×3),
  `dialogue.js`, `mission.js` (D.A.N.I.E.L.), `code-worker.js` (sandbox das missões), `player.js`,
  `renderer.js`, `collision.js`.
- Estilos: `style.css` + `ui/*.css`.

## Armadilhas conhecidas
- **Overrides no fim dos arquivos de dados.** `maps.js`, `dialogs.js`, `npcs.js` e `objects.js` redefinem
  valores no final (`Object.assign`, `push`, laços). Ex.: portas/spawns reais das salas estão no fim
  de `maps.js`; nomes reais dos NPCs vêm de `NPC_DIALOG_NAMES`; posição real dos NPCs vem de
  `NPC_PLACEMENTS`. **Sempre leia o arquivo até o fim** antes de editar dados.
- `engine/computer.js` é cópia literal do trecho final de `case.js` (redeclara `class ZeroComputer`) e
  não tem efeito. Edite a lógica dos PCs em `case.js`.
- O array `CHALLENGES` em `case.js` (múltipla escolha) está sem uso: os 5 PCs estão em `CODE_MISSIONS`.
- Retratos de diálogo são escolhidos pelo prefixo do nome antes de `·` (mapa em
  `DialogueSystem._renderPortraits`). Novo NPC com retrato = adicionar ali.
- Kael é o protagonista **e** existe um NPC "Kael · Café" (`kael-npc`). Cuidado com ambiguidade.
- Modos de teste ativos: decisão final sem exigir os 5 registros; Dante entrega o Passe Ômega direto.
- Progresso não é salvo: recarregar reinicia a partida.
- Arquivos de dados exportam via `if (typeof module !== 'undefined') module.exports = ...` para os
  testes Node. Mantenha esse padrão em novos arquivos de dados/engine.

## Convenções de alteração
- Mudanças pequenas e focadas; não reescreva arquivos inteiros nem reformate código existente.
- Siga o estilo do arquivo que está editando (alguns são compactos/minificados à mão; não expanda).
- Não apague nem renomeie assets em `assets/`. Arquivos `.png`, `_*.ps1` e `_*.cjs` da raiz são
  ferramentas/previews do autor; não remova sem pedido.
- Conteúdo narrativo novo (falas, pistas, puzzles) vai em `data/`, não hardcoded na engine.
- Puzzles devem ensinar um conceito real de cyber/dev e ser verificáveis (testes ou validação
  determinística), com dicas progressivas em vez de bloqueio permanente.
- Depois de mudar algo: rode os `verify*.cjs` e informe o resultado; para UI, descreva o que testar
  no navegador.
