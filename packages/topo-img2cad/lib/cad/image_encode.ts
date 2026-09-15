
/**
 * Writing rasters back out.
 *
 * Two uses, both about making the pipeline's inputs and verdicts inspectable: a
 * single view is cropped out of a multi-view sheet before it is shown to the
 * model (a model asked to read "the front view" off a full sheet conflates
 * views), and a reference silhouette can be written back out when a model fails
 * the re-projection gate and the reason is not obvious from the numbers.
 */

import { deflateSync } from "node:zlib";
import type { Raster } from "./image.js";

// ---------------------------------------------------------------------------
// PNG writing
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

/**
 * Encode a raster as an 8-bit grayscale PNG.
 *
 * Two uses, both about making the pipeline's inputs and verdicts inspectable: a
 * single view is cropped out of a multi-view sheet before it is shown to the
 * model (a model asked to read "the front view" off a full sheet conflates
 * views), and a reference silhouette can be written back out when a model fails
 * the re-projection gate and the reason is not obvious from the numbers.
 */
export function encodePngGray(raster: Raster): Uint8Array {
  const { width, height, gray } = raster;
  const raw = new Uint8Array(height * (width + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (width + 1)] = 0; // filter: none
    raw.set(gray.subarray(y * width, (y + 1) * width), y * (width + 1) + 1);
  }

  const ihdr = new Uint8Array(13);
  const header = new DataView(ihdr.buffer);
  header.setUint32(0, width);
  header.setUint32(4, height);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 0; // color type: grayscale
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0; // not interlaced

  const parts = [
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", new Uint8Array(deflateSync(raw))),
    chunk("IEND", new Uint8Array(0)),
  ];

  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

/**
 * Render a mask as a viewable image, set pixels dark.
 *
 * Dark-on-light because that is how a silhouette is read by eye and how the
 * drawing it came from is drawn. Rendering it the other way round produces a
 * file that looks like a photograph of a hole.
 */
export function maskToRaster(mask: Uint8Array, width: number, height: number): Raster {
  const gray = new Uint8Array(mask.length);
  const opaque = new Uint8Array(mask.length);
  for (let i = 0; i < mask.length; i++) {
    gray[i] = mask[i] ? 0 : 255;
    opaque[i] = 1;
  }
  return { width, height, gray, opaque };
}
