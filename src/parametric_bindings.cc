// parametric_bindings — Embind surface for the C++ parametric recipe
// factory (assembly-level): JS builders register by type name, node recipes
// ride assembly metadata, rebuild dispatches server-side-identically.
// The params JSON is opaque here; JS builders JSON.parse it themselves.
#include <emscripten/bind.h>
#include <emscripten/val.h>

#include <memory>
#include <stdexcept>
#include <string>

#include "assembly.hh"
#include "parametric.hh"

using namespace emscripten;

namespace flywave {
namespace topo {
namespace {

// The JS builder contract: fn(params: string) -> { shape, location? }.
// Adapted once at registration; the C++ registry stores the std::function,
// so long builds never touch JS re-entrancy bookkeeping.
parametric_builder adapt_js_builder(val fn) {
  return [fn](const std::string &params) -> parametric_build_result {
    val r = fn(params);
    parametric_build_result out;
    out.shp = r["shape"].as<shape>();
    val locVal = r["location"];
    if (!locVal.isUndefined() && !locVal.isNull()) {
      out.loc = std::make_shared<topo_location>(locVal.as<topo_location>());
    }
    return out;
  };
}

} // namespace
} // namespace topo
} // namespace flywave

EMSCRIPTEN_BINDINGS(Parametric) {
  using namespace flywave::topo;

  value_object<parametric_data>("ParametricData")
      .field("type", &parametric_data::type)
      .field("params", &parametric_data::params);

  // registerParametricBuilder(type, fn | null) — null 注销 (go 语义)
  function("registerParametricBuilder",
           optional_override([](const std::string &type, val fn) {
             if (fn.isNull() || fn.isUndefined()) {
               register_parametric_builder(type, nullptr);
               return;
             }
             register_parametric_builder(type, adapt_js_builder(std::move(fn)));
           }));

  function("hasParametricBuilder", &has_parametric_builder);

  // buildParametric(type, params) -> { shape, location? }; 抛 JS Error
  // (文案与 go 逐字对齐, 上层统一呈现)
  function("buildParametric",
           optional_override([](const std::string &type,
                                const std::string &params) -> val {
             try {
               auto r = build_parametric(type, params);
               val out = val::object();
               out.set("shape", r.shp);
               if (r.loc) {
                 out.set("location", *r.loc);
               }
               return out;
             } catch (const std::exception &e) {
               val::global("Error")
                   .new_(std::string("buildParametric: ") + e.what())
                   .throw_();
             }
             return val::undefined();
           }));

  // 节点挂载: assembly 经 val 引用 (已绑定的 Assembly smart_ptr)
  function("setAssemblyParametric",
           optional_override([](val assemblyVal, val dataVal) {
             auto a = assemblyVal.as<std::shared_ptr<assembly>>();
             if (!a) {
               val::global("Error").new_(std::string("setAssemblyParametric: null assembly")).throw_();
               return;
             }
             parametric_data data;
             data.type = dataVal["type"].as<std::string>();
             data.params = dataVal.hasOwnProperty("params") && !dataVal["params"].isUndefined()
                               ? dataVal["params"].as<std::string>()
                               : std::string();
             set_parametric(*a, data);
           }));

  function("getAssemblyParametric",
           optional_override([](val assemblyVal) -> val {
             auto a = assemblyVal.as<std::shared_ptr<assembly>>();
             if (!a) {
               return val::undefined();
             }
             auto data = get_parametric(*a);
             if (!data) {
               return val::undefined();
             }
             val out = val::object();
             out.set("type", data->type);
             out.set("params", data->params);
             return out;
           }));
}
