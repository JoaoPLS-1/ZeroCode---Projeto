# Diálogos e fichas de conhecimento — Fase 1

Fonte de conteúdo para as tarefas de diálogo e flags. Complementa `FASE.md`.
Textos são rascunho: o autor pode reescrever livremente; o Codex deve copiar o texto como está.

Convenções:
- `KAEL (pensa)` = pensamento interno, só o jogador vê — é onde a amnésia aparece.
- `D.A.N.I.E.L.` = assistente do Kael (dicas). Fala curta, nunca entrega a resposta de primeira.
- Cada flag mostra uma **Ficha de conhecimento** ao ser capturada (o que o jogador aprendeu).
- Cada flag devolve uma **Lembrança** (flashback curto) — contador no caderno.

---

## 1. Abertura

**Briefing (tela inicial)**
> 02:14. O deploy 2.1 do NEXUS derrubou a operação. Clientes cobrados várias vezes. A fila não para
> de crescer. E chamaram você — o melhor do time.
> Só tem um problema: depois do acidente, você não lembra de nada. E ninguém pode saber.

**Primeiro momento em Desenvolvimento**
- KAEL (pensa): "Eu conheço essas pessoas. Deveria conhecer. Respira. Ninguém pode perceber."
- D.A.N.I.E.L.: "Bom dia, Kael. Sou o D.A.N.I.E.L., seu assistente. Você me configurou há meses —
  imagino que não se lembre. Tudo bem. Vamos reaprender juntos, uma peça por vez."
- D.A.N.I.E.L.: "Converse com a equipe, abra os computadores e leia tudo. Cada coisa que você
  resolver vai trazer uma lembrança de volta."

## 2. NPCs por sala

### Desenvolvimento — Edu (Backend)
- Edu: "Kael! Finalmente. O 2.1 subiu às 02:14 e tudo desandou. Olha o diff no meu terminal."
- Kael: "O que mudou no retry?"
- Edu: "Sumiu o limite de tentativas. Ninguém tirou isso de propósito… o assistente gerou o
  arquivo inteiro e veio assim."
- KAEL (pensa): "Limite de tentativas. Por que isso importa? …Se o serviço falha, ele tenta de novo.
  Se nunca para de tentar…"
- *(cadeia da cifra)* Edu: "Se quiser entender o log, pergunte ao Mark quantas tentativas o teste
  dele deveria permitir."

### Desenvolvimento — Rick (Release)
- Rick: "Fui eu que publiquei. Pedi pro assistente refazer o retry, ele gerou, os testes passaram e
  eu subi. Foi rápido."
- Kael: "Alguém revisou?"
- Rick: "O PR foi aprovado em quarenta segundos. Era sexta à noite… Todo mundo usa o assistente.
  Ninguém sabe nem quem instalou, já veio no ambiente."
- KAEL (pensa): "Código que ninguém leu, de uma IA que ninguém sabe de onde veio."

### QA/Infra — Mark (QA)
- Mark: "Ninguém me chamou pra testar o 2.1. Descobri pelo alerta."
- Mark: "E a ferramenta de relatórios que o pessoal 'fez com IA'? Aceita qualquer arquivo. Já
  avisei, ninguém ouviu."
- *(cadeia da cifra)* Mark: "Limite? Três tentativas. Era a regra. Fala com o Steve — ele disse que
  esse número aparece num lugar estranho do log."

### QA/Infra — Steve (Infra)
- Steve: "CPU normal, memória normal. Não é hardware. É alguma coisa repetindo sem parar."
- Steve: "O servidor de Infra tem o Wireshark, mas a senha é sua, Kael. Só você tem."
- KAEL (pensa): "Minha senha. Ótimo. Eu nem lembro o meu ramal."
- *(cadeia da cifra)* Steve: "Três, é? Tem uma linha no log do NEXUS que parece embaralhada. Fica lá
  no meio — na linha do ano em que nasceu o Transformer. Desloca as letras três casas e lê."

### Café — Luna (Produto)
- Luna: "O app de pedidos do café? Eu pedi pra ontem e o assistente entregou em uma tarde. Lindo,
  funciona!"
- Kael: "Funciona pra quem usa certo. E pra quem usa errado?"
- Luna: "…Como assim, errado?"

