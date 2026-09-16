/**
 * Reference-silhouette extraction from raster images.
 *
 * The L4 verification gate projects a BREP solid back into the drawing's view,
 * rasterizes the silhouette, and compares it to a reference.  This module
 * provides that reference: it decodes a PNG or PNM file into a luminance/alpha
 * raster, and extracts the dominant connected component as a binary mask.
 *
 * Two silhouette modes handle the two common drawing styles:
 *  - "ink"    – the part IS the dark pixels  (filled rendering / photo)
 *  - "region" – the part is the bright area ENCLOSED by dark ink (line art)
 *
 * An "auto" heuristic picks between them by measuring the ink fraction so that
 * neither style is applied backwards.
 *
 * No npm dependencies; only Node built-ins (zlib, fs, path).
 */

import { deflateSync, inflateSync } from "node:zlib";
import { decodeJpeg, isJpeg } from "./jpeg.js";
import { readFileSync } from "node:fs";
import type { Bounds2D } from "./project.js";

// ---- Types ----

export interface Raster {
  width: number;
  height: number;
  /** Luminance, row-major, length width*height, 0..255. Fully transparent pixels are 255. */
  gray: Uint8Array;
  /** 1 where the source pixel is opaque, else 0. */
  opaque: Uint8Array;
  /**
   * 1 where the source pixel is strongly coloured, when the decoder knows.
   *
   * CAD drawings routinely separate layers by colour — black for the part outline,
   * blue for dimensions and leaders. Read as luminance alone those are both "dark",
   * so the annotation is mistaken for part material and its many lines chop the
   * part's interior into pieces: a fully dimensioned drawing of a single character
   * came out as 143 regions with the largest holding 19% of the area, and no
   * silhouette could be built from it at all. Colour is the layer information, so
   * the decoders keep it.
   */
  colorful?: Uint8Array;
}

export type RasterFormat = "png" | "pnm" | "jpeg";

/** How far the extreme channels must differ before a pixel counts as coloured. */
export const COLORFUL_SPREAD = 40;

export interface DecodeOptions {
  /** Alpha at or above this counts as opaque. Default 128. */
  alphaMin?: number;
}

export interface PixelBox { x0: number; y0: number; x1: number; y1: number; }

export type SilhouetteMode = "auto" | "ink" | "region";

export interface SilhouetteOptions {
  mode?: SilhouetteMode;
  threshold?: number;
  alphaMin?: number;
  minComponentPixels?: number;
}

export interface Silhouette {
  mask: Uint8Array;
  width: number;
  height: number;
  bbox: PixelBox;
  mode: "ink" | "region";
  components: number;
  /**
   * Share of all component area held by the selected one.
   *
   * One part has one silhouette, so its region dominates the drawing. An assembly
   * or a schematic does not: a real catenary illustration's largest enclosed
   * region held 12.9% of the enclosed area, because it is nine parts and some
   * annotation boxes. Comparing a model against the largest of those would be a
   * confident answer to a question nobody asked.
   */
  largestShare: number;
  notes: string[];
}

// ---- PNG decoding ----

const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

const GRAY_LUMA = [0.299, 0.587, 0.114];

function readU32BE(buf: Uint8Array, off: number): number {
  return ((buf[off] << 24) | (buf[off + 1] << 16) | (buf[off + 2] << 8) | buf[off + 3]) >>> 0;
}

function readU16BE(buf: Uint8Array, off: number): number {
  return (buf[off] << 8) | buf[off + 1];
}

function paethPredictor(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function decodePNG(buf: Uint8Array, alphaMin: number): { raster: Raster; format: RasterFormat } {
  if (buf.length < 8) throw new Error("PNG data too short");
  for (let i = 0; i < 8; i++) {
    if (buf[i] !== PNG_SIGNATURE[i]) throw new Error("Not a PNG file");
  }

  let pos = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  let ihdrSeen = false;

  const idatChunks: Uint8Array[] = [];
  let plte: Uint8Array | null = null;
  let trns: Uint8Array | null = null;

  while (pos + 12 <= buf.length) {
    const len = readU32BE(buf, pos);
    const type = String.fromCharCode(buf[pos + 4], buf[pos + 5], buf[pos + 6], buf[pos + 7]);
    pos += 8;

    if (pos + len + 4 > buf.length) {
      throw new Error("Truncated PNG chunk");
    }

    if (type === "IHDR") {
      width = readU32BE(buf, pos);
      height = readU32BE(buf, pos + 4);
      bitDepth = buf[pos + 8];
      colorType = buf[pos + 9];
      interlace = buf[pos + 12];
      ihdrSeen = true;
    } else if (type === "PLTE") {
      plte = buf.slice(pos, pos + len);
    } else if (type === "tRNS") {
      trns = buf.slice(pos, pos + len);
    } else if (type === "IDAT") {
      idatChunks.push(buf.slice(pos, pos + len));
    } else if (type === "IEND") {
      break;
    }
    // ancillary chunks are skipped

    pos += len + 4; // skip data + CRC
  }

  if (!ihdrSeen) throw new Error("Missing IHDR chunk");
  if (idatChunks.length === 0) throw new Error("No IDAT chunks found");
  if (interlace !== 0) {
    throw new Error(
      `PNG is interlaced (Adam7), which is not supported — re-save it as a non-interlaced PNG`,
    );
  }

  // Validate color type + bit depth
  validateColorType(colorType, bitDepth);

  // Concatenate IDAT data
  let totalLen = 0;
  for (const c of idatChunks) totalLen += c.length;
  const idatData = new Uint8Array(totalLen);
  let off = 0;
  for (const c of idatChunks) {
    idatData.set(c, off);
    off += c.length;
  }

  const deflated = inflateSync(idatData);
  const scanlineLen = calcScanlineLen(colorType, bitDepth, width);
  const expected = height * scanlineLen;
  if (deflated.length < expected) {
    throw new Error(`Truncated PNG scanline data: got ${deflated.length}, expected ${expected}`);
  }

  const bpp = calcBpp(colorType, bitDepth);
  const rawData = new Uint8Array(width * height * bpp);
  let srcOff = 0;
  for (let y = 0; y < height; y++) {
    const filter = deflated[srcOff++];
    const rowBytes = scanlineLen - 1;
    // Expand 1/2/4-bit palette pixels first for filter reconstruction
    const expanded = expandBitDepth(deflated, srcOff, rowBytes, colorType, bitDepth, width);
    srcOff += rowBytes;

    const prevRow = y === 0 ? null : rawData.subarray((y - 1) * width * bpp, y * width * bpp);
    const curRow = rawData.subarray(y * width * bpp, (y + 1) * width * bpp);
    applyFilter(filter, expanded, curRow, prevRow, bpp, width);
  }

  // Convert to luminance + alpha
  const gray = new Uint8Array(width * height);
  const opaque = new Uint8Array(width * height);
  convertToGrayOpaque(rawData, gray, opaque, width, height, colorType, bitDepth, plte, trns, alphaMin);

  return { raster: { width, height, gray, opaque }, format: "png" };
}

function validateColorType(ct: number, bd: number): void {
  const valid: Record<number, number[]> = {
    0: [1, 2, 4, 8, 16],
    2: [8, 16],
    3: [1, 2, 4, 8],
    4: [8, 16],
    6: [8, 16],
  };
  if (!valid[ct]) throw new Error(`Unsupported PNG color type ${ct}`);
  if (!valid[ct].includes(bd)) {
    throw new Error(`Unsupported bit depth ${bd} for color type ${ct}`);
  }
}

function calcBpp(ct: number, bd: number): number {
  // Bytes per pixel in the expanded (8/16-bit per channel) buffer
  switch (ct) {
    case 0: return bd === 16 ? 2 : 1;
    case 2: return bd === 16 ? 6 : 3;
    case 3: return 1; // palette index stored as 1 byte
    case 4: return bd === 16 ? 4 : 2;
    case 6: return bd === 16 ? 8 : 4;
    default: throw new Error(`Unsupported color type ${ct}`);
  }
}

function calcScanlineLen(ct: number, bd: number, width: number): number {
  // Scanline length = filter byte + ceil(width * bitsPerPixel / 8)
  const bitsPerPixel = ct === 3 ? bd : channelsPerPixel(ct) * bd;
  return 1 + Math.ceil((width * bitsPerPixel) / 8);
}

function channelsPerPixel(ct: number): number {
  switch (ct) {
    case 0: return 1;
    case 2: return 3;
    case 3: return 1;
    case 4: return 2;
    case 6: return 4;
    default: return 1;
  }
}

function sampleBits(ct: number, bd: number): number {
  if (ct === 3) return 8; // palette index always stored in full byte after expansion
  return bd;
}

function expandBitDepth(
  src: Uint8Array, srcOff: number, rowBytes: number,
  ct: number, bd: number, width: number,
): Uint8Array {
  if (ct === 3) {
    if (bd === 8) return src.slice(srcOff, srcOff + rowBytes);
    const out = new Uint8Array(width);
    for (let i = 0; i < width; i++) {
      const byteIdx = srcOff + ((i * bd) >> 3);
      const bitShift = 8 - bd - ((i * bd) & 7);
      const mask = (1 << bd) - 1;
      out[i] = (src[byteIdx] >> bitShift) & mask;
    }
    return out;
  }
  if (ct === 0 && bd < 8) {
    const out = new Uint8Array(width);
    for (let i = 0; i < width; i++) {
      const byteIdx = srcOff + ((i * bd) >> 3);
      const bitShift = 8 - bd - ((i * bd) & 7);
      const mask = (1 << bd) - 1;
      out[i] = (src[byteIdx] >> bitShift) & mask;
    }
    return out;
  }
  return src.slice(srcOff, srcOff + rowBytes);
}

function applyFilter(
  filter: number,
  src: Uint8Array,
  dst: Uint8Array,
  prev: Uint8Array | null,
  bpp: number,
  width: number,
): void {
  const bytesPerPixel = Math.max(1, bpp);
  for (let i = 0; i < dst.length; i++) {
    const raw = src[i];
    const left = i >= bytesPerPixel ? dst[i - bytesPerPixel] : 0;
    const up = prev ? prev[i] : 0;
    const upLeft = (prev && i >= bytesPerPixel) ? prev[i - bytesPerPixel] : 0;

    switch (filter) {
      case 0: dst[i] = raw; break;
      case 1: dst[i] = (raw + left) & 0xff; break;
      case 2: dst[i] = (raw + up) & 0xff; break;
      case 3: dst[i] = (raw + ((left + up) >> 1)) & 0xff; break;
      case 4: dst[i] = (raw + paethPredictor(left, up, upLeft)) & 0xff; break;
      default: throw new Error(`Unknown PNG filter type ${filter}`);
    }
  }
}

function convertToGrayOpaque(
  raw: Uint8Array, gray: Uint8Array, opaque: Uint8Array,
  width: number, height: number,
  ct: number, bd: number,
  plte: Uint8Array | null, trns: Uint8Array | null,
  alphaMin: number,
): void {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      let alpha = 255;
      let r = 0, g = 0, b = 0;

      switch (ct) {
        case 0: { // grayscale
          const sample = bd === 16 ? raw[idx * 2] : raw[idx];
          r = g = b = bd === 16 ? raw[idx * 2] : raw[idx];
          if (trns && sample === readU16BE(trns, 0)) alpha = 0;
          break;
        }
        case 2: { // RGB
          if (bd === 16) {
            r = raw[idx * 6]; g = raw[idx * 6 + 2]; b = raw[idx * 6 + 4];
          } else {
            r = raw[idx * 3]; g = raw[idx * 3 + 1]; b = raw[idx * 3 + 2];
          }
          if (trns) {
            const tr = readU16BE(trns, 0), tg = readU16BE(trns, 2), tb = readU16BE(trns, 4);
            if (r === tr && g === tg && b === tb) alpha = 0;
          }
          break;
        }
        case 3: { // palette
          const pi = raw[idx];
          if (plte) {
            r = plte[pi * 3]; g = plte[pi * 3 + 1]; b = plte[pi * 3 + 2];
          }
          if (trns && pi < trns.length) {
            alpha = trns[pi];
          }
          break;
        }
        case 4: { // gray + alpha
          if (bd === 16) {
            r = g = b = raw[idx * 4];
            alpha = raw[idx * 4 + 2];
          } else {
            r = g = b = raw[idx * 2];
            alpha = raw[idx * 2 + 1];
          }
          break;
        }
        case 6: { // RGBA
          if (bd === 16) {
            r = raw[idx * 8]; g = raw[idx * 8 + 2]; b = raw[idx * 8 + 4]; alpha = raw[idx * 8 + 6];
          } else {
            r = raw[idx * 4]; g = raw[idx * 4 + 1]; b = raw[idx * 4 + 2]; alpha = raw[idx * 4 + 3];
          }
          break;
        }
      }

      const lum = Math.round(GRAY_LUMA[0] * r + GRAY_LUMA[1] * g + GRAY_LUMA[2] * b);
      if (alpha < alphaMin) {
        gray[idx] = 255;
        opaque[idx] = 0;
      } else {
        gray[idx] = Math.min(255, Math.max(0, lum));
        opaque[idx] = 1;
      }
    }
  }
}

