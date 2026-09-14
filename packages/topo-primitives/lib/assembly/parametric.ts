/**
 * Parametric Assembly — pure TS implementation, ported from go-topo assembly_parametric.go
 *
 * Maintains a JS-side parametric recipe tree parallel to a native WASM Assembly.
 * The native C++ layer is unaware of parametric data; all state is on the JS side.
 *
 * JSON schema aligns with Go's ParametricElement for cross-language interop:
 * {
 *   "name": "root",
 *   "location": [1,0,0,tx, 0,1,0,ty, 0,0,1,tz],
 *   "color": [r,g,b],
 *   "type": "box",
 *   "params": {...},
 *   "children": [...]
 * }
 */

// ---------------------------------------------------------------------------
// Global parametric builder registry
// ---------------------------------------------------------------------------

export type ParametricBuilderFn = (params: any) => { shape: any; loc?: any };

const builders = new Map<string, ParametricBuilderFn>();

/** Register a parametric builder. Pass null/undefined to unregister. */
export function registerParametricBuilder(
    typeName: string,
    fn: ParametricBuilderFn | null | undefined,
): void {
    if (fn == null) {
        builders.delete(typeName);
    } else {
        builders.set(typeName, fn);
    }
}

/** @internal — lookup builder by type name */
function lookupBuilder(typeName: string): ParametricBuilderFn | undefined {
    return builders.get(typeName);
}

// ---------------------------------------------------------------------------
// Export helpers — extract location / color from native assembly
// ---------------------------------------------------------------------------

/** Extract 12-element row-major transform matrix from a native Assembly element. */
function exportLocation(tp: any, element: any): number[] | undefined {
    const loc = element.location();
    if (!loc) return undefined;
    const trsf = loc.toTrsf();
    // Row-major 12 elements: rows 1-3, cols 1-4 (translation in col 4)
    const d: number[] = [];
    for (let r = 1; r <= 3; r++) {
        for (let c = 1; c <= 4; c++) {
            d.push(trsf.Value(r, c));
        }
    }
    // Identity transform (all zeros except diagonals = 1) → omit from JSON
    if (
        d[0] === 1 && d[1] === 0 && d[2] === 0 && d[3] === 0 &&
        d[4] === 0 && d[5] === 1 && d[6] === 0 && d[7] === 0 &&
        d[8] === 0 && d[9] === 0 && d[10] === 1 && d[11] === 0
    ) {
        return undefined;
    }
    return d;
}

/** Extract [r,g,b] color from a native Assembly element, if valid. */
function exportColor(tp: any, element: any): number[] | undefined {
    if (!element.hasColor()) return undefined;
    const c = element.color();
    const r = c.Red();
    const g = c.Green();
    const b = c.Blue();
    // Guard against NaN / out-of-range (matches Go exportParametricNode)
    if (
        r === r && g === g && b === b &&
        r >= 0 && r <= 1 && g >= 0 && g <= 1 && b >= 0 && b <= 1
    ) {
        return [r, g, b];
    }
    return undefined;
}

// ---------------------------------------------------------------------------
// Import helpers — reconstruct location / color from JSON
// ---------------------------------------------------------------------------

/** Reconstruct a topo_location from a 12-element row-major matrix. */
function importLocation(tp: any, d: number[]): any {
    const trsf = new tp.gp_Trsf_1();
    trsf.SetValues(d[0], d[1], d[2], d[3], d[4], d[5], d[6], d[7], d[8], d[9], d[10], d[11]);
    return new tp.Location(trsf);
}

/** Reconstruct a Quantity_Color from [r,g,b]. */
function importColor(tp: any, rgb: number[]): any {
    return new tp.Quantity_Color_3(rgb[0], rgb[1], rgb[2], tp.Quantity_TypeOfColor.Quantity_TOC_RGB);
}

// ---------------------------------------------------------------------------
// ParametricNode — internal tree node (mirrors Go's parametricNode)
// ---------------------------------------------------------------------------

interface ParametricNode {
    data: ParametricData | null;
    children: Map<string, ParametricNode>;
}

interface ParametricData {
    type: string;
    params?: any;
}

function makeNode(data: ParametricData | null): ParametricNode {
    return { data, children: new Map() };
}

// ---------------------------------------------------------------------------
// Export / import JSON element types (match Go's ParametricElement)
// ---------------------------------------------------------------------------