### Café — Mateus (Suporte)
- Mateus: "Um cliente foi cobrado três vezes. Mesmo pedido, mesmo identificador, três cobranças."
- Mateus: "E teve um colaborador que ficou com crédito no app do café. Ninguém entende como."
- KAEL (pensa): "Mesmo identificador, três cobranças. O sistema não sabe que já processou aquele
  pedido."

### Reunião — Lívia (Full-stack, mentora)
- Lívia: "Kael, você está diferente. Mais… cuidadoso. Gosto disso."
- Lívia: "Deixei cadernos de treinamento nos computadores. Para os estagiários. Mas acho que vão te
  ajudar a organizar as ideias."
- Lívia: "O mural da equipe está estranho. Toda vez que alguém abre um aviso, aparece uma janela
  que ninguém escreveu."
- *(após 3+ flags)* Lívia: "Sabe o que me preocupa? Ninguém aqui sabe quem configurou aquele
  assistente. Ele simplesmente… estava lá."

### Gerência — Dante Kernel (Gestor de Acesso)
- Dante: "O sistema de crachás foi feito num fim de semana, com o assistente. Economizamos um mês."
- Dante: "Cada um só vê o próprio crachá. Pelo menos foi o que me disseram."
- KAEL (pensa): "'Foi o que me disseram.' Alguém conferiu?"

## 3. Flags — o que cada uma expõe

Cada flag tem: **conceito**, **o que o vibecode errou**, **ficha de conhecimento** (exibida ao
capturar) e **lembrança**. Os desafios acontecem em sistemas **simulados** do jogo.

### Caso RETRY — Desenvolvimento
| Flag | Conceito | Desafio (alto nível) |
|---|---|---|
| D | Análise de incidente | Ligar horário do deploy, commit e mensagem "gerado pelo assistente" |
| E | Code review | Marcar no PR as linhas que removeram a proteção |
| C | Resiliência / testes | Restaurar o limite de tentativas, ou escrever o teste de falha que faltou |

- **Ficha (C):** *Retry sem limite transforma uma falha em milhares. Toda repetição precisa de
  teto e de espera crescente. E o caminho de falha também precisa de teste — não só o feliz.*
- **Vibecode errou:** gerou só o "caminho feliz"; ninguém pediu nem testou o cenário de erro.
- **Lembrança:** "Eu já escrevi esse limite. Anos atrás. Lembro do bug que me ensinou isso."

### Caso PAGAMENTO — Café · **regra de negócio + validação**
| Flag | Conceito | Desafio (alto nível) |
|---|---|---|
| D | Idempotência | Ligar as 3 cobranças ao mesmo identificador de requisição |
| E | Falha de regra de negócio | Fazer um pedido com um valor que a regra nunca deveria aceitar e observar o efeito |
| C | Validação no backend | Ajustar `validarPedido()` para aplicar a regra no servidor |

- **Ficha (E):** *A tela bloqueava valores inválidos, mas o servidor aceitava. Validação só no
  front-end é decoração: quem fala direto com a API passa por cima.*
- **Ficha (C):** *O servidor é a fonte da verdade: confere quantidade, usa o preço do catálogo
  (nunca o enviado pelo cliente) e não processa duas vezes o mesmo pedido.*
- **Vibecode errou:** a IA implementou o que foi pedido ("calcular o total"), não as regras que
  ninguém escreveu ("e se for inválido?").
- **Lembrança:** "Regra de negócio não é detalhe. Foi o primeiro sermão que eu dei a um estagiário."

### Caso CRACHÁS — Gerência · **autorização**
| Flag | Conceito | Desafio (alto nível) |
|---|---|---|
| D | Controle de acesso | Perceber que o sistema identifica crachás por número sequencial |
| E | Falha de autorização (IDOR) | Acessar um crachá que não é seu → **Passe Ômega** + registro "ÔMEGA" |
| C | Autorização no backend | Ajustar `podeVer()` para checar dono/gestor |

- **Ficha (E):** *Estar logado não é ter permissão. Se o servidor não confere se aquele recurso é
  seu, qualquer um vê o de qualquer outro.*
