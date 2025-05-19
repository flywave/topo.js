#include "assembly.hh"
#include "binding.hh"
#include "compound.hh"

using namespace flywave;
using namespace flywave::topo;

EMSCRIPTEN_BINDINGS(Assembly) {

  emscripten::enum_<assembly_export_mode>("AssemblyExportMode")
      .value("DEFAULT", assembly_export_mode::defalut_)
      .value("FUSE", assembly_export_mode::fuse)
      .value("PER_PART", assembly_export_mode::per_part);

  emscripten::value_object<assembly_element>("AssemblyElement")
      .field("shape", &assembly_element::shp)
      .field("name", &assembly_element::name)
      .field("location", &assembly_element::location)
      .field("color", &assembly_element::color);

  emscripten::class_<assembly>("Assembly")
      .smart_ptr<std::shared_ptr<assembly>>("Assembly")
      .class_function(
          "create",
          emscripten::optional_override(
              [](emscripten::val objVal, emscripten::val locVal,
                 std::string name, emscripten::val colorVal,
                 emscripten::val metadataVal) {
                assembly_object obj = boost::blank{};
                if (!objVal.isUndefined()) {
                  if (objVal.instanceof(emscripten::val::global("Workplane"))) {
                    obj = objVal.as<std::shared_ptr<workplane>>();
                  } else {
                    obj = objVal.as<shape>();
                  }
                }

                auto loc = locVal.isUndefined()
                               ? nullptr
                               : locVal.as<std::shared_ptr<topo_location>>();
                auto color =
                    colorVal.isUndefined()
                        ? nullptr
                        : colorVal.as<std::shared_ptr<Quantity_Color>>();

                std::unordered_map<std::string, boost::any> metadata;
                if (!metadataVal.isUndefined()) {
                  auto keys = emscripten::vecFromJSArray<std::string>(
                      emscripten::val::global("Object").call<emscripten::val>(
                          "keys", metadataVal));
                  for (const auto &key : keys) {
                    auto val = metadataVal[key];
                    if (val.isString()) {
                      metadata[key] = val.as<std::string>();
                    } else if (val.isNumber()) {
                      metadata[key] = val.as<double>();
                    } else if (val.isTrue() || val.isFalse()) {
                      metadata[key] = val.as<bool>();
                    } else if (val.isNull() || val.isUndefined()) {
                      metadata[key] = boost::any();
                    } else if (val.isArray() ||
                               val.typeOf().as<std::string>() == "object") {
                      metadata[key] = val;
                    }
                  }
                }

                return assembly::create(obj, loc, name, color, metadata);
              }),
          emscripten::allow_raw_pointers())
      .function("copy", emscripten::optional_override([](assembly &self) {
                  return emscripten::val(self.copy());
                }))
      .function(
          "add", emscripten::optional_override([](assembly &self,
                                                  emscripten::val objVal,
                                                  emscripten::val locVal,
                                                  std::string name,
                                                  emscripten::val colorVal,
                                                  emscripten::val metadataVal) {
            if (objVal.instanceof(emscripten::val::global("Assembly"))) {
              auto subAssembly = objVal.as<std::shared_ptr<assembly>>();
              auto loc = locVal.isUndefined()
                             ? nullptr
                             : locVal.as<std::shared_ptr<topo_location>>();
              auto color = colorVal.isUndefined()
                               ? nullptr
                               : std::make_shared<Quantity_Color>(
                                     colorVal.as<Quantity_Color>());
              auto &r = self.add(subAssembly, loc, name, color);
              return emscripten::val(r.shared_from_this());
            } else {
              assembly_object obj = boost::blank{};
              if (!objVal.isUndefined()) {
                if (objVal.instanceof(emscripten::val::global("Workplane"))) {
                  obj = objVal.as<std::shared_ptr<workplane>>();
                } else {
                  obj = objVal.as<shape>();
                }
              }

              auto loc = locVal.isUndefined()
                             ? nullptr
                             : locVal.as<std::shared_ptr<topo_location>>();
              auto color = colorVal.isUndefined()
                               ? nullptr
                               : std::make_shared<Quantity_Color>(
                                     colorVal.as<Quantity_Color>());

              std::unordered_map<std::string, boost::any> metadata;
              if (!metadataVal.isUndefined()) {
                auto keys = emscripten::vecFromJSArray<std::string>(
                    emscripten::val::global("Object").call<emscripten::val>(
                        "keys", metadataVal));
                for (const auto &key : keys) {
                  auto val = metadataVal[key];
                  if (val.isString()) {
                    metadata[key] = val.as<std::string>();
                  } else if (val.isNumber()) {
                    metadata[key] = val.as<double>();
                  } else if (val.isTrue() || val.isFalse()) {
                    metadata[key] = val.as<bool>();
                  } else if (val.isNull() || val.isUndefined()) {
                    metadata[key] = boost::any();
                  } else if (val.isArray() ||
                             val.typeOf().as<std::string>() == "object") {
                    metadata[key] = val;
                  }
                }
              }
              auto &r = self.add(obj, loc, name, color, metadata);
              return emscripten::val(r.shared_from_this());
            }
          }))
      .function("remove", emscripten::optional_override(
                              [](assembly &self, const std::string &name) {
                                auto &r = self.remove(name);
                                return emscripten::val(r.shared_from_this());
                              }))
      .function("shapes", emscripten::optional_override([](assembly &self) {
                  auto shapes = self.shapes();
                  emscripten::val result = emscripten::val::array();
                  for (auto &shape : shapes) {
                    result.call<void>("push", emscripten::val(shape));
                  }
                  return result;
                }))
      .function("traverse",
                emscripten::optional_override(
                    [](assembly &self, emscripten::val callback) {
                      self.traverse([callback](const std::string &name,
                                               const assembly &assm) {
                        callback(name, emscripten::val(assm.shared_from_this()));
                      });
                    }))
      .function("toCompound", emscripten::optional_override([](assembly &self) {
                  return emscripten::val(self.to_compound());
                }))
      .function("flatten", emscripten::optional_override([](assembly &self) {
                  auto flattened = self.flatten();
                  emscripten::val result = emscripten::val::object();
                  for (auto pair : flattened) {
                    result.set(pair.first, emscripten::val(pair.second));
                  }
                  return result;
                }))
      .function("getElements",
                emscripten::optional_override([](assembly &self) {
                  auto elements = self.get_elements();
                  emscripten::val result = emscripten::val::array();
                  for (auto &elem : elements) {
                    result.call<void>("push", emscripten::val(elem));
                  }
                  return result;
                }))
      .function("name", emscripten::optional_override(
                            [](assembly &self) { return self.name(); }))
      .function("location", emscripten::optional_override([](assembly &self) {
                  return emscripten::val(self.location());
                }))
      .function("hasColor", emscripten::optional_override([](assembly &self) {
                  return self.has_color();
                }))
      .function("color", emscripten::optional_override([](assembly &self) {
                  return emscripten::val(self.color());
                }))
      .function("hasObj", emscripten::optional_override(
                              [](assembly &self) { return self.has_obj(); }))
      .function("obj", emscripten::optional_override([](assembly &self) {
                  const auto &obj = self.obj();
                  if (const auto *shapePtr = boost::get<shape>(&obj)) {
                    return emscripten::val(*shapePtr);
                  } else if (const auto *wpPtr =
                                 boost::get<std::shared_ptr<workplane>>(&obj)) {
                    return emscripten::val(*wpPtr);
                  } else {
                    return emscripten::val::null();
                  }
                }))
      .function("children", emscripten::optional_override([](assembly &self) {
                  auto children = self.children();
                  emscripten::val result = emscripten::val::array();
                  for (auto &child : children) {
                    result.call<void>("push", emscripten::val(child));
                  }
                  return result;
                }));
}