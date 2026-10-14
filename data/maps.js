// data/maps.js
// Salas da fase 1. Todas as coordenadas pertencem ao mapa 1672x941,
// nunca à viewport. As conexões entre portas ficam somente neste arquivo.
// Obstáculos aceitam retângulos ou { points: [[x,y], ...] } convexos.
// Para móveis em U/L, use várias peças; nunca feche os vãos caminháveis.

const INITIAL_ROOM_ID = 'room_dev';

const ROOMS = {
  room_qa_infra: {
    id: 'room_qa_infra',
    name: 'QA / Infra',
    mapOrder: 1,
    width: 1672,
    height: 941,
    background: 'assets/backgrounds/fase1/sala-qa-infra.png',
    bounds: { x: 45, y: 225, width: 1582, height: 666 },
    spawns: { entryMain: { x: 834, y: 280 } },
    doors: [
      {
        id: 'door_qa_infra', type: 'door', roomId: 'room_qa_infra',
        color: 'purple', name: 'Porta para Desenvolvimento',
        x: 734, y: 42, width: 200, height: 201,
        interactionRadius: 35, action: 'VOLTAR',
        targetRoom: 'room_dev', targetSpawn: 'entryLeft',
      },
    ],
    obstacles: [
      { x: 90, y: 245, width: 165, height: 55 },
      { x: 375, y: 235, width: 215, height: 35 },
      { points: [[285,330],[595,330],[595,395],[300,395]] },
      { x: 258, y: 360, width: 125, height: 87 },
      { x: 490, y: 375, width: 100, height: 65 },
      { points: [[244,530],[642,520],[638,598],[235,622]] },
      { points: [[60,650],[255,714],[269,794],[62,750]] },
      { x: 940, y: 225, width: 520, height: 70 },
      { x: 970, y: 320, width: 195, height: 115 },
      { x: 1250, y: 407, width: 112, height: 104 },
      { points: [[989,571],[1215,566],[1225,673],[972,679]] },
      { x: 1338, y: 552, width: 159, height: 146 },
      { x: 450, y: 805, width: 305, height: 80 },
      { x: 923, y: 805, width: 282, height: 80 },
      { x: 1390, y: 745, width: 235, height: 140 },
    ],
  },

  room_dev: {
    id: 'room_dev',
    name: 'Desenvolvimento',
    mapOrder: 2,
    width: 1672,
    height: 941,
    background: 'assets/backgrounds/fase1/sala-dev.png',
    bounds: { x: 45, y: 250, width: 1582, height: 641 },
    spawns: {
      initial: { x: 836, y: 760 },
      entryLeft: { x: 482, y: 335 },
      entryRight: { x: 1204, y: 335 },
    },
    doors: [
      {
        id: 'door_dev_left', type: 'door', roomId: 'room_dev',
        color: 'purple', name: 'Porta para QA / Infra',
        x: 403, y: 78, width: 158, height: 223,
        interactionRadius: 35, action: 'ENTRAR',
        targetRoom: 'room_qa_infra', targetSpawn: 'entryMain',
      },
      {
        id: 'door_dev_right', type: 'door', roomId: 'room_dev',
        color: 'purple', name: 'Porta para o Café',
        x: 1132, y: 68, width: 145, height: 231,
        interactionRadius: 35, action: 'ENTRAR',
        targetRoom: 'room_cafe', targetSpawn: 'entryLeft',
      },
    ],
    obstacles: [
      { x: 90, y: 250, width: 320, height: 70 },
      { x: 550, y: 250, width: 500, height: 30 },
      // Bancadas em peças: os vãos e cantos livres não são obstáculos.
      { points: [[281,410],[550,407],[550,470],[291,500]] },
      { points: [[248,457],[318,474],[292,602],[224,616]] },
      { points: [[224,590],[309,579],[483,637],[476,699],[219,648]] },
      { points: [[750,415],[985,425],[995,512],[748,495]] },
      { points: [[706,463],[757,446],[755,586],[695,607]] },
      { points: [[727,572],[1006,599],[1006,681],[712,669]] },
      { points: [[1135,414],[1393,429],[1402,510],[1162,491]] },
      { points: [[1196,582],[1451,589],[1460,667],[1201,678]] },
      { x: 570, y: 800, width: 520, height: 85 },
      { x: 45, y: 790, width: 320, height: 95 },
      { x: 1320, y: 790, width: 305, height: 95 },
    ],
  },

  room_cafe: {
    id: 'room_cafe',
    name: 'Café',
    mapOrder: 3,
    width: 1672,
    height: 941,
    background: 'assets/backgrounds/fase1/sala-cafe.png',
    bounds: { x: 45, y: 250, width: 1582, height: 641 },
    spawns: {
      entryLeft: { x: 465, y: 330 },
      entryRight: { x: 1199, y: 330 },
    },
    doors: [
      {
        id: 'door_cafe_left', type: 'door', roomId: 'room_cafe',
        color: 'purple', name: 'Porta para Desenvolvimento',
        x: 385, y: 64, width: 160, height: 230,
        interactionRadius: 35, action: 'VOLTAR',
        targetRoom: 'room_dev', targetSpawn: 'entryRight',
      },
      {
        id: 'door_cafe_right', type: 'door', roomId: 'room_cafe',
        color: 'purple', name: 'Porta para a Reunião',
        x: 1118, y: 62, width: 161, height: 235,
        interactionRadius: 35, action: 'ENTRAR',
        targetRoom: 'room_meeting', targetSpawn: 'entryLeft',
      },
    ],
    obstacles: [
      { x: 90, y: 250, width: 320, height: 70 },
      { x: 520, y: 250, width: 540, height: 65 },
      // Sofás e mesa separados; o tapete continua caminhável.
      { x: 1212, y: 455, width: 186, height: 100 },
      { x: 1410, y: 500, width: 115, height: 236 },
      { x: 1313, y: 680, width: 190, height: 80 },
      { x: 1249, y: 582, width: 120, height: 67 },
      { points: [[325,566],[385,549],[423,579],[421,618],[367,652],[316,619]] },
      { points: [[941,592],[996,585],[1033,613],[1024,652],[975,678],[931,648]] },
      { x: 570, y: 790, width: 510, height: 95 },
      { x: 45, y: 790, width: 320, height: 95 },
      { x: 1320, y: 790, width: 305, height: 95 },
    ],
  },

  room_meeting: {
    id: 'room_meeting',
    name: 'Reunião',
    mapOrder: 4,
    width: 1672,
    height: 941,
    background: 'assets/backgrounds/fase1/sala-reuniao.png',
    bounds: { x: 45, y: 250, width: 1582, height: 641 },
    spawns: {
      entryLeft: { x: 476, y: 320 },
      entryRight: { x: 1195, y: 320 },
    },
    doors: [
      {
        id: 'door_meeting_left', type: 'door', roomId: 'room_meeting',
        color: 'purple', name: 'Porta para o Café',
        x: 374, y: 63, width: 203, height: 224,
        interactionRadius: 35, action: 'VOLTAR',
        targetRoom: 'room_cafe', targetSpawn: 'entryRight',
      },
      {
        id: 'door_meeting_right', type: 'door', roomId: 'room_meeting',
        color: 'purple', name: 'Saída alternativa para o Café',
        x: 1092, y: 58, width: 206, height: 249,
        interactionRadius: 35, action: 'VOLTAR',
        targetRoom: 'room_cafe', targetSpawn: 'entryRight',
      },
    ],
    obstacles: [
      { x: 570, y: 250, width: 520, height: 45 },
      // Mesas em U: três peças convexas por mesa, com o interior livre.
      { points: [[398,380],[646,371],[646,443],[477,489]] },
      { points: [[397,406],[480,450],[460,616],[350,627]] },
      { points: [[350,604],[461,601],[666,682],[666,762],[593,761],[350,665]] },
      { points: [[1026,373],[1247,387],[1269,480],[1027,442]] },
      { points: [[1190,449],[1272,430],[1310,615],[1201,620]] },
      { points: [[1200,599],[1309,598],[1323,665],[1088,761],[1004,761],[1004,686]] },
      { x: 789, y: 409, width: 90, height: 68 },
      { x: 570, y: 790, width: 530, height: 95 },
      { x: 45, y: 790, width: 300, height: 95 },
      { x: 1320, y: 790, width: 305, height: 95 },
    ],
  },
};

