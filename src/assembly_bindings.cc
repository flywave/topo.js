#include "assembly.hh"
#include "binding.hh"
#include "compound.hh"
#include <Standard_Failure.hxx>

using namespace flywave;
using namespace flywave::topo;

static constraint_param parse_constraint_param(emscripten::val v) {
  if (v.isUndefined() || v.isNull()) {
    return boost::blank{};
  }
  if (v.isNumber()) {
    return v.as<double>();
  }
  if (v.isArray()) {
    size_t len = v["length"].as<size_t>();
    if (len == 2) {
      std::array<double, 2> a = {v[0].as<double>(), v[1].as<double>()};
      return a;
    } else if (len == 3) {
      std::array<double, 3> a = {v[0].as<double>(), v[1].as<double>(),
                                 v[2].as<double>()};
      return a;
    }
  }
  return boost::blank{};
}

EMSCRIPTEN_BINDINGS(Assembly) {

  emscripten::enum_<constraint_kind>("AssemblyConstraintKind")
      .value("Point", constraint_kind::Point)
      .value("Axis", constraint_kind::Axis)
      .value("PointInPlane", constraint_kind::PointInPlane)
      .value("PointOnLine", constraint_kind::PointOnLine)
      .value("Plane", constraint_kind::Plane)
      .value("Fixed", constraint_kind::Fixed)
      .value("FixedPoint", constraint_kind::FixedPoint)
      .value("FixedAxis", constraint_kind::FixedAxis)
      .value("FixedRotation", constraint_kind::FixedRotation);

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
                               : std::make_shared<topo_location>(locVal.as<topo_location>());
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
                             : std::make_shared<topo_location>(locVal.as<topo_location>());
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
                             : std::make_shared<topo_location>(locVal.as<topo_location>());
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
                    emscripten::val obj = emscripten::val::object();
                    obj.set("shape", emscripten::val(elem.shp));
                    obj.set("name",
                            emscripten::val(std::string(elem.name)));
                    obj.set("location", emscripten::val(elem.location));
                    if (elem.color) {
                      obj.set("color", emscripten::val(*elem.color));
                    } else {
                      obj.set("color", emscripten::val::null());
                    }
                    result.call<void>("push", obj);
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
                }))
      .function(
          "constrain",
          emscripten::optional_override([](assembly &self, emscripten::val q1,
                                           emscripten::val q2OrKind,
                                           emscripten::val kindOrParam,
                                           emscripten::val paramVal)
                                             -> emscripten::val {
            try {
              if (q1.isString() && q2OrKind.isString()) {
                // constrain(q1, q2, kind, param?)
                constraint_kind kind = q2OrKind.as<constraint_kind>();
                constraint_param p =
                    kindOrParam.isUndefined()
                        ? constraint_param(boost::blank{})
                        : parse_constraint_param(kindOrParam);
                self.constrain(q1.as<std::string>(), q2OrKind.as<std::string>(),
                               kind, p);
              } else if (q1.isString() && !q2OrKind.isString() &&
                         !q2OrKind.isUndefined()) {
                // constrain(q1, kind, param?)
                constraint_kind kind = q2OrKind.as<constraint_kind>();
                constraint_param p =
                    kindOrParam.isUndefined()
                        ? constraint_param(boost::blank{})
                        : parse_constraint_param(kindOrParam);
                self.constrain(q1.as<std::string>(), kind, p);
              } else {
                emscripten::val::global("Error")
                    .new_(std::string("Assembly.constrain: invalid arguments"))
                    .throw_();
              }
              return emscripten::val(self.shared_from_this());
            } catch (const Standard_Failure &f) {
              emscripten::val::global("Error")
                  .new_(std::string("Assembly.constrain: ") +
                        (f.GetMessageString() ? f.GetMessageString()
                                              : f.DynamicType()->Name()))
                  .throw_();
            } catch (const std::exception &e) {
              emscripten::val::global("Error")
                  .new_(std::string("Assembly.constrain: ") + e.what())
                  .throw_();
            }
            return emscripten::val::undefined();
          }),
          emscripten::allow_raw_pointers())
      .function(
          "constrain1",
          emscripten::optional_override(
              [](assembly &self, const std::string &q1,
                 constraint_kind kind, emscripten::val paramVal)
                  -> emscripten::val {
                try {
                  constraint_param p =
                      paramVal.isUndefined()
                          ? constraint_param(boost::blank{})
                          : parse_constraint_param(paramVal);
                  self.constrain(q1, kind, p);
                  return emscripten::val(self.shared_from_this());
                } catch (const Standard_Failure &f) {
                  emscripten::val::global("Error")
                      .new_(std::string("Assembly.constrain1: ") +
                            (f.GetMessageString() ? f.GetMessageString()
                                                  : f.DynamicType()->Name()))
                      .throw_();
                } catch (const std::exception &e) {
                  emscripten::val::global("Error")
                      .new_(std::string("Assembly.constrain1: ") + e.what())
                      .throw_();
                }
                return emscripten::val::undefined();
              }),
          emscripten::allow_raw_pointers())
      .function(
          "constrain2",
          emscripten::optional_override(
              [](assembly &self, const std::string &id1, emscripten::val s1Val,
                 const std::string &id2, emscripten::val s2Val,
                 constraint_kind kind, emscripten::val paramVal)
                  -> emscripten::val {
                try {
                  shape s1 = s1Val.as<shape>();
                  shape s2 = s2Val.as<shape>();
                  constraint_param p =
                      paramVal.isUndefined()
                          ? constraint_param(boost::blank{})
                          : parse_constraint_param(paramVal);
                  self.constrain(id1, s1, id2, s2, kind, p);
                  return emscripten::val(self.shared_from_this());
                } catch (const Standard_Failure &f) {
                  emscripten::val::global("Error")
                      .new_(std::string("Assembly.constrain2: ") +
                            (f.GetMessageString() ? f.GetMessageString()
                                                  : f.DynamicType()->Name()))
                      .throw_();
                } catch (const std::exception &e) {
                  emscripten::val::global("Error")
                      .new_(std::string("Assembly.constrain2: ") + e.what())
                      .throw_();
                }
                return emscripten::val::undefined();
              }),
          emscripten::allow_raw_pointers())
      .function(
          "constrain3",
          emscripten::optional_override(
              [](assembly &self, const std::string &id1, emscripten::val s1Val,
                 constraint_kind kind, emscripten::val paramVal)
                  -> emscripten::val {
                try {
                  shape s1 = s1Val.as<shape>();
                  constraint_param p =
                      paramVal.isUndefined()
                          ? constraint_param(boost::blank{})
                          : parse_constraint_param(paramVal);
                  self.constrain(id1, s1, kind, p);
                  return emscripten::val(self.shared_from_this());
                } catch (const Standard_Failure &f) {
                  emscripten::val::global("Error")
                      .new_(std::string("Assembly.constrain3: ") +
                            (f.GetMessageString() ? f.GetMessageString()
                                                  : f.DynamicType()->Name()))
                      .throw_();
                } catch (const std::exception &e) {
                  emscripten::val::global("Error")
                      .new_(std::string("Assembly.constrain3: ") + e.what())
                      .throw_();
                }
                return emscripten::val::undefined();
              }),
          emscripten::allow_raw_pointers())
      .function(
          "solve",
          emscripten::optional_override([](assembly &self, int verbosity)
                                            -> emscripten::val {
            try {
              self.solve(verbosity);
            } catch (const Standard_Failure &f) {
              emscripten::val::global("Error")
                  .new_(std::string("Assembly.solve: ") +
                        (f.GetMessageString() ? f.GetMessageString()
                                              : f.DynamicType()->Name()))
                  .throw_();
            } catch (const std::exception &e) {
              emscripten::val::global("Error")
                  .new_(std::string("Assembly.solve: ") + e.what())
                  .throw_();
            }
            return emscripten::val(self.shared_from_this());
          }),
          emscripten::allow_raw_pointers())
      .function("hasError", emscripten::optional_override(
                                [](assembly &self) { return self.has_error(); }))
      .function("getError", emscripten::optional_override(
                                [](assembly &self) -> emscripten::val {
                                  if (self.has_error()) {
                                    return emscripten::val(self.error());
                                  }
                                  return emscripten::val::null();
                                }));
}