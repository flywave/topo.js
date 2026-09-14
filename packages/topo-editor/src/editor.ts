import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { bracketMatching, foldGutter, foldKeymap } from "@codemirror/language";

export interface EditorAPI {
  /** Get current document text. */
  getCode(): string;
  /** Replace document text. */
  setCode(code: string): void;
  /** Destroy the editor instance. */
  destroy(): void;
}

/**
 * Create a CodeMirror 6 editor inside `container`.
 * @param container  DOM element to mount into.
 * @param onChange   Called (debounced) whenever the document changes.
 */
export function createEditor(
  container: HTMLElement,
  onChange: (code: string) => void,
): EditorAPI {
  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      const code = update.state.doc.toString();
      debouncedChange(code);
    }
  });

  const state = EditorState.create({
    doc: "",
    extensions: [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      foldGutter(),
      bracketMatching(),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...foldKeymap,
      ]),
      javascript(),
      oneDark,
      updateListener,
      EditorView.lineWrapping,
    ],
  });

  const view = new EditorView({
    state,
    parent: container,
  });

  let timer: ReturnType<typeof setTimeout> | null = null;
  const DEBOUNCE_MS = 500;

  function debouncedChange(code: string) {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      onChange(code);
      timer = null;
    }, DEBOUNCE_MS);
  }

  return {
    getCode(): string {
      return view.state.doc.toString();
    },
    setCode(code: string) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: code },
      });
    },
    destroy() {
      if (timer !== null) clearTimeout(timer);
      view.destroy();
    },
  };
}
