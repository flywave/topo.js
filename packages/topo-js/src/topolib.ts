import { TopoInstance } from "topo-wasm-binging";

const topo: { library: TopoInstance | null } = {
    library: null,
};

export const setTopo = (oc: TopoInstance): void => {
    topo.library = oc;
};

export const getTopo = (): TopoInstance => {
    if (!topo.library) throw new Error("topo has not been loaded");
    return topo.library;
};