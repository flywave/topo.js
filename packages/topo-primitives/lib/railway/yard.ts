// =========================================================================
// 站场布局闭环 (移植自 go-topo yard_layout.go / track_yard.go / track_geojson.go)
//   computeYardLayout    纯识别计算: GeoJSON FeatureCollection → 股道裁剪/道岔/菱形交叉
//   createYardFromLayout 由布局确定性生成装配, 子件命名 rails_i/sleepers_i/turnout_i/crossing_i
// JSON schema 与 topotypes railway/layout.go 完全一致 (camelCase), 与 Go 侧 layout JSON 互通。
// 单位: mm; 道岔局部约定: 原点=岔心节点, 主行进方向 mainDir (水平单位向量)
// =========================================================================

import { Assembly, TopoInstance } from "topo-wasm";
import {
    Vec3, polyArcLens, trimPolyline, dirAtEnd, chordDir, ptDist,
    frogTableFor, snapTurnoutNo, standardRailDims,
    ensureAssemblyGlobals, toGpPnt, toGpDir,
} from "./layout_utils";

// TrackGeoProperties 股道生成参数 (轨距/超高/钢轨/轨枕/道床)
export interface TrackGeoProperties {
    gauge: number;            // 轨距(mm), 默认 1435
    railType: number;         // 钢轨类型 kg/m: 43/50/60/75, 默认 60
    superElevation: number;   // 超高(mm), 默认 0
    coordScale: number;       // 坐标→mm 缩放, 默认 1000 (米输入)
    sleeperLength: number;    // 轨枕长(mm), 默认 2600
    sleeperWidth: number;     // 默认 260
    sleeperHeight: number;    // 默认 200
    sleeperSpacing: number;   // 默认 600
    ballastTopWidth: number;  // 道床顶宽(mm), 默认 3600; 0=不生成道床
    ballastThickness: number; // 默认 300
    ballastSlope: number;     // 边坡 1:n, 默认 1.5
    noSleepers: boolean;      // true=不生成轨枕, 默认生成
}

function trackPropsWithDefaults(p: Partial<TrackGeoProperties>): TrackGeoProperties {
    const out: TrackGeoProperties = {
        gauge: p.gauge! > 0 ? p.gauge! : 1435,
        railType: p.railType! > 0 ? p.railType! : 60,
        superElevation: p.superElevation ?? 0,
        coordScale: p.coordScale! > 0 ? p.coordScale! : 1000,
        sleeperLength: p.sleeperLength! > 0 ? p.sleeperLength! : 2600,
        sleeperWidth: p.sleeperWidth! > 0 ? p.sleeperWidth! : 260,
        sleeperHeight: p.sleeperHeight! > 0 ? p.sleeperHeight! : 200,
        sleeperSpacing: p.sleeperSpacing! > 0 ? p.sleeperSpacing! : 600,
        ballastTopWidth: p.ballastTopWidth === undefined ? 3600 : Math.max(p.ballastTopWidth, 0),
        ballastThickness: p.ballastThickness! > 0 ? p.ballastThickness! : 300,
        ballastSlope: p.ballastSlope! > 0 ? p.ballastSlope! : 1.5,
        noSleepers: p.noSleepers ?? false,
    };
    return out;
}

// YardTrackLayout 一条股道的布局数据
// centerline 为未裁剪的原始中心线; trimS/trimE 为识别出的裁剪弧长
// (trimS=起点裁掉的长度, trimE=终点保留到的累计弧长, 0=全长)
export interface YardTrackLayout {
    centerline: Vec3[];           // 原始中心线点列 (mm)
    trimS: number;                // 起点裁剪弧长 (mm)
    trimE: number;                // 终点保留弧长 (自起点累计, mm; 0=全长)
    props: TrackGeoProperties;    // 轨距/超高/钢轨/轨枕等生成参数
}

