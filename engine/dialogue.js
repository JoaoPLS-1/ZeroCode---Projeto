// engine/dialogue.js
// Modal de diálogo que ocupa praticamente toda a área do jogo,
// mantendo o cenário congelado atrás. Usado tanto para NPCs quanto
// para os textos de investigação dos computadores.

class DialogueSystem {
  constructor(rootEl) {
    this.root = rootEl;
    this.originalMarkup = rootEl.innerHTML;
    this.originalRole = rootEl.getAttribute?.('role') ?? null;
    this.originalModal = rootEl.getAttribute?.('aria-modal') ?? null;
    this.supportsPortraits = Boolean(document.head && rootEl.getAttribute);
    if (this.supportsPortraits) {
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = 'ui/dialogue.css';
    document.head.appendChild(css);
    }
    this.nameEl = rootEl.querySelector('.dialogue-name');
    this.textEl = rootEl.querySelector('.dialogue-text');
    this.continueEl = rootEl.querySelector('.dialogue-continue');
    this.npcSpriteEl = rootEl.querySelector('.dialogue-sprite.npc');
    this.playerSpriteEl = rootEl.querySelector('.dialogue-sprite.player');
    this.speakerBadgeEl = rootEl.querySelector('.dialogue-speaker-badge');

    this.lines = [];
    this.index = 0;
    this.active = false;
    this.kind = 'dialogue';
    this.onComplete = null;

    this.continueEl.addEventListener('click', () => this.advance());
  }

  isActive() {
    return this.active;
  }

  open(dialogDef, onComplete) {
    this.previousFocus = document.activeElement;
    this._setPresentation((dialogDef.kind || 'dialogue') !== 'investigation');
    this.lines = dialogDef.lines || [];
    this.npcName = dialogDef.npcName || 'NPC';
    this.kind = dialogDef.kind || 'dialogue';
    this.unskippable = Boolean(dialogDef.unskippable);
    this.index = 0;
    this.active = true;
    this.onComplete = onComplete || null;
    this.root.classList.toggle('is-investigation', this.kind === 'investigation');
    this.root.classList.remove('hidden');
    this._renderLine();
    if (this.active) this.continueEl.focus();
  }

  _renderLine() {
    const line = this.lines[this.index];
    if (!line) {
      this.close();
      return;
    }

    const isInvestigation = this.kind === 'investigation';
    const isPlayer = !isInvestigation && line.speaker === 'player';
    const isThought = !isInvestigation && line.speaker === 'thought';
    const isKael = isPlayer || isThought;
    this.root.classList.toggle('is-thought', isThought);
    this.nameEl.textContent = isInvestigation
      ? (line.speaker === 'thought' ? 'KAEL (pensa)' : this.npcName)
      : isThought ? 'Kael' : isPlayer
        ? 'Você'
        : this.npcName;
    this.textEl.textContent = line.text;
    if (this.supportsPortraits && this.root.classList.contains('cyber-dialogue')) this._renderPortraits(isKael);

    this.speakerBadgeEl.classList.toggle('is-player', isPlayer);
    this.speakerBadgeEl.classList.toggle('is-npc', !isKael);
    this.playerSpriteEl.classList.toggle('active', isKael);
    this.npcSpriteEl.classList.toggle('active', !isKael);

    const isLast = this.index === this.lines.length - 1;
    if (isInvestigation) {
      this.continueEl.textContent = isLast ? 'FECHAR (E)' : 'PRÓXIMO (E)';
    } else {
      this.continueEl.textContent = isLast ? 'E · ENCERRAR' : 'E · CONTINUAR';
    }
  }

