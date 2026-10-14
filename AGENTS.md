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

## Regra de segurança (vale para toda tarefa)
O **servidor é a fonte da verdade** (`codex/PLANO.md` §4). O navegador nunca recebe flags,
gabaritos, senhas, IP:porta nem conteúdo ainda não liberado; nunca decide sozinho se o jogador
conquistou algo. Código do jogador roda só no Web Worker do navegador, nunca no servidor.
Falhas dos sistemas vibecodados existem só em `/lab`, simuladas sobre dados falsos por sessão.

## Fluxo de trabalho (importante)
- O trabalho é feito em **fragmentos**: cada prompt indica **uma** tarefa em `codex/tarefas/NN-*.md`.
- Execute **somente** a tarefa indicada. Não adiante tarefas seguintes, não "aproveite para melhorar"
  outras partes. Se notar algo fora do escopo, apenas relate no resumo final.
- Altere apenas os arquivos listados na tarefa (ou explique por que precisou de outro).
- Ao terminar: liste os arquivos alterados, a saída de todos os `verify*.cjs` e o roteiro de teste
  manual no navegador.
- Não marque status no `codex/PLANO.md`; o autor faz isso após revisar.

## Rodar e testar
- Node **22.13** ou superior (22 ou 24 LTS): `node server/index.cjs` → http://localhost:8000 (somente
  `127.0.0.1`; porta configurável por `PORT`). A API de sessões e as missões em Web Worker
  **exigem HTTP**; abrir `index.html` via file:// não inicia a partida.
- Testes (Node, sem dependências): `node verify.cjs`, `node verify-computer.cjs`,
  `node verify-npc-animation.cjs`, `node verify-player-frames.cjs`, `node verify-server.cjs`.
- Flags (tarefa 07): `node verify-flags.cjs`. Para teste local, inicie com `$env:ZC_DEV='1'; node server/index.cjs`
  (PowerShell). Só nesse modo existe `POST /api/jogo/dev/flag { id }`; sem `ZC_DEV=1`, retorna 404.
  No console do navegador, após iniciar a partida, use `api.post('/api/jogo/dev/flag', {id:'retry-C'})`.
  As outras flags provisórias são `provisoria-2` até `provisoria-5`. Repita para testar as cinco
  lembranças; duplicatas não contam. `GET /api/jogo/flags` lista apenas fichas já capturadas.
  Para voltar ao modo normal, encerre o servidor e use `Remove-Item Env:ZC_DEV` antes de reiniciá-lo.
- `server/`: HTTP nativo, lista explícita de estáticos públicos, sessões em memória e `/api/jogo`.
  As cinco missões de código são validadas no servidor, com entradas aleatórias e execuções
  únicas de 60 s. Gabaritos, senhas, erros e desbloqueios ficam na sessão; o Worker só devolve saídas.
- Sem build, sem npm, sem frameworks. Não adicione dependências.

## Arquitetura
Scripts clássicos carregados em ordem pelo `index.html` (globais compartilhadas). **A ordem importa.**

- `data/` — conteúdo:
  - `maps.js`: salas (`ROOMS`), `bounds`, `spawns`, `doors`, `obstacles`. Coordenadas no espaço do
    fundo (~1672×941), nunca da viewport. Obstáculo = retângulo ou `{points}` **convexo**
    (formas em U/L = várias peças).
  - `npcs.js`, `objects.js`: pontos de interação (`type`: npc, computer, computer_final, item, manager, door).
  - `dialogs.js`, `clues.js`: falas e pistas (`relevant: true` = registro técnico).
  - `code-missions.js`: metadados públicos das missões JS (corpo de função `input → return`).
    Casos, funções de referência e recompensas ficam em `server/data/missions.cjs`.
  - `missions.js`: hipóteses da decisão final.
- `engine/game.js` — loop, estados (`start`, `briefing`, `playing`, `transition`, `case`, `phone`,
  `result`, `complete`, `gameover`), troca de sala, interação.
- **Extensões por monkey-patch** de `Game.prototype` / `DialogueSystem.prototype` /
  `ZeroComputer.prototype` / `CaseExperience.prototype`, nesta ordem de carga:
  `case.js` (pausa, dossiê, marcadores, nota S/A/B) → `computer.js` (`ZeroComputer`) → `explorer.js` (ZeroFiles) →
  `manager.js` (Dante, Passe Ômega em modo de testes) → `main.js` → `windows-pixel.js` →
  `os-setup.js` (escolha ZeroOS/Windows) → `nexus-result.js`.
  Para novas mecânicas, prefira **módulos novos e explícitos** chamados pelo `Game` em vez de mais
  camadas de patch; se precisar patchar, guarde e chame o método original.
