// node:sqlite (usado pelo /lab) funciona sem flag a partir do Node 22.13.
const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 13)) {
  console.error(`ZeroCode exige Node.js 22.13 ou superior. Versão atual: ${process.versions.node}.`);
  process.exitCode = 1;
} else {
  const { createApp } = require('./app.cjs');
  const port = process.env.PORT === undefined ? 8000 : Number(process.env.PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error('PORT deve ser um número inteiro entre 1 e 65535.');
    process.exitCode = 1;
  } else {
    const server = createApp();
    server.on('error', error => {
      console.error(`Não foi possível iniciar o servidor: ${error.message}`);
      process.exitCode = 1;
    });
    server.listen(port, '127.0.0.1', () => console.log(`ZeroCode: http://localhost:${port} (Node ${process.versions.node})`));
  }
}
