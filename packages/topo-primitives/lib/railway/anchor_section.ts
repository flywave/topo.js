// =========================================================================
// 接触网锚段布局闭环 (移植自 go-topo ocs_layout.go / ocs_anchor.go /
// primitives_railway.go 的 CalcOcsSpanPositions)
//   computeAnchorSectionLayout    纯计算, 输出全部中间数据 (柱位/悬挂点/弛度/吊弦表)
//   createAnchorSectionFromLayout 由布局确定性生成装配, 子件命名 mast_i/cw_i/mw_i/dropper_{span}_{idx}
// JSON schema 与 topotypes railway/layout.go 完全一致 (camelCase), 与 Go 侧 layout JSON 互通。
// 单位: 长度 mm, 里程 m; 支柱局部约定: 原点=柱底中心, +X 指向线路 (Direction)
// =========================================================================

import { Assembly, TopoInstance } from "topo-wasm";
import {
    Vec3, polyArcLens, frameAt, ptDist,
    ensureAssemblyGlobals, toGpPnt, toGpDir,
} from "./layout_utils";

// AnchorSectionSpec 锚段输入参数 (AnchorSectionInput 的可序列化形式)
export interface AnchorSectionSpec {
    centerline: Vec3[];      // 线路中心线
    contactHeight: number;   // 导高, 默认 5300
    structureHeight: number; // 结构高度, 默认 1400
    spanLength: number;      // 标准跨距, 默认 50000
    mastHeight: number;      // 柱高, 默认 8000
    mastType: number;        // 1-钢柱, 2-混凝土柱
    sideOffset: number;      // 侧面限界 CX, 默认 2900
    mastSide: number;        // 支柱在线路左侧(+1)/右侧(-1), 默认 +1
    hasCompensator: boolean; // 两端锚柱设补偿装置
    contactWireDia: number;  // 接触线直径, 默认 12.9
    messengerDia: number;    // 承力索直径, 默认 13.5
    dropperSpacing: number;  // 吊弦间距, 默认 8000
}

// AnchorSectionInput 计算输入 = Spec + 可选拉出值表 (空则自动之字 ±300)
export interface AnchorSectionInput extends Partial<AnchorSectionSpec> {
    centerline: Vec3[];
    staggerTable?: number[]; // 各定位点拉出值
}

// AnchorMastLayout 单根支柱的布局数据
export interface AnchorMastLayout {
    mileage: number;        // 里程 (m)
    position: Vec3;         // 柱底中心 (世界坐标)
    direction: Vec3;        // 支柱朝向 (+X 指向线路, 水平单位向量)
    mastHeight: number;     // 柱高
    contactWireZ: number;   // 接触线相对轨面高
    messengerWireZ: number; // 承力索相对轨面高
    stagger: number;        // 拉出值 (线路左侧为正)
    isTensionMast: boolean; // 是否锚端柱 (带补偿装置)
    contactPoint: Vec3;     // 接触线悬挂点 (世界坐标, 由 position/direction/stagger 推导的缓存)
    messengerPoint: Vec3;   // 承力索悬挂点 (同上)
}

// AnchorDropperLayout 单根吊弦: t 为跨内参数 (0,1), top/bottom/length 为计算缓存
// 再生成时按 t + 所在跨两端悬挂点/弛度重算, 编辑柱位/拉出值后吊弦自动跟随
export interface AnchorDropperLayout {
    t: number;
    top: Vec3;    // 承力索侧挂点
    bottom: Vec3; // 接触线侧挂点
    length: number;
}

// AnchorSpanLayout 相邻两柱间一跨的布局数据
export interface AnchorSpanLayout {
    fromMast: number;     // 起始柱索引
    toMast: number;       // 终止柱索引
    length: number;       // 跨距 (接触线悬挂点间距)
    contactSag: number;   // 接触线弛度
    messengerSag: number; // 承力索弛度
    droppers: AnchorDropperLayout[]; // 空则再生成时按 spec.dropperSpacing 自动布置
}

// AnchorSectionLayout 生成一个锚段所需的全部中间数据
export interface AnchorSectionLayout {
    spec: AnchorSectionSpec;
    masts: AnchorMastLayout[];
    spans: AnchorSpanLayout[];
}

// ---- CalcOcsSpanPositions 移植 (primitives_railway.go) ----