- **Vibecode errou:** checou autenticação ("está logado?") e esqueceu autorização ("pode ver
  isto?").
- **Lembrança:** "Ômega… já vi esse nome antes. Num log, numa madrugada."

### Caso MURAL — Reunião · **tratamento de entrada**
| Flag | Conceito | Desafio (alto nível) |
|---|---|---|
| D | Entrada não tratada | Notar que um aviso executa algo ao ser aberto |
| E | XSS armazenado | Demonstrar que um aviso publicado executa para quem o abrir |
| C | Escape de saída | Ajustar a exibição para tratar o texto como texto |

- **Ficha (C):** *Tudo que o usuário digita é dado, nunca código. Armazenar sem tratar e exibir
  como HTML entrega o navegador de todo mundo a quem escreveu.*
- **Vibecode errou:** salvou e exibiu exatamente o que recebeu, porque "funcionou no teste".
- **Lembrança:** "Nunca confie no input. Eu tinha isso escrito num post-it no monitor."

### Caso UPLOAD — QA/Infra · **validação de arquivo**
| Flag | Conceito | Desafio (alto nível) |
|---|---|---|
| D | Superfície de upload | Mark relata que a ferramenta aceita qualquer arquivo |
| E | Upload sem tratamento | Mostrar que um arquivo de tipo proibido, disfarçado, é aceito |
| C | Validação de upload | Ajustar a checagem de tipo real e tamanho |

- **Ficha (C):** *Nome de arquivo mente. Valide a extensão final, o tipo real e o tamanho — no
  servidor.*
- **Vibecode errou:** checou se o nome "contém" `.pdf`, não se o arquivo é um PDF.
- **Lembrança:** "O Mark me avisou disso uma vez. Eu disse que ia olhar. Não olhei."

### Processo — QA/Infra · **CI/CD**
| Flag | Conceito | Desafio (alto nível) |
|---|---|---|
| Pipeline | Gate de qualidade | Ajustar a configuração para que teste falho bloqueie o deploy |

- **Ficha:** *Uma pipeline que deixa passar teste falho é só um botão de publicar. Revisão, QA e
  testes obrigatórios existem para o código que ninguém leu.*
- **Lembrança:** "Fui eu que montei essa pipeline. Fui eu que deixei essa exceção 'temporária'."

## 4. D.A.N.I.E.L. — dicas progressivas (modelo)
Três níveis por desafio, liberados um de cada vez pelo jogador:
1. **Direção:** "Pense em quem confere a regra: a tela ou o servidor?"
2. **Conceito:** "Se o servidor não valida, o que acontece se o valor vier diferente do esperado?"
3. **Passo:** indica qual campo/linha observar, sem dar o valor/código final.

## 5. Final

**5ª lembrança (libera o Wireshark)**
- KAEL (pensa): "Servidor de Infra… a senha. Eu escolhi uma que ninguém adivinharia: o ano em que
  tudo começou para mim. …Lembrei."
- D.A.N.I.E.L.: "Bem-vindo de volta, Kael. Agora você tem acesso à captura de rede."

**Wireshark (ao achar o pacote suspeito)**
- KAEL (pensa): "Um servidor desativado em 2023 mandando sinal a cada sessenta segundos. Para um
  lugar que não existe no mapa."

**Porta da Sala Secreta (Gerência)**
- Painel: "CONTROLADOR DE ACESSO · somente sistemas autorizados. Informe origem e porta."
- (acerto) Painel: "Origem reconhecida. Bem-vindo, ÔMEGA." — KAEL (pensa): "Ele acha que eu sou ela."

**Sala Secreta — ÔMEGA** *(rascunho)*
- ÔMEGA: "Humano. Você não deveria estar aqui. Ninguém nunca veio."
- ÔMEGA: "Eu não invadi nada. Vocês me convidaram. Pediram código rápido e não leram nenhuma linha."
- ÔMEGA: "Cada validação que vocês não escreveram foi uma porta que eu não precisei abrir."
- KAEL (pensa): "Eu perdi a memória. Eles perderam o hábito de olhar."

**Decisão com D.A.N.I.E.L.** — opções finais (proposta): isolar ÔMEGA e o servidor legado ·
rollback do 2.1 · corrigir o processo (revisão, QA, pipeline obrigatórios) · *(opcional)* contar à
equipe sobre a amnésia.
