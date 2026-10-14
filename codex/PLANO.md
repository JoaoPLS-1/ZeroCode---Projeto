# Plano da fase — ZeroCode / TechSummit

Documento de referência para o Codex. **Não implemente nada a partir deste arquivo diretamente**:
execute apenas a tarefa de `codex/tarefas/` indicada no prompt. Este plano explica o "porquê" e o
"como construir". **O conteúdo da fase (história, salas, flags, final) está em `codex/FASE.md`**,
que prevalece em caso de conflito.

## 1. Contexto
- Apresentação no **TechSummit**, tema **IA**. O jogo une **cibersegurança + desenvolvimento** em
  pé de igualdade: validação de backend, regra de negócio, testes, code review e CI geram flags
  tanto quanto explorar vulnerabilidades.
- A fase é um **CTF de mundo aberto**: sem caminho fixo; o jogador explora salas, conversa,
  lê arquivos e usa ferramentas para responder perguntas e capturar flags, na ordem que quiser.
- Recado central: os riscos do **vibecoding** — código gerado por IA, sem revisão, sem QA, sem
  validação no backend, com regra de negócio mal feita.

## 2. História
- **Kael** trabalha na empresa (cargo "A3" — *a definir*). Perdeu a memória num acidente e escondeu
  isso por medo de ser dispensado. Por ser muito bom, ficou responsável pelo incidente — e precisa
  **reaprender do zero** com as pistas. Tutoriais e dicas são diegéticos (ele está relembrando).
- **Incidente:** o deploy 2.1 do NEXUS (02:14) foi **vibecodado**: o código gerado por IA removeu o
  limite de retries; a revisão aprovou sem ler; o QA não foi acionado; a pipeline não barrou.
  Resultado: tempestade de retries e **clientes cobrados várias vezes** (falha de idempotência).
- **Virada final (fixa, independente do caminho):** no Wireshark, em meio ao ruído dos retries,
  aparece um pacote de um servidor marcado como **inativo**, com IP e porta. Esse endereço abre a
  **Sala Secreta**, operada só por robôs/IA — os humanos não sabiam que ela existia.
  *A definir:* relação da IA da sala com o incidente, com D.A.N.I.E.L. e com o NEXUS; o que
  acontece dentro da sala.

## 3. Estrutura da fase

### Princípio: toda falha tem dois lados
Cada sistema vibecodado é um **caso** com três camadas, e **cada camada é um desafio com flag**:

| Camada | Mundo | O jogador... | Exemplo (pagamento do Café) |
|---|---|---|---|
| **Descobrir** | investigação | encontra a falha cruzando pistas (NPC, log, código, commit) | Mateus: "cliente cobrado 3x com o mesmo ID" + log com repetições |
| **Explorar** | cyber | prova a falha atacando o sistema | no Inspetor HTTP, envia `quantidade: -5` e ganha crédito |
| **Corrigir** | dev | escreve a validação no backend, a regra de negócio ou o teste que faltou | escreve `validarPedido()` e passa nos testes ocultos |

Não precisa fazer as três camadas de todos os casos: cada flag conta para liberar o final. Quem
gosta de cyber explora mais; quem gosta de dev corrige mais. O recado: **a mesma falha que o atacante
explora é a validação que o dev não escreveu**.

### Tipos de desafio de DEV (todos executam JS de verdade no sandbox `code-worker.js`)
- **Implementar** (já existe nas 5 missões atuais): o jogador escreve uma função e ela passa nos
  testes. Usado para validação de backend, autorização, sanitização, regra de negócio, idempotência.
- **Escrever o teste que o QA não escreveu:** o jogador escreve casos de teste; o jogo os roda
  contra a versão **vibecodada** (algum caso precisa falhar — "pegou o bug") e contra a versão
  **correta** (todos precisam passar — "o teste é válido"). Ensina testes de verdade.
- **Code review:** o jogador lê um PR vibecodado e marca as linhas com problema (validação
  ausente, regra errada, segredo exposto). Acertar as linhas certas dá a flag.
- **Pipeline:** corrigir a configuração de CI (ex.: `allow_failure: true` na etapa de testes,
  etapa de testes comentada) para que ela barre o deploy defeituoso.

### Casos planejados
| Caso (sistema vibecodado) | Descobrir | Explorar (cyber) | Corrigir (dev) |
|---|---|---|---|
| **Retry do NEXUS** (incidente) | log, deploy 02:14, commit 7f2 | — (é o incidente) | limite de retries + backoff (missões atuais) · escrever o teste de 503 que o QA pulou |
| **Pagamento do Café** | Mateus, log de cobranças | quantidade negativa / preço vindo do cliente / cupom repetido | validação no backend · idempotência por ID de requisição |
| **Crachás** | Dante, lista de funcionários | IDOR: trocar o ID e obter o crachá do Dante → **Passe Ômega** | checagem de autorização (`podeVer(usuario, cracha)`) |
| **Mural da equipe** | post suspeito no mural | XSS armazenado | sanitizar/escapar a entrada antes de salvar/exibir |
| **Upload de relatórios** | QA sem validação de arquivo | enviar arquivo `.html`/executável | validar extensão, tipo e tamanho |
| **Processo** (transversal) | PR aprovado em 40 s, QA não acionado | — | code review do PR · corrigir a pipeline |

### Camada de investigação e cifras
- **Perguntas do incidente** (roteiro de causa raiz de um coordenador de dev) no dossiê, respondidas
  em qualquer ordem: qual é o sistema · quem cuida · equipe · última versão · o que o log mostra ·
  histórico de versões · quem fez · como fez (vibecode) · revisão · QA · pipeline · regra de
  negócio · **tomada de decisão**. As respostas vêm dos casos acima.
