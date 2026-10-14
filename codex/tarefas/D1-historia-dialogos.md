# Tarefa D1 — Nova história no jogo: abertura, pensamentos do Kael e diálogos dos NPCs

## Por quê
A plataforma está avançando, mas o jogador ainda vê a história antiga. Esta tarefa coloca no jogo
a premissa nova (Kael sem memória, deploy vibecodado, assistente de IA de origem desconhecida) e as
falas de todos os NPCs. Fonte do texto: `codex/DIALOGOS.md` (seções 1 e 2) — **copiar os textos
como estão**; contexto em `codex/FASE.md` §1.

## O que fazer
1. **Abertura**: substituir o texto do briefing (`#briefing-screen` em `index.html`) pelo
   "Briefing (tela inicial)" de `DIALOGOS.md`. Manter a linha de controles.
2. **Pensamento do Kael**: novo tipo de fala `speaker: 'thought'` no `DialogueSystem`:
   - exibe o retrato do Kael (como `player`), nome "Kael", rótulo "PENSAMENTO" no lugar do cargo,
     texto em itálico; não conta como resposta ao NPC.
   - Ajustar `ui/dialogue.css` só o necessário para o itálico/rótulo.
3. **D.A.N.I.E.L. no início**: na primeira vez que o jogador entra em jogo (após o briefing),
   abrir um diálogo com o pensamento do Kael + as duas falas de D.A.N.I.E.L. da seção
   "Primeiro momento em Desenvolvimento". Retrato: `assets/nexus/daniel-hoodie-open.png` /
   `daniel-hoodie-closed.png` (adicionar `D.A.N.I.E.L.` ao mapa de retratos de
   `_renderPortraits`; nome exibido "D.A.N.I.E.L.", cargo "Assistente").
4. **NPCs** (`data/dialogs.js`): reescrever os diálogos de Edu, Rick, Mark, Steve, Luna, Mateus e
   Lívia conforme `DIALOGOS.md` §2, incluindo as falas `KAEL (pensa)` como `thought` e as linhas da
   cadeia da cifra (Edu → Mark → Steve). Ignorar por ora a fala condicional de Lívia "(após 3+
   flags)". **Kael · Café** (`npc_cafe_decoy`): renomear para **Zeca · Café** (`npcName`, nome do
   NPC e mapa de retratos — reutilizar o retrato `kael-npc`), com uma fala curta de alívio cômico
   sobre café e retry, para não confundir com o protagonista.
   - Manter os ids, `dialogRef`, `clueRef` e a lógica de coleta de pistas.
   - Manter `OPENING_QUESTIONS` apenas se ainda fizer sentido; as novas falas já começam a conversa.
5. **Dante** (`engine/manager.js`): antes de entregar o passe (modo de testes continua igual),
   usar as falas de Dante de `DIALOGOS.md` §2.
6. **Depoimentos** (`data/clues.js`): atualizar `title`/`body` das 6 pistas de NPC (as de
   `relevant: false`) para resumir a informação nova de cada um (ex.: Rick → "PR aprovado em 40 s,
   código gerado pelo assistente"; Mateus → "cliente cobrado 3× com o mesmo identificador"). Não
   mexer nas 5 pistas técnicas (`relevant: true`).
7. Remover `DIALOGOS.txt` da raiz (nota antiga, substituída por `codex/DIALOGOS.md`).

## Restrições
- Não mudar regras, contagem de pistas (11, sendo 5 técnicas), missões nem servidor.
- Nenhum texto novo inventado além do necessário para ligar falas; se faltar fala, deixar
  `// TODO texto` e relatar.

## Arquivos que podem mudar
`index.html`, `data/dialogs.js`, `data/clues.js`, `data/npcs.js` (só nome do Zeca),
`engine/dialogue.js`, `engine/manager.js`, `engine/game.js` (diálogo inicial), `ui/dialogue.css`,
`verify.cjs` (se algum teste verificar textos antigos), `AGENTS.md` (remover a armadilha do NPC
"Kael · Café"); remover `DIALOGOS.txt`.

## Critérios de aceite
- Todos os `verify*.cjs` passam.
- Teste manual: iniciar → briefing novo → ao entrar, pensamento do Kael + D.A.N.I.E.L. com retrato
  → conversar com cada NPC (8 conversas) → falas novas, pensamentos em itálico com rótulo
  PENSAMENTO → pistas de depoimento com textos novos no dossiê (J) → Zeca no Café.

## Prompt para o Codex
```
Leia AGENTS.md, codex/DIALOGOS.md, codex/FASE.md (seção 1) e codex/tarefas/D1-historia-dialogos.md.
Execute somente a tarefa D1. Copie os textos de DIALOGOS.md como estão. Ao final, liste arquivos
alterados, saída dos verify*.cjs e o roteiro de teste manual.
```