- Outros: `phone.js` (bolso + Teams narrativo), `hud.js` (caderno + minimapa 2×3),
  `dialogue.js`, `mission.js` (D.A.N.I.E.L.), `code-worker.js` (sandbox das missões), `player.js`,
  `renderer.js`, `collision.js`.
- SO: `engine/os/window-manager.js` (`ZeroWindowManager`) gerencia foco, arraste, tamanho,
  minimizar/maximizar, fechamento e botões da barra. `open(...)` cria apps novos; `adopt(...)`
  integra as janelas existentes. `engine/os/context-menu.js` fornece `showContextMenu(...)`
  e intercepta Esc dos menus antes do teclado do jogo. Ambos carregam antes de `case.js`.
  O desktop encerra observadores, eventos e relógio ao sair, trocar sistema ou encerrar a partida.
- `engine/os/notepad.js` (`ZeroNotepad`) abre documentos somente leitura pelo gerenciador de
  janelas. No explorador, clique simples seleciona; duplo clique/Enter abre e registra a leitura.
- Apps (tarefa 05): para criar um app novo, adicione `engine/os/apps/<nome>.js`, carregue após
  `engine/os/apps.js` (que vem depois de `os-setup.js`) e chame
  `registerZeroApp({ id, name, icon, availableAt, requires, open(ctx) })`. `availableAt` é `'*'`
  ou um array de ids de computadores; `requires` usa o espelho `game.progress.requires`.
  Os lançadores e o menu Iniciar acompanham o progresso, independentemente da senha da missão.
  `ctx = { game, computer, station, fs, window }`: `computer` é o `ZeroComputer`, `fs` é
  `RemoteFS(api, station.id)` (operações assíncronas) e `window` vem do `ZeroWindowManager`.
  Preencha `ctx.window.body` com DOM; reabrir só restaura a janela existente. Use id único,
  sem os ids reservados `zerotrace`, `info`, `explorer` ou o prefixo `notepad:`.
  Estilos em `ui/zeroos-apps.css`, seguindo os temas e as regras visuais da tarefa 02a.
  Arquivos e conquistas continuam sob autoridade do servidor; não use VFS local nem flags privadas.
  `openLocked(ctx)` opcional mantém o ícone visível e abre uma explicação quando `requires`
  ainda não foi atendido. O Wireshark usa isso para a autenticação sem campo de senha.
- Progresso (tarefa 03): `server/progress.cjs` é a autoridade (`set/has/all/count/requires`).
  `engine/progress.js` (`Progress`) é só o espelho em `__game.progress`, sincronizado pela API;
  `on(listener)` notifica chaves novas. `POST /api/jogo/eventos` aceita apenas `talk:<npcId>`
  existente ao concluir o diálogo, além de `evento:batimento-visto` com estação/pacote validados
  após abrir a captura autorizada. Conquistas de missão são concedidas pelo servidor.
- VFS (tarefa 04): `server/data/vfs.cjs` guarda arquivos privados; `server/vfs.cjs` resolve
  caminhos virtuais e filtra por `requires` e `stations`, inclusive diretórios implícitos.
  `GET /api/jogo/fs/lista` e `/api/jogo/fs/arquivo` exigem sessão, `estacao` e `caminho`;
  oculto e inexistente retornam o mesmo 404. Só a leitura autorizada registra `file:<id>`
  e aplica `grants`; eventos manuais `file:` são recusados. `engine/os/vfs.js` expõe
  `RemoteFS(api, estacao)` com `list(caminho)`, `read(caminho)` e `resolve(cwd, entrada)`
  assíncronos. Listas retornam `{ caminho, entries: [{ name, path, type, size?, modified? }] }`;
  leituras retornam `{ caminho, id, content, size, modified }` e o progresso atualizado.
  Integrado ao Terminal na tarefa 06; a interface do Explorador ainda não usa o RemoteFS.
- Estilos: `style.css` + `ui/*.css`.
- Terminal (tarefa 06): `engine/os/terminal-core.js` fornece `createTerminal(fs)` sem DOM e
  `registerTerminalCommand(nome, { help, run(args, term) })`; a janela está em
  `engine/os/apps/terminal.js`. `cat` e `grep` leem pelo `RemoteFS`, sem conceder progresso local.
