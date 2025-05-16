import ocFullJS from "./topo.full.js";
import ocFullWasm from "./topo.full.wasm?url";

const initTopo = ({
  mainJS = ocFullJS,
  mainWasm = ocFullWasm,
  worker = undefined,
  libs = [],
  module = {},
} = {}) => {
  return mainJS({
    locateFile(path) {
      if (path.endsWith('.wasm')) {
        return mainWasm;
      }
      if (path.endsWith('.worker.js') && !!worker) {
        return worker;
      }
      return path;
    },
    ...module
  }).then(async oc => {
    for (let lib of libs) {
      await oc.loadDynamicLibrary(lib, { loadAsync: true, global: true, nodelete: true, allowUndefined: false });
    }
    return oc;
  });
};

export default initTopo;