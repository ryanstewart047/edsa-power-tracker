const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Minimal pure-Node PNG encoder
function createPNG(width, height, getPixel) {
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(height * rowSize);

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y);
      rawData[offset++] = Math.max(0, Math.min(255, Math.round(r)));
      rawData[offset++] = Math.max(0, Math.min(255, Math.round(g)));
      rawData[offset++] = Math.max(0, Math.min(255, Math.round(b)));
      rawData[offset++] = Math.max(0, Math.min(255, Math.round(a)));
    }
  }

  const deflated = zlib.deflateSync(rawData, { level: 8 });

  const table = (() => {
    const t = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
      }
      t[n] = c;
    }
    return t;
  })();

  function crc32(buf) {
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflated),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

// Distance to polygon for bolt
function pointInPoly(pt, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = ((yi > pt[1]) !== (yj > pt[1])) &&
      (pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi + 1e-9) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function distToSegment(p, v, w) {
  const l2 = (v[0]-w[0])*(v[0]-w[0]) + (v[1]-w[1])*(v[1]-w[1]);
  if (l2 === 0) return Math.hypot(p[0]-v[0], p[1]-v[1]);
  let t = ((p[0]-v[0])*(w[0]-v[0]) + (p[1]-v[1])*(w[1]-v[1])) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (v[0] + t*(w[0]-v[0])), p[1] - (v[1] + t*(w[1]-v[1])));
}

function distToPolyEdges(pt, poly) {
  let minD = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const d = distToSegment(pt, poly[i], poly[j]);
    if (d < minD) minD = d;
  }
  return minD;
}

function sdPolygon(pt, poly) {
  const d = distToPolyEdges(pt, poly);
  return pointInPoly(pt, poly) ? -d : d;
}

// Canonical Lucide Zap coordinates normalized around (0,0)
const zapNormalized = [
  [1, -10],
  [-9, 2],
  [0, 2],
  [-1, 10],
  [9, -2],
  [0, -2]
];

const W = 1024;
const H = 500;

// Right emblem center and size
const emblemCX = 740;
const emblemCY = 250;
const emblemSize = 340;
const emblemHalf = emblemSize / 2;
const cornerRadius = emblemSize * 0.24;

const boltScale = emblemSize / 26; // Scale of bolt inside emblem
const poly = zapNormalized.map(([x, y]) => [emblemCX + x * boltScale, emblemCY + y * boltScale]);

console.log('Generating 1024x500 Google Play Feature Graphic...');

