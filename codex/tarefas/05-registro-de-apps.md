# Tarefa 05 — Registro de apps no ZeroOS

## Por quê
Cada mecânica do CTF vai virar um app do ZeroOS (Terminal, César, Git, Pipeline, Inspetor HTTP,
Wireshark). Precisamos de um "contrato" único para que cada app novo seja uma tarefa pequena e
isolada, e de controle de **onde** cada app existe (ferramentas por local mantêm a exploração).

## Contexto do código atual
- O desktop dos PCs é montado por `CaseExperience.desktop` (`engine/case.js`) e completado por
  `ZeroComputer.open` (`engine/computer.js`), depois embrulhado por `engine/windows-pixel.js` e
  `engine/os-setup.js` (escolha ZeroOS/Windows). Lançadores ficam em `.zero-launchers`.
- `ZeroComputer.drag(win, handle)` já implementa arrastar e trazer à frente; `this.layer` controla
  o z-index.
- O tema Windows troca ícones via `MutationObserver` apenas para imagens de
  `assets/zeroos/imported/`; ícones de apps novos não são afetados.

## O que fazer
1. `engine/os/apps.js`:
   - `const ZERO_APPS = []` e `function registerZeroApp(def)`; `def`:
     `{ id, name, icon, availableAt, requires, open(ctx) }`
     - `availableAt`: array de ids de computador ou `'*'`.
     - `requires`: condição de `Progress.requires` (app oculto até ser liberado).
     - `open(ctx)`: recebe `ctx = { game, computer, station, fs, window }` e preenche
       `ctx.window.body`.
   - Janelas dos apps usam o `ZeroWindowManager` (tarefa 02b): `ctx.window` é o retorno de
     `open({ id: app.id, title, icon })`. Não criar outro sistema de janelas. Estilos específicos
     de apps em `ui/zeroos-apps.css`, seguindo as regras visuais da tarefa 02a.
   - Os apps registrados também aparecem no **menu Iniciar** (tarefa 02b).
   - Um único embrulho de `ZeroComputer.prototype.open` (guardando e chamando o original, como os
     outros arquivos fazem) que, depois de montar o desktop, adiciona em `.zero-launchers` um botão
     para cada app disponível naquele PC (`availableAt` + `requires`). Abrir de novo um app já
     aberto traz a janela à frente.
   - `ctx.fs` é um `VirtualFS(VFS_FILES, game.progress, station.id)`.
   - **Importante:** os apps devem aparecer mesmo quando a missão de código do PC está bloqueada
     por senha (mundo aberto: a ferramenta não depende da missão).
2. App de demonstração `engine/os/apps/sobre.js`: "Sobre o ZeroOS", `availableAt: '*'`, mostra o
   nome da estação e quantas flags `flag:` o jogador tem. Serve para validar o contrato.
3. Carregar `engine/os/apps.js` **depois** de `engine/os-setup.js` no `index.html`, e os apps em
   seguida. Incluir `ui/zeroos-apps.css` no `<head>`.
4. Documentar o contrato no topo de `engine/os/apps.js` e na seção Arquitetura do `AGENTS.md`
   ("como criar um app novo").

## Arquivos que podem mudar
`engine/os/apps.js`, `engine/os/apps/sobre.js`, `ui/zeroos-apps.css` (novos), `index.html`,
`AGENTS.md`. Evite mexer em `case.js`/`computer.js`/`os-setup.js`/`windows-pixel.js`; se for
inevitável, mudança mínima e explicada no resumo.

## Critérios de aceite
- Todos os verify passam.
- Teste manual, nos temas ZeroOS **e** Windows:
  1. Abrir Computador Dev 1 → aparece o lançador "Sobre o ZeroOS" junto dos demais.
  2. Abrir o app → janela arrastável, fecha e minimiza; abrir duas vezes não duplica.
  3. Abrir Computador Dev 2 (bloqueado por senha) → o lançador também aparece.
  4. Trocar sistema (ZeroOS ↔ Windows) → lançador continua lá.
  5. Esc sai do PC normalmente; nenhum erro no console.

## Prompt para o Codex
```
Leia AGENTS.md e codex/tarefas/05-registro-de-apps.md (contexto em codex/PLANO.md, seção 4).
Pré-requisitos: tarefas 03 e 04 concluídas. Execute somente a tarefa 05.
Ao final, liste arquivos alterados, saída de todos os verify*.cjs e o roteiro de teste manual.
```
