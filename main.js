// main.js
// Ponto de entrada da V0.1. Instancia o Game com os dados da fase 1.

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');

  const dom = {
    startScreen: document.getElementById('start-screen'),
    startButton: document.getElementById('start-button'),
    briefingScreen: document.getElementById('briefing-screen'),
    briefingButton: document.getElementById('briefing-button'),
    hudRoot: document.getElementById('hud'),
    promptEl: document.getElementById('interaction-prompt'),
    clueAlert: document.getElementById('clue-alert'),
    minimapRoot: document.getElementById('minimap'),
    dialogueRoot: document.getElementById('dialogue-modal'),
    decisionRoot: document.getElementById('decision-modal'),
    resultScreen: document.getElementById('result-screen'),
    resultButton: document.getElementById('result-button'),
    completeScreen: document.getElementById('complete-screen'),
  };

  const game = new Game({
    canvas,
    rooms: ROOMS,
    initialRoomId: INITIAL_ROOM_ID,
    npcs: NPCS,
    objects: OBJECTS,
    dialogsData: DIALOGS,
    cluesData: CLUES,
    missionData: MISSION_FASE1,
    dom,
  });

  game.start();

  // Exposto apenas para depuração/testes manuais via console do navegador.
  window.__game = game;
});
