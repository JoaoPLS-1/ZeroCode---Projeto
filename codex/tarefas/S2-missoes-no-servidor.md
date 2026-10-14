# Tarefa S2 — Missões de código com gabarito no servidor

## Por quê
Hoje `data/code-missions.js` entrega ao navegador os testes com as respostas esperadas, as
recompensas e a lógica de senha. Basta F12 para resolver tudo. Depois desta tarefa o navegador
recebe só o enunciado e as **entradas**; quem decide se passou é o servidor.

## Fluxo novo
```
1. GET  /api/jogo/missoes                 → lista pública: id, nome, arquivo, código inicial,
                                            manual, bloqueada?, resolvida?, erros (sem gabarito)
2. POST /api/jogo/missoes/:id/execucao    → { execucao, entradas[] }   (gera casos novos)
3. Worker do navegador roda o código do jogador sobre as entradas → saídas[]
4. POST /api/jogo/missoes/:id/execucao/:execucao  { saidas[] }
       → { ok, resultados:[{ teste, passou, entrada, esperado?, recebido }], erros, gameOver,
           recompensa?, senha? }
5. POST /api/jogo/missoes/:id/desbloquear { senha } → { ok }
```
- **Entradas aleatórias**: cada missão tem casos fixos de borda + casos gerados aleatoriamente a
  cada execução (ex.: missão 1 sorteia `status` entre 200/500/503 e `attempt` de 0 a 6). Assim não
  adianta decorar saídas. Uma `execucao` vale uma vez e expira em 60 s.
- `esperado` só aparece nos testes que **falharam** (como um test runner real).
- Erros, limite de 3 por PC, game over, `resolvida`, desbloqueio e **senhas** ficam na sessão do
  servidor. Senhas geradas no servidor, reveladas só na resposta de sucesso da missão anterior
  (e depois em `GET /api/jogo/missoes`, no item resolvido).
- Ao resolver, o servidor registra `clue:<clueRef>` no progresso da sessão e devolve a recompensa;
  o cliente então mostra a pista como hoje.

## O que fazer
1. `server/data/missions.cjs`: para as 5 missões atuais — `id`, `clueRef`, casos fixos, gerador de
   casos aleatórios, **função de referência** (solução correta usada para calcular o esperado),
   texto de recompensa. Metadados públicos (nome, arquivo, código inicial, manual) podem ficar em
   `data/code-missions.js` **sem** `tests` e sem `reward`.
2. `server/missions.cjs` + rotas acima no roteador da S1, com validação de entrada (ids
   conhecidos, `saidas` array do tamanho certo, `senha` string ≤ 32 caracteres).
3. `engine/code-worker.js`: passa a receber `{ source, entradas }` e devolver `{ saidas }` (ou
   erro de execução/sintaxe), sem comparar nada. Manter as proteções atuais (sem rede, timeout no
   cliente).
4. `engine/computer.js` e `engine/explorer.js`: usar a API em vez de `tests`/`reward`/senha locais.
   Comportamento visível igual ao de hoje (mensagens, tentativas restantes, game over, ZeroVault
   mostrando instruções/treinamento/recompensa/credencial).
   O que é só de interface (pasta sorteada das instruções, `read`, `tutorialRead`, rascunho do
   código, notas) pode continuar no cliente.
5. Testes:
   - `verify-computer.cjs` reescrito para o novo fluxo: Worker transforma entradas em saídas;
     servidor aceita as 5 soluções de referência (já em `verify-computer.cjs`), recusa os códigos
     iniciais, conta erros, game over no 3º, `execucao` reutilizada/expirada recusada, saídas
     decoradas de uma execução anterior falham na seguinte, senha errada não desbloqueia.
   - Em `verify-server.cjs`: nenhuma resposta da API contém o campo `tests`, a função de referência
     ou a senha de uma missão ainda não resolvida.

## Restrições
- Não executar código do jogador no servidor.
- Não mudar o texto das missões nem a ordem Dev 1 → Dev 2 → QA → Técnico → Infra.

## Arquivos que podem mudar
`server/*`, `data/code-missions.js`, `engine/code-worker.js`, `engine/computer.js`,
`engine/explorer.js`, `engine/api.js`, `verify-computer.cjs`, `verify-server.cjs`, `AGENTS.md`.

## Critérios de aceite
- Todos os `verify*.cjs` passam.
- Busca no navegador (F12 → Sources/Network) não encontra gabaritos nem senhas antes de resolver.
- Teste manual: Dev 1 → instruções → errar 1 vez (vê "esperado/recebido") → acertar → senha →
  Dev 2 desbloqueia com a senha; senha errada recusa; recarregar a página + "Iniciar" zera tudo.

## Prompt para o Codex
```
Leia AGENTS.md, codex/PLANO.md (seção 4) e codex/tarefas/S2-missoes-no-servidor.md.
Pré-requisito: tarefa S1 concluída. Execute somente a tarefa S2. Ao final, liste arquivos
alterados, saída de todos os verify*.cjs e o roteiro de teste manual.
```
