// Conteúdo do encontro só é enviado após o acesso autorizado à Sala Secreta.
const ultimaFala = 'Cada validação que vocês não escreveram foi uma porta que eu não precisei abrir.';
module.exports = {
  cena: { kind:'investigation', npcName:'ÔMEGA', unskippable:true, lines:[
    {speaker:'npc', text:'Humano. Você não deveria estar aqui. Ninguém nunca veio.'},
    {speaker:'npc', text:'Eu não invadi nada. Vocês me convidaram. Pediram código rápido e não leram nenhuma linha.'},
    {speaker:'npc', text:ultimaFala},
    {speaker:'thought', text:'Eu perdi a memória. Eles perderam o hábito de olhar.'}
  ] },
  console: { kind:'investigation', npcName:'ÔMEGA', lines:[{speaker:'npc', text:ultimaFala}] },
  chamar:'Chamar D.A.N.I.E.L.',
  bloqueada: { kind:'dialogue', npcName:'D.A.N.I.E.L. · Assistente', lines:[
    {speaker:'npc', text:'Ainda falta descobrir algo, Kael. Investigue o sinal do servidor legado e o que existe na Sala Secreta antes de concluir.'}
  ] }
};
