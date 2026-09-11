import fs from "fs";
import path from "path";
import zlib from "zlib";

function crc32(buf) {
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  table[i] = c;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  const combined = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(combined), 0);
  return Buffer.concat([len, combined, crcBuf]);
}

function createPng(width, height, getPixel) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = makeChunk("IHDR", ihdr);

  // Scanlines
  const rawData = Buffer.alloc(height * (width * 4 + 1));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // filter byte None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const idatData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk("IDAT", idatData);
  const iendChunk = makeChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate the MediPulse Medical Pulse Icon
function renderMediPulsePixel(x, y, width, height, isMaskable = false) {
  const nx = x / width;
  const ny = y / height;

  // Maskable icons need a safe zone (inner 80% circle/rounded area)
  const margin = isMaskable ? 0.08 : 0.06;
  const cornerRadius = isMaskable ? 0.0 : 0.22;

  let bgR = 0, bgG = 0, bgB = 0, bgA = 0;

  if (isMaskable) {
    // Full bleed background for maskable
    const grad = (nx + ny) / 2;
    bgR = Math.round(2 + grad * (13 - 2));
    bgG = Math.round(132 + grad * (148 - 132));
    bgB = Math.round(199 + grad * (136 - 199));
    bgA = 255;
  } else {
    // Rounded rect
    const rx = Math.max(0, Math.abs(nx - 0.5) - (0.5 - margin - cornerRadius));
    const ry = Math.max(0, Math.abs(ny - 0.5) - (0.5 - margin - cornerRadius));
    const dist = Math.sqrt(rx * rx + ry * ry);

    if (dist <= cornerRadius) {
      const grad = (nx + ny) / 2;
      bgR = Math.round(2 + grad * (13 - 2)); // #0284c7 -> #0d9488
      bgG = Math.round(132 + grad * (148 - 132));
      bgB = Math.round(199 + grad * (136 - 199));
      bgA = 255;
    } else {
      return [0, 0, 0, 0];
    }
  }

  // Draw Medical Cross + Pulse Wave
  // Center is (0.5, 0.5)
  // Pulse wave points: normalized coords
  const cx = 0.5;
  const cy = 0.5;

  // Let's check distance to the ECG pulse line:
  // Polyline: [0.22, 0.5] -> [0.34, 0.5] -> [0.40, 0.38] -> [0.46, 0.64] -> [0.52, 0.28] -> [0.58, 0.56] -> [0.64, 0.5] -> [0.78, 0.5]
  const pts = [
    [0.22, 0.50],
    [0.34, 0.50],
    [0.40, 0.36],
    [0.46, 0.65],
    [0.52, 0.26],
    [0.58, 0.58],
    [0.64, 0.50],
    [0.78, 0.50]
  ];

  let minDistToLine = 999;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i+1];
    const d = distToSegment(nx, ny, x1, y1, x2, y2);
    if (d < minDistToLine) minDistToLine = d;
  }

  // Also medical cross accent at top right or heart outline
  const lineWidth = 0.038;
  if (minDistToLine < lineWidth) {
    const edge = Math.max(0, Math.min(1, (lineWidth - minDistToLine) / 0.008));
    return [
      Math.round(255 * edge + bgR * (1 - edge)),
      Math.round(255 * edge + bgG * (1 - edge)),
      Math.round(255 * edge + bgB * (1 - edge)),
      255
    ];
  }

  // Medical Plus (+) symbol in top-right
  const plusCenterX = 0.74;
  const plusCenterY = 0.28;
  const plusSize = 0.06;
  const plusThick = 0.022;
  const inPlusH = Math.abs(nx - plusCenterX) <= plusSize && Math.abs(ny - plusCenterY) <= plusThick;
  const inPlusV = Math.abs(nx - plusCenterX) <= plusThick && Math.abs(ny - plusCenterY) <= plusSize;
  if (inPlusH || inPlusV) {
    return [255, 255, 255, 255];
  }

  return [bgR, bgG, bgB, bgA];
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * (x2 - x1);
  const projY = y1 + t * (y2 - y1);
  return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
}

const outDir = path.join(process.cwd(), "public", "icons");
fs.mkdirSync(outDir, { recursive: true });

console.log("Generating 192x192 PNG...");
const png192 = createPng(192, 192, (x, y, w, h) => renderMediPulsePixel(x, y, w, h, false));
fs.writeFileSync(path.join(outDir, "icon-192x192.png"), png192);

console.log("Generating 512x512 PNG...");
const png512 = createPng(512, 512, (x, y, w, h) => renderMediPulsePixel(x, y, w, h, false));
fs.writeFileSync(path.join(outDir, "icon-512x512.png"), png512);

console.log("Generating Maskable 192x192 PNG...");
const maskable192 = createPng(192, 192, (x, y, w, h) => renderMediPulsePixel(x, y, w, h, true));
fs.writeFileSync(path.join(outDir, "icon-maskable-192x192.png"), maskable192);

console.log("Generating Maskable 512x512 PNG...");
const maskable512 = createPng(512, 512, (x, y, w, h) => renderMediPulsePixel(x, y, w, h, true));
fs.writeFileSync(path.join(outDir, "icon-maskable-512x512.png"), maskable512);

console.log("Generating Apple Touch Icon 180x180 PNG...");
const appleIcon = createPng(180, 180, (x, y, w, h) => renderMediPulsePixel(x, y, w, h, false));
fs.writeFileSync(path.join(outDir, "apple-touch-icon.png"), appleIcon);

// Copy apple-touch-icon to public root as well
fs.writeFileSync(path.join(process.cwd(), "public", "apple-touch-icon.png"), appleIcon);

// SVG version
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#0d9488" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#0d9488" flood-opacity="0.35"/>
    </filter>
  </defs>
  <rect x="32" y="32" width="448" height="448" rx="100" fill="url(#grad)" filter="url(#shadow)"/>
  <path d="M112 256h64l32-72 32 148 32-192 32 164 32-48h64" fill="none" stroke="#ffffff" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M378 136v32M362 152h32" fill="none" stroke="#ffffff" stroke-width="12" stroke-linecap="round"/>
</svg>`;
fs.writeFileSync(path.join(outDir, "icon.svg"), svgContent);
fs.writeFileSync(path.join(process.cwd(), "public", "icon.svg"), svgContent);

console.log("All PWA icons generated successfully!");
