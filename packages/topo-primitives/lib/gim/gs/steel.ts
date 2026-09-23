// 规范型钢构件解析与构建 (Q/GDW 11809—2018 附录 B 型钢构件)
// 18 种型钢节点共用驱动参数: Model (型号字符串, 如 L50X4) + Length (长度, mm)。
// 与 topotypes gim/gs/steel.go 的 ParseSteelSection / GB 牌号表保持同一套口径。

export enum SteelSectionKind {
  Angle = "Angle", // 角钢(等边/不等边)
  IBeam = "IBeam", // 工字钢/H型钢/轻型工字钢
  Channel = "Channel", // 槽钢/轻型槽钢
  Flat = "Flat", // 扁钢
  Tee = "Tee", // T型钢
  Round = "Round", // 圆钢
  RoundTube = "RoundTube", // 圆钢管
  RectTube = "RectTube", // 矩形钢管
  SquareTube = "SquareTube", // 方形钢管
  DoubleChannel = "DoubleChannel", // 双槽钢
  DoubleAngle = "DoubleAngle", // 双角钢(等边/不等边)
  PolygonTube = "PolygonTube", // 多边形钢管
}

export interface SteelSection {
  kind: SteelSectionKind;
  leg1: number;
  leg2: number;
  thickness: number;
  flangeThickness: number;
  diameter: number;
  sides: number;
}

// 规范附录 B 全部型钢节点名 (JSON type 后缀)
export const SteelSpecNodeNames = [
  "EquilateralAngleSteel", "ScaleneAngleSteel", "I-Beam", "ILightbeams", "H-beam",
  "BeamChannel", "LightBeamChannel", "FlatSteel", "L-Steel", "T-Steel",
  "RoundSteel", "RoundSteelTube", "RectangularSteelTube", "SquareSteelTube",
  "DoubleChannelSteel", "EquilateralDoubleAngleSteel", "UnequalAngleSteel",
  "PolygonRoundSteelTube",
] as const;

function parseDimList(s: string, counts: number[]): number[] {
  const parts = s.split(/[*X\s]/).filter((p) => p.length > 0);
  if (parts.length === 0) throw new Error("无尺寸数据");
  const nums = parts.map((p) => {
    const v = parseFloat(p.trim());
    if (Number.isNaN(v)) throw new Error(`尺寸 ${p} 非法`);
    return v;
  });
  if (!counts.includes(nums.length)) {
    throw new Error(`尺寸个数 ${nums.length} 不匹配 [${counts.join(",")}]`);
  }
  return nums;
}

function iBeamSection(kind: SteelSectionKind, nums: number[]): SteelSection {
  return {
    kind,
    leg1: nums[0],
    leg2: nums[1],
    thickness: nums[2],
    flangeThickness: nums[3],
    diameter: 0,
    sides: 0,
  };
}

// GB/T 706-2008 常用牌号截面表: [截面高, 翼缘宽, 腹板厚, 翼缘厚]
export const GBIBeamSections: Record<string, number[]> = {
  "10": [100, 68, 4.5, 7.6], "12": [120, 74, 5.0, 8.4], "12.6": [126, 74, 5.0, 8.4],
  "14": [140, 80, 5.5, 9.1], "16": [160, 88, 6.0, 9.9], "18": [180, 94, 6.5, 10.7],
  "20a": [200, 100, 7.0, 11.4], "20b": [200, 102, 9.0, 11.4],
  "22a": [220, 110, 7.5, 12.3], "22b": [220, 112, 9.5, 12.3],
  "24a": [240, 116, 8.0, 13.0], "24b": [240, 118, 10.0, 13.0],
  "25a": [250, 116, 8.0, 13.0], "25b": [250, 118, 10.0, 13.0],
  "27a": [270, 122, 8.5, 13.7], "27b": [270, 124, 10.5, 13.7],
  "28a": [280, 122, 8.5, 13.7], "28b": [280, 124, 10.5, 13.7],
  "30a": [300, 126, 9.0, 14.4], "30b": [300, 128, 11.0, 14.4], "30c": [300, 130, 13.0, 14.4],
  "32a": [320, 130, 9.5, 15.0], "32b": [320, 132, 11.5, 15.0], "32c": [320, 134, 13.5, 15.0],
  "36a": [360, 136, 10.0, 15.8], "36b": [360, 138, 12.0, 15.8], "36c": [360, 140, 14.0, 15.8],
  "40a": [400, 142, 10.5, 16.5], "40b": [400, 144, 12.5, 16.5], "40c": [400, 146, 14.5, 16.5],
};

export const GBLightIBeamSections: Record<string, number[]> = {
  "10": [100, 55, 4.5, 7.2], "12": [120, 64, 4.8, 7.3], "14": [140, 73, 4.9, 7.5],
  "16": [160, 81, 5.0, 7.8], "18": [180, 90, 5.1, 8.1], "20": [200, 100, 5.2, 8.4],
  "22": [220, 110, 5.4, 8.7], "24": [240, 115, 5.6, 8.9], "27": [270, 125, 6.0, 9.5],
  "30": [300, 135, 6.5, 10.0],
};

