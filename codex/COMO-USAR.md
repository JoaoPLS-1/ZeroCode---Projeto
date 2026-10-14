# Como usar esta pasta com o Codex

1. Abra a próxima tarefa ⬜ em `PLANO.md` (seção 5) e o arquivo correspondente em `tarefas/`.
2. Copie o bloco **Prompt para o Codex** do fim da tarefa e cole no Codex.
3. Quando ele terminar, confira:
   - o diff (`git diff`) — só os arquivos listados na tarefa devem mudar;
   - os critérios de aceite da tarefa;
   - os testes: `node verify.cjs`, `node verify-computer.cjs`, `node verify-npc-animation.cjs`,
     `node verify-player-frames.cjs` (e os novos, quando houver);
   - no navegador (`node server.cjs` → http://localhost:8000), o roteiro "Teste manual" da tarefa.
4. Se estiver bom: `git add -A && git commit -m "Tarefa NN: ..."` e marque ✅ no `PLANO.md`.
   Se não: peça correção ao Codex na mesma conversa, ou `git restore .` para descartar.
5. Só então passe para a próxima tarefa.

Regras gerais para o Codex ficam em `AGENTS.md` (ele lê sozinho). As tarefas das fases 2 a 5
serão detalhadas aos poucos, conforme as decisões do `PLANO.md` forem tomadas.
