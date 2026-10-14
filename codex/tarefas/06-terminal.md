# Tarefa 06 — App Terminal

## Por quê
O terminal é a ferramenta central do CTF: ler logs, procurar padrões (`grep` no ano da IA),
navegar pastas. Os próximos comandos (`git log`, `decode`, etc.) serão acrescentados na tabela.

## O que fazer
1. `engine/os/terminal-core.js` — lógica **sem DOM**, testável em Node:
   - `createTerminal(fs)` → objeto com `cwd` (inicia em `/home/kael`) e
     `run(line)` → `{ lines: string[], clear?: boolean }`.
   - Tabela `TERMINAL_COMMANDS` (`{ nome: { help, run(args, term) } }`) e
     `registerTerminalCommand(nome, def)` para tarefas futuras.
   - Comandos: `help`, `ls [caminho]`, `cd [caminho]`, `pwd`, `cat <arquivo>`, `clear`,
     `whoami` (→ `kael`), `grep [-n] [-i] <padrão> <arquivo>` (padrão literal, não regex; `-n` mostra
     número da linha no formato `12:texto`).
   - Mensagens de erro em português, no estilo Unix
     (`cat: nao-existe.txt: arquivo não encontrado`, `cd: x: não é um diretório`).
   - Argumentos com aspas simples ou duplas (`grep "deploy v2" /var/log/nexus.log`).
   - `cat` usa `fs.read`, portanto concede `grants` do arquivo.
2. `engine/os/apps/terminal.js` — registra o app `terminal` (`availableAt: '*'`):
   - Saída monoespaçada com rolagem; prompt `kael@<estação>:<cwd>$`; histórico com ↑/↓;
     `Tab` não sai do campo (completar nomes é opcional).
   - Renderizar saída sempre com `textContent` (nunca `innerHTML` com texto de arquivo).
   - Digitar no terminal não pode mover o personagem nem abrir dossiê/mapa (o `InputManager` já
     ignora teclas em `input`/`textarea`, exceto Esc — confirme).
   - Ao abrir, mostrar 2 linhas de boas-vindas e a dica `digite help`.
3. `verify-terminal.cjs`: testes de `cd`/`ls`/`pwd` com caminhos relativos e `..`, `cat` com
   grants, `grep` com e sem `-n`/`-i`, argumentos com aspas, comando inexistente, `clear`.

## Arquivos que podem mudar
`engine/os/terminal-core.js`, `engine/os/apps/terminal.js`, `verify-terminal.cjs` (novos),
`index.html`, `ui/zeroos-apps.css`, `AGENTS.md`.

## Critérios de aceite
- Todos os verify passam.
- Teste manual no Computador Dev 1:
  `help` → `ls` → `cat leia-me.txt` → `ls /srv` (agora existe) →
  `grep -n 02:14 /var/log/nexus.log` → linhas numeradas → ↑ repete comando → `clear`.
  Andar com WASD não acontece enquanto digita; Esc sai do PC.

## Prompt para o Codex
```
Leia AGENTS.md e codex/tarefas/06-terminal.md. Pré-requisitos: tarefas 03, 04 e 05 concluídas.
Execute somente a tarefa 06. Ao final, liste arquivos alterados, saída de todos os verify*.cjs
e o roteiro de teste manual.
```
