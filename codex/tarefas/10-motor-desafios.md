# Tarefa 10 — Motor de desafios de código (modo *implementar*) + dicas do D.A.N.I.E.L.

## Por quê
As camadas **Corrigir** de todos os casos são desafios de código (validação de backend, regra de
negócio, autorização, sanitização…). Hoje só existem as 5 missões fixas da S2. Precisamos de um
motor genérico, dirigido por dados, em que cada desafio novo seja só um arquivo de dados.

## O que fazer
1. `server/data/challenges/` — um arquivo `.cjs` por desafio:
   ```js
   module.exports = {
     id: 'pagamento-validar', caso: 'pagamento', camada: 'C', flag: 'pagamento-C',
     estacoes: ['computer_dev_left'],         // onde aparece
     requires: undefined,                     // condição de progresso para aparecer
     titulo: 'Validar o pedido no backend',
     arquivo: 'validarPedido.js',
     enunciado: '...',                        // o que fazer, em linguagem simples
     codigoInicial: '...',                    // SEMPRE o código vibecodado, com // TODO
     modo: 'implementar',
     casosFixos: [ ...entradas ],             // bordas e ataques
     gerarCasos(rng) { return [ ...entradas ]; },
     referencia(entrada) { ... },             // solução correta (só no servidor)
     dicas: ['direção', 'conceito', 'passo'], // 3 níveis (DIALOGOS.md §4)
     maxErros: null,                          // null = sem game over (só as missões antigas têm 3)
   };
   ```
2. Migrar as 5 missões da S2 para este formato (`maxErros: 3`, mesma ordem/senhas/bloqueio),
   mantendo o comportamento visível e as flags provisórias da tarefa 07.
3. API genérica (substitui as rotas de missão da S2, mantendo compatibilidade se fácil):
   `GET /api/jogo/desafios?estacao=` (lista pública), `POST /api/jogo/desafios/:id/execucao`,
   `POST /api/jogo/desafios/:id/execucao/:exec`, `POST /api/jogo/desafios/:id/dica` (revela o
   próximo nível; o servidor guarda quantas dicas foram usadas).
4. ZeroTrace: quando a estação tem mais de um desafio, mostrar uma lista lateral simples
   "Arquivos" (como abas de um editor) para escolher; o restante igual (Executar testes, Saída,
   tentativas quando houver limite).
   Botão **"Pedir dica ao D.A.N.I.E.L."** na barra do editor → mostra a dica atual na Saída, com o
   nome D.A.N.I.E.L.
5. Ao passar, `capturar(flag)` (tarefa 07) e mostrar o painel de flag.
6. Testes: `verify-challenges.cjs` (carrega todos os desafios do diretório, valida o formato, roda
   cada `referencia` contra `casosFixos`+`gerarCasos` e confere que o `codigoInicial` **falha**
   em pelo menos um caso — usando o mesmo executor do Worker em `vm` no teste); `verify-computer`
   continua cobrindo as 5 missões.

## Arquivos que podem mudar
`server/*`, `server/data/challenges/*` (novos), `engine/computer.js`, `engine/explorer.js`,
`engine/code-worker.js`, `engine/api.js`, `ui/*.css`, testes, `AGENTS.md`.

## Critérios de aceite
- Todos os `verify*.cjs` passam; as 5 missões funcionam como antes; "Pedir dica" mostra os 3
  níveis em ordem.

## Prompt para o Codex
```
Leia AGENTS.md e codex/tarefas/10-motor-desafios.md. Execute somente a tarefa 10. Não faça git
commit. Ao final, liste arquivos alterados, saída dos verify*.cjs e o roteiro de teste manual.
```
