// Ported from go-topo/primitives_foundation_test.go (45 test cases)
// Each test calls tp.create_* directly (no TS wrapper classes)
// Assertions: shape not null, not isNull, bbox finite — same parity as Go
import { beforeAll, describe, expect, it } from "vitest";
import { getTopo, checkShape } from "./helpers/topo";

let tp: any;

/** Wrap raw TopoDS_Shape → Shape for checkShape compatibility */
function wrap(raw: any): any {
    return new tp.Shape(raw, false);
}

/** gp_Pnt(x,y,z) helper — Embind registered as gp_Pnt_3 */
function pnt(x: number, y: number, z: number): any {
    return new tp.gp_Pnt_3(x, y, z);
}

/** gp_Dir(x,y,z) helper — Embind registered as gp_Dir_4 */
function dir(x: number, y: number, z: number): any {
    return new tp.gp_Dir_4(x, y, z);
}

describe("primitives foundation", () => {
    beforeAll(async () => {
        tp = await getTopo();
    });

    // --- BoredPileBase ---
    it("CreateBoredPileBase", () => {
        const shp = tp.createBoredPileBase({
            H1: 100.0, H2: 30.0, H3: 50.0, H4: 3.0,
            D: 20.0, d: 5.0,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, `BoredPileBase: ${r.reason ?? ""}`).toBe(true);
    });

    it("CreateBoredPileBaseWithPlace", () => {
        const shp = tp.createBoredPileBaseWithPosition({
            H1: 100.0, H2: 30.0, H3: 50.0, H4: 3.0,
            D: 20.0, d: 5.0,
        }, pnt(0, 0, 0), dir(0, 0, 1));
        const r = checkShape(wrap(shp));
        expect(r.ok, `BoredPileBaseWithPosition: ${r.reason ?? ""}`).toBe(true);
    });

    // --- PileCapBase ---
    it("CreatePileCapBase", () => {
        const shp = tp.createPileCapBase({
            H1: 100.0, H2: 30.0, H3: 50.0, H4: 40.0,
            H5: 20.0, H6: 3.0,
            D: 20.0, d: 5.0, b: 15.0,
            B1: 200.0, L1: 300.0,
            e1: 10.0, e2: 5.0, cs: 0,
            ZCOUNT: 3,
            ZPOSTARRAY: [
                pnt(0, 0, 0),
                pnt(100, 0, 0),
                pnt(0, 100, 0),
            ],
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, `PileCapBase: ${r.reason ?? ""}`).toBe(true);
    });

    it("CreatePileCapBaseWithPlace", () => {
        const shp = tp.createPileCapBaseWithPosition({
            H1: 100.0, H2: 30.0, H3: 50.0, H4: 40.0,
            H5: 20.0, H6: 3.0,
            D: 20.0, d: 5.0, b: 15.0,
            B1: 200.0, L1: 300.0,
            e1: 10.0, e2: 5.0, cs: 0,
            ZCOUNT: 3,
            ZPOSTARRAY: [
                pnt(0, 0, 0),
                pnt(100, 0, 0),
                pnt(0, 100, 0),
            ],
        }, pnt(0, 0, 0), dir(0, 0, 1));
        const r = checkShape(wrap(shp));
        expect(r.ok, `PileCapBaseWithPosition: ${r.reason ?? ""}`).toBe(true);
    });

    // --- RockAnchorBase ---
    it("CreateRockAnchorBase", () => {
        const shp = tp.createRockAnchorBase({
            H1: 20.0, H2: 50.0, d: 5.0,
            B1: 100.0, L1: 150.0,
            ZCOUNT: 4,
            ZPOSTARRAY: [
                pnt(-40, -60, 0),
                pnt(40, -60, 0),
                pnt(40, 60, 0),
                pnt(-40, 60, 0),
            ],
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, `RockAnchorBase: ${r.reason ?? ""}`).toBe(true);
    });

    it("CreateRockAnchorBaseWithPlace", () => {
        const shp = tp.createRockAnchorBaseWithPosition({
            H1: 20.0, H2: 50.0, d: 5.0,
            B1: 100.0, L1: 150.0,
            ZCOUNT: 4,
            ZPOSTARRAY: [
                pnt(-40, -60, 0),
                pnt(40, -60, 0),
                pnt(40, 60, 0),
                pnt(-40, 60, 0),
            ],
        }, pnt(0, 0, 0), dir(0, 0, 1));
        const r = checkShape(wrap(shp));
        expect(r.ok, `RockAnchorBaseWithPosition: ${r.reason ?? ""}`).toBe(true);
    });

    // --- RockPileCapBase ---
    it("CreateRockPileCapBase", () => {
        const shp = tp.createRockPileCapBase({
            H1: 40.0, H2: 20.0, H3: 50.0,
            d: 5.0, b: 15.0,
            B1: 200.0, L1: 300.0,
            e1: 10.0, e2: 5.0, cs: 0,
            ZCOUNT: 4,
            ZPOSTARRAY: [
                pnt(-50, -50, 0),
                pnt(50, -50, 0),
                pnt(50, 50, 0),
                pnt(-50, 50, 0),
            ],
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, `RockPileCapBase: ${r.reason ?? ""}`).toBe(true);
    });

    it("CreateRockPileCapBaseWithPlace", () => {
        const shp = tp.createRockPileCapBaseWithPosition({
            H1: 40.0, H2: 20.0, H3: 50.0,
            d: 5.0, b: 15.0,
            B1: 200.0, L1: 300.0,
            e1: 10.0, e2: 5.0, cs: 0,
            ZCOUNT: 4,
            ZPOSTARRAY: [
                pnt(-50, -50, 0),
                pnt(50, -50, 0),
                pnt(50, 50, 0),
                pnt(-50, 50, 0),
            ],
        }, pnt(0, 0, 0), dir(0, 0, 1));
        const r = checkShape(wrap(shp));
        expect(r.ok, `RockPileCapBaseWithPosition: ${r.reason ?? ""}`).toBe(true);
    });

    // --- EmbeddedRockAnchorBase ---
    it("CreateEmbeddedRockAnchorBase", () => {
        const shp = tp.createEmbeddedRockAnchorBase({
            H1: 100.0, H2: 30.0, H3: 50.0,
            d: 5.0, D: 20.0,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, `EmbeddedRockAnchorBase: ${r.reason ?? ""}`).toBe(true);
    });

    it("CreateEmbeddedRockAnchorBaseWithPlace", () => {
        const shp = tp.createEmbeddedRockAnchorBaseWithPosition({
            H1: 100.0, H2: 30.0, H3: 50.0,
            d: 5.0, D: 20.0,
        }, pnt(0, 0, 0), dir(0, 0, 1));
        const r = checkShape(wrap(shp));
        expect(r.ok, `EmbeddedRockAnchorBaseWithPosition: ${r.reason ?? ""}`).toBe(true);
    });

    // --- InclinedRockAnchorBase ---
    it("CreateInclinedRockAnchorBase", () => {
        const shp = tp.createInclinedRockAnchorBase({
            H1: 20.0, H2: 50.0,
            d: 5.0, D: 15.0,
            B: 100.0, L: 150.0,
            e1: 10.0, e2: 5.0,
            alpha1: 15.0, alpha2: 10.0,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, `InclinedRockAnchorBase: ${r.reason ?? ""}`).toBe(true);
    });

    it("CreateInclinedRockAnchorBaseWithPlace", () => {
        const shp = tp.createInclinedRockAnchorBaseWithPosition({
            H1: 20.0, H2: 50.0,
            d: 5.0, D: 15.0,
            B: 100.0, L: 150.0,
            e1: 10.0, e2: 5.0,
            alpha1: 15.0, alpha2: 10.0,
        }, pnt(0, 0, 0), dir(0, 0, 1));
        const r = checkShape(wrap(shp));
        expect(r.ok, `InclinedRockAnchorBaseWithPosition: ${r.reason ?? ""}`).toBe(true);
    });

    // --- ExcavatedBase ---
    it("CreateExcavatedBaseStraight", () => {
        const shp = tp.createExcavatedBase({
            H1: 100.0, H2: 30.0, H3: 50.0,
            d: 5.0, D: 20.0,
            alpha1: 0.0, alpha2: 0.0,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, `ExcavatedBaseStraight: ${r.reason ?? ""}`).toBe(true);
    });

    it("CreateExcavatedBaseSloped", () => {
        const shp = tp.createExcavatedBase({
            H1: 150.0, H2: 40.0, H3: 60.0,
            d: 8.0, D: 25.0,
            alpha1: 15.0, alpha2: 10.0,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, `ExcavatedBaseSloped: ${r.reason ?? ""}`).toBe(true);
    });

    it("CreateExcavatedBaseWithPlace", () => {
        const shp = tp.createExcavatedBaseWithPosition({
            H1: 100.0, H2: 30.0, H3: 50.0,
            d: 5.0, D: 20.0,
            alpha1: 0.0, alpha2: 0.0,
        }, pnt(0, 0, 0), dir(0, 0, 1));
        const r = checkShape(wrap(shp));
        expect(r.ok, `ExcavatedBaseWithPosition: ${r.reason ?? ""}`).toBe(true);
    });

    // --- StepBase ---
    it("CreateStepBase3Step", () => {
        const shp = tp.createStepBase({
            H: 150.0, H1: 50.0, H2: 50.0, H3: 50.0,
            b: 30.0,
            B1: 100.0, B2: 150.0, B3: 200.0,
            L1: 100.0, L2: 150.0, L3: 200.0,
            N: 3,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, `StepBase3Step: ${r.reason ?? ""}`).toBe(true);
    });

    it("CreateStepBase2Step", () => {
        const shp = tp.createStepBase({
            H: 100.0, H1: 40.0, H2: 60.0, H3: 0.0,
            b: 20.0,
            B1: 80.0, B2: 120.0, B3: 0.0,
            L1: 80.0, L2: 120.0, L3: 0.0,
            N: 2,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, `StepBase2Step: ${r.reason ?? ""}`).toBe(true);
    });

    it("CreateStepBaseWithPlace", () => {
        const shp = tp.createStepBaseWithPosition({
            H: 150.0, H1: 50.0, H2: 50.0, H3: 50.0,
            b: 30.0,
            B1: 100.0, B2: 150.0, B3: 200.0,
            L1: 100.0, L2: 150.0, L3: 200.0,
            N: 3,
        }, pnt(0, 0, 0), dir(0, 0, 1));
        const r = checkShape(wrap(shp));
        expect(r.ok, `StepBaseWithPosition: ${r.reason ?? ""}`).toBe(true);
    });

    // --- StepPlateBase ---
    it("CreateStepPlateBase3Step", () => {
        const shp = tp.createStepPlateBase({
            H: 150.0, H1: 50.0, H2: 50.0, H3: 50.0,
            b: 30.0,
            L1: 100.0, L2: 150.0,
            B1: 200.0, B2: 300.0,
            alpha1: 15.0, alpha2: 10.0,
            N: 3,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, `StepPlateBase3Step: ${r.reason ?? ""}`).toBe(true);
    });

    it("CreateStepPlateBase2Step", () => {
        const shp = tp.createStepPlateBase({
            H: 100.0, H1: 40.0, H2: 60.0, H3: 0.0,
            b: 20.0,
            L1: 80.0, L2: 120.0,
            B1: 180.0, B2: 200.0,
            alpha1: 0.0, alpha2: 0.0,
            N: 2,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, `StepPlateBase2Step: ${r.reason ?? ""}`).toBe(true);
    });

    it("CreateStepPlateBaseWithPlace", () => {
        const shp = tp.createStepPlateBaseWithPosition({
            H: 150.0, H1: 50.0, H2: 50.0, H3: 50.0,
            b: 30.0,
            L1: 100.0, L2: 150.0,
            B1: 200.0, B2: 300.0,
            alpha1: 15.0, alpha2: 10.0,
            N: 3,
        }, pnt(0, 0, 0), dir(0, 0, 1));
        const r = checkShape(wrap(shp));
        expect(r.ok, `StepPlateBaseWithPosition: ${r.reason ?? ""}`).toBe(true);
    });

    // --- SlopedBaseBase ---
    it("CreateSlopedBaseBase", () => {
        const shp = tp.createSlopedBaseBase({
            H1: 100.0, H2: 30.0, H3: 50.0,
            b: 15.0,
            L1: 200.0, L2: 150.0,
            B1: 100.0, B2: 80.0,
            alpha1: 15.0, alpha2: 10.0,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, `SlopedBaseBase: ${r.reason ?? ""}`).toBe(true);
    });

    it("CreateSlopedBaseBaseWithPlace", () => {
        const shp = tp.createSlopedBaseBaseWithPosition({
            H1: 100.0, H2: 30.0, H3: 50.0,
            b: 15.0,
            L1: 200.0, L2: 150.0,
            B1: 100.0, B2: 80.0,
            alpha1: 15.0, alpha2: 10.0,
        }, pnt(0, 0, 0), dir(0, 0, 1));
        const r = checkShape(wrap(shp));
        expect(r.ok, `SlopedBaseBaseWithPosition: ${r.reason ?? ""}`).toBe(true);
    });

    // --- CompositeCaissonBase ---
    it("CreateCompositeCaissonBase", () => {
        const shp = tp.createCompositeCaissonBase({
            H1: 100.0, H2: 30.0, H3: 50.0, H4: 200.0,
            b: 15.0, D: 200.0, t: 15.0,
            B1: 200.0, B2: 250.0,
            L1: 300.0, L2: 350.0,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, `CompositeCaissonBase: ${r.reason ?? ""}`).toBe(true);
    });

    it("CreateCompositeCaissonBaseExtreme", () => {
        const shp = tp.createCompositeCaissonBase({
            H1: 150.0, H2: 40.0, H3: 60.0, H4: 30.0,
            b: 20.0, D: 15.0, t: 1.5,
            B1: 250.0, B2: 300.0,
            L1: 350.0, L2: 400.0,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, `CompositeCaissonBaseExtreme: ${r.reason ?? ""}`).toBe(true);
    });

    it("CreateCompositeCaissonBaseWithPlace", () => {
        const shp = tp.createCompositeCaissonBaseWithPosition({
            H1: 100.0, H2: 30.0, H3: 50.0, H4: 200.0,
            b: 15.0, D: 200.0, t: 15.0,
            B1: 200.0, B2: 250.0,
            L1: 300.0, L2: 350.0,
        }, pnt(0, 0, 0), dir(0, 0, 1));
        const r = checkShape(wrap(shp));
        expect(r.ok, `CompositeCaissonBaseWithPosition: ${r.reason ?? ""}`).toBe(true);
    });

    // --- RaftBase ---
    it("CreateRaftBase", () => {
        const shp = tp.createRaftBase({
            H1: 100.0, H2: 100.0, H3: 50.0,
            b1: 30.0, b2: 30.0,
            B1: 500.0, B2: 400.0,
            L1: 800.0, L2: 600.0,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, `RaftBase: ${r.reason ?? ""}`).toBe(true);
    });

    it("CreateRaftBaseWithPlace", () => {
        const shp = tp.createRaftBaseWithPosition({
            H1: 100.0, H2: 100.0, H3: 50.0,
            b1: 30.0, b2: 30.0,
            B1: 500.0, B2: 400.0,
            L1: 800.0, L2: 600.0,
        }, pnt(0, 0, 0), dir(0, 0, 1));
        const r = checkShape(wrap(shp));
        expect(r.ok, `RaftBaseWithPosition: ${r.reason ?? ""}`).toBe(true);
    });

    // --- DirectBuriedBase ---
    it("CreateDirectBuriedBaseCircular", () => {
        const shp = tp.createDirectBuriedBase({
            H1: 500.0, H2: 100.0,
            d: 300.0, D: 600.0, B: 0.0, t: 20.0,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, `DirectBuriedBaseCircular: ${r.reason ?? ""}`).toBe(true);
    });

    it("CreateDirectBuriedBaseSquare", () => {
        const shp = tp.createDirectBuriedBase({
            H1: 500.0, H2: 100.0,
            d: 300.0, D: 0.0, B: 600.0, t: 20.0,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, `DirectBuriedBaseSquare: ${r.reason ?? ""}`).toBe(true);
    });

    it("CreateDirectBuriedBaseNoPlate", () => {
        const shp = tp.createDirectBuriedBase({
            H1: 500.0, H2: 0.0,
            d: 300.0, D: 0.0, B: 0.0, t: 20.0,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, `DirectBuriedBaseNoPlate: ${r.reason ?? ""}`).toBe(true);
    });

    it("CreateDirectBuriedBaseWithPlace", () => {
        const shp = tp.createDirectBuriedBaseWithPosition({
            H1: 500.0, H2: 100.0,
            d: 300.0, D: 600.0, B: 0.0, t: 20.0,
        }, pnt(0, 0, 0), dir(0, 0, 1));
        const r = checkShape(wrap(shp));
        expect(r.ok, `DirectBuriedBaseWithPosition: ${r.reason ?? ""}`).toBe(true);
    });

    // --- SteelSleeveBase ---
    it("CreateSteelSleeveBaseCircular", () => {
        const shp = tp.createSteelSleeveBase({
            H1: 500.0, H2: 100.0, H3: 150.0, H4: 50.0,
            d: 300.0, D1: 600.0, D2: 400.0, t: 20.0,
            B1: 0.0, B2: 0.0,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, `SteelSleeveBaseCircular: ${r.reason ?? ""}`).toBe(true);
    });

    it("CreateSteelSleeveBaseSquare", () => {
        const shp = tp.createSteelSleeveBase({
            H1: 500.0, H2: 100.0, H3: 150.0, H4: 50.0,
            d: 300.0, D1: 0.0, D2: 0.0, t: 20.0,
            B1: 600.0, B2: 400.0,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, `SteelSleeveBaseSquare: ${r.reason ?? ""}`).toBe(true);
    });

    it("CreateSteelSleeveBaseSimple", () => {
        const shp = tp.createSteelSleeveBase({
            H1: 500.0, H2: 0.0, H3: 0.0, H4: 50.0,
            d: 300.0, D1: 0.0, D2: 0.0, t: 20.0,
            B1: 0.0, B2: 0.0,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, `SteelSleeveBaseSimple: ${r.reason ?? ""}`).toBe(true);
    });

    it("CreateSteelSleeveBaseWithPlace", () => {
        const shp = tp.createSteelSleeveBaseWithPosition({
            H1: 500.0, H2: 100.0, H3: 150.0, H4: 50.0,
            d: 300.0, D1: 600.0, D2: 400.0, t: 20.0,
            B1: 0.0, B2: 0.0,
        }, pnt(0, 0, 0), dir(0, 0, 1));
        const r = checkShape(wrap(shp));
        expect(r.ok, `SteelSleeveBaseWithPosition: ${r.reason ?? ""}`).toBe(true);
    });

    // --- PrecastColumnBase ---
    it("CreatePrecastColumnBase", () => {
        const shp = tp.createPrecastColumnBase({
            H1: 500.0, H2: 200.0, H3: 300.0,
            d: 100.0,
            B1: 200.0, B2: 400.0,
            L1: 300.0, L2: 600.0,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, `PrecastColumnBase: ${r.reason ?? ""}`).toBe(true);
    });

    it("CreatePrecastColumnBaseWithPlace", () => {
        const shp = tp.createPrecastColumnBaseWithPosition({
            H1: 500.0, H2: 200.0, H3: 300.0,
            d: 100.0,
            B1: 200.0, B2: 400.0,
            L1: 300.0, L2: 600.0,
        }, pnt(0, 0, 0), dir(0, 0, 1));
        const r = checkShape(wrap(shp));
        expect(r.ok, `PrecastColumnBaseWithPosition: ${r.reason ?? ""}`).toBe(true);
    });

    // --- PrecastPinnedBase ---
    it("CreatePrecastPinnedBaseWithClamp", () => {
        const shp = tp.createPrecastPinnedBase({
            H1: 500.0, H2: 200.0, H3: 200.0,
            d: 100.0,
            B1: 200.0, B2: 400.0,
            L1: 300.0, L2: 600.0,
            B: 40.0, H: 40.0, L: 200.0,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, `PrecastPinnedBaseWithClamp: ${r.reason ?? ""}`).toBe(true);
    });

    it("CreatePrecastPinnedBaseWithoutClamp", () => {
        const shp = tp.createPrecastPinnedBase({
            H1: 500.0, H2: 200.0, H3: 200.0,
            d: 100.0,
            B1: 200.0, B2: 400.0,
            L1: 300.0, L2: 600.0,
            B: 0.0, H: 0.0, L: 0.0,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, `PrecastPinnedBaseWithoutClamp: ${r.reason ?? ""}`).toBe(true);
    });

    it("CreatePrecastPinnedBaseWithPlace", () => {
        const shp = tp.createPrecastPinnedBaseWithPosition({
            H1: 500.0, H2: 200.0, H3: 200.0,
            d: 100.0,
            B1: 200.0, B2: 400.0,
            L1: 300.0, L2: 600.0,
            B: 40.0, H: 40.0, L: 200.0,
        }, pnt(0, 0, 0), dir(0, 0, 1));
        const r = checkShape(wrap(shp));
        expect(r.ok, `PrecastPinnedBaseWithPosition: ${r.reason ?? ""}`).toBe(true);
    });

    // --- PrecastMetalSupportBase ---
    it("CreatePrecastMetalSupportBase", () => {
        const shp = tp.createPrecastMetalSupportBase({
            H1: 40.0, H2: 400.0, H3: 20.0, H4: 20.0,
            B1: 800.0, B2: 600.0,
            b1: 30.0, b2: 30.0,
            L1: 1000.0, L2: 800.0,
            S1: 40.0, S2: 20.0,
            n1: 3, n2: 9,
            HX: [100.0, 100.0, 100.0],
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, `PrecastMetalSupportBase: ${r.reason ?? ""}`).toBe(true);
    });

    it("CreatePrecastMetalSupportBaseWithPlace", () => {
        const shp = tp.createPrecastMetalSupportBaseWithPosition({
            H1: 40.0, H2: 400.0, H3: 20.0, H4: 20.0,
            B1: 800.0, B2: 600.0,
            b1: 30.0, b2: 30.0,
            L1: 1000.0, L2: 800.0,
            S1: 40.0, S2: 20.0,
            n1: 3, n2: 9,
            HX: [100.0, 100.0, 100.0],
        }, pnt(0, 0, 0), dir(0, 0, 1));
        const r = checkShape(wrap(shp));
        expect(r.ok, `PrecastMetalSupportBaseWithPosition: ${r.reason ?? ""}`).toBe(true);
    });

    // --- PrecastConcreteSupportBase ---
    it("CreatePrecastConcreteSupportBase", () => {
        const shp = tp.createPrecastConcreteSupportBase({
            H1: 40.0, H2: 400.0, H3: 20.0, H4: 20.0, H5: 20.0,
            B1: 800.0, B2: 600.0,
            b1: 30.0, b2: 40.0, b3: 20.0,
            L1: 1000.0, L2: 800.0,
            S1: 40.0,
            n1: 9,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, `PrecastConcreteSupportBase: ${r.reason ?? ""}`).toBe(true);
    });

    it("CreatePrecastConcreteSupportBaseWithPlace", () => {
        const shp = tp.createPrecastConcreteSupportBaseWithPosition({
            H1: 40.0, H2: 400.0, H3: 20.0, H4: 20.0, H5: 20.0,
            B1: 800.0, B2: 600.0,
            b1: 30.0, b2: 40.0, b3: 20.0,
            L1: 1000.0, L2: 800.0,
            S1: 40.0,
            n1: 9,
        }, pnt(0, 0, 0), dir(0, 0, 1));
        const r = checkShape(wrap(shp));
        expect(r.ok, `PrecastConcreteSupportBaseWithPosition: ${r.reason ?? ""}`).toBe(true);
    });
});