interface ParametricElementJSON {
    name: string;
    location?: number[];
    color?: number[];
    type?: string;
    params?: any;
    children?: ParametricElementJSON[];
}

// ---------------------------------------------------------------------------
// Core recursive export / import functions
// ---------------------------------------------------------------------------

function buildExportNode(tp: any, element: any, selfData: ParametricData | null, childMap: Map<string, ParametricNode>): ParametricElementJSON {
    const node: ParametricElementJSON = { name: element.name() };

    const loc = exportLocation(tp, element);
    if (loc) node.location = loc;

    const col = exportColor(tp, element);
    if (col) node.color = col;

    if (selfData) {
        node.type = selfData.type;
        node.params = selfData.params;
    }

    const children = element.children();
    if (children && children.length > 0) {
        node.children = [];
        for (let i = 0; i < children.length; i++) {
            const ch = children[i];
            const chName = ch.name();
            const chNode = childMap.get(chName);
            node.children.push(
                buildExportNode(tp, ch, chNode?.data ?? null, chNode?.children ?? new Map()),
            );
        }
    }

    return node;
}

function rebuildNode(tp: any, el: ParametricElementJSON): any {
    let shape: any;
    let buildLoc: any;

    if (el.type) {
        const fn = lookupBuilder(el.type);
        if (!fn) {
            throw new Error(
                `assembly: no parametric builder registered for type "${el.type}" (element "${el.name}")`,
            );
        }
        const result = fn(el.params);
        shape = result.shape;
        buildLoc = result.loc;
        if (!shape || shape.isNull()) {
            throw new Error(
                `assembly: builder for type "${el.type}" returned nil shape (element "${el.name}")`,
            );
        }
    } else {
        shape = new tp.Vertex(0, 0, 0);
    }

    // Node location from JSON takes precedence over builder's default loc
    const loc = el.location ? importLocation(tp, el.location) : buildLoc;
    const color = el.color ? importColor(tp, el.color) : undefined;

    const as = tp.Assembly.create(shape, loc, el.name, color);

    // Attach JS-side state to the native assembly object
    as._parametricData = null;
    as._childParametrics = new Map<string, ParametricNode>();

    // Restore parametric data on the wrapper
    if (el.type) {
        as._parametricData = { type: el.type, params: el.params };
    }

    // Recurse children
    if (el.children) {
        for (const ch of el.children) {
            const childAs = rebuildNode(tp, ch);
            // Store child parametric data before native add (which may deep-copy)
            const childData = childAs._parametricData;
            as.add(childAs, undefined, "", undefined);
            if (as.hasError()) {
                throw new Error(
                    `assembly: add child "${ch.name}": ${as.getError()}`,
                );
            }
            // Restore parametric data on the wrapper after native add
            if (childData) {
                as._childParametrics.set(ch.name, makeNode(childData));
            }
        }
    }

    return as;
}

/**
 * Rebuild an assembly from a parametric JSON recipe tree.
 * Registered builders are called to regenerate geometry for each typed element.
 *
 * @throws if JSON is invalid, a builder is missing, or a builder returns nil shape.
 */
export function rebuildFromParametric(tp: any, json: string): any {
    const root = JSON.parse(json) as ParametricElementJSON;
    return rebuildNode(tp, root);
}

// ---------------------------------------------------------------------------
// ParametricAssembly — wrapper around a native Assembly + JS-side state
// ---------------------------------------------------------------------------

export class ParametricAssembly {
    /** The native WASM Assembly. */
    readonly assembly: any;

    /** JS-side parametric data for the assembly itself (optional). */
    private _parametric: ParametricData | null = null;

    /** JS-side parametric recipe tree for top-level children. */
    private _childParametrics = new Map<string, ParametricNode>();

    /** @internal — wrap a native Assembly that already carries JS-side parametric state (e.g. from rebuildFromParametric) */
    static fromNative(tp: any, nativeAs: any): ParametricAssembly {
        // Wrap the existing assembly directly — do NOT create a new one
        const pa = new ParametricAssembly(tp, nativeAs);
        // Transfer state attached by rebuildNode onto the raw assembly object
        pa._parametric = nativeAs._parametricData ?? null;
        if (nativeAs._childParametrics instanceof Map) {
            pa._childParametrics = nativeAs._childParametrics;
        }
        return pa;
    }

