# Tarefa 13 — Log real do NEXUS (linha do ano da IA), Roda de César e inventário

## Por quê
Ideia original do autor: numa linha do log que corresponde ao **ano de lançamento de uma IA**
(2017, Transformer) há uma informação que leva à próxima pista, em **cifra de César**. A chave (3)
vem da cadeia de NPCs Edu → Mark → Steve (já nos diálogos da D1). É um **atalho opcional** para
reconhecer o IP no Wireshark (`codex/FASE.md` §3, "Cifra e o ano da IA").

## O que fazer
1. `server/data/vfs.cjs`: substituir o conteúdo provisório.
   - `/var/log/nexus.log` (id `nexus-log`, visível em todos os PCs): **2.400 linhas** geradas de
     forma determinística por função (não colar 2.400 linhas à mão): timestamps de 02:00 a 02:30,
     níveis INFO/WARN/ERROR, deploy `v2.1` às 02:14:00 (linha ~1.680), retries com `503` crescendo
     depois disso, mensagens variadas e realistas. A **linha 2017** (numeração começando em 1,
     como `grep -n`) é:
     `02:21:17 WARN  [kernel] R VHUYLGRU TXH GRUPH DLQGD IDOD. YHMD R LQYHQWDULR.`
     (César +3 de `O SERVIDOR QUE DORME AINDA FALA. VEJA O INVENTARIO.`).
     Nenhuma outra linha deve parecer cifrada.
   - `/srv/infra/inventario.csv` (id `inventario`, visível só em `computer_qa_infra_lower`,
     `computer_infra_upper` e `computer_dev_right`): ~12 servidores com colunas
     `hostname,ip,funcao,status,desde`; inclui
     `srv-legado-07,10.19.56.7,batch noturno,DESATIVADO,2023-03` e o NEXUS/API de pagamento com os
     IPs usados no Wireshark (`10.0.2.15`, `10.0.3.20`).
   - Ajustar arquivos provisórios da tarefa 04 que ficarem sem sentido.
2. App **Roda de César** (`engine/os/apps/cesar.js`, `availableAt: '*'`): campo de texto, seletor
   de deslocamento (−25…+25, com botões −/+), resultado ao vivo, e um disco/tabela de alfabeto
   mostrando a correspondência. Lógica pura em função testável (`cesar(texto, n)`; mantém
   espaços, pontuação e números).
3. Terminal: ler a linha 2017 com `sed -n '2017p' /var/log/nexus.log` (o `grep` procura texto, não número de linha) e `cat` com arquivo grande funcionam
   bem (rolagem; `cat` de arquivo com mais de 500 linhas mostra as primeiras 200 e a dica
   `use grep ou less`). Opcional: comando `head -n N` e `tail -n N`.
4. Testes: `cesar` (ida/volta, pontuação, negativo), linha 2017 decifra para a frase esperada,
   log tem 2.400 linhas e o deploy às 02:14:00, inventário contém o servidor legado e só aparece
   nas estações certas.

## Arquivos que podem mudar
`server/data/vfs.cjs`, `engine/os/apps/cesar.js` (novo), `engine/os/terminal-core.js`,
`ui/zeroos-apps.css`, `index.html`, testes, `AGENTS.md`.

## Critérios de aceite
- Todos os `verify*.cjs` passam.
- Terminal: `sed -n '2017p' /var/log/nexus.log` mostra a linha cifrada (correção pós-execução: a versão anterior desta tarefa pedia `grep -n 2017`, errado; e evite linhas com "2017" se
  houver — evite que haja muitas); Roda de César com +3 → −3 decifra; `cat
  /srv/infra/inventario.csv` no Servidor de Infra mostra o `srv-legado-07`.

## Prompt para o Codex
```
Leia AGENTS.md, codex/FASE.md (seção 3) e codex/tarefas/13-cifra-log.md. Execute somente a
tarefa 13. Não faça git commit. Ao final, liste arquivos alterados, saída dos verify*.cjs e o
roteiro de teste manual.
```
