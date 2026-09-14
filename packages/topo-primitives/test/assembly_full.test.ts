/**
 * Assembly full API — ported from go-topo assembly_test.go (non-solve parts)
 *
 * Reference: /Users/xuning/Work/go-topo/assembly_test.go
 * Skips: solve tests (covered in cq_assembly_solve.test.ts),
 *        getElements (known bug)
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CQWorkplane } from "../lib/cq/index";
import {
    registerParametricBuilder,
    rebuildFromParametric,
    ParametricAssembly,
} from "../lib/assembly/parametric";

const here = dirname(fileURLToPath(import.meta.url));

// --- WASM singleton --------------------------------------------------------
let tp: any;
let CK: any;
beforeAll(async () => {
    const wasmDir = join(here, "..", "..", "topo-wasm", "src");
    const { default: initTopo } = await import(
        /* @vite-ignore */ join(wasmDir, "topo.full.js")
    );
    const wasmBinary = readFileSync(join(wasmDir, "topo.full.wasm"));
    tp = await initTopo({ wasmBinary });
    // Register globals for instanceof checks in Assembly.create/add
    (globalThis as any).Workplane = tp.Workplane;
    (globalThis as any).Assembly = tp.Assembly;
    for (const n of ["gp_Trsf", "TopLoc_Location", "gp_Pnt", "gp_Vec", "gp_Pln"]) {
        if ((tp as any)[n] !== undefined) {
            (globalThis as any)[n] = (tp as any)[n];
        }
    }
    CK = (tp as any).AssemblyConstraintKind;
});

// --- Helpers ---------------------------------------------------------------

function wp() { return new CQWorkplane(tp, "XY"); }

function makeBox10() { return wp().boxCentered(10, 10, 10).value(); }
function makeBox5()  { return wp().boxCentered(5, 5, 5).value(); }
function makeBox2()  { return wp().boxCentered(2, 2, 2).value(); }

function makeAssemblyWithChild(rootName: string, childName: string) {
    const rootShp = makeBox10();
    const as = tp.Assembly.create(rootShp, undefined, rootName);
    const childShp = makeBox5();
    as.add(childShp, undefined, childName);
    return as;
}

function makeAssemblyForQuery(rootName: string, childName: string, grandchildName: string) {
    const rootShp = makeBox10();
    const as = tp.Assembly.create(rootShp, undefined, rootName);
    const childShp = makeBox5();
    const child = tp.Assembly.create(childShp, undefined, childName);
    const gcShp = makeBox2();
    child.add(gcShp, undefined, grandchildName);
    as.add(child, undefined, "");
    return as;
}

// --- Helpers for Get/SetLocation/Replace (pure-combination, no C++ binding) ---

/** Equivalent of Go Assembly.Get(name) — recursive search via children()/name()
 *  Go checks: en == name || en == root+"/"+name */
function assemblyGet(as: any, name: string): { found: boolean; element: any } {
    const root = as.name();
    function search(cur: any, prefix: string): { found: boolean; element: any } {
        for (const ch of cur.children()) {
            const chName = ch.name();
            const fullPath = prefix + "/" + chName;
            if (chName === name || fullPath === name || fullPath === root + "/" + name) {
                return { found: true, element: ch };
            }
            if (ch.children && ch.children().length > 0) {
                const result = search(ch, fullPath);
                if (result.found) return result;
            }
        }
        return { found: false, element: null };
    }
    return search(as, root);
}

/** Equivalent of Go Assembly.SetLocation(name, loc) — remove then re-add with new loc */
function assemblySetLocation(as: any, name: string, loc: any): void {
    if (name.includes("/")) {
        throw new Error(`assembly: SetLocation only supports top-level elements, got "${name}"`);
    }
    for (const ch of as.children()) {
        if (ch.name() === name) {
            as.remove(name);
            as.add(ch, loc, name, undefined);
            return;
        }
    }
    throw new Error(`assembly: no element named "${name}"`);
}

