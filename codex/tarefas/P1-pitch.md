# Tarefa P1 — Modo Pitch (apresentação ao vivo por capítulos)

## Por quê
O autor apresenta o projeto ao vivo no TechSummit (sexta-feira) com pouco tempo. O modo Pitch leva
direto aos momentos de impacto do jogo, já preparados, com uma legenda curta de venda em cada um.
O autor controla com o teclado (ou um passador de slides). Pré-requisito: tarefa M1.

## Capítulos (`server/data/pitch.cjs`)
Cada capítulo: `{ titulo, legenda, sala, spawn, progresso: [...chaves], acao }`.
O servidor aplica o `progresso` na sessão (apenas se `sessao.modo === 'pitch'`) e o cliente
executa a `acao`. Textos exatamente como abaixo:

1. **O incidente** — sala `room_dev`, ação `abertura` (diálogo de abertura do Kael/D.A.N.I.E.L.).
   Legenda: "Times usam IA para gerar código e publicam sem revisar. O ZeroCode transforma esse
   risco em uma investigação jogável."
2. **Aprender fazendo** — `room_dev`, progresso `flag:retry-C`, ação `abrir-pc:computer_dev_left`
   com o desafio `pagamento-validar` selecionado no ZeroTrace.
   Legenda: "O jogador corrige código real gerado por IA: validação no backend, regra de negócio
   e testes — com dicas de um assistente."
3. **Cada acerto ensina** — `room_dev`, ação `mostrar-flag:pagamento-C` (exibe o painel de flag
   com ficha e lembrança; capturar pelo servidor).
   Legenda: "Cada conquista vem com uma ficha de conhecimento: o conceito, o que o código gerado
   errou e como prevenir."
4. **Investigação de rede** — `room_qa_infra`, progresso com 5 lembranças e `app:wireshark`,
   ação `abrir-app:computer_infra_upper:wireshark` (captura aberta, sem filtro).
   Legenda: "Cibersegurança na prática: 50 pacotes, um filtro, e uma comunicação que não deveria
   existir."
5. **A virada** — `room_secret`, progresso `acesso:sala-secreta`, ação `omega` (cena da ÔMEGA).
   Legenda: "A IA que escrevia o código de todo mundo estava escondida dentro do sistema."
6. **Decisão e resultado** — `room_secret`, progresso `evento:omega-encontrada`, ação `decisao`.
   Legenda: "O jogador decide como responder ao incidente e recebe uma nota que explica cada
   escolha. Três modos: rápido para todos, completo para profissionais e apresentação."

## O que fazer
1. `POST /api/jogo/pitch/capitulo/:n` (só em sessão `pitch`; senão 403): zera o progresso da sessão,
   aplica o `progresso` do capítulo e devolve `{ capitulo, titulo, legenda, sala, spawn, acao, total }`.
   As chaves podem ser setadas diretamente pelo servidor (é um preset de demonstração restrito ao
   modo pitch; não reutilizar a rota dev).
2. Cliente `engine/pitch.js`:
   - Barra inferior discreta: `03 / 06 · Cada acerto ensina` + legenda em texto grande e legível
     (projetor). Tecla **H** esconde/mostra a barra.
   - Navegação: **→ / PageDown / N** próximo; **← / PageUp / B** anterior; **1–6** salto direto;
     **Esc** continua fechando janelas normalmente (não sai do pitch).
   - Ao trocar de capítulo: fecha o que estiver aberto (PC, diálogo, painel), troca de sala com a
     transição normal, posiciona o Kael no `spawn` e executa a `acao`.
   - Fora das ações, o autor pode jogar livremente (andar, abrir PCs) durante o pitch.
3. Testes `verify-pitch.cjs`: rota 403 fora do modo pitch; cada capítulo aplica exatamente o
   progresso esperado (e zera o anterior); 6 capítulos; n inválido → 400.

## Arquivos que podem mudar
`server/data/pitch.cjs`, `server/pitch.cjs`, `engine/pitch.js`, `ui/pitch.css` (novos),
`server/*`, `engine/game.js`, `engine/computer.js` (selecionar desafio ao abrir),
`engine/omega.js`, `engine/mission.js`, `index.html`, `verify-pitch.cjs` (novo), `AGENTS.md`.

## Prompt para o Codex
```
Leia AGENTS.md, codex/tarefas/M1-modos.md (já concluída) e codex/tarefas/P1-pitch.md.
Execute somente a tarefa P1. Não faça git commit. Ao final, liste arquivos alterados, saída de
todos os verify*.cjs e o roteiro de teste manual.
```
