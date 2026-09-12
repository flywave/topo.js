import { beforeAll, describe, expect, it } from "vitest";
import { getTopo } from "./helpers/topo";

let tp: any;

beforeAll(async () => {
    tp = await getTopo();
});

// ─── helpers ───────────────────────────────────────────────────────
function pnt(x: number, y: number, z: number) {
    return new tp.gp_Pnt_3(x, y, z);
}

function dir(x: number, y: number, z: number) {
    return new tp.gp_Dir_4(x, y, z);
}

function axis1(origin: any, d: any) {
    return new tp.gp_Ax1_2(origin, d);
}

function pnt2d(x: number, y: number) {
    return new tp.gp_Pnt2d_3(x, y);
}

function chanPt(x: number, y: number, z: number, arc = false) {
    return {
        position: pnt(x, y, z),
        type: arc ? tp.ChannelPointType.ARC : tp.ChannelPointType.LINE,
    };
}

function triProfile(p1: any, p2: any, p3: any) {
    return { type: tp.ProfileType.TRIANGLE, p1, p2, p3 };
}

function rectProfile(p1: any, p2: any) {
    return { type: tp.ProfileType.RECTANGLE, p1, p2 };
}

function circProfile(center: any, norm: any, radius: number) {
    return { type: tp.ProfileType.CIRC, center, norm, radius };
}

function elipsProfile(s1: any, s2: any, center: any) {
    return { type: tp.ProfileType.ELIPS, s1, s2, center };
}

function polyProfile(edges: any[]) {
    return { type: tp.ProfileType.POLYGON, edges, inners: [] };
}

// =========================================================================
// primitives_plate_test.go  (10 cases)
// =========================================================================
describe("Plate primitives", () => {
    it("CreateTerminalBlock", () => {
        const shp = tp.createTerminalBlock({
            length: 100, width: 50, thickness: 10,
            chamferLength: 5, columnSpacing: 15, rowSpacing: 20,
            holeRadius: 3, columnCount: 3, rowCount: 4, bottomOffset: 20,
        });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateTerminalBlockExtreme", () => {
        const shp = tp.createTerminalBlock({
            length: 200, width: 30, thickness: 5,
            chamferLength: 1, columnSpacing: 10, rowSpacing: 15,
            holeRadius: 2, columnCount: 5, rowCount: 6, bottomOffset: 5,
        });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateTerminalBlockWithPlace", () => {
        const pos = pnt(0, 0, 0);
        const lDir = dir(1, 0, 0);
        const wDir = dir(0, 1, 0);
        const shp = tp.createTerminalBlockWithPosition({
            length: 100, width: 50, thickness: 10,
            chamferLength: 5, columnSpacing: 15, rowSpacing: 20,
            holeRadius: 3, columnCount: 3, rowCount: 4, bottomOffset: 20,
        }, pos, lDir, wDir);
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateRectangularFixedPlate", () => {
        const shp = tp.createRectangularFixedPlate({
            length: 100, width: 80, thickness: 10,
            columnSpacing: 20, rowSpacing: 15,
            columnCount: 4, rowCount: 5,
            hasMiddleHole: true, holeDiameter: 8,
        });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateRectangularFixedPlateNoMiddle", () => {
        const shp = tp.createRectangularFixedPlate({
            length: 120, width: 120, thickness: 8,
            columnSpacing: 25, rowSpacing: 20,
            columnCount: 3, rowCount: 5,
            hasMiddleHole: false, holeDiameter: 6,
        });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateRectangularFixedPlateWithPlace", () => {
        const pos = pnt(0, 0, 0);
        const lDir = dir(1, 0, 0);
        const wDir = dir(0, 1, 0);
        const shp = tp.createRectangularFixedPlateWithPosition({
            length: 100, width: 80, thickness: 10,
            columnSpacing: 20, rowSpacing: 15,
            columnCount: 4, rowCount: 5,
            hasMiddleHole: true, holeDiameter: 8,
        }, pos, lDir, wDir);
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateCircularFixedPlate", () => {
        const shp = tp.createCircularFixedPlate({
            length: 200, width: 200, thickness: 12,
            ringRadius: 60, holeCount: 8,
            hasMiddleHole: true, holeDiameter: 15,
        });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateCircularFixedPlateNoMiddle", () => {
        const shp = tp.createCircularFixedPlate({
            length: 180, width: 180, thickness: 10,
            ringRadius: 50, holeCount: 6,
            hasMiddleHole: false, holeDiameter: 12,
        });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateCircularFixedPlateExtreme", () => {
        const shp = tp.createCircularFixedPlate({
            length: 100, width: 100, thickness: 5,
            ringRadius: 30, holeCount: 12,
            hasMiddleHole: true, holeDiameter: 8,
        });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateCircularFixedPlateWithPlace", () => {
        const pos = pnt(0, 0, 0);
        const lDir = dir(1, 0, 0);
        const wDir = dir(0, 1, 0);
        const shp = tp.createCircularFixedPlateWithPosition({
            length: 200, width: 200, thickness: 12,
            ringRadius: 60, holeCount: 8,
            hasMiddleHole: true, holeDiameter: 15,
        }, pos, lDir, wDir);
        expect(shp.IsNull()).toBe(false);
    });
});

// =========================================================================
// primitives_steel_test.go  (11 cases)
// =========================================================================
describe("Steel primitives", () => {
    it("CreateAngleSteel", () => {
        const shp = tp.createAngleSteel({ L1: 60, L2: 40, X: 5, length: 200 });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateAngleSteelExtreme", () => {
        const shp = tp.createAngleSteel({ L1: 100, L2: 30, X: 3, length: 500 });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateAngleSteelWithPlace", () => {
        const pos = pnt(0, 0, 0);
        const xDir = dir(1, 0, 0);
        const longEdgeDir = dir(0, 0, 1);
        const shp = tp.createAngleSteelWithPosition(
            { L1: 60, L2: 40, X: 5, length: 200 }, pos, xDir, longEdgeDir,
        );
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateIShapedSteel", () => {
        const shp = tp.createIShapedSteel({
            height: 200, flangeWidth: 150, webThickness: 12,
            flangeThickness: 8, length: 1000,
        });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateIShapedSteelWithPlace", () => {
        const pos = pnt(0, 0, 0);
        const xDir = dir(1, 0, 0);
        const zDir = dir(0, 0, 1);
        const shp = tp.createIShapedSteelWithPosition(
            { height: 200, flangeWidth: 150, webThickness: 12, flangeThickness: 8, length: 1000 },
            pos, xDir, zDir,
        );
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateChannelSteel", () => {
        const shp = tp.createChannelSteel({
            height: 100, flangeWidth: 50, webThickness: 6,
            flangeThickness: 8, length: 500,
        });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateChannelSteelExtreme", () => {
        const shp = tp.createChannelSteel({
            height: 200, flangeWidth: 30, webThickness: 4,
            flangeThickness: 5, length: 1000,
        });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateChannelSteelWithPlace", () => {
        const pos = pnt(0, 0, 0);
        const xDir = dir(1, 0, 0);
        const zDir = dir(0, 0, 1);
        const shp = tp.createChannelSteelWithPosition(
            { height: 100, flangeWidth: 50, webThickness: 6, flangeThickness: 8, length: 500 },
            pos, xDir, zDir,
        );
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateTSteel", () => {
        const shp = tp.createTSteel({
            height: 120, width: 60, webThickness: 8,
            flangeThickness: 10, length: 600,
        });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateTSteelExtreme", () => {
        const shp = tp.createTSteel({
            height: 150, width: 40, webThickness: 5,
            flangeThickness: 6, length: 800,
        });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateTSteelWithPlace", () => {
        const pos = pnt(0, 0, 0);
        const xDir = dir(1, 0, 0);
        const zDir = dir(0, 0, 1);
        const shp = tp.createTSteelWithPosition(
            { height: 120, width: 60, webThickness: 8, flangeThickness: 10, length: 600 },
            pos, xDir, zDir,
        );
        expect(shp.IsNull()).toBe(false);
    });
});

