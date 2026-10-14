# Tarefa 04 — Sistema de arquivos virtual (VFS)

## Por quê
As pistas do CTF serão arquivos: logs, notas, código, configurações. Precisamos de um sistema de
arquivos por caminho, definido em `data/`, que o Terminal e os apps leiam. Arquivos podem
**aparecer** quando o jogador descobre algo e podem **gerar flags** ao serem lidos.

Inspiração: o `fileSystem.js` do projeto browser-os (objeto indexado por caminho). **Não** copiar
código dele nem usar `localStorage`: tudo em memória, zerando a cada partida.

## O que fazer
1. `data/vfs.js` — define `VFS_FILES`, objeto indexado por caminho absoluto:
   ```js
   '/home/kael/leia-me.txt': {
     content: '...',            // texto (string)
     requires: undefined,       // condição de Progress.requires; se falsa, o arquivo não existe
     grants: 'file:leia-me',    // flag setada ao ler (opcional; string ou array)
     stations: undefined,       // ids de computador onde existe; undefined = todos
   }
   ```
   Diretórios são **implícitos** (derivados dos caminhos). Conteúdo inicial **de exemplo**, marcado
   com comentário `// conteúdo provisório — substituído na tarefa 08`:
   - `/home/kael/leia-me.txt` (nota curta de boas-vindas ao Kael)
   - `/var/log/nexus.log` (umas 15 linhas de log fictício, com horários perto de 02:14)
   - `/srv/equipe/contatos.txt` com `requires: 'file:leia-me'` (para demonstrar desbloqueio)
2. `engine/os/vfs.js` — classe `VirtualFS(files, progress, stationId)`:
   - `exists(path)`, `isDir(path)`, `list(path)` → nomes ordenados (pastas com `/` no final),
     `read(path)` → conteúdo ou `null`; ao ler com sucesso, aplica `grants` no `progress`.
   - `resolve(cwd, input)` → caminho absoluto normalizado (suporta `.`, `..`, `~` = `/home/kael`,
     caminhos relativos e absolutos; nunca sai de `/`).
   - Visibilidade: arquivo invisível se `requires` falso ou se `stations` não inclui `stationId`.
     Diretório existe se tiver ao menos um arquivo visível.
   - Exportar via `module.exports` como nos outros arquivos.
3. Carregar `data/vfs.js` e `engine/os/vfs.js` no `index.html` (dados junto dos outros `data/`,
   engine depois de `engine/progress.js`).
4. `verify-vfs.cjs`: testa resolve (casos com `..`, `~`, relativo, raiz), list de raiz e subpastas,
   read + grants, arquivo oculto por `requires` que aparece após a flag, filtro por `stations`,
   diretório que some quando todos os arquivos estão ocultos.

Nenhuma interface nesta tarefa (o Terminal vem na tarefa 06).

## Arquivos que podem mudar
`data/vfs.js`, `engine/os/vfs.js`, `verify-vfs.cjs` (novos), `index.html`, `AGENTS.md`.

## Critérios de aceite
- `node verify-vfs.cjs` e todos os demais verify passam.
- No console do navegador:
  `new VirtualFS(VFS_FILES, __game.progress, 'computer_dev_left').list('/')` lista `home/` e `var/`
  (e não `srv/` até ler o leia-me).

## Prompt para o Codex
```
Leia AGENTS.md e codex/tarefas/04-vfs.md (contexto em codex/PLANO.md, seção 4).
Pré-requisito: tarefa 03 concluída (engine/progress.js). Execute somente a tarefa 04.
Ao final, liste arquivos alterados, saída de todos os verify*.cjs e o teste no console.
```
