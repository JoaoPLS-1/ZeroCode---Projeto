# Tarefa 14 — Perguntas do incidente (camada Descobrir) + caso Pagamento: descobrir

## Por quê
A camada **Descobrir** de cada caso precisa de uma prova verificável de que o jogador investigou.
Padrão único: o caderno de Kael tem as **perguntas do incidente** (roteiro do coordenador de dev,
`codex/FASE.md` §3); algumas pedem um **valor** encontrado nas pistas (um identificador, um
horário, um hash de commit). Responder certo, validado no servidor, captura a flag D do caso.

## O que fazer
1. `server/data/perguntas.cjs`: `{ id, ordem, pergunta, tipo: 'valor'|'escolha', opcoes?,
   resposta (só servidor; comparação normalizada: trim, maiúsculas, sem espaços duplos),
   flag?: 'pagamento-D', dica }`. Incluir todas as perguntas do roteiro; nesta tarefa, só a do
   Pagamento concede flag. As demais ficam com `flag` indefinida e serão ligadas nas tarefas dos
   casos; perguntas cujo conteúdo ainda não existe no jogo ficam com `disponivel: false`.
2. API: `GET /api/jogo/perguntas` (texto, tipo, opções, se já respondida — nunca a resposta);
   `POST /api/jogo/perguntas/:id { resposta }` → acerto seta `q:<id>` e captura a flag, se houver;
   erro → mensagem neutra; limite de 10 tentativas/min.
3. UI: no Dossiê (J), aba **"Perguntas do incidente"** com a lista, campo de resposta/opções e
   estado (respondida ✓). Respostas certas mostram uma linha curta de conclusão de Kael.
4. **Caso Pagamento — descobrir**:
   - VFS: `/var/log/cobrancas.log` (id `cobrancas-log`, PCs do Café não existem — visível em
     `computer_dev_right` e `computer_qa_infra_lower`): ~40 linhas de cobranças; o mesmo
     `request_id` **`REQ-7F2-0412`** aparece 3× em 3 segundos para o cliente `C-1088`, com o mesmo
     valor; o resto é normal.
   - Pergunta: "Qual identificador de requisição foi cobrado mais de uma vez?" → `REQ-7F2-0412`
     → flag `pagamento-D`.
   - Fala do Mateus (já existe) aponta para o log de cobranças; acrescentar uma linha: "O log de
     cobranças fica no servidor de release." (`computer_dev_right`).
5. Testes `verify-perguntas.cjs`: normalização, flag concedida uma vez, resposta nunca enviada ao
   cliente, limite de tentativas.

## Arquivos que podem mudar
`server/*`, `server/data/perguntas.cjs` (novo), `server/data/vfs.cjs`, `engine/case.js`
(dossiê), `data/dialogs.js` (fala do Mateus), `ui/*.css`, testes, `AGENTS.md`.

## Critérios de aceite
- Todos os `verify*.cjs` passam; no Dev 2, `grep REQ /var/log/cobrancas.log` mostra a repetição;
  responder no dossiê captura a flag com ficha e lembrança.

## Prompt para o Codex
```
Leia AGENTS.md, codex/FASE.md (seção 3), codex/DIALOGOS.md e
codex/tarefas/14-perguntas-descobrir.md. Execute somente a tarefa 14. Não faça git commit. Ao
final, liste arquivos alterados, saída dos verify*.cjs e o roteiro de teste manual.
```
