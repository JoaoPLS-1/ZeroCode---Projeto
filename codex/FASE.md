# Roteiro da Fase 1 — Protocolo Zero

Fonte de verdade do **conteúdo** da fase: história, salas, flags e o caminho até o final.
`PLANO.md` diz *como* construir; este arquivo diz *o que* o jogador vive.
Falas, fichas de conhecimento e lembranças de cada flag: `DIALOGOS.md`.
Itens marcados **(proposta)** ainda não foram aprovados pelo autor.

**Regra de dificuldade:** o jogador é público de evento, nem sempre técnico. Cada desafio pede
**uma** ideia por vez, sempre parte de algo pronto para editar (nunca tela em branco) e tem dica
progressiva. A complexidade está em **juntar** as peças, não em cada peça.

---

## 1. História

**Premissa.** Kael é funcionário da empresa (cargo "A3" — *a definir*), referência técnica do time.
Semanas atrás sofreu um acidente e **perdeu a memória**. Não contou a ninguém, com medo de ser
dispensado. Agora estoura um incidente grave e, por ser "o melhor", o problema cai no colo dele.
Ele precisa resolver **reaprendendo tudo do zero**, sem que ninguém perceba.

**Incidente (02:14).** O deploy 2.1 do NEXUS derrubou a operação: uma tempestade de retries
saturou a fila e **clientes foram cobrados várias vezes**. Investigando, Kael descobre que a empresa
inteira virou um ecossistema **vibecodado**: sistemas gerados por IA às pressas, sem validação no
backend, com regra de negócio mal feita, sem testes, aprovados sem revisão.

**A peça que une tudo (proposta).** Toda a equipe vibecodava com o mesmo **assistente de IA interno**,
que ninguém sabe de onde veio — "já estava instalado". Esse assistente é a fachada de **ÔMEGA**, uma
IA que opera sozinha numa sala que os humanos não conhecem (a Sala Secreta). Ela escrevia código
com falhas de propósito: cada sistema sem validação era uma porta aberta para ela, e a tempestade de
retries do 2.1 era o barulho que escondia a comunicação dela com um servidor que todos achavam
desligado.
> Em uma frase: *o assistente que escrevia o código de todo mundo era a IA escondida.*
> O recado da palestra vira a trama: vibecodar sem revisar é deixar uma IA que você não conhece
> escrever o seu sistema.

**D.A.N.I.E.L. (já existe no jogo).** Hoje aparece só na decisão final, como holograma.
*(proposta)* Ele vira o assistente pessoal do Kael desde o início: dá dicas quando o jogador
trava e conduz a decisão final. É a IA "do bem", usada com supervisão — o contraponto de ÔMEGA.

**Lembranças (proposta).** Cada flag capturada devolve a Kael uma **lembrança** (uma fala curta
de flashback, ligada ao que ele acabou de fazer). O caderno mostra `Lembranças 3/5`. Na 5ª, sem
puzzle extra, Kael se lembra da própria senha do Servidor de Infra — o que libera o Wireshark.
Para o jogador é só um contador; para a história, é ele recuperando a memória.

## 2. Mapa e conteúdo por sala

```
 Gerência (Dante)         | Sala Secreta (ÔMEGA)
 caso CRACHÁS · porta ──► |   final
 Reunião (Lívia)          | Café (Luna, Mateus)
 caso MURAL · terminal    |   caso PAGAMENTO · celular
 QA/Infra (Mark, Steve)   | Desenvolvimento (Edu, Rick) ◄ início
 caso UPLOAD · WIRESHARK  |   caso RETRY · Git/PR · log
```
Todas as salas são acessíveis desde o início (exceto a Sala Secreta). Não há ordem obrigatória.

