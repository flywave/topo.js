// 布局算法共用的折线/查表数学 (移植自 go-topo track_yard.go / track_geojson.go / ocs_anchor.go)
// 纯 TS 实现, 不依赖 WASM。单位: 长度 mm, 里程 m。

export type Vec3 = [number, number, number];

export function ptDist(a: Vec3, b: Vec3): number {
    const dx = a[0] - b[0], dy = a[1] - b[1], dz = a[2] - b[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// 点列累计弧长
export function polyArcLens(pts: Vec3[]): number[] {
    const acc = new Array<number>(pts.length).fill(0);
    for (let i = 1; i < pts.length; i++) {
        acc[i] = acc[i - 1] + ptDist(pts[i - 1], pts[i]);
    }
    return acc;
}

// 弧长 s 处的插值点 (越界钳制到端点)
export function pointAtArcLen(pts: Vec3[], acc: number[], s: number): Vec3 {
    const total = acc[acc.length - 1];
    if (s < 0) s = 0;
    if (s > total) s = total;
    for (let i = 1; i < pts.length; i++) {
        if (acc[i] >= s) {
            const seg = acc[i] - acc[i - 1];
            const t = (s - acc[i - 1]) / Math.max(seg, 1e-9);
            const d0 = pts[i - 1], d1 = pts[i];
            return [d0[0] + (d1[0] - d0[0]) * t, d0[1] + (d1[1] - d0[1]) * t, d0[2] + (d1[2] - d0[2]) * t];
        }
    }
    return pts[pts.length - 1];
}

// 按弧长截取点列 [s0, s1]; 长度 <100mm 返回空 (与 Go trimPolyline 一致)
export function trimPolyline(pts: Vec3[], s0: number, s1: number): Vec3[] {
    const acc = polyArcLens(pts);
    const total = acc[acc.length - 1];
    if (s0 < 0) s0 = 0;
    if (s1 > total) s1 = total;
    if (s1 - s0 < 100) return [];
    const out: Vec3[] = [pointAtArcLen(pts, acc, s0)];
    for (let i = 1; i < pts.length - 1; i++) {
        if (acc[i] > s0 && acc[i] < s1) out.push(pts[i]);
    }
    out.push(pointAtArcLen(pts, acc, s1));
    return out;
}

// 距端点 arcLen 处的水平切向单位向量 (指向边内部)
export function dirAtEnd(pts: Vec3[], fromStart: boolean, arcLen: number): Vec3 {
    const acc = polyArcLens(pts);
    const total = acc[acc.length - 1];
    if (arcLen > total) arcLen = total;
    let a: Vec3, b: Vec3;
    if (fromStart) {
        a = pts[0];
        b = pointAtArcLen(pts, acc, arcLen);
    } else {
        a = pts[pts.length - 1];
        b = pointAtArcLen(pts, acc, total - arcLen);
    }
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const l = Math.sqrt(dx * dx + dy * dy);
    if (l < 1e-9) return [1, 0, 0];
    return [dx / l, dy / l, 0];
}

// 两点处方向采样: 距端点 s0 与 s1 之间的弦方向 (用于估计道岔号数)
export function chordDir(pts: Vec3[], fromStart: boolean, s0: number, s1: number): Vec3 {
    const acc = polyArcLens(pts);
    const total = acc[acc.length - 1];
    if (!fromStart) {
        const t0 = total - s1, t1 = total - s0;
        s0 = t0; s1 = t1;
    }
    const a = pointAtArcLen(pts, acc, s0), b = pointAtArcLen(pts, acc, s1);
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const l = Math.sqrt(dx * dx + dy * dy);
    if (l < 1e-9) return [1, 0, 0];
    return [dx / l, dy / l, 0];
}

// 线上点 + 横向单位向量 (行进左侧), mileage 单位 mm
export function frameAt(pts: Vec3[], mileage: number): { pos: Vec3; perp: Vec3 } {
    const acc = polyArcLens(pts);
    const total = acc[acc.length - 1];
    if (mileage < 0) mileage = 0;
    if (mileage > total) mileage = total;
    for (let i = 1; i < pts.length; i++) {
        if (acc[i] >= mileage) {
            const seg = acc[i] - acc[i - 1];
            const t = (mileage - acc[i - 1]) / Math.max(seg, 1e-9);
            const d0 = pts[i - 1], d1 = pts[i];
            const pos: Vec3 = [d0[0] + (d1[0] - d0[0]) * t, d0[1] + (d1[1] - d0[1]) * t, d0[2] + (d1[2] - d0[2]) * t];
            const dx = d1[0] - d0[0], dy = d1[1] - d0[1];
            const l = Math.hypot(dx, dy);
            if (l < 1e-9) return { pos, perp: [0, 1, 0] };
            return { pos, perp: [-dy / l, dx / l, 0] }; // 行进左侧
        }
    }
    return { pos: pts[pts.length - 1], perp: [0, 1, 0] };
}

// 辙叉查表 (与 C++ calculate_frog_params 一致)
export interface FrogTable {
    leadR: number;      // 导曲线半径
    swLen: number;      // 尖轨长度
    frogTotal: number;  // 辙叉全长
}

export function frogTableFor(n: number): FrogTable {
    let leadR: number, swLen: number;
    switch (n) {
        case 9: leadR = 180000; swLen = 6450; break;
        case 18: leadR = 800000; swLen = 12500; break;
        case 30: leadR = 2700000; swLen = 15400; break;
        case 42: leadR = 5000000; swLen = 19200; break;
        default: n = 12; leadR = 350000; swLen = 7700; break;
    }
    return { leadR, swLen, frogTotal: 1435 * n * 0.28 };
}

// 角度 → 最近标准道岔号数
export function snapTurnoutNo(alpha: number): number {
    let best = 12, bestD = 1e9;
    for (const n of [9, 12, 18, 30, 42]) {
        const d = Math.abs(Math.atan(1.0 / n) - alpha);
        if (d < bestD) { bestD = d; best = n; }
    }
    return best;
}

// 标准钢轨断面查表 (与 C++ standard_rail_params 一致)
// 返回 [railHeight, headWidth, baseWidth]
export function standardRailDims(kgPerMeter: number): [number, number, number] {
    switch (Math.round(kgPerMeter)) {
        case 43: return [140, 70, 114];
        case 50: return [152, 70, 132];
        case 75: return [192, 75, 150];
        default: return [176, 73, 150]; // 60
    }
}

// Assembly embind 绑定内部使用 instanceof(val.global("Workplane")/"Assembly") 判别子件类型,
// 而 embind 类只挂在模块实例上、不进全局, Node/浏览器下直接调 Assembly.create/add 会抛
// "Right-hand side of 'instanceof' is not an object"。这里把模块类补到 globalThis 兜底。
export function ensureAssemblyGlobals(topo: any): void {
    const g = globalThis as any;
    if (g.Workplane === undefined && topo.Workplane !== undefined) g.Workplane = topo.Workplane;
    if (g.Assembly === undefined && topo.Assembly !== undefined) g.Assembly = topo.Assembly;
}

// gp_Pnt / gp_Dir 构造小助手 (dir 自动水平/单位化由调用方保证)
export function toGpPnt(topo: any, p: Vec3): any {
    return new topo.gp_Pnt_3(p[0], p[1], p[2]);
}

export function toGpDir(topo: any, d: Vec3): any {
    return new topo.gp_Dir_4(d[0], d[1], d[2]);
}