// YardTurnoutLayout 一组单开道岔的布局数据 (createTurnoutWithPosition 所需全部参数)
export interface YardTurnoutLayout {
    position: Vec3;         // 岔心节点位置 (世界坐标)
    mainDir: Vec3;          // 主行进方向 (水平单位向量)
    isLeftHand: boolean;    // 开向: true=左开
    turnoutNo: number;      // 道岔号数 {9,12,18,30,42}
    switchRailLength: number; // 尖轨长度
    leadCurveRadius: number;  // 导曲线半径
    gauge: number;          // 轨距
    railHeight: number;     // 钢轨断面尺寸
    railHeadWidth: number;
    railBaseWidth: number;
    edgeIn: number;  // 主入边索引 (tracks 下标, 信息用)
    edgeOut: number; // 主出边索引
    edgeDiv: number; // 侧股边索引
}

// YardCrossingLayout 一个菱形交叉的布局数据 (createFrogWithPosition 所需全部参数)
export interface YardCrossingLayout {
    position: Vec3;   // 交点位置 (世界坐标)
    direction: Vec3;  // 辙叉角平分线方向 (水平单位向量)
    turnoutNo: number; // 辙叉号数
    gauge: number;     // 轨距
    railHeight: number; // 钢轨断面尺寸
    railHeadWidth: number;
    railBaseWidth: number;
    edgeA: number; // 相交边索引 (tracks 下标, 信息用)
    edgeB: number;
}

// YardLayout 生成一个站场所需的全部中间数据
export interface YardLayout {
    tracks: YardTrackLayout[];
    turnouts?: YardTurnoutLayout[];
    crossings?: YardCrossingLayout[];
}

export function yardLayoutToJSON(layout: YardLayout): string {
    return JSON.stringify(layout);
}

export function yardLayoutFromJSON(data: string): YardLayout {
    try {
        return JSON.parse(data) as YardLayout;
    } catch (e) {
        throw new Error(`yard: invalid layout JSON: ${e}`);
    }
}

// ---- GeoJSON 解析 (对应 Go ParseTrackGeoJSON, 单条 LineString Feature) ----

interface GeoJSONFeature {
    type: string;
    geometry?: { type: string; coordinates: number[][] };
    properties?: Partial<TrackGeoProperties>;
}

interface GeoJSONInput {
    type: string;
    features?: GeoJSONFeature[];
    geometry?: { type: string; coordinates: number[][] };
    properties?: Partial<TrackGeoProperties>;
    coordinates?: number[][];
}

function parseTrackGeoJSONFeature(f: GeoJSONFeature): { pts: Vec3[]; props: TrackGeoProperties } {
    if (!f.geometry || f.geometry.type !== "LineString") {
        throw new Error("Feature geometry must be LineString");
    }
    const coords = f.geometry.coordinates;
    if (!coords || coords.length < 2) {
        throw new Error("LineString needs at least 2 points");
    }
    const props = trackPropsWithDefaults(f.properties ?? {});
    const pts: Vec3[] = coords.map((c, i) => {
        if (!c || c.length < 2) throw new Error(`coordinate ${i} has <2 elements`);
        const z = c.length >= 3 ? c[2] : 0;
        return [c[0] * props.coordScale, c[1] * props.coordScale, z * props.coordScale];
    });
    return { pts, props };
}

// ---- computeYardLayout ----

interface YardEdge {
    pts: Vec3[];
    props: TrackGeoProperties;
}

interface YardNode {
    p: Vec3;
    ends: [number, number][]; // [边索引, 端点 (0=起点, 1=终点)]
}