// ---- PNM decoding ----

/** Sniff the PNM magic number from raw bytes. Returns null if not PNM. */
function pnmMagic(buf: Uint8Array): string | null {
  if (buf.length < 2) return null;
  if (buf[0] !== 0x50) return null; // 'P'
  const c = buf[1];
  if (c >= 0x31 && c <= 0x36) return "P" + String.fromCharCode(c); // P1..P6
  return null;
}

function decodePNM(buf: Uint8Array): { raster: Raster; format: RasterFormat } {
  let pos = 0;

  function skipWS(): void {
    while (pos < buf.length && (buf[pos] === 0x20 || buf[pos] === 0x0a || buf[pos] === 0x0d || buf[pos] === 0x09)) pos++;
  }

  function skipComments(): void {
    while (pos < buf.length && buf[pos] === 0x23) { // '#'
      while (pos < buf.length && buf[pos] !== 0x0a) pos++;
      pos++;
    }
  }

  function readToken(): string {
    // Skip whitespace then comments; repeat in case a comment follows whitespace
    for (;;) {
      const prev = pos;
      skipWS();
      skipComments();
      if (pos === prev) break;
    }
    const start = pos;
    while (pos < buf.length) {
      const b = buf[pos];
      if (b === 0x20 || b === 0x0a || b === 0x0d || b === 0x09 || b === 0x23) break;
      pos++;
    }
    return String.fromCharCode(...buf.slice(start, pos));
  }

  const magic = readToken();
  if (magic === "P1" || magic === "P2" || magic === "P3") {
    throw new Error(
      `PNM format ${magic} (ascii/bitmap) is not supported — convert to P5 (binary PGM) or P6 (binary PPM)`,
    );
  }
  if (magic === "P4") {
    throw new Error(
      `PNM format P4 (binary bitmap) is not supported — convert to P5 (binary PGM) or P6 (binary PPM)`,
    );
  }
  if (magic !== "P5" && magic !== "P6") {
    throw new Error(`Unknown PNM format: ${magic}`);
  }

  const width = parseInt(readToken(), 10);
  const height = parseInt(readToken(), 10);
  const maxval = parseInt(readToken(), 10);
  if (isNaN(width) || isNaN(height) || isNaN(maxval) || width <= 0 || height <= 0 || maxval <= 0 || maxval > 65535) {
    throw new Error("Invalid PNM header");
  }

  // Consume exactly one whitespace byte (the delimiter after maxval).
  // We must NOT skipWS here because binary data may contain bytes that look
  // like whitespace (e.g. 0x0a).
  if (pos < buf.length) pos++;

  const isPPM = magic === "P6";
  const channels = isPPM ? 3 : 1;
  const bytesPerSample = maxval > 255 ? 2 : 1;
  const bytesPerRow = width * channels * bytesPerSample;

  const binLen = buf.length - pos;
  const expectedBinLen = height * bytesPerRow;
  if (binLen < expectedBinLen) {
    throw new Error("Truncated PNM data");
  }

  const gray = new Uint8Array(width * height);
  const opaque = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    const rowOff = pos + y * bytesPerRow;
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (isPPM) {
        const pxOff = rowOff + x * channels * bytesPerSample;
        const r = bytesPerSample === 2 ? buf[pxOff] : buf[pxOff];
        const g = bytesPerSample === 2 ? buf[pxOff + 2] : buf[pxOff + 1];
        const b = bytesPerSample === 2 ? buf[pxOff + 4] : buf[pxOff + 2];
        gray[idx] = Math.round(GRAY_LUMA[0] * r + GRAY_LUMA[1] * g + GRAY_LUMA[2] * b);
      } else {
        gray[idx] = bytesPerSample === 2 ? buf[rowOff + x * 2] : buf[rowOff + x];
      }
      opaque[idx] = 1;
    }
  }

  return { raster: { width, height, gray, opaque }, format: "pnm" };
}

