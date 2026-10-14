# Tarefa 08 — App Wireshark (50 pacotes)

## Por quê
É o final fixo do CTF: com a senha lembrada (5 lembranças), Kael abre a captura de rede no
Servidor de Infra, filtra o ruído e encontra o batimento de ÔMEGA vindo de um servidor
"desativado" — IP e porta que abrem a Sala Secreta (`codex/FASE.md` §4).

## Dados (servidor — `server/data/capture.cjs`)
50 pacotes **determinísticos** (mesma captura em toda partida), ordenados por tempo, cobrindo
~4 minutos a partir de 02:14:00. Cada pacote:
`{ n, tempo, origem, destino, protocolo, portaOrigem, portaDestino, tamanho, info, camadas: [...] }`
(`camadas` = texto da árvore de detalhes: Frame, Ethernet, IPv4, TCP/UDP, HTTP/DNS/dados).
Composição (ver tabela em `FASE.md` §4):
- ~25 `HTTP` NEXUS `10.0.2.15` → API de pagamento `10.0.3.20:443`: `POST /v1/cobrancas` →
  `503 Service Unavailable` em sequência (tempestade de retries);
- ~8 cobranças duplicadas com o mesmo `request_id` (eco do caso Pagamento);
- ~8 `DNS`/`HTTP` normais de estações da equipe (`10.0.5.x`);
- ~5 acessos aos apps vibecodados (`/api/crachas/…`, `/mural`, `/upload`);
- **4** pacotes `TCP` de `srv-legado-07` **`10.19.56.7`** → `10.0.9.66` porta **`2017`**, a cada
  60 s, 64 bytes, payload `RPHJD:EDWLPHQWR` (César +3 de `OMEGA:BATIMENTO`).
O IP/porta são segredo: só saem do servidor depois de `app:wireshark`.

## O que fazer
1. `GET /api/jogo/captura?estacao=` → 403 se faltar `app:wireshark` ou se a estação não for
   `computer_infra_upper`; senão devolve os 50 pacotes.
2. App `wireshark` (registro de apps da tarefa 05): `availableAt: ['computer_infra_upper']`,
   `requires: 'app:wireshark'`. Antes de liberado, o ícone aparece no Servidor de Infra mas abre
   uma janela "Autenticação necessária — senha do administrador (Kael)" explicando que Kael não se
   lembra da senha (sem campo para chutar).
3. Interface no estilo Wireshark, sóbria (regras da 02a):
   - barra de filtro com validação (verde válido / vermelho inválido) e botão Aplicar;
   - lista de pacotes em colunas **No. · Time · Source · Destination · Protocol · Length · Info**,
     cores leves por protocolo (como o Wireshark: HTTP verde-claro, DNS azul-claro, TCP cinza);
   - painel de detalhes (árvore expansível das camadas) e painel de bytes (hex + ASCII do payload);
   - barra de status: "Pacotes: 50 · Exibidos: N".
4. **Filtro** (`engine/os/apps/wireshark-filter.js`, sem DOM, testável): suporta `ip.addr`,
   `ip.src`, `ip.dst`, `tcp.port`, `udp.port`, `tcp`, `udp`, `http`, `dns`, `frame contains "x"`,
   operadores `==` e `!=`, `&&`/`and`, `||`/`or`, `!`/`not`, parênteses.
5. Ao abrir o detalhe de um dos 4 pacotes suspeitos pela primeira vez, mostrar o pensamento do
   Kael de `DIALOGOS.md` §5 ("Um servidor desativado em 2023…") — o servidor registra
   `evento:batimento-visto` via evento permitido.
6. Testes: `verify-wireshark.cjs` (filtros: cada campo, combinações, parênteses, `!`, inválidos;
   `ip.addr == 10.19.56.7` → 4 pacotes; `tcp.port == 2017` → 4; `http` → só HTTP) e, em
   `verify-server.cjs`, que `/captura` dá 403 sem `app:wireshark` e que `10.19.56.7` não aparece
   em nenhuma resposta antes disso.

## Arquivos que podem mudar
`server/*`, `engine/os/apps/wireshark.js`, `engine/os/apps/wireshark-filter.js` (novos),
`ui/zeroos-apps.css`, `index.html`, `verify-wireshark.cjs` (novo), `verify-server.cjs`, `AGENTS.md`.

## Critérios de aceite
- Todos os `verify*.cjs` passam.
- `ZC_DEV=1`: capturar 5 flags → Servidor de Infra → Wireshark abre → filtro
  `ip.addr == 10.19.56.7` mostra 4 pacotes → detalhes mostram porta 2017 e payload.
- Sem as 5 lembranças, o Wireshark mostra a tela de autenticação.

## Prompt para o Codex
```
Leia AGENTS.md, codex/FASE.md (seção 4), codex/DIALOGOS.md (seção 5) e
codex/tarefas/08-wireshark.md. Execute somente a tarefa 08. Não faça git commit. Ao final,
liste arquivos alterados, saída dos verify*.cjs e o roteiro de teste manual.
```
