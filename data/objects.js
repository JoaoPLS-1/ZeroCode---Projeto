// data/objects.js
// Computadores e terminal final, separados por sala.

const OBJECTS = [
  {
    id: 'item_celular', type: 'item', itemId: 'celular', roomId: 'room_cafe', color: 'blue',
    name: 'Celular', x: 1254, y: 570, width: 14, height: 25,
    interactionRadius: 70, action: 'PEGAR', icon: 'assets/items/celular.png',
  },
  {
    id: 'computer_dev_left', type: 'computer', roomId: 'room_dev', color: 'blue',
    name: 'Computador Dev 1', x: 373, y: 346, width: 112, height: 89,
    interactionRadius: 90, action: 'ANALISAR',
    contentRef: 'investigation_test_dev_1', clueRef: 'clue_test_dev_computer_1',
  },
  {
    id: 'computer_dev_right', type: 'computer', roomId: 'room_dev', color: 'blue',
    name: 'Computador Dev 2', x: 1202, y: 330, width: 196, height: 137,
    interactionRadius: 90, action: 'ANALISAR',
    contentRef: 'investigation_test_dev_2', clueRef: 'clue_test_dev_computer_2',
  },
  {
    id: 'computer_qa_upper', type: 'computer', roomId: 'room_qa_infra', color: 'blue',
    name: 'Computador QA', x: 420, y: 276, width: 139, height: 107,
    interactionRadius: 110, action: 'ANALISAR',
    contentRef: 'investigation_test_qa_1', clueRef: 'clue_test_qa_computer',
  },
  {
    id: 'computer_qa_infra_lower', type: 'computer', roomId: 'room_qa_infra', color: 'blue',
    name: 'Computador Técnico', x: 977, y: 497, width: 265, height: 129,
    interactionRadius: 90, action: 'ANALISAR',
    contentRef: 'investigation_test_qa_infra_2', clueRef: 'clue_test_qa_infra_computer',
  },
  {
    id: 'computer_infra_upper', type: 'computer', roomId: 'room_qa_infra', color: 'blue',
    name: 'Servidor de Infra', x: 1291, y: 70, width: 171, height: 230,
    interactionRadius: 90, action: 'ANALISAR',
    contentRef: 'investigation_test_infra_1', clueRef: 'clue_test_infra_computer',
  },
  {
    id: 'computer_meeting_final', type: 'computer_final', roomId: 'room_meeting', color: 'blue',
    name: 'Terminal da Reunião', x: 733, y: 337, width: 208, height: 193,
    interactionRadius: 100, action: 'APRESENTAR SOLUÇÃO', clueRef: null,
  },
];

OBJECTS.push({id:'manager_dante',type:'manager',roomId:'room_manager',name:'Dante Kernel · Gestor de Acesso',color:'purple',x:775,y:475,width:55,height:30,interactionRadius:100,action:'CONVERSAR'});

if (typeof module !== 'undefined') module.exports = OBJECTS;

// Mesa do gerente no novo fundo.
Object.assign(OBJECTS.find(o=>o.id==='manager_dante'),{x:785,y:470,width:45,height:25});
