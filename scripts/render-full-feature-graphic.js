const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { GLYPHS } = require('./vector-font');

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

function layoutText(str, startX, startY, height, letterSpacing = 8) {
  const scale = height / 100;
  let curX = startX;
  const segments = [];

  for (const ch of str.toUpperCase()) {
    const g = GLYPHS[ch] || GLYPHS[' '];
    for (const [[x1, y1], [x2, y2]] of g.segments) {
      segments.push([
        [curX + x1 * scale, startY + y1 * scale],
        [curX + x2 * scale, startY + y2 * scale]
      ]);
    }
    curX += g.width * scale + letterSpacing;
  }
  return { segments, totalWidth: curX - startX };
}

const W = 1024;
const H = 500;

// Right emblem specs
const emblemCX = 740;
const emblemCY = 250;
const emblemSize = 340;
const emblemHalf = emblemSize / 2;
const cornerRadius = emblemSize * 0.24;

const zapNormalized = [
  [1, -10],
  [-9, 2],
  [0, 2],
  [-1, 10],
  [9, -2],
  [0, -2]
];
const boltScale = emblemSize / 26;
const poly = zapNormalized.map(([x, y]) => [emblemCX + x * boltScale, emblemCY + y * boltScale]);

// Typography layout
const pillText = layoutText("EDSA NATIVE", 125, 96, 14, 3);
const titleLine1 = layoutText("EDSA", 80, 142, 54, 8);
const powerText = layoutText("POWER", 80, 208, 48, 6);
const trackerText = layoutText("TRACKER", 80 + powerText.totalWidth + 16, 208, 48, 6);
const subTitle = layoutText("FREETOWN ELECTRICITY MONITOR", 82, 276, 17, 3.5);

// Badges
const badge1Text = layoutText("LIVE GRID", 98, 337, 14, 2.5);
const badge2Text = layoutText("HAZARD OPS", 240, 337, 14, 2.5);
const badge3Text = layoutText("GPS VERIFIED", 390, 337, 14, 2.5);

// Footer
const footerText = layoutText("BRIDGETECH IT SERVICES", 82, 400, 13, 2.5);

console.log('Rendering high-precision Feature Graphic...');