export const GBChannelSections: Record<string, number[]> = {
  "5": [50, 37, 4.5, 7.0], "6.3": [63, 40, 4.8, 7.5], "8": [80, 43, 5.0, 8.0],
  "10": [100, 48, 5.3, 8.5], "12.6": [126, 53, 5.5, 9.0],
  "14a": [140, 58, 6.0, 9.5], "14b": [140, 60, 8.0, 9.5],
  "16a": [160, 63, 6.5, 10.0], "16b": [160, 65, 8.5, 10.0],
  "18a": [180, 68, 7.0, 10.5], "18b": [180, 70, 9.0, 10.5],
  "20a": [200, 73, 7.0, 11.0], "20b": [200, 75, 9.0, 11.0],
  "22a": [220, 77, 7.0, 11.5], "22b": [220, 79, 9.0, 11.5],
  "25a": [250, 78, 7.0, 12.0], "25b": [250, 80, 9.0, 12.0], "25c": [250, 82, 11.0, 12.0],
  "28a": [280, 82, 7.5, 12.5], "28b": [280, 84, 9.5, 12.5], "28c": [280, 86, 11.5, 12.5],
  "32a": [320, 88, 8.0, 14.0], "32b": [320, 90, 10.0, 14.0], "32c": [320, 92, 12.0, 14.0],
};

export const GBLightChannelSections: Record<string, number[]> = {
  "5": [50, 32, 4.4, 7.0], "6.5": [65, 36, 4.4, 7.2], "8": [80, 40, 4.5, 7.4],
  "10": [100, 46, 4.5, 7.6], "12": [120, 52, 4.8, 7.8], "14": [140, 58, 4.9, 8.1],
  "16": [160, 64, 5.0, 8.4], "18": [180, 70, 5.1, 8.7], "20": [200, 76, 5.2, 9.0],
};

function gbLookup(
  table: Record<string, number[]>,
  designation: string,
  kind: SteelSectionKind,
): SteelSection | undefined {
  const dims = table[designation.toLowerCase()];
  if (!dims) return undefined;
  return {
    kind,
    leg1: dims[0],
    leg2: dims[1],
    thickness: dims[2],
    flangeThickness: dims[3],
    diameter: 0,
    sides: 0,
  };
}