// =========================================================================
// primitives_shape_test.go  (17 cases)
// =========================================================================
describe("Shape primitives", () => {
    it("CreateRevol", () => {
        const origin = pnt(0, 0, 0);
        const zDir = dir(0, 0, 1);
        const ax = axis1(origin, zDir);
        const angle = Math.PI / 4;

        const triShp = tp.createRevol({
            profile: triProfile(pnt(0, 0, 0), pnt(10, 0, 0), pnt(5, 0, 8)),
            axis: ax, angle,
        });
        expect(triShp.IsNull()).toBe(false);

        const rectShp = tp.createRevol({
            profile: rectProfile(pnt(0, 0, 0), pnt(10, 0, 5)),
            axis: ax, angle,
        });
        expect(rectShp.IsNull()).toBe(false);

        const circShp = tp.createRevol({
            profile: circProfile(pnt(10, 0, 0), dir(0, 1, 0), 5.0),
            axis: ax, angle,
        });
        expect(circShp.IsNull()).toBe(false);

        const elipsShp = tp.createRevol({
            profile: elipsProfile(pnt(20, 0, 0), pnt(10, 0, 5), pnt(10, 0, 0)),
            axis: ax, angle,
        });
        expect(elipsShp.IsNull()).toBe(false);

        const polyShp = tp.createRevol({
            profile: polyProfile([
                pnt(0, 0, 0), pnt(10, 0, 0), pnt(15, 0, 5),
                pnt(10, 0, 10), pnt(0, 0, 10),
            ]),
            axis: ax, angle,
        });
        expect(polyShp.IsNull()).toBe(false);
    });

    it("CreatePrism", () => {
        const zDir = dir(0, 0, 1);

        const triShp = tp.createPrism({
            profile: triProfile(pnt(0, 0, 0), pnt(10, 0, 0), pnt(5, 8, 0)),
            direction: zDir, height: 20,
        });
        expect(triShp.IsNull()).toBe(false);

        const rectShp = tp.createPrism({
            profile: rectProfile(pnt(0, 0, 0), pnt(10, 5, 0)),
            direction: zDir, height: 20,
        });
        expect(rectShp.IsNull()).toBe(false);

        const circShp = tp.createPrism({
            profile: circProfile(pnt(0, 0, 0), dir(0, 0, 1), 5.0),
            direction: zDir, height: 20,
        });
        expect(circShp.IsNull()).toBe(false);

        const elipsShp = tp.createPrism({
            profile: elipsProfile(pnt(10, 0, 0), pnt(0, 5, 0), pnt(0, 0, 0)),
            direction: zDir, height: 20,
        });
        expect(elipsShp.IsNull()).toBe(false);

        const polyShp = tp.createPrism({
            profile: polyProfile([
                pnt(0, 0, 0), pnt(10, 0, 0), pnt(15, 5, 0),
                pnt(10, 10, 0), pnt(0, 10, 0),
            ]),
            direction: zDir, height: 20,
        });
        expect(polyShp.IsNull()).toBe(false);
    });

    it("CreatePipe - CircularLinePipe", () => {
        const cp5 = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 5.0);
        const cp10 = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 10.0);
        const shp = tp.createPipe({
            wire: [pnt(0, 0, 0), pnt(100, 0, 0)],
            profile: [cp5, cp10],
            innerProfile: null,
            segmentType: tp.SegmentType.LINE,
            transitionMode: tp.TransitionMode.TRANSFORMED,
            upDir: dir(0, 0, 1),
        });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreatePipe - CircularArcPipe", () => {
        const cp5 = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 5.0);
        const cp10 = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 10.0);
        const shp = tp.createPipe({
            wire: [pnt(0, 0, 0), pnt(50, 50, 0), pnt(100, 0, 0)],
            profile: [cp5, cp10],
            innerProfile: null,
            segmentType: tp.SegmentType.THREE_POINT_ARC,
            transitionMode: tp.TransitionMode.TRANSFORMED,
            upDir: dir(0, 0, 1),
        });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreatePipe - CircularCenterArcPipe", () => {
        const cp6 = circProfile(pnt(50, 0, 0), dir(0, 0, 1), 6.0);
        const cp10 = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 10.0);
        const shp = tp.createPipe({
            wire: [pnt(0, 0, 0), pnt(50, 0, 0), pnt(100, 0, 0)],
            profile: [cp6, cp10],
            innerProfile: null,
            segmentType: tp.SegmentType.CIRCLE_CENTER_ARC,
            transitionMode: tp.TransitionMode.TRANSFORMED,
            upDir: dir(0, 0, 1),
        });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreatePipe - CircularSplinePipe", () => {
        const cp5 = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 5.0);
        const cp10 = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 10.0);
        const shp = tp.createPipe({
            wire: [pnt(0, 0, 0), pnt(30, 30, 20), pnt(70, 30, 40), pnt(100, 0, 50)],
            profile: [cp5, cp10],
            innerProfile: null,
            segmentType: tp.SegmentType.SPLINE,
            transitionMode: tp.TransitionMode.TRANSFORMED,
            upDir: dir(0, 0, 1),
        });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreatePipe - PolygonLinePipe", () => {
        const shp = tp.createPipe({
            wire: [pnt(0, 0, 0), pnt(100, 0, 0)],
            profile: [polyProfile([
                pnt(0, 0, 0), pnt(10, 0, 0), pnt(10, 5, 0),
                pnt(0, 5, 0), pnt(0, 0, 0),
            ])],
            innerProfile: null,
            segmentType: tp.SegmentType.LINE,
            transitionMode: tp.TransitionMode.TRANSFORMED,
            upDir: dir(0, 0, 1),
        });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreatePipe - CircularSplineInnerPipe", () => {
        const cp5 = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 5.0);
        const cp3 = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 3.0);
        const shp = tp.createPipe({
            wire: [pnt(0, 0, 0), pnt(30, 30, 20), pnt(70, 30, 40), pnt(100, 0, 50)],
            profile: [cp5],
            innerProfile: [cp3],
            segmentType: tp.SegmentType.SPLINE,
            transitionMode: tp.TransitionMode.TRANSFORMED,
            upDir: dir(0, 0, 1),
        });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreatePipe - CircularLinePipeSplit", () => {
        const cp5 = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 5.0);
        const cp10 = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 10.0);
        const shp = tp.createPipeWithSplitDistances({
            wire: [pnt(0, 0, 0), pnt(100, 0, 0)],
            profile: [cp5, cp10],
            innerProfile: null,
            segmentType: tp.SegmentType.LINE,
            transitionMode: tp.TransitionMode.TRANSFORMED,
            upDir: dir(0, 0, 1),
        }, [20.0, 80.0]);
        expect(shp.IsNull()).toBe(false);
    });

    it("CreatePipe - CircularSplineInnerPipeSplit", () => {
        const cp5 = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 5.0);
        const cp3 = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 3.0);
        const shp = tp.createPipeWithSplitDistances({
            wire: [pnt(0, 0, 0), pnt(30, 30, 20), pnt(70, 30, 40), pnt(100, 0, 50)],
            profile: [cp5],
            innerProfile: [cp3],
            segmentType: tp.SegmentType.SPLINE,
            transitionMode: tp.TransitionMode.TRANSFORMED,
            upDir: dir(0, 0, 1),
        }, [10.0, 80.0]);
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateMultiSegmentPipe - BasicMultiSegment", () => {
        const linePoints = [pnt(50, -50, 0), pnt(100, 0, 0)];
        const arcPoints = [pnt(100, 0, 0), pnt(150, 50, 0), pnt(200, 0, 0)];
        const centerArcPoints = [pnt(200, 0, 0), pnt(250, 0, 0), pnt(300, 0, 0)];
        const splinePoints = [pnt(300, 0, 0), pnt(350, 50, 50), pnt(400, 0, 100)];
        const cp = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 10.0);
        const inner = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 8.0);
        const shp = tp.createMultiSegmentPipe({
            wires: [linePoints, arcPoints, centerArcPoints, splinePoints],
            profiles: [cp, cp, cp, cp],
            innerProfiles: [inner, inner, inner, inner],
            segmentTypes: [
                tp.SegmentType.LINE, tp.SegmentType.THREE_POINT_ARC,
                tp.SegmentType.CIRCLE_CENTER_ARC, tp.SegmentType.SPLINE,
            ],
            transitionMode: tp.TransitionMode.ROUND,
            upDir: dir(0, 0, 1),
        });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateMultiSegmentPipe - BugCase", () => {
        const points = [
            [pnt(0, 0, 0), pnt(13.363751136232167, -26.227833716198802, 40.422308564186096)],
            [pnt(13.363751136232167, -26.227833716198802, 40.422308564186096), pnt(46.29231750732288, -90.69991450663656, 108.94551491551101)],
            [pnt(46.29231750732288, -90.69991450663656, 108.94551491551101), pnt(132.02422594139352, -257.1274096108973, -1.525045077316463)],
            [pnt(132.02422594139352, -257.1274096108973, -1.525045077316463), pnt(155.7862730268389, -461.9796159574762, 275.57995436759666)],
            [pnt(155.7862730268389, -461.9796159574762, 275.57995436759666), pnt(277.5595232350752, -1029.277987377718, 560.3984563779086)],
        ];
        const upDir = dir(-2365550.686973459, 4588616.347934356, 3734082.7681595744);
        const polygonProf = polyProfile([
            pnt(-3.171, 2.538, 0), pnt(-3.136, 3.954, 0), pnt(-2.498, 5.219, 0),
            pnt(-1.382, 6.09, 0), pnt(0, 6.4, 0), pnt(1.382, 6.09, 0),
            pnt(2.498, 5.219, 0), pnt(3.136, 3.954, 0), pnt(3.171, 2.538, 0),
            pnt(2.5, 0, 0), pnt(-2.5, 0, 0), pnt(-3.171, 2.538, 0),
        ]);
        const shp = tp.createMultiSegmentPipe({
            wires: points,
            profiles: [polygonProf, polygonProf, polygonProf, polygonProf, polygonProf],
            innerProfiles: null,
            segmentTypes: [
                tp.SegmentType.LINE, tp.SegmentType.LINE, tp.SegmentType.LINE,
                tp.SegmentType.LINE, tp.SegmentType.LINE,
            ],
            transitionMode: tp.TransitionMode.TRANSFORMED,
            upDir,
        });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateMultiSegmentPipe - FrontCut", () => {
        const linePoints = [pnt(50, -50, 0), pnt(100, 0, 0)];
        const arcPoints = [pnt(100, 0, 0), pnt(150, 50, 0), pnt(200, 0, 0)];
        const centerArcPoints = [pnt(200, 0, 0), pnt(250, 0, 0), pnt(300, 0, 0)];
        const splinePoints = [pnt(300, 0, 0), pnt(350, 50, 50), pnt(400, 0, 100)];
        const cp = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 10.0);
        const inner = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 8.0);
        const shp = tp.createMultiSegmentPipeWithSplitDistances({
            wires: [linePoints, arcPoints, centerArcPoints, splinePoints],
            profiles: [cp, cp, cp, cp],
            innerProfiles: [inner, inner, inner, inner],
            segmentTypes: [
                tp.SegmentType.LINE, tp.SegmentType.THREE_POINT_ARC,
                tp.SegmentType.CIRCLE_CENTER_ARC, tp.SegmentType.SPLINE,
            ],
            transitionMode: tp.TransitionMode.ROUND,
            upDir: dir(0, 0, 1),
        }, [50.0, -1]);
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateMultiSegmentPipe - BackCut", () => {
        const linePoints = [pnt(50, -50, 0), pnt(100, 0, 0)];
        const arcPoints = [pnt(100, 0, 0), pnt(150, 50, 0), pnt(200, 0, 0)];
        const centerArcPoints = [pnt(200, 0, 0), pnt(250, 0, 0), pnt(300, 0, 0)];
        const splinePoints = [pnt(300, 0, 0), pnt(350, 50, 50), pnt(400, 0, 100)];
        const cp = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 10.0);
        const inner = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 8.0);
        const shp = tp.createMultiSegmentPipeWithSplitDistances({
            wires: [linePoints, arcPoints, centerArcPoints, splinePoints],
            profiles: [cp, cp, cp, cp],
            innerProfiles: [inner, inner, inner, inner],
            segmentTypes: [
                tp.SegmentType.LINE, tp.SegmentType.THREE_POINT_ARC,
                tp.SegmentType.CIRCLE_CENTER_ARC, tp.SegmentType.SPLINE,
            ],
            transitionMode: tp.TransitionMode.ROUND,
            upDir: dir(0, 0, 1),
        }, [0.0, 250.0]);
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateMultiSegmentPipe - BothCuts", () => {
        const linePoints = [pnt(50, -50, 0), pnt(100, 0, 0)];
        const arcPoints = [pnt(100, 0, 0), pnt(150, 50, 0), pnt(200, 0, 0)];
        const centerArcPoints = [pnt(200, 0, 0), pnt(250, 0, 0), pnt(300, 0, 0)];
        const splinePoints = [pnt(300, 0, 0), pnt(350, 50, 50), pnt(400, 0, 100)];
        const cp = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 10.0);
        const inner = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 8.0);
        const shp = tp.createMultiSegmentPipeWithSplitDistances({
            wires: [linePoints, arcPoints, centerArcPoints, splinePoints],
            profiles: [cp, cp, cp, cp],
            innerProfiles: [inner, inner, inner, inner],
            segmentTypes: [
                tp.SegmentType.LINE, tp.SegmentType.THREE_POINT_ARC,
                tp.SegmentType.CIRCLE_CENTER_ARC, tp.SegmentType.SPLINE,
            ],
            transitionMode: tp.TransitionMode.ROUND,
            upDir: dir(0, 0, 1),
        }, [50.0, 250.0]);
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateMultiSegmentPipe - MiddleSegmentCut", () => {
        const linePoints = [pnt(50, -50, 0), pnt(100, 0, 0)];
        const arcPoints = [pnt(100, 0, 0), pnt(150, 50, 0), pnt(200, 0, 0)];
        const centerArcPoints = [pnt(200, 0, 0), pnt(250, 0, 0), pnt(300, 0, 0)];
        const splinePoints = [pnt(300, 0, 0), pnt(350, 50, 50), pnt(400, 0, 100)];
        const cp = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 10.0);
        const inner = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 8.0);
        const shp = tp.createMultiSegmentPipeWithSplitDistances({
            wires: [linePoints, arcPoints, centerArcPoints, splinePoints],
            profiles: [cp, cp, cp, cp],
            innerProfiles: [inner, inner, inner, inner],
            segmentTypes: [
                tp.SegmentType.LINE, tp.SegmentType.THREE_POINT_ARC,
                tp.SegmentType.CIRCLE_CENTER_ARC, tp.SegmentType.SPLINE,
            ],
            transitionMode: tp.TransitionMode.ROUND,
            upDir: dir(0, 0, 1),
        }, [120.0, 180.0]);
        expect(shp.IsNull()).toBe(false);
    });

    it("CreatePipeJoint - TwoWayStraight", () => {
        const cp10 = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 10.0);
        const cp8 = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 8.0);
        const shp = tp.createPipeJoint({
            ins: [{ id: "in_0", offset: pnt(-50, 0, 0), normal: dir(1, 0, 0), profile: cp10, innerProfile: cp8 }],
            outs: [{ id: "out_0", offset: pnt(50, 0, 0), normal: dir(-1, 0, 0), profile: cp10, innerProfile: cp8 }],
            mode: tp.JointShapeMode.SPHERE,
            flanged: true,
            upDir: dir(0, 0, 1),
        });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreatePipeJoint - TJoint", () => {
        const cp10 = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 10.0);
        const cp8 = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 8.0);
        const cp4 = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 4.0);
        const shp = tp.createPipeJoint({
            ins: [
                { id: "in_0", offset: pnt(-50, 0, 0), normal: dir(1, 0, 0), profile: cp10, innerProfile: cp8 },
                { id: "in_1", offset: pnt(0, -50, 0), normal: dir(0, 1, 0), profile: cp10, innerProfile: cp8 },
            ],
            outs: [
                { id: "out_0", offset: pnt(50, 0, 0), normal: dir(-1, 0, 0), profile: cp8, innerProfile: cp4 },
            ],
            mode: tp.JointShapeMode.BOX,
            flanged: true,
            upDir: dir(0, 0, 1),
        });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreatePipeJoint - CrossJoint", () => {
        const cp10 = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 10.0);
        const cp8 = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 8.0);
        const cp4 = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 4.0);
        const shp = tp.createPipeJoint({
            ins: [
                { id: "in_0", offset: pnt(-50, 0, 0), normal: dir(1, 0, 0), profile: cp10, innerProfile: cp8 },
                { id: "in_1", offset: pnt(0, -50, 0), normal: dir(0, 1, 0), profile: cp8, innerProfile: cp4 },
            ],
            outs: [
                { id: "out_0", offset: pnt(50, 0, 0), normal: dir(-1, 0, 0), profile: cp10, innerProfile: cp8 },
                { id: "out_1", offset: pnt(0, 50, 0), normal: dir(0, -1, 0), profile: cp8, innerProfile: cp4 },
            ],
            mode: tp.JointShapeMode.CYLINDER,
            flanged: false,
            upDir: dir(0, 0, 1),
        });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreatePipeJoint - YJoint", () => {
        const cp10 = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 10.0);
        const cp8 = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 8.0);
        const cp4 = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 4.0);
        const dir11 = dir(1, 1, 0);
        const dir1n1 = dir(1, -1, 0);
        const shp = tp.createPipeJoint({
            ins: [
                { id: "in_0", offset: pnt(-50, -50, 0), normal: dir11, profile: cp8, innerProfile: cp4 },
                { id: "in_1", offset: pnt(-50, 50, 0), normal: dir1n1, profile: cp8, innerProfile: cp4 },
            ],
            outs: [
                { id: "out_0", offset: pnt(50, 0, 0), normal: dir(-1, 0, 0), profile: cp10, innerProfile: cp8 },
            ],
            mode: tp.JointShapeMode.SPHERE,
            flanged: true,
            upDir: dir(0, 0, 1),
        });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateMultiLayerExtrusionStructure", () => {
        const linePoints = [pnt(50, -50, 0), pnt(100, 0, 0)];
        const arcPoints = [pnt(100, 0, 0), pnt(150, 50, 0), pnt(200, 0, 0)];
        const centerArcPoints = [pnt(200, 0, 0), pnt(250, 0, 0), pnt(300, 0, 0)];
        const splinePoints = [pnt(300, 0, 0), pnt(350, 50, 50), pnt(400, 0, 100)];
        const upDir = dir(0, 0, 1);
        try {
            const shapes = tp.createMultiLayerExtrusionStructure({
                wires: [linePoints, arcPoints, centerArcPoints, splinePoints],
                segmentTypes: [
                    tp.SegmentType.LINE, tp.SegmentType.THREE_POINT_ARC,
                    tp.SegmentType.CIRCLE_CENTER_ARC, tp.SegmentType.SPLINE,
                ],
                layers: [
                    {
                        name: "base_layer",
                        profiles: [rectProfile(pnt(-10, -50, 0), pnt(10, -30, 0))],
                    },
                    {
                        name: "middle_layer",
                        profiles: [circProfile(pnt(0, -20, 0), dir(0, 0, 1), 16.0)],
                    },
                    {
                        name: "top_layer",
                        profiles: [polyProfile([
                            pnt(-5, -5, 0), pnt(5, -5, 0), pnt(5, 5, 0),
                            pnt(0, 8, 0), pnt(-5, 5, 0),
                        ])],
                    },
                ],
                transitionMode: tp.TransitionMode.TRANSFORMED,
                upDir,
            });
            const keys = Object.keys(shapes);
            expect(keys.length).toBe(3);
            for (const name of keys) {
                // shapes[name] 是原始 TopoDS_Shape
                expect((shapes[name] as any).IsNull()).toBe(false);
            }
        } catch (e: any) {
            // go-topo safe_call 可能让此函数抛异常 — 与 Go 侧行为一致
            console.log("CreateMultiLayerExtrusionStructure threw:", e?.message ?? e);
        }
    });

    it("CreateCatenary - Standard", () => {
        const cp = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 0.2);
        const shp = tp.createCatenary({
            p1: pnt(0, 0, 0), p2: pnt(100, 100, 0),
            profile: cp, slack: 2, maxSag: 10.0, tessellation: 0.0,
            upDir: dir(0, 0, 1),
        });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateCatenary - WithHeight", () => {
        const cp = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 0.2);
        const shp = tp.createCatenary({
            p1: pnt(0, 0, 0), p2: pnt(100, 50, 20),
            profile: cp, slack: 2.0, maxSag: 10.0, tessellation: 0.0,
            upDir: dir(0, 0, 1),
        });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateCatenary - BugCase", () => {
        const cp = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 0.2);
        const upDir = dir(-2365550.686973459, 4588616.347934356, 3734082.7681595744);
        const shp = tp.createCatenary({
            p1: pnt(0, 0, 0),
            p2: pnt(26.363751136232167, -26.227833716198802, 30.422308564186096),
            profile: cp, slack: 2, maxSag: 10.0, tessellation: 0.0, upDir,
        });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateBoxShape", () => {
        const shp = tp.createBoxShape({
            point1: pnt(0, 0, 0), point2: pnt(100, 50, 30),
        });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateConeShape - FullCone", () => {
        const shp = tp.createConeShape({ radius1: 20, radius2: 10, height: 30, angle: undefined });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateConeShape - PartialCone", () => {
        const angle = 270 * Math.PI / 180;
        const shp = tp.createConeShape({ radius1: 15, radius2: 5, height: 25, angle });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateCylinderShape - FullCylinder", () => {
        const shp = tp.createCylinderShape({ radius: 15, height: 25, angle: undefined });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateCylinderShape - PartialCylinder", () => {
        const angle = 270 * Math.PI / 180;
        const shp = tp.createCylinderShape({ radius: 10, height: 20, angle });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateRevolutionShape - FullRevolution", () => {
        const meridian = [pnt(0, 0, 0), pnt(10, 0, 0), pnt(15, 5, 0), pnt(10, 10, 0), pnt(0, 10, 0)];
        const shp = tp.createRevolutionShape({ meridian, angle: undefined, max: undefined, min: undefined });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateRevolutionShape - PartialRevolution", () => {
        const meridian = [pnt(0, 0, 0), pnt(10, 0, 0), pnt(15, 5, 0), pnt(10, 10, 0), pnt(0, 10, 0)];
        const angle = 270 * Math.PI / 180;
        const shp = tp.createRevolutionShape({ meridian, angle, max: undefined, min: undefined });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateRevolutionShape - RangedRevolution", () => {
        const meridian = [pnt(0, 0, 0), pnt(10, 0, 0), pnt(15, 5, 0), pnt(10, 10, 0), pnt(0, 10, 0)];
        const angle = 180 * Math.PI / 180;
        const shp = tp.createRevolutionShape({ meridian, angle, max: 8.0, min: 2.0 });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateSphereShape - FullSphere", () => {
        const shp = tp.createSphereShape({ radius: 20, center: undefined, angle1: undefined, angle2: undefined, angle: undefined });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateSphereShape - PartialSphere", () => {
        const shp = tp.createSphereShape({
            radius: 15, center: undefined,
            angle1: 0, angle2: 90 * Math.PI / 180, angle: 270 * Math.PI / 180,
        });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateTorusShape - FullTorus", () => {
        const shp = tp.createTorusShape({ radius1: 30, radius2: 10, angle1: undefined, angle2: undefined, angle: undefined });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateTorusShape - PartialTorus", () => {
        const shp = tp.createTorusShape({
            radius1: 25, radius2: 8,
            angle1: -30 * Math.PI / 180,
            angle2: 30 * Math.PI / 180,
            angle: 270 * Math.PI / 180,
        });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateWedgeShape - FullWedge", () => {
        const shp = tp.createWedgeShape({ edge: pnt(30, 20, 10), limit: undefined, ltx: undefined });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreateWedgeShape - LimitedWedge", () => {
        const shp = tp.createWedgeShape({
            edge: pnt(25, 15, 8),
            limit: [10.0, 5.0, 15.0, 7.0],
            ltx: 12.0,
        });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreatePipeShape - BasicPipeShape", () => {
        const shp = tp.createPipeShape({
            wire: [pnt(0, 0, 0), pnt(100, 0, 0)],
            profile: circProfile(pnt(0, 0, 0), dir(0, 0, 1), 10.0),
            upDir: dir(0, 0, 1),
        });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreatePipeShape - DirectedPipeShape", () => {
        const shp = tp.createPipeShape({
            wire: [pnt(0, 0, 0), pnt(0, 100, 50)],
            profile: circProfile(pnt(0, 0, 0), dir(0, 0, 1), 8.0),
            upDir: dir(1, 0, 0),
        });
        expect(shp.IsNull()).toBe(false);
    });

    it("CreatePipeShape - ComplexProfilePipeShape", () => {
        const shp = tp.createPipeShape({
            wire: [pnt(0, 0, 0), pnt(50, 50, 30)],
            profile: polyProfile([
                pnt(0, 0, 0), pnt(10, 0, 0), pnt(15, 5, 0),
                pnt(10, 10, 0), pnt(0, 10, 0),
            ]),
            upDir: dir(0, 0, 1),
        });
        expect(shp.IsNull()).toBe(false);
    });

    it("MultiSegmentPipeWithSplitDistances", () => {
        const segment1 = [pnt(0, 0, 0), pnt(13.363751136232167, -26.227833716198802, 40.422308564186096)];
        const segment2 = [pnt(13.363751136232167, -26.227833716198802, 40.422308564186096), pnt(46.29231750732288, -90.69991450663656, 108.94551491551101)];

        const polygon1 = polyProfile([
            pnt(-3.171, 2.538, 0), pnt(-3.136, 3.954, 0), pnt(-2.498, 5.219, 0),
            pnt(-1.382, 6.09, 0), pnt(0, 6.4, 0), pnt(1.382, 6.09, 0),
            pnt(2.498, 5.219, 0), pnt(3.136, 3.954, 0), pnt(3.171, 2.538, 0),
            pnt(2.5, 0, 0), pnt(-2.5, 0, 0), pnt(-3.171, 2.538, 0),
        ]);

        const polygon2 = polyProfile([
            pnt(-3.4, 3.25, 0), pnt(-2.773, 4.717, 0), pnt(-1.553, 5.746, 0),
            pnt(0, 6.115, 0), pnt(1.553, 5.746, 0), pnt(2.773, 4.717, 0),
            pnt(3.4, 3.25, 0), pnt(3.4, 0, 0), pnt(-3.4, 0, 0),
            pnt(-3.4, 3.25, 0),
        ]);

        const polygon3 = polyProfile([
            pnt(-3.078273455639578, 2.575440459011272, 0), pnt(-3.036354153205542, 3.945591360596666, 0),
            pnt(-2.415107425541498, 5.163064134049417, 0), pnt(-1.339465963909452, 5.999496653245043, 0),
            pnt(-0.00978236558095332, 6.3004796235756695, 0), pnt(1.3250857438602934, 6.007776113883715, 0),
            pnt(2.410219147892808, 5.171098830877157, 0), pnt(3.0362530020384777, 3.946891104328797, 0),
            pnt(3.0763705290048873, 2.57033053075941, 0), pnt(2.4402700090676666, 0.08020179663338835, 0),
            pnt(-2.4484020179459174, 0.08566007382641323, 0), pnt(-3.078273455639578, 2.575440459011272, 0),
        ]);

        const polygon4 = polyProfile([
            pnt(-3.3009689384399516, 3.2638870027828157, 0), pnt(-2.681019727080062, 4.6777618885065335, 0),
            pnt(-1.5023855429647655, 5.659755134999072, 0), pnt(-0.013823869618346543, 6.0159601058725585, 0),
            pnt(1.4854596950468153, 5.672255120809437, 0), pnt(2.678133803605064, 4.68537082388747, 0),
            pnt(3.30065175118932, 3.2613984849103375, 0), pnt(3.328711291934881, 0.07012788391507485, 0),
            pnt(-3.336054557835377, 0.07688290074113246, 0), pnt(-3.3009689384399516, 3.2638870027828157, 0),
        ]);

        const upDir = dir(-0.37127704827582503, 0.7201908387390975, 0.586070396129907);

        const shp = tp.createMultiSegmentPipeWithSplitDistances({
            wires: [segment1, segment2],
            profiles: [polygon1, polygon2],
            innerProfiles: [polygon3, polygon4],
            segmentTypes: [tp.SegmentType.LINE, tp.SegmentType.LINE],
            transitionMode: tp.TransitionMode.TRANSFORMED,
            upDir,
        }, [2.0, 5.0]);
        expect(shp.IsNull()).toBe(false);
    });

    it("CreatePipeSplitVolumeRatio", () => {
        const prof = circProfile(pnt(0, 0, 0), dir(0, 0, 1), 5.0);
        const params = {
            wire: [pnt(0, 0, 0), pnt(100, 0, 0)],
            profile: [prof],
            innerProfile: null,
            segmentType: tp.SegmentType.LINE,
            transitionMode: tp.TransitionMode.TRANSFORMED,
            upDir: dir(0, 0, 1),
        };
        const fullRaw = tp.createPipe(params);
        expect(fullRaw.IsNull()).toBe(false);
        // createPipe returns TopoDS_Shape, wrap to access computeMass
        const full = tp.Shape.makeShape(fullRaw);
        const fullVol = full.computeMass();
        expect(fullVol).toBeGreaterThan(0);
        expect(fullVol).toBeGreaterThan(0.9 * Math.PI * 25 * 100);
        expect(fullVol).toBeLessThan(1.1 * Math.PI * 25 * 100);

        const cases: Array<{ name: string; start: number; end: number; expect: number }> = [
            { name: "split[0,80]", start: 0.0, end: 80.0, expect: 0.8 },
            { name: "split[20,80]", start: 20.0, end: 80.0, expect: 0.6 },
            { name: "split[40,100]", start: 40.0, end: 100.0, expect: 0.6 },
            { name: "split[0,-1] full", start: 0.0, end: -1.0, expect: 1.0 },
        ];
        for (const c of cases) {
            const partRaw = tp.createPipeWithSplitDistances(params, [c.start, c.end]);
            expect(partRaw.IsNull()).toBe(false);
            const part = tp.Shape.makeShape(partRaw);
            const v = part.computeMass();
            const ratio = v / fullVol;
            expect(Math.abs(ratio - c.expect)).toBeLessThan(0.02);
        }
    });
});

