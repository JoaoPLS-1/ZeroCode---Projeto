# Tarefa 17 — Caso Retry: App Git/PR, code review e perguntas "quem fez / como fez"

## Por quê
O roteiro do coordenador de dev (histórico de versões → quem fez → como fez → revisão) vira jogo:
o jogador lê o histórico, descobre que o commit 7f2 foi gerado pelo assistente de IA e aprovado
sem revisão, e **faz o code review que ninguém fez**. Textos/tom: `codex/DIALOGOS.md` §2 (Edu,
Rick) e §3 (caso Retry).

## O que fazer
1. **Dados** (`server/data/repo.cjs`): repositório fictício `nexus` com ~12 commits
   (hash curto, autor, data, mensagem, arquivos, diff). Inclui o commit **`7f2c9a1`** de Rick,
   02:09, mensagem `"refactor(retry): simplifica reenvio (gerado pelo Assistente de IA)"`, que
   troca `if (attempt >= 3) return fail();` por reenvio sem limite em `retry.js`; e o PR
   **#214** "Retry mais simples" aprovado por `bot-aprovador` em 40 s com o comentário "LGTM 🚀".
2. **App Git** (`engine/os/apps/git.js`, `availableAt: ['computer_dev_left','computer_dev_right']`):
   abas **Histórico** (lista de commits; selecionar mostra mensagem, autor e diff colorido
   +/−), **Blame** (escolher `retry.js` → cada linha com hash/autor) e **Pull requests** (lista;
   abrir o #214 mostra descrição, aprovação, tempo até aprovar e o diff).
   Dados vêm de `GET /api/jogo/repo/...` (só leitura).
3. **Code review (flag `retry-E`)**: no PR #214, o jogador pode marcar linhas do diff como
   problema (clique na linha → marcar/desmarcar) e enviar a revisão. O servidor confere: acerta se
   marcou **todas** as linhas que removem o limite/tornam o reenvio infinito e **nenhuma** linha
   inofensiva (até 3 envios errados sem penalidade além de mensagem "revise de novo"). Flag e ficha
   de code review: *"Código que ninguém leu não foi revisado — foi carimbado."*
4. **Perguntas do incidente** (mecanismo da tarefa 14): ligar
   - "Qual commit removeu o limite de tentativas?" → `7f2c9a1` (aceitar também `7f2`) → flag
     **`retry-D`**;
   - "Quem publicou a versão 2.1?" (escolha: Edu, Rick, Mark, Steve) → Rick (sem flag);
   - "Como esse código foi escrito?" (escolha: à mão, gerado pelo assistente de IA, copiado de um
     fórum) → assistente (sem flag).
5. Testes: dados do repo coerentes (blame aponta 7f2c9a1 nas linhas alteradas), review certo/
   errado/parcial, pergunta → flag uma vez.

## Arquivos que podem mudar
`server/data/repo.cjs`, `server/repo.cjs`, `engine/os/apps/git.js` (novos), `server/*`,
`server/data/perguntas.cjs`, `server/data/flags.cjs`, `ui/zeroos-apps.css`, `index.html`,
testes, `AGENTS.md`.

## Prompt para o Codex
```
Leia AGENTS.md, codex/DIALOGOS.md e codex/tarefas/17-retry-git-pr.md. Execute somente a tarefa 17.
Não faça git commit. Ao final, liste arquivos alterados, saída dos verify*.cjs e o roteiro de
teste manual.
```
