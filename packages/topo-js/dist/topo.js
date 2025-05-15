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
export {
  getTopo,
  setTopo
};
//# sourceMappingURL=topo.js.map
