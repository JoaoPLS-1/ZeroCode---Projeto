// Comandos operam somente sobre o RemoteFS; leituras e conquistas são do servidor.
const TERMINAL_COMMANDS = Object.create(null);
function registerTerminalCommand(nome, def) {
  if (typeof nome !== 'string' || !/^[a-z][a-z0-9-]*$/.test(nome) ||
      !def || typeof def.help !== 'string' || typeof def.run !== 'function')
    throw new TypeError('Definição de comando inválida.');
  if (TERMINAL_COMMANDS[nome]) throw new Error('Comando já registrado.');
  TERMINAL_COMMANDS[nome] = def;
}
function terminalArgs(line) {
  const args = []; let value = '', quote = null, started = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '\\' && quote !== "'") {
      if (++i === line.length) throw new Error('escape incompleto');
      value += line[i]; started = true;
    } else if (quote) {
      if (char === quote) quote = null; else value += char;
    } else if (char === '"' || char === "'") { quote = char; started = true; }
    else if (/\s/.test(char)) {
      if (started) { args.push(value); value = ''; started = false; }
    } else { value += char; started = true; }
  }
  if (quote) throw new Error('aspas não fechadas');
  if (started) args.push(value);
  return args;
}
const terminalMissing = error => error?.message === 'Arquivo não encontrado.';
async function terminalEntry(term, path) {
  const parent = await term.fs.resolve(path, '..');
  try { return (await term.fs.list(parent)).entries.find(entry => entry.path === path); }
  catch (error) { if (!terminalMissing(error)) throw error; }
}
async function terminalRead(term, name, command) {
  const path = await term.fs.resolve(term.cwd, name);
  try { return (await term.fs.read(path)).content; }
  catch (error) {
    if (!terminalMissing(error)) throw error;
    const entry = await terminalEntry(term, path);
    throw new Error(command + ': ' + name + ': ' + (entry?.type === 'directory' ? 'é um diretório' : 'arquivo não encontrado'));
  }
}
function createTerminal(fs) {
  return { fs, cwd: '/home/kael', async run(line) {
    try {
      const [name, ...args] = terminalArgs(line);
      if (!name) return { lines: [] };
      if (!TERMINAL_COMMANDS[name]) return { lines: [name + ': comando não encontrado'] };
      return await TERMINAL_COMMANDS[name].run(args, this);
    } catch (error) { return { lines: [error.message || 'Não foi possível executar o comando.'] }; }
  } };
}
registerTerminalCommand('help', { help: 'help — lista os comandos disponíveis', run: () =>
  ({ lines: Object.values(TERMINAL_COMMANDS).map(command => command.help) }) });