export interface OcsSpanInput {
    centerline: Vec3[];
    contactHeight: number;   // 导高 默认 5300
    structureHeight: number; // 结构高度 默认 1400
    staggerTable: number[];  // 拉出值
    spanLength: number;      // 标准跨距 默认 50000
    mastHeight: number;      // 支柱高度
    hasCompensator: boolean; // 两端设补偿
}

export interface OcsMastPosition {
    mileage: number;          // 里程(m)
    position: Vec3;           // 柱底中心 (中心线上点)
    mastHeight: number;       // 柱高(mm)
    beamBottomZ: number;      // 横梁底部 Z
    contactWireZ: number;     // 接触线 Z
    messengerWireZ: number;   // 承力索 Z
    stagger: number;          // 拉出值(mm)
    hangerPostLength: number; // 吊柱长度
    bracketMountZ: number;    // 腕臂底座 Z
    insulatorMountZ: number;  // 绝缘子 Z
    registrationArmZ: number; // 定位器 Z
    isTensionMast: boolean;   // 是否锚柱
}

export interface OcsSpanOutput {
    masts: OcsMastPosition[];
    totalLength: number;
    mastCount: number;
    beamBottomZ: number;
    contactWireZ: number;
    messengerWireZ: number;
}

// 沿中心线按跨距布柱; 行为与 Go CalcOcsSpanPositions 逐行一致
export function calcOcsSpanPositions(input: OcsSpanInput): OcsSpanOutput {
    const out: OcsSpanOutput = {
        masts: [], totalLength: 0, mastCount: 0,
        beamBottomZ: 0, contactWireZ: 0, messengerWireZ: 0,
    };
    if (input.centerline.length < 2 || input.spanLength <= 0) return out;

    const CH = input.contactHeight > 0 ? input.contactHeight : 5300;
    const SH = input.structureHeight > 0 ? input.structureHeight : 1400;
    const MH = input.mastHeight > 0 ? input.mastHeight : 8000;
    const spanLen = input.spanLength > 0 ? input.spanLength : 50000;

    const beamBottomZ = CH + SH;
    const systemMargin = 800.0;

    out.contactWireZ = CH;
    out.messengerWireZ = CH + SH;
    out.beamBottomZ = beamBottomZ;

    if (MH < beamBottomZ + systemMargin) return out;

    const cl = input.centerline;
    const acc = polyArcLens(cl);
    const totalLen = acc[acc.length - 1];
    out.totalLength = totalLen;
    out.mastCount = Math.trunc(totalLen / spanLen) + 1;
    if (out.mastCount < 2) out.mastCount = 2;

    const mastSpacing = totalLen / (out.mastCount - 1);

    for (let m = 0; m < out.mastCount; m++) {
        const dist = m * mastSpacing;
        let run = 0.0;
        let pos = cl[0];
        for (let j = 0; j < cl.length - 1; j++) {
            const dx = cl[j + 1][0] - cl[j][0];
            const dy = cl[j + 1][1] - cl[j][1];
            const dz = cl[j + 1][2] - cl[j][2];
            const segLen = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (run + segLen >= dist || j === cl.length - 2) {
                let t = segLen > 0 ? (dist - run) / segLen : 0;
                if (t < 0) t = 0;
                if (t > 1) t = 1;
                pos = [cl[j][0] + dx * t, cl[j][1] + dy * t, cl[j][2] + dz * t];
                break;
            }
            run += segLen;
        }
        const stagger = m < input.staggerTable.length ? input.staggerTable[m] : 0;

        out.masts.push({
            mileage: dist / 1000,
            position: pos,
            mastHeight: MH,
            beamBottomZ,
            contactWireZ: CH,
            messengerWireZ: CH + SH,
            stagger,
            hangerPostLength: MH - beamBottomZ - systemMargin * 0.5,
            bracketMountZ: beamBottomZ - 100,
            insulatorMountZ: beamBottomZ - 600,
            registrationArmZ: CH,
            isTensionMast: input.hasCompensator && (m === 0 || m === out.mastCount - 1),
        });
    }
    return out;
}

// ---- 内部辅助 ----

function dist3(a: Vec3, b: Vec3): number { return ptDist(a, b); }

// 两点连线上 t 处 + 抛物线弛度
function evalSagPoint3(p0: Vec3, p1: Vec3, t: number, sag: number): Vec3 {
    return [
        p0[0] + (p1[0] - p0[0]) * t,
        p0[1] + (p1[1] - p0[1]) * t,
        p0[2] + (p1[2] - p0[2]) * t - 4 * sag * t * (1 - t),
    ];
}

