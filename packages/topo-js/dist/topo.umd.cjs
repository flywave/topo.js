(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.topo = {}));
})(this, function(exports2) {
  "use strict";
  const topo = {
    library: null
  };
  const setTopo = (oc) => {
    topo.library = oc;
  };
  const getTopo = () => {
    if (!topo.library)
      throw new Error("topo has not been loaded");
    return topo.library;
  };
  exports2.getTopo = getTopo;
  exports2.setTopo = setTopo;
  Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
});
//# sourceMappingURL=topo.umd.cjs.map