/**
 * The ink/paper cut that best separates THIS image, by Otsu's method.
 *
 * A fixed threshold is a bet that the drawing is crisp black on white. Scans and
 * rendered illustrations are not: a real catenary drawing measured 89% near-white
 * with its lines in mid-gray, so only 1% of pixels fell below 128 — nothing
 * closed, no enclosed region was found, and the whole re-projection gate had
 * nothing to compare against. Otsu reads the cut off the image's own histogram
 * instead, and for genuine black-on-white art it lands on the same value a
 * constant would have.
 */
export function otsuThreshold(gray: Uint8Array): number {
  const hist = new Uint32Array(256);
  for (let i = 0; i < gray.length; i++) hist[gray[i]]++;

  const total = gray.length;
  let sum = 0;
  for (let t = 0; t < 256; t++) sum += t * hist[t];

  let sumB = 0;
  let weightB = 0;
  let best = 128;
  let bestBetween = -1;

  for (let t = 0; t < 256; t++) {
    weightB += hist[t];
    if (weightB === 0) continue;
    const weightF = total - weightB;
    if (weightF === 0) break;

    sumB += t * hist[t];
    const meanB = sumB / weightB;
    const meanF = (sum - sumB) / weightF;
    const between = weightB * weightF * (meanB - meanF) * (meanB - meanF);
    if (between > bestBetween) {
      bestBetween = between;
      best = t;
    }
  }
  return best;
}