registerTerminalCommand('pwd', { help: 'pwd — mostra o diretório atual', run: (args, term) => ({ lines: [term.cwd] }) });
registerTerminalCommand('whoami', { help: 'whoami — mostra o usuário atual', run: () => ({ lines: ['kael'] }) });
registerTerminalCommand('clear', { help: 'clear — limpa a saída', run: () => ({ lines: [], clear: true }) });
registerTerminalCommand('ls', { help: 'ls [caminho] — lista arquivos e diretórios', async run(args, term) {
  if (args.length > 1) return { lines: ['ls: uso: ls [caminho]'] };
  const name = args[0] ?? '.', path = await term.fs.resolve(term.cwd, name);
  try { return { lines: (await term.fs.list(path)).entries.map(entry => entry.name + (entry.type === 'directory' ? '/' : '')) }; }
  catch (error) {
    if (!terminalMissing(error)) throw error;
    const entry = await terminalEntry(term, path);
    return { lines: [entry?.type === 'file' ? entry.name : 'ls: ' + name + ': arquivo não encontrado'] };
  }
} });
registerTerminalCommand('cd', { help: 'cd [caminho] — muda o diretório (padrão: /home/kael)', async run(args, term) {
  if (args.length > 1) return { lines: ['cd: uso: cd [caminho]'] };
  const name = args[0] ?? '/home/kael', path = await term.fs.resolve(term.cwd, name);
  try { await term.fs.list(path); }
  catch (error) {
    if (!terminalMissing(error)) throw error;
    const entry = await terminalEntry(term, path);
    return { lines: ['cd: ' + name + ': ' + (entry?.type === 'file' ? 'não é um diretório' : 'diretório não encontrado')] };
  }
  term.cwd = path; return { lines: [] };
} });
registerTerminalCommand('cat', { help: 'cat <arquivo> — lê um arquivo', async run(args, term) {
  if (args.length !== 1) return { lines: ['cat: uso: cat <arquivo>'] };
  const lines = (await terminalRead(term, args[0], 'cat')).split(/\r?\n/);
  return { lines: lines.length > 500 ? [...lines.slice(0, 200), 'Arquivo com ' + lines.length + ' linhas; mostrando as primeiras 200. Para consultar o restante, use grep, less ou sed -n Np.'] : lines };
} });
registerTerminalCommand('grep', { help: 'grep [-n] [-i] <padrão> <arquivo> — procura texto literal; -n numera, -i ignora maiúsculas', async run(args, term) {
  let numbered = false, insensitive = false, index = 0;
  while (index < args.length && args[index].startsWith('-')) {
    const option = args[index++];
    if (option === '--') break;
    if (!/^-[ni]+$/.test(option)) return { lines: ['grep: opção inválida: ' + option] };
    numbered ||= option.includes('n'); insensitive ||= option.includes('i');
  }
  if (args.length - index !== 2) return { lines: ['grep: uso: grep [-n] [-i] <padrão> <arquivo>'] };
  const pattern = insensitive ? args[index].toLowerCase() : args[index];
  const content = await terminalRead(term, args[index + 1], 'grep');
  return { lines: content.split(/\r?\n/).flatMap((line, number) =>
    (insensitive ? line.toLowerCase() : line).includes(pattern) ? [(numbered ? (number + 1) + ':' : '') + line] : []) };
} });
registerTerminalCommand('less', { help: 'less <arquivo> [página] — lê páginas de 200 linhas (padrão: 1)', async run(args, term) {
  if (args.length < 1 || args.length > 2 || (args[1] !== undefined && !/^[1-9]\d*$/.test(args[1])))
    return { lines: ['less: uso: less <arquivo> [página]'] };
  const lines = (await terminalRead(term, args[0], 'less')).split(/\r?\n/), pages = Math.ceil(lines.length / 200), page = Number(args[1] ?? 1);
  if (!Number.isSafeInteger(page) || page > pages) return { lines: ['less: página fora do intervalo 1–' + pages] };
  return { lines: [...lines.slice((page - 1) * 200, page * 200), 'Página ' + page + '/' + pages + '. Use less "' + args[0] + '" ' + (page < pages ? page + 1 : page) + ' para consultar uma página.'] };
} });
// Só a forma de impressão de linhas: sed -n 'Np' ou sed -n 'A,Bp' (como no Unix).
registerTerminalCommand('sed', { help: "sed -n 'Np' <arquivo> — mostra a linha N (ou 'A,Bp' para um intervalo)", async run(args, term) {
  const match = args.length === 3 && args[0] === '-n' ? /^(\d+)(?:,(\d+))?p$/.exec(args[1]) : null;
  if (!match) return { lines: ["sed: uso: sed -n 'Np' <arquivo>  ou  sed -n 'A,Bp' <arquivo>"] };
  const lines = (await terminalRead(term, args[2], 'sed')).split(/\r?\n/);
  const start = Number(match[1]), end = Number(match[2] ?? match[1]);
  if (start < 1 || end < start) return { lines: ['sed: intervalo inválido'] };
  return { lines: lines.slice(start - 1, Math.min(end, start + 499)) };
} });
if (typeof module !== 'undefined') module.exports = { createTerminal, TERMINAL_COMMANDS, registerTerminalCommand };
