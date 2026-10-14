// engine/input.js
// Gerencia o estado do teclado (WASD/setas + E para interação).

class InputManager {
  constructor() {
    this.keys = {};
    this._justPressed = {};

    window.addEventListener('keydown', (e) => {
      // Toggle fullscreen via F11
      if (e.code === 'F11') {
        e.preventDefault();
        const container = document.getElementById('game-container');
        if (!document.fullscreenElement) container.requestFullscreen().catch(()=>{});
        else document.exitFullscreen().catch(()=>{});
        return;
      }
      // Editing code must not activate movement, journal, map or interaction.
      if(e.target?.matches?.('textarea,input,[contenteditable="true"]') && e.code!=='Escape')return;
      // Mantém Tab dentro do painel ativo, sem alcançar botões por trás dele.
      if (e.key === 'Tab') {
        const modal = ['phone-overlay', 'result-screen', 'complete-screen', 'case-panel', 'dialogue-modal',
          'decision-modal', 'briefing-screen', 'start-screen']
          .map(id => document.getElementById(id))
          .find(el => el && !el.classList.contains('hidden'));
        const buttons = modal ? Array.from(modal.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea:not(:disabled)'))
          .filter(button => button.getClientRects().length > 0) : [];
        if (buttons.length) {
          const index = buttons.indexOf(document.activeElement);
          if (index < 0 || (!e.shiftKey && index === buttons.length - 1) || (e.shiftKey && index === 0)) {
            e.preventDefault();
            (e.shiftKey ? buttons[buttons.length - 1] : buttons[0]).focus();
          }
        }
      }
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
      if (!this.keys[e.code]) this._justPressed[e.code] = true;
      this.keys[e.code] = true;
    });
    window.addEventListener('blur', () => { this.keys = {}; this._justPressed = {}; });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  isDown(code) {
    return !!this.keys[code];
  }

  // Retorna true apenas no primeiro frame em que a tecla foi pressionada.
  wasJustPressed(code) {
    const val = !!this._justPressed[code];
    return val;
  }

  // Deve ser chamado ao fim de cada frame do loop principal.
  update() {
    this._justPressed = {};
  }

  getMovementVector() {
    let x = 0;
    let y = 0;
    if (this.isDown('KeyA') || this.isDown('ArrowLeft')) x -= 1;
    if (this.isDown('KeyD') || this.isDown('ArrowRight')) x += 1;
    if (this.isDown('KeyW') || this.isDown('ArrowUp')) y -= 1;
    if (this.isDown('KeyS') || this.isDown('ArrowDown')) y += 1;
    return { x, y };
  }

  isInteractPressed() {
    return this.wasJustPressed('KeyE');
  }
}

if (typeof module !== 'undefined') module.exports = InputManager;
