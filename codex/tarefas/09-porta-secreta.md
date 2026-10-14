# Tarefa 09 — Porta da Sala Secreta por IP:porta

## Por quê
A Sala Secreta abre com o endereço descoberto no Wireshark — não mais com o Passe Ômega
(decisão aprovada, `codex/FASE.md` §4 e §5). O Passe Ômega vira prêmio do caso Crachás (tarefa 18).

## O que fazer
1. Servidor: `POST /api/jogo/porta-secreta { ip, porta }`:
   - compara com `10.19.56.7` e `2017` (constantes só no servidor);
   - limite de 5 tentativas por minuto por sessão (429 com mensagem amigável);
   - acerto → seta `acesso:sala-secreta`; erro → `{ ok:false }` sem dizer qual campo errou.
2. Cliente (`engine/manager.js` ou módulo novo `engine/secret-door.js`):
   - Interagir com a porta `door_manager_secret` abre um **painel de controlador de acesso**
     (visual sóbrio): "CONTROLADOR DE ACESSO · somente sistemas autorizados. Informe origem e
     porta.", campos IP e Porta, botão Conectar; Esc fecha.
   - Se a sessão já tem `acesso:sala-secreta`, a porta abre direto.
   - Acerto → mensagem "Origem reconhecida. Bem-vindo, ÔMEGA." + pensamento do Kael ("Ele acha que
     eu sou ela.") → transição normal para `room_secret`.
   - Remover a exigência do Passe Ômega para entrar (o Dante continua entregando o passe em modo de
     testes por enquanto — não mexer nisso).
3. Testes em `verify-server.cjs` (ou `verify-door.cjs`): errado → ok:false; 6ª tentativa no
   minuto → 429; certo → ok e `acesso:sala-secreta`; corpo inválido → 400.

## Arquivos que podem mudar
`server/*`, `engine/manager.js`, `engine/secret-door.js` (novo), `engine/game.js`, `index.html`,
`ui/*.css`, testes, `AGENTS.md`.

## Critérios de aceite
- Todos os `verify*.cjs` passam.
- Na Gerência, porta da direita → painel → IP/porta errados recusados → `10.19.56.7` / `2017` →
  mensagem e pensamento → entra na Sala Secreta; voltar e entrar de novo não pede de novo.

## Prompt para o Codex
```
Leia AGENTS.md, codex/FASE.md (seção 4) e codex/tarefas/09-porta-secreta.md. Execute somente a
tarefa 09. Não faça git commit. Ao final, liste arquivos alterados, saída dos verify*.cjs e o
roteiro de teste manual.
```