const pngBuffer = createPNG(W, H, (x, y) => {
  // 1. Background Scene: Cyber Navy with Cinematic Lighting
  const u = x / W;
  const v = y / H;

  // Blue spotlight on right behind emblem
  const distEmblem = Math.hypot(x - emblemCX, y - emblemCY);
  const blueSpot = Math.max(0, 1 - distEmblem / 450);

  // Red accent ambient backlight (fiery warmth emanating from bolt)
  const redSpot = Math.max(0, 1 - distEmblem / 260);

  // Left side subtle ambient electric glow
  const leftSpot = Math.max(0, 1 - Math.hypot(x - 260, y - 250) / 400);

  let bgR = 4 + blueSpot * 15 + redSpot * 35 + leftSpot * 8;
  let bgG = 8 + blueSpot * 35 + redSpot * 5 + leftSpot * 18;
  let bgB = 18 + blueSpot * 95 + redSpot * 10 + leftSpot * 45;

  // Grid lines (subtle high-tech backdrop)
  const gridX = x % 48;
  const gridY = y % 48;
  if ((gridX === 0 || gridY === 0) && (x < 560 || distEmblem > 220)) {
    const gridAlpha = 0.045 * (1 - v * 0.3);
    bgR = bgR * (1 - gridAlpha) + 56 * gridAlpha;
    bgG = bgG * (1 - gridAlpha) + 189 * gridAlpha;
    bgB = bgB * (1 - gridAlpha) + 248 * gridAlpha;
  }

  // 2. Large Central Emblem (Red Power Symbol + Gradient Blue Squircle)
  const relX = x - emblemCX;
  const relY = y - emblemCY;

  // Squircle signed distance
  const qx = Math.abs(relX) - (emblemHalf - cornerRadius);
  const qy = Math.abs(relY) - (emblemHalf - cornerRadius);
  const distSquircle = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0);
  const sdSquircle = distSquircle - cornerRadius;

  // External drop shadow for squircle
  if (sdSquircle > 0 && sdSquircle < 45) {
    const shadowAlpha = Math.pow(1 - sdSquircle / 45, 2) * 0.65;
    bgR = bgR * (1 - shadowAlpha) + 30 * shadowAlpha;
    bgG = bgG * (1 - shadowAlpha) + 58 * shadowAlpha;
    bgB = bgB * (1 - shadowAlpha) + 138 * shadowAlpha;
  }

  // Squircle antialiasing
  const squircleAA = Math.max(0, Math.min(1, 0.5 - sdSquircle));

  if (squircleAA > 0) {
    // Gradient Blue inside squircle
    const emblemU = (relX + emblemHalf) / emblemSize;
    const emblemV = (relY + emblemHalf) / emblemSize;
    const diag = emblemU * 0.45 + emblemV * 0.55;

    let sqR, sqG, sqB;
    if (diag < 0.35) {
      const t = diag / 0.35;
      sqR = 2 + t * (29 - 2);
      sqG = 132 + t * (78 - 132);
      sqB = 199 + t * (216 - 199);
    } else if (diag < 0.75) {
      const t = (diag - 0.35) / 0.40;
      sqR = 29 + t * (23 - 29);
      sqG = 78 + t * (37 - 78);
      sqB = 216 + t * (84 - 216);
    } else {
      const t = (diag - 0.75) / 0.25;
      sqR = 23 - t * 14;
      sqG = 37 - t * 24;
      sqB = 84 - t * 53;
    }

    // Concentric electric aura ring
    const distFromEmblemCenter = Math.hypot(relX, relY);
    const ringR = emblemSize * 0.39;
    const rDist = Math.abs(distFromEmblemCenter - ringR);
    if (rDist < emblemSize * 0.05) {
      const ringAlpha = Math.pow(1 - rDist / (emblemSize * 0.05), 1.5) * 0.35;
      sqR = sqR * (1 - ringAlpha) + 56 * ringAlpha;
      sqG = sqG * (1 - ringAlpha) + 189 * ringAlpha;
      sqB = sqB * (1 - ringAlpha) + 248 * ringAlpha;
    }

    // Inner highlight border
    const borderDist = Math.abs(sdSquircle + 1.5);
    if (borderDist < 2.5) {
      const bAlpha = (1 - borderDist / 2.5) * 0.35;
      sqR = sqR * (1 - bAlpha) + 255 * bAlpha;
      sqG = sqG * (1 - bAlpha) + 255 * bAlpha;
      sqB = sqB * (1 - bAlpha) + 255 * bAlpha;
    }

    // 3. Power Bolt (Red) inside squircle
    const sd = sdPolygon([x, y], poly);

    // Warm red glow around bolt
    const boltGlowRad = emblemSize * 0.07;
    let boltGlowAlpha = 0;
    if (sd > 0 && sd < boltGlowRad) {
      boltGlowAlpha = Math.pow(1 - sd / boltGlowRad, 1.8) * 0.65;
    }

    const boltAA = Math.max(0, Math.min(1, 0.5 - sd));

    // Bolt color
    const boltYNorm = Math.max(0, Math.min(1, (relY + emblemHalf * 0.7) / (emblemHalf * 1.4)));
    let boltR = 255 - boltYNorm * 45;
    let boltG = 55 - boltYNorm * 35;
    let boltB = 75 - boltYNorm * 50;

    // Specular edge highlight
    if (boltAA > 0.5 && sd > -5 && (relX < 0 || relY < 0)) {
      const spec = Math.pow(1 - Math.abs(sd + 2.5) / 2.5, 2) * 0.3;
      boltR = boltR * (1 - spec) + 255 * spec;
      boltG = boltG * (1 - spec) + 200 * spec;
      boltB = boltB * (1 - spec) + 200 * spec;
    }

    if (boltGlowAlpha > 0 && boltAA < 1) {
      sqR = sqR * (1 - boltGlowAlpha) + 244 * boltGlowAlpha;
      sqG = sqG * (1 - boltGlowAlpha) + 63 * boltGlowAlpha;
      sqB = sqB * (1 - boltGlowAlpha) + 94 * boltGlowAlpha;
    }

    const emblemFinalR = sqR * (1 - boltAA) + boltR * boltAA;
    const emblemFinalG = sqG * (1 - boltAA) + boltG * boltAA;
    const emblemFinalB = sqB * (1 - boltAA) + boltB * boltAA;

    bgR = bgR * (1 - squircleAA) + emblemFinalR * squircleAA;
    bgG = bgG * (1 - squircleAA) + emblemFinalG * squircleAA;
    bgB = bgB * (1 - squircleAA) + emblemFinalB * squircleAA;
  }

  // 4. Clean Graphic UI Badges on the Left Side
  // Pill: EDSA NATIVE PLATFORM (x: 80 to 285, y: 88 to 118, rounded)
  if (x >= 80 && x <= 285 && y >= 88 && y <= 118) {
    const pillRadius = 15;
    const dx = Math.max(Math.abs(x - 182.5) - (102.5 - pillRadius), 0);
    const dy = Math.max(Math.abs(y - 103) - (15 - pillRadius), 0);
    const distPill = Math.hypot(dx, dy);
    if (distPill <= pillRadius) {
      const pillAA = Math.max(0, Math.min(1, pillRadius + 0.5 - distPill));
      bgR = bgR * (1 - pillAA) + 25 * pillAA;
      bgG = bgG * (1 - pillAA) + 50 * pillAA;
      bgB = bgB * (1 - pillAA) + 120 * pillAA;

      // Small glowing red dot on left (x: 102, y: 103, radius: 4)
      const dotDist = Math.hypot(x - 102, y - 103);
      if (dotDist <= 4.5) {
        const dotAA = Math.max(0, Math.min(1, 4.5 - dotDist));
        bgR = bgR * (1 - dotAA) + 239 * dotAA;
        bgG = bgG * (1 - dotAA) + 68 * dotAA;
        bgB = bgB * (1 - dotAA) + 68 * dotAA;
      }
    }
  }

  // Feature Card Badges on bottom-left:
  const inCard1 = (x >= 80 && x <= 245 && y >= 360 && y <= 405);
  const inCard2 = (x >= 260 && x <= 425 && y >= 360 && y <= 405);
  if (inCard1 || inCard2) {
    const cCX = inCard1 ? 162.5 : 342.5;
    const cCY = 382.5;
    const cHalfW = 82.5;
    const cHalfH = 22.5;
    const cRadius = 12;
    const dx = Math.max(Math.abs(x - cCX) - (cHalfW - cRadius), 0);
    const dy = Math.max(Math.abs(y - cCY) - (cHalfH - cRadius), 0);
    const distCard = Math.hypot(dx, dy);
    if (distCard <= cRadius) {
      const cAA = Math.max(0, Math.min(1, cRadius + 0.5 - distCard));
      const cardBgR = inCard1 ? 25 : 35;
      const cardBgG = inCard1 ? 35 : 20;
      const cardBgB = inCard1 ? 65 : 30;
      bgR = bgR * (1 - cAA) + cardBgR * cAA;
      bgG = bgG * (1 - cAA) + cardBgG * cAA;
      bgB = bgB * (1 - cAA) + cardBgB * cAA;
    }
  }

  return [bgR, bgG, bgB, 255];
});

fs.writeFileSync(path.join(__dirname, '../public/assets/feature-graphic.png'), pngBuffer);
console.log('Successfully written public/assets/feature-graphic.png (1024x500)');
