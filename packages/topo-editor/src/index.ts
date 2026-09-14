import "./main.css";
import { requestTopoInstance } from "topo-js";
import { CQ } from "topo-primitives";
import type { TopoInstance } from "topo-wasm";
import { createEditor } from "./editor";
import { Viewport } from "./viewport";
import { runCode, installGlobals } from "./runner";
import { examples } from "./examples";

// ---- DOM refs --------------------------------------------------------------
const editorEl = document.getElementById("editor")!;
const canvas = document.getElementById("viewport-canvas") as HTMLCanvasElement;
const exampleSelect = document.getElementById("example-select") as HTMLSelectElement;
const btnRun = document.getElementById("btn-run")!;
const btnReset = document.getElementById("btn-reset-camera")!;
const chkWireframe = document.getElementById("chk-wireframe") as HTMLInputElement;
const statusTime = document.getElementById("status-time")!;
const statusShapes = document.getElementById("status-shapes")!;
const statusError = document.getElementById("status-error")!;
const divider = document.getElementById("divider")!;
const editorPane = document.getElementById("editor-pane")!;

// ---- State -----------------------------------------------------------------
let tp: TopoInstance;
let prevGeos = { solidGeos: [] as import("three").BufferGeometry[], edgeGeos: [] as import("three").BufferGeometry[] };

// ---- Viewport --------------------------------------------------------------
const viewport = new Viewport(canvas);

// ---- Editor ----------------------------------------------------------------
const editor = createEditor(editorEl, (code) => {
  executeCode(code);
});

// ---- Toolbar wiring --------------------------------------------------------
// Populate examples dropdown
for (const ex of examples) {
  const opt = document.createElement("option");
  opt.value = ex.label;
  opt.textContent = ex.label;
  exampleSelect.appendChild(opt);
}

// Load first example
if (examples.length > 0) {
  editor.setCode(examples[0].code);
}

exampleSelect.addEventListener("change", () => {
  const ex = examples.find((e) => e.label === exampleSelect.value);
  if (ex) {
    editor.setCode(ex.code);
  }
});

btnRun.addEventListener("click", () => {
  executeCode(editor.getCode());
});

btnReset.addEventListener("click", () => {
  viewport.resetCamera();
});

chkWireframe.addEventListener("change", () => {
  viewport.wireframe = chkWireframe.checked;
});

// ---- Divider drag ----------------------------------------------------------
{
  let dragging = false;
  let startX = 0;
  let startWidth = 0;

  divider.addEventListener("mousedown", (e) => {
    dragging = true;
    startX = e.clientX;
    startWidth = editorPane.getBoundingClientRect().width;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const newWidth = Math.max(200, startWidth + dx);
    editorPane.style.width = `${newWidth}px`;
    viewport.resize();
  });

  document.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  });
}

// ---- Execution -------------------------------------------------------------
function executeCode(code: string): void {
  if (!tp) {
    statusError.textContent = "WASM still loading...";
    return;
  }

  statusError.textContent = "";
  try {
    const result = runCode(code, tp, prevGeos);
    prevGeos = { solidGeos: result.solidGeos, edgeGeos: result.edgeGeos };
    viewport.setModels(result.solidGeos, result.edgeGeos);

    statusTime.textContent = `Time: ${result.elapsed.toFixed(1)}ms`;
    statusShapes.textContent = result.shapeCount > 0
      ? `Shapes: ${result.shapeCount} | Geos: ${result.solidGeos.length}`
      : "No shapes";

    if (result.error) {
      statusError.textContent = result.error;
    } else if (result.warnings.length > 0) {
      statusError.textContent = result.warnings.join("; ");
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    statusError.textContent = msg;
  }
}

// ---- Bootstrap WASM --------------------------------------------------------
(async () => {
  statusTime.textContent = "Loading WASM...";
  try {
    tp = await requestTopoInstance();
    installGlobals(tp);
    statusTime.textContent = "Ready";

    // Auto-run the first example
    executeCode(editor.getCode());
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    statusError.textContent = `WASM load failed: ${msg}`;
  }
})();
