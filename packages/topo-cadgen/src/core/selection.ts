// Selection service (P3 framework): face picks in, attribution out — with
// subscribers. The viewer feeds picks; panels and the edit flow subscribe.
export interface Selection {
  featureId: string;
  sketchId?: string;
  faceId?: number;
  /** kind defaults to "face" for face picks; "edge" / "vertex" for the
   * other two selection modes. A vertex is local-only (no server semantics):
   * featureId stays "" and position carries the readout. */
  kind?: "face" | "edge" | "vertex";
  /** edgeId in the run's topology index (the render/pick address). */
  edgeId?: number;
  /** The stable edge reference (byFaces + index) — survives rebuilds. */
  edgeRef?: { byFaces?: Array<{ min: number[]; max: number[] }>; index: number };
  /** vertex mode: the topology vertex's pick id and world position. */
  vertexId?: number;
  position?: [number, number, number];
  sourceRange?: { featureId: string; start: number; end: number };
}

export class SelectionService {
  private current: Selection | null = null;
  private subs = new Set<(s: Selection | null) => void>();

  set(sel: Selection | null): void {
    this.current = sel;
    this.subs.forEach((fn) => fn(sel));
  }

  get(): Selection | null {
    return this.current;
  }

  subscribe(fn: (s: Selection | null) => void): () => void {
    this.subs.add(fn);
    fn(this.current);
    return () => {
      this.subs.delete(fn);
    };
  }
}
