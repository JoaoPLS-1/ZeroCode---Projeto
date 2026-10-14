// Catálogo privado: só fichas capturadas podem sair pela API.
const casos = [
  { id:'retry', caso:'Retry', erro:'gerou só o "caminho feliz"; ninguém pediu nem testou o cenário de erro.',
    lembranca:'Eu já escrevi esse limite. Anos atrás. Lembro do bug que me ensinou isso.',
    camadas:[
      // rascunho
      ['D','Análise de incidente','Cruze o horário do deploy, o commit e os logs para entender quando o comportamento mudou.'],
      ['E','Code review','Código que ninguém leu não foi revisado — foi carimbado.'],
      ['C','Resiliência / testes','Retry sem limite transforma uma falha em milhares. Toda repetição precisa de teto e de espera crescente. E o caminho de falha também precisa de teste — não só o feliz.']
    ] },
  { id:'pagamento', caso:'Pagamento', erro:'a IA implementou o que foi pedido ("calcular o total"), não as regras que ninguém escreveu ("e se for inválido?").',
    lembranca:'Regra de negócio não é detalhe. Foi o primeiro sermão que eu dei a um estagiário.',
    camadas:[
      // rascunho
      ['D','Idempotência','O mesmo identificador de pedido não pode gerar uma nova cobrança a cada tentativa. Confira os registros antes de processar de novo.'],
      ['E','Falha de regra de negócio','A tela bloqueava valores inválidos, mas o servidor aceitava. Validação só no front-end é decoração: quem fala direto com a API passa por cima.'],
      ['C','Validação no backend','O servidor é a fonte da verdade: confere quantidade, usa o preço do catálogo (nunca o enviado pelo cliente) e não processa duas vezes o mesmo pedido.']
    ] },
  { id:'crachas', caso:'Crachás', erro:'checou autenticação ("está logado?") e esqueceu autorização ("pode ver isto?").',
    lembranca:'Ômega… já vi esse nome antes. Num log, numa madrugada.',
    camadas:[
      // rascunho
      ['D','Controle de acesso','Um número sequencial identifica um crachá, mas não prova que você tem permissão para vê-lo.'],
      ['E','Falha de autorização (IDOR)','Estar logado não é ter permissão. Se o servidor não confere se aquele recurso é seu, qualquer um vê o de qualquer outro.'],
      // rascunho
      ['C','Autorização no backend','Antes de devolver um crachá, o servidor deve conferir se quem pediu é o dono ou o gestor.']
    ] },
  { id:'mural', caso:'Mural', erro:'salvou e exibiu exatamente o que recebeu, porque "funcionou no teste".',
    lembranca:'Nunca confie no input. Eu tinha isso escrito num post-it no monitor.',
    camadas:[
      // rascunho
      ['D','Entrada não tratada','Um aviso deveria mostrar texto. Se abrir o aviso executa uma ação, investigue como a entrada foi exibida.'],
      // rascunho
      ['E','XSS armazenado','Uma entrada salva como HTML pode executar no navegador de cada pessoa que abrir o aviso.'],
      ['C','Escape de saída','Tudo que o usuário digita é dado, nunca código. Armazenar sem tratar e exibir como HTML entrega o navegador de todo mundo a quem escreveu.']
    ] },
  { id:'upload', caso:'Upload', erro:'checou se o nome "contém" `.pdf`, não se o arquivo é um PDF.',
    lembranca:'O Mark me avisou disso uma vez. Eu disse que ia olhar. Não olhei.',
    camadas:[
      // rascunho
      ['D','Superfície de upload','Uma ferramenta que aceita qualquer arquivo abre espaço para conteúdo que nunca deveria receber.'],
      // rascunho
      ['E','Upload sem tratamento','Um nome com .pdf no meio pode esconder outra extensão. Confira o tipo aceito, não apenas parte do nome.'],
      ['C','Validação de upload','Nome de arquivo mente. Valide a extensão final, o tipo real e o tamanho — no servidor.']
    ] }
];
const flags = casos.flatMap(caso => caso.camadas.map(([camada,conceito,ficha]) => ({
  id:caso.id+'-'+camada, caso:caso.caso, camada, titulo:caso.caso+' · '+conceito,
  conceito, vibecodeErrou:caso.erro, ficha, lembranca:caso.lembranca
})));
flags.push({ id:'pipeline-P', caso:'Processo', camada:'P', titulo:'Pipeline · Gate de qualidade', conceito:'Gate de qualidade',
  // rascunho
  vibecodeErrou:'permitiu publicar mesmo quando a etapa de testes falhava.',
  ficha:'Uma pipeline que deixa passar teste falho é só um botão de publicar. Revisão, QA e testes obrigatórios existem para o código que ninguém leu.',
  lembranca:'Fui eu que montei essa pipeline. Fui eu que deixei essa exceção \'temporária\'.' });
// Provisórias até a tarefa 17; retry-C já é a flag definitiva do Dev 1.
flags.find(flag => flag.id === 'retry-C').provisoria = true;
// rascunho: fichas e lembranças das missões atuais.
for (const [numero,conceito,ficha,lembranca,erro] of [
  [2,'Linha do tempo','Cruze os eventos pelo horário. Encontrar o deploy ajuda a separar a causa do incidente dos efeitos que vieram depois.','Eu costumava reconstruir incidentes assim. Primeiro o que mudou, depois o que falhou.','não relacionou a publicação aos eventos de falha.'],
  [3,'Testes SKIP','Teste ignorado não é teste aprovado. Confira os SKIP: o cenário que ficou de fora pode ser justamente o que derruba a operação.','Lembro de pedir ao Mark para testar também o caminho de erro.','tratou testes ignorados como cobertura suficiente.'],
  [4,'Backoff','Espere mais a cada nova tentativa e limite essa espera. Repetir imediatamente aumenta a pressão sobre um serviço que já está falhando.','Eu já vi uma fila se recuperar quando paramos de insistir sem esperar.','repetiu chamadas sem uma espera crescente e limitada.'],
  [5,'Isolamento','Compare tráfego externo e repetições internas antes de decidir. Isole o ciclo de falhas e considere rollback quando a mudança iniciou o problema.','Eu conheço esse padrão. A tempestade vinha de dentro.','não distinguiu tráfego externo de repetição interna.']
]) flags.push({ id:'provisoria-'+numero, caso:'Investigação', camada:'C', titulo:conceito, conceito,
  vibecodeErrou:erro, ficha, lembranca, provisoria:true });

const senhaLembrada = [
  { speaker:'thought', text:'Servidor de Infra… a senha. Eu escolhi uma que ninguém adivinharia: o ano em que tudo começou para mim. …Lembrei.' },
  { speaker:'npc', text:'Bem-vindo de volta, Kael. Agora você tem acesso à captura de rede.' }
];
module.exports = { flags, senhaLembrada };
