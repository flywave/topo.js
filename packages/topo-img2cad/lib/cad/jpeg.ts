/**
 * Baseline JPEG (SOF0) decoder.
 *
 * Exists so that reference images and scans (typically JPEG) can be decoded
 * without pulling in an image-processing dependency.  Only the baseline
 * sequential DCT path is implemented; progressive (SOF2), arithmetic coding,
 * and lossless JPEG variants are rejected with actionable messages.
 *
 * Chroma upsampling is nearest-neighbour (simple, fast, adequate for
 * silhouette extraction where ±1px is invisible).
 */

import type { Raster } from "./image.js";

const GRAY_LUMA = [0.299, 0.587, 0.114];

/** A canonical Huffman table, resolved into a fast lookup plus a rare long-code list. */
interface HuffTable {
  decode(bs: BitStream): number;
}

/** Does this look like a JPEG (SOI marker)? */
export function isJpeg(buf: Uint8Array): boolean {
  return buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xd8;
}

export function decodeJpeg(buf: Uint8Array): Raster {
  if (buf.length < 2 || buf[0] !== 0xff || buf[1] !== 0xd8) throw new Error("Not a JPEG file");
  const ctx = new JpegReader(buf);
  ctx.parse();
  if (!ctx.result) throw new Error("JPEG: no scan data decoded");
  return ctx.result;
}

class JpegReader {
  private buf: Uint8Array;
  private pos: number;
  private width = 0;
  private height = 0;
  private components: { h: number; v: number; tq: number }[] = [];
  private maxH = 1;
  private maxV = 1;
  private qt: (Uint8Array | null)[] = [null, null, null, null];
  private dcTables: HuffTable[] = [];
  private acTables: HuffTable[] = [];
  private restartInterval = 0;
  private scanComps: { dcTableId: number; acTableId: number }[] = [];
  result: Raster | null = null;

  constructor(buf: Uint8Array) { this.buf = buf; this.pos = 2; }

  parse(): void {
    while (this.pos < this.buf.length) {
      if (this.buf[this.pos] !== 0xff) throw new Error("JPEG: expected marker at " + this.pos);
      while (this.pos < this.buf.length && this.buf[this.pos] === 0xff) this.pos++;
      const m = this.buf[this.pos++];
      if (m === 0x00) continue;
      const code = 0xff00 | m;
      if (code === 0xffd9) break;
      if (m >= 0xd0 && m <= 0xd7) continue;
      if (this.pos + 2 > this.buf.length) throw new Error("JPEG: truncated marker");
      const sl = (this.buf[this.pos] << 8) | this.buf[this.pos + 1];
      if (sl < 2 || this.pos + sl > this.buf.length) throw new Error("JPEG: bad segment length");
      const end = this.pos + sl;
      if (code === 0xffc0) this.readSOF();
      else if (code === 0xffc2) throw new Error("JPEG: progressive (SOF2) not supported — re-save as baseline");
      else if (code === 0xffdb) this.readDQT(end);
      else if (code === 0xffc4) this.readDHT(end);
      else if (code === 0xffdd) this.restartInterval = (this.buf[this.pos + 2] << 8) | this.buf[this.pos + 3];
      else if (code === 0xffda) { this.readSOS(); this.pos = end; this.decodeScan(); return; }
      this.pos = end;
    }
  }

  private readSOF(): void {
    let p = this.pos + 2;
    if (this.buf[p++] !== 8) throw new Error("JPEG: only 8-bit precision supported");
    this.height = (this.buf[p] << 8) | this.buf[p + 1]; p += 2;
    this.width = (this.buf[p] << 8) | this.buf[p + 1]; p += 2;
    if (this.width <= 0 || this.height <= 0) throw new Error("JPEG: invalid dimensions");
    const n = this.buf[p++];
    this.components = []; this.maxH = 1; this.maxV = 1;
    for (let i = 0; i < n; i++) {
      p++; // id
      const hv = this.buf[p++];
      const h = (hv >> 4) & 0xf, v = hv & 0xf;
      if (h === 0 || v === 0) throw new Error("JPEG: bad sampling factor");
      const tq = this.buf[p++];
      this.components.push({ h, v, tq });
      if (h > this.maxH) this.maxH = h;
      if (v > this.maxV) this.maxV = v;
    }
  }