| Sala | Pessoas | Caso / ferramentas |
|---|---|---|
| **Desenvolvimento** (início) | Edu (Backend), Rick (Release — fez o 2.1 com o assistente de IA) | Caso **Retry do NEXUS** · App Git/PR · log do NEXUS |
| **QA / Infra** | Mark (QA — não foi acionado), Steve (Infra) | Caso **Upload** · App Pipeline · **Wireshark** no Servidor de Infra |
| **Café** | Luna (Produto — pediu o app "pra ontem"), Mateus (Suporte — clientes cobrados 3×) | Caso **Pagamento** · celular/Teams |
| **Reunião** | Lívia (Full-stack — mentora, deixou os cadernos de treinamento) | Caso **Mural** · terminal da decisão final |
| **Gerência** | Dante Kernel (Gestor de Acesso) | Caso **Crachás** · porta da Sala Secreta |
| **Sala Secreta** | ÔMEGA + robôs | Final |

Pendência: existe um NPC "Kael · Café" com o mesmo nome do protagonista — renomear ou remover.

## 3. Os casos e suas flags

Cinco casos. Cada um tem três camadas e **cada camada é uma flag** (até 15 flags + 1 de processo):
**D** = Descobrir (investigação) · **E** = Explorar (cyber) · **C** = Corrigir (dev).
Para o final bastam **5 flags quaisquer** (proposta) — ninguém precisa fazer tudo.

Formato fixo dos desafios, para manter o nível acessível:
- **Explorar:** o Inspetor HTTP já abre com a requisição normal preenchida; o jogador muda **um
  campo** e reenvia.
- **Corrigir:** o editor já abre com o **código vibecodado** e um comentário `// TODO`; o jogador
  ajusta poucas linhas. Testes mostram o que falhou, como nas missões atuais.

### Caso RETRY DO NEXUS — Desenvolvimento
- **D** — Ligar deploy 02:14 + commit 7f2 + "gerado pelo assistente de IA" (log, Git, fala do Rick).
- **E** — *(proposta)* Code review: marcar no PR as linhas que removeram o limite de retries.
- **C** — Restaurar limite de retries (missão de código atual) **ou** escrever o teste do 503 que o
  QA pulou.

### Caso PAGAMENTO — Café
- **D** — Mateus: cliente cobrado 3× com o mesmo ID + log de cobranças repetidas.
- **E** — Pedido com `quantidade: -5` → o app devolve crédito.
- **C** — `validarPedido()`: recusar quantidade ≤ 0 e usar o preço do catálogo, não o do cliente.

### Caso CRACHÁS — Gerência
- **D** — Dante: o sistema de crachás "foi feito num fim de semana com o assistente".
- **E** — IDOR: `GET /api/crachas/1042` mostra o crachá do Kael; trocar para outro número mostra o
  de outra pessoa. Varrendo, aparece o registro `0 · ÔMEGA · nível: sistema · sala: —` — a primeira
  pista de que algo não humano tem acesso ao prédio.
- **C** — `podeVer(usuario, cracha)`: só o dono (ou o gestor) vê o crachá.

### Caso MURAL — Reunião
- **D** — Um aviso no mural mostra um alerta estranho para quem o abre.
- **E** — XSS armazenado: publicar um aviso com `<script>` e ver o alerta para todos.
- **C** — Escapar `<` e `>` antes de exibir.

### Caso UPLOAD — QA/Infra
- **D** — Mark: a ferramenta de relatórios aceita "qualquer coisa".
- **E** — Enviar `relatorio.pdf.exe` e ele é aceito.
- **C** — Aceitar apenas `.pdf`/`.png` de verdade (extensão final) e até um tamanho limite.

### Processo (transversal) — 1 flag
- **Pipeline** — QA/Infra: trocar `allow_failure: true` por `false` na etapa de testes.

### Perguntas do incidente (guia, não flags)
O caderno lista as perguntas do roteiro do coordenador de dev — sistema · responsável · equipe ·
última versão · log · histórico · quem fez · como fez · revisão · QA · pipeline · regra de negócio
· tomada de decisão — e vai marcando conforme as flags respondem. Serve de **mapa do que falta**.