const pngBuffer = createPNG(W, H, (x, y) => {
  const u = x / W;
  const v = y / H;

  const distEmblem = Math.hypot(x - emblemCX, y - emblemCY);
  const blueSpot = Math.max(0, 1 - distEmblem / 460);
  const redSpot = Math.max(0, 1 - distEmblem / 260);
  const leftSpot = Math.max(0, 1 - Math.hypot(x - 280, y - 250) / 420);

  let bgR = 4 + blueSpot * 16 + redSpot * 38 + leftSpot * 10;
  let bgG = 8 + blueSpot * 38 + redSpot * 5 + leftSpot * 22;
  let bgB = 18 + blueSpot * 100 + redSpot * 12 + leftSpot * 50;

  // Grid
  const gridX = x % 44;
  const gridY = y % 44;
  if ((gridX === 0 || gridY === 0) && (x < 540 || distEmblem > 220)) {
    const gridAlpha = 0.04 * (1 - v * 0.3);
    bgR = bgR * (1 - gridAlpha) + 56 * gridAlpha;
    bgG = bgG * (1 - gridAlpha) + 189 * gridAlpha;
    bgB = bgB * (1 - gridAlpha) + 248 * gridAlpha;
  }

  // Right Emblem (Squircle + Red Bolt)
  const relX = x - emblemCX;
  const relY = y - emblemCY;
  const qx = Math.abs(relX) - (emblemHalf - cornerRadius);
  const qy = Math.abs(relY) - (emblemHalf - cornerRadius);
  const distSquircle = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0);
  const sdSquircle = distSquircle - cornerRadius;

  if (sdSquircle > 0 && sdSquircle < 45) {
    const shadowAlpha = Math.pow(1 - sdSquircle / 45, 2) * 0.65;
    bgR = bgR * (1 - shadowAlpha) + 30 * shadowAlpha;
    bgG = bgG * (1 - shadowAlpha) + 58 * shadowAlpha;
    bgB = bgB * (1 - shadowAlpha) + 138 * shadowAlpha;
  }

  const squircleAA = Math.max(0, Math.min(1, 0.5 - sdSquircle));

  if (squircleAA > 0) {
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

    // Aura ring
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

    // Red Bolt
    const sd = sdPolygon([x, y], poly);
    const boltGlowRad = emblemSize * 0.07;
    let boltGlowAlpha = 0;
    if (sd > 0 && sd < boltGlowRad) {
      boltGlowAlpha = Math.pow(1 - sd / boltGlowRad, 1.8) * 0.65;
    }

    const boltAA = Math.max(0, Math.min(1, 0.5 - sd));
    const boltYNorm = Math.max(0, Math.min(1, (relY + emblemHalf * 0.7) / (emblemHalf * 1.4)));
    let boltR = 255 - boltYNorm * 45;
    let boltG = 55 - boltYNorm * 35;
    let boltB = 75 - boltYNorm * 50;

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

  // Top Pill: EDSA NATIVE (x: 80 to 250, y: 88 to 118)
  if (x >= 80 && x <= 250 && y >= 88 && y <= 118) {
    const pillRadius = 15;
    const dx = Math.max(Math.abs(x - 165) - (85 - pillRadius), 0);
    const dy = Math.max(Math.abs(y - 103) - (15 - pillRadius), 0);
    const distPill = Math.hypot(dx, dy);
    if (distPill <= pillRadius) {
      const pillAA = Math.max(0, Math.min(1, pillRadius + 0.5 - distPill));
      bgR = bgR * (1 - pillAA) + 22 * pillAA;
      bgG = bgG * (1 - pillAA) + 45 * pillAA;
      bgB = bgB * (1 - pillAA) + 115 * pillAA;

      // Red glowing dot
      const dotDist = Math.hypot(x - 104, y - 103);
      if (dotDist <= 4.5) {
        const dotAA = Math.max(0, Math.min(1, 4.5 - dotDist));
        bgR = bgR * (1 - dotAA) + 239 * dotAA;
        bgG = bgG * (1 - dotAA) + 68 * dotAA;
        bgB = bgB * (1 - dotAA) + 68 * dotAA;
      }
    }
  }

  // Three Feature Pills:
  // Pill 1: LIVE GRID (x: 80 to 205)
  // Pill 2: HAZARD OPS (x: 220 to 360)
  // Pill 3: GPS VERIFIED (x: 375 to 535)
  const pills = [
    { x1: 80, x2: 205 },
    { x1: 220, x2: 360 },
    { x1: 375, x2: 535 }
  ];
  for (let i = 0; i < pills.length; i++) {
    const p = pills[i];
    if (x >= p.x1 && x <= p.x2 && y >= 326 && y <= 362) {
      const pRad = 12;
      const cCX = (p.x1 + p.x2) / 2;
      const cHalfW = (p.x2 - p.x1) / 2;
      const dx = Math.max(Math.abs(x - cCX) - (cHalfW - pRad), 0);
      const dy = Math.max(Math.abs(y - 344) - (18 - pRad), 0);
      const dP = Math.hypot(dx, dy);
      if (dP <= pRad) {
        const pAA = Math.max(0, Math.min(1, pRad + 0.5 - dP));
        bgR = bgR * (1 - pAA) + 18 * pAA;
        bgG = bgG * (1 - pAA) + 30 * pAA;
        bgB = bgB * (1 - pAA) + 70 * pAA;
      }
    }
  }

  function renderStrokeGroup(segments, strokeWidth, targetR, targetG, targetB, glowRad = 0, glowR = 0, glowG = 0, glowB = 0) {
    let minD = Infinity;
    for (const [p1, p2] of segments) {
      const d = distToSegment([x, y], p1, p2);
      if (d < minD) minD = d;
      if (minD < strokeWidth * 0.5) break;
    }

    if (glowRad > 0 && minD < glowRad) {
      const gA = Math.pow(1 - minD / glowRad, 2) * 0.45;
      bgR = bgR * (1 - gA) + glowR * gA;
      bgG = bgG * (1 - gA) + glowG * gA;
      bgB = bgB * (1 - gA) + glowB * gA;
    }

    const halfW = strokeWidth * 0.5;
    if (minD <= halfW + 0.5) {
      const aa = Math.max(0, Math.min(1, halfW + 0.5 - minD));
      bgR = bgR * (1 - aa) + targetR * aa;
      bgG = bgG * (1 - aa) + targetG * aa;
      bgB = bgB * (1 - aa) + targetB * aa;
    }
  }

  if (x < 560) {
    // Pill text: "EDSA NATIVE"
    if (y >= 90 && y <= 118 && x >= 120 && x <= 245) {
      renderStrokeGroup(pillText.segments, 2.4, 220, 235, 255);
    }

    // Main Title: "EDSA"
    if (y >= 135 && y <= 200 && x >= 75 && x <= 320) {
      renderStrokeGroup(titleLine1.segments, 7.5, 255, 255, 255, 14, 56, 189, 248);
    }

    // "POWER" in vivid red
    if (y >= 200 && y <= 265 && x >= 75 && x <= 275) {
      renderStrokeGroup(powerText.segments, 6.5, 255, 65, 80, 12, 239, 68, 68);
    }

    // "TRACKER" in bright white
    if (y >= 200 && y <= 265 && x >= 265 && x <= 555) {
      renderStrokeGroup(trackerText.segments, 6.5, 245, 248, 255, 10, 56, 189, 248);
    }

    // Subtitle
    if (y >= 270 && y <= 300 && x >= 80 && x <= 520) {
      renderStrokeGroup(subTitle.segments, 2.6, 148, 180, 220);
    }

    // Badges:
    if (y >= 330 && y <= 360) {
      if (x >= 90 && x <= 200) renderStrokeGroup(badge1Text.segments, 2.2, 56, 189, 248);
      if (x >= 230 && x <= 355) renderStrokeGroup(badge2Text.segments, 2.2, 248, 113, 113);
      if (x >= 380 && x <= 530) renderStrokeGroup(badge3Text.segments, 2.2, 74, 222, 128);
    }

    // Footer Credit
    if (y >= 395 && y <= 420 && x >= 80 && x <= 360) {
      renderStrokeGroup(footerText.segments, 2.0, 100, 116, 139);
    }
  }

  return [bgR, bgG, bgB, 255];
});

fs.writeFileSync(path.join(__dirname, '../public/assets/feature-graphic.png'), pngBuffer);
console.log('Successfully re-rendered Feature Graphic at public/assets/feature-graphic.png!');
