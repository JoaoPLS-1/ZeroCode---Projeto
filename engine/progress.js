// Espelho das respostas do servidor; não concede conquistas locais.
class Progress {
  constructor() { this._keys = new Set(); this._listeners = new Set(); }
  has(key) { return this._keys.has(key); }
  all() { return [...this._keys]; }
  count(prefix) { return this.all().filter(key => key.startsWith(prefix)).length; }
  requires(cond) {
    if (cond == null) return true;
    if (typeof cond === 'string') return this.has(cond);
    if (typeof cond !== 'object') return false;
    if (Array.isArray(cond.all)) return cond.all.every(c => this.requires(c));
    if (Array.isArray(cond.any)) return cond.any.some(c => this.requires(c));
    if (cond.count && typeof cond.count.prefix === 'string' && Number.isInteger(cond.count.min) && cond.count.min >= 0)
      return this.count(cond.count.prefix) >= cond.count.min;
    return false;
  }
  sincronizar(estado) {
    if (!Array.isArray(estado?.progresso)) return;
    const keys = new Set(estado.progresso);
    const added = [...keys].filter(key => !this._keys.has(key));
    this._keys = keys;
    for (const key of added) for (const listener of this._listeners) listener(key);
  }
  on(listener) { this._listeners.add(listener); return () => this._listeners.delete(listener); }
}

if (typeof module !== 'undefined') module.exports = Progress;
