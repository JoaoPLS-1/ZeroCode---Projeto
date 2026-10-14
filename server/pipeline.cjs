const dados = require('./data/pipeline.cjs');
const progress = require('./progress.cjs');
const { capturar } = require('./flags.cjs');
const { readJson, json } = require('./router.cjs');
const stations = ['computer_qa_upper','computer_qa_infra_lower'];
const fail = (status,message) => { throw Object.assign(new Error(message), { status }); };

// Subconjunto explícito: etapas na raiz, propriedades escalares e needs em lista.
// Rejeitar sintaxe desconhecida evita dar significado diferente ao mesmo YAML.
function validarYaml(yaml) {
  const etapas = new Map(); let etapa, lista;
  const formato = 'Use etapas na raiz, propriedades com dois espaços e needs: [testes] (ou lista com quatro espaços). Não repita etapas ou propriedades.';
  for (const original of yaml.replace(/\r\n/g,'\n').split('\n')) {
    const line = original.replace(/\s+#.*$/, '').trimEnd();
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    if (/\t/.test(line)) return formato;
    const header = /^([a-z][a-z0-9_-]*):$/.exec(line);
    if (header) {
      if (etapas.has(header[1])) return formato;
      etapa = new Map(); etapas.set(header[1],etapa); lista = false; continue;
    }
    if (!etapa) return formato;
    const item = /^    - ([a-z][a-z0-9_-]*)$/.exec(line);
    if (item && lista) { etapa.get('needs').push(item[1]); continue; }
    const field = /^  (script|allow_failure|needs):(?: (.*))?$/.exec(line);
    if (!field || etapa.has(field[1])) return formato;
    const [,key,value=''] = field; lista = false;
    if (key === 'needs') {
      if (!value) { etapa.set(key,[]); lista = true; continue; }
      const match = /^(?:\[([a-z0-9_, '"-]+)\]|([a-z][a-z0-9_-]*))$/.exec(value);
      if (!match) return formato;
      const names = (match[1] || match[2]).split(',').map(name => name.trim().replace(/^(['"])([a-z][a-z0-9_-]*)\1$/, '$2'));
      if (names.some(name => !/^[a-z][a-z0-9_-]*$/.test(name))) return formato;
      etapa.set(key,names);
    } else {
      if (key === 'allow_failure' && !['true','false'].includes(value)) return 'allow_failure deve ser true ou false, sem aspas.';
      if (key === 'script' && (!value || /^[&*!|>{\[]/.test(value))) return formato;
      etapa.set(key,value);
    }
  }
  if (!etapas.has('testes')) return 'Mantenha a etapa testes: teste falho precisa bloquear o deploy.';
  if (etapas.get('testes').get('allow_failure') === 'true') return 'Na etapa testes, remova allow_failure ou defina false para bloquear falhas.';
  if (!etapas.has('deploy')) return 'Mantenha a etapa deploy.';
  if (!etapas.get('deploy').get('needs')?.includes('testes')) return 'A etapa deploy precisa depender de testes: use needs: [testes].';
  if (!etapas.has('build')) return 'Mantenha a etapa build.';
  return null;
}
function installPipelineRoutes(router, sessions) {
  const sessionFor = req => sessions.get(req) || fail(401,'Inicie uma nova partida.');
  const stationFor = req => {
    const station = new URL(req.url,'http://localhost').searchParams.get('estacao');
    if (!stations.includes(station)) fail(404,'Pipeline indisponível nesta estação.');
  };
  router.add('GET','/api/jogo/pipeline',(req,res) => {
    const session = sessionFor(req); stationFor(req);
    json(res,200,{ ok:true,yaml:session.pipelineYaml ?? dados.yaml,execucoes:dados.execucoes });
  });
  router.add('POST','/api/jogo/pipeline',async (req,res) => {
    const session = sessionFor(req);
    const body = await readJson(req,4 * 1024);
    if (typeof body?.yaml !== 'string' || !body.yaml.trim()) fail(400,'Informe a configuração pipeline.yml.');
    const mensagem = validarYaml(body.yaml);
    if (mensagem) return json(res,200,{ ok:false,mensagem });
    session.pipelineYaml = body.yaml;
    json(res,200,{ ok:true,mensagem:'Configuração salva. Teste falho agora bloqueia o deploy.',captura:capturar(session,'pipeline-P'),...progress.state(session) });
  });
}
module.exports = { validarYaml, installPipelineRoutes };
