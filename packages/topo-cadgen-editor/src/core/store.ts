// The editor's state store (P3 framework): a tiny reactive store — get/set/
// subscribe with slice selectors. No framework; ~60 lines; every panel reads
// through selectors so features never reach into each other.
export type Unsubscribe = () => void;

export class Store<T extends object> {
  private state: T;
  private subs = new Set<(s: T) => void>();

  constructor(initial: T) {
    this.state = initial;
  }

  get(): Readonly<T> {
    return this.state;
  }

  set(patch: Partial<T> | ((s: Readonly<T>) => Partial<T>)): void {
    const p = typeof patch === "function" ? patch(this.state) : patch;
    let changed = false;
    for (const k of Object.keys(p) as (keyof T)[]) {
      if (this.state[k] !== p[k]) {
        changed = true;
        break;
      }
    }
    if (!changed) return;
    this.state = { ...this.state, ...p };
    this.subs.forEach((fn) => fn(this.state));
  }

  subscribe(fn: (s: Readonly<T>) => void): Unsubscribe {
    this.subs.add(fn);
    fn(this.state);
    return () => {
      this.subs.delete(fn);
    };
  }

  select<K extends keyof T>(key: K, fn: (v: T[K]) => void): Unsubscribe {
    let last = this.state[key];
    fn(last);
    return this.subscribe((s) => {
      if (s[key] !== last) {
        last = s[key];
        fn(last);
      }
    });
  }
}
