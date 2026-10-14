# CyberScript — Protocolo Zero

Jogo de investigação tecnológica em HTML, CSS e JavaScript puro, sem backend ou dependências de execução.

## O caso

Às 02:14, uma atualização do NEXUS interrompeu as operações. Explore cinco setores, converse com a equipe e analise código, testes e telemetria para descobrir a causa do incidente. Os cenários e o tema de investigação do projeto original foram preservados.

## Jogar

Na pasta do projeto, execute `python -m http.server 8000` e abra http://localhost:8000. Também é possível abrir `index.html` diretamente em um navegador moderno.

- WASD ou setas: movimentar.
- Shift: correr.
- E: interagir e avançar diálogos.
- J: abrir ou fechar o dossiê.
- Menu no canto superior direito: mostrar ou esconder Dossiê e Configurações.
- Botão abaixo do mapa: mostrar ou esconder o mapa.
- M ou clique na planta: ampliar/reduzir; M também reabre o mapa escondido.
- I: abrir o bolso. O moletom mostra o celular após coletá-lo no Café.
- Esc: pausar, fechar o dossiê/desafio, cancelar diálogo sem coletar a pista ou sair da decisão final.
- Mouse ou Tab + Enter: escolher respostas e operar os painéis.

A experiência foi desenhada para computador com teclado. O progresso dura a sessão atual; recarregar inicia um novo caso.

## Fluxo da investigação

`QA / INFRA — DESENVOLVIMENTO — CAFÉ — REUNIÃO`

O jogador começa em Desenvolvimento. Há cinco terminais com desafios de interpretação e seis depoimentos coletáveis. Respostas incorretas oferecem dicas e permitem tentar novamente. O dossiê guarda o conteúdo recuperado e indica em qual setor procurar as evidências restantes.

O terminal da Reunião exige os cinco registros técnicos antes de aceitar uma hipótese. Uma hipótese incorreta permite continuar investigando. Ao resolver o caso, o relatório mostra evidências, tempo em campo e classificação. S exige todas as evidências e nenhum erro; A permite até dois erros somando revisões nos desafios e hipóteses incorretas, e B corresponde às demais investigações. O tempo é informativo, sem limite de derrota.

Marcadores no cenário: `?` depoimento, `>_` terminal, `↗` porta, `✓` evidência recuperada. A sala inteira permanece visível; as áreas de colisão continuam independentes dos sprites.

## Organização

- `data/maps.js`: salas, conexões, spawns e obstáculos.
- `data/npcs.js` e `data/objects.js`: pontos de interação.
- `data/dialogs.js`, `data/clues.js`, `data/missions.js`: narrativa e conclusão.
- `engine/case.js`: desafios, dossiê, pausa, marcadores e classificação.
- `engine/game.js`: movimento, renderização e fluxo das salas.
- `style.css`: interface tecnológica responsiva.

Os identificadores internos antigos foram preservados para manter as referências entre dados. Os backgrounds originais são de 1672 × 941 px. NPCs reutilizam os sprites direcionais existentes, acompanhados de marcadores de interação.

## Verificação

Com Node.js instalado, execute `node verify.cjs`. A verificação percorre as áreas acessíveis de cada sala para conferir os 20 pontos de interação e valida spawns, deduplicação de pistas, os cinco desafios, respostas erradas/certas, bloqueio da conclusão e geração do relatório. A parte de progressão usa um DOM simulado; não substitui testes visuais no navegador.


## Direção visual

A renderização utiliza suavização de imagem e resolução proporcional à densidade da tela (até 2×), preservando as coordenadas de colisão. Cada cenário recebe um tratamento visual em cache: menor saturação e contraste, redução suave de ruído fino e luz ambiente difusa. Os arquivos originais permanecem disponíveis. Personagens usam cores suavizadas, sombra de contato e um indicador discreto nos pés do jogador. Marcadores e painéis adotam tons foscos, bordas leves e tipografia sem serifa.

## Colisões dos móveis

As bancadas e mesas em U usam peças convexas (`points`) em vez de um único retângulo que bloqueava também seus vãos. Sofás e mesas do Café têm áreas separadas. A hitbox continua nos pés do jogador. O movimento é subdividido e ajustado até a borda do obstáculo, evitando a folga ao correr e a passagem através de peças finas. `verify.cjs` inclui regressões para espaços livres, móveis sólidos, deslizamento e colisão em corrida.

## Transição entre salas

Portas usam uma transição de aproximadamente 0,8 segundo, com escurecimento suave, identificação do destino e revelação gradual. A troca de mapa ocorre com a tela coberta e aguarda a imagem de destino; movimento e interações ficam suspensos durante a passagem. A preferência do sistema por movimento reduzido encurta o efeito. Falhas ou demora no carregamento não deixam a transição bloqueada indefinidamente.


## Gerência e autorização

Consulte LEIA-ME-GERENCIA.txt para o mapa e as portas atualizados.
No modo de testes, conversar com Dante entrega o Passe Ômega imediatamente.
A Sala Secreta exige esse passe. O minimapa usa uma grade 2 × 3 sem corredores.