// 解析纯牌号 (无显式尺寸): "I20a"/"I20"/"20a" → 工字钢; "C10"/"[10"/"10#"/"10" → 槽钢
function parseGBDesignation(
  s: string,
  opts: { forceChannel?: boolean; lightI?: boolean; lightC?: boolean },
): SteelSection | undefined {
  let designation = s.replace(/#$/, "").toLowerCase();
  let isChannel = opts.forceChannel === true;
  let isI = false;
  if (designation.startsWith("i")) {
    isI = true;
    designation = designation.slice(1);
  } else if (designation.startsWith("c")) {
    isChannel = true;
    designation = designation.slice(1);
  } else if (designation.startsWith("[")) {
    isChannel = true;
    designation = designation.slice(1);
  }
  if (designation === "") return undefined;
  const m = designation.match(/^(\d+(?:\.\d+)?)([abc])?$/);
  if (!m) return undefined;
  let key = designation;
  if (!m[2]) {
    // 无变体的整数高度, 同表内存在 a 变体时默认取 a (工字钢 20 → 20a)
    const table = isI
      ? (opts.lightI ? GBLightIBeamSections : GBIBeamSections)
      : (opts.lightC ? GBLightChannelSections : GBChannelSections);
    if (table[key + "a"] && !key.includes(".")) key = key + "a";
  }
  const table = isI
    ? (opts.lightI ? GBLightIBeamSections : GBIBeamSections)
    : (opts.lightC ? GBLightChannelSections : GBChannelSections);
  const kind: SteelSectionKind = isI ? SteelSectionKind.IBeam : SteelSectionKind.Channel;
  return gbLookup(table, key, kind);
}

export interface ParseSteelOptions {
  lightI?: boolean;
  lightC?: boolean;
}

// 解析规范型钢型号字符串为截面尺寸。
// 支持显式尺寸型号与 GB 常用牌号; 仅含未收录牌号的型号返回 undefined。
export function parseSteelSectionForNode(
  node: string,
  model: string,
): SteelSection | undefined {
  const opts = {
    lightI: node === "ILightbeams",
    lightC: node === "LightBeamChannel",
  };
  return parseSteelSection(model, opts);
}

export function parseSteelSection(
  model: string,
  opts: ParseSteelOptions = {},
): SteelSection | undefined {
  let s = model.trim().toUpperCase().replace(/×/g, "X").replace(/Φ/g, "φ");
  if (s === "") return undefined;

  // 多边形钢管 P{边数}X{对边距}X{壁厚}
  if (s.startsWith("P")) {
    let nums: number[];
    try {
      nums = parseDimList(s.slice(1), [3]);
    } catch {
      return undefined;
    }
    if (nums[0] < 3) return undefined;
    return { kind: SteelSectionKind.PolygonTube, sides: nums[0], leg1: nums[1], thickness: nums[2], leg2: 0, flangeThickness: 0, diameter: 0 };
  }

  // 双型钢 2[... / 2C... / 2L...
  let double = false;
  if (s.startsWith("2") && s.length > 1) {
    const rest = s.slice(1);
    if (rest.startsWith("[") || rest.startsWith("C")) {
      double = true;
      s = "C" + rest.replace(/^[[]/, "").replace(/^C/, "");
    } else if (rest.startsWith("L")) {
      double = true;
      s = rest;
    }
  }

  const tryDouble = (sec: SteelSection, doubleKind: SteelSectionKind): SteelSection =>
    double ? { ...sec, kind: doubleKind } : sec;

  if (s.startsWith("L")) {
    let nums: number[];
    try {
      nums = parseDimList(s.slice(1), [2, 3]);
    } catch {
      return undefined;
    }
    const sec: SteelSection = {
      kind: SteelSectionKind.Angle,
      leg1: nums[0],
      leg2: nums.length === 3 ? nums[1] : nums[0],
      thickness: nums[nums.length - 1],
      flangeThickness: 0,
      diameter: 0,
      sides: 0,
    };
    return tryDouble(sec, SteelSectionKind.DoubleAngle);
  }
  if (s.startsWith("I")) {
    try {
      return iBeamSection(SteelSectionKind.IBeam, parseDimList(s.slice(1), [4]));
    } catch {
      /* 继续尝试 GB 牌号 */
    }
    return parseGBDesignation(s, { ...opts, forceChannel: false });
  }
  if (s.startsWith("H")) {
    try {
      return iBeamSection(SteelSectionKind.IBeam, parseDimList(s.slice(1), [4]));
    } catch {
      return undefined;
    }
  }
  if (s.startsWith("C") || s.startsWith("[")) {
    try {
      const sec = iBeamSection(SteelSectionKind.Channel, parseDimList(s.replace(/^[C[]/, ""), [4]));
      return tryDouble(sec, SteelSectionKind.DoubleChannel);
    } catch {
      /* 继续尝试 GB 牌号 */
    }
    const gb = parseGBDesignation(s, { ...opts, forceChannel: true });
    if (gb) return tryDouble(gb, SteelSectionKind.DoubleChannel);
    return undefined;
  }
  if (s.startsWith("-") || s.startsWith("F")) {
    try {
      const nums = parseDimList(s.replace(/^[-F]/, ""), [2]);
      return { kind: SteelSectionKind.Flat, leg1: nums[0], thickness: nums[1], leg2: 0, flangeThickness: 0, diameter: 0, sides: 0 };
    } catch {
      return undefined;
    }
  }
  if (s.startsWith("T")) {
    let nums: number[];
    try {
      nums = parseDimList(s.slice(1), [2, 4]);
    } catch {
      return undefined;
    }
    if (nums.length === 4) return iBeamSection(SteelSectionKind.Tee, nums);
    return { kind: SteelSectionKind.Tee, leg1: nums[0], thickness: nums[1], leg2: 0, flangeThickness: 0, diameter: 0, sides: 0 };
  }
  if (s.startsWith("R")) {
    try {
      const nums = parseDimList(s.slice(1), [3]);
      return { kind: SteelSectionKind.RectTube, leg1: nums[0], leg2: nums[1], thickness: nums[2], flangeThickness: 0, diameter: 0, sides: 0 };
    } catch {
      return undefined;
    }
  }
  if (s.startsWith("S")) {
    try {
      const nums = parseDimList(s.slice(1), [2]);
      return { kind: SteelSectionKind.SquareTube, leg1: nums[0], thickness: nums[1], leg2: 0, flangeThickness: 0, diameter: 0, sides: 0 };
    } catch {
      return undefined;
    }
  }
  if (s.startsWith("□")) {
    try {
      const nums = parseDimList(s.slice(1), [2, 3]);
      if (nums.length === 3) {
        return { kind: SteelSectionKind.RectTube, leg1: nums[0], leg2: nums[1], thickness: nums[2], flangeThickness: 0, diameter: 0, sides: 0 };
      }
      return { kind: SteelSectionKind.SquareTube, leg1: nums[0], thickness: nums[1], leg2: 0, flangeThickness: 0, diameter: 0, sides: 0 };
    } catch {
      return undefined;
    }
  }
  if (s.startsWith("φ") || s.startsWith("D")) {
    const body = s.replace(/^φ/, "").replace(/^D/, "");
    try {
      const nums = parseDimList(body, [1, 2]);
      if (nums.length === 2) {
        return { kind: SteelSectionKind.RoundTube, diameter: nums[0], thickness: nums[1], leg1: 0, leg2: 0, flangeThickness: 0, sides: 0 };
      }
      return { kind: SteelSectionKind.Round, diameter: nums[0], leg1: 0, leg2: 0, thickness: 0, flangeThickness: 0, sides: 0 };
    } catch {
      return undefined;
    }
  }
  // 无前缀纯牌号按槽钢尝试 (如 10#)
  const gb = parseGBDesignation(s, { ...opts, forceChannel: true });
  if (gb) return tryDouble(gb, SteelSectionKind.DoubleChannel);
  return undefined;
}