// Gerência: o gerente já faz parte da imagem, sem sprite duplicado.
ROOMS.room_manager = {
 id:'room_manager',name:'Gerência',mapOrder:5,width:1599,height:984,
 background:'assets/backgrounds/fase1/sala-gerencia.png',
 bounds:{x:145,y:305,width:1300,height:550},
 spawns:{entryMain:{x:360,y:740}},
 doors:[{id:'door_manager_exit',type:'door',roomId:'room_manager',color:'purple',name:'Voltar à Reunião',x:175,y:650,width:115,height:160,interactionRadius:90,action:'VOLTAR',targetRoom:'room_meeting',targetSpawn:'entryRight'}],
 obstacles:[
  {points:[[145,305],[370,305],[210,650],[145,650]]},
  {points:[[1195,305],[1445,305],[1445,770],[1290,770]]},
  {x:285,y:375,width:100,height:225},
  {x:390,y:305,width:120,height:70},
  {x:590,y:325,width:440,height:175},
  {x:645,y:475,width:125,height:105},
  {x:845,y:475,width:125,height:105},
  {x:1090,y:305,width:125,height:105}
 ]
};
const managerDoor=ROOMS.room_meeting.doors.find(d=>d.id==='door_meeting_right');
Object.assign(managerDoor,{name:'Porta para a Gerência',action:'ENTRAR',targetRoom:'room_manager',targetSpawn:'entryMain'});

