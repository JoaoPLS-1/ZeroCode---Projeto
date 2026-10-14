# Tarefa 12 — `/lab` (sistemas vibecodados simulados) + App Navegador e Inspetor HTTP

## Por quê
A camada **Explorar** (cyber) acontece nos sistemas internos vibecodados: o jogador usa o app
normalmente, vê que a tela bloqueia algo, abre o Inspetor, muda **um campo** da requisição e
reenvia — e o servidor aceita, porque não valida. Ver `codex/PLANO.md` §4 (regras do `/lab`).

## O que fazer
1. **Infra do lab** (`server/lab/`):
   - Cada sessão ganha um banco **SQLite em memória** (`node:sqlite`, `new DatabaseSync(':memory:')`)
     criado na primeira chamada ao `/lab` e descartado com a sessão/"nova partida".
   - Registro de "apps do lab": `{ id, nome, host: 'cafe.intranet', semear(db), rotas: [...] }`.
     Rotas em `/lab/<app>/...`, exigem sessão, corpo JSON ≤ 16 KB, sempre consultas
     **parametrizadas** (o lab simula falhas de lógica, nunca falhas reais).
   - Utilitário `explorou(sessao, flagId)` para a rota conceder a flag (tarefa 07) quando o
     comportamento vulnerável for demonstrado.
   - App de demonstração `status` (`GET /lab/status/info`) só para validar a infra.
2. **App Navegador** (`engine/os/apps/navegador.js`, `availableAt: '*'`): janela "Chrome"/"Navegador"
   com barra de endereço `http://<host>/...` e uma página simples renderizada a partir de uma
   definição de **formulário** devolvida pelo lab (`GET /lab/<app>/pagina` →
   `{ titulo, campos:[{nome, tipo, min, max, rotulo}], acao:{metodo, url} }`). A página faz
   **validação no front** conforme `min/max` (é a "proteção" que o vibecode achou suficiente) e
   envia a requisição. Cada requisição feita fica registrada no histórico de rede da janela.
3. **App Inspetor HTTP** (`engine/os/apps/inspetor.js`, `availableAt: '*'`), estilo aba Rede do
   DevTools: lista de requisições feitas pelo Navegador (método, URL, status); ao selecionar,
   mostra corpo/resposta; botão **"Editar e reenviar"** abre a requisição preenchida (método, URL,
   corpo JSON editável com validação de JSON) e envia **direto ao servidor**, sem a validação da
   página. Resposta exibida formatada.
4. Mostrar no Navegador um aviso sutil no rodapé "Página criada com o Assistente de IA interno"
   em todos os apps do lab (reforça a história).
5. Testes `verify-lab.cjs`: banco isolado por sessão (dados de uma sessão não aparecem em outra),
   nova partida zera o banco, limite de corpo, rota sem sessão → 401, `explorou` concede flag
   uma vez.

## Arquivos que podem mudar
`server/lab/*` (novos), `server/*`, `engine/os/apps/navegador.js`, `engine/os/apps/inspetor.js`
(novos), `engine/api.js`, `ui/zeroos-apps.css`, `index.html`, testes, `AGENTS.md`.

## Critérios de aceite
- Todos os `verify*.cjs` passam; Navegador abre `http://status.intranet` (app demo); Inspetor
  lista a requisição e reenvia editada.

## Prompt para o Codex
```
Leia AGENTS.md, codex/PLANO.md (seção 4) e codex/tarefas/12-lab-inspetor.md. Execute somente a
tarefa 12. Não faça git commit. Ao final, liste arquivos alterados, saída dos verify*.cjs e o
roteiro de teste manual.
```
