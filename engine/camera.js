// engine/camera.js
// Câmera que segue o player e é limitada aos bounds do mapa.
// Todas as posições de mundo (containers, player) usam o sistema de
// coordenadas do mapa (ex.: 1672x941), nunca a viewport diretamente.

class Camera {
  constructor(viewportWidth, viewportHeight, mapWidth, mapHeight) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
    this.x = 0;
    this.y = 0;
  }

  follow(targetX, targetY) {
    let x = targetX - this.viewportWidth / 2;
    let y = targetY - this.viewportHeight / 2;

    const maxX = Math.max(0, this.mapWidth - this.viewportWidth);
    const maxY = Math.max(0, this.mapHeight - this.viewportHeight);

    x = Math.max(0, Math.min(x, maxX));
    y = Math.max(0, Math.min(y, maxY));

    this.x = x;
    this.y = y;
  }

  worldToScreen(x, y) {
    return { x: x - this.x, y: y - this.y };
  }

  resize(viewportWidth, viewportHeight) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
  }

  setMapSize(mapWidth, mapHeight) {
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
  }
}

if (typeof module !== 'undefined') module.exports = Camera;
