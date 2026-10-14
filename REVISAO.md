# Revisão de qualidade

## Problemas corrigidos

- **Classificação:** hipóteses finais erradas não alteravam a nota. Agora são contadas separadamente e entram no cálculo da classificação.
- **Teclado nos painéis:** diálogos e decisão final não recebiam foco ao abrir; Tab podia alcançar controles atrás do modal. O foco agora entra no painel, fica contido nele e retorna ao fechar.
- **Cancelamento de diálogo:** Esc não fechava conversas. Agora cancela a leitura sem conceder a pista; a coleta ocorre ao concluir normalmente.
- **Avisos de pistas:** um temporizador de ocultação antigo podia esconder um aviso novo. A nova coleta cancela ambos os temporizadores anteriores.
- **Decisões duplicadas:** o apurador aceitava chamadas mesmo com o painel fechado. Agora valida se a decisão está ativa, se a opção existe e consome o callback uma única vez.
- **Prompts:** a indicação de interação podia permanecer atrás de diálogos e resultados. Agora é ocultada nesses estados.
- **Câmera:** as dimensões lógicas só eram atualizadas quando o tamanho físico do canvas mudava. Agora são sincronizadas em toda atualização de tamanho.
- **Animações do protagonista:**
  - O estado parado (idle) em direções cardinais sofria distorção brusca e salto vertical (desenhado em 52x78 unanchored em vez de 84px proporcional ancorado nos pés).
  - A animação frontal de idle ficava congelada por 19,2s em sprite estático e só rodava 2,8s a cada 22s. Agora possui ciclo contínuo e orgânico de respiração com transição para gestos/olhar.
  - Nas diagonais, ao parar, o personagem ficava congelado no frame de corrida de um atlas legado. Agora mantém pose natural em pé com respiração sutil.
  - Alinhamento consistente dos pés em todas as 8 direções (caminhada e parado), eliminando flutuação, encolhimento e deslizamentos.

## Melhorias implementadas

- Pausa automática ao perder o foco da janela ou ocultar a aba, durante exploração livre.
- Atualização do texto de objetivo somente quando ele muda, reduzindo alterações desnecessárias no DOM.
- Remoção de uma busca redundante de interações em cada frame.
- Se o tratamento visual de um cenário falhar, a renderização pode utilizar a imagem original.

## Verificação realizada

`node verify.cjs` passou: 20 interações alcançáveis, spawns válidos, colisões e corrida, coleta e desafios, transições, cancelamento sem coleta, decisão única, nota após hipótese errada e concorrência dos avisos de pistas. Verificação de sintaxe dos arquivos JavaScript também passou.

No navegador: abertura do jogo, painel de pausa e ciclo de Tab sem sair do painel. Os testes de progressão usam DOM simulado; esta revisão não equivale a uma partida completa manual nem a testes em todos os navegadores e dispositivos.

## Próximas melhorias sugeridas, ainda não implementadas

1. **Salvamento automático e Continuar:** preservar evidências, posição, salas visitadas e pontuação ao recarregar. Incluir versão do save e recuperação de dados inválidos.
2. **Dossiê mais útil:** filtrar por setor e por pista técnica/depoimento; indicar o terminal específico que falta investigar.
3. **Celular e telas pequenas:** comandos de toque e layout próprio em orientação vertical. Atualmente a experiência depende de teclado.
4. **Personagens distintos:** retratos e sprites próprios para facilitar reconhecer cada integrante da equipe.
5. **Organização da engine:** integrar a camada de investigação explicitamente ao Game, substituindo a alteração de métodos no prototype. Facilita futuras mudanças e testes.
