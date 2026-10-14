# Tarefa 02b — Gerenciador de janelas e funções básicas de SO

## Por quê (feedback do autor)
O ZeroOS é estático demais. Precisa se comportar como um sistema operacional: janelas que
redimensionam, minimizam para a barra, menu de contexto do próprio sistema, menu Iniciar de verdade.
Este gerenciador também será a base dos apps futuros (Terminal, Wireshark — tarefa 05).

## O que fazer
1. `engine/os/window-manager.js` — classe `ZeroWindowManager(desktopEl)`:
   - `open({ id, title, icon, width, height, content })` → cria janela com barra de título
     (ícone, título, ─ □ ✕) e corpo; se já existe janela com o mesmo `id`, só restaura e traz à
     frente. Retorna `{ el, body, close(), focus() }`.
   - Arrastar pela barra de título (dentro da área do desktop); **redimensionar** pelas bordas e
     cantos com tamanho mínimo; **maximizar/restaurar** pelo □ e por duplo clique no título;
     **minimizar** pelo ─.
   - Foco: clicar numa janela a traz à frente e a marca como ativa.
   - Barra de tarefas: um botão por janela aberta; clicar alterna minimizar/restaurar (se ativa,
     minimiza; se não, traz à frente); janela ativa destacada.
   - Eventos `onClose` por janela.
   - Migrar as janelas existentes (ZeroTrace e Explorador) para usar o gerenciador, mantendo o
     comportamento atual delas (o `ZeroComputer.drag` pode ser substituído).
2. **Menu Iniciar**: lista de aplicativos disponíveis (os mesmos lançadores da área de trabalho),
   e no rodapé "Trocar sistema" e "Desligar" (sair do computador). Fecha ao clicar fora ou com Esc.
3. **Menu de contexto do sistema** (`engine/os/context-menu.js`):
   - O menu do **navegador** não deve aparecer em nenhum ponto do jogo
     (`contextmenu` com `preventDefault` em `#game-container`), **exceto** dentro de campos de texto
     (`input`, `textarea`), onde copiar/colar continua funcionando.
   - Clique direito na área de trabalho: "Atualizar", "Organizar ícones", "Trocar sistema".
   - Clique direito no botão de uma janela na barra de tarefas: "Restaurar", "Minimizar", "Fechar".
   - API reutilizável: `showContextMenu(x, y, itens)` com itens `{ label, action, disabled }` e
     separadores; fecha ao clicar fora, Esc ou ao escolher.
4. **Área de trabalho**: clique simples seleciona o ícone, **duplo clique** (ou Enter) abre;
   clicar no fundo limpa a seleção. Relógio da barra atualiza a cada minuto.
5. **Esc** em camadas: primeiro fecha menu de contexto/menu Iniciar; se não houver menu aberto,
   mantém o comportamento atual (sair do computador).
6. Texto de documentos e saídas pode ser **selecionado e copiado** (Ctrl+C) — não bloquear
   `user-select` nessas áreas.

## Restrições
- Não mudar regras de missão, senha, tentativas, game over nem a escolha de sistema.
- Manter as classes listadas na tarefa 02a.
- Não atrapalhar o jogo fora do PC: clique direito no mapa não deve fazer nada.

## Arquivos que podem mudar
`engine/os/window-manager.js`, `engine/os/context-menu.js` (novos), `engine/case.js`,
`engine/computer.js`, `engine/explorer.js`, `engine/os-setup.js`, `engine/windows-pixel.js`,
`index.html`, `ui/os-*.css`, `AGENTS.md` (documentar o gerenciador na seção Arquitetura),
`verify-*.cjs` (se precisar ajustar mocks).

## Critérios de aceite
- Todos os `verify*.cjs` passam.
- Teste manual (dois temas):
  1. Abrir ZeroTrace e Arquivos ao mesmo tempo; alternar foco clicando; arrastar; redimensionar por
     um canto; maximizar por duplo clique no título; minimizar e restaurar pela barra.
  2. Clique direito no desktop → menu do sistema (não o do navegador). Clique direito no editor de
     código → menu do navegador (copiar/colar) continua.
  3. Menu Iniciar abre apps, troca sistema e "Desligar" sai do PC.
  4. Ícones: um clique seleciona, dois cliques abrem.
  5. Esc com menu aberto fecha só o menu; Esc de novo sai do PC.
  6. Fora do PC, clique direito no cenário não abre nada.

## Prompt para o Codex
```
Leia AGENTS.md e codex/tarefas/02b-janelas-so.md. Pré-requisito: tarefa 02a concluída.
Execute somente a tarefa 02b. Ao final, liste arquivos alterados, saída dos verify*.cjs e o
roteiro de teste manual.
```
