const SECRET_DOOR = {
  title:'CONTROLADOR DE ACESSO',
  instruction:'Somente sistemas autorizados. Informe origem e porta.',
  refused:'Origem não reconhecida. Conexão recusada.',
  accepted:{npcName:'CONTROLADOR DE ACESSO',lines:[
    {speaker:'npc',text:'Origem reconhecida. Bem-vindo, ÔMEGA.'},
    {speaker:'thought',text:'Ele acha que eu sou ela.'},
  ]},
};
if (typeof module !== 'undefined') module.exports = SECRET_DOOR;