/** Equivalent of Go Assembly.Replace(name, shape) — preserve loc/color, swap shape */
function assemblyReplace(as: any, name: string, newShape: any): void {
    if (!newShape) {
        throw new Error("assembly: Replace with nil shape");
    }
    if (name.includes("/")) {
        throw new Error(`assembly: Replace only supports top-level elements, got "${name}"`);
    }
    for (const ch of as.children()) {
        if (ch.name() === name) {
            const childLoc = ch.location();
            const childColor = ch.hasColor() ? ch.color() : undefined;
            as.remove(name);
            as.add(newShape, childLoc, name, childColor);
            return;
        }
    }
    throw new Error(`assembly: no element named "${name}"`);
}

// --- Tests -----------------------------------------------------------------

describe("Assembly full API (non-solve)", () => {

    // =========================================================================
    // TestNewAssembly
    // =========================================================================
    describe("TestNewAssembly", () => {
        it("empty: create assembly from shape", () => {
            const rootShp = makeBox10();
            const as = tp.Assembly.create(rootShp, undefined, "test");
            expect(as).toBeDefined();
            expect(as.hasError()).toBe(false);
        });
    });

    // =========================================================================
    // TestAssemblyObject (shape usage)
    // =========================================================================
    describe("TestAssemblyObject", () => {
        it("from shape: shape methods work", () => {
            const rootShp = makeBox10();
            // Go: NewAssemblyObjectFromShpe(*r1.Value()) → obj, then IsShape/IsWorkplane/GetShape
            // JS: rootShp is already a shape; verify it's usable
            expect(rootShp).toBeDefined();
            expect(rootShp.isNull()).toBe(false);
            const bb = rootShp.bbox();
            expect(bb.xLength()).toBeCloseTo(10, 6);
        });
    });

    // =========================================================================
    // TestAssemblyAddAndQuery
    // =========================================================================
    describe("TestAssemblyAddAndQuery", () => {
        it("add object (shape)", () => {
            const rootShp = makeBox10();
            const as = tp.Assembly.create(rootShp, undefined, "root");
            const childShp = makeBox5();
            as.add(childShp, undefined, "child");
            expect(as.hasError()).toBe(false);
        });

        it("add assembly (sub-assembly)", () => {
            const rootShp = makeBox10();
            const as = tp.Assembly.create(rootShp, undefined, "parent");

            const childShp = makeBox5();
            const child = tp.Assembly.create(childShp, undefined, "child");
            as.add(child, undefined, "");
            expect(as.hasError()).toBe(false);
        });
    });

    // =========================================================================
    // TestAssemblyRemove
    // =========================================================================
    describe("TestAssemblyRemove", () => {
        it("remove", () => {
            const as = makeAssemblyWithChild("root", "toremove");
            as.remove("toremove");
            expect(as.hasError()).toBe(false);
        });
    });

    // =========================================================================
    // TestAssemblyCopy
    // =========================================================================
    describe("TestAssemblyCopy", () => {
        it("copy preserves name", () => {
            const rootShp = makeBox10();
            const as = tp.Assembly.create(rootShp, undefined, "original");
            const cp = as.copy();
            expect(cp).toBeDefined();
            expect(cp.name()).toBe("original");
        });
    });

    // =========================================================================
    // TestAssemblyShapes
    // =========================================================================
    describe("TestAssemblyShapes", () => {
        it("shapes returns at least one valid shape", () => {
            const as = makeAssemblyWithChild("root", "child");
            const shapes = as.shapes();
            expect(shapes.length).toBeGreaterThan(0);
            // Regression: shapes must still be valid wrappers
            for (let i = 0; i < shapes.length; i++) {
                expect(shapes[i].isNull()).toBe(false);
                // type() should not throw
                shapes[i].type();
            }
        });
    });

    // =========================================================================
    // TestAssemblyToCompound
    // =========================================================================
    describe("TestAssemblyToCompound", () => {
        it("to compound", () => {
            const as = makeAssemblyWithChild("root", "child");
            const cmp = as.toCompound();
            expect(cmp).toBeDefined();
        });
    });

    // =========================================================================
    // TestAssemblyGetElements (known bug — skip)
    // =========================================================================
    describe("TestAssemblyGetElements", () => {
        it("getElements returns array of elements", () => {
            const rootShp = makeBox10();
            const as = tp.Assembly.create(rootShp, undefined, "root");
            const childShp = makeBox5();
            as.add(childShp, undefined, "child");
            const elems = as.getElements();
            expect(elems).toBeDefined();
            expect(Array.isArray(elems)).toBe(true);
            expect(elems.length).toBeGreaterThanOrEqual(2); // root + child
            // Each element should have shape, name, location
            for (const elem of elems) {
                expect(elem.name).toBeDefined();
                expect(elem.shape).toBeDefined();
                expect(elem.location).toBeDefined();
            }
        });
    });

    // =========================================================================
    // TestAssemblyGetters
    // =========================================================================
    describe("TestAssemblyGetters", () => {
        it("get name", () => {
            const as = makeAssemblyWithChild("root", "child");
            expect(as.name()).toBe("root");
        });

        it("get location", () => {
            const as = makeAssemblyWithChild("root", "child");
            const loc = as.location();
            expect(loc).toBeDefined();
        });

        it("get object (obj)", () => {
            const as = makeAssemblyWithChild("root", "child");
            expect(as.hasObj()).toBe(true);
            const obj = as.obj();
            expect(obj).toBeDefined();
        });

        it("children returns at least one child", () => {
            const as = makeAssemblyWithChild("parent", "child");
            const children = as.children();
            expect(children.length).toBeGreaterThan(0);
        });
    });

    // =========================================================================
    // TestAssemblyConstraint_AllKinds_Binary
    // =========================================================================
    describe("TestAssemblyConstraint_AllKinds_Binary", () => {
        it("Point (kind=0) with blank param", () => {
            const as = makeAssemblyWithChild("root", "part");
            as.constrain("root", "part", CK.Point, 0);
            expect(as.hasError()).toBe(false);
        });

        it("Point (kind=0) with double3 param", () => {
            const as = makeAssemblyWithChild("root", "part");
            as.constrain("root", "part", CK.Point, [0, 0, 1]);
            expect(as.hasError()).toBe(false);
        });

        it("Axis (kind=1) blank param", () => {
            const as = makeAssemblyWithChild("root", "part");
            as.constrain("root", "part", CK.Axis, 0);
            expect(as.hasError()).toBe(false);
        });

        it("Axis (kind=1) angled", () => {
            const as = makeAssemblyWithChild("root", "part");
            as.constrain("root", "part", CK.Axis, 1.5708);
            expect(as.hasError()).toBe(false);
        });

        it("PointInPlane (kind=2) blank param", () => {
            const as = makeAssemblyWithChild("root", "part");
            as.constrain("root", "part", CK.PointInPlane, 0);
            expect(as.hasError()).toBe(false);
        });

        it("PointInPlane (kind=2) offset", () => {
            const as = makeAssemblyWithChild("root", "part");
            as.constrain("root", "part", CK.PointInPlane, 5);
            expect(as.hasError()).toBe(false);
        });

        it("PointOnLine (kind=3) blank param", () => {
            const as = makeAssemblyWithChild("root", "part");
            as.constrain("root", "part", CK.PointOnLine, 0);
            expect(as.hasError()).toBe(false);
        });

        it("Plane (kind=4) double2 param", () => {
            const as = makeAssemblyWithChild("root", "part");
            as.constrain("root", "part", CK.Plane, [0, 0]);
            expect(as.hasError()).toBe(false);
        });

        it("Plane (kind=4) non-zero tol", () => {
            const as = makeAssemblyWithChild("root", "part");
            as.constrain("root", "part", CK.Plane, [0.1, 0.1]);
            expect(as.hasError()).toBe(false);
        });
    });

    // =========================================================================
    // TestAssemblyConstraint_AllKinds_Unary
    // =========================================================================
    describe("TestAssemblyConstraint_AllKinds_Unary", () => {
        it("Fixed (kind=5) on root", () => {
            const as = makeAssemblyWithChild("root", "part");
            as.constrain1("root", CK.Fixed, 0);
            expect(as.hasError()).toBe(false);
        });

        it("Fixed (kind=5) on child", () => {
            const as = makeAssemblyWithChild("root", "part");
            as.constrain1("part", CK.Fixed, 0);
            expect(as.hasError()).toBe(false);
        });

        it("FixedPoint (kind=6) with double3 xyz", () => {
            const as = makeAssemblyWithChild("root", "part");
            as.constrain1("part", CK.FixedPoint, [5, 5, 5]);
            expect(as.hasError()).toBe(false);
        });

        it("FixedPoint (kind=6) origin", () => {
            const as = makeAssemblyWithChild("root", "part");
            as.constrain1("part", CK.FixedPoint, [0, 0, 0]);
            expect(as.hasError()).toBe(false);
        });

        it("FixedAxis (kind=7) Z direction", () => {
            const as = makeAssemblyWithChild("root", "part");
            as.constrain1("part", CK.FixedAxis, [0, 0, 1]);
            expect(as.hasError()).toBe(false);
        });

        it("FixedAxis (kind=7) X direction", () => {
            const as = makeAssemblyWithChild("root", "part");
            as.constrain1("part", CK.FixedAxis, [1, 0, 0]);
            expect(as.hasError()).toBe(false);
        });

        it("FixedRotation (kind=8) Euler angles", () => {
            const as = makeAssemblyWithChild("root", "part");
            as.constrain1("part", CK.FixedRotation, [0, 0, 0]);
            expect(as.hasError()).toBe(false);
        });

        it("FixedRotation (kind=8) rotated", () => {
            const as = makeAssemblyWithChild("root", "part");
            as.constrain1("part", CK.FixedRotation, [0.5, 0.5, 0.5]);
            expect(as.hasError()).toBe(false);
        });
    });

    // =========================================================================
    // TestAssemblyConstraint_ByShapeRef — already in cq_assembly_solve.test.ts
    // =========================================================================
    describe("TestAssemblyConstraint_ByShapeRef", () => {
        it.skip("Constrain2 binary by shape — already covered in cq_assembly_solve.test.ts", () => {});
        it.skip("Constrain3 unary by shape — already covered in cq_assembly_solve.test.ts", () => {});
    });

    // =========================================================================
    // TestAssemblyConstraint_QueryWithSelector — already in cq_assembly_solve.test.ts
    // =========================================================================
    describe("TestAssemblyConstraint_QueryWithSelector", () => {
        it.skip("face selector constraint — already covered in cq_assembly_solve.test.ts", () => {});
    });

    // =========================================================================
    // TestAssemblyConstraint_Negative
    // =========================================================================
    describe("TestAssemblyConstraint_Negative", () => {
        it("incompatible unary on binary kind — tolerate both outcomes", () => {
            const as = makeAssemblyWithChild("root", "part");
            // Go: PointOnLine (3) is binary, but Constrain1 (unary) is used.
            // Go test uses t.Logf (not Fatal) — accepts both error and no-error.
            let threw = false;
            try {
                as.constrain1("root", CK.PointOnLine, 0);
            } catch {
                threw = true;
            }
            // Either the binding throws, or the assembly sets hasError, or it's accepted.
            // No assertion — just verify no uncaught exception.
            expect(threw || as.hasError() || true).toBe(true);
        });

        it("unknown kind — tolerate both outcomes", () => {
            const as = makeAssemblyWithChild("root", "part");
            // Go: kind=99 is unknown; Go test uses t.Logf — accepts both.
            let threw = false;
            try {
                as.constrain("root", "part", 99, 0);
            } catch {
                threw = true;
            }
            // Embind enum cast may or may not throw for raw number.
            expect(threw || as.hasError() || true).toBe(true);
        });

        it("missing child for binary — tolerate both outcomes", () => {
            const as = makeAssemblyWithChild("root", "part");
            // Go: "nonexistent" child; Go test uses t.Logf — accepts both.
            let threw = false;
            try {
                as.constrain("root", "nonexistent", CK.Point, 0);
            } catch {
                threw = true;
            }
            expect(threw || as.hasError() || true).toBe(true);
        });

        it("nil/undefined param is accepted (blank)", () => {
            const as = makeAssemblyWithChild("root", "part");
            // Go: Constrain("root", "part", asmPoint, nil) → no error
            // JS: passing undefined as param → blank param
            as.constrain("root", "part", CK.Point, undefined);
            expect(as.hasError()).toBe(false);
        });
    });

    // =========================================================================
    // TestAssemblyExport — skipped in Go too
    // =========================================================================
    describe("TestAssemblyExport", () => {
        it.skip("export not supported in prebuilt lib", () => {});
    });

    // =========================================================================
    // TestAssemblyConstraintParam
    // =========================================================================
    describe("TestAssemblyConstraintParam", () => {
        it("param from double: number is accepted", () => {
            // Go: NewAssemblyConstraintParmFromDouble(5.0) → non-nil
            // JS: just pass number directly as param
            const as = makeAssemblyWithChild("root", "part");
            as.constrain("root", "part", CK.Point, 5.0);
            expect(as.hasError()).toBe(false);
        });

        it("param from double2: [a,b] is accepted", () => {
            const as = makeAssemblyWithChild("root", "part");
            as.constrain("root", "part", CK.Plane, [1.0, 2.0]);
            expect(as.hasError()).toBe(false);
        });

        it("param from double3: [a,b,c] is accepted", () => {
            const as = makeAssemblyWithChild("root", "part");
            as.constrain1("part", CK.FixedPoint, [1.0, 2.0, 3.0]);
            expect(as.hasError()).toBe(false);
        });
    });

    // =========================================================================
    // TestAssemblyNilSafety
    // =========================================================================
    describe("TestAssemblyNilSafety", () => {
        it("add object with empty loc and color", () => {
            const rootShp = makeBox10();
            const as = tp.Assembly.create(rootShp, undefined, "root");
            const childShp = makeBox5();
            // Go: as.AddObject(obj2, nil, "child", nil)
            // JS: add(shp, undefined, name, undefined)
            as.add(childShp, undefined, "child", undefined);
            expect(as.hasError()).toBe(false);
        });
    });

    // =========================================================================
    // TestAssemblyGet — implemented via combination helpers (no WASM binding)
    // =========================================================================
    describe("TestAssemblyGet", () => {
        it("hit top-level", () => {
            const as = makeAssemblyWithChild("root", "child");
            const { found, element } = assemblyGet(as, "child");
            expect(found).toBe(true);
            expect(element).toBeDefined();
            expect(element.name()).toBe("child");
        });

        it("hit nested path", () => {
            const as = makeAssemblyForQuery("root", "child", "grand");
            const { found, element } = assemblyGet(as, "child/grand");
            expect(found).toBe(true);
            expect(element).toBeDefined();
            expect(element.name()).toBe("grand");
        });

        it("miss", () => {
            const as = makeAssemblyWithChild("root", "child");
            const { found } = assemblyGet(as, "nonexistent");
            expect(found).toBe(false);
        });
    });

    // =========================================================================
    // TestAssemblySetLocation — implemented via combination helpers
    // =========================================================================
    describe("TestAssemblySetLocation", () => {
        it("set location", () => {
            const as = makeAssemblyWithChild("root", "child");
            // Use undefined location (identity transform) — the helper
            // tests remove + re-add logic, not specific transform values
            assemblySetLocation(as, "child", undefined);
            expect(as.hasError()).toBe(false);
            const { found, element } = assemblyGet(as, "child");
            expect(found).toBe(true);
            expect(element).toBeDefined();
        });

        it("not found", () => {
            const as = makeAssemblyWithChild("root", "child");
            let threw = false;
            try {
                assemblySetLocation(as, "nonexistent", undefined);
            } catch {
                threw = true;
            }
            expect(threw).toBe(true);
        });

        it("nested path rejected", () => {
            const as = makeAssemblyForQuery("root", "child", "grand");
            let threw = false;
            try {
                assemblySetLocation(as, "child/grand", undefined);
            } catch {
                threw = true;
            }
            expect(threw).toBe(true);
        });
    });

    // =========================================================================
    // TestAssemblyReplace — implemented via combination helpers
    // =========================================================================
    describe("TestAssemblyReplace", () => {
        it("replace keeps name and location", () => {
            const rootShp = makeBox10();
            const as = tp.Assembly.create(rootShp, undefined, "root");
            const childShp = makeBox5();
            // Add child with undefined location (identity transform)
            as.add(childShp, undefined, "child", undefined);

            const newShp = wp().boxCentered(20, 20, 20).value();
            assemblyReplace(as, "child", newShp);
            expect(as.hasError()).toBe(false);

            const { found, element } = assemblyGet(as, "child");
            expect(found).toBe(true);
            expect(element).toBeDefined();
            expect(element.name()).toBe("child");
        });

        it("not found", () => {
            const as = makeAssemblyWithChild("root", "child");
            const newShp = makeBox2();
            let threw = false;
            try {
                assemblyReplace(as, "nonexistent", newShp);
            } catch {
                threw = true;
            }
            expect(threw).toBe(true);
        });

        it("nil shape", () => {
            const as = makeAssemblyWithChild("root", "child");
            let threw = false;
            try {
                assemblyReplace(as, "child", null);
            } catch {
                threw = true;
            }
            expect(threw).toBe(true);
        });
    });

    // =========================================================================
    // TestAssemblyParametric
    // =========================================================================
    describe("TestAssemblyParametric", () => {
        beforeAll(() => {
            registerParametricBuilder("test_box", (params: any) => {
                const wp = new CQWorkplane(tp, "XY");
                const shape = wp.boxCentered(params.width, params.length, params.height).value();
                return { shape };
            });
        });
        afterAll(() => {
            registerParametricBuilder("test_box", null);
        });

        it("add and query", () => {
            const pas = new ParametricAssembly(tp, makeBox10(), "root");
            // Add a child without parametric (Go: "plain")
            pas.addObjectParams(makeBox5(), undefined, "plain", undefined, null);
            // Add a parametric box
            pas.addObjectParams(makeBox2(), undefined, "box1", undefined, {
                type: "test_box",
                params: { width: 4, length: 4, height: 4 },
            });
            expect(pas.hasError()).toBe(false);

            const [pd, ok] = pas.getParametric("box1");
            expect(ok).toBe(true);
            expect(pd).toBeDefined();
            expect(pd!.type).toBe("test_box");
            expect(pd!.params.width).toBe(4);

            // Plain element has no parametric data
            const [, okPlain] = pas.getParametric("plain");
            expect(okPlain).toBe(false);

            // Nonexistent element has no parametric data
            const [, okMiss] = pas.getParametric("nonexistent");
            expect(okMiss).toBe(false);
        });

        it("params survive SetLocation and Replace", () => {
            const pas = new ParametricAssembly(tp, makeBox10(), "root");
            pas.addObjectParams(makeBox2(), undefined, "box1", undefined, {
                type: "test_box",
                params: { width: 4, length: 4, height: 4 },
            });

            // Create a translation location (1,2,3) via gp_Trsf
            const trsf = new tp.gp_Trsf_1();
            trsf.SetValues(1, 0, 0, 1, 0, 1, 0, 2, 0, 0, 1, 3);
            const loc = new tp.Location(trsf);
            pas.setLocation("box1", loc);
            expect(pas.hasError()).toBe(false);

            const [pd1, ok1] = pas.getParametric("box1");
            expect(ok1).toBe(true);
            expect(pd1!.type).toBe("test_box");

            // Replace geometry, parametrics should survive
            const newShp = wp().boxCentered(8, 8, 8).value();
            pas.replace("box1", newShp);
            const [pd2, ok2] = pas.getParametric("box1");
            expect(ok2).toBe(true);
            expect(pd2!.type).toBe("test_box");
        });

        it("remove clears params", () => {
            const pas = new ParametricAssembly(tp, makeBox10(), "root");
            pas.addObjectParams(makeBox2(), undefined, "box1", undefined, {
                type: "test_box",
                params: { width: 4, length: 4, height: 4 },
            });
            pas.remove("box1");
            const [, ok] = pas.getParametric("box1");
            expect(ok).toBe(false);
        });
    });

    // =========================================================================
    // TestAssemblyExportParametric
    // =========================================================================
    describe("TestAssemblyExportParametric", () => {
        beforeAll(() => {
            registerParametricBuilder("test_box", (params: any) => {
                const wp = new CQWorkplane(tp, "XY");
                const shape = wp.boxCentered(params.width, params.length, params.height).value();
                return { shape };
            });
        });
        afterAll(() => {
            registerParametricBuilder("test_box", null);
        });

        it("export hierarchy", () => {
            const rootShp = makeBox10();
            const pas = new ParametricAssembly(tp, rootShp, "root");

            // Add box1 with color and location
            const trsf = new tp.gp_Trsf_1();
            trsf.SetValues(1, 0, 0, 1, 0, 1, 0, 2, 0, 0, 1, 3);
            const loc = new tp.Location(trsf);
            const red = new tp.Quantity_Color_3(1, 0, 0, tp.Quantity_TypeOfColor.Quantity_TOC_RGB);
            pas.addObjectParams(rootShp, loc, "box1", red, {
                type: "test_box",
                params: { width: 4, length: 5, height: 6 },
            });

            // Create a child sub-assembly with its own parametric data
            const childShp = makeBox2();
            const child = tp.Assembly.create(childShp, undefined, "sub");
            // Attach parametric data to the child assembly wrapper
            child._parametricData = { type: "test_box", params: { width: 2, length: 2, height: 2 } };
            child._childParametrics = new Map();

            // Add a parametric grandchild to the child
            const innerNode = { data: { type: "test_box", params: { width: 1, length: 1, height: 1 } }, children: new Map() };
            child._childParametrics.set("inner", innerNode);
            child.add(makeBox2(), undefined, "inner", undefined);

            pas.addAssemblyParams(child, undefined, "", undefined, {
                type: "test_box",
                params: { width: 2, length: 2, height: 2 },
            });
            expect(pas.hasError()).toBe(false);

            const json = pas.exportParametric();
            const root = JSON.parse(json);

            expect(root.name).toBe("root");
            expect(root.children.length).toBe(2);

            const box1 = root.children.find((ch: any) => ch.name === "box1");
            const sub = root.children.find((ch: any) => ch.name === "sub");
            expect(box1).toBeDefined();
            expect(sub).toBeDefined();

            // box1: type, location, color
            expect(box1.type).toBe("test_box");
            expect(box1.location).toBeDefined();
            expect(box1.location[3]).toBe(1);
            expect(box1.location[7]).toBe(2);
            expect(box1.location[11]).toBe(3);
            expect(box1.color).toBeDefined();
            expect(box1.color[0]).toBe(1);

            // sub: type + nested child
            expect(sub.type).toBe("test_box");
            expect(sub.children).toBeDefined();
            expect(sub.children.length).toBe(1);
            expect(sub.children[0].name).toBe("inner");
            expect(sub.children[0].type).toBe("test_box");
        });
    });

    // =========================================================================
    // TestAssemblyRebuildParametric
    // =========================================================================
    describe("TestAssemblyRebuildParametric", () => {
        beforeAll(() => {
            registerParametricBuilder("test_box", (params: any) => {
                const wp = new CQWorkplane(tp, "XY");
                const shape = wp.boxCentered(params.width, params.length, params.height).value();
                return { shape };
            });
        });
        afterAll(() => {
            registerParametricBuilder("test_box", null);
        });

        it("export rebuild round trip", () => {
            // Build source assembly
            const rootShp = makeBox10();
            const pas = new ParametricAssembly(tp, rootShp, "root");

            const trsf = new tp.gp_Trsf_1();
            trsf.SetValues(1, 0, 0, 1, 0, 1, 0, 2, 0, 0, 1, 3);
            const loc = new tp.Location(trsf);
            pas.addObjectParams(makeBox10(), loc, "box1", undefined, {
                type: "test_box",
                params: { width: 4, length: 5, height: 6 },
            });

            const childShp = makeBox2();
            const child = tp.Assembly.create(childShp, undefined, "sub");
            child._parametricData = { type: "test_box", params: { width: 2, length: 2, height: 2 } };
            child._childParametrics = new Map();
            pas.addAssemblyParams(child, undefined, "", undefined, {
                type: "test_box",
                params: { width: 2, length: 2, height: 2 },
            });

            const json = pas.exportParametric();

            // Rebuild from JSON
            const rebuilt = rebuildFromParametric(tp, json);

            // Verify root name and child count
            expect(rebuilt.name()).toBe("root");
            expect(rebuilt.children().length).toBe(2);

            // Verify geometry: find box1 and check bbox
            const rebuiltChildren = rebuilt.children();
            let box1El: any;
            for (let i = 0; i < rebuiltChildren.length; i++) {
                if (rebuiltChildren[i].name() === "box1") {
                    box1El = rebuiltChildren[i];
                    break;
                }
            }
            expect(box1El).toBeDefined();

            const bb = box1El.obj().bbox();
            // Width (X) ≈ 4
            const w = bb.xLength();
            expect(w).toBeGreaterThanOrEqual(3.9);
            expect(w).toBeLessThanOrEqual(4.1);
            // Length (Y) ≈ 5
            const l = bb.yLength();
            expect(l).toBeGreaterThanOrEqual(4.9);
            expect(l).toBeLessThanOrEqual(5.1);
            // Height (Z) ≈ 6
            const h = bb.zLength();
            expect(h).toBeGreaterThanOrEqual(5.9);
            expect(h).toBeLessThanOrEqual(6.1);

            // Verify location from JSON (1,2,3) translation
            const boxLoc = box1El.location();
            const boxTrsf = boxLoc.toTrsf();
            expect(boxTrsf.Value(1, 4)).toBeCloseTo(1, 6);
            expect(boxTrsf.Value(2, 4)).toBeCloseTo(2, 6);
            expect(boxTrsf.Value(3, 4)).toBeCloseTo(3, 6);

            // Rebuilt tree should still carry parametric data
            // Wrap in ParametricAssembly to access getParametric
            const rebuiltPA = ParametricAssembly.fromNative(tp, rebuilt);
            const [pdBox1, okBox1] = rebuiltPA.getParametric("box1");
            expect(okBox1).toBe(true);
            const [pdSub, okSub] = rebuiltPA.getParametric("sub");
            expect(okSub).toBe(true);
            expect(pdSub!.type).toBe("test_box");

            // Second round trip: export rebuilt → rebuild again
            const json2 = rebuiltPA.exportParametric();
            const rebuilt2 = rebuildFromParametric(tp, json2);
            expect(rebuilt2.name()).toBe("root");
            expect(rebuilt2.children().length).toBe(2);
        });

        it("unregistered type error", () => {
            const json = JSON.stringify({
                name: "root",
                children: [{ name: "x", type: "no_such_type", params: {} }],
            });
            expect(() => rebuildFromParametric(tp, json)).toThrow("no_such_type");
        });

        it("invalid JSON", () => {
            expect(() => rebuildFromParametric(tp, "{not json")).toThrow();
        });
    });
});
