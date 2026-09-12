/**
 * Port of go-topo primitives_gasket_test.go (25) + primitives_anchor_test.go (19)
 * + primitives_insulator_test.go (4) + primitives_tower_test.go (2) → TS (vitest)
 *
 * Go source: /Users/xuning/Work/go-topo/ (read-only)
 * JS bindings: packages/topo-wasm/src/topo.full.d.ts + src/primitives.d.ts
 *
 * Name mapping (Go → JS):
 *   Create*WithPlace → create*WithBase / create*WithCenter / create*WithPosition
 *   Params fields: TopRadius→topRadius, etc. (lowerCamelCase)
 */
import { beforeAll, describe, expect, it } from "vitest";
import { checkShape, getTopo } from "./helpers/topo";

let tp: any;
beforeAll(async () => {
    tp = await getTopo();
});

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

// ============================================================================
// GASKET TESTS (primitives_gasket_test.go — 25 cases)
// ============================================================================

describe("gasket primitives", () => {

    it("CreateTruncatedCone", () => {
        const shp = tp.createTruncatedCone({
            topRadius: 5.0,
            bottomRadius: 10.0,
            height: 15.0,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateTruncatedConeExtreme", () => {
        const shp = tp.createTruncatedCone({
            topRadius: 0.1,
            bottomRadius: 20.0,
            height: 30.0,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateTruncatedConeWithPlace", () => {
        const base = pnt(0, 0, 0);
        const axis = dir(0, 0, 1);
        const shp = tp.createTruncatedConeWithBase({
            topRadius: 5.0,
            bottomRadius: 10.0,
            height: 15.0,
        }, base, axis);
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateEccentricTruncatedCone", () => {
        const shp = tp.createEccentricTruncatedCone({
            topRadius: 5.0,
            bottomRadius: 10.0,
            height: 15.0,
            topXOffset: 2.0,
            topYOffset: 3.0,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateEccentricTruncatedConeExtreme", () => {
        const shp = tp.createEccentricTruncatedCone({
            topRadius: 1.0,
            bottomRadius: 20.0,
            height: 30.0,
            topXOffset: 5.0,
            topYOffset: 8.0,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateEccentricTruncatedConeWithPlace", () => {
        const base = pnt(0, 0, 0);
        const axis = dir(0, 0, 1);
        const shp = tp.createEccentricTruncatedConeWithBase({
            topRadius: 5.0,
            bottomRadius: 10.0,
            height: 15.0,
            topXOffset: 2.0,
            topYOffset: 3.0,
        }, base, axis);
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateRing", () => {
        const shp = tp.createRing({
            ringRadius: 20.0,
            tubeRadius: 5.0,
            angle: Math.PI * 1.5,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateRingFull", () => {
        const shp = tp.createRing({
            ringRadius: 15.0,
            tubeRadius: 3.0,
            angle: Math.PI * 2.0,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateRingWithPlace", () => {
        const center = pnt(0, 0, 0);
        const normal = dir(0, 0, 1);
        const xDir = dir(1, 0, 0);
        const shp = tp.createRingWithCenter({
            ringRadius: 20.0,
            tubeRadius: 5.0,
            angle: Math.PI * 1.5,
        }, center, normal, xDir);
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateRectangularRing", () => {
        const shp = tp.createRectangularRing({
            tubeRadius: 5.0,
            filletRadius: 0.0,
            length: 100.0,
            width: 80.0,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateRectangularRingRound", () => {
        const shp = tp.createRectangularRing({
            tubeRadius: 5.0,
            filletRadius: 12.0,
            length: 100.0,
            width: 80.0,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateRectangularRingWithPlace", () => {
        const center = pnt(0, 0, 0);
        const normal = dir(0, 0, 1);
        const xDir = dir(1, 0, 0);
        const shp = tp.createRectangularRingWithCenter({
            tubeRadius: 5.0,
            filletRadius: 0.0,
            length: 100.0,
            width: 80.0,
        }, center, normal, xDir);
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateEllipticRing", () => {
        const shp = tp.createEllipticRing({
            tubeRadius: 3.0,
            majorRadius: 20.0,
            minorRadius: 10.0,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateEllipticRingExtreme", () => {
        const shp = tp.createEllipticRing({
            tubeRadius: 1.0,
            majorRadius: 30.0,
            minorRadius: 5.0,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateEllipticRingWithPlace", () => {
        const center = pnt(0, 0, 0);
        const normal = dir(0, 0, 1);
        const xDir = dir(1, 0, 0);
        const shp = tp.createEllipticRingWithCenter({
            tubeRadius: 3.0,
            majorRadius: 20.0,
            minorRadius: 10.0,
        }, center, normal, xDir);
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateCircularGasket", () => {
        const shp = tp.createCircularGasket({
            outerRadius: 20.0,
            innerRadius: 15.0,
            height: 5.0,
            angle: Math.PI * 1.5,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateCircularGasketFull", () => {
        const shp = tp.createCircularGasket({
            outerRadius: 25.0,
            innerRadius: 20.0,
            height: 8.0,
            angle: Math.PI * 2.0,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateCircularGasketWithPlace", () => {
        const center = pnt(0, 0, 0);
        const normal = dir(0, 0, 1);
        const xDir = dir(1, 0, 0);
        const shp = tp.createCircularGasketWithCenter({
            outerRadius: 20.0,
            innerRadius: 15.0,
            height: 5.0,
            angle: Math.PI * 1.5,
        }, center, normal, xDir);
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateTableGasket", () => {
        const shp = tp.createTableGasket({
            topRadius: 15.0,
            outerRadius: 20.0,
            innerRadius: 10.0,
            height: 6.0,
            angle: Math.PI * 1.5,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateTableGasketFull", () => {
        const shp = tp.createTableGasket({
            topRadius: 18.0,
            outerRadius: 25.0,
            innerRadius: 12.0,
            height: 8.0,
            angle: Math.PI * 2.0,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateTableGasketWithPlace", () => {
        const center = pnt(0, 0, 0);
        const normal = dir(0, 0, 1);
        const xDir = dir(1, 0, 0);
        const shp = tp.createTableGasketWithCenter({
            topRadius: 15.0,
            outerRadius: 20.0,
            innerRadius: 10.0,
            height: 6.0,
            angle: Math.PI * 1.5,
        }, center, normal, xDir);
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateSquareGasket", () => {
        const shp = tp.createSquareGasket({
            outerLength: 30.0,
            outerWidth: 20.0,
            innerLength: 25.0,
            innerWidth: 15.0,
            height: 5.0,
            cornerType: 1,
            cornerParam: 0,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateSquareGasketRoundCorner", () => {
        const shp = tp.createSquareGasket({
            outerLength: 40.0,
            outerWidth: 30.0,
            innerLength: 15.0,
            innerWidth: 10.0,
            height: 8.0,
            cornerType: 2,
            cornerParam: 3.0,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateSquareGasketCutCorner", () => {
        const shp = tp.createSquareGasket({
            outerLength: 40.0,
            outerWidth: 30.0,
            innerLength: 15.0,
            innerWidth: 10.0,
            height: 8.0,
            cornerType: 3,
            cornerParam: 5.0,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateSquareGasketWithPlace", () => {
        const center = pnt(0, 0, 0);
        const normal = dir(0, 0, 1);
        const xDir = dir(1, 0, 0);
        const shp = tp.createSquareGasketWithCenter({
            outerLength: 30.0,
            outerWidth: 20.0,
            innerLength: 25.0,
            innerWidth: 15.0,
            height: 5.0,
            cornerType: 1,
            cornerParam: 0,
        }, center, normal, xDir);
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });
});

// ============================================================================
// ANCHOR TESTS (primitives_anchor_test.go — 19 cases)
// ============================================================================

describe("anchor primitives", () => {

    it("CreateSingleHookAnchor", () => {
        const shp = tp.createSingleHookAnchor({
            boltDiameter: 0.24,
            exposedLength: 0.2,
            nutCount: 2,
            nutHeight: 0.075,
            nutOD: 0.6,
            washerCount: 2,
            washerShape: tp.WasherShapeType.ROUND,
            washerSize: 0.65,
            washerThickness: 0.015,
            anchorLength: 1.5,
            hookStraightLength: 0.6,
            hookDiameter: 0.6,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateSingleHookAnchorWithPlace", () => {
        const pos = pnt(0, 0, 0);
        const normal = dir(0, 0, 1);
        const xDir = dir(1, 0, 0);
        const shp = tp.createSingleHookAnchorWithPosition({
            boltDiameter: 0.24,
            exposedLength: 0.2,
            nutCount: 2,
            nutHeight: 0.075,
            nutOD: 0.6,
            washerCount: 2,
            washerShape: tp.WasherShapeType.ROUND,
            washerSize: 0.65,
            washerThickness: 0.015,
            anchorLength: 1.5,
            hookStraightLength: 0.6,
            hookDiameter: 0.6,
        }, pos, normal, xDir);
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateTripleHookAnchor", () => {
        const shp = tp.createTripleHookAnchor({
            boltDiameter: 0.24,
            exposedLength: 0.2,
            nutCount: 2,
            nutHeight: 0.1,
            nutOD: 0.6,
            washerCount: 2,
            washerShape: tp.WasherShapeType.ROUND,
            washerSize: 0.65,
            washerThickness: 0.015,
            anchorLength: 1.5,
            hookStraightLengthA: 0.6,
            hookStraightLengthB: 0.25,
            hookDiameter: 0.6,
            anchorBarDiameter: 0.1,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateTripleHookAnchorWithPlace", () => {
        const pos = pnt(0, 0, 0);
        const normal = dir(0, 0, 1);
        const xDir = dir(1, 0, 0);
        const shp = tp.createTripleHookAnchorWithPosition({
            boltDiameter: 0.24,
            exposedLength: 0.2,
            nutCount: 2,
            nutHeight: 0.1,
            nutOD: 0.6,
            washerCount: 2,
            washerShape: tp.WasherShapeType.ROUND,
            washerSize: 0.65,
            washerThickness: 0.015,
            anchorLength: 1.5,
            hookStraightLengthA: 0.6,
            hookStraightLengthB: 0.25,
            hookDiameter: 0.6,
            anchorBarDiameter: 0.1,
        }, pos, normal, xDir);
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateRibbedAnchor", () => {
        const shp = tp.createRibbedAnchor({
            boltDiameter: 0.2,
            exposedLength: 0.40,
            nutCount: 0,
            nutHeight: 0.1,
            nutOD: 0.6,
            washerCount: 0,
            washerShape: tp.WasherShapeType.ROUND,
            washerSize: 0.65,
            washerThickness: 0.015,
            anchorLength: 1.5,
            basePlateSize: 0.60,
            ribTopWidth: 0.1,
            ribBottomWidth: 0.2,
            basePlateThickness: 0.030,
            ribHeight: 0.2,
            ribThickness: 0.025,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateRibbedAnchorWithPlace", () => {
        const pos = pnt(0, 0, 0);
        const normal = dir(0, 0, 1);
        const xDir = dir(1, 0, 0);
        const shp = tp.createRibbedAnchorWithPosition({
            boltDiameter: 0.2,
            exposedLength: 0.40,
            nutCount: 0,
            nutHeight: 0.1,
            nutOD: 0.6,
            washerCount: 0,
            washerShape: tp.WasherShapeType.ROUND,
            washerSize: 0.65,
            washerThickness: 0.015,
            anchorLength: 1.5,
            basePlateSize: 0.60,
            ribTopWidth: 0.1,
            ribBottomWidth: 0.2,
            basePlateThickness: 0.030,
            ribHeight: 0.2,
            ribThickness: 0.025,
        }, pos, normal, xDir);
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateNutAnchor", () => {
        const shp = tp.createNutAnchor({
            boltDiameter: 0.2,
            exposedLength: 0.40,
            nutCount: 2,
            nutHeight: 0.1,
            nutOD: 0.6,
            washerCount: 2,
            washerShape: tp.WasherShapeType.ROUND,
            washerSize: 0.65,
            washerThickness: 0.015,
            anchorLength: 1.5,
            basePlateSize: 0.60,
            basePlateThickness: 0.030,
            boltToPlateDistance: 1.4,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateNutAnchorWithPlace", () => {
        const pos = pnt(0, 0, 0);
        const normal = dir(0, 0, 1);
        const xDir = dir(1, 0, 0);
        const shp = tp.createNutAnchorWithPosition({
            boltDiameter: 0.2,
            exposedLength: 0.40,
            nutCount: 2,
            nutHeight: 0.1,
            nutOD: 0.6,
            washerCount: 2,
            washerShape: tp.WasherShapeType.ROUND,
            washerSize: 0.65,
            washerThickness: 0.015,
            anchorLength: 1.5,
            basePlateSize: 0.60,
            basePlateThickness: 0.030,
            boltToPlateDistance: 1.4,
        }, pos, normal, xDir);
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateTripleArmAnchor", () => {
        const shp = tp.createTripleArmAnchor({
            boltDiameter: 0.2,
            exposedLength: 0.40,
            nutCount: 2,
            nutHeight: 0.1,
            nutOD: 0.6,
            washerCount: 2,
            washerShape: tp.WasherShapeType.ROUND,
            washerSize: 0.65,
            washerThickness: 0.015,
            anchorLength: 1.5,
            armDiameter: 0.12,
            armStraightLength: 0.6,
            armBendLength: 0.4,
            armBendAngle: Math.PI / 4,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateTripleArmAnchorWithPlace", () => {
        const pos = pnt(0, 0, 0);
        const normal = dir(0, 0, 1);
        const xDir = dir(1, 0, 0);
        const shp = tp.createTripleArmAnchorWithPosition({
            boltDiameter: 0.2,
            exposedLength: 0.40,
            nutCount: 2,
            nutHeight: 0.1,
            nutOD: 0.6,
            washerCount: 2,
            washerShape: tp.WasherShapeType.ROUND,
            washerSize: 0.65,
            washerThickness: 0.015,
            anchorLength: 1.5,
            armDiameter: 0.12,
            armStraightLength: 0.6,
            armBendLength: 0.4,
            armBendAngle: Math.PI / 4,
        }, pos, normal, xDir);
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreatePositioningPlateAnchor", () => {
        const shp = tp.createPositioningPlateAnchor({
            boltDiameter: 0.2,
            exposedLength: 0.40,
            nutCount: 2,
            nutHeight: 0.1,
            nutOD: 0.6,
            washerCount: 2,
            washerShape: tp.WasherShapeType.ROUND,
            washerSize: 0.65,
            washerThickness: 0.015,
            anchorLength: 1.5,
            plateLength: 0.60,
            plateThickness: 0.030,
            toBaseDistance: 0.2,
            toBottomDistance: 0.2,
            groutHoleDiameter: 0.3,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreatePositioningPlateAnchorWithPlace", () => {
        const pos = pnt(0, 0, 0);
        const normal = dir(0, 0, 1);
        const xDir = dir(1, 0, 0);
        const shp = tp.createPositioningPlateAnchorWithPosition({
            boltDiameter: 0.2,
            exposedLength: 0.40,
            nutCount: 2,
            nutHeight: 0.1,
            nutOD: 0.6,
            washerCount: 2,
            washerShape: tp.WasherShapeType.ROUND,
            washerSize: 0.65,
            washerThickness: 0.015,
            anchorLength: 1.5,
            plateLength: 0.60,
            plateThickness: 0.030,
            toBaseDistance: 0.2,
            toBottomDistance: 0.2,
            groutHoleDiameter: 0.3,
        }, pos, normal, xDir);
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateStubAngle", () => {
        const shp = tp.createStubAngle({
            legWidth: 0.1,
            thickness: 0.01,
            slope: 0.1,
            exposedLength: 2.0,
            anchorLength: 5.0,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateStubAngleWithPlace", () => {
        const pos = pnt(0, 0, 0);
        const normal = dir(0, 0, 1);
        const xDir = dir(1, 0, 0);
        const shp = tp.createStubAngleWithPosition({
            legWidth: 0.1,
            thickness: 0.01,
            slope: 0.1,
            exposedLength: 2.0,
            anchorLength: 5.0,
        }, pos, normal, xDir);
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateStubTube", () => {
        const shp = tp.createStubTube({
            diameter: 0.6,
            thickness: 0.1,
            slope: 0.1,
            exposedLength: 2.0,
            anchorLength: 10.0,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateStubTubeSloped", () => {
        const shp = tp.createStubTube({
            diameter: 0.6,
            thickness: 0.1,
            slope: 0.2,
            exposedLength: 2.0,
            anchorLength: 10.0,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateStubTubeWithPlace", () => {
        const pos = pnt(0, 0, 0);
        const normal = dir(0, 0, 1);
        const xDir = dir(1, 0, 0);
        const shp = tp.createStubTubeWithPosition({
            diameter: 0.6,
            thickness: 0.1,
            slope: 0.1,
            exposedLength: 2.0,
            anchorLength: 10.0,
        }, pos, normal, xDir);
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateUShapedRing", () => {
        const shp = tp.createUShapedRing({
            thickness: 0.02,
            height: 0.1,
            radius: 0.08,
            length: 0.05,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateUShapedRingWithPlace", () => {
        const pos = pnt(0, 0, 0);
        const normal = dir(0, 0, 1);
        const xDir = dir(1, 0, 0);
        const shp = tp.createUShapedRingWithPosition({
            thickness: 0.02,
            height: 0.1,
            radius: 0.08,
            length: 0.05,
        }, pos, normal, xDir);
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });
});

// ============================================================================
// INSULATOR TESTS (primitives_insulator_test.go — 4 cases)
// ============================================================================

describe("insulator primitives", () => {

    it("CreateCompositeInsulatorSuspensionCeramic", () => {
        const shp = tp.createInsulator({
            type: "XWP-70",
            subNum: 1,
            subType: 0,
            splitDistance: 0,
            vAngleLeft: 0,
            vAngleRight: 0,
            uLinkLength: 0,
            weight: 5.2,
            fittingLengths: { leftUpper: 0.7, rightUpper: 0.7, leftLower: 1, rightLower: 1 },
            multiLink: { count: 1, spacing: 0, arrangement: tp.ArrangementType.VERTICAL },
            insulator: {
                radius: 0.475,
                height: 10.146,
                leftCount: 20,
                rightCount: 20,
                material: tp.InsulatorMaterial.CERAMIC,
            },
            gradingRing: { count: 1, position: 0.5, height: 0.03, radius: 0.15 },
            application: tp.ApplicationType.CONDUCTOR,
            stringType: tp.StringType.SUSPENSION,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateCompositeInsulatorSuspensionWithULink", () => {
        const shp = tp.createInsulator({
            type: "XWP-70",
            subNum: 1,
            subType: 0,
            splitDistance: 0,
            vAngleLeft: 0,
            vAngleRight: 0,
            uLinkLength: 2,
            weight: 5.2,
            fittingLengths: { leftUpper: 0.7, rightUpper: 0.7, leftLower: 1, rightLower: 1 },
            multiLink: { count: 1, spacing: 0, arrangement: tp.ArrangementType.VERTICAL },
            insulator: {
                radius: 0.475,
                height: 10.146,
                leftCount: 20,
                rightCount: 20,
                material: tp.InsulatorMaterial.CERAMIC,
            },
            gradingRing: { count: 1, position: 0.5, height: 0.03, radius: 0.15 },
            application: tp.ApplicationType.CONDUCTOR,
            stringType: tp.StringType.SUSPENSION,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateCompositeInsulatorVTypeTension", () => {
        const shp = tp.createInsulator({
            type: "FXBW-110/100",
            subNum: 2,
            subType: 1,
            splitDistance: 400,
            vAngleLeft: 40,
            vAngleRight: 30,
            uLinkLength: 0,
            weight: 8.5,
            fittingLengths: { leftUpper: 0.7, rightUpper: 0.7, leftLower: 1, rightLower: 1 },
            multiLink: { count: 1, spacing: 0, arrangement: tp.ArrangementType.HORIZONTAL },
            insulator: {
                radius: { majorRadius: 0.47, minorRadius: 0.55, gap: 0.4 },
                height: 20.146,
                leftCount: 20,
                rightCount: 20,
                material: tp.InsulatorMaterial.COMPOSITE,
            },
            gradingRing: { count: 2, position: 0.4, height: 0.04, radius: 0.2 },
            application: tp.ApplicationType.GROUND_WIRE,
            stringType: tp.StringType.SUSPENSION,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreateCompositeInsulatorWithPlace", () => {
        const pos = pnt(0, 0, 0);
        const dir1 = dir(0, 0, 1);
        const shp = tp.createInsulatorWithPosition({
            type: "XWP-70",
            subNum: 1,
            subType: 0,
            splitDistance: 0,
            vAngleLeft: 0,
            vAngleRight: 0,
            uLinkLength: 0,
            weight: 5.2,
            fittingLengths: { leftUpper: 0.7, rightUpper: 0.7, leftLower: 1, rightLower: 1 },
            multiLink: { count: 1, spacing: 0, arrangement: tp.ArrangementType.VERTICAL },
            insulator: {
                radius: 0.475,
                height: 10.146,
                leftCount: 20,
                rightCount: 20,
                material: tp.InsulatorMaterial.CERAMIC,
            },
            gradingRing: { count: 1, position: 0.5, height: 0.03, radius: 0.15 },
            application: tp.ApplicationType.CONDUCTOR,
            stringType: tp.StringType.SUSPENSION,
        }, pos, dir1);
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });
});

// ============================================================================
// TOWER TESTS (primitives_tower_test.go — 2 cases)
// ============================================================================

describe("tower primitives", () => {

    it("CreatePoleTower", () => {
        const shp = tp.createPoleTower({
            heights: [
                { value: 18.0, bodyId: "body1", legId: "leg1" },
            ],
            bodies: [
                {
                    id: "body1",
                    height: 30.0,
                    nodes: [
                        { id: "n1", position: pnt(0, 0, 0) },
                        { id: "n2", position: pnt(1, 0, 0) },
                        { id: "n3", position: pnt(0, 1, 0) },
                        { id: "n4", position: pnt(1, 1, 0) },
                    ],
                    legs: [
                        {
                            id: "leg1",
                            commonHeight: 10.0,
                            specificHeight: 8.0,
                            nodes: [
                                { id: "ln1", position: pnt(0, 0, -10) },
                                { id: "ln2", position: pnt(1, 0, -10) },
                            ],
                        },
                    ],
                },
            ],
            members: [
                {
                    id: "m1",
                    startNodeId: "n1",
                    endNodeId: "n2",
                    type: tp.MemberType.ANGLE,
                    specification: "L0.2x0.05",
                    material: "Q345",
                    xDirection: dir(1, 0, 0),
                    yDirection: dir(0, 1, 0),
                    end1Diameter: 0,
                    end2Diameter: 0,
                    thickness: 0,
                    sides: 0,
                },
                {
                    id: "m2",
                    startNodeId: "n2",
                    endNodeId: "n3",
                    type: tp.MemberType.ANGLE,
                    specification: "L0.2x0.05",
                    material: "Q345",
                    xDirection: dir(1, 0, 0),
                    yDirection: dir(0, 1, 0),
                    end1Diameter: 0,
                    end2Diameter: 0,
                    thickness: 0,
                    sides: 0,
                },
                {
                    id: "m3",
                    startNodeId: "n1",
                    endNodeId: "n3",
                    type: tp.MemberType.ANGLE,
                    specification: "L0.2x0.05",
                    material: "Q345",
                    xDirection: dir(1, 0, 0),
                    yDirection: dir(0, 1, 0),
                    end1Diameter: 0,
                    end2Diameter: 0,
                    thickness: 0,
                    sides: 0,
                },
                {
                    id: "m4",
                    startNodeId: "n2",
                    endNodeId: "n4",
                    type: tp.MemberType.ANGLE,
                    specification: "L0.2x0.05",
                    material: "Q345",
                    xDirection: dir(1, 0, 0),
                    yDirection: dir(0, 1, 0),
                    end1Diameter: 0,
                    end2Diameter: 0,
                    thickness: 0,
                    sides: 0,
                },
                {
                    id: "m5",
                    startNodeId: "n3",
                    endNodeId: "n4",
                    type: tp.MemberType.ANGLE,
                    specification: "L0.2x0.05",
                    material: "Q345",
                    xDirection: dir(1, 0, 0),
                    yDirection: dir(0, 1, 0),
                    end1Diameter: 0,
                    end2Diameter: 0,
                    thickness: 0,
                    sides: 0,
                },
            ],
            attachments: [
                { name: "ground_wire", type: tp.AttachmentType.GROUND_WIRE, position: pnt(0.5, 0.5, 30) },
            ],
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });

    it("CreatePoleTowerWithPlace", () => {
        const pos = pnt(0, 0, 0);
        const normal = dir(0, 0, 1);
        const xDir = dir(1, 0, 0);
        const shp = tp.createPoleTowerWithPosition({
            heights: [
                { value: 18.0, bodyId: "body1", legId: "leg1" },
            ],
            bodies: [
                {
                    id: "body1",
                    height: 30.0,
                    nodes: [
                        { id: "n1", position: pnt(0, 0, 0) },
                        { id: "n2", position: pnt(1, 0, 0) },
                        { id: "n3", position: pnt(0, 1, 0) },
                    ],
                    legs: [
                        {
                            id: "leg1",
                            commonHeight: 10.0,
                            specificHeight: 8.0,
                            nodes: [
                                { id: "ln1", position: pnt(0, 0, -10) },
                                { id: "ln2", position: pnt(1, 0, -10) },
                            ],
                        },
                    ],
                },
            ],
            members: [
                {
                    id: "m1",
                    startNodeId: "n1",
                    endNodeId: "n2",
                    type: tp.MemberType.ANGLE,
                    specification: "L0.2x0.05",
                    material: "Q345",
                    xDirection: dir(1, 0, 0),
                    yDirection: dir(0, 1, 0),
                    end1Diameter: 0,
                    end2Diameter: 0,
                    thickness: 0,
                    sides: 0,
                },
                {
                    id: "m2",
                    startNodeId: "n2",
                    endNodeId: "n3",
                    type: tp.MemberType.ANGLE,
                    specification: "L0.2x0.05",
                    material: "Q345",
                    xDirection: dir(1, 0, 0),
                    yDirection: dir(0, 1, 0),
                    end1Diameter: 0,
                    end2Diameter: 0,
                    thickness: 0,
                    sides: 0,
                },
                {
                    id: "m3",
                    startNodeId: "n1",
                    endNodeId: "n3",
                    type: tp.MemberType.ANGLE,
                    specification: "L0.2x0.05",
                    material: "Q345",
                    xDirection: dir(1, 0, 0),
                    yDirection: dir(0, 1, 0),
                    end1Diameter: 0,
                    end2Diameter: 0,
                    thickness: 0,
                    sides: 0,
                },
            ],
            attachments: [],
        }, pos, normal, xDir);
        const r = checkShape(wrap(shp));
        expect(r.ok, r.reason).toBe(true);
    });
});
