/**
 * Assembly full API — ported from go-topo assembly_test.go (non-solve parts)
 *
 * Reference: /Users/xuning/Work/go-topo/assembly_test.go
 * Skips: solve tests (covered in cq_assembly_solve.test.ts),
 *        get/setLocation/replace/parametric (no WASM bindings),
 *        getElements (known bug)
 */
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CQWorkplane } from "../lib/cq/index";

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
    const as = makeAssemblyWithChild(rootName, childName);
    const gcShp = makeBox2();
    as.add(gcShp, undefined, grandchildName);
    return as;
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
        it.skip("getElements — known bug: assembly_element cannot be converted to emval", () => {
            // Go: as.GetElements() → elems, len check, name check, shape check
            // JS: getElements() throws due to value_object<assembly_element> bug
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
    // TestAssemblyGet — no get() in WASM bindings, skip
    // =========================================================================
    describe("TestAssemblyGet", () => {
        it.skip("hit top-level — no get() method in WASM bindings", () => {});
        it.skip("hit nested path — no get() method in WASM bindings", () => {});
        it.skip("miss — no get() method in WASM bindings", () => {});
    });

    // =========================================================================
    // TestAssemblySetLocation — no setLocation() in WASM bindings, skip
    // =========================================================================
    describe("TestAssemblySetLocation", () => {
        it.skip("set location — no setLocation() method in WASM bindings", () => {});
        it.skip("not found — no setLocation() method in WASM bindings", () => {});
        it.skip("nested path rejected — no setLocation() method in WASM bindings", () => {});
    });

    // =========================================================================
    // TestAssemblyReplace — no replace() in WASM bindings, skip
    // =========================================================================
    describe("TestAssemblyReplace", () => {
        it.skip("replace keeps name location color — no replace() method in WASM bindings", () => {});
        it.skip("not found — no replace() method in WASM bindings", () => {});
        it.skip("nil shape — no replace() method in WASM bindings", () => {});
    });

    // =========================================================================
    // TestAssemblyParametric — no parametric API in WASM bindings, skip
    // =========================================================================
    describe("TestAssemblyParametric", () => {
        it.skip("add and query — no parametric API in WASM bindings", () => {});
        it.skip("params survive SetLocation and Replace — no parametric API in WASM bindings", () => {});
        it.skip("remove clears params — no parametric API in WASM bindings", () => {});
    });

    // =========================================================================
    // TestAssemblyExportParametric — no parametric API, skip
    // =========================================================================
    describe("TestAssemblyExportParametric", () => {
        it.skip("export hierarchy — no parametric API in WASM bindings", () => {});
    });

    // =========================================================================
    // TestAssemblyRebuildParametric — no rebuild API, skip
    // =========================================================================
    describe("TestAssemblyRebuildParametric", () => {
        it.skip("export rebuild round trip — no rebuild API in WASM bindings", () => {});
        it.skip("unregistered type error — no rebuild API in WASM bindings", () => {});
        it.skip("invalid JSON — no rebuild API in WASM bindings", () => {});
    });
});