// Acesso ao laboratório pelo ponto de passagem na frente da Gerência.
ROOMS.room_manager.spawns.entrySecret={x:1080,y:730};
ROOMS.room_manager.doors.push({id:'door_manager_secret',type:'door',roomId:'room_manager',color:'purple',name:'Sala Secreta · Controlador de acesso',x:1000,y:800,width:140,height:40,interactionRadius:75,action:'ENTRAR',targetRoom:'room_secret',targetSpawn:'entryMain'});
ROOMS.room_secret={
 id:'room_secret',name:'Sala Secreta',mapOrder:6,width:1672,height:941,
 background:'assets/backgrounds/fase1/sala-secreta.png',
 bounds:{x:215,y:325,width:1310,height:405},
 spawns:{entryMain:{x:835,y:605}},
 doors:[{id:'door_secret_exit',type:'door',roomId:'room_secret',color:'purple',name:'Voltar à Gerência',x:760,y:660,width:150,height:70,interactionRadius:65,action:'VOLTAR',targetRoom:'room_manager',targetSpawn:'entrySecret'}],
 obstacles:[
  {x:215,y:345,width:150,height:170},{x:350,y:400,width:110,height:130},
  {x:610,y:325,width:145,height:170},{x:755,y:325,width:165,height:160},
  {x:920,y:325,width:130,height:170},
  {x:1285,y:325,width:240,height:125},{x:1410,y:430,width:115,height:90},
  {x:1240,y:475,width:235,height:220},{x:215,y:530,width:55,height:155},
  {x:640,y:655,width:110,height:75},{x:920,y:655,width:100,height:75}
 ]
};

// Fundos de 09/10: pontos de interação na soleira visível de cada porta.
const door=(id,roomId,name,x,y,width,height,targetRoom,targetSpawn)=>({id,type:'door',roomId,color:'purple',name,x,y,width,height,interactionRadius:85,action:'ENTRAR',targetRoom,targetSpawn});
Object.assign(ROOMS.room_dev,{spawns:{initial:{x:836,y:760},entryLeft:{x:155,y:345},entryRight:{x:1205,y:320}},doors:[
 door('door_dev_left','room_dev','QA / Infra',40,225,75,110,'room_qa_infra','entryMain'),
 door('door_dev_right','room_dev','Café',1155,170,105,100,'room_cafe','entryLeft')
]});
Object.assign(ROOMS.room_qa_infra,{spawns:{entryMain:{x:1510,y:470}},doors:[door('door_qa_infra','room_qa_infra','Desenvolvimento',1580,330,55,110,'room_dev','entryLeft')]});
Object.assign(ROOMS.room_cafe,{width:1671,spawns:{entryLeft:{x:835,y:745},entryRight:{x:180,y:370}},doors:[
 door('door_cafe_left','room_cafe','Desenvolvimento',780,815,110,70,'room_dev','entryRight'),
 door('door_cafe_right','room_cafe','Reunião',25,220,65,130,'room_meeting','entryLeft')
]});
// A nova entrada frontal substitui o balcão central da borda inferior.
ROOMS.room_cafe.obstacles=ROOMS.room_cafe.obstacles.filter(o=>!(o.x===570&&o.y===790));
ROOMS.room_cafe.obstacles.push({x:100,y:250,width:230,height:60});
Object.assign(ROOMS.room_meeting,{width:1671,spawns:{entryLeft:{x:1500,y:535},entryRight:{x:460,y:315}},doors:[
 door('door_meeting_left','room_meeting','Café',1575,390,70,150,'room_cafe','entryRight'),
 door('door_meeting_right','room_meeting','Gerência',410,150,100,105,'room_manager','entryMain')
]});
// A parede frontal permanece fechada; a entrada do Café fica na lateral direita.
Object.assign(ROOMS.room_manager,{width:1671,height:941,bounds:{x:130,y:320,width:1450,height:410},spawns:{entryMain:{x:805,y:675},entrySecret:{x:1525,y:660}},doors:[
 door('door_manager_exit','room_manager','Reunião',740,740,140,100,'room_meeting','entryRight'),
 door('door_manager_secret','room_manager','Sala Secreta · Controlador de acesso',1560,460,75,170,'room_secret','entryMain')
],obstacles:[
 {x:155,y:320,width:245,height:65},{x:130,y:420,width:80,height:160},
 {x:595,y:330,width:410,height:150},{x:655,y:465,width:115,height:100},{x:830,y:465,width:120,height:100},
 {x:1365,y:320,width:120,height:115},{x:1375,y:445,width:165,height:165}
]});
Object.assign(ROOMS.room_secret,{bounds:{x:135,y:320,width:1390,height:410},spawns:{entryMain:{x:195,y:455}},doors:[
 door('door_secret_exit','room_secret','Gerência',40,300,85,180,'room_manager','entrySecret')
],obstacles:[
 {x:220,y:320,width:220,height:65},{x:580,y:320,width:140,height:160},
 {x:720,y:320,width:145,height:155},{x:865,y:320,width:120,height:160},
 {x:1250,y:320,width:275,height:110},{x:1380,y:420,width:145,height:85},
 {x:1190,y:465,width:240,height:210},{x:135,y:525,width:30,height:155}
]});

ROOMS.room_manager.minimapBackground='assets/backgrounds/fase1/sala-gerencia-minimapa.png';

// Alias temporário para ferramentas externas que ainda procurem MAPS.
const MAPS = ROOMS;

if (typeof module !== 'undefined') {
  module.exports = { ROOMS, INITIAL_ROOM_ID };
}
