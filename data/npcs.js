// data/npcs.js
// Containers provisórios dos NPCs, separados por sala.

const NPCS = [
  {
    id: 'npc_dev_left', type: 'npc', roomId: 'room_dev', color: 'red',
    name: 'Edu · Backend', x: 224, y: 580, width: 87, height: 135,
    interactionRadius: 80, action: 'CONVERSAR',
    dialogRef: 'dialog_test_dev_1', clueRef: 'clue_test_dev_npc_1',
  },
  {
    id: 'npc_dev_right', type: 'npc', roomId: 'room_dev', color: 'red',
    name: 'Rick · Release', x: 1176, y: 412, width: 98, height: 121,
    interactionRadius: 80, action: 'CONVERSAR',
    dialogRef: 'dialog_test_dev_2', clueRef: 'clue_test_dev_npc_2',
  },
  {
    id: 'npc_qa', type: 'npc', roomId: 'room_qa_infra', color: 'red',
    name: 'Mark · QA', x: 482, y: 520, width: 79, height: 154,
    interactionRadius: 80, action: 'CONVERSAR',
    dialogRef: 'dialog_test_qa', clueRef: 'clue_test_qa_npc',
  },
  {
    id: 'npc_infra', type: 'npc', roomId: 'room_qa_infra', color: 'red',
    name: 'Steve · Infra', x: 1406, y: 594, width: 73, height: 146,
    interactionRadius: 80, action: 'CONVERSAR',
    dialogRef: 'dialog_test_infra', clueRef: 'clue_test_infra_npc',
  },
  {
    id: 'npc_cafe_1', type: 'npc', roomId: 'room_cafe', color: 'red',
    name: 'Luna · Produto', x: 692, y: 154, width: 72, height: 163,
    interactionRadius: 80, action: 'CONVERSAR',
    dialogRef: 'dialog_test_cafe_1', clueRef: 'clue_test_cafe_npc_1',
  },
  {
    id: 'npc_cafe_2', type: 'npc', roomId: 'room_cafe', color: 'red',
    name: 'Mateus · Suporte', x: 793, y: 161, width: 67, height: 162,
    interactionRadius: 80, action: 'CONVERSAR',
    dialogRef: 'dialog_test_cafe_2', clueRef: 'clue_test_cafe_npc_2',
  },
  {
    id: 'npc_cafe_decoy', type: 'npc', roomId: 'room_cafe', color: 'green',
    name: 'Zeca · Café', x: 1270, y: 446, width: 94, height: 80,
    interactionRadius: 80, action: 'CONVERSAR',
    dialogRef: 'dialog_test_decoy', clueRef: null,
  },
];

NPCS.push({id:'npc_reuniao_livia',type:'npc',roomId:'room_meeting',color:'red',name:'Lívia · Full-stack',x:945,y:400,width:65,height:110,interactionRadius:85,action:'CONVERSAR',dialogRef:'dialog_livia',clueRef:null});

const NPC_PLACEMENTS = {
 npc_dev_left:['edu',530,625,'left'], npc_dev_right:['rick',1120,555,'right'],
 npc_qa:['mark',665,650,'left'], npc_infra:['steve',1310,720,'right'],
 npc_cafe_1:['luna',735,330,'right'], npc_cafe_2:['mateus',850,335,'left'],
 npc_cafe_decoy:['kael-npc',1190,585,'left'], npc_reuniao_livia:['livia',970,550,'left'],
};
for(const npc of NPCS){
 const [skin,feetX,feetY,facing]=NPC_PLACEMENTS[npc.id];
 Object.assign(npc,{sprite:`assets/npcs/${skin}.png`,feetX,feetY,facing,x:feetX-18,y:feetY-18,width:36,height:36});
}
if (typeof module !== 'undefined') module.exports = NPCS;
