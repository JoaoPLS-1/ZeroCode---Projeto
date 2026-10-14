// Fluxo explícito do encontro e da autorização para a decisão atual.
class OmegaEncounter {
  constructor(game) { this.g = game; this.busy = false; }
  async request(run) {
    const g = this.g;
    if (this.busy || g.state !== 'playing' || g.dialogue.isActive() || g.mission.isActive()) return;
    this.busy = true;
    g.state = 'omega';
    g.hud.showPrompt(null);
    g.input.keys = {}; g.input._justPressed = {};
    try { await run(); }
    catch (error) { g._showClueAlert({title:'Não foi possível concluir a solicitação', body:[error.message]}); }
    finally { this.busy = false; if(g.state === 'omega')g.state = 'playing'; g._lockInteractions(); }
  }
  enter() {
    if (this.g.map.id !== 'room_secret' || !this.g.progress.has('acesso:sala-secreta')) return;
    return this.request(async () => {
      const result = await api.post('/api/jogo/eventos', {chave:'evento:omega-encontrada', sala:'room_secret'});
      if (result.nova) this.g.dialogue.open(result.cena, () => this.g._lockInteractions());
    });
  }
  console() {
    if (!this.g.progress.has('evento:omega-encontrada')) return this.enter();
    return this.request(async () => {
      const result = await api.get('/api/jogo/omega');
      this.g.dialogue.open(result.dialogo, () => this.g._lockInteractions());
      const button = this.g.dialogue.continueEl;
      button.textContent = result.chamar;
      // E segue a mesma ação oferecida pelo botão.
      this.g.dialogue.onComplete = () => this.decide();
    });
  }
  decide() {
    return this.request(async () => {
      const result = await api.get('/api/jogo/decisao/acesso');
      if (!result.liberada) this.g.dialogue.open(result.dialogo, () => this.g._lockInteractions());
      else if (result.resultado) this.g._showResult(true, result.resultado);
      else this.g.mission.open((correct, def) => this.g._showResult(correct, def));
    });
  }
}
if (typeof module !== 'undefined') module.exports = OmegaEncounter;
