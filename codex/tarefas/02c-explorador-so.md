# Tarefa 02c — Explorador de arquivos com comportamento real

## Por quê (feedback do autor)
Hoje um clique no arquivo mostra o texto num painel de prévia. O jogador espera o que um SO faz:
selecionar com um clique, **abrir com dois cliques** num programa próprio, e ter opções no clique
direito.

## O que fazer
1. **Seleção e abertura:** clique simples seleciona a linha; **duplo clique** ou **Enter** abre;
   setas ↑/↓ mudam a seleção; Backspace volta à pasta anterior. Pastas abrem no próprio explorador.
2. **Bloco de notas** (`engine/os/notepad.js`): arquivos de texto abrem numa janela própria
   (via `ZeroWindowManager` da tarefa 02b), somente leitura, fonte monoespaçada, texto
   selecionável, barra de título "nome.txt — Bloco de notas". Vários arquivos podem ficar abertos
   ao mesmo tempo. Ler o arquivo continua tendo os mesmos efeitos de hoje (ex.: `instrucoes.txt`
   marca a missão como lida e libera o botão Executar; o treinamento marca `tutorialRead`).
3. **Ações especiais** que hoje aparecem como botões na prévia (ex.: "Abrir ZeroTrace", exclusão do
   `kernel.zero`) passam a ser:
   - "Abrir ZeroTrace": botão no rodapé da janela do Bloco de notas das instruções/treinamento;
   - `kernel.zero`: clique direito → "Excluir…" → diálogo de confirmação do sistema
     (mantendo o mesmo game over atual).
4. **Clique direito** (usa `showContextMenu` da 02b):
   - em arquivo: "Abrir", "Copiar caminho" (copia algo como `C:\Projetos\instrucoes.txt` para a
     área de transferência), "Propriedades" (janela pequena com nome, tipo, tamanho, local, data);
   - em área vazia: "Atualizar", "Classificar por › Nome / Tipo".
5. Barra de endereço clicável por partes (breadcrumb) e busca na pasta continuam funcionando.

## Restrições
- Não mudar quais arquivos existem, em quais pastas aparecem, nem a lógica de missão/senha/ZeroVault.
- Não implementar criação, renomeação ou exclusão de arquivos (exceto o fluxo já existente do
  `kernel.zero`).

## Arquivos que podem mudar
`engine/explorer.js`, `engine/os/notepad.js` (novo), `engine/computer.js` (se necessário),
`index.html`, `ui/os-*.css`, `AGENTS.md`.

## Critérios de aceite
- Todos os `verify*.cjs` passam.
- Teste manual (dois temas): abrir Arquivos → navegar até a pasta das instruções → um clique só
  seleciona → dois cliques abrem `instrucoes.txt` no Bloco de notas → botão Executar do ZeroTrace
  fica habilitado → abrir também o treinamento em outra janela → clique direito → Copiar caminho →
  colar no editor de código funciona → Propriedades mostra dados → ZeroOS › `kernel.zero` › clique
  direito › Excluir… pede confirmação (cancelar não faz nada).

## Prompt para o Codex
```
Leia AGENTS.md e codex/tarefas/02c-explorador-so.md. Pré-requisitos: tarefas 02a e 02b
concluídas. Execute somente a tarefa 02c. Ao final, liste arquivos alterados, saída dos
verify*.cjs e o roteiro de teste manual.
```