// computeYardLayout 由 GeoJSON FeatureCollection 纯计算站场布局, 无副作用
// 识别规则 (与 Go ComputeYardLayout 一致):
//   - 端点聚类为节点 (容差 50mm), 度=3 → 单开道岔 (自动判开向/号数, 裁剪邻边)
//   - 两条边中部相交 (距节点 2m 以外) → 菱形交叉
export function computeYardLayout(data: string | GeoJSONInput): YardLayout {
    let inn: GeoJSONInput;
    try {
        inn = (typeof data === "string" ? JSON.parse(data) : data) as GeoJSONInput;
    } catch (e) {
        throw new Error(`invalid GeoJSON: ${e}`);
    }
    if (inn.type !== "FeatureCollection") {
        throw new Error("站场输入需要 FeatureCollection");
    }

    const edges: YardEdge[] = [];
    for (const f of inn.features ?? []) {
        if (!f.geometry || f.geometry.type !== "LineString" || (f.geometry.coordinates ?? []).length < 2) {
            continue;
        }
        edges.push(parseTrackGeoJSONFeature(f));
    }
    if (edges.length === 0) {
        throw new Error("no valid LineString features");
    }

    // 1. 端点聚类为节点 (容差 50mm)
    const nodeTol = 50.0;
    const nodes: YardNode[] = [];
    for (let ei = 0; ei < edges.length; ei++) {
        const e = edges[ei];
        const endPts: [Vec3, number][] = [[e.pts[0], 0], [e.pts[e.pts.length - 1], 1]];
        for (const [p, end] of endPts) {
            let found = -1;
            for (let ni = 0; ni < nodes.length; ni++) {
                if (ptDist(nodes[ni].p, p) < nodeTol) { found = ni; break; }
            }
            if (found < 0) {
                nodes.push({ p, ends: [] });
                found = nodes.length - 1;
            }
            nodes[found].ends.push([ei, end]);
        }
    }

    // 2. 道岔识别: 度=3 的节点
    const turnouts: YardTurnoutLayout[] = [];
    const trimS = new Map<number, number>(); // edge → 起点裁剪
    const trimE = new Map<number, number>(); // edge → 终点裁剪

    for (const nd of nodes) {
        if (nd.ends.length !== 3) continue;
        // 各端点方向 (指向边内部)
        const dirs: Vec3[] = nd.ends.map(([ei, end]) => dirAtEnd(edges[ei].pts, end === 0, 1000));
        // 主方向对 = 点积最小 (最接近反向共线)
        let pair: [number, number] = [0, 1];
        let minDot = 1e9;
        for (let i = 0; i < 3; i++) {
            for (let j = i + 1; j < 3; j++) {
                const d = dirs[i][0] * dirs[j][0] + dirs[i][1] * dirs[j][1];
                if (d < minDot) { minDot = d; pair = [i, j]; }
            }
        }
        const div = 3 - pair[0] - pair[1];
        // 主行进方向: 从主入边指向主出边
        const inD = dirs[pair[0]], outD = dirs[pair[1]];
        const mainDir: Vec3 = [outD[0] - inD[0], outD[1] - inD[1], 0];
        const l = Math.hypot(mainDir[0], mainDir[1]);
        if (l < 1e-9) continue;
        mainDir[0] /= l; mainDir[1] /= l;
        // 道岔号数: 侧股 15m~35m 弦方向与主向夹角
        const divEdge = edges[nd.ends[div][0]];
        const farDir = chordDir(divEdge.pts, nd.ends[div][1] === 0, 15000, 35000);
        const cross = mainDir[0] * farDir[1] - mainDir[1] * farDir[0];
        const dot = mainDir[0] * farDir[0] + mainDir[1] * farDir[1];
        let alpha = Math.atan2(Math.abs(cross), dot);
        if (alpha < 0.005) { // 近似共线, 无法判定
            alpha = Math.atan(1.0 / 12);
        }
        const no = snapTurnoutNo(alpha);
        const ft = frogTableFor(no);
        const g = divEdge.props.gauge;
        const hg = g > 0 ? g / 2 : 1435.0 / 2;
        const frogX = 2 * Math.sqrt(ft.leadR * hg);
        const [railH, headW, baseW] = standardRailDims(60);
        turnouts.push({
            position: [...nd.p] as Vec3,
            mainDir,
            isLeftHand: cross > 0,
            turnoutNo: no,
            switchRailLength: ft.swLen,
            leadCurveRadius: ft.leadR,
            gauge: 1435,
            railHeight: railH,
            railHeadWidth: headW,
            railBaseWidth: baseW,
            edgeIn: nd.ends[pair[0]][0],
            edgeOut: nd.ends[pair[1]][0],
            edgeDiv: nd.ends[div][0],
        });
        // 裁剪: 按边离站方向与主向的点积判定主入/主出边
        for (const pi of pair) {
            const [ei, end] = nd.ends[pi];
            const d = dirs[pi];
            const isOut = d[0] * mainDir[0] + d[1] * mainDir[1] > 0;
            const acc = polyArcLens(edges[ei].pts);
            const total = acc[acc.length - 1];
            let trim = ft.swLen + 2000; // 主入边: 岔前段
            if (isOut) trim = frogX + ft.frogTotal; // 主出边: 岔尾段
            if (end === 0) { // 边起点在节点
                if (trim > (trimS.get(ei) ?? 0)) trimS.set(ei, trim);
            } else { // 边终点在节点
                const v = total - trim;
                if (!trimE.has(ei) || v < trimE.get(ei)!) trimE.set(ei, v);
            }
        }
        // 侧股边: 沿曲线弧长 ≈ frogX + tail + 裕量
        {
            const [ei, end] = nd.ends[div];
            const divTrim = frogX + ft.frogTotal + 500;
            if (end === 0) {
                if (divTrim > (trimS.get(ei) ?? 0)) trimS.set(ei, divTrim);
            } else {
                const acc = polyArcLens(edges[ei].pts);
                const v = acc[acc.length - 1] - divTrim;
                if (!trimE.has(ei) || v < trimE.get(ei)!) trimE.set(ei, v);
            }
        }
    }

    // 3. 菱形交叉: 边中部相交
    const crossings: YardCrossingLayout[] = [];
    const segIntersect = (a1: Vec3, a2: Vec3, b1: Vec3, b2: Vec3): Vec3 | null => {
        const d1x = a2[0] - a1[0], d1y = a2[1] - a1[1];
        const d2x = b2[0] - b1[0], d2y = b2[1] - b1[1];
        const den = d1x * d2y - d1y * d2x;
        if (Math.abs(den) < 1e-9) return null;
        const t = ((b1[0] - a1[0]) * d2y - (b1[1] - a1[1]) * d2x) / den;
        const u = ((b1[0] - a1[0]) * d1y - (b1[1] - a1[1]) * d1x) / den;
        if (t > -0.001 && t < 1.001 && u > -0.001 && u < 1.001) {
            return [a1[0] + t * d1x, a1[1] + t * d1y, a1[2] + t * (a2[2] - a1[2])];
        }
        return null;
    };
    for (let i = 0; i < edges.length; i++) {
        for (let j = i + 1; j < edges.length; j++) {
            for (let a = 0; a + 1 < edges[i].pts.length; a++) {
                for (let b = 0; b + 1 < edges[j].pts.length; b++) {
                    const cp = segIntersect(edges[i].pts[a], edges[i].pts[a + 1], edges[j].pts[b], edges[j].pts[b + 1]);
                    if (cp === null) continue;
                    // 距节点 2m 内视为道岔区, 不算菱形交叉
                    let nearNode = false;
                    for (const nd of nodes) {
                        if (ptDist(nd.p, cp) < 2000) { nearNode = true; break; }
                    }
                    if (nearNode) continue;
                    // 顶点处相交会被多个线段对重复发现, 去重
                    let dup = false;
                    for (const cr of crossings) {
                        if (ptDist(cr.position, cp) < 500) { dup = true; break; }
                    }
                    if (dup) continue;
                    const d1 = dirAtEnd(edges[i].pts, true, 1000);
                    const d2 = dirAtEnd(edges[j].pts, true, 1000);
                    if (d1[0] * d2[0] + d1[1] * d2[1] < 0) { d2[0] = -d2[0]; d2[1] = -d2[1]; }
                    const bs: Vec3 = [d1[0] + d2[0], d1[1] + d2[1], 0];
                    const bl = Math.hypot(bs[0], bs[1]);
                    if (bl < 1e-9) continue;
                    const ang = Math.atan2(Math.abs(d1[0] * d2[1] - d1[1] * d2[0]), d1[0] * d2[0] + d1[1] * d2[1]);
                    crossings.push({
                        position: cp,
                        direction: [bs[0] / bl, bs[1] / bl, 0],
                        turnoutNo: snapTurnoutNo(ang),
                        gauge: 1435,
                        railHeight: 176,
                        railHeadWidth: 73,
                        railBaseWidth: 150,
                        edgeA: i,
                        edgeB: j,
                    });
                }
            }
        }
    }

    // 4. 股道: 原始中心线 + 识别出的裁剪弧长
    const tracks: YardTrackLayout[] = [];
    for (let ei = 0; ei < edges.length; ei++) {
        const e = edges[ei];
        const acc = polyArcLens(e.pts);
        const tr: YardTrackLayout = {
            centerline: e.pts.map((p) => [...p] as Vec3),
            trimS: 0,
            trimE: acc[acc.length - 1],
            props: e.props,
        };
        if (trimS.has(ei)) tr.trimS = trimS.get(ei)!;
        if (trimE.has(ei)) tr.trimE = trimE.get(ei)!;
        tracks.push(tr);
    }
    return { tracks, turnouts, crossings };
}

