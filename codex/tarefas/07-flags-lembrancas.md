# Tarefa 07 — Captura de flags: ficha de conhecimento e lembranças

## Por quê
Toda flag do CTF precisa (1) ser concedida **só pelo servidor**, (2) ensinar algo — a **ficha de
conhecimento** — e (3) devolver uma **lembrança** a Kael. Com 5 lembranças, Kael lembra a senha do
Servidor de Infra e o Wireshark é liberado (`codex/FASE.md` §1 e §4; textos em
`codex/DIALOGOS.md` §3 e §5).

## O que fazer
1. `server/data/flags.cjs` — catálogo de flags. Cada item:
   `{ id, caso, camada: 'D'|'E'|'C'|'P', titulo, conceito, vibecodeErrou, ficha, lembranca }`.
   Preencher com **todas** as flags de `DIALOGOS.md` §3 (casos Retry, Pagamento, Crachás, Mural,
   Upload e Pipeline), usando os textos de lá; onde `DIALOGOS.md` só tem texto para uma camada do
   caso, reaproveitar o conceito da tabela e escrever uma ficha curta no mesmo tom (marcar
   `// rascunho`).
   - **Provisório até os casos existirem:** as 5 missões de código atuais concedem, ao serem
     resolvidas, as flags `retry-C` (Dev 1) e `provisoria-2` … `provisoria-5` (demais PCs), com
     fichas sobre o conceito de cada missão (linha do tempo, testes SKIP, backoff, isolamento).
     Marcar no catálogo `provisoria: true`; serão removidas na tarefa 17.
2. `server/flags.cjs`:
   - `capturar(sessao, id)` (uso **interno** do servidor): se nova, seta `flag:<id>` e
     `mem:<id>`; quando `count('mem:') === 5` pela primeira vez, seta `app:wireshark` e
     `evento:senha-lembrada`. Retorna `{ nova, flag: {titulo, conceito, ficha, lembranca},
     lembrancas, wiresharkLiberado }`.
   - Integrar em S2: resolver missão → `capturar(...)` e incluir o retorno na resposta.
   - `GET /api/jogo/flags` → só as flags **já capturadas** (com ficha e lembrança) + contagem
     `{ lembrancas, meta: 5 }`. Nunca listar flags não capturadas nem o total de ids.
3. **Modo de desenvolvimento** (para testar sem jogar tudo): se e somente se o servidor for
   iniciado com `ZC_DEV=1`, existe `POST /api/jogo/dev/flag { id }` que chama `capturar`. Sem a
   variável, a rota não existe (404). Documentar no `AGENTS.md`/`README.md`.
4. Cliente:
   - `engine/flags-ui.js`: ao receber uma flag nova em qualquer resposta da API, mostrar um painel
     "FLAG CAPTURADA" com título, conceito, **ficha de conhecimento** e "o que o vibecode errou";
     em seguida a **lembrança** como pensamento do Kael (`speaker: 'thought'` da D1).
     Quando `wiresharkLiberado`, mostrar a fala da "5ª lembrança" de `DIALOGOS.md` §5
     (pensamento + D.A.N.I.E.L.).
   - Caderno do HUD (`engine/hud.js`): linha `Lembranças X/5` (vinda do servidor).
   - Dossiê (J): nova seção "Fichas de conhecimento" listando as fichas capturadas.
5. Testes `verify-flags.cjs`: capturar é idempotente; 5ª lembrança libera `app:wireshark` uma vez;
   `GET /flags` não vaza flags não capturadas; rota dev 404 sem `ZC_DEV` e funcional com ela;
   resolver missão do Dev 1 pela API concede `retry-C`.

## Arquivos que podem mudar
`server/*`, `engine/flags-ui.js` (novo), `engine/hud.js`, `engine/case.js` (dossiê),
`engine/computer.js`, `engine/api.js`, `index.html`, `ui/*.css` (painel da flag, seguindo o
visual sóbrio da 02a — sem neon/gradiente), `verify-flags.cjs` (novo), `AGENTS.md`, `README.md`.

## Critérios de aceite
- Todos os `verify*.cjs` passam.
- `ZC_DEV=1 node server/index.cjs` → no console do navegador, capturar 5 flags pela rota dev →
  painéis de flag + lembranças → caderno mostra 5/5 → fala da senha lembrada.
- Sem `ZC_DEV`, a rota dev responde 404.

## Prompt para o Codex
```
Leia AGENTS.md, codex/FASE.md, codex/DIALOGOS.md e codex/tarefas/07-flags-lembrancas.md.
Execute somente a tarefa 07. Não faça git commit. Ao final, liste arquivos alterados, saída
dos verify*.cjs e o roteiro de teste manual.
```
