/**
 * Baseline JPEG decoder tests.
 *
 * Uses pre-generated test fixtures in test/asset/ and ground-truth pixel
 * values from ImageMagick (±3 tolerance for IDCT/upsampling differences).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { decodeJpeg } from "../lib/cad/jpeg.js";
import { loadRaster, type Raster } from "../lib/cad/image.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadFixture(name: string): Uint8Array {
  return new Uint8Array(readFileSync(resolve(__dirname, "asset", name)));
}

function grayAt(r: Raster, x: number, y: number): number {
  return r.gray[y * r.width + x];
}

// ---- Dimensions ----

describe("JPEG decoder — dimensions", () => {
  it("jpeg-444 is 32×24", () => {
    const r = decodeJpeg(loadFixture("jpeg-444.jpg"));
    expect(r.width).toBe(32);
    expect(r.height).toBe(24);
  });

  it("jpeg-420 is 32×24", () => {
    const r = decodeJpeg(loadFixture("jpeg-420.jpg"));
    expect(r.width).toBe(32);
    expect(r.height).toBe(24);
  });

  it("jpeg-solid is 16×16", () => {
    const r = decodeJpeg(loadFixture("jpeg-solid.jpg"));
    expect(r.width).toBe(16);
    expect(r.height).toBe(16);
  });

  it("peiqi.jpeg is 1080x1307", () => {
    const r = decodeJpeg(loadFixture("peiqi.jpeg"));
    expect(r.width).toBe(1080);
    expect(r.height).toBe(1307);
  });
});

// ---- Pixel values (±3 tolerance for IDCT differences) ----

describe("JPEG decoder — 4:4:4 (jpeg-444.jpg)", () => {
  it("pixel (0,0) ≈ RGB(254,0,0) → gray≈76", () => {
    const r = decodeJpeg(loadFixture("jpeg-444.jpg"));
    // ImageMagick: (254,0,0) → gray = round(0.299*254) = 76
    expect(grayAt(r, 0, 0)).toBeGreaterThanOrEqual(73);
    expect(grayAt(r, 0, 0)).toBeLessThanOrEqual(79);
  });

  it("pixel (15,12) ≈ RGB(124,0,132) → gray≈52", () => {
    const r = decodeJpeg(loadFixture("jpeg-444.jpg"));
    // ImageMagick: (124,0,132) → gray = round(0.299*124+0.114*132) = 52
    expect(grayAt(r, 15, 12)).toBeGreaterThanOrEqual(49);
    expect(grayAt(r, 15, 12)).toBeLessThanOrEqual(55);
  });

  it("pixel (31,23) ≈ RGB(0,0,254) → gray≈29", () => {
    const r = decodeJpeg(loadFixture("jpeg-444.jpg"));
    // ImageMagick: (0,0,254) → gray = round(0.114*254) = 29
    expect(grayAt(r, 31, 23)).toBeGreaterThanOrEqual(26);
    expect(grayAt(r, 31, 23)).toBeLessThanOrEqual(32);
  });
});

describe("JPEG decoder — 4:2:0 (jpeg-420.jpg)", () => {
  it("pixel (0,0) ≈ RGB(248,2,5) → gray≈75", () => {
    const r = decodeJpeg(loadFixture("jpeg-420.jpg"));
    expect(grayAt(r, 0, 0)).toBeGreaterThanOrEqual(72);
    expect(grayAt(r, 0, 0)).toBeLessThanOrEqual(78);
  });

  it("pixel (15,12) ≈ RGB(121,2,132) → gray≈52", () => {
    const r = decodeJpeg(loadFixture("jpeg-420.jpg"));
    expect(grayAt(r, 15, 12)).toBeGreaterThanOrEqual(49);
    expect(grayAt(r, 15, 12)).toBeLessThanOrEqual(55);
  });

  it("pixel (31,23) ≈ RGB(5,0,245) → gray≈29", () => {
    const r = decodeJpeg(loadFixture("jpeg-420.jpg"));
    expect(grayAt(r, 31, 23)).toBeGreaterThanOrEqual(26);
    expect(grayAt(r, 31, 23)).toBeLessThanOrEqual(32);
  });
});

describe("JPEG decoder — solid color (jpeg-solid.jpg)", () => {
  it("all pixels ≈ RGB(58,123,213) → gray≈114", () => {
    const r = decodeJpeg(loadFixture("jpeg-solid.jpg"));
    // ImageMagick: (58,123,213) → gray = round(0.299*58+0.587*123+0.114*213) = 114
    const g = grayAt(r, 0, 0);
    expect(g).toBeGreaterThanOrEqual(111);
    expect(g).toBeLessThanOrEqual(117);
    // All pixels should be the same (uniform solid)
    for (let y = 0; y < r.height; y++) {
      for (let x = 0; x < r.width; x++) {
        expect(grayAt(r, x, y)).toBe(g);
      }
    }
  });
});

describe("JPEG decoder — real colour drawing (peiqi.jpeg)", () => {
  // Ground truth from ImageMagick. This file replaced the grayscale scan that
  // used to live here, so it also exercises the COLOUR path on a real drawing:
  // a CAD sheet whose dimension layer is drawn in blue over a black outline.
  const r = decodeJpeg(loadFixture("peiqi.jpeg"));

  it("decodes 1080x1307", () => {
    expect(r.width).toBe(1080);
    expect(r.height).toBe(1307);
  });

  it("reads the black page border", () => {
    // ImageMagick: (2,2,2) -> gray 2
    expect(Math.abs(grayAt(r, 0, 0) - 2)).toBeLessThanOrEqual(3);
  });

  it("reads open paper", () => {
    // ImageMagick: (540,653) = (255,254,252) -> gray 254
    expect(Math.abs(grayAt(r, 540, 653) - 254)).toBeLessThanOrEqual(3);
    // ImageMagick: (1079,1306) = (254,253,251) -> gray 253
    expect(Math.abs(grayAt(r, 1079, 1306) - 253)).toBeLessThanOrEqual(3);
  });

  it("keeps colour, because it is what separates annotation from the part", () => {
    // ImageMagick: (580,45) = (61,61,131) -> gray 69, and strongly blue: the
    // spread is 70. Read as luminance alone this is just another dark pixel, and
    // the annotation then chops the part's interior into unmeasurable pieces.
    const g = grayAt(r, 580, 45);
    expect(Math.abs(g - 69)).toBeLessThanOrEqual(3);
    expect(r.colorful?.[45 * 1080 + 580]).toBe(1);

    // The black border is not coloured, so it stays part ink.
    expect(r.colorful?.[0]).toBe(0);
  });
});

// ---- Rejection tests ----

describe("JPEG decoder — rejection", () => {
  it("rejects progressive JPEG (SOF2)", () => {
    // Construct a minimal progressive JPEG marker sequence
    const buf = new Uint8Array([
      0xff, 0xd8, // SOI
      0xff, 0xc2, 0x00, 0x0b, // SOF2, length 11
      0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x11, 0x00, // 8-bit, 1x1, 1 component
      0xff, 0xd9, // EOI
    ]);
    expect(() => decodeJpeg(buf)).toThrow(/progressive/i);
  });

  it("rejects truncated buffer", () => {
    const buf = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
    expect(() => decodeJpeg(buf)).toThrow();
  });

  it("rejects non-JPEG data", () => {
    expect(() => decodeJpeg(new Uint8Array([0x00, 0x01]))).toThrow(/Not a JPEG/);
  });
});

// ---- Integration with loadRaster ----

describe("loadRaster — JPEG integration", () => {
  it("loadRaster on JPEG path returns a raster", () => {
    const path = resolve(__dirname, "asset", "jpeg-444.jpg");
    const r = loadRaster(path);
    expect(r.width).toBe(32);
    expect(r.height).toBe(24);
    expect(r.opaque[0]).toBe(1); // JPEG has no alpha
  });

  it("loadRaster on PNG still works", () => {
    const path = resolve(__dirname, "../../../docs/media/img1.png");
    const r = loadRaster(path);
    expect(r.width).toBe(2559);
    expect(r.height).toBe(1292);
  });
});