// ---- createYardFromLayout ----

// 按 railHeight 反查标准腹板厚度 (topo.js turnout_params 多一个 webThickness 字段,
// go-topo 无此概念; 取 standard_rail_params 同口径值)
function standardWebThickness(railHeight: number): number {
    switch (Math.round(railHeight)) {
        case 140: return 14.5; // 43kg
        case 152: return 15.5; // 50kg
        case 192: return 20;   // 75kg
        default: return 16.5;  // 60kg
    }
}

// createYardFromLayout 由布局确定性生成站场装配
// 与 Go 一致: 首个非空子件作为装配根; 子件命名 rails_i / sleepers_i / turnout_i / crossing_i, 均唯一
export function createYardFromLayout(layout: YardLayout, topo: TopoInstance): Assembly {
    if (!layout || !layout.tracks || layout.tracks.length === 0) {
        throw new Error("yard: layout has no tracks");
    }
    ensureAssemblyGlobals(topo);

    let root: Assembly | null = null;
    const addShape = (raw: any, name: string, metadata?: Record<string, any>): void => {
        if (raw === null || raw === undefined) return;
        const s = new (topo as any).Shape(raw, false);
        if (s.isNull()) return;
        if (root === null) {
            root = (topo as any).Assembly.create(s, undefined, name, undefined, metadata) as Assembly;
        } else {
            (root as any).add(s, undefined, name, undefined, metadata);
        }
    };

    // 股道: 按 trimS/trimE 裁剪中心线后生成钢轨对 + 轨枕
    for (let ti = 0; ti < layout.tracks.length; ti++) {
        const tr = layout.tracks[ti];
        const props = trackPropsWithDefaults(tr.props ?? {});
        const pts = (tr.centerline ?? []).map((p) => [...p] as Vec3);
        if (pts.length < 2) continue;
        const acc = polyArcLens(pts);
        const total = acc[acc.length - 1];
        let s0 = tr.trimS, s1 = tr.trimE;
        if (s0 < 0) s0 = 0;
        if (s1 <= 0 || s1 > total) s1 = total; // 布局可能被手工编辑过, 缺省为全长
        const seg = trimPolyline(pts, s0, s1);
        if (seg.length < 2) continue;
        const [railH, headW, baseW] = standardRailDims(props.railType);
        addShape(
            (topo as any).createRailPair({
                centerline: seg.map((p) => toGpPnt(topo, p)),
                gauge: props.gauge, superElevation: props.superElevation,
                railHeight: railH, railHeadWidth: headW, railBaseWidth: baseW,
            }),
            `rails_${ti}`,
            { parametricType: "yard_rails", parametricParams: JSON.stringify({
                centerline: seg, gauge: props.gauge, superElevation: props.superElevation,
                railHeight: railH, railHeadWidth: headW, railBaseWidth: baseW }) },
        );
        if (!props.noSleepers) {
            addShape(
                (topo as any).createSleeperLayout({
                    centerline: seg.map((p) => toGpPnt(topo, p)),
                    length: props.sleeperLength, width: props.sleeperWidth,
                    height: props.sleeperHeight, spacing: props.sleeperSpacing, gauge: props.gauge,
                }),
                `sleepers_${ti}`,
                { parametricType: "yard_sleepers", parametricParams: JSON.stringify({
                    centerline: seg, length: props.sleeperLength, width: props.sleeperWidth,
                    height: props.sleeperHeight, spacing: props.sleeperSpacing, gauge: props.gauge }) },
            );
        }
    }
    // 道岔
    for (let i = 0; i < (layout.turnouts ?? []).length; i++) {
        const tn = layout.turnouts![i];
        // 布局可能被手工编辑过, 缺省值兜底
        let turnoutNo = tn.turnoutNo === 0 ? 12 : tn.turnoutNo;
        let gauge = tn.gauge > 0 ? tn.gauge : 1435;
        let railH = tn.railHeight, headW = tn.railHeadWidth, baseW = tn.railBaseWidth;
        if (!(railH > 0)) {
            [railH, headW, baseW] = standardRailDims(60);
        }
        let swLen = tn.switchRailLength, leadR = tn.leadCurveRadius;
        if (!(swLen > 0) || !(leadR > 0)) {
            const ft = frogTableFor(turnoutNo);
            if (!(swLen > 0)) swLen = ft.swLen;
            if (!(leadR > 0)) leadR = ft.leadR;
        }
        const dir = tn.mainDir;
        if (Math.hypot(dir[0], dir[1]) < 1e-9) {
            throw new Error(`yard: turnout ${i} has zero mainDir`);
        }
        const dl = Math.hypot(dir[0], dir[1]);
        const tp = {
            turnoutNo, isLeftHand: !!tn.isLeftHand, gauge,
            railHeight: railH, railHeadWidth: headW, railBaseWidth: baseW,
            webThickness: standardWebThickness(railH),
            switchRailLength: swLen, leadCurveRadius: leadR,
            frogLength: 0, sleeperCount: 0, sleeperSpacing: 0,
        };
        addShape(
            (topo as any).createTurnoutWithPosition(
                tp, toGpPnt(topo, tn.position), toGpDir(topo, [dir[0] / dl, dir[1] / dl, 0]), toGpDir(topo, [0, 0, 1])),
            `turnout_${i}`,
            { parametricType: "yard_turnout", parametricParams: JSON.stringify({
                params: tp, position: tn.position, direction: dir, upDir: [0, 0, 1] }) },
        );
    }
    // 菱形交叉
    for (let i = 0; i < (layout.crossings ?? []).length; i++) {
        const cr = layout.crossings![i];
        const turnoutNo = cr.turnoutNo === 0 ? 12 : cr.turnoutNo;
        const gauge = cr.gauge > 0 ? cr.gauge : 1435;
        let railH = cr.railHeight, headW = cr.railHeadWidth, baseW = cr.railBaseWidth;
        if (!(railH > 0)) { railH = 176; headW = 73; baseW = 150; }
        const dir = cr.direction;
        if (Math.hypot(dir[0], dir[1]) < 1e-9) {
            throw new Error(`yard: crossing ${i} has zero direction`);
        }
        const dl = Math.hypot(dir[0], dir[1]);
        const fp = { turnoutNo, gauge, railHeight: railH, railHeadWidth: headW, railBaseWidth: baseW };
        addShape(
            (topo as any).createFrogWithPosition(
                fp, toGpPnt(topo, cr.position), toGpDir(topo, [dir[0] / dl, dir[1] / dl, 0]), toGpDir(topo, [0, 0, 1])),
            `crossing_${i}`,
            { parametricType: "yard_crossing", parametricParams: JSON.stringify({
                params: fp, position: cr.position, direction: cr.direction, upDir: [0, 0, 1] }) },
        );
    }

    if (root === null) {
        throw new Error("yard: no geometry generated");
    }
    return root;
}

// 便捷入口: GeoJSON → 装配 (= computeYardLayout + createYardFromLayout)
export function createYardFromGeoJSON(data: string | GeoJSONInput, topo: TopoInstance): Assembly {
    return createYardFromLayout(computeYardLayout(data), topo);
}

// 同 createYardFromGeoJSON, 同时返回识别出的布局
export function createYardFromGeoJSONWithLayout(
    data: string | GeoJSONInput, topo: TopoInstance,
): { assembly: Assembly; layout: YardLayout } {
    const layout = computeYardLayout(data);
    const assembly = createYardFromLayout(layout, topo);
    return { assembly, layout };
}
