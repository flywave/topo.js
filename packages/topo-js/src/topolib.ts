import initTopo, { TopoInstance } from "topo-wasm";

const topo: { library: TopoInstance | null } = {
  library: null,
};

export const getTopo = (): TopoInstance => {
  if (!topo.library) throw new Error("topo has not been loaded");
  return topo.library;
};

let initPromise: Promise<TopoInstance> | undefined = undefined;

export const requestTopoInstance = async (): Promise<TopoInstance> => {
  if (topo.library) {
    return topo.library;
  }
  if (initPromise) {
    return initPromise;
  }

  initPromise = initTopo();
  topo.library = await initPromise;
  return topo.library;
};

requestTopoInstance();