// ---- Public decode API ----

export function decodeRaster(
  buf: Uint8Array, opts?: DecodeOptions,
): { raster: Raster; format: RasterFormat } {
  const alphaMin = opts?.alphaMin ?? 128;
  const sig = buf.slice(0, 8);
  const isPNG = sig.length >= 8 && sig.every((v, i) => v === PNG_SIGNATURE[i]);
  if (isPNG) return decodePNG(buf, alphaMin);

  const magic = pnmMagic(buf);
  if (magic) return decodePNM(buf);

  if (isJpeg(buf)) {
    return { raster: decodeJpeg(buf), format: "jpeg" };
  }

  throw new Error("Unrecognised image format (expected PNG, JPEG, PGM, or PPM)");
}

export function loadRaster(path: string, opts?: DecodeOptions): Raster {
  const buf = new Uint8Array(readFileSync(path));
  const first = buf.slice(0, 8);
  const isPNG = first.length >= 8 && first.every((v, i) => v === PNG_SIGNATURE[i]);
  const magic = pnmMagic(buf);
  let fmt: string;
  if (isPNG) fmt = "PNG";
  else if (magic) fmt = magic;
  else if (isJpeg(buf)) fmt = "JPEG";
  else fmt = "unknown";

  if (fmt === "JPEG") {
    try {
      return decodeJpeg(buf);
    } catch (e) {
      throw new Error(
        `could not read "${path}" as JPEG: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
  if (!isPNG && !magic) {
    throw new Error(
      `Unrecognised format (detected ${fmt}) for "${path}" — expected PNG, JPEG, PGM, or PPM`,
    );
  }

  return decodeRaster(buf, opts).raster;
}

// ---- Crop ----

/**
 * A normalized `[x0, y0, x1, y1]` view region as inclusive pixel indices.
 *
 * The region is normalized so it survives a change of image resolution, which is
 * why the corners are multiplied rather than taken as absolute pixels.
 */
export function regionToPixelBox(
  region: [number, number, number, number],
  width: number,
  height: number,
): PixelBox {
  const [rx0, ry0, rx1, ry1] = region;
  return {
    x0: Math.round(Math.min(rx0, rx1) * width),
    y0: Math.round(Math.min(ry0, ry1) * height),
    x1: Math.round(Math.max(rx0, rx1) * width) - 1,
    y1: Math.round(Math.max(ry0, ry1) * height) - 1,
  };
}

export function cropRaster(raster: Raster, box: PixelBox): Raster {
  const x0 = Math.max(0, box.x0);
  const y0 = Math.max(0, box.y0);
  const x1 = Math.min(raster.width - 1, box.x1);
  const y1 = Math.min(raster.height - 1, box.y1);
  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  if (w <= 0 || h <= 0) {
    return { width: 0, height: 0, gray: new Uint8Array(0), opaque: new Uint8Array(0) };
  }
  const gray = new Uint8Array(w * h);
  const opaque = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const srcRow = (y0 + y) * raster.width + x0;
    const dstRow = y * w;
    gray.set(raster.gray.subarray(srcRow, srcRow + w), dstRow);
    opaque.set(raster.opaque.subarray(srcRow, srcRow + w), dstRow);
  }
  return { width: w, height: h, gray, opaque };
}

// ---- Connected components (4-connectivity) ----

function labelComponents(
  mask: Uint8Array, width: number, height: number,
): { labels: Int32Array; counts: Map<number, number> } {
  const labels = new Int32Array(width * height);
  const counts = new Map<number, number>();
  let nextLabel = 1;
  const parent: number[] = [0];

  const find = (x: number): number => {
    let root = x;
    while (parent[root] !== root) root = parent[root];
    while (parent[x] !== root) {
      const nx = parent[x];
      parent[x] = root;
      x = nx;
    }
    return root;
  };

  const union = (a: number, b: number): void => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (!mask[idx]) continue;
      const label = nextLabel++;
      parent.push(label);
      labels[idx] = label;

      if (x > 0 && mask[idx - 1]) union(label, labels[idx - 1]);
      if (y > 0 && mask[idx - width]) union(label, labels[idx - width]);
    }
  }

  // Flatten and count
  for (let i = 0; i < labels.length; i++) {
    if (labels[i]) labels[i] = find(labels[i]);
  }
  for (let i = 0; i < labels.length; i++) {
    if (labels[i]) counts.set(labels[i], (counts.get(labels[i]) ?? 0) + 1);
  }
  return { labels, counts };
}

// ---- Silhouette extraction ----

export function extractSilhouette(raster: Raster, opts?: SilhouetteOptions): Silhouette {
  const mode = opts?.mode ?? "auto";
  // Read the cut off the image unless the caller pinned one.
  const threshold = opts?.threshold ?? otsuThreshold(raster.gray);
  const alphaMin = opts?.alphaMin ?? 128;
  const minPixels = opts?.minComponentPixels ?? 16;
  const { width, height, gray, opaque } = raster;
  const total = width * height;
  const notes: string[] = [];

  // Build ink mask: opaque, dark, and — when the decoder kept colour — not
  // annotation. A drawing that marks its dimensions in blue and its part outline
  // in black reads as "all dark" in luminance, and then the annotation chops the
  // part's interior into pieces.
  const ink = new Uint8Array(total);
  let inkCount = 0;
  let colorfulSkipped = 0;
  for (let i = 0; i < total; i++) {
    // `<=`, matching Otsu's own convention: its class B is the values up to and
    // including the threshold. A crisp black-on-white drawing is exactly bimodal,
    // so Otsu legitimately returns 0 there — and `< 0` would call nothing ink.
    if (!opaque[i] || gray[i] > threshold) continue;
    if (raster.colorful && raster.colorful[i]) {
      colorfulSkipped++;
      continue;
    }
    ink[i] = 1;
    inkCount++;
  }
  // Where a dimension leader crosses the part outline, the outline's pixels are
  // painted over and the fill then leaks out of the part. A coloured pixel with
  // part-ink on opposite sides is part of a line running through it, so it is
  // restored; a coloured pixel in open space has none and stays annotation.
  if (raster.colorful && colorfulSkipped > 0) {
    for (let pass = 0; pass < 2; pass++) {
      let bridged = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = y * width + x;
          if (ink[i] || !raster.colorful[i]) continue;
          const left = x > 0 && ink[i - 1];
          const right = x < width - 1 && ink[i + 1];
          const up = y > 0 && ink[i - width];
          const down = y < height - 1 && ink[i + width];
          if ((left && right) || (up && down)) {
            ink[i] = 1;
            bridged++;
          }
        }
      }
      if (bridged === 0) break;
    }
  }

  if (colorfulSkipped > 0) {
    const share = colorfulSkipped / total;
    notes.push(
      `${(share * 100).toFixed(1)}% of the drawing is coloured and was treated as annotation rather than part — drawings usually separate their dimension layer from the part that way`,
    );
  }

  let chosenMode: "ink" | "region";

  if (mode === "ink") {
    chosenMode = "ink";
  } else if (mode === "region") {
    chosenMode = "region";
  } else {
    // auto
    const frac = total > 0 ? inkCount / total : 0;
    chosenMode = frac < 0.15 ? "region" : "ink";
  }

  let result = buildSilhouette(chosenMode, ink, gray, opaque, width, height, threshold, alphaMin, minPixels);

  // Fallback if empty
  if (result.components === 0) {
    const fallback = chosenMode === "ink" ? "region" : "ink";
    notes.push(`Fallback from "${chosenMode}" to "${fallback}" (primary yielded no component)`);
    chosenMode = fallback;
    result = buildSilhouette(chosenMode, ink, gray, opaque, width, height, threshold, alphaMin, minPixels);
  }

  // Fallback if bbox too small
  if (result.components > 0) {
    const spanX = result.bbox.x1 - result.bbox.x0;
    const spanY = result.bbox.y1 - result.bbox.y0;
    if (spanX < 1 || spanY < 1) {
      const fallback = chosenMode === "ink" ? "region" : "ink";
      notes.push(
        `Fallback from "${chosenMode}" to "${fallback}" (bbox too small: ${spanX}x${spanY})`,
      );
      chosenMode = fallback;
      result = buildSilhouette(chosenMode, ink, gray, opaque, width, height, threshold, alphaMin, minPixels);
    }
  }

  return {
    mask: result.mask,
    width,
    height,
    bbox: result.bbox,
    mode: chosenMode,
    components: result.components,
    largestShare: result.largestShare,
    notes,
  };
}

function shareOfLargest(counts: Map<number, number>, keep: number[]): number {
  let largest = 0;
  let all = 0;
  for (const [label, count] of counts) {
    if (!keep.includes(label)) continue;
    all += count;
    if (count > largest) largest = count;
  }
  return all === 0 ? 0 : largest / all;
}

function buildSilhouette(
  mode: "ink" | "region",
  ink: Uint8Array,
  gray: Uint8Array,
  opaque: Uint8Array,
  width: number,
  height: number,
  threshold: number,
  alphaMin: number,
  minPixels: number,
): { mask: Uint8Array; bbox: PixelBox; components: number; largestShare: number } {
  const total = width * height;
  let largestShare = 0;

  if (mode === "ink") {
    // Component-label the ink mask directly
    const { labels, counts } = labelComponents(ink, width, height);

    // Drop small components
    const kept = new Set<number>();
    for (const [lbl, cnt] of counts) {
      if (cnt >= minPixels) kept.add(lbl);
    }

    // Count remaining
    let componentCount = 0;
    for (const lbl of kept) {
      // Only count distinct roots
    }
    // Actually we need to count distinct labels in kept
    const distinctLabels = [...kept];
    componentCount = distinctLabels.length;
    largestShare = shareOfLargest(counts, distinctLabels);

    // Find largest
    let bestLabel = 0;
    let bestCount = 0;
    for (const lbl of distinctLabels) {
      const c = counts.get(lbl) ?? 0;
      if (c > bestCount) { bestCount = c; bestLabel = lbl; }
    }

    const mask = new Uint8Array(total);
    if (bestLabel === 0) {
      return { mask, bbox: { x0: 0, y0: 0, x1: -1, y1: -1 }, components: 0, largestShare: 0 };
    }

    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i < total; i++) {
      if (labels[i] === bestLabel) {
        mask[i] = 1;
        const x = i % width;
        const y = (i / width) | 0;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }

    return { mask, bbox: { x0, y0, x1, y1 }, components: componentCount, largestShare };
  }

  // region mode: flood-fill from border non-ink pixels to find the "outside",
  // then enclosed bright pixels are the part.
  const visited = new Uint8Array(total);
  const queue: number[] = [];

  const enqueue = (x: number, y: number) => {
    const idx = y * width + x;
    if (visited[idx] || ink[idx]) return;
    visited[idx] = 1;
    queue.push(idx);
  };

  // Seed from all border pixels that are non-ink and opaque
  for (let x = 0; x < width; x++) {
    if (opaque[x] && !ink[x]) enqueue(x, 0);
    const bottomIdx = (height - 1) * width + x;
    if (opaque[bottomIdx] && !ink[bottomIdx]) enqueue(x, height - 1);
  }
  for (let y = 1; y < height - 1; y++) {
    if (opaque[y * width] && !ink[y * width]) enqueue(0, y);
    const rightIdx = y * width + (width - 1);
    if (opaque[rightIdx] && !ink[rightIdx]) enqueue(width - 1, y);
  }

  // BFS flood fill
  let qi = 0;
  while (qi < queue.length) {
    const idx = queue[qi++];
    const x = idx % width;
    const y = (idx / width) | 0;
    if (x > 0) enqueue(x - 1, y);
    if (x < width - 1) enqueue(x + 1, y);
    if (y > 0) enqueue(x, y - 1);
    if (y < height - 1) enqueue(x, y + 1);
  }

  // Enclosed = opaque + non-ink + NOT visited by flood
  const enclosed = new Uint8Array(total);
  for (let i = 0; i < total; i++) {
    if (opaque[i] && !ink[i] && !visited[i]) enclosed[i] = 1;
  }

  // Component-label the enclosed mask
  const { labels, counts } = labelComponents(enclosed, width, height);

  // Drop small
  const kept = new Set<number>();
  for (const [lbl, cnt] of counts) {
    if (cnt >= minPixels) kept.add(lbl);
  }

  const distinctLabels = [...kept];
  const componentCount = distinctLabels.length;
  largestShare = shareOfLargest(counts, distinctLabels);

  let bestLabel = 0;
  let bestCount = 0;
  for (const lbl of distinctLabels) {
    const c = counts.get(lbl) ?? 0;
    if (c > bestCount) { bestCount = c; bestLabel = lbl; }
  }

  const mask = new Uint8Array(total);
  if (bestLabel === 0) {
    return { mask, bbox: { x0: 0, y0: 0, x1: -1, y1: -1 }, components: 0, largestShare: 0 };
  }

  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < total; i++) {
    if (labels[i] === bestLabel) {
      mask[i] = 1;
      const x = i % width;
      const y = (i / width) | 0;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }

  return { mask, bbox: { x0, y0, x1, y1 }, components: componentCount, largestShare };
}

// ---- Crop silhouette ----

export function cropSilhouetteToBBox(sil: Silhouette): { mask: Uint8Array; width: number; height: number } {
  const { bbox, mask, width: w, height: h } = sil;
  if (bbox.x0 > bbox.x1 || bbox.y0 > bbox.y1) {
    return { mask: new Uint8Array(0), width: 0, height: 0 };
  }
  const bw = bbox.x1 - bbox.x0 + 1;
  const bh = bbox.y1 - bbox.y0 + 1;
  const out = new Uint8Array(bw * bh);
  for (let y = 0; y < bh; y++) {
    const srcRow = (bbox.y0 + y) * w + bbox.x0;
    const dstRow = y * bw;
    for (let x = 0; x < bw; x++) {
      out[dstRow + x] = mask[srcRow + x];
    }
  }
  return { mask: out, width: bw, height: bh };
}

// ---- Resample mask into a different coordinate frame ----

export function resampleMaskIntoFrame(
  mask: Uint8Array,
  width: number,
  height: number,
  sourceBounds: Bounds2D,
  targetBounds: Bounds2D,
  targetWidth: number,
  targetHeight: number,
): Uint8Array {
  const out = new Uint8Array(targetWidth * targetHeight);
  const sdx = sourceBounds.maxX - sourceBounds.minX || 1;
  const sdy = sourceBounds.maxY - sourceBounds.minY || 1;
  const tdx = targetBounds.maxX - targetBounds.minX || 1;
  const tdy = targetBounds.maxY - targetBounds.minY || 1;

  for (let ty = 0; ty < targetHeight; ty++) {
    // flipY: target row 0 = targetBounds.maxY
    const worldY = targetBounds.maxY - (ty / (targetHeight - 1 || 1)) * tdy;
    // Map worldY back into source pixel
    const srcV = (worldY - sourceBounds.minY) / sdy; // 0..1
    const srcY = Math.round((1 - srcV) * (height - 1)); // flipY: row 0 = maxY

    for (let tx = 0; tx < targetWidth; tx++) {
      const worldX = targetBounds.minX + (tx / (targetWidth - 1 || 1)) * tdx;
      const srcU = (worldX - sourceBounds.minX) / sdx; // 0..1
      const srcX = Math.round(srcU * (width - 1));

      if (srcY >= 0 && srcY < height && srcX >= 0 && srcX < width) {
        out[ty * targetWidth + tx] = mask[srcY * width + srcX];
      }
    }
  }
  return out;
}
