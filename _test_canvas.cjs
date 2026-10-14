const fs = require('fs');
const { createCanvas, loadImage } = (() => {
  // Let's see if we have canvas or if we can use pure JS pngjs / buffer
  try {
    return require('canvas');
  } catch (e) {
    return {};
  }
})();
console.log('Testing canvas availability:', typeof createCanvas);
