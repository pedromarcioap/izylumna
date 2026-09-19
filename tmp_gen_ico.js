import fs from 'fs';
import path from 'path';

function generateIco() {
  const width = 32;
  const height = 32;
  const pixels = new Uint8Array(width * height * 4); // RGBA

  // Helper to draw circle
  function isInsideCircle(x, y, cx, cy, r) {
    const dx = x - cx;
    const dy = y - cy;
    return dx * dx + dy * dy <= r * r;
  }

  // Helper distance to line segment
  function distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  // Polygon vertices for 32x32 scaled from 40x40 (scale factor 32/40 = 0.8)
  // Original 40x40 points: (20,7), (32,15), (28,29), (12,29), (8,15)
  const polyPoints = [
    [20 * 0.8, 7 * 0.8],
    [32 * 0.8, 15 * 0.8],
    [28 * 0.8, 29 * 0.8],
    [12 * 0.8, 29 * 0.8],
    [8 * 0.8, 15 * 0.8]
  ];

  const center = 16;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      const index = (y * width + x) * 4;

      const distFromCenter = Math.hypot(px - center, py - center);

      // Default transparent
      let r = 0, g = 0, b = 0, a = 0;

      if (distFromCenter <= 15.5) {
        // Outer circle background #161224
        r = 0x16; g = 0x12; b = 0x24; a = 255;

        // Outer border #8300E9
        if (distFromCenter >= 13.5 && distFromCenter <= 15.5) {
          r = 0x83; g = 0x00; b = 0xE9; a = 255;
        }

        // Polygon lines #8300E9
        let minDistToPoly = 999;
        for (let i = 0; i < polyPoints.length; i++) {
          const p1 = polyPoints[i];
          const p2 = polyPoints[(i + 1) % polyPoints.length];
          const d = distToSegment(px, py, p1[0], p1[1], p2[0], p2[1]);
          if (d < minDistToPoly) minDistToPoly = d;
        }

        if (minDistToPoly <= 1.2) {
          r = 0x83; g = 0x00; b = 0xE9; a = 255;
        }

        // Central white core #FFFFFF
        if (distFromCenter <= 3.2) {
          r = 255; g = 255; b = 255; a = 255;
        }
      }

      pixels[index] = r;
      pixels[index + 1] = g;
      pixels[index + 2] = b;
      pixels[index + 3] = a;
    }
  }

  // Build ICO File Buffer
  const headerSize = 6;
  const directorySize = 16;
  const bmiHeaderSize = 40;
  const pixelDataSize = width * height * 4;
  const andMaskSize = (width / 8) * height; // 128 bytes
  const imageSize = bmiHeaderSize + pixelDataSize + andMaskSize;
  const totalSize = headerSize + directorySize + imageSize;

  const buf = Buffer.alloc(totalSize);

  // ICONDIR
  buf.writeUInt16LE(0, 0); // Reserved
  buf.writeUInt16LE(1, 2); // Type = 1 (ICO)
  buf.writeUInt16LE(1, 4); // Image count = 1

  // ICONDIRENTRY
  buf.writeUInt8(width, 6);
  buf.writeUInt8(height, 7);
  buf.writeUInt8(0, 8); // Colors
  buf.writeUInt8(0, 9); // Reserved
  buf.writeUInt16LE(1, 10); // Color planes
  buf.writeUInt16LE(32, 12); // Bits per pixel
  buf.writeUInt32LE(imageSize, 14); // Image size in bytes
  buf.writeUInt32LE(headerSize + directorySize, 18); // Offset

  // BITMAPINFOHEADER
  let offset = headerSize + directorySize;
  buf.writeUInt32LE(bmiHeaderSize, offset);
  buf.writeInt32LE(width, offset + 4);
  buf.writeInt32LE(height * 2, offset + 8); // Height * 2 for ICO BMP
  buf.writeUInt16LE(1, offset + 12); // Planes
  buf.writeUInt16LE(32, offset + 14); // BitCount
  buf.writeUInt32LE(0, offset + 16); // Compression BI_RGB
  buf.writeUInt32LE(pixelDataSize + andMaskSize, offset + 20);
  buf.writeInt32LE(0, offset + 24);
  buf.writeInt32LE(0, offset + 28);
  buf.writeUInt32LE(0, offset + 32);
  buf.writeUInt32LE(0, offset + 36);

  // Pixel data (BMP is stored bottom-to-top, BGRA format)
  offset += bmiHeaderSize;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      buf.writeUInt8(pixels[idx + 2], offset);     // B
      buf.writeUInt8(pixels[idx + 1], offset + 1); // G
      buf.writeUInt8(pixels[idx], offset + 2);     // R
      buf.writeUInt8(pixels[idx + 3], offset + 3); // A
      offset += 4;
    }
  }

  // AND mask (all zeros for transparent background using Alpha channel)
  buf.fill(0, offset, offset + andMaskSize);

  fs.writeFileSync('public/favicon.ico', buf);
  console.log('Successfully generated public/favicon.ico!');
}

generateIco();
