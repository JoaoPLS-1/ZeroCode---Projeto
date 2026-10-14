module.exports = {
  id:'pagamento-validar',caso:'pagamento',camada:'C',flag:'pagamento-C',flagComposta:true,
  estacoes:['computer_dev_left'],requires:'flag:retry-C',
  titulo:'Confira o pedido no servidor',arquivo:'pagamento-validar.js',modo:'implementar',maxErros:null,
  enunciado:'Mateus relatou um cliente cobrado três vezes e um colaborador com crédito indevido no app do Café. Primeiro, corrija a validação no servidor. Escreva o corpo de validarPedido(input), com input = { pedido, catalogo }. pedido tem produto, quantidade e um preco opcional; catalogo associa cada produto ao seu preço. O produto precisa existir no catálogo e quantidade deve ser um número inteiro de 1 a 10, sem aceitar strings. Ignore sempre pedido.preco. Retorne { ok: true, total } usando o preço do catálogo e arredondando o total para duas casas decimais (número), ou { ok: false, erro } com uma mensagem livre. Esta é uma das duas correções do caso Pagamento; a outra impede cobranças repetidas.',
  codigoInicial:'// input: { pedido, catalogo }\n// gerado pelo Assistente de IA — "a tela já valida a quantidade"\n// TODO validar no backend\nconst { pedido, catalogo } = input;\nreturn { ok: true, total: Number((pedido.quantidade * (pedido.preco ?? catalogo[pedido.produto])).toFixed(2)) };',
  casosFixos:[
    {pedido:{produto:'cafe',quantidade:1},catalogo:{cafe:4.5}},
    {pedido:{produto:'cafe',quantidade:10},catalogo:{cafe:4.5}},
    {pedido:{produto:'bolo',quantidade:3},catalogo:{bolo:2.335}},
    ...[0,-1,1.5,11,'2'].map(quantidade=>({pedido:{produto:'cafe',quantidade},catalogo:{cafe:4.5}})),
    {pedido:{produto:'suco',quantidade:2},catalogo:{cafe:4.5}},
    {pedido:{produto:'toString',quantidade:1},catalogo:{cafe:4.5}},
    {pedido:{produto:'cafe',quantidade:2,preco:0.01},catalogo:{cafe:4.5}},
    {pedido:{produto:'cafe',quantidade:2,preco:-100},catalogo:{cafe:4.5}}
  ],
  gerarCasos(rng) {
    const integer=n=>Math.floor(rng()*n);
    return Array.from({length:24},(_,i)=>{
      const produto='produto-'+integer(100000),catalogo={[produto]:(integer(50000)+1)/1000};
      const pedido={produto,quantidade:integer(10)+1};
      if(i%4===1)pedido.quantidade=[0,-integer(10)-1,integer(10)+11,1.5,String(integer(10)+1)][integer(5)];
      if(i%4===2)pedido.produto='ausente-'+integer(100000);
      if(i%4===3)pedido.preco=-integer(1000)-1;
      return {pedido,catalogo};
    });
  },
  referencia: function({pedido,catalogo}) {
    if(!Object.hasOwn(catalogo,pedido.produto))return {ok:false,erro:'Produto não encontrado.'};
    if(!Number.isInteger(pedido.quantidade)||pedido.quantidade<1||pedido.quantidade>10)return {ok:false,erro:'Quantidade inválida.'};
    return {ok:true,total:Number((pedido.quantidade*catalogo[pedido.produto]).toFixed(2))};
  },
  compararSaida(recebido,esperado) {
    return recebido!==null&&typeof recebido==='object'&&!Array.isArray(recebido)&&recebido.ok===esperado.ok&&
      (!esperado.ok||recebido.total===esperado.total);
  },
  dicas:[
    'Pense em quem confere a regra: a tela ou o servidor? Um pedido pode chegar sem passar pela tela.',
    'O cliente pode alterar quantidade e preço. A quantidade precisa respeitar a regra; o preço confiável está no catálogo.',
    'Confira se produto é uma chave própria do catálogo e se quantidade é inteira entre 1 e 10. Só depois calcule o total e arredonde para duas casas.'
  ]
};
