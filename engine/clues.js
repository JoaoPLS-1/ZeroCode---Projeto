// engine/clues.js
// Acompanha o progresso da investigação: pistas encontradas, relevantes
// e se a pista falsa já foi identificada/coletada.

class ClueSystem {
  constructor(clueDefinitions) {
    this.definitions = clueDefinitions; // data/clues.js
    this.found = new Set();
    this.totalClues = Object.keys(clueDefinitions).length;
    this.relevantTarget = Object.values(clueDefinitions).filter(
      (clue) => clue.relevant
    ).length;
    this.falseTarget = Object.values(clueDefinitions).filter(
      (clue) => clue.isFalse
    ).length;
    this.onClueFound = null; // callback(clueDef)
  }

  addClue(clueId) {
    if (!clueId || this.found.has(clueId) || !this.definitions[clueId]) {
      return false;
    }
    this.found.add(clueId);
    const def = this.definitions[clueId];
    if (this.onClueFound) this.onClueFound(def);
    return true;
  }

  hasClue(clueId) {
    return this.found.has(clueId);
  }

  getFoundCount() {
    return this.found.size;
  }

  getRelevantCount() {
    let count = 0;
    for (const id of this.found) {
      if (this.definitions[id] && this.definitions[id].relevant) count++;
    }
    return count;
  }

  hasFoundFalseClue() {
    for (const id of this.found) {
      if (this.definitions[id] && this.definitions[id].isFalse) return true;
    }
    return false;
  }

  getState() {
    return {
      found: this.getFoundCount(),
      total: this.totalClues,
      relevant: this.getRelevantCount(),
      relevantTarget: this.relevantTarget,
      falseFound: this.hasFoundFalseClue(),
      hasFalseClues: this.falseTarget > 0,
    };
  }
}

if (typeof module !== 'undefined') module.exports = ClueSystem;