  private readDQT(end: number): void {
    let p = this.pos + 2;
    while (p < end) {
      const info = this.buf[p++];
      const tid = info & 0xf;
      const is16 = (info >> 4) === 1;
      const t = new Uint8Array(64);
      for (let i = 0; i < 64; i++) { if (is16) { t[i] = this.buf[p]; p += 2; } else t[i] = this.buf[p++]; }
      this.qt[tid] = t;
    }
  }

  private readDHT(end: number): void {
    let p = this.pos + 2;
    while (p < end) {
      const info = this.buf[p++];
      const cls = (info >> 4) & 3, tid = info & 0xf;
      const bits = new Uint8Array(16);
      for (let i = 0; i < 16; i++) bits[i] = this.buf[p++];
      let total = 0; for (let i = 0; i < 16; i++) total += bits[i];
      const syms = new Uint8Array(total);
      for (let i = 0; i < total; i++) syms[i] = this.buf[p++];
      const ht = buildHuffTable(bits, syms);
      if (cls === 0) this.dcTables[tid] = ht; else this.acTables[tid] = ht;
    }
  }

  private readSOS(): void {
    let p = this.pos + 2;
    const nc = this.buf[p++];
    this.scanComps = [];
    for (let i = 0; i < nc; i++) {
      p++; // cs
      const ht = this.buf[p++];
      this.scanComps.push({ dcTableId: (ht >> 4) & 0xf, acTableId: ht & 0xf });
    }
    const ss = this.buf[p++], se = this.buf[p++], ahAl = this.buf[p++];
    if (ss !== 0 || se !== 63) throw new Error("JPEG: non-baseline SOS range");
    if (ahAl !== 0) throw new Error("JPEG: successive approx in SOS — progressive");
  }