// 由柱位推导接触线/承力索悬挂点: 线路中心 = 柱位 + direction*CX, 悬挂点再向线路侧偏移 stagger
function mastWirePoints(m: AnchorMastLayout, sideOffset: number): { contact: Vec3; messenger: Vec3 } {
    const d = m.direction;
    const off = sideOffset - m.stagger;
    return {
        contact: [m.position[0] + d[0] * off, m.position[1] + d[1] * off, m.position[2] + m.contactWireZ],
        messenger: [m.position[0] + d[0] * off, m.position[1] + d[1] * off, m.position[2] + m.messengerWireZ],
    };
}

// 输入缺省值归一 (与 Go normalizeAnchorInput 一致)
function normalizeSpec<T extends Partial<AnchorSectionSpec>>(spec: T): T {
    if (!(spec.contactHeight! > 0)) spec.contactHeight = 5300;
    if (!(spec.structureHeight! > 0)) spec.structureHeight = 1400;
    if (!(spec.spanLength! > 0)) spec.spanLength = 50000;
    if (!(spec.mastHeight! > 0)) spec.mastHeight = 8000;
    if (!(spec.sideOffset! > 0)) spec.sideOffset = 2900;
    if (!spec.mastSide) spec.mastSide = 1;
    if (!(spec.contactWireDia! > 0)) spec.contactWireDia = 12.9;
    if (!(spec.messengerDia! > 0)) spec.messengerDia = 13.5;
    if (!(spec.dropperSpacing! > 0)) spec.dropperSpacing = 8000;
    if (spec.mastType === undefined) spec.mastType = 0;
    if (spec.hasCompensator === undefined) spec.hasCompensator = false;
    return spec;
}

// computeAnchorSectionLayout 由输入纯计算锚段布局, 无副作用
// 柱位来自 calcOcsSpanPositions; 弛度 = 标准跨距 × {0.0005 接触线, 0.015 承力索};
// 吊弦按 dropperSpacing 等分布置, 长度 = 两索抛物线弧垂差 (长度 <100 的跳过)
export function computeAnchorSectionLayout(input: AnchorSectionInput): AnchorSectionLayout {
    if (!input.centerline || input.centerline.length < 2) {
        throw new Error("ocs anchor: centerline needs >= 2 points");
    }
    const inn = normalizeSpec({ ...input, centerline: input.centerline.map((p) => [...p] as Vec3) });

    // 拉出值缺省时自动之字 ±300
    let staggerTable = inn.staggerTable ? [...inn.staggerTable] : [];
    if (staggerTable.length === 0) {
        const totalLen = polyArcLens(inn.centerline);
        const n = Math.trunc(totalLen[totalLen.length - 1] / inn.spanLength!) + 2;
        staggerTable = new Array<number>(n);
        for (let i = 0; i < n; i++) staggerTable[i] = i % 2 === 0 ? 300 : -300;
    }
    const span = calcOcsSpanPositions({
        centerline: inn.centerline,
        contactHeight: inn.contactHeight!,
        structureHeight: inn.structureHeight!,
        staggerTable,
        spanLength: inn.spanLength!,
        mastHeight: inn.mastHeight!,
        hasCompensator: inn.hasCompensator!,
    });
    if (span.mastCount === 0) {
        throw new Error("ocs anchor: no mast positions computed");
    }

    const spec: AnchorSectionSpec = {
        centerline: inn.centerline,
        contactHeight: inn.contactHeight!,
        structureHeight: inn.structureHeight!,
        spanLength: inn.spanLength!,
        mastHeight: inn.mastHeight!,
        mastType: inn.mastType!,
        sideOffset: inn.sideOffset!,
        mastSide: inn.mastSide!,
        hasCompensator: inn.hasCompensator!,
        contactWireDia: inn.contactWireDia!,
        messengerDia: inn.messengerDia!,
        dropperSpacing: inn.dropperSpacing!,
    };

    const masts: AnchorMastLayout[] = [];
    const side = spec.mastSide;
    for (const m of span.masts) {
        const f = frameAt(spec.centerline, m.mileage * 1000); // 里程 m → mm
        const perp: Vec3 = [f.perp[0] * side, f.perp[1] * side, 0];
        const cp = f.pos;
        const ml: AnchorMastLayout = {
            mileage: m.mileage,
            position: [cp[0] + perp[0] * spec.sideOffset, cp[1] + perp[1] * spec.sideOffset, cp[2]],
            direction: [-perp[0], -perp[1], 0], // +X 指向线路
            mastHeight: m.mastHeight,
            contactWireZ: m.contactWireZ,
            messengerWireZ: m.messengerWireZ,
            stagger: m.stagger,
            isTensionMast: m.isTensionMast,
            contactPoint: [0, 0, 0],
            messengerPoint: [0, 0, 0],
        };
        const wp = mastWirePoints(ml, spec.sideOffset);
        ml.contactPoint = wp.contact;
        ml.messengerPoint = wp.messenger;
        masts.push(ml);
    }

    // 跨: 弛度 + 吊弦表
    const sagC = spec.spanLength * 0.0005; // 接触线预留弛度
    const sagM = spec.spanLength * 0.015;  // 承力索弛度
    const spans: AnchorSpanLayout[] = [];
    for (let i = 0; i + 1 < masts.length; i++) {
        const cw0 = masts[i].contactPoint, cw1 = masts[i + 1].contactPoint;
        const mw0 = masts[i].messengerPoint, mw1 = masts[i + 1].messengerPoint;
        const sp: AnchorSpanLayout = {
            fromMast: i,
            toMast: i + 1,
            length: dist3(cw0, cw1),
            contactSag: sagC,
            messengerSag: sagM,
            droppers: [],
        };
        let n = Math.trunc(sp.length / spec.dropperSpacing);
        if (n < 1) n = 1;
        for (let k = 1; k <= n; k++) {
            const t = k / (n + 1);
            const top = evalSagPoint3(mw0, mw1, t, sagM);
            const bot = evalSagPoint3(cw0, cw1, t, sagC);
            const l = top[2] - bot[2];
            if (l < 100) continue;
            sp.droppers.push({ t, top, bottom: bot, length: l });
        }
        spans.push(sp);
    }
    return { spec, masts, spans };
}