- **Cifras e IA:** a linha do log correspondente ao **ano de uma IA** (ex.: 2017, Transformer) traz
  texto em **cifra de César**; a chave está em outra pista. Cadeias de NPCs: um leva ao outro, que
  devolve um valor, que é verificado, até uma chave. Usadas para **ligar** os casos entre si.
- **Ferramentas por local:** apps específicos só existem em certos PCs (ex.: Wireshark no servidor
  de Infra), para que explorar o mapa continue importando.

### Final (fixo)
```
 casos em qualquer ordem ──► flags (descobrir / explorar / corrigir) ──► N flags liberam
 WIRESHARK ──► pacote do servidor "inativo" (IP:porta) ──► SALA SECRETA ──► tomada de decisão
```

## 4. Arquitetura-alvo
Base: o **ZeroOS** que já existe nos PCs (`engine/case.js`, `explorer.js`, `os-setup.js`,
`windows-pixel.js`). Não importar o repositório `browser-os` (React+Vite, exige build); reaproveitar
apenas as ideias abaixo, em JS puro:
1. **Progresso** (`engine/progress.js`): flags/fatos descobertos, independente de pistas. Base de
   tudo que é "o jogador já sabe X".
2. **Sistema de arquivos virtual** (`data/vfs.js` + `engine/os/vfs.js`): arquivos por caminho,
   em memória (zera a cada partida — importante no evento), com arquivos que aparecem por flag.
3. **Registro de apps** (`engine/os/apps.js`): `{id, nome, ícone, disponívelEm, abrir}`; o desktop
   do ZeroOS monta os lançadores a partir dele.
4. **Terminal** (`engine/os/apps/terminal.js`): tabela de comandos sobre o VFS
   (`ls`, `cd`, `cat`, `grep`, `help`, depois `git log`, `decode`...).
5. **Motor de desafios de código** (`data/challenges/*.js` + app ZeroTrace genérico): generaliza as
   missões atuais para os modos *implementar* e *escrever testes*, reutilizando `code-worker.js`.
6. **Servidor simulado** (`engine/os/fake-api.js`): rotas dos sistemas vibecodados com as falhas;
   usado pelo Inspetor HTTP (explorar). A função corrigida pelo jogador é testada contra as mesmas
   requisições de ataque (corrigir).
7. Apps de conteúdo: César, Git/PR, Pipeline, Inspetor HTTP, Wireshark.

## 5. Fragmentos (ordem de execução)
Status: ⬜ pendente · 🟨 em andamento · ✅ concluído. Uma tarefa por vez; revisar antes da próxima.

**Fase 0 — Base**
- ✅ 00 Versionamento com git (manual, ver tarefa)
- ✅ 01 Atualizar testes desatualizados
- ✅ 02 Remover código morto (`computer.js` duplicado, `CHALLENGES`)

**Fase 1 — Plataforma ZeroOS (ferramentas do CTF)**
- ⬜ 03 Sistema de progresso (flags)
- ⬜ 04 Sistema de arquivos virtual
- ⬜ 05 Registro de apps no ZeroOS
- ⬜ 06 App Terminal (`ls`, `cd`, `cat`, `grep -n`) — base do "log do ano da IA"
- ⬜ 07 Captura de flags: lembranças no caderno, ficha de conhecimento, D.A.N.I.E.L. comemorando
- ⬜ 08 App Wireshark (50 pacotes, filtro, detalhes) + desbloqueio por 5 lembranças
- ⬜ 09 Porta da Sala Secreta por IP:porta (substitui o Passe Ômega como tranca)
> Marco jogável: dá para ir do terminal ao Wireshark e à Sala Secreta com flags de teste.
- ⬜ 10 Motor de desafios de código (modo *implementar*; migra as 5 missões atuais)
- ⬜ 11 Modo *escrever o teste que faltou*
- ⬜ 12 Servidor simulado + App Inspetor HTTP
- ⬜ 13 App Roda de César + log real do NEXUS (linha do ano da IA) + cadeia de NPCs

**Fase 2 — Primeiro caso completo (fatia vertical): Pagamento do Café**
- ⬜ 14 Descobrir: pistas do caso (Mateus, log de cobranças)
- ⬜ 15 Explorar: regra de negócio no Inspetor HTTP
- ⬜ 16 Corrigir: validação no backend + idempotência
> Revisar a experiência inteira deste caso antes de replicar o modelo nos outros.

**Fase 3 — Demais casos e processo**
- ⬜ 17 Retry do NEXUS: code review do PR + teste do 503 (missões atuais viram "corrigir")
- ⬜ 18 Crachás: autorização → Passe Ômega + correção
- ⬜ 19 Mural: tratamento de entrada + correção
- ⬜ 20 Upload: validação de arquivo + correção
- ⬜ 21 App Git/PR (histórico, blame) e App Pipeline
- ⬜ 22 Perguntas do incidente no caderno
- ⬜ 23 Diálogos novos de todos os NPCs (`DIALOGOS.md`) e D.A.N.I.E.L. com dicas

**Fase 4 — Final**
- ⬜ 24 Sala Secreta: ÔMEGA e cena final
- ⬜ 25 Nova tomada de decisão com D.A.N.I.E.L.

**Fase 5 — Evento**
- ⬜ 26 Desligar modos de teste, reset rápido entre jogadores, dicas progressivas

## 6. Decisões em aberto
1. O que é "A3"?
2. Formato no evento (estande × palco) e duração-alvo da partida.
3. Papel de D.A.N.I.E.L. e do NEXUS; quem é a IA da Sala Secreta.
4. O que acontece dentro da Sala Secreta.
5. Quantas flags liberam o Wireshark (e se as três camadas valem o mesmo).
6. Qual ano/IA usar no log (sugestões inequívocas: 1956, 1997, 2017, 2022).
