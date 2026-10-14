const fs = require('fs');
const zlib = require('zlib');

function decodePNG(filePath) {
  const buf = fs.readFileSync(filePath);
  let pos = 8; // skip signature
  let width, height, colorType, bitDepth;
  const idatChunks = [];

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IHDR') {
      width = buf.readUInt32BE(pos + 8);
      height = buf.readUInt32BE(pos + 12);
      bitDepth = buf[pos + 16];
      colorType = buf[pos + 17];
    } else if (type === 'IDAT') {
      idatChunks.push(buf.subarray(pos + 8, pos + 8 + len));
    } else if (type === 'IEND') {
      break;
    }
    pos += 12 + len;
  }

  const compressed = Buffer.concat(idatChunks);
  const decompressed = zlib.inflateSync(compressed);

  // Unfilter scanlines (assuming RGBA 8-bit, colorType 6)
  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const pixels = Buffer.alloc(width * height * 4);

  let srcPos = 0;
  for (let y = 0; y < height; y++) {
    const filter = decompressed[srcPos++];
    const rowStart = y * stride;
    const prevRowStart = (y - 1) * stride;

    for (let x = 0; x < stride; x++) {
      const raw = decompressed[srcPos++];
      const a = x >= bytesPerPixel ? pixels[rowStart + x - bytesPerPixel] : 0;
      const b = y > 0 ? pixels[prevRowStart + x] : 0;
      const c = (x >= bytesPerPixel && y > 0) ? pixels[prevRowStart + x - bytesPerPixel] : 0;

      let val = raw;
      if (filter === 1) val = (raw + a) & 0xff;
      else if (filter === 2) val = (raw + b) & 0xff;
      else if (filter === 3) val = (raw + Math.floor((a + b) / 2)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        let pr = a;
        if (pb < pa && pb <= pc) pr = b;
        else if (pc < pa && pc < pb) pr = c;
        val = (raw + pr) & 0xff;
      }
      pixels[rowStart + x] = val;
    }
  }

  return { width, height, pixels };
}

function testMeasure(pngPath, rows) {
  const { width, height, pixels } = decodePNG(pngPath);
  const cw = width / 4, ch = height / rows;
  const frames = [];
  for (let frame = 0; frame < 4 * rows; frame++) {
    const ox = Math.round(frame % 4 * cw), oy = Math.round(Math.floor(frame / 4) * ch);
    const wCell = Math.round((frame % 4 + 1) * cw) - ox;
    const hCell = Math.round((Math.floor(frame / 4) + 1) * ch) - oy;
    let left = wCell, top = hCell, right = 0, bottom = 0;
    for (let y = 0; y < hCell; y++) {
      for (let x = 0; x < wCell; x++) {
        if (pixels[((oy + y) * width + ox + x) * 4 + 3] < 180) continue;
        left = Math.min(left, x); right = Math.max(right, x);
        top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
    }
    const crop = right > left && bottom > top
      ? { x: ox + left, y: oy + top, w: right - left + 1, h: bottom - top + 1, bottomMargin: hCell - 1 - bottom }
      : { x: ox, y: oy, w: wCell, h: hCell, bottomMargin: 0 };
    frames.push(crop);
  }
  return { width, height, cw, ch, frames };
}

for (const name of ['down.png', 'up.png', 'left.png', 'right.png']) {
  const { width, height, pixels } = decodePNG('assets/player/main/' + name);
  let left = width, top = height, right = 0, bottom = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (pixels[(y * width + x) * 4 + 3] < 180) continue;
      left = Math.min(left, x); right = Math.max(right, x);
      top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
  }
  console.log(name, `${width}x${height}`, `opaque bounds: [${left},${top},${right},${bottom}]`, `bottomMargin: ${height - 1 - bottom}`, `opaqueH: ${bottom - top + 1}`, `opaqueW: ${right - left + 1}`);
}




for (const name of ['edu.png', 'luna.png', 'rick.png']) {
  const res = testMeasure('assets/npcs/idle/' + name, 2);
  console.log('NPC idle ' + name, res.width, 'x', res.height, 'cw:', res.cw, 'ch:', res.ch);
  console.log('  frame 0:', res.frames[0], 'frame 4:', res.frames[4]);
}

