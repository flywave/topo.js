import init, { TopoInstance } from "./topo.full";
export * from "./topo.full";

type TopoModuleObject = {
  [key: string]: any;
};

export default function initTopo(
  settings?: {
    mainJS?: init;
    mainWasm?: string;
    worker?: string;
    libs?: string[];
    module?: TopoModuleObject;
  },
): Promise<TopoInstance>;