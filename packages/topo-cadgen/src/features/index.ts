// features/index — the built-in panel set, one call to register. The host
// page composes: new EditorApp(...) → registerBuiltinPanels(app) →
// app.mountPanel(id, el) into its own layout. Panels stay individually
// registrable; this helper is only the convenience bundle.
import type { EditorApp } from "../app.js";
import { createParamsPanel } from "./params.js";
import { createEditChatPanel } from "./editChat.js";
import { createFeatureTreePanel } from "./featureTree.js";
import { createPropertiesPanel, createExportsPanel } from "./properties.js";
import { createAssemblyPanel } from "./assembly.js";
import { createCreationPanel } from "./creation.js";
import { createVersionsPanel } from "./versions.js";

export function registerBuiltinPanels(app: EditorApp): void {
  app.registerPanel(createCreationPanel(app));
  app.registerPanel(createFeatureTreePanel(app));
  app.registerPanel(createParamsPanel(app));
  app.registerPanel(createEditChatPanel(app));
  app.registerPanel(createPropertiesPanel(app));
  app.registerPanel(createExportsPanel(app));
  app.registerPanel(createAssemblyPanel(app));
  app.registerPanel(createVersionsPanel(app));
}
