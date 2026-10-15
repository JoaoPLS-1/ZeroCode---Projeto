// engine/game.js
// Orquestra o protótipo, incluindo troca de salas e containers locais.

class Game {
  constructor(opts) {
    this.canvas = opts.canvas;
    this.rooms = opts.rooms;
    this.allNpcs = opts.npcs;
    this.allObjects = opts.objects;
    this.dialogsData = opts.dialogsData;
    this.cluesData = opts.cluesData;
    this.missionData = opts.missionData;
    this.dom = opts.dom;

    this.roomManager = new RoomManager(this.rooms, opts.initialRoomId);
    this.map = this.roomManager.currentRoom;
    const initialSpawn = this.map.spawns.initial || Object.values(this.map.spawns)[0];

    this.input = new InputManager();
    this.collision = new CollisionSystem(this.map);
    this.player = new Player(initialSpawn.x, initialSpawn.y);
    this.camera = new Camera(
      this.canvas.width,
      this.canvas.height,
      this.map.width,
      this.map.height
    );
    this.renderer = new Renderer(this.canvas, this.map);
    this.renderer.preloadNpcs(this.allNpcs);
    this.interaction = new InteractionSystem([]);
    this.clues = new ClueSystem(this.cluesData);
    this.progress = new Progress();
    api.onEstado(estado => {
      this.progress.sincronizar(estado);
      if (estado.modo) {
        this.modo = estado.modo;
        this.salasPermitidas = estado.salas;
        this.hud.setLembrancas(estado.contagem.lembrancas, estado.metaLembrancas);
        this.minimap.setSalas(estado.salas);
      }
    });
    this.dialogue = new DialogueSystem(this.dom.dialogueRoot);
    this.mission = new MissionSystem(this.dom.decisionRoot, this.missionData);
    this.hud = new HUD(this.dom.hudRoot, this.dom.promptEl);
    this.minimap = new Minimap(this.dom.minimapRoot, this.rooms);
    this.inventory = new Inventory(document.getElementById('inventory'));
    this._itemImages = {};
    this.phone = new GamePhone(this);

    this.state = 'start';
    this._lastTime = null;
    this._interactionLockedUntil = 0;
    this._interactionLockMs = 350;
    this.activeNpcs = [];
    this.activeObjects = [];
    this.activeContainers = [];

    this.clues.onClueFound = (clueDef) => this._showClueAlert(clueDef);

    this._bindScreenButtons();
    this._syncRoomSystems();
    this._setupResize();
    const pauseWhenUnfocused = () => {
      if (this.case?.available()) this.case.pause();
    };
    window.addEventListener('blur', pauseWhenUnfocused);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pauseWhenUnfocused();
    });
    this.hud.update(this.clues.getState());
  }

  _setupResize() {
    const resize = () => {
      // Mantém a sala inteira, mas usa pixels físicos para evitar serrilhado.
      const rect = this.canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(rect.width * ratio));
      const h = Math.max(1, Math.round(rect.height * ratio));
      if (w > 0 && h > 0 && (this.canvas.width !== w || this.canvas.height !== h)) {
        this.canvas.width = w;
        this.canvas.height = h;
      }
      this.camera.resize(this.map.width, this.map.height);
      this.camera.follow(this.player.centerX, this.player.centerY);
    };
    this._resizeCanvas = resize;
    window.addEventListener('resize', resize);
    resize();
  }

  _bindScreenButtons() {
    for (const button of this.dom.startScreen.querySelectorAll('[data-modo]')) {
      button.addEventListener('click', () => this._newSession(() => this._goToBriefing(), button, this.dom.startScreen, button.dataset.modo));
    }
    window.addEventListener('keydown', event => {
      if (this.state === 'start' && event.code === 'KeyP' && !event.repeat && !event.ctrlKey && !event.altKey && !event.metaKey) {
        event.preventDefault();
        this.dom.startScreen.querySelector('[data-modo="pitch"]').click();
      }
    });
    this.dom.briefingButton.addEventListener('click', () => this._goToPlaying());
    this.dom.resultButton.addEventListener('click', () => this._onResultButtonClick());
    const replayButton = this.dom.completeScreen.querySelector('.neon-button');
    replayButton.addEventListener('click', () => this._newSession(() => location.reload(), replayButton, this.dom.completeScreen));
  }

  async _newSession(onSuccess, button, root, modo = 'completo') {
    if (this._startingSession) return;
    this._startingSession = true;
    button.disabled = true;
    let message = root.querySelector('.session-error');
    if (!message) {
      message = document.createElement('p');
      message.className = 'session-error';
      message.setAttribute('role', 'alert');
      (root.querySelector('.overlay-box') || root).append(message);
    }
    message.textContent = '';
    try {
      await api.post('/api/jogo/nova-partida', { modo });
      this.progress.sincronizar(await api.get('/api/jogo/estado'));
      onSuccess();
    } catch (error) { message.textContent = error.message; }
    finally { button.disabled = false; this._startingSession = false; }
  }

  _goToBriefing() {
    if (this.modo === 'pitch') {
      this.pitch ??= new PitchPresentation(this);
      this.pitch.start();
      return;
    }
    this.state = 'briefing';
    this.dom.startScreen.classList.add('hidden');
    this.dom.briefingScreen.classList.remove('hidden');
  }

  _goToPlaying() {
    this.state = 'playing';
    this.dom.briefingScreen.classList.add('hidden');
    this.hud.setVisible(true);
    this.minimap.setVisible(true);
    this.inventory.setVisible(true);
    if (!this._openingShown) {
      this._openingShown = true;
      this.input.keys = {}; this.input._justPressed = {};
      this.hud.showPrompt(null);
      this.dialogue.open(this.dialogsData.dialog_opening, () => this._lockInteractions());
    }
  }

  _onResultButtonClick() {
    if (this.dom.resultButton.dataset.replay === '1') {
      this._newSession(() => location.reload(), this.dom.resultButton, this.dom.resultScreen);
      return;
    }
    const wasCorrect = this.dom.resultButton.dataset.correct === '1';
    this.dom.resultScreen.classList.remove('is-correct', 'is-incorrect');
    this.dom.resultScreen.classList.add('hidden');

    if (wasCorrect) {
      this.dom.completeScreen.classList.remove('hidden');
      this.state = 'complete';
    } else {
      this.state = 'playing';
      this._lockInteractions();
    }
  }

  _lockInteractions(duration = this._interactionLockMs) {
    this._interactionLockedUntil = performance.now() + duration;
  }

  _syncRoomSystems() {
    this.collision.setMap(this.map);
    this.renderer.setMap(this.map);
    this.camera.setMapSize(this.map.width, this.map.height);

    this.activeNpcs = this.allNpcs.filter((npc) => npc.roomId === this.map.id);
    this.activeObjects = this.allObjects.filter((object) => object.roomId === this.map.id);
    
    // Inject NPCs into collision system as obstacles
    this.collision.obstacles = [
      ...(this.map.obstacles || []),
      ...this.activeNpcs
    ];

    this.activeContainers = [
      ...this.activeNpcs,
      ...this.activeObjects,
      ...(this.map.doors || []),
    ];
    this.interaction.setContainers(this.activeContainers);
    this.minimap.update(this.map.id, this.roomManager.visited);
  }

  _changeRoom(targetRoomId, targetSpawnId) {
    if (this.state !== 'playing' || this._roomTransition) return;
    if (Array.isArray(this.salasPermitidas) && !this.salasPermitidas.includes(targetRoomId)) {
      this.dialogue.open(this.dialogsData.dialog_modo_bloqueado, () => this._lockInteractions());
      return;
    }
    if (targetRoomId === 'room_secret' && !this.progress.has('acesso:sala-secreta')) {
      this.secretDoor ??= new SecretDoor(this);
      this.secretDoor.open(targetSpawnId);
      return;
    }
    const room = this.roomManager.getRoom(targetRoomId);
    if (!room) return;

    if (!this._transitionEl) {
      this._transitionEl = document.createElement('div');
      this._transitionEl.id = 'room-transition';
      this._transitionEl.className = 'hidden';
      this._transitionEl.setAttribute('role', 'status');
      this._transitionEl.setAttribute('aria-live', 'polite');
      this._transitionEl.innerHTML = '<div class="room-transition-card"><span></span><h2></h2><i aria-hidden="true"></i></div>';
      this.canvas.parentElement.appendChild(this._transitionEl);
    }
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this._roomTransition = {
      targetRoomId, targetSpawnId, phase: 'out', elapsed: 0,
      background: this.renderer.preloadMap(room),
      fadeOut: reducedMotion ? 0.08 : 0.24,
      hold: reducedMotion ? 0.04 : 0.18,
      fadeIn: reducedMotion ? 0.12 : 0.38,
    };
    this._transitionEl.querySelector('span').textContent = `NEXUS / SETOR ${String(room.mapOrder).padStart(2, '0')}`;
    this._transitionEl.querySelector('h2').textContent = room.name;
    this._transitionEl.style.opacity = '0';
    this._transitionEl.classList.remove('hidden');
    this._nearestContainer = null;
    this.hud.showPrompt(null);
    this.state = 'transition';
  }

  _updateRoomTransition(dt) {
    const t = this._roomTransition;
    if (!t) return;
    t.elapsed += dt;
    const smooth = (value) => {
      const p = Math.min(1, Math.max(0, value));
      return p * p * (3 - 2 * p);
    };
    if (t.phase === 'out') {
      this._transitionEl.style.opacity = String(smooth(t.elapsed / t.fadeOut));
      if (t.elapsed >= t.fadeOut) { t.phase = 'hold'; t.elapsed = 0; }
    } else if (t.phase === 'hold') {
      // A imagem de destino carrega antes de revelar a sala. O limite evita
      // prender o jogador caso um asset esteja indisponível.
      const ready = t.background.loaded || t.background.failed || t.elapsed >= 4;
      if (t.elapsed >= t.hold && ready) {
        this._commitRoomChange(t.targetRoomId, t.targetSpawnId);
        t.phase = 'in'; t.elapsed = 0;
      }
    } else {
      this._transitionEl.style.opacity = String(1 - smooth(t.elapsed / t.fadeIn));
      if (t.elapsed >= t.fadeIn) {
        this._transitionEl.classList.add('hidden');
        this._transitionEl.querySelector('h2').textContent = '';
        this._roomTransition = null;
        this.state = 'playing';
        this._lockInteractions(350);
        if (t.onComplete) t.onComplete();
        else if (this.map.id === 'room_secret') this._omegaEncounter().enter();
      }
    }
  }

  _commitRoomChange(targetRoomId, targetSpawnId) {
    const room = this.roomManager.enter(targetRoomId);
    if (!room) return;

    this.map = room;
    this._syncRoomSystems();

    const spawn = typeof targetSpawnId === 'object' && targetSpawnId !== null ? targetSpawnId
      : this.roomManager.getSpawn(targetSpawnId) || Object.values(room.spawns)[0];
    if (spawn) this.player.setPosition(spawn.x, spawn.y);

    if (this._resizeCanvas) this._resizeCanvas();
    this.camera.follow(this.player.centerX, this.player.centerY);
    this._nearestContainer = null;
    this.hud.showPrompt(null);
    this._lockInteractions(500);
  }

  _showClueAlert(clueDef) {
    const el = this.dom.clueAlert;
    el.querySelector('.clue-alert-title').textContent = clueDef.title;
    const bodyEl = el.querySelector('.clue-alert-body');
    bodyEl.innerHTML = '';
    clueDef.body.forEach((line) => {
      const p = document.createElement('p');
      p.textContent = line;
      bodyEl.appendChild(p);
    });
    el.classList.remove('hidden');
    el.classList.add('visible');
    clearTimeout(this._clueAlertTimeout);
    clearTimeout(this._clueAlertHideTimeout);
    this._clueAlertTimeout = setTimeout(() => {
      el.classList.remove('visible');
      this._clueAlertHideTimeout = setTimeout(() => el.classList.add('hidden'), 300);
    }, 4200);
  }

  _openContainerContent(container, contentRef) {
    const contentDef = this.dialogsData[contentRef];
    if (!contentDef) return;
    this.hud.showPrompt(null);

    this.dialogue.open(contentDef, () => {
      if (container.type === 'npc') api.post('/api/jogo/eventos', { chave: 'talk:' + container.id })
        .catch(error => console.error('Não foi possível registrar o diálogo:', error));
      if (container.clueRef) this.clues.addClue(container.clueRef);
      this.hud.update(this.clues.getState());
      this._lockInteractions();
    });
  }

  _interactWith(container) {
    if (container.type === 'omega_console') {
      this._omegaEncounter().console();
      return;
    }
    if (container.type === 'item') {
      this.inventory.add({ id: container.itemId, name: container.name, icon: container.icon });
      this.allObjects = this.allObjects.filter((o) => o !== container);
      this._nearestContainer = null;
      this.hud.showPrompt(null);
      this._syncRoomSystems();
      if (container.itemId === 'celular') this.phone.collected();
      return;
    }

    if (container.type === 'door') {
      this._changeRoom(container.targetRoom, container.targetSpawn);
      return;
    }

    if (container.type === 'npc') {
      this._openContainerContent(container, container.dialogRef);
      return;
    }

    if (container.type === 'computer') {
      this._openContainerContent(container, container.contentRef || container.dialogRef);
      return;
    }

    if (container.type === 'computer_final') {
      this._omegaEncounter().decide();
    }
  }

  _omegaEncounter() {
    return this.omega ??= new OmegaEncounter(this);
  }

  _showResult(isCorrect, resultDef) {
    this.state = 'result';
    this.hud.showPrompt(null);
    const root = this.dom.resultScreen;
    root.classList.remove('hidden');
    root.classList.toggle('is-correct', isCorrect);
    root.classList.toggle('is-incorrect', !isCorrect);
    root.querySelector('.result-title').textContent = resultDef.title;
    const bodyEl = root.querySelector('.result-body');
    bodyEl.innerHTML = '';
    resultDef.body.forEach((line) => {
      const p = document.createElement('p');
      p.textContent = line;
      bodyEl.appendChild(p);
    });
    this.dom.resultButton.textContent = isCorrect
      ? 'CONCLUIR FASE'
      : 'VOLTAR E INVESTIGAR MAIS';
    this.dom.resultButton.dataset.correct = isCorrect ? '1' : '0';
    if (resultDef.rank) {
      this.dom.resultButton.textContent = 'JOGAR NOVAMENTE';
      this.dom.resultButton.dataset.replay = '1';
    } else delete this.dom.resultButton.dataset.replay;
    this.dom.resultButton.focus();
  }

  start() {
    this._lastTime = performance.now();
    requestAnimationFrame((time) => this._loop(time));
  }

  _loop(time) {
    const dt = Math.min((time - this._lastTime) / 1000, 0.05);
    this._lastTime = time;

    this._update(dt);
    this._render();
    this.input.update();

    requestAnimationFrame((nextTime) => this._loop(nextTime));
  }

  _update(dt) {
    if(this.state==='playing') this.npcAnimationTime=(this.npcAnimationTime||0)+dt;
    if (this.state === 'transition') {
      this._updateRoomTransition(dt);
      return;
    }
    if (this.dialogue.isActive()) {
      this.hud.showPrompt(null);
      if (this.input.isInteractPressed()) this.dialogue.handleInteractKey();
      return;
    }
    if (this.mission.isActive()) { this.hud.showPrompt(null); return; }
    if (this.state !== 'playing') return;

    const moveVec = this.input.getMovementVector();
    this.player.speed = this.input.isDown('ShiftLeft') || this.input.isDown('ShiftRight') ? 350 : 235;
    this.player.update(dt, moveVec, this.collision);
    this.camera.follow(this.player.centerX, this.player.centerY);

    const nearest = this.interaction.getNearestInRange(
      this.player.centerX,
      this.player.centerY
    );
    this._nearestContainer = nearest;
    this.hud.showPrompt(nearest);

    const interactionUnlocked = performance.now() >= this._interactionLockedUntil;
    if (nearest && interactionUnlocked && this.input.isInteractPressed()) {
      this._interactWith(nearest);
    }
  }

  _render() {
    this.renderer.clear();
    if (this.state === 'start' || this.state === 'briefing') return;

    this.renderer.drawBackground(this.camera);
    this.minimap.draw(this.player);

    for (const container of this.activeContainers) {
      this.renderer.drawHighlight(container, this.camera, container === this._nearestContainer);
    }

    for (const o of this.activeObjects) {
      if (o.type !== 'item') continue;
      const img = this._itemImages[o.id] || (this._itemImages[o.id] = Object.assign(new Image(), { src: o.icon }));
      if (!img.complete || !img.naturalWidth) continue;
      const s = this.camera.worldToScreen(o.x, o.y);
      const h = o.height, w = h * img.naturalWidth / img.naturalHeight;
      const c = this.renderer.ctx;
      c.save(); c.shadowColor = '#80e8e6'; c.shadowBlur = 16;
      c.drawImage(img, s.x + (o.width - w) / 2, s.y, w, h);
      c.restore();
    }

    const actors=[...this.activeNpcs,this.player].sort((a,b)=>(a.feetY??a.centerY)-(b.feetY??b.centerY));
    for(const actor of actors){
      if(actor===this.player)this.renderer.drawPlayer(actor,this.camera);
      else this.renderer.drawNpc(actor,this.camera,this.player,actor===this._nearestContainer,this.npcAnimationTime||0);
    }
    for(const container of this.activeContainers)this.case.drawMarker(container);
  }
}

if (typeof module !== 'undefined') module.exports = Game;
