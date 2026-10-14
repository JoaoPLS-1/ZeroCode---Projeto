# Tarefa 21 — App Pipeline (CI/CD) e flag de processo

## Por quê
"Olha a pipeline" (roteiro do coordenador): o deploy 2.1 passou porque a etapa de testes estava
configurada para **não bloquear**. O jogador corrige a configuração para que teste falho barre o
deploy. Ficha e lembrança: `codex/DIALOGOS.md` §3 ("Processo").

## O que fazer
1. Dados (`server/data/pipeline.cjs`): arquivo `pipeline.yml` fictício com etapas `build`,
   `testes`, `deploy`; na etapa `testes`: `allow_failure: true` e o comentário
   `# temporário — liberar a sexta (Kael)`. Histórico das últimas 5 execuções: a do 2.1 mostra
   `testes: FALHOU (2 SKIP, 1 FAIL) → permitido` e `deploy: OK 02:14:00`.
2. App **Pipeline** (`engine/os/apps/pipeline.js`, `availableAt: ['computer_qa_upper',
   'computer_qa_infra_lower']`): aba "Execuções" (lista com status por etapa; abrir a do 2.1 mostra
   o log da etapa de testes) e aba "Configuração" com editor do YAML (textarea monoespaçada) e
   botão "Validar e salvar".
3. Validação **no servidor** (`POST /api/jogo/pipeline { yaml }`, até 4 KB): sem interpretar YAML
   completo — verificar com regras simples que a etapa `testes` existe, que `allow_failure` está
   ausente ou `false` nela, que a etapa `deploy` continua existindo e depende de `testes`
   (`needs: [testes]` ou equivalente já presente). Acerto → flag **`pipeline-P`**; erro → mensagem
   indicando a regra não atendida.
4. Ao capturar a flag, pensamento do Kael da lembrança ("Fui eu que montei essa pipeline…").
5. Pergunta do incidente (mecanismo da tarefa 14): "O que a pipeline fez com os testes que
   falharam?" (escolha: bloqueou o deploy / permitiu o deploy / não executou) → permitiu (sem flag).
6. Testes: YAML correto, `allow_failure: true` mantido, etapa de testes removida, deploy sem
   dependência, corpo grande → 413.

## Arquivos que podem mudar
`server/data/pipeline.cjs`, `server/pipeline.cjs`, `engine/os/apps/pipeline.js` (novos),
`server/*`, `server/data/perguntas.cjs`, `server/data/flags.cjs`, `ui/zeroos-apps.css`,
`index.html`, testes, `AGENTS.md`.

## Prompt para o Codex
```
Leia AGENTS.md, codex/DIALOGOS.md e codex/tarefas/21-pipeline.md. Execute somente a tarefa 21.
Não faça git commit. Ao final, liste arquivos alterados, saída dos verify*.cjs e o roteiro de
teste manual.
```