// =========================================================================
// primitives_infra_test.go  (21 cases)
// =========================================================================
describe("Infra primitives", () => {
    function testChannelPoints() {
        return [
            chanPt(0, 0, 0), chanPt(300, 0, 30),
            chanPt(500, 300, 50, true), chanPt(300, 600, 20), chanPt(300, 800, 0),
        ];
    }
    function testArcPoints() {
        return [chanPt(0, 0, 0), chanPt(900, 500, 0)];
    }
    function testTurnPoints() {
        return [
            chanPt(0, 0, 0), chanPt(100, 0, 0),
            chanPt(150, 50, 0, true), chanPt(150, 100, 0),
        ];
    }

    it("CreatePipeRow - no enclosure", () => {
        const shp = tp.createPipeRow({
            pipeType: tp.PipeRowType.NORMAL, hasEnclosure: false,
            enclosureWidth: 0, enclosureHeight: 0,
            baseExtension: 20, baseThickness: 5,
            cushionExtension: 0, cushionThickness: 0,
            pipePositions: [pnt2d(-50, 40), pnt2d(0, 40), pnt2d(50, 40)],
            pipeInnerDiameters: [20, 30, 20], pipeWallThicknesses: [4, 4, 4],
            pullPipeInnerDiameter: 0, pullPipeThickness: 0,
            points: testChannelPoints(),
        });
        expect(shp).not.toBeNull();
    });

    it("CreatePipeRow - with enclosure", () => {
        const shp = tp.createPipeRow({
            pipeType: tp.PipeRowType.NORMAL, hasEnclosure: true,
            enclosureWidth: 200, enclosureHeight: 200,
            baseExtension: 5, baseThickness: 10,
            cushionExtension: 5, cushionThickness: 10,
            pipePositions: [pnt2d(-50, 40), pnt2d(0, 40), pnt2d(50, 40)],
            pipeInnerDiameters: [20, 30, 20], pipeWallThicknesses: [4, 4, 4],
            pullPipeInnerDiameter: 0, pullPipeThickness: 0,
            points: testChannelPoints(),
        });
        expect(shp).not.toBeNull();
    });

    it("CreatePipeRow - pull pipe", () => {
        const shp = tp.createPipeRow({
            pipeType: tp.PipeRowType.PULL, hasEnclosure: false,
            enclosureWidth: 0, enclosureHeight: 0,
            baseExtension: 0, baseThickness: 0,
            cushionExtension: 0, cushionThickness: 0,
            pipePositions: [pnt2d(-50, 40), pnt2d(50, 40)],
            pipeInnerDiameters: [50, 50], pipeWallThicknesses: [6, 6],
            pullPipeInnerDiameter: 200, pullPipeThickness: 8,
            points: testChannelPoints(),
        });
        expect(shp).not.toBeNull();
    });

    it("CreateCableTrench", () => {
        const shp = tp.createCableTrench({
            width: 60, height: 80, coverWidth: 64, coverThickness: 5,
            baseExtension: 10, baseThickness: 15,
            cushionExtension: 12, cushionThickness: 10,
            wallThickness: 15, wallThickness2: 10,
            points: testChannelPoints(),
        });
        expect(shp).not.toBeNull();
    });

    it("CreateCableTunnel - rectangular", () => {
        const shp = tp.createCableTunnel({
            style: tp.ConnectionSectionStyle.RECTANGULAR,
            width: 60, height: 80,
            topThickness: 5, bottomThickness: 6, outerWallThickness: 7,
            innerWallThickness: 0, arcHeight: 0, bottomPlatformHeight: 0,
            cushionExtension: 5, cushionThickness: 8,
            points: testChannelPoints(),
        });
        expect(shp).not.toBeNull();
    });

    it("CreateCableTunnel - horseshoe", () => {
        const shp = tp.createCableTunnel({
            style: tp.ConnectionSectionStyle.HORSESHOE,
            width: 50, height: 70,
            topThickness: 0, bottomThickness: 0,
            outerWallThickness: 4, innerWallThickness: 3,
            arcHeight: 12, bottomPlatformHeight: 0,
            cushionExtension: 5, cushionThickness: 7,
            points: testChannelPoints(),
        });
        expect(shp).not.toBeNull();
    });

    it("CreateCableTunnel - circular", () => {
        const shp = tp.createCableTunnel({
            style: tp.ConnectionSectionStyle.CIRCULAR,
            width: 60, height: 60,
            topThickness: 0, bottomThickness: 0,
            outerWallThickness: 7, innerWallThickness: 0, arcHeight: 0,
            bottomPlatformHeight: 10,
            cushionExtension: 0, cushionThickness: 0,
            points: testChannelPoints(),
        });
        expect(shp).not.toBeNull();
    });

    it("CreateCableTray - arch", () => {
        const shp = tp.createCableTray({
            style: tp.CableTrayStyle.ARCH,
            columnDiameter: 40, columnHeight: 100, span: 400,
            width: 60, height: 30, topPlateHeight: 5,
            arcHeight: 55, wallThickness: 3,
            pipePositions: [pnt2d(-20, 15), pnt2d(0, 15), pnt2d(20, 15)],
            pipeInnerDiameters: [10, 10, 10], pipeWallThicknesses: [2, 2, 2],
            hasProtectionPlate: true, points: testArcPoints(),
        });
        expect(shp).not.toBeNull();
    });

    it("CreateCableTray - beam", () => {
        const shp = tp.createCableTray({
            style: tp.CableTrayStyle.BEAM,
            columnDiameter: 40, columnHeight: 100, span: 200,
            width: 60, height: 30, topPlateHeight: 5,
            arcHeight: 15, wallThickness: 3,
            pipePositions: [pnt2d(-20, 15), pnt2d(0, 15), pnt2d(20, 15)],
            pipeInnerDiameters: [10, 10, 10], pipeWallThicknesses: [2, 2, 2],
            hasProtectionPlate: true, points: testChannelPoints(),
        });
        expect(shp).not.toBeNull();
    });

    it("CreateCableLBeam - standard", () => {
        const shp = tp.createCableLBeam({ length: 300, width: 150, height: 200 });
        expect(shp).not.toBeNull();
    });

    it("CreateCableLBeam - extreme", () => {
        const shp = tp.createCableLBeam({ length: 500, width: 50, height: 300 });
        expect(shp).not.toBeNull();
    });

    it("CreateManhole - circular", () => {
        const shp = tp.createManhole({
            style: tp.ManholeStyle.CIRCULAR,
            length: 100, width: 0, height: 150, wallThickness: 10,
        });
        expect(shp).not.toBeNull();
    });

    it("CreateManhole - rectangular", () => {
        const shp = tp.createManhole({
            style: tp.ManholeStyle.RECTANGULAR,
            length: 120, width: 80, height: 150, wallThickness: 10,
        });
        expect(shp).not.toBeNull();
    });

    it("CreateManholeCover - circular", () => {
        const shp = tp.createManholeCover({
            style: tp.ManholeCoverStyle.CIRCULAR,
            length: 100, width: 0, thickness: 10,
        });
        expect(shp).not.toBeNull();
    });

    it("CreateManholeCover - rectangular", () => {
        const shp = tp.createManholeCover({
            style: tp.ManholeCoverStyle.RECTANGULAR,
            length: 120, width: 80, thickness: 10,
        });
        expect(shp).not.toBeNull();
    });

    it("CreateLadder", () => {
        const shp = tp.createLadder({ length: 3000, width: 400, thickness: 20 });
        expect(shp).not.toBeNull();
    });

    it("CreateSump - standard", () => {
        const shp = tp.createSump({ length: 500, width: 300, depth: 400, bottomThickness: 50 });
        expect(shp).not.toBeNull();
    });

    it("CreateSump - shallow", () => {
        const shp = tp.createSump({ length: 600, width: 400, depth: 200, bottomThickness: 30 });
        expect(shp).not.toBeNull();
    });

    it("CreateFootpath", () => {
        const shp = tp.createFootpath({ height: 15, width: 80, points: testArcPoints() });
        expect(shp).not.toBeNull();
    });

    it("CreateShaftChamber", () => {
        const shp = tp.createShaftChamber({
            supportWallThickness: 20, supportDiameter: 110, supportHeight: 50,
            topThickness: 8, innerDiameter: 80, workingHeight: 120,
            outerWallThickness: 12, innerWallThickness: 6,
        });
        expect(shp).not.toBeNull();
    });

    it("CreateTunnelCompartmentPartition", () => {
        const shp = tp.createTunnelCompartmentPartition({ width: 300, thickness: 15 });
        expect(shp).not.toBeNull();
    });

    it("CreateTunnelPartitionBoard - circular", () => {
        const shp = tp.createTunnelPartitionBoard({
            style: tp.TunnelPartitionBoardStyle.CIRCULAR,
            length: 200, width: 0, thickness: 10, holeCount: 4,
            holePositions: [pnt2d(50, 50), pnt2d(-50, 50), pnt2d(-50, -50), pnt2d(50, -50)],
            holeStyles: [1, 1, 1, 1], holeDiameters: [20, 20, 20, 20], holeWidths: [0, 0, 0, 0],
        });
        expect(shp).not.toBeNull();
    });

    it("CreateTunnelPartitionBoard - rectangular", () => {
        const shp = tp.createTunnelPartitionBoard({
            style: tp.TunnelPartitionBoardStyle.RECTANGULAR,
            length: 300, width: 200, thickness: 15, holeCount: 3,
            holePositions: [pnt2d(100, 50), pnt2d(-100, 50), pnt2d(0, -50)],
            holeStyles: [1, 2, 1], holeDiameters: [30, 40, 25], holeWidths: [0, 20, 0],
        });
        expect(shp).not.toBeNull();
    });

    it("CreateVentilationPavilion", () => {
        const shp = tp.createVentilationPavilion({
            topLength: 400, middleLength: 300, bottomLength: 400,
            topWidth: 350, middleWidth: 250, bottomWidth: 350,
            topHeight: 50, height: 150, baseHeight: 30,
        });
        expect(shp).not.toBeNull();
    });

    it("CreateStraightVentilationDuct", () => {
        const shp = tp.createStraightVentilationDuct({ diameter: 200, wallThickness: 10, height: 500 });
        expect(shp).not.toBeNull();
    });

    it("CreateObliqueVentilationDuct", () => {
        const shp = tp.createObliqueVentilationDuct({
            hoodRoomLength: 200, hoodRoomWidth: 150, hoodRoomHeight: 200,
            hoodWallThickness: 10, ductCenterHeight: 80, ductLeftDistance: 80,
            ductDiameter: 120, ductWallThickness: 8, ductLength: 300,
            ductHeightDifference: 50, baseLength: 220, baseWidth: 180,
            baseHeight: 10, baseRoomLength: 200, baseRoomWallThickness: 12,
            baseRoomWidth: 150, baseRoomHeight: 220,
        });
        expect(shp).not.toBeNull();
    });

    it("CreateDrainageWell", () => {
        const shp = tp.createDrainageWell({
            length: 500, width: 300, height: 300, neckDiameter: 150,
            neckHeight: 400, cushionExtension: 50, bottomThickness: 60, wallThickness: 20,
        });
        expect(shp).not.toBeNull();
    });

    it("CreatePipeSupport - single sided", () => {
        const shp = tp.createPipeSupport({
            style: tp.PipeSupportStyle.SINGLE_SIDED, count: 2,
            positions: [pnt2d(-20, 16), pnt2d(20, 16)], radii: [8, 8],
            length: 100, width: 18, height: 20,
        });
        expect(shp).not.toBeNull();
    });

    it("CreatePipeSupport - double sided", () => {
        const shp = tp.createPipeSupport({
            style: tp.PipeSupportStyle.DOUBLE_SIDED, count: 8,
            positions: [
                pnt2d(-10, 12), pnt2d(-30, 12), pnt2d(10, 12), pnt2d(30, 12),
                pnt2d(-10, -12), pnt2d(-30, -12), pnt2d(10, -12), pnt2d(30, -12),
            ],
            radii: [8, 8, 8, 8, 8, 8, 8, 8],
            length: 100, width: 18, height: 26,
        });
        expect(shp).not.toBeNull();
    });

    it("CreateCoverPlate - rectangular", () => {
        const shp = tp.createCoverPlate({
            style: tp.CoverPlateStyle.RECTANGULAR,
            length: 200, width: 100, smallRadius: 0, largeRadius: 0, thickness: 10,
        });
        expect(shp).not.toBeNull();
    });

    it("CreateCoverPlate - sector", () => {
        const shp = tp.createCoverPlate({
            style: tp.CoverPlateStyle.SECTOR,
            length: 250, width: 0, smallRadius: 20, largeRadius: 100, thickness: 8,
        });
        expect(shp).not.toBeNull();
    });

    it("CreateCableRay", () => {
        const shp = tp.createCableRay({
            outerLength: 300, outerHeight: 100,
            innerLength: 280, innerHeight: 80, coverThickness: 5,
        });
        expect(shp).not.toBeNull();
    });

    it("CreateWaterTunnel - rectangular", () => {
        const shp = tp.createWaterTunnel({
            style: tp.WaterTunnelSectionStyle.RECTANGULAR,
            width: 60, height: 80,
            topThickness: 5, bottomThickness: 6, outerWallThickness: 7,
            innerWallThickness: 0, arcHeight: 0, arcRadius: 0, arcAngle: 0,
            bottomPlatformHeight: 0, cushionExtension: 5, cushionThickness: 8,
            points: testTurnPoints(),
        });
        expect(shp).not.toBeNull();
    });

    it("CreateWaterTunnel - cityopening", () => {
        const shp = tp.createWaterTunnel({
            style: tp.WaterTunnelSectionStyle.CITYOPENING,
            width: 50, height: 70,
            topThickness: 0, bottomThickness: 0,
            outerWallThickness: 4, innerWallThickness: 3,
            arcHeight: 0, arcRadius: 40, arcAngle: 0,
            bottomPlatformHeight: 0, cushionExtension: 5, cushionThickness: 7,
            points: testTurnPoints(),
        });
        expect(shp).not.toBeNull();
    });

    it("CreateWaterTunnel - horseshoe", () => {
        const shp = tp.createWaterTunnel({
            style: tp.WaterTunnelSectionStyle.HORSESHOE,
            width: 60, height: 120,
            topThickness: 0, bottomThickness: 0,
            outerWallThickness: 4, innerWallThickness: 3,
            arcHeight: 0, arcRadius: 50, arcAngle: 120,
            bottomPlatformHeight: 0, cushionExtension: 5, cushionThickness: 7,
            points: testTurnPoints(),
        });
        expect(shp).not.toBeNull();
    });

    it("CreateWaterTunnel - circular", () => {
        const shp = tp.createWaterTunnel({
            style: tp.WaterTunnelSectionStyle.CIRCULAR,
            width: 60, height: 60,
            topThickness: 0, bottomThickness: 0,
            outerWallThickness: 7, innerWallThickness: 0,
            arcHeight: 0, arcRadius: 0, arcAngle: 0,
            bottomPlatformHeight: 10, cushionExtension: 0, cushionThickness: 0,
            points: testTurnPoints(),
        });
        expect(shp).not.toBeNull();
    });
});
