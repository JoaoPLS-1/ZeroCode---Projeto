# Tarefa 11 — Modo "escreva o teste que o QA não escreveu"

## Por quê
Testes são parte do recado ("QA não validou"). Neste modo o jogador não corrige o código: ele
escreve **casos de teste** que provam o bug. O caso vale se **falha na versão vibecodada** e
**passa na versão correta** (`codex/PLANO.md` §3, "Tipos de desafio de DEV").

## O que fazer
1. Novo `modo: 'testes'` no formato de desafio da tarefa 10:
   ```js
   modo: 'testes',
   assinatura: 'deveRepetir({ status, attempt }) → boolean',
   implementacaoVibecodada(entrada) { ... },  // a versão com bug (pode ser exibida ao jogador)
   referencia(entrada) { ... },               // a correta (só no servidor)
   validarEntrada(entrada) { ... },           // tipos/limites aceitos (ex.: status inteiro 100–599)
   minimoCasos: 1, maximoCasos: 10,
   ```
2. O editor abre com um modelo:
   ```js
   // Escreva casos de teste: [entrada, saída esperada]
   return [
     [{ status: 200, attempt: 0 }, false],
   ];
   ```
   O código do jogador roda **no Worker** e devolve só a lista (dados). O cliente envia a lista
   ao servidor. O servidor valida cada entrada (`validarEntrada`, tamanho máximo do JSON 8 KB),
   roda as **duas implementações do próprio servidor** (nunca código do jogador) e responde, por
   caso: `passaNaCorreta`, `falhaNaVibecodada`.
3. Critério de sucesso: todos os casos passam na correta **e** pelo menos um falha na vibecodada.
   Mensagens didáticas: "Seu teste não é válido: ele também falha na versão correta" / "Seus testes
   passam, mas não pegam o bug".
4. Primeiro desafio deste modo: `retry-teste` (caso Retry, camada C alternativa, flag `retry-C` —
   a mesma da missão do Dev 1; quem fizer qualquer um dos dois ganha a flag), estação
   `computer_qa_upper`, sobre o cenário 503 que o QA pulou. Implementação vibecodada: repete
   sempre que `status === 503`, sem olhar `attempt`.
5. Testes: `verify-challenges.cjs` cobre o modo (conjunto que pega o bug → ok; conjunto que não
   pega → falha; conjunto inválido na correta → falha; entrada malformada → 400).

## Arquivos que podem mudar
`server/*`, `server/data/challenges/retry-teste.cjs` (novo), `engine/computer.js`,
`engine/code-worker.js`, testes, `AGENTS.md`.

## Critérios de aceite
- Todos os `verify*.cjs` passam; no Computador QA aparece o desafio de testes; um caso com
  `{status:503, attempt:5}` esperando `false` captura a flag.

## Prompt para o Codex
```
Leia AGENTS.md e codex/tarefas/11-modo-testes.md. Execute somente a tarefa 11. Não faça git
commit. Ao final, liste arquivos alterados, saída dos verify*.cjs e o roteiro de teste manual.
```