    constructor(tp: any, objOrShape: any, name?: string, loc?: any, color?: any) {
        // If objOrShape is already an Assembly (has .name() method), wrap it directly
        if (objOrShape && typeof objOrShape.name === "function") {
            this.assembly = objOrShape;
        } else {
            this.assembly = tp.Assembly.create(objOrShape, loc, name, color);
        }
    }

    // -- Assembly self parametrics -------------------------------------------------

    /** Set parametric recipe for the assembly itself. */
    setParametric(data: ParametricData | null): this {
        this._parametric = data;
        return this;
    }

    /** Get parametric recipe for the assembly itself. */
    parametric(): ParametricData | null {
        return this._parametric;
    }

    // -- Child element operations --------------------------------------------------

    /**
     * Add an object (shape or sub-assembly) with parametric recipe.
     * data can be null to add without recipe (delegates to native add).
     */
    addObjectParams(obj: any, loc: any, name: string, color: any, data: ParametricData | null): this {
        this.assembly.add(obj, loc, name, color);
        if (data) {
            this._childParametrics.set(name, makeNode(data));
        }
        return this;
    }

    /**
     * Add a child assembly with parametric recipe for the child itself
     * and optionally for its children (nested).
     */
    addAssemblyParams(child: any, loc: any, name: string, color: any, data: ParametricData | null): this {
        const finalName = name || child.name();
        this.assembly.add(child, loc, name, color);
        if (data || (child._childParametrics && child._childParametrics.size > 0)) {
            const node = makeNode(data);
            if (child._childParametrics) {
                node.children = child._childParametrics;
            }
            this._childParametrics.set(finalName, node);
        }
        return this;
    }

    /**
     * Get parametric recipe for a top-level child element by name.
     * Returns [data, true] if found, or [null, false] if not set.
     */
    getParametric(name: string): [ParametricData | null, boolean] {
        const node = this._childParametrics.get(name);
        if (!node || !node.data) return [null, false];
        return [node.data, true];
    }

    /**
     * Remove a top-level child element and clear its parametric recipe.
     */
    remove(name: string): this {
        this.assembly.remove(name);
        this._childParametrics.delete(name);
        return this;
    }

    /**
     * Set location of a top-level element, preserving its parametric recipe.
     * (Matches Go's SetLocation: remove → re-add → restore recipe)
     */
    setLocation(name: string, loc: any): void {
        if (name.includes("/")) {
            throw new Error(`assembly: SetLocation only supports top-level elements, got "${name}"`);
        }
        const children = this.assembly.children();
        for (let i = 0; i < children.length; i++) {
            if (children[i].name() === name) {
                const saved = this._childParametrics.get(name);
                this.assembly.remove(name);
                this.assembly.add(children[i], loc, name, undefined);
                if (saved) {
                    this._childParametrics.set(name, saved);
                }
                return;
            }
        }
        throw new Error(`assembly: no element named "${name}"`);
    }

    /**
     * Replace a top-level element's geometry, preserving name/location/color/parametrics.
     * (Matches Go's Replace: remove → re-add new shape → restore recipe)
     */
    replace(name: string, newShape: any): void {
        if (!newShape || newShape.isNull()) {
            throw new Error("assembly: Replace with nil shape");
        }
        if (name.includes("/")) {
            throw new Error(`assembly: Replace only supports top-level elements, got "${name}"`);
        }
        const children = this.assembly.children();
        for (let i = 0; i < children.length; i++) {
            if (children[i].name() === name) {
                const childLoc = children[i].location();
                const childColor = children[i].hasColor() ? children[i].color() : undefined;
                const saved = this._childParametrics.get(name);
                this.assembly.remove(name);
                this.assembly.add(newShape, childLoc, name, childColor);
                if (saved) {
                    this._childParametrics.set(name, saved);
                }
                return;
            }
        }
        throw new Error(`assembly: no element named "${name}"`);
    }

    // -- Export -------------------------------------------------------------------

    /**
     * Export the entire assembly tree to a JSON string (parametric recipe tree).
     * Can be stored or sent to a frontend editor; rebuild with rebuildFromParametric.
     */
    exportParametric(): string {
        const root = buildExportNode(
            this.assembly,
            this.assembly,
            this._parametric,
            this._childParametrics,
        );
        return JSON.stringify(root);
    }

    // -- Passthrough to native assembly -------------------------------------------

    name(): string { return this.assembly.name(); }
    children(): any[] { return this.assembly.children(); }
    hasError(): boolean { return this.assembly.hasError(); }
    getError(): string | null { return this.assembly.getError(); }
}