- Cifra/log (tarefa 13): `server/data/vfs.cjs` gera 2.400 linhas do NEXUS; a linha 2017 contém
  a cifra. O inventário só é visível em `computer_qa_infra_lower`, `computer_infra_upper` e
  `computer_dev_right`. `engine/os/apps/cesar.js` registra a Roda de César em todos os PCs e
  exporta `cesar(texto, n)`. `cat` acima de 500 linhas exibe as primeiras 200;
  `less <arquivo> [página]` lê páginas de 200. Extensão didática do terminal: em `grep -n`,
  um padrão numérico também seleciona aquela linha, além de procurar o texto literal.
  `node verify-cifra-log.cjs` valida dados, cifra, interface, terminal e autorização HTTP.
- Wireshark (tarefa 08): `server/data/capture.cjs` guarda os 50 pacotes privados;
  `GET /api/jogo/captura?estacao=computer_infra_upper` exige `app:wireshark`.
  `engine/os/apps/wireshark-filter.js` fornece `WiresharkFilter.compile(texto)` sem DOM;
  a interface está em `engine/os/apps/wireshark.js`. `node verify-wireshark.cjs` valida
  captura, filtros e interface; `verify-server.cjs` verifica autorização e ausência de vazamento.
- Porta secreta (tarefa 09): `POST /api/jogo/porta-secreta { ip, porta }` compara os dados
  exclusivamente em `server/secret-door.cjs`, com até 5 tentativas por minuto por sessão.
  O acerto concede `acesso:sala-secreta`; o Passe Ômega não libera a sala. `engine/secret-door.js`
  é chamado pelo `Game` e abre o controlador de acesso (Esc fecha); falas em `data/secret-door.js`.
  `node verify-door.cjs` verifica API, limite, reset, isolamento e fluxo do painel.
- Desafios (tarefa 10): `server/challenges.cjs` carrega automaticamente os arquivos privados
  de `server/data/challenges/*.cjs`. Cada desafio contém metadados públicos, código vibecodado
  com `// TODO`, casos fixos, `gerarCasos(rng)`, referência privada e três dicas progressivas.
  `GET /api/jogo/desafios?estacao=` filtra por estação e `requires`; os POSTs de execução e dica
  também validam `requires`. Execuções são únicas e expiram em 60 s. `maxErros: null` permite
  tentativas ilimitadas; as cinco missões S2 mantêm `maxErros: 3`, ordem, senhas e flags antigas.
  `server/data/missions.cjs` e `server/missions.cjs` são adaptadores S2 sobre o mesmo motor.
  ZeroTrace oferece a lista lateral Arquivos quando há vários desafios, rascunhos separados e
  Pedir dica ao D.A.N.I.E.L.; dicas usadas ficam na sessão e são apagadas na nova partida.
  `node verify-challenges.cjs` valida formato, referências/código inicial no Worker em `vm`,
  autorização, dicas, captura, HTTP e seleção no editor; `verify-computer.cjs` mantém a cobertura S2.
- Modo testes (tarefa 11): `retry-teste` aparece em `computer_qa_upper`, independente do bloqueio S2.
  O Worker devolve `{ casos: [[entrada, saída esperada], ...] }`; o servidor aceita 1–10 casos,
  limita o JSON a 8 KB e executa apenas suas duas implementações privadas. Todos os casos devem
  passar na correta e pelo menos um falhar na vibecodada. O desafio QA e o Dev 1 concedem a mesma
  `retry-C`, sem duplicar lembranças; resolver o QA não desbloqueia a sequência S2 nem dá sua senha.
  `node verify-challenges.cjs` cobre o modo, entradas inválidas, limites, flag compartilhada e editor.

## Armadilhas conhecidas
- **Overrides no fim dos arquivos de dados.** `maps.js`, `dialogs.js`, `npcs.js` e `objects.js` redefinem
  valores no final (`Object.assign`, `push`, laços). Ex.: portas/spawns reais das salas estão no fim
  de `maps.js`; nomes reais dos NPCs vêm de `NPC_DIALOG_NAMES`; posição real dos NPCs vem de
  `NPC_PLACEMENTS`. **Sempre leia o arquivo até o fim** antes de editar dados.
- A interface dos PCs fica em `engine/computer.js` (`ZeroComputer`); os metadados públicos estão
  em `data/code-missions.js` (`CODE_MISSIONS`) e a validação em `server/missions.cjs`.
- Retratos de diálogo são escolhidos pelo prefixo do nome antes de `·` (mapa em
  `DialogueSystem._renderPortraits`). Novo NPC com retrato = adicionar ali.
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
