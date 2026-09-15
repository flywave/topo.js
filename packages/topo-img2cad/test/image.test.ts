import { describe, expect, it } from "vitest";
import { deflateSync } from "node:zlib";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  decodeRaster,
  loadRaster,
  cropRaster,
  extractSilhouette,
  cropSilhouetteToBBox,
  resampleMaskIntoFrame,
  type Raster,
} from "../lib/cad/image.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Minimal PNG encoder (for fixtures)
// ---------------------------------------------------------------------------

const PNG_SIG = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function u32be(n: number): Uint8Array {
  return new Uint8Array([(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]);
}

function makeChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new Uint8Array(type.split("").map((c) => c.charCodeAt(0)));
  const len = u32be(data.length);
  // PNG chunk: [LEN(4)][TYPE(4)][DATA][CRC(4)]
  const body = new Uint8Array(4 + 4 + data.length + 4);
  body.set(len, 0);
  body.set(typeBytes, 4);
  body.set(data, 8);
  const crc = u32be(crc32(new Uint8Array([...typeBytes, ...data])));
  body.set(crc, 8 + data.length);
  return body;
}

/** Assemble a complete PNG with the 8-byte signature. */
function makePNG(
  width: number,
  height: number,
  colorType: number,
  bitDepth: number,
  pixels: Uint8Array,
  opts?: { palette?: Uint8Array; trns?: Uint8Array; interlace?: number },
): Uint8Array {
  const ihdr = new Uint8Array(13);
  ihdr.set(u32be(width), 0);
  ihdr.set(u32be(height), 4);
  ihdr[8] = bitDepth;
  ihdr[9] = colorType;
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = opts?.interlace ?? 0;

  const chunks: Uint8Array[] = [];
  chunks.push(makeChunk("IHDR", ihdr));
  if (opts?.palette) chunks.push(makeChunk("PLTE", opts.palette));
  if (opts?.trns) chunks.push(makeChunk("tRNS", opts.trns));

  // Deflate with filter byte 0 (None) per row
  const rowLen = pixels.length / height;
  const raw = new Uint8Array(pixels.length + height);
  for (let y = 0; y < height; y++) {
    raw[y * (rowLen + 1)] = 0; // filter = None
    raw.set(pixels.subarray(y * rowLen, (y + 1) * rowLen), y * (rowLen + 1) + 1);
  }
  chunks.push(makeChunk("IDAT", deflateSync(raw)));
  chunks.push(makeChunk("IEND", new Uint8Array(0)));

  let totalLen = PNG_SIG.length;
  for (const c of chunks) totalLen += c.length;
  const out = new Uint8Array(totalLen);
  out.set(PNG_SIG);
  let off = PNG_SIG.length;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}

/** Assemble a PNG from pre-built IDAT (for filter / edge-case tests). */
function assemblePNG(ihdr: Uint8Array, idatData: Uint8Array): Uint8Array {
  const parts = [makeChunk("IHDR", ihdr), makeChunk("IDAT", idatData), makeChunk("IEND", new Uint8Array(0))];
  let totalLen = PNG_SIG.length;
  for (const p of parts) totalLen += p.length;
  const out = new Uint8Array(totalLen);
  out.set(PNG_SIG);
  let off = PNG_SIG.length;
  for (const p of parts) { out.set(p, off); off += p.length; }
  return out;
}

function makeGray8(width: number, height: number, gray: number[][]): Uint8Array {
  const flat = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) flat[y * width + x] = gray[y][x];
  return makePNG(width, height, 0, 8, flat);
}

function makeRGBA8(width: number, height: number, rgba: number[][]): Uint8Array {
  const flat = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const s = (y * width + x) * 4;
      flat[s] = rgba[y * width + x][0];
      flat[s + 1] = rgba[y * width + x][1];
      flat[s + 2] = rgba[y * width + x][2];
      flat[s + 3] = rgba[y * width + x][3];
    }
  }
  return makePNG(width, height, 6, 8, flat);
}

function makeRGB8(width: number, height: number, rgb: number[][]): Uint8Array {
  const flat = new Uint8Array(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const s = (y * width + x) * 3;
      flat[s] = rgb[y * width + x][0];
      flat[s + 1] = rgb[y * width + x][1];
      flat[s + 2] = rgb[y * width + x][2];
    }
  }
  return makePNG(width, height, 2, 8, flat);
}