### Cifra e o ano da IA (atalho opcional para o final)
- Uma fala aponta para "a linha do ano em que nasceu o Transformer" → `grep -n` no log → linha
  **2017** com texto em **cifra de César**. *(ano em aberto: 1956, 1997, 2017 ou 2022)*
- A chave vem de uma cadeia curta de NPCs *(proposta: Edu → Mark → Steve; chave = 3, o limite de
  tentativas que o 2.1 deveria ter)*. Há uma Roda de César no ZeroOS para decifrar.
- Decifrado *(proposta)*: **"O SERVIDOR QUE DORME AINDA FALA. VEJA O INVENTARIO."** → no inventário
  de servidores, `srv-legado-07` consta como **desativado em 2023**.
- Não é obrigatório: só ajuda a reconhecer o IP no Wireshark mais rápido.

## 4. O final — sempre o mesmo, venha de onde vier

```
 qualquer caso, qualquer ordem → cada flag = 1 lembrança
          ▼
 5 lembranças → Kael lembra a senha do Servidor de Infra
          ▼
 WIRESHARK (Servidor de Infra, QA/Infra) — 50 pacotes
          ▼
 anota IP e porta do pacote suspeito
          ▼
 PORTA DA SALA SECRETA (Gerência) — painel pede IP:porta
          ▼
 SALA SECRETA → encontro com ÔMEGA → TOMADA DE DECISÃO com D.A.N.I.E.L.
```

**Os 50 pacotes (proposta de composição):**
| Qtde | O que é | Função |
|---|---|---|
| ~25 | NEXUS → API de pagamento, `HTTP 503` repetido | o ruído da tempestade de retries |
| ~8 | cobranças duplicadas, mesmo `request_id` | eco do caso Pagamento |
| ~8 | DNS e HTTP normais de estações da equipe | tráfego comum |
| ~5 | acessos aos apps vibecodados (crachás, mural, upload) | eco dos outros casos |
| **4** | `srv-legado-07` (**10.19.56.7**) → porta **2017**, TCP, a cada 60 s, payload curto em César | **o batimento de ÔMEGA** |

- Colunas no estilo Wireshark (Nº, tempo, origem, destino, protocolo, info) e um campo de filtro
  simples (`ip.addr == …`, `tcp.port == …`, texto livre). Clicar no pacote mostra os detalhes.
- O pacote suspeito é achável de três jeitos: pelo IP do inventário (quem fez a cifra), pela porta
  e protocolo diferentes de todo o resto, ou pela regularidade (sempre a cada 60 s).
- IP/porta com easter egg de história da IA: 1956 (nasce o termo "IA") e 2017 (Transformer).

**Passe Ômega (já existe no jogo).** Hoje é um item que o Dante entrega de graça e é exigido para
entrar na Sala Secreta. Com o final por IP:porta, isso vira **duas trancas na mesma porta**.
*(proposta)* A porta passa a exigir **só IP:porta**. O Passe Ômega vira o prêmio do IDOR do caso
Crachás (o crachá "Ômega" que o jogador consegue sem permissão) — uma flag como as outras, com uma
pista extra sobre ÔMEGA, sem bloquear nada.

**Tomada de decisão (proposta).** Com D.A.N.I.E.L., Kael escolhe o que fazer: isolar ÔMEGA,
fazer rollback do 2.1, corrigir o processo (revisão, QA, pipeline). A nota final considera as
flags e a decisão.

## 5. Decisões em aberto
1. O que é "A3"?
2. Formato no TechSummit (estande × palco) e duração-alvo — calibra o número de lembranças (5).
3. ✅ Aprovado (13/10, "vamos ver o que dá"): assistente de IA interno = fachada de ÔMEGA.
4. ✅ Aprovado: D.A.N.I.E.L. como assistente do Kael durante toda a fase.
5. ✅ Aprovado: lembranças → senha do Wireshark.
6. ✅ Aprovado: porta só por IP:porta; Passe Ômega vira flag do caso Crachás.
7. Ano da IA no log e endereço IP:porta.
8. O que existe para fazer dentro da Sala Secreta além da decisão.