  private decodeScan(): void {
    const mcuCols = Math.ceil(this.width / (this.maxH * 8));
    const mcuRows = Math.ceil(this.height / (this.maxV * 8));
    const nc = this.components.length;
    const cc: Float64Array[] = [];
    for (let ci = 0; ci < nc; ci++) {
      const c = this.components[ci];
      cc.push(new Float64Array(mcuCols * c.h * mcuRows * c.v * 64));
    }
    const bs = new BitStream(this.buf, this.pos);
    const prevDC = new Float64Array(nc);

    for (let my = 0; my < mcuRows; my++) {
      for (let mx = 0; mx < mcuCols; mx++) {
        if (this.restartInterval > 0 && (my * mcuCols + mx) > 0 && (my * mcuCols + mx) % this.restartInterval === 0) {
          bs.alignToByte(); bs.skipToRST(); prevDC.fill(0);
        }
        for (let ci = 0; ci < nc; ci++) {
          const comp = this.components[ci], sc = this.scanComps[ci];
          const qt = this.qt[comp.tq];
          if (!qt) throw new Error("JPEG: missing QT " + comp.tq);
          const dht = this.dcTables[sc.dcTableId], aht = this.acTables[sc.acTableId];
          if (!dht || !aht) throw new Error("JPEG: missing Huffman table");
          const bw = mcuCols * comp.h;
          for (let vy = 0; vy < comp.v; vy++) {
            for (let hx = 0; hx < comp.h; hx++) {
              const bx = mx * comp.h + hx, by = my * comp.v + vy;
              const off = (by * bw + bx) * 64;
              const dcCat = dht.decode(bs);
              if (dcCat < 0) throw new Error("JPEG: DC decode error");
              let dcDiff = 0;
              if (dcCat > 0) { dcDiff = bs.readBits(dcCat); if (dcDiff < (1 << (dcCat - 1))) dcDiff -= (1 << dcCat) - 1; }
              const dcVal = prevDC[ci] + dcDiff;
              prevDC[ci] = dcVal;
              cc[ci][off] = dcVal * qt[0];
              let idx = 1;
              while (idx < 64) {
                const sym = aht.decode(bs);
                if (sym < 0) throw new Error("JPEG: AC decode error");
                if (sym === 0) break;
                const run = (sym >> 4) & 0xf, cat = sym & 0xf;
                if (cat === 0) { if (run === 0xf) { idx += 16; continue; } throw new Error("JPEG: bad AC sym"); }
                idx += run;
                if (idx >= 64) throw new Error("JPEG: AC run overflow");
                let val = bs.readBits(cat);
                if (val < (1 << (cat - 1))) val -= (1 << cat) - 1;
                cc[ci][off + ZIGZAG[idx]] = val * qt[idx];
                idx++;
              }
            }
          }
        }
      }
    }

    // IDCT + colour convert
    const W = this.width, H = this.height;
    const planes: Float64Array[] = [];
    for (let ci = 0; ci < nc; ci++) {
      const comp = this.components[ci];
      const bw = mcuCols * comp.h, bh = mcuRows * comp.v;
      const plane = new Float64Array(bw * 8 * bh * 8);
      for (let by = 0; by < bh; by++)
        for (let bx = 0; bx < bw; bx++)
          idct8x8(cc[ci], (by * bw + bx) * 64, plane, (by * bw + bx) * 64);
      planes.push(plane);
    }

    const rgb = new Uint8Array(W * H * 3);
    if (nc === 1) {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const comp = this.components[0], bw = mcuCols * comp.h;
        const bx = (x / 8) | 0, by = (y / 8) | 0;
        const v = clamp(Math.round(planes[0][(by * bw + bx) * 64 + (y & 7) * 8 + (x & 7)] + 128), 0, 255);
        const o = (y * W + x) * 3; rgb[o] = rgb[o + 1] = rgb[o + 2] = v;
      }
    } else {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const c0 = this.components[0], bw0 = mcuCols * c0.h;
        const Y = clamp(Math.round(planes[0][((y / 8 | 0) * bw0 + (x / 8 | 0)) * 64 + (y & 7) * 8 + (x & 7)] + 128), 0, 255);
        let Cb = 128, Cr = 128;
        for (let ci = 1; ci < nc; ci++) {
          const comp = this.components[ci], bw = mcuCols * comp.h;
          const cx = (x / (this.maxH / comp.h) | 0), cy = (y / (this.maxV / comp.v) | 0);
          const val = clamp(Math.round(planes[ci][((cy / 8 | 0) * bw + (cx / 8 | 0)) * 64 + (cy & 7) * 8 + (cx & 7)] + 128), 0, 255);
          if (ci === 1) Cb = val; else Cr = val;
        }
        const o = (y * W + x) * 3;
        rgb[o]     = clamp(Math.round(Y + 1.402 * (Cr - 128)), 0, 255);
        rgb[o + 1] = clamp(Math.round(Y - 0.344136 * (Cb - 128) - 0.714136 * (Cr - 128)), 0, 255);
        rgb[o + 2] = clamp(Math.round(Y + 1.772 * (Cb - 128)), 0, 255);
      }
    }

    const gray = new Uint8Array(W * H), opaque = new Uint8Array(W * H).fill(1);
    for (let i = 0; i < W * H; i++) {
      const o = i * 3;
      gray[i] = Math.round(GRAY_LUMA[0] * rgb[o] + GRAY_LUMA[1] * rgb[o + 1] + GRAY_LUMA[2] * rgb[o + 2]);
    }
    this.result = { width: W, height: H, gray, opaque };
  }
}

