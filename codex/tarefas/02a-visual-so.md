# Tarefa 02a — Visual do ZeroOS próximo de um sistema operacional real

## Por quê (feedback do autor após jogar)
O ZeroOS tem "cara de layout gerado por IA": cores pastel de baixo contraste, textos minúsculos
cinza-claro, rótulos em CAIXA ALTA espaçada, slogans ("Seu espaço. Suas ideias."), cartões
flutuantes, brilhos e gradientes. Isso dificulta **ver, ler e entender**. Meta: parecer um sistema
operacional de verdade, previsível para quem usa Windows/Linux no dia a dia.

## Problemas concretos apontados pelo autor (print do jogo)
- Caixas de texto grandes, arredondadas e claras demais: barra de endereço "Este computador ›
  Registros › Computador Dev 1", campo de busca, botão "Procurar instruções nos arquivos",
  cartões da barra lateral. Viram campos normais de SO: altura ~28–32 px, borda 1 px visível,
  cantos ≤ 4 px, fundo branco (tema claro) ou cinza-escuro (tema escuro).
- Barra lateral do ZeroTrace ("BIBLIOTECA / Registros técnicos / Análise do incidente / ZeroOS 1.0
  Área de trabalho") não tem função → **remover**. Linha "Documentos da investigação · JavaScript ·
  Laboratório isolado" e rodapé "Conectado à rede local · Documento disponível" → substituir por
  uma barra de status real do editor (arquivo, linguagem, tentativas restantes).
- Textos auxiliares azul-claro/cinza-claro pequenos (ex.: "· Registros", "Arquivos da estação",
  "Prévia de leitura") → remover ou trocar por texto de contraste normal.
- Janelas sobrepostas sem distinção de qual está ativa → janela ativa com barra de título mais
  escura/destacada e sombra; inativas mais neutras.

## Referência
- Tema **Windows**: Windows 10 — barra de tarefas escura sólida, janelas brancas, barra de título
  sólida, botões ─ □ ✕ à direita, ícones pixel art atuais (`assets/windows-pixel/`).
- Tema **ZeroOS**: mesma estrutura e comportamento do tema Windows, em **modo escuro** (estilo
  desktop Linux), com o logo e os ícones atuais de `assets/zeroos/imported/`. Muda cor e ícones,
  **não** muda a posição das coisas.

## Regras visuais (valem para os dois temas)
- Fonte do sistema `'Segoe UI', system-ui, sans-serif`; corpo 14 px; **nada abaixo de 12 px**.
  Monoespaçada só no editor de código, terminal e conteúdo de arquivos.
- Contraste de texto ≥ 4.5:1 (texto escuro em fundo claro, ou claro em fundo escuro).
  Proibido texto cinza-claro sobre fundo claro.
- Superfícies **sólidas**: sem gradiente em janelas, painéis ou barra de tarefas; sem brilho/glow;
  sem `backdrop-filter`. Sombra de janela discreta, borda de 1 px.
- Sem rótulos decorativos em caixa alta espaçada, sem slogans, sem marca d'água gigante no papel de
  parede, sem cantos chanfrados "cyber". Cantos com raio ≤ 8 px.
- **Barra de título** 32 px: ícone + título à esquerda; ─ □ ✕ (46×32 px) à direita; ✕ fica vermelho
  (`#e81123`) no hover.
- **Barra de tarefas** 48 px, inferior, sólida: botão Iniciar à esquerda, um botão por janela aberta
  (janela ativa destacada), e à direita o nome da estação + relógio (hora em cima, data embaixo).
  "Trocar sistema" e "Sair" saem da barra e vão para o menu Iniciar.
- **Ícones da área de trabalho** em grade à esquerda (≈ 80 px de largura), rótulo branco com sombra
  de texto, uma linha só; seleção com retângulo azul translúcido.
- **ZeroTrace** com cara de editor de código (estilo VS Code): aba com o nome do arquivo
  (`retry.js`), barra com botão `▶ Executar testes`, editor escuro e painel inferior "Saída".
  O aviso de risco do LoopZero vira uma linha no painel de saída/barra de status, não uma faixa
  laranja. Remover o cabeçalho "RECUPERAÇÃO DO ZEROOS".
- **Explorador** com cara de Explorador de Arquivos: lista com colunas Nome · Tipo · Tamanho ·
  Data de modificação (tamanho/data podem ser fictícios e fixos). O painel lateral de "prévia" sai
  (abrir arquivos é responsabilidade da tarefa 02c; por ora, manter a abertura atual funcionando).
- "Mensagem da equipe" (cartão fixo no canto) vira **notificação** do sistema: aparece no canto
  inferior direito acima da barra, tem ✕ e some sozinha após ~8 s.
- **Tela de escolha do sistema** (`os-setup`): substituir o visual neon por uma janela de instalação
  simples e sóbria ("Instalação do sistema — Computador Dev 1"), com as duas opções lado a lado e um
  botão "Continuar". Sem grade de pontos, sem bordas neon, sem passos 01/02/03.

## Restrições
- Somente CSS e marcação. **Não mudar lógica** de missões, senhas, tentativas, explorador ou
  troca de sistema.
- **Manter as classes** usadas pela lógica e pelos testes: `.code-editor`, `.code-run`,
  `.code-output`, `.code-attempts`, `.code-files`, `.code-password`, `.code-unlock`,
  `.code-feedback`, `.pc-window`, `.pc-titlebar`, `.pc-shortcut`, `.pc-task`, `.pc-taskbar`,
  `.pc-start`, `.pc-start-button`, `.zero-launchers`, `.zero-vault`, `.zero-link`, `.zero-info`,
  `.code-explorer`, `.file-row`, `.file-list`, `[data-os]`. Pode acrescentar classes.
- Preferir **um arquivo novo** `ui/os-base.css` (estrutura comum) + `ui/os-theme-windows.css` e
  `ui/os-theme-zero.css` (cores/ícones), carregados por último no `index.html`, e remover do
  `index.html` as folhas antigas que ficarem 100% sobrescritas. Não apagar arquivos CSS antigos
  nesta tarefa — só deixar de carregá-los, se for o caso.
- Não alterar HUD, diálogos, celular, pausa nem a decisão final (só o que está dentro dos PCs).

## Arquivos que podem mudar
`ui/os-*.css` (novos), `index.html`, `engine/case.js` (só marcação do desktop), `engine/computer.js`
(só marcação), `engine/explorer.js` (só marcação), `engine/os-setup.js` (só marcação),
`engine/windows-pixel.js` (só marcação), `AGENTS.md`.

## Critérios de aceite
- Todos os `verify*.cjs` passam.
- Teste manual nos dois temas: entrar no Computador Dev 1 → escolher sistema → desktop legível a um
  braço de distância; abrir Arquivos e ZeroTrace; resolver a missão; Dev 2 pede senha; trocar
  sistema pelo menu Iniciar; Esc sai.
- Nenhum texto do sistema abaixo de 12 px; nenhum gradiente/brilho nas superfícies do SO.

## Prompt para o Codex
```
Leia AGENTS.md e codex/tarefas/02a-visual-so.md. Execute somente a tarefa 02a: mudança visual
(CSS/marcação) do ZeroOS, sem alterar lógica. Mantenha as classes listadas. Ao final, liste
arquivos alterados, saída dos verify*.cjs e o roteiro de teste manual nos dois temas.
```
