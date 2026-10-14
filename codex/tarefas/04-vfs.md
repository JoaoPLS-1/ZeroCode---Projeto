# Tarefa 04 — Sistema de arquivos virtual servido pela API

## Por quê
As pistas do CTF serão arquivos (logs, notas, código, configurações). Eles ficam no **servidor**:
o navegador só recebe a listagem e o conteúdo do que o jogador já pode ver — assim, arquivos que
dependem de progresso não podem ser lidos antes da hora pelo F12.

## O que fazer
1. `server/data/vfs.cjs` — `VFS_FILES` indexado por caminho absoluto:
   ```js
   '/home/kael/leia-me.txt': {
     id: 'leia-me',            // usado em file:<id>
     content: '...',
     requires: undefined,      // condição de progress.requires; falsa = arquivo não existe
     grants: undefined,        // chaves que o SERVIDOR seta ao ler (opcional)
     stations: undefined,      // ids de computador onde existe; undefined = todos
     size: '1 KB', modified: '13/10/2026 02:20',   // exibição no explorador
   }
   ```
   Diretórios implícitos. Conteúdo **provisório** (marcar `// provisório — substituído na tarefa 13`):
   `/home/kael/leia-me.txt`, `/var/log/nexus.log` (~15 linhas perto de 02:14),
   `/srv/equipe/contatos.txt` com `requires: 'file:leia-me'`.
2. `server/vfs.cjs` — `resolve(cwd, entrada)` (suporta `.`, `..`, `~` = `/home/kael`, relativo,
   absoluto; nunca sai de `/`), `list(sessao, estacao, caminho)`, `read(sessao, estacao, caminho)`.
   Visibilidade por `requires` + `stations`; diretório existe se tiver arquivo visível. Ler com
   sucesso seta `file:<id>` e aplica `grants`.
3. Rotas: `GET /api/jogo/fs/lista?estacao=&caminho=` e `GET /api/jogo/fs/arquivo?estacao=&caminho=`
   → 404 genérico para inexistente **ou** invisível (não revelar que existe). Validar `estacao`
   contra os computadores de `data/objects.js`.
4. A lista permitida de eventos da tarefa 03 passa a aceitar `file:<id>` somente se o arquivo for
   visível (na prática, ler pela rota já registra; o evento manual pode ser removido para `file:`).
5. Cliente: `engine/os/vfs.js` — `RemoteFS(api, estacao)` com `list`, `read`, `resolve`
   (assíncronos), para o Terminal e o Explorador usarem depois. Sem interface nesta tarefa.
6. `verify-vfs.cjs`: resolve (`..`, `~`, relativo, raiz), list e read, arquivo oculto por `requires`
   que aparece após ler o leia-me, filtro por `stations`, 404 igual para inexistente e oculto,
   tentativa de sair da raiz.

## Arquivos que podem mudar
`server/data/vfs.cjs`, `server/vfs.cjs`, `engine/os/vfs.js`, `verify-vfs.cjs` (novos),
`server/*` (rotas e lista de eventos), `index.html`, `AGENTS.md`.

## Critérios de aceite
- Todos os `verify*.cjs` passam.
- No console do navegador: `new RemoteFS(api,'computer_dev_left').list('/')` lista `home/` e `var/`,
  não `srv/`; depois de `read('/home/kael/leia-me.txt')`, `list('/')` inclui `srv/`.
- O conteúdo de `contatos.txt` não aparece em nenhuma resposta antes de ler o leia-me.

## Prompt para o Codex
```
Leia AGENTS.md, codex/PLANO.md (seção 4) e codex/tarefas/04-vfs.md.
Pré-requisito: tarefa 03 concluída. Execute somente a tarefa 04. Ao final, liste arquivos
alterados, saída de todos os verify*.cjs e o teste no console.
```