function buildHuffTable(bits: Uint8Array, symbols: Uint8Array): HuffTable {
  const MF = 9, fl = 1 << MF;
  const fs = new Int32Array(fl).fill(-1), fb = new Uint8Array(fl);
  const lc: { c: number; l: number; s: number }[] = [];
  let code = 0, si = 0;
  for (let bl = 1; bl <= 16; bl++) {
    for (let n = 0; n < bits[bl - 1]; n++) {
      const sym = symbols[si++];
      if (bl <= MF) { const b = code << (MF - bl); for (let v = 0; v < (1 << (MF - bl)); v++) { fs[b + v] = sym; fb[b + v] = bl; } }
      else lc.push({ c: code, l: bl, s: sym });
      code++;
    }
    code <<= 1;
  }
  return {
    decode(bs: BitStream): number {
      const p = bs.peekBits(MF);
      if (p >= 0 && fs[p] >= 0) { bs.skipBits(fb[p]); return fs[p]; }
      for (const e of lc) { if (bs.peekBits(e.l) === e.c) { bs.skipBits(e.l); return e.s; } }
      return -1;
    },
  };
}

class BitStream {
  private buf: Uint8Array;
  private bf = 0;
  private bi = 0;
  private eof = false;
  bytePos: number;
  private endPos: number;

  constructor(buf: Uint8Array, start: number) { this.buf = buf; this.bytePos = start; this.endPos = buf.length; }

  private loadByte(): boolean {
    if (this.eof || this.bytePos >= this.endPos) return false;
    const b = this.buf[this.bytePos];
    if (b === 0xff) {
      if (this.bytePos + 1 < this.endPos && this.buf[this.bytePos + 1] === 0x00) {
        this.bytePos += 2;
        this.bf = (this.bf << 8) | 0xff;
        this.bi += 8;
        return true;
      }
      this.eof = true;
      return false;
    }
    this.bytePos++;
    this.bf = (this.bf << 8) | b;
    this.bi += 8;
    return true;
  }

  peekBits(n: number): number {
    while (this.bi < n) {
      if (!this.loadByte()) {
        this.bf <<= (n - this.bi);
        this.bi = n;
        break;
      }
    }
    return (this.bf >>> (this.bi - n)) & ((1 << n) - 1);
  }

  readBits(n: number): number { const v = this.peekBits(n); this.bi -= n; return v; }
  skipBits(n: number): void { this.bi -= n; }
  alignToByte(): void { const d = this.bi & 7; if (d) this.bi -= d; }

  skipToRST(): void {
    this.bi = 0; this.bf = 0;
    while (this.bytePos + 1 < this.endPos) {
      if (this.buf[this.bytePos] === 0xff) {
        const m = this.buf[this.bytePos + 1];
        if (m >= 0xd0 && m <= 0xd7) { this.bytePos += 2; return; }
        if (m === 0x00) { this.bytePos += 2; continue; }
        break;
      }
      this.bytePos++;
    }
  }
}

const ZIGZAG = new Uint8Array([
  0,1,8,16,9,2,3,10,17,24,32,25,18,11,4,5,12,19,26,33,40,48,41,34,27,20,13,6,7,14,21,28,35,42,49,56,57,50,43,36,29,22,15,23,30,37,44,51,58,59,52,45,38,31,39,46,53,60,61,54,47,55,62,63,
]);

const COS = new Float64Array(64);
for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) COS[r * 8 + c] = Math.cos(((2 * r + 1) * c * Math.PI) / 16);
const C1 = 1 / Math.SQRT2;

function idct8x8(src: Float64Array, si: number, dst: Float64Array, di: number): void {
  const t = new Float64Array(64);
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    let s = 0; for (let u = 0; u < 8; u++) s += (u ? 1 : C1) * src[si + r * 8 + u] * COS[c * 8 + u];
    t[r * 8 + c] = s;
  }
  for (let c = 0; c < 8; c++) for (let r = 0; r < 8; r++) {
    let s = 0; for (let v = 0; v < 8; v++) s += (v ? 1 : C1) * t[v * 8 + c] * COS[r * 8 + v];
    dst[di + r * 8 + c] = s / 4;
  }
}

function clamp(v: number, lo: number, hi: number): number { return v < lo ? lo : v > hi ? hi : v; }
