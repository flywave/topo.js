// features/index — the built-in panel set, one call to register. The host
// page composes: new EditorApp(...) → registerBuiltinPanels(app) →
// app.mountPanel(id, el) into its own layout. Panels stay individually
// registrable; this helper is only the convenience bundle.
import type { EditorApp } from "../app.js";
import { createParamsPanel } from "./params.js";
import { createEditChatPanel } from "./editChat.js";

export function registerBuiltinPanels(app: EditorApp): void {
  app.registerPanel(createParamsPanel(app));
  app.registerPanel(createEditChatPanel(app));
}
