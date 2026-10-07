// Selection service (P3 framework): face picks in, attribution out — with
// subscribers. The viewer feeds picks; panels and the edit flow subscribe.
export interface Selection {
  featureId: string;
  sketchId?: string;
  faceId?: number;
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
