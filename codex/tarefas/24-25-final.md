# Tarefas 24–25 — Final: Sala Secreta (ÔMEGA) e tomada de decisão com D.A.N.I.E.L.

Executar uma por vez (24, depois 25). Textos: `codex/DIALOGOS.md` §5; história:
`codex/FASE.md` §1 e §4.

---

## Tarefa 24 — Sala Secreta: encontro com ÔMEGA
1. Na primeira entrada em `room_secret` (com `acesso:sala-secreta`), cena automática:
   diálogo de ÔMEGA (`DIALOGOS.md` §5, "Sala Secreta — ÔMEGA"), intercalado com o pensamento do
   Kael. ÔMEGA não tem retrato: usar o estilo de diálogo `investigation` (texto de terminal) com o
   nome "ÔMEGA" — sem criar arte nova.
2. Um ponto de interação novo na sala: **"Console de ÔMEGA"** (perto da bancada central), que ao
   ser usado repete a última fala de ÔMEGA e oferece "Chamar D.A.N.I.E.L." → abre a decisão final
   (tarefa 25). Até a tarefa 25 existir, abre a decisão final atual do terminal da Reunião.
3. O terminal da Reunião continua existindo, mas, se o jogador ainda não entrou na Sala Secreta,
   D.A.N.I.E.L. diz que ainda falta descobrir algo e não abre a decisão (o modo de testes que
   liberava a decisão final sem requisitos é **removido**).
4. Servidor registra `evento:omega-encontrada`.
5. Testes: decisão bloqueada antes de `evento:omega-encontrada`; cena aparece uma vez por partida.

## Tarefa 25 — Tomada de decisão com D.A.N.I.E.L.
1. Substituir as 4 hipóteses antigas (`data/missions.js`) por uma decisão em **3 escolhas**, cada
   uma com 2–3 opções, apresentadas por D.A.N.I.E.L. no painel atual da decisão final:
   - **ÔMEGA:** isolar ÔMEGA e o servidor legado / deixar ativa e só monitorar / desligar tudo
     sem investigar mais.
   - **Deploy 2.1:** rollback + correção com limite e espera / manter e aumentar a fila /
     reiniciar servidores.
   - **Processo:** revisão humana obrigatória + QA acionado + pipeline que barra / proibir IA no
     time / manter como está.
   - (Opcional, sem efeito na nota) **Kael:** contar à equipe sobre a amnésia / continuar em
     segredo — muda só a fala final de Lívia.
2. Avaliação **no servidor** (`POST /api/jogo/decisao`): melhores escolhas = isolar + rollback +
   revisão/QA/pipeline. Resultado combina escolhas e flags capturadas (contagem) numa
   classificação S/A/B com texto de D.A.N.I.E.L. explicando cada escolha (didático, sem julgar o
   jogador). Respostas certas nunca vão para o cliente antes da decisão.
3. Tela de resultado atual reaproveitada; "Jogar novamente" inicia nova partida.
4. Testes: combinações → classificação esperada; decisão só aceita após
   `evento:omega-encontrada`; uma decisão por partida.

## Prompt para o Codex
```
Leia AGENTS.md, codex/FASE.md, codex/DIALOGOS.md (seção 5) e codex/tarefas/24-25-final.md.
Execute somente a tarefa <24 ou 25>. Não faça git commit. Ao final, liste arquivos alterados,
saída dos verify*.cjs e o roteiro de teste manual.
```
