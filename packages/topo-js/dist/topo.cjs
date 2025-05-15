"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
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
exports.getTopo = getTopo;
exports.setTopo = setTopo;
//# sourceMappingURL=topo.cjs.map
