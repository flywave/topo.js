/**
 * The resumable run state (roadmap T2.4).
 *
 * Every expensive stage's product is persisted under `<workDir>/.topo-img2cad/`
 * (stage A's view set, stage B's profiles WITH their ink measurements, stage C's
 * feature tree), each stamped with the SHA-256 of the drawing it was produced
 * from. `--resume` picks up after a killed run at stage granularity — per view
 * inside stage B — instead of paying the model calls again.
 *
 * The hash is the resume contract: state belongs to ONE drawing. Resuming over
 * a different (or edited) image is refused loudly with RESUME_HASH_MISMATCH —
 * silently reusing another drawing's profiles would poison every measurement
 * downstream, which is worse than starting over.
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const RUN_STATE_DIR = ".topo-img2cad";
export const RUN_STATE_FILE = "state.json";
const STATE_VERSION = 1;

export interface RunStatePayload {
  version: number;
  imagePath: string;
  imageSha256: string;
  /** Stage name → ISO time it completed. */
  stages: Record<string, string>;
  viewSet?: unknown;
  profiles?: unknown[];
  /** Stage-B ink measurements, kept beside the profiles they belong to. */
  profileChecks?: unknown[];
  tree?: unknown;
}

export function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export interface OpenedRunState {
  store: RunStateStore;
  /** State from a previous run, when it exists AND belongs to this drawing. */
  resumed: RunStatePayload | null;
  /** Set when a state file exists but was produced from a DIFFERENT drawing. */
  mismatch?: { expected: string; actual: string };
}

export class RunStateStore {
  readonly dir: string;
  readonly statePath: string;
  state: RunStatePayload;

  private constructor(
    readonly workDir: string,
    readonly imagePath: string,
    state?: RunStatePayload,
  ) {
    this.dir = join(workDir, RUN_STATE_DIR);
    this.statePath = join(this.dir, RUN_STATE_FILE);
    this.state = state ?? {
      version: STATE_VERSION,
      imagePath,
      imageSha256: sha256File(imagePath),
      stages: {},
    };
  }

  /**
   * Open the state for `imagePath` in `workDir`. Returns the previous run's
   * state when it exists and its hash matches; `mismatch` when it exists but
   * was made from a different drawing.
   */
  static open(workDir: string, imagePath: string): OpenedRunState {
    const store = new RunStateStore(workDir, imagePath);
    if (!existsSync(store.statePath)) {
      return { store, resumed: null };
    }
    let raw: RunStatePayload;
    try {
      raw = JSON.parse(readFileSync(store.statePath, "utf-8")) as RunStatePayload;
    } catch {
      // A truncated state file (killed mid-write) is not a hash mismatch —
      // it is no state at all.
      return { store, resumed: null };
    }
    if (raw?.version !== STATE_VERSION || typeof raw.imageSha256 !== "string") {
      return { store, resumed: null };
    }
    const actual = store.state.imageSha256;
    if (raw.imageSha256 !== actual) {
      return { store, resumed: null, mismatch: { expected: raw.imageSha256, actual } };
    }
    store.state = raw;
    store.state.imagePath = imagePath;
    return { store, resumed: raw };
  }

  has(stage: string): boolean {
    return !!this.state.stages[stage];
  }

  mark(stage: string): void {
    this.state.stages[stage] = new Date().toISOString();
    this.save();
  }

  save(): void {
    mkdirSync(this.dir, { recursive: true });
    writeFileSync(this.statePath, `${JSON.stringify(this.state, null, 2)}\n`, "utf-8");
  }
}
