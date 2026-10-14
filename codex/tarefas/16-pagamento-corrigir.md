# Tarefa 16 — Caso Pagamento: corrigir (validação no backend + idempotência)

## Por quê
Camada **Corrigir** (dev) do caso Pagamento: o jogador escreve a validação que o código gerado
pela IA não tinha. Ficha: *"O servidor é a fonte da verdade: confere quantidade, usa o preço do
catálogo (nunca o enviado pelo cliente) e não processa duas vezes o mesmo pedido."*
(`codex/DIALOGOS.md` §3). Independe da tarefa 15 (explorar), que será definida pelo autor.

## O que fazer
Dois desafios no formato da tarefa 10 (`modo: 'implementar'`, `maxErros: null`), ambos no
`computer_dev_left` (Dev 1), aparecendo depois da missão original desse PC estar resolvida
(`requires: 'flag:retry-C'`).

1. `pagamento-validar` → flag `pagamento-C` (parte 1 de 2; ver item 3).
   - Assinatura: `validarPedido({ pedido, catalogo })` → `{ ok: true, total }` ou
     `{ ok: false, erro }`.
   - `pedido = { produto, quantidade, preco? }`; `catalogo = { [produto]: preco }`.
   - Regras: produto deve existir no catálogo; `quantidade` inteiro de 1 a 10; o total usa
     **sempre** o preço do catálogo (o campo `preco` do pedido é ignorado); total com 2 casas.
     Mensagens de erro livres (o teste só confere `ok` e `total`).
   - `codigoInicial` = versão vibecodada: calcula `quantidade * (pedido.preco ?? catalogo[produto])`
     e retorna `ok: true` sempre, com o comentário
     `// gerado pelo Assistente de IA — "a tela já valida a quantidade"` e `// TODO validar no backend`.
   - Casos fixos: pedidos válidos, quantidade 0, negativa, fracionária, 11, string, produto
     inexistente, `preco` diferente do catálogo; gerador aleatório de pedidos válidos/invalidos.
2. `pagamento-idempotencia` → parte 2 de 2.
   - Assinatura: `processar({ pedido, requestId, jaProcessados })` → `'processado'` ou
     `'duplicado'` (`jaProcessados` é uma lista de ids).
   - `codigoInicial` vibecodado: sempre `'processado'`.
   - Casos: id novo, id repetido, lista vazia, id parecido mas diferente.
3. A flag `pagamento-C` é capturada quando **os dois** desafios estiverem resolvidos (o primeiro
   resolvido mostra "1 de 2 correções aplicadas").
4. Depois de `pagamento-C`, se o app do Café do `/lab` existir (tarefa 15), ele deve passar a
   aplicar as mesmas regras — deixar um `// TODO tarefa 15` no ponto de integração, sem
   implementar o app.
5. Enunciados em linguagem simples, citando o depoimento do Mateus (cliente cobrado 3×). Dicas em 3
   níveis no estilo de `DIALOGOS.md` §4, sem entregar o código.

## Arquivos que podem mudar
`server/data/challenges/pagamento-validar.cjs`, `server/data/challenges/pagamento-idempotencia.cjs`
(novos), `server/*` (flag composta), testes, `AGENTS.md`.

## Critérios de aceite
- Todos os `verify*.cjs` passam (`verify-challenges.cjs` confere que as referências passam e os
  códigos iniciais falham).
- `ZC_DEV=1`: no Dev 1, com `retry-C`, os dois arquivos aparecem no ZeroTrace; resolver ambos
  captura `pagamento-C` com ficha e lembrança.

## Prompt para o Codex
```
Leia AGENTS.md, codex/DIALOGOS.md (seção 3) e codex/tarefas/16-pagamento-corrigir.md.
Pré-requisitos: tarefas 07 e 10 concluídas. Execute somente a tarefa 16. Não faça git commit.
Ao final, liste arquivos alterados, saída dos verify*.cjs e o roteiro de teste manual.
```
