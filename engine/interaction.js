// engine/interaction.js
// Sistema de detecção de proximidade para containers invisíveis
// (NPCs e computadores). Usa a distância do player até o ponto mais
// próximo do retângulo do container, comparado ao interactionRadius.

class InteractionSystem {
  constructor(containers) {
    this.containers = containers; // lista combinada de npcs + objects
  }

  setContainers(containers) {
    this.containers = containers || [];
  }

  static closestPointDistance(px, py, rect) {
    const cx = Math.max(rect.x, Math.min(px, rect.x + rect.width));
    const cy = Math.max(rect.y, Math.min(py, rect.y + rect.height));
    return Math.hypot(px - cx, py - cy);
  }

  // Retorna o container mais próximo dentro do raio de interação, ou null.
  getNearestInRange(playerCenterX, playerCenterY) {
    let nearest = null;
    let nearestDist = Infinity;

    for (const container of this.containers) {
      const dist = InteractionSystem.closestPointDistance(
        playerCenterX,
        playerCenterY,
        container
      );
      if (dist <= container.interactionRadius && dist < nearestDist) {
        nearest = container;
        nearestDist = dist;
      }
    }

    return nearest;
  }

  // Retorna todos os containers em alcance (para eventualmente destacar
  // mais de um), ordenados por distância.
  getAllInRange(playerCenterX, playerCenterY) {
    return this.containers
      .map((c) => ({
        container: c,
        dist: InteractionSystem.closestPointDistance(
          playerCenterX,
          playerCenterY,
          c
        ),
      }))
      .filter((entry) => entry.dist <= entry.container.interactionRadius)
      .sort((a, b) => a.dist - b.dist)
      .map((entry) => entry.container);
  }
}

if (typeof module !== 'undefined') module.exports = InteractionSystem;
