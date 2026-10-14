// engine/collision.js
// Hitbox dos pés contra retângulos e peças convexas dos móveis.
// As coordenadas representam o cenário, independentemente da resolução.

class CollisionSystem {
  constructor(map) {
    this.setMap(map);
  }

  setMap(map) {
    this.bounds = map.bounds;
    this.obstacles = map.obstacles || [];
  }

  static intersects(a, b) {
    if (b.points) return CollisionSystem.intersectsPolygon(a, b.points);
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  // SAT entre a hitbox dos pés e um polígono convexo. Mesas côncavas
  // são descritas por várias peças, preservando seus espaços internos.
  static intersectsPolygon(rect, points) {
    const corners = [
      [rect.x, rect.y], [rect.x + rect.width, rect.y],
      [rect.x + rect.width, rect.y + rect.height], [rect.x, rect.y + rect.height],
    ];
    const axes = [[1, 0], [0, 1]];
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      axes.push([a[1] - b[1], b[0] - a[0]]);
    }
    for (const [ax, ay] of axes) {
      const p = points.map(([x, y]) => x * ax + y * ay);
      const r = corners.map(([x, y]) => x * ax + y * ay);
      if (Math.max(...r) <= Math.min(...p) || Math.max(...p) <= Math.min(...r)) return false;
    }
    return true;
  }

  // Verifica se um retângulo (x,y,width,height) é uma posição válida.
  isValidPosition(rect) {
    const b = this.bounds;
    if (
      rect.x < b.x ||
      rect.y < b.y ||
      rect.x + rect.width > b.x + b.width ||
      rect.y + rect.height > b.y + b.height
    ) {
      return false;
    }
    for (const obs of this.obstacles) {
      if (CollisionSystem.intersects(rect, obs)) return false;
    }
    return true;
  }

  // Resolve movimento eixo a eixo, para permitir "deslizar" nas paredes.
  resolveMove(currentRect, dx, dy) {
    let rect = { ...currentRect };

    // Passos menores que a hitbox evitam atravessar peças finas em corrida.
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) /
      Math.max(1, Math.min(rect.width, rect.height) / 2)));
    for (let step = 0; step < steps; step++) {
      for (const [axis, distance] of [['x', dx / steps], ['y', dy / steps]]) {
        if (!distance) continue;
        const target = { ...rect, [axis]: rect[axis] + distance };
        if (this.isValidPosition(target)) {
          rect = target;
        } else {
          // Encosta na borda em vez de cancelar todo o deslocamento do frame.
          let low = 0, high = 1;
          for (let i = 0; i < 14; i++) {
            const middle = (low + high) / 2;
            if (this.isValidPosition({ ...rect, [axis]: rect[axis] + distance * middle })) low = middle;
            else high = middle;
          }
          rect[axis] += distance * low;
        }
      }
    }

    return rect;
  }
}

if (typeof module !== 'undefined') module.exports = CollisionSystem;