// 序列化/反序列化 (供存库/前端编辑)
export function anchorSectionLayoutToJSON(layout: AnchorSectionLayout): string {
    return JSON.stringify(layout);
}

export function anchorSectionLayoutFromJSON(data: string): AnchorSectionLayout {
    try {
        return JSON.parse(data) as AnchorSectionLayout;
    } catch (e) {
        throw new Error(`ocs anchor: invalid layout JSON: ${e}`);
    }
}

// createAnchorSectionFromLayout 由布局确定性生成锚段装配
// 根节点为 "anchor_section" 容器; 子件命名 mast_i / cw_i / mw_i / dropper_{span}_{idx}, 均唯一
// 支柱经 createMastAssemblyWithPosition 直接放置 (与 Go 局部生成+Location 等价,
// 见 go-topo TestAnchorMastPlacementMatchesWithPlace); 线索/吊弦世界坐标烘焙
export function createAnchorSectionFromLayout(layout: AnchorSectionLayout, topo: TopoInstance): Assembly {
    if (!layout || !layout.masts || layout.masts.length === 0) {
        throw new Error("ocs anchor: layout has no masts");
    }
    ensureAssemblyGlobals(topo);
    // 布局可能被手工编辑过, 缺省值再兜底一次
    const spec = normalizeSpec({ ...layout.spec });

    const root = (topo as any).Assembly.create(undefined, undefined, "anchor_section") as Assembly;
    const addShape = (raw: any, name: string, metadata?: Record<string, any>): void => {
        if (raw === null || raw === undefined) return;
        const s = new (topo as any).Shape(raw, false);
        if (s.isNull()) return;
        (root as any).add(s, undefined, name, undefined, metadata);
    };

    // 支柱: 局部约定 原点=柱底中心, +X 指向线路
    for (let i = 0; i < layout.masts.length; i++) {
        const m = layout.masts[i];
        const mp = {
            mastType: spec.mastType,
            mastHeight: m.mastHeight,
            cantileverType: 1,
            hasCrossArm: false,
            armDiameter: 60,
            stagger: m.stagger * spec.mastSide, // 局部 X 朝线路, 拉出值换算
            compType: 0,
            ratedTension: 0,
            hasGuyWire: false,
            contactHeight: spec.contactHeight,
            structureHeight: spec.structureHeight,
            sideOffset: spec.sideOffset,
        };
        if (spec.hasCompensator && m.isTensionMast) {
            mp.compType = 1;
            mp.hasGuyWire = true;
            mp.ratedTension = 15;
        }
        // direction 归一化 (布局可能被手工编辑过)
        let dx = m.direction[0], dy = m.direction[1];
        const dl = Math.hypot(dx, dy);
        if (dl > 1e-9) { dx /= dl; dy /= dl; } else { dx = 1; dy = 0; }
        addShape(
            (topo as any).createMastAssemblyWithPosition(
                mp, toGpPnt(topo, m.position), toGpDir(topo, [dx, dy, 0]), toGpDir(topo, [0, 0, 1])),
            `mast_${i}`,
            { parametricType: "ocs_mast", parametricParams: JSON.stringify({ params: mp }) },
        );
    }

    // 跨间线索 + 吊弦 (两点端点 + 弛度即编辑数据)
    for (let i = 0; i < layout.spans.length; i++) {
        const sp = layout.spans[i];
        if (sp.fromMast < 0 || sp.toMast >= layout.masts.length || sp.fromMast >= sp.toMast) {
            throw new Error(`ocs anchor: span ${i} references invalid masts [${sp.fromMast},${sp.toMast}]`);
        }
        const fm = layout.masts[sp.fromMast], tm = layout.masts[sp.toMast];
        const cw0 = mastWirePoints(fm, spec.sideOffset).contact;
        const cw1 = mastWirePoints(tm, spec.sideOffset).contact;
        const mw0 = mastWirePoints(fm, spec.sideOffset).messenger;
        const mw1 = mastWirePoints(tm, spec.sideOffset).messenger;

        const cwp = {
            sectionalArea: 0, diameter: spec.contactWireDia, ratedTension: 0,
            grooveDepth: 0, grooveWidth: 0, bottomRadius: 8, topRadius: 3, sag: sp.contactSag,
        };
        addShape(
            (topo as any).createContactWire(cwp, toGpPnt(topo, cw0), toGpPnt(topo, cw1)),
            `cw_${i}`,
            { parametricType: "ocs_contact_wire", parametricParams: JSON.stringify({
                diameter: cwp.diameter, bottomRadius: 8, topRadius: 3, sag: sp.contactSag, start: cw0, end: cw1 }) },
        );
        const mwp = { diameter: spec.messengerDia, ratedTension: 0, structuralHeight: 0, sag: sp.messengerSag };
        addShape(
            (topo as any).createMessengerWire(mwp, toGpPnt(topo, mw0), toGpPnt(topo, mw1)),
            `mw_${i}`,
            { parametricType: "ocs_messenger_wire", parametricParams: JSON.stringify({
                diameter: mwp.diameter, sag: sp.messengerSag, start: mw0, end: mw1 }) },
        );

        // 吊弦: 布局未给表时按间距自动布置; 位置/长度按两端悬挂点 + 弛度重算
        let droppers = sp.droppers;
        if (!droppers || droppers.length === 0) {
            let n = Math.trunc(dist3(cw0, cw1) / spec.dropperSpacing);
            if (n < 1) n = 1;
            droppers = [];
            for (let k = 1; k <= n; k++) droppers.push({ t: k / (n + 1) } as AnchorDropperLayout);
        }
        for (let k = 0; k < droppers.length; k++) {
            const d = droppers[k];
            const top = evalSagPoint3(mw0, mw1, d.t, sp.messengerSag);
            const bot = evalSagPoint3(cw0, cw1, d.t, sp.contactSag);
            const l = top[2] - bot[2];
            if (l < 100) continue;
            const dp = { length: l, wireDiameter: 4.5, clampLength: 60, clampWidth: 40, clampThickness: 6, conductive: true };
            addShape(
                (topo as any).createDropperWithPosition(dp, toGpPnt(topo, top), toGpDir(topo, [0, 0, 1])),
                `dropper_${i}_${k}`,
                { parametricType: "ocs_dropper", parametricParams: JSON.stringify({ params: dp, top, direction: [0, 0, 1] }) },
            );
        }
    }
    return root;
}

// 便捷入口: 输入 → 布局 + 装配 (对应 Go CreateAnchorSectionWithLayout)
export function createAnchorSectionWithLayout(
    input: AnchorSectionInput, topo: TopoInstance,
): { assembly: Assembly; layout: AnchorSectionLayout } {
    const layout = computeAnchorSectionLayout(input);
    const assembly = createAnchorSectionFromLayout(layout, topo);
    return { assembly, layout };
}
