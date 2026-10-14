# Roteiro de teste — flags, respostas e onde ir

Gabarito para o autor testar. **Não mostrar aos jogadores.** (A pasta `codex/` não é servida pelo
jogo — dá 404.) Valores conferidos no código em 14/10/2026.

## Mapa rápido dos PCs
| PC (sala) | Missão de código | Apps extras |
|---|---|---|
| **Dev 1** (Desenvolvimento, esquerda) | `retry.js` → flag `retry-C` | Git · Pagamento (2 desafios, após `retry-C`) |
| **Dev 2** (Desenvolvimento, direita) | `timeline.js` (senha do Dev 1) → `provisoria-2` | Git · logs de cobranças · inventário |
| **QA** (QA/Infra, em cima) | `coverage.js` (senha do Dev 2) → `provisoria-3` | `retry-teste` (escrever teste) · Pipeline |
| **Técnico** (QA/Infra, embaixo) | `backoff.js` (senha do QA) → `provisoria-4` | Pipeline · logs · inventário |
| **Servidor de Infra** (QA/Infra, alto à direita) | `recovery.js` (senha do Técnico) → `provisoria-5` | **Wireshark** · inventário |
Todos os PCs têm: Terminal, Roda de César, Arquivos, ZeroTrace.

## Flags disponíveis hoje (11) — 5 quaisquer liberam o Wireshark
| Flag | Onde / como |
|---|---|
| `retry-C` | Missão do Dev 1 **ou** desafio `retry-teste` no QA |
| `provisoria-2…5` | Missões dos PCs Dev 2, QA, Técnico, Infra (em sequência, com senha) |
| `retry-D` | Dossiê (J) › Perguntas › "Qual commit removeu o limite de tentativas?" → `7f2c9a1` |
| `retry-E` | App Git (Dev 1/Dev 2) › Pull requests › #214 › marcar linhas **r2, r4, r5** › enviar revisão |
| `pagamento-D` | Dossiê › "Qual identificador de requisição foi cobrado mais de uma vez?" → `REQ-7F2-0412` |
| `pagamento-C` | Dev 1 (após `retry-C`) › ZeroTrace › os **dois** arquivos de pagamento |
| `pipeline-P` | App Pipeline (QA/Técnico) › Configuração › trocar `allow_failure: true` por `false` (ou apagar a linha) › Validar e salvar |
Ainda não existem no jogo: camadas E de Pagamento e todas de Crachás, Mural e Upload (pausadas).

## Soluções das missões de código (ZeroTrace)
Antes, abra **Arquivos** e dê duplo clique em `instrucoes.txt` (libera o botão Executar).
1. Dev 1 `retry.js`: `return input.status === 503 && input.attempt < 3;`
2. Dev 2 `timeline.js`: `const e = input.find(e => e.type === "deploy"); return e ? e.time : null;`
3. QA `coverage.js`: `return input.filter(t => t.status === "SKIP").map(t => t.name);`
4. Técnico `backoff.js`: `return Math.min(8000, 1000 * 2 ** input);`
5. Infra `recovery.js`:
   `return { isolate: input.retries > 100, rollback: input.retries > 100 && input.externalTraffic === "baseline" };`
Cada uma mostra a senha do próximo PC (também fica no ZeroVault). 3 erros no mesmo PC = game over.

**`retry-teste` (QA):**
```js
return [
  [{ status: 200, attempt: 0 }, false],
  [{ status: 503, attempt: 5 }, false],
];
```
**`pagamento-validar.js` (Dev 1):**
```js
const { pedido, catalogo } = input;
const preco = catalogo[pedido.produto];
if (preco === undefined) return { ok: false, erro: 'produto inexistente' };
if (!Number.isInteger(pedido.quantidade) || pedido.quantidade < 1 || pedido.quantidade > 10)
  return { ok: false, erro: 'quantidade inválida' };
return { ok: true, total: Number((pedido.quantidade * preco).toFixed(2)) };
```
**`pagamento-idempotencia.js` (Dev 1):**
```js
return input.jaProcessados.includes(input.requestId) ? "duplicado" : "processado";
```

## Perguntas do incidente (Dossiê · J) — as que não dão flag
| Pergunta | Resposta |
|---|---|
| Qual sistema foi afetado? | `NEXUS` |
| Quem publicou a versão 2.1? | Rick |
| Qual equipe publicou? | Desenvolvimento |
| Qual versão entrou durante o incidente? | `2.1` |
| Caminho do log do NEXUS? | `/var/log/nexus.log` |
| Quem gerou o código de retry? | Assistente de IA |
| Como esse código foi escrito? | Gerado pelo assistente de IA |
| Em quantos segundos o PR foi aprovado? | `40` |
| O QA foi chamado? | Não |
| O que a pipeline fez com os testes que falharam? | Permitiu o deploy |

## Trilha da cifra (opcional — atalho para reconhecer o IP)
1. Falar com **Edu** → **Mark** → **Steve** (chave = 3, linha do ano do Transformer).
2. Terminal (qualquer PC): `sed -n '2017p' /var/log/nexus.log`
3. Roda de César com deslocamento **−3** → "O SERVIDOR QUE DORME AINDA FALA. VEJA O INVENTARIO."
4. Terminal no Dev 2, Técnico ou Infra: `cat /srv/infra/inventario.csv` → `srv-legado-07, 10.19.56.7, DESATIVADO`.

## Final
1. Com **5 lembranças** (caderno mostra 5/5), Kael lembra a senha.
2. **Servidor de Infra** › Wireshark › filtro `ip.addr == 10.19.56.7` (ou `tcp.port == 2017`) → 4 pacotes.
3. **Gerência** (Reunião › porta de cima à esquerda) › porta da direita › Controlador de acesso:
   IP **`10.19.56.7`**, porta **`2017`** → entra na Sala Secreta.
4. Cena da ÔMEGA → **Console de ÔMEGA** › Chamar D.A.N.I.E.L.
5. Decisão ótima (classificação S/A): **Isolar ÔMEGA** · **Rollback** · **Revisão + QA + pipeline**.

## Atalho de teste (modo desenvolvimento)
`$env:ZC_DEV='1'; node server/index.cjs` → iniciar a partida → F12 › Console:
```js
for (const id of ['retry-C','retry-D','retry-E','pagamento-D','pipeline-P']) await api.post('/api/jogo/dev/flag', {id})
```
