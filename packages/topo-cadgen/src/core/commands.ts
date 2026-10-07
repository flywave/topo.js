// Command registry (P3 framework): every user action is a command —
// { id, title?, keys?, run(args) } — so panels, menus, and keyboard shortcuts
// all bind to the same registry and never to each other. Registering a
// duplicate id throws: commands are the extension API, collisions are bugs.
export interface Command<A = void> {
  id: string;
  title?: string;
  keys?: string; // e.g. "ctrl+z"
  run: (args: A) => void | Promise<void>;
}

export class Commands {
  private byId = new Map<string, Command<any>>();
  private keyMap = new Map<string, string>();

  register<A>(cmd: Command<A>): void {
    if (this.byId.has(cmd.id)) {
      throw new Error(`command ${cmd.id} already registered`);
    }
    this.byId.set(cmd.id, cmd);
    if (cmd.keys) {
      this.keyMap.set(normalizeKeys(cmd.keys), cmd.id);
    }
  }

  has(id: string): boolean {
    return this.byId.has(id);
  }

  list(): Command<any>[] {
    return [...this.byId.values()];
  }

  execute(id: string, args?: any): Promise<void> {
    const cmd = this.byId.get(id);
    if (!cmd) throw new Error(`command ${id} not registered`);
    return Promise.resolve(cmd.run(args));
  }

  // bindKeys — wire the registry to keyboard shortcuts on a target.
  bindKeys(target: HTMLElement | Window): void {
    const listen = target instanceof Window ? target : target;
    (listen as Window).addEventListener?.("keydown", (ev: KeyboardEvent) => {
      const combo = normalizeKeys(
        [
          ev.ctrlKey || ev.metaKey ? "ctrl" : "",
          ev.shiftKey ? "shift" : "",
          ev.key.toLowerCase(),
        ]
          .filter(Boolean)
          .join("+"),
      );
      const id = this.keyMap.get(combo);
      if (id) {
        ev.preventDefault();
        void this.execute(id);
      }
    });
  }
}

function normalizeKeys(combo: string): string {
  return combo
    .split("+")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join("+");
}