  _setPresentation(cinematic) {
    if (!this.supportsPortraits) return;
    if (cinematic === this.root.classList.contains('cyber-dialogue')) return;
    this.root.classList.toggle('cyber-dialogue', cinematic);
    if (cinematic) {
      this.root.setAttribute('role', 'dialog');
      this.root.setAttribute('aria-modal', 'true');
      this.root.innerHTML = `
        <div class="dialogue-sprite player"><img alt="Kael"><span class="portrait-caption">KAEL / INVESTIGADOR</span></div>
        <div class="dialogue-sprite npc"><img alt="NPC"><span class="portrait-caption"></span></div>
        <div class="dialogue-frame"><div class="dialogue-panel">
          <header><span class="dialogue-speaker-badge" aria-hidden="true">××</span><div><h2 class="dialogue-name"></h2><span class="dialogue-role"></span></div><span class="dialogue-counter"></span></header>
          <p class="dialogue-text" aria-live="polite"></p><button class="dialogue-continue"></button>
        </div></div>`;
    } else {
      this.root.innerHTML = this.originalMarkup;
      for (const [key,value] of [['role',this.originalRole],['aria-modal',this.originalModal]]) {
        if (value === null) this.root.removeAttribute(key); else this.root.setAttribute(key,value);
      }
    }
    this.nameEl = this.root.querySelector('.dialogue-name');
    this.textEl = this.root.querySelector('.dialogue-text');
    this.continueEl = this.root.querySelector('.dialogue-continue');
    this.npcSpriteEl = this.root.querySelector('.dialogue-sprite.npc');
    this.playerSpriteEl = this.root.querySelector('.dialogue-sprite.player');
    this.speakerBadgeEl = this.root.querySelector('.dialogue-speaker-badge');
    this.continueEl.addEventListener('click', () => this.advance());
  }

  _renderPortraits(isPlayer) {
    const player = this.playerSpriteEl.querySelector('img');
    player.src = 'assets/portraits/kael-' + (isPlayer ? 'open' : 'closed') + '.png';
    // Retrato de Edu e apresentação das falas conforme a versão 2.2 aprovada.
    const portraitKey = {'Dante Kernel':'dante','Edu':'edu','Rick':'rick','Luna':'luna','Mateus':'mateus','Zeca':'kael-npc','Steve':'steve','Mark':'mark','Lívia':'livia','D.A.N.I.E.L.':'daniel-hoodie'}[this.npcName.split('·')[0].trim()];
    const hasPortrait = Boolean(portraitKey);
    this.npcSpriteEl.classList.toggle('no-portrait', !hasPortrait);
    const npc = this.npcSpriteEl.querySelector('img');
    if (hasPortrait) npc.src = (portraitKey === 'daniel-hoodie' ? 'assets/nexus/' : 'assets/portraits/') + portraitKey + '-' + (isPlayer ? 'closed' : 'open') + '.png';
    else npc.removeAttribute('src');
    npc.alt = this.npcName;
    this.npcSpriteEl.querySelector('.portrait-caption').textContent = this.npcName;
    const parts = (isPlayer ? 'Kael · Investigador' : this.npcName).split('·');
    this.nameEl.textContent = parts[0].trim();
    this.root.querySelector('.dialogue-role').textContent = this.lines[this.index].speaker === 'thought' ? 'PENSAMENTO' : parts.slice(1).join('·').trim() || 'DEPOIMENTO';
    this.root.querySelector('.dialogue-counter').textContent = `${String(this.index + 1).padStart(2,'0')} / ${String(this.lines.length).padStart(2,'0')}`;
    this.textEl.scrollTop = 0;
  }

  advance() {
    if (!this.active) return;
    this.index += 1;
    if (this.index >= this.lines.length) {
      this.close();
      return;
    }
    this._renderLine();
  }

  close(completed = true) {
    if (!this.active) return;
    if (!completed && this.unskippable) return;
    this.active = false;
    this.root.classList.add('hidden');
    const cb = this.onComplete;
    this.onComplete = null;
    this.previousFocus?.focus();
    if (completed && cb) cb();
  }

  handleInteractKey() {
    if (!this.active) return false;
    this.advance();
    return true;
  }
}

if (typeof module !== 'undefined') module.exports = DialogueSystem;
