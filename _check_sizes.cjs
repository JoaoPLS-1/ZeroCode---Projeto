const fs = require('fs');
const files = [
  'assets/npcs/idle/edu.png','assets/npcs/idle/luna.png',
  'assets/npcs/idle/mark.png','assets/npcs/idle/rick.png',
  'assets/npcs/idle/steve.png'
];
for (const f of files) {
  const buf = Buffer.alloc(24);
  const fd = fs.openSync(f, 'r');
  fs.readSync(fd, buf, 0, 24, 0);
  fs.closeSync(fd);
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  console.log(`${f}: ${w}x${h}`);
}

