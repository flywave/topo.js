#include <emscripten/bind.h>
#include <string>
#include <vector>

#include "dxf.hh"
#include "dxf_shape.hh"

using namespace emscripten;
using namespace flywave::dxf;

// Register std::vector<std::string> for embind marshalling
static std::vector<std::string> getLayerNamesAsVector(const dxf_shape_reader &r) {
    std::vector<std::string> result;
    for (const auto &name : r.layer_names()) {
        result.push_back(name);
    }
    return result;
}

EMSCRIPTEN_BINDINGS(dxf) {
    register_vector<std::string>("StringVector");

    class_<dxf_shape_reader>("DxfShapeReader")
        .constructor<std::string>()
        .function("failed", emscripten::optional_override(
            [](const dxf_shape_reader &self) -> bool {
                return self.failed();
            }))
        .function("doRead", emscripten::optional_override(
            [](dxf_shape_reader &self) {
                self.do_read();
            }))
        .function("error", emscripten::optional_override(
            [](const dxf_shape_reader &self) -> std::string {
                return self.error();
            }))
        .function("getLayerNames", &getLayerNamesAsVector);

    class_<dxf_shape_writer>("DxfShapeWriter")
        .constructor<std::string>()
        .function("write", emscripten::optional_override(
            [](dxf_shape_writer &self) -> bool {
                return self.write();
            }));
}