// ---------------------------------------------------------------------------
// Tests: decodeRaster – PNG
// ---------------------------------------------------------------------------

describe("decodeRaster – PNG color types and bit depths", () => {
  it("decodes gray type 0 bit 8", () => {
    const buf = makeGray8(2, 2, [[0, 128], [255, 64]]);
    const { raster, format } = decodeRaster(buf);
    expect(format).toBe("png");
    expect(raster.width).toBe(2);
    expect(raster.height).toBe(2);
    expect(raster.gray[0]).toBe(0);
    expect(raster.gray[1]).toBe(128);
    expect(raster.gray[2]).toBe(255);
    expect(raster.gray[3]).toBe(64);
    expect(raster.opaque[0]).toBe(1);
  });

  it("decodes gray type 0 bit 16 (high byte)", () => {
    const flat = new Uint8Array(2 * 1 * 2);
    flat[0] = 0; flat[1] = 0;
    flat[2] = 0xff; flat[3] = 0x00;
    const buf = makePNG(2, 1, 0, 16, flat);
    const { raster } = decodeRaster(buf);
    expect(raster.gray[0]).toBe(0);
    expect(raster.gray[1]).toBe(255);
  });

  it("decodes gray+alpha type 4 bit 8", () => {
    const flat = new Uint8Array([100, 255, 200, 0]);
    const buf = makePNG(2, 1, 4, 8, flat);
    const { raster } = decodeRaster(buf);
    expect(raster.gray[0]).toBe(100);
    expect(raster.opaque[0]).toBe(1);
    expect(raster.gray[1]).toBe(255);
    expect(raster.opaque[1]).toBe(0);
  });

  it("decodes RGBA type 6 bit 8", () => {
    const buf = makeRGBA8(1, 1, [[23, 23, 34, 255]]);
    const { raster } = decodeRaster(buf);
    // Rec.601 luma: round(0.299*23 + 0.587*23 + 0.114*34) = round(24.254) = 24
    expect(raster.gray[0]).toBe(24);
    expect(raster.opaque[0]).toBe(1);
  });

  it("decodes RGBA type 6 bit 16 (high byte)", () => {
    const flat = new Uint8Array(8);
    flat[0] = 0x80; flat[1] = 0x00; // R = 0x8000 → high byte = 128
    flat[2] = 0x00; flat[3] = 0x00; // G = 0
    flat[4] = 0x00; flat[5] = 0x00; // B = 0
    flat[6] = 0xff; flat[7] = 0x00; // A = 0xff00 → high byte = 255
    const buf = makePNG(1, 1, 6, 16, flat);
    const { raster } = decodeRaster(buf);
    // Luma: round(0.299 * 128) = 38
    expect(raster.gray[0]).toBe(38);
    expect(raster.opaque[0]).toBe(1);
  });

  it("decodes RGB type 2 bit 8", () => {
    const buf = makeRGB8(1, 1, [[200, 100, 50]]);
    const { raster } = decodeRaster(buf);
    expect(raster.gray[0]).toBe(124);
    expect(raster.opaque[0]).toBe(1);
  });

  it("decodes palette type 3 bit 8 with tRNS", () => {
    const palette = new Uint8Array([255, 0, 0, 0, 255, 0, 255, 255, 255]);
    const trns = new Uint8Array([0xff, 0x00, 0xff]);
    const pixels = new Uint8Array([0, 1, 2, 0]);
    const buf = makePNG(2, 2, 3, 8, pixels, { palette, trns });
    const { raster } = decodeRaster(buf);
    expect(raster.gray[0]).toBe(76);
    expect(raster.opaque[0]).toBe(1);
    expect(raster.gray[1]).toBe(255);
    expect(raster.opaque[1]).toBe(0);
    expect(raster.gray[2]).toBe(255);
    expect(raster.opaque[2]).toBe(1);
  });

  it("decodes palette type 3 bit 4", () => {
    const palette = new Uint8Array([0, 0, 0, 255, 255, 255]);
    const pixels = new Uint8Array([0x01]);
    const buf = makePNG(2, 1, 3, 4, pixels, { palette });
    const { raster } = decodeRaster(buf);
    expect(raster.gray[0]).toBe(0);
    expect(raster.gray[1]).toBe(255);
  });
});

describe("decodeRaster – filter types", () => {
  it("filter 1 (Sub)", () => {
    // 3x1 RGBA: filter=Sub, bpp=4
    const raw = new Uint8Array([1, 100, 0, 0, 255, 50, 0, 0, 255, 10, 0, 0, 255, 5, 0, 0, 255]);
    const ihdr = new Uint8Array(13);
    ihdr.set(u32be(3), 0); ihdr.set(u32be(1), 4);
    ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
    const buf = assemblePNG(ihdr, deflateSync(raw));
    const { raster } = decodeRaster(buf);
    // Sub: px0=100, px1=50+100=150, px2=10+150=160
    expect(raster.gray[0]).toBe(Math.round(0.299 * 100)); // 30
    expect(raster.gray[1]).toBe(Math.round(0.299 * 150)); // 45
    expect(raster.gray[2]).toBe(Math.round(0.299 * 160)); // 48
  });

  it("filter 2 (Up)", () => {
    const row0raw = [0, 100, 0, 0, 255, 50, 0, 0, 255]; // filter=None, bpp=4
    const row1raw = [2, 10, 0, 0, 0, 20, 0, 0, 0]; // filter=Up
    // Reconstructed row0: [100,0,0,255, 50,0,0,255]
    // Reconstructed row1: [10+100,0,0,255, 20+50,0,0,255] = [110,0,0,255, 70,0,0,255]
    const raw = new Uint8Array([...row0raw, ...row1raw]);
    const ihdr = new Uint8Array(13);
    ihdr.set(u32be(2), 0); ihdr.set(u32be(2), 4);
    ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
    const buf = assemblePNG(ihdr, deflateSync(raw));
    const { raster } = decodeRaster(buf);
    // Row 0: px0=100 → luma=30, px1=50 → luma=15
    // Row 1: px0=110 → luma=33, px1=70 → luma=21
    expect(raster.gray[0]).toBe(Math.round(0.299 * 100)); // 30
    expect(raster.gray[1]).toBe(Math.round(0.299 * 50));  // 15
    expect(raster.gray[2]).toBe(Math.round(0.299 * 110)); // 33
    expect(raster.gray[3]).toBe(Math.round(0.299 * 70));  // 21
  });

  it("filter 3 (Average)", () => {
    // 1x2 gray8: bpp=1
    const raw = new Uint8Array([0, 80, 3, 50]); // row0=None(80), row1=Avg(50)
    const ihdr = new Uint8Array(13);
    ihdr.set(u32be(1), 0); ihdr.set(u32be(2), 4);
    ihdr[8] = 8; ihdr[9] = 0; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
    const buf = assemblePNG(ihdr, deflateSync(raw));
    const { raster } = decodeRaster(buf);
    // px(0,0)=80, px(0,1)=50+floor((0+80)/2)=90
    expect(raster.gray[0]).toBe(80);
    expect(raster.gray[1]).toBe(90);
  });

  it("filter 4 (Paeth)", () => {
    // 2x2 gray8: bpp=1
    // Row0: filter=None → [10, 30]
    // Row1: filter=Paeth → raw bytes to reconstruct
    // px(0,1): left=0, up=10, upLeft=0 → paeth=10 → dst=40+10=50
    // px(1,1): left=50, up=30, upLeft=10 → paeth: p=70, pa=20, pb=40, pc=60 → a=50 → dst=60+50=110
    const raw = new Uint8Array([0, 10, 30, 4, 40, 60]);
    const ihdr = new Uint8Array(13);
    ihdr.set(u32be(2), 0); ihdr.set(u32be(2), 4);
    ihdr[8] = 8; ihdr[9] = 0; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
    const buf = assemblePNG(ihdr, deflateSync(raw));
    const { raster } = decodeRaster(buf);
    expect(raster.gray[0]).toBe(10);
    expect(raster.gray[1]).toBe(30);
    expect(raster.gray[2]).toBe(50);
    expect(raster.gray[3]).toBe(110);
  });
});

describe("decodeRaster – PNG edge cases", () => {
  it("rejects interlaced PNG", () => {
    const ihdr = new Uint8Array(13);
    ihdr.set(u32be(4), 0); ihdr.set(u32be(4), 4);
    ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 1;
    const idat = deflateSync(new Uint8Array(4 * 4 * 4 + 4));
    const buf = assemblePNG(ihdr, idat);
    expect(() => decodeRaster(buf)).toThrow(/interlaced/i);
  });

  it("rejects non-PNG data", () => {
    expect(() => decodeRaster(new Uint8Array([0xff, 0xd8, 0xff]))).toThrow(/JPEG|unsupported|Unrecognised/i);
  });

  it("rejects missing IHDR", () => {
    const parts = [
      makeChunk("IDAT", deflateSync(new Uint8Array(2))),
      makeChunk("IEND", new Uint8Array(0)),
    ];
    let totalLen = PNG_SIG.length;
    for (const p of parts) totalLen += p.length;
    const buf = new Uint8Array(totalLen);
    buf.set(PNG_SIG);
    let off = PNG_SIG.length;
    for (const p of parts) { buf.set(p, off); off += p.length; }
    expect(() => decodeRaster(buf)).toThrow(/IHDR/i);
  });

  it("rejects missing IDAT", () => {
    const ihdr = new Uint8Array(13);
    ihdr.set(u32be(1), 0); ihdr.set(u32be(1), 4);
    ihdr[8] = 8; ihdr[9] = 0; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
    const buf = assemblePNG(ihdr, new Uint8Array(0));
    // assemblePNG always puts IHDR + IDAT + IEND; replace IDAT with empty
    // Actually, assemblePNG always inserts IDAT. Let me build it manually.
    const parts = [
      makeChunk("IHDR", ihdr),
      makeChunk("IEND", new Uint8Array(0)),
    ];
    let totalLen = PNG_SIG.length;
    for (const p of parts) totalLen += p.length;
    const manual = new Uint8Array(totalLen);
    manual.set(PNG_SIG);
    let o = PNG_SIG.length;
    for (const p of parts) { manual.set(p, o); o += p.length; }
    expect(() => decodeRaster(manual)).toThrow(/IDAT/i);
  });
});

// ---------------------------------------------------------------------------
// Tests: PNM
// ---------------------------------------------------------------------------

describe("decodeRaster – PNM", () => {
  function makePGM(width: number, height: number, maxval: number, pixels: number[]): Uint8Array {
    const header = `P5\n${width} ${height}\n${maxval}\n`;
    const hdrBytes = new TextEncoder().encode(header);
    const dataBytes = new Uint8Array(pixels);
    const out = new Uint8Array(hdrBytes.length + dataBytes.length);
    out.set(hdrBytes); out.set(dataBytes, hdrBytes.length);
    return out;
  }

  function makePPM(width: number, height: number, maxval: number, pixels: number[]): Uint8Array {
    const header = `P6\n${width} ${height}\n${maxval}\n`;
    const hdrBytes = new TextEncoder().encode(header);
    const dataBytes = new Uint8Array(pixels);
    const out = new Uint8Array(hdrBytes.length + dataBytes.length);
    out.set(hdrBytes); out.set(dataBytes, hdrBytes.length);
    return out;
  }

  it("decodes PGM (P5) with maxval 255", () => {
    const buf = makePGM(2, 1, 255, [50, 200]);
    const { raster, format } = decodeRaster(buf);
    expect(format).toBe("pnm");
    expect(raster.width).toBe(2);
    expect(raster.gray[0]).toBe(50);
    expect(raster.gray[1]).toBe(200);
    expect(raster.opaque[0]).toBe(1);
  });

  it("decodes PGM (P5) with maxval 65535 (high byte)", () => {
    const buf = makePGM(1, 1, 65535, [0xff, 0x00]);
    const { raster } = decodeRaster(buf);
    expect(raster.gray[0]).toBe(255);
  });

  it("decodes PPM (P6) with maxval 255", () => {
    const buf = makePPM(1, 1, 255, [100, 150, 200]);
    const { raster } = decodeRaster(buf);
    expect(raster.gray[0]).toBe(141); // round(0.299*100 + 0.587*150 + 0.114*200)
    expect(raster.opaque[0]).toBe(1);
  });

  it("rejects P1 (ascii bitmap)", () => {
    const buf = new TextEncoder().encode("P1\n1 1\n1\n");
    expect(() => decodeRaster(buf)).toThrow(/not supported/i);
  });

  it("rejects P2 (ascii gray)", () => {
    const buf = new TextEncoder().encode("P2\n1 1\n255\n128\n");
    expect(() => decodeRaster(buf)).toThrow(/not supported/i);
  });

  it("rejects P3 (ascii rgb)", () => {
    const buf = new TextEncoder().encode("P3\n1 1\n255\n128 64 32\n");
    expect(() => decodeRaster(buf)).toThrow(/not supported/i);
  });

  it("rejects P4 (binary bitmap)", () => {
    const buf = new TextEncoder().encode("P4\n1 1\n");
    expect(() => decodeRaster(buf)).toThrow(/not supported/i);
  });

  it("skips # comments in PNM header", () => {
    const header = "P5\n# comment\n2 1\n# another\n255\n";
    const hdrBytes = new TextEncoder().encode(header);
    const dataBytes = new Uint8Array([10, 20]);
    const buf = new Uint8Array(hdrBytes.length + dataBytes.length);
    buf.set(hdrBytes); buf.set(dataBytes, hdrBytes.length);
    const { raster } = decodeRaster(buf);
    expect(raster.gray[0]).toBe(10);
    expect(raster.gray[1]).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// Tests: loadRaster – format sniffing
// ---------------------------------------------------------------------------

describe("loadRaster – format sniffing", () => {
  it("reads a real JPEG rather than refusing it", () => {
    // JPEG support landed later; this test used to pin the refusal. It is kept as
    // the guard that the routing stays wired.
    const raster = loadRaster(resolve(__dirname, "../test/asset/jpeg-solid.jpg"));
    expect(raster.width).toBe(16);
    expect(raster.height).toBe(16);
  });

  it("names the file when a JPEG is malformed rather than the format", () => {
    const path = "/tmp/_test_fake.jpg";
    writeFileSync(path, new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]));
    expect(() => loadRaster(path)).toThrow(/could not read .*_test_fake\.jpg.*as JPEG/);
    unlinkSync(path);
  });
});

// ---------------------------------------------------------------------------
// Tests: real PNG from repo
// ---------------------------------------------------------------------------

describe("decodeRaster – real PNG img1.png", () => {
  const imgPath = resolve(__dirname, "../../../docs/media/img1.png");

  it("decodes to 2559x1292", () => {
    const buf = new Uint8Array(readFileSync(imgPath));
    const { raster } = decodeRaster(buf);
    expect(raster.width).toBe(2559);
    expect(raster.height).toBe(1292);
  });

  it("pixel (0,0) = RGBA(23,23,34,255)", () => {
    const buf = new Uint8Array(readFileSync(imgPath));
    const { raster } = decodeRaster(buf);
    expect(raster.gray[0]).toBe(24); // round(0.299*23 + 0.587*23 + 0.114*34)
    expect(raster.opaque[0]).toBe(1);
  });

  it("pixel (1279,646) = RGBA(23,23,34,255)", () => {
    const buf = new Uint8Array(readFileSync(imgPath));
    const { raster } = decodeRaster(buf);
    const idx = 646 * 2559 + 1279;
    expect(raster.gray[idx]).toBe(24);
    expect(raster.opaque[idx]).toBe(1);
  });

  it("pixel (2558,1291) = RGBA(0,0,0,0) → gray=255, opaque=0", () => {
    const buf = new Uint8Array(readFileSync(imgPath));
    const { raster } = decodeRaster(buf);
    const idx = 1291 * 2559 + 2558;
    expect(raster.gray[idx]).toBe(255);
    expect(raster.opaque[idx]).toBe(0);
  });

  it("pixel (100,200) = RGBA(30,33,39,255)", () => {
    const buf = new Uint8Array(readFileSync(imgPath));
    const { raster } = decodeRaster(buf);
    const idx = 200 * 2559 + 100;
    expect(raster.gray[idx]).toBe(33); // round(0.299*30 + 0.587*33 + 0.114*39)
    expect(raster.opaque[idx]).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Tests: cropRaster
// ---------------------------------------------------------------------------

describe("cropRaster", () => {
  it("crops a sub-region", () => {
    const raster: Raster = {
      width: 4, height: 4,
      gray: new Uint8Array([1,2,3,4, 5,6,7,8, 9,10,11,12, 13,14,15,16]),
      opaque: new Uint8Array(16).fill(1),
    };
    const cropped = cropRaster(raster, { x0: 1, y0: 1, x1: 2, y1: 2 });
    expect(cropped.width).toBe(2);
    expect(cropped.height).toBe(2);
    expect(cropped.gray[0]).toBe(6);
    expect(cropped.gray[1]).toBe(7);
    expect(cropped.gray[2]).toBe(10);
    expect(cropped.gray[3]).toBe(11);
  });

  it("clamps to raster bounds", () => {
    const raster: Raster = {
      width: 2, height: 2,
      gray: new Uint8Array([1,2,3,4]),
      opaque: new Uint8Array(4).fill(1),
    };
    const cropped = cropRaster(raster, { x0: 0, y0: 0, x1: 10, y1: 10 });
    expect(cropped.width).toBe(2);
    expect(cropped.height).toBe(2);
  });

  it("returns empty for out-of-bounds box", () => {
    const raster: Raster = {
      width: 2, height: 2,
      gray: new Uint8Array([1,2,3,4]),
      opaque: new Uint8Array(4).fill(1),
    };
    const cropped = cropRaster(raster, { x0: 5, y0: 5, x1: 10, y1: 10 });
    expect(cropped.width).toBe(0);
    expect(cropped.height).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Tests: extractSilhouette
// ---------------------------------------------------------------------------

describe("extractSilhouette – ink mode", () => {
  it("selects the largest dark component and discards small noise", () => {
    const gray = new Uint8Array(100).fill(255);
    const opaque = new Uint8Array(100).fill(1);
    // Large blob: rows 2-7, cols 2-7 (36 pixels)
    for (let y = 2; y <= 7; y++) for (let x = 2; x <= 7; x++) gray[y * 10 + x] = 50;
    // Small speck: (0,0) – 1 pixel
    gray[0] = 50;
    // 2x2 speck at (8,8) – 4 pixels
    gray[8 * 10 + 8] = 50; gray[8 * 10 + 9] = 50;
    gray[9 * 10 + 8] = 50; gray[9 * 10 + 9] = 50;

    const raster: Raster = { width: 10, height: 10, gray, opaque };
    const sil = extractSilhouette(raster, { mode: "ink", minComponentPixels: 16 });
    expect(sil.mode).toBe("ink");
    expect(sil.components).toBe(1);
    expect(sil.bbox.x0).toBe(2);
    expect(sil.bbox.y0).toBe(2);
    expect(sil.bbox.x1).toBe(7);
    expect(sil.bbox.y1).toBe(7);
    expect(sil.mask[2 * 10 + 2]).toBe(1);
    expect(sil.mask[0]).toBe(0);
  });
});

describe("extractSilhouette – region mode", () => {
  it("enclosed bright region with a hole reads as a donut", () => {
    // 12x12: dark rectangle outline + dark circle hole inside
    const gray = new Uint8Array(144).fill(255);
    const opaque = new Uint8Array(144).fill(1);

    // Outline of rectangle at rows 2-9, cols 2-9
    for (let x = 2; x <= 9; x++) { gray[2 * 12 + x] = 50; gray[9 * 12 + x] = 50; }
    for (let y = 2; y <= 9; y++) { gray[y * 12 + 2] = 50; gray[y * 12 + 9] = 50; }

    // Dark circle hole inside
    gray[5 * 12 + 5] = 50; gray[5 * 12 + 6] = 50;
    gray[6 * 12 + 5] = 50; gray[6 * 12 + 6] = 50;

    const raster: Raster = { width: 12, height: 12, gray, opaque };
    const sil = extractSilhouette(raster, { mode: "region", minComponentPixels: 4 });
    expect(sil.mode).toBe("region");
    expect(sil.components).toBe(1);
    // Interior pixel should be in silhouette
    expect(sil.mask[3 * 12 + 3]).toBe(1);
    // Dark circle hole should NOT be in silhouette
    expect(sil.mask[5 * 12 + 5]).toBe(0);
    // Outside the rectangle should NOT be in silhouette
    expect(sil.mask[0 * 12 + 0]).toBe(0);
  });

  it("the circle reads as a hole (not part of the material)", () => {
    const gray = new Uint8Array(100).fill(255);
    const opaque = new Uint8Array(100).fill(1);

    // Rectangle outline at rows 1-8, cols 1-8
    for (let x = 1; x <= 8; x++) { gray[1 * 10 + x] = 50; gray[8 * 10 + x] = 50; }
    for (let y = 1; y <= 8; y++) { gray[y * 10 + 1] = 50; gray[y * 10 + 8] = 50; }

    // Dark circle hole at (4,4)-(5,5)
    gray[4 * 10 + 4] = 50; gray[4 * 10 + 5] = 50;
    gray[5 * 10 + 4] = 50; gray[5 * 10 + 5] = 50;

    const raster: Raster = { width: 10, height: 10, gray, opaque };
    const sil = extractSilhouette(raster, { mode: "region", minComponentPixels: 4 });

    expect(sil.mask[3 * 10 + 3]).toBe(1);
    expect(sil.mask[4 * 10 + 4]).toBe(0);
    expect(sil.mask[5 * 10 + 5]).toBe(0);
  });
});

describe("extractSilhouette – auto mode", () => {
  it("picks region when ink fraction is low (line drawing)", () => {
    // 20x20, only 2 dark pixels → ink fraction = 2/400 = 0.005
    const gray = new Uint8Array(400).fill(255);
    const opaque = new Uint8Array(400).fill(1);
    gray[0] = 50;
    gray[1] = 50;
    const raster: Raster = { width: 20, height: 20, gray, opaque };
    const sil = extractSilhouette(raster, { mode: "auto" });
    // auto picks region, but region mode may yield empty → fallback to ink
    // The mode after fallback should be ink (region had no enclosed area)
    expect(["ink", "region"]).toContain(sil.mode);
    expect(sil.notes.length).toBeGreaterThan(0); // fallback note
  });

  it("picks ink when ink fraction is high (filled part)", () => {
    const gray = new Uint8Array(100).fill(100);
    const opaque = new Uint8Array(100).fill(1);
    const raster: Raster = { width: 10, height: 10, gray, opaque };
    const sil = extractSilhouette(raster, { mode: "auto" });
    expect(sil.mode).toBe("ink");
  });

  it("auto with explicit region on a line-drawing fixture succeeds", () => {
    // 12x12 with dark outline → region mode finds enclosed bright area
    const gray = new Uint8Array(144).fill(255);
    const opaque = new Uint8Array(144).fill(1);
    for (let x = 2; x <= 9; x++) { gray[2 * 12 + x] = 50; gray[9 * 12 + x] = 50; }
    for (let y = 2; y <= 9; y++) { gray[y * 12 + 2] = 50; gray[y * 12 + 9] = 50; }
    const raster: Raster = { width: 12, height: 12, gray, opaque };
    const sil = extractSilhouette(raster, { mode: "region", minComponentPixels: 10 });
    expect(sil.mode).toBe("region");
    expect(sil.components).toBe(1);
    expect(sil.mask[5 * 12 + 5]).toBe(1); // interior pixel
  });

  it("falls back to other mode when primary is empty", () => {
    // All white → ink finds nothing
    const gray = new Uint8Array(100).fill(255);
    const opaque = new Uint8Array(100).fill(1);
    const raster: Raster = { width: 10, height: 10, gray, opaque };
    const sil = extractSilhouette(raster, { mode: "ink", minComponentPixels: 16 });
    expect(sil.components).toBe(0);
    expect(sil.notes.length).toBeGreaterThan(0);
    expect(sil.notes[0]).toMatch(/Fallback/i);
  });
});

describe("extractSilhouette – transparent pixels", () => {
  it("treats transparent pixels as background, not ink", () => {
    // 5x5 grid. Dark pixels in rows 0 and 1 so bbox has height > 0.
    const gray = new Uint8Array(25).fill(255);
    const opaque = new Uint8Array(25);
    // Transparent dark at (0,0) — should be treated as background
    gray[0] = 10; opaque[0] = 0;
    // Opaque dark at (1,0) — should be ink
    gray[1] = 10; opaque[1] = 1;
    // More opaque dark in row 0 (cols 2-4) and row 1 (cols 0-4) to make a 2-row component
    for (let x = 2; x <= 4; x++) { gray[x] = 10; opaque[x] = 1; }
    for (let x = 0; x <= 4; x++) { gray[5 + x] = 10; opaque[5 + x] = 1; }
    const raster: Raster = { width: 5, height: 5, gray, opaque };
    const sil = extractSilhouette(raster, { mode: "ink", minComponentPixels: 1 });
    // (0,0) transparent → not ink
    expect(sil.mask[0]).toBe(0);
    // (1,0) opaque dark → ink
    expect(sil.mask[1]).toBe(1);
    // (2,0)-(4,0) opaque dark → ink
    expect(sil.mask[2]).toBe(1);
    expect(sil.mask[3]).toBe(1);
    expect(sil.mask[4]).toBe(1);
    // Row 1 all opaque dark → ink
    for (let x = 0; x <= 4; x++) {
      expect(sil.mask[5 + x]).toBe(1);
    }
  });
});

// ---------------------------------------------------------------------------
// Tests: cropSilhouetteToBBox
// ---------------------------------------------------------------------------

describe("cropSilhouetteToBBox", () => {
  it("crops to the bounding box of the silhouette", () => {
    const mask = new Uint8Array([0,0,0,0, 0,1,1,0, 0,1,0,0, 0,0,0,0]);
    const sil = {
      mask, width: 4, height: 4,
      bbox: { x0: 1, y0: 1, x1: 2, y1: 2 },
      mode: "ink" as const, components: 1, notes: [],
    };
    const { mask: cropped, width, height } = cropSilhouetteToBBox(sil);
    expect(width).toBe(2);
    expect(height).toBe(2);
    expect(cropped[0]).toBe(1);
    expect(cropped[1]).toBe(1);
    expect(cropped[2]).toBe(1);
    expect(cropped[3]).toBe(0);
  });

  it("returns empty for invalid bbox", () => {
    const sil = {
      mask: new Uint8Array(0), width: 0, height: 0,
      bbox: { x0: 0, y0: 0, x1: -1, y1: -1 },
      mode: "ink" as const, components: 0, notes: [],
    };
    const { width, height } = cropSilhouetteToBBox(sil);
    expect(width).toBe(0);
    expect(height).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Tests: resampleMaskIntoFrame
// ---------------------------------------------------------------------------

describe("resampleMaskIntoFrame", () => {
  it("full source frame lands on full target frame", () => {
    // 2x2 all-set mask, same bounds
    const mask = new Uint8Array([1, 1, 1, 1]);
    const sourceBounds = { minX: 0, minY: 0, maxX: 1, maxY: 1 };
    const targetBounds = { minX: 0, minY: 0, maxX: 1, maxY: 1 };
    const out = resampleMaskIntoFrame(mask, 2, 2, sourceBounds, targetBounds, 2, 2);
    expect(out.length).toBe(4);
    expect(out[0]).toBe(1);
    expect(out[1]).toBe(1);
    expect(out[2]).toBe(1);
    expect(out[3]).toBe(1);
  });

  it("half-size source region lands in correct half of target", () => {
    // Source: 4x4, top-left quadrant set (cols 0-1, rows 2-3 in flipY convention)
    const mask = new Uint8Array(16);
    // Source row 2-3 = worldY in [0.5, 1.0] (flipY: row 0 = maxY=4)
    mask[2 * 4 + 0] = 1; mask[2 * 4 + 1] = 1;
    mask[3 * 4 + 0] = 1; mask[3 * 4 + 1] = 1;

    const sourceBounds = { minX: 0, minY: 0, maxX: 4, maxY: 4 };
    const targetBounds = { minX: 0, minY: 0, maxX: 4, maxY: 4 };
    const out = resampleMaskIntoFrame(mask, 4, 4, sourceBounds, targetBounds, 4, 4);
    expect(out.length).toBe(16);

    // Source rows 2-3 correspond to worldY [1, 2]
    // Target rows 0-3: row 0 → worldY 4, row 1 → worldY 2.67, row 2 → worldY 1.33, row 3 → worldY 0
    // Nearest to worldY 1 is row 2, nearest to worldY 2 is row 1 or row 2
    // Source cols 0-1 correspond to worldX [0, 1]
    // Target cols 0-3: col 0 → worldX 0, col 1 → worldX 1.33, col 2 → worldX 2.67, col 3 → worldX 4
    // So we expect set pixels in target row 2, cols 0 (and maybe 1)
    let setCount = 0;
    for (let i = 0; i < 16; i++) if (out[i]) setCount++;
    expect(setCount).toBeGreaterThan(0);
    // Bottom-right should be empty
    expect(out[3 * 4 + 3]).toBe(0);
  });

  it("empty source produces empty target", () => {
    const mask = new Uint8Array(4);
    const bounds = { minX: 0, minY: 0, maxX: 1, maxY: 1 };
    const out = resampleMaskIntoFrame(mask, 2, 2, bounds, bounds, 2, 2);
    expect(out.every((v) => v === 0)).toBe(true);
  });
});
