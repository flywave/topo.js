#include "binding.hh"
#include "workplane.hh"

using namespace flywave;
using namespace flywave::topo;

EMSCRIPTEN_BINDINGS(Workplane) {

  // 封装 shape_object_type 枚举
  enum_<shape_object_type>("ShapeObjectType")
      .value("COMPOUND", shape_object_type::compound)
      .value("COMPSOLID", shape_object_type::comp_solid)
      .value("SOLID", shape_object_type::solid)
      .value("SHELL", shape_object_type::shell)
      .value("FACE", shape_object_type::face)
      .value("WIRE", shape_object_type::wire)
      .value("EDGE", shape_object_type::edge)
      .value("VERTEX", shape_object_type::vertex)
      .value("SHAPE", shape_object_type::shape)
      .value("VECTOR", shape_object_type::vector)
      .value("LOCATION", shape_object_type::location)
      .value("SKETCH", shape_object_type::sketch)
      .value("BLANK", shape_object_type::blank);

  // 封装 combine_mode_type 枚举
  enum_<combine_mode_type>("CombineModeType")
      .value("CUT", combine_mode_type::cut)
      .value("ADDITIVE", combine_mode_type::additive)
      .value("SUBTRACTIVE", combine_mode_type::subtractive);

  // 封装 center_option 枚举
  enum_<center_option>("CenterOption")
      .value("CENTER_OF_MASS", center_option::CenterOfMass)
      .value("PROJECTED_ORIGIN", center_option::ProjectedOrigin)
      .value("CENTER_OF_BOUND_BOX", center_option::CenterOfBoundBox);

  // 封装 face_index_type 枚举
  enum_<face_index_type>("FaceIndexType")
      .value("CURRENT", face_index_type::curent)
      .value("NEXT", face_index_type::next);

  class_<workplane>("Workplane")
      .smart_ptr<std::shared_ptr<workplane>>("Workplane")
      // 默认构造函数
      .constructor(emscripten::optional_override(
          [] { return std::make_shared<workplane>(); }))
      // 统一处理 plane 和 planeName 的构造函数
      .constructor(
          emscripten::optional_override([](emscripten::val planeOrName,
                                           emscripten::val originVal,
                                           emscripten::val objVal) {
            topo_vector *origin = nullptr;
            if (!originVal.isUndefined() && !originVal.isNull()) {
              auto or = originVal.as<topo_vector>();
              origin = &or ;
            }

            shape_object obj;
            if (!objVal.isUndefined()) {
              if (objVal.instanceof(emscripten::val::global("Shape"))) {
                obj = objVal.as<shape>();
              } else if (objVal.instanceof(emscripten::val::global("Vector"))) {
                obj = objVal.as<topo_vector>();
              } else if (objVal.instanceof(
                             emscripten::val::global("Location"))) {
                obj = objVal.as<topo_location>();
              } else if (objVal.instanceof(emscripten::val::global("Sketch"))) {
                obj = objVal.as<std::shared_ptr<sketch>>();
              }
            }

            if (planeOrName.isString()) {
              std::string planeName = planeOrName.as<std::string>();
              return std::make_shared<workplane>(planeName, origin, obj);
            } else {
              auto plane = planeOrName.as<topo_plane>();
              return std::make_shared<workplane>(plane, origin, obj);
            }
          }),
          emscripten::allow_raw_pointers())
      .class_function(
          "getShapeObjectType",
          emscripten::optional_override([](emscripten::val objVal)
                                            -> shape_object_type {
            if (objVal.isUndefined() || objVal.isNull()) {
              return shape_object_type::blank;
            }

            if (objVal.instanceof(emscripten::val::global("Shape"))) {
              return shape_object_type::shape;
            } else if (objVal.instanceof(emscripten::val::global("Vector"))) {
              return shape_object_type::vector;
            } else if (objVal.instanceof(emscripten::val::global("Location"))) {
              return shape_object_type::location;
            } else if (objVal.instanceof(emscripten::val::global("Sketch"))) {
              return shape_object_type::sketch;
            } else {
              return shape_object_type::blank;
            }
          }),
          emscripten::allow_raw_pointers())
      .function("value", &workplane::value)
      .function(
          "create",
          emscripten::optional_override(
              [](workplane &self, emscripten::val offsetVal,
                 emscripten::val invertVal, emscripten::val centerOptionVal,
                 emscripten::val originVal) {
                double offset =
                    offsetVal.isUndefined() ? 0.0 : offsetVal.as<double>();
                bool invert =
                    invertVal.isUndefined() ? false : invertVal.as<bool>();
                center_option centerOpt = center_option::ProjectedOrigin;
                if (!centerOptionVal.isUndefined()) {
                  centerOpt = centerOptionVal.as<center_option>();
                }

                topo_vector *origin = nullptr;
                if (!originVal.isUndefined() && !originVal.isNull()) {
                  auto or = originVal.as<topo_vector>();
                  origin = &or ;
                }

                auto result = self.create(offset, invert, centerOpt, origin);
                return emscripten::val(result);
              }),
          emscripten::allow_raw_pointers())
      .function("splitByPlane",
                emscripten::optional_override(
                    [](workplane &self, bool keepTop, bool keepBottom) {
                      auto result = self.split(keepTop, keepBottom);
                      return emscripten::val(result);
                    }))
      .function("splitByShape",
                emscripten::optional_override(
                    [](workplane &self, emscripten::val splitterVal) {
                      auto splitter = splitterVal.as<shape>();
                      auto result = self.split(splitter);
                      return emscripten::val(result);
                    }))
      .function("splitByWorkplane",
                emscripten::optional_override([](workplane &self,
                                                 emscripten::val splitterVal) {
                  auto splitter = splitterVal.as<std::shared_ptr<workplane>>();
                  auto result = self.split(*splitter);
                  return emscripten::val(result);
                }))
      .function(
          "add",
          emscripten::optional_override([](workplane &self,
                                           emscripten::val arg) {
            if (arg.instanceof(emscripten::val::global("Workplane"))) {
              auto other = arg.as<std::shared_ptr<workplane>>();
              return emscripten::val(self.add(*other));
            } else if (arg.isArray()) {
              std::vector<shape_object> objs;
              const size_t len = arg["length"].as<size_t>();
              objs.reserve(len);
              for (size_t i = 0; i < len; ++i) {
                emscripten::val item = arg[i];
                if (item.instanceof(emscripten::val::global("Shape"))) {
                  objs.push_back(item.as<shape>());
                } else if (item.instanceof(emscripten::val::global("Vector"))) {
                  objs.push_back(item.as<topo_vector>());
                } else if (item.instanceof(
                               emscripten::val::global("Location"))) {
                  objs.push_back(item.as<topo_location>());
                } else if (item.instanceof(emscripten::val::global("Sketch"))) {
                  objs.push_back(item.as<std::shared_ptr<sketch>>());
                }
              }
              return emscripten::val(self.add(objs));
            } else {
              shape_object obj;
              if (arg.instanceof(emscripten::val::global("Shape"))) {
                obj = arg.as<shape>();
              } else if (arg.instanceof(emscripten::val::global("Vector"))) {
                obj = arg.as<topo_vector>();
              } else if (arg.instanceof(emscripten::val::global("Location"))) {
                obj = arg.as<topo_location>();
              } else if (arg.instanceof(emscripten::val::global("Sketch"))) {
                obj = arg.as<std::shared_ptr<sketch>>();
              }
              return emscripten::val(self.add(obj));
            }
          }),
          emscripten::allow_raw_pointers())
      .function("copy", emscripten::optional_override([](workplane &self) {
                  return emscripten::val(self.copy_workplane(self));
                }))
      .function("fromTagged",
                emscripten::optional_override(
                    [](workplane &self, const std::string &name) {
                      return emscripten::val(self.from_tagged(name));
                    }))
      .function("first", emscripten::optional_override([](workplane &self) {
                  return emscripten::val(self.first());
                }))
      .function("item",
                emscripten::optional_override([](workplane &self, size_t i) {
                  return emscripten::val(self.item(i));
                }))
      .function("last", emscripten::optional_override([](workplane &self) {
                  return emscripten::val(self.last());
                }))
      .function("end",
                emscripten::optional_override([](workplane &self, int n) {
                  return emscripten::val(self.end(n));
                }))
      .function("clean", emscripten::optional_override([](workplane &self) {
                  return emscripten::val(self.clean());
                }))
      .function("tag", emscripten::optional_override(
                           [](workplane &self, const std::string &name) {
                             self.tag(name);
                             return emscripten::val(self.shared_from_this());
                           }))
      .function("findSolid",
                emscripten::optional_override(
                    [](workplane &self, bool searchStack, bool searchParents) {
                      auto result = self.find_solid(searchStack, searchParents);
                      return emscripten::val(result);
                    }))
      .function("vertices",
                emscripten::optional_override([](workplane &self,
                                                 emscripten::val selectorVal,
                                                 const std::string &tag = "") {
                  if (selectorVal.isString()) {
                    auto selector = selectorVal.as<std::string>();
                    return emscripten::val(self.vertices(selector, tag));
                  } else {
                    auto sel = selectorVal.as<selector_ptr>();
                    return emscripten::val(self.vertices(sel, tag));
                  }
                }))
      .function("faces",
                emscripten::optional_override([](workplane &self,
                                                 emscripten::val selectorVal,
                                                 const std::string &tag = "") {
                  if (selectorVal.isString()) {
                    auto selector = selectorVal.as<std::string>();
                    return emscripten::val(self.faces(selector, tag));
                  } else {
                    auto sel = selectorVal.as<selector_ptr>();
                    return emscripten::val(self.faces(sel, tag));
                  }
                }))
      .function("edges",
                emscripten::optional_override([](workplane &self,
                                                 emscripten::val selectorVal,
                                                 const std::string &tag = "") {
                  if (selectorVal.isString()) {
                    auto selector = selectorVal.as<std::string>();
                    return emscripten::val(self.edges(selector, tag));
                  } else {
                    auto sel = selectorVal.as<selector_ptr>();
                    return emscripten::val(self.edges(sel, tag));
                  }
                }))
      .function("wires",
                emscripten::optional_override([](workplane &self,
                                                 emscripten::val selectorVal,
                                                 const std::string &tag = "") {
                  if (selectorVal.isString()) {
                    auto selector = selectorVal.as<std::string>();
                    return emscripten::val(self.wires(selector, tag));
                  } else {
                    auto sel = selectorVal.as<selector_ptr>();
                    return emscripten::val(self.wires(sel, tag));
                  }
                }))
      .function("solids",
                emscripten::optional_override([](workplane &self,
                                                 emscripten::val selectorVal,
                                                 const std::string &tag = "") {
                  if (selectorVal.isString()) {
                    auto selector = selectorVal.as<std::string>();
                    return emscripten::val(self.solids(selector, tag));
                  } else {
                    auto sel = selectorVal.as<selector_ptr>();
                    return emscripten::val(self.solids(sel, tag));
                  }
                }))
      .function("shells",
                emscripten::optional_override([](workplane &self,
                                                 emscripten::val selectorVal,
                                                 const std::string &tag = "") {
                  if (selectorVal.isString()) {
                    auto selector = selectorVal.as<std::string>();
                    return emscripten::val(self.shells(selector, tag));
                  } else {
                    auto sel = selectorVal.as<selector_ptr>();
                    return emscripten::val(self.shells(sel, tag));
                  }
                }))
      .function("compounds",
                emscripten::optional_override([](workplane &self,
                                                 emscripten::val selectorVal,
                                                 const std::string &tag = "") {
                  if (selectorVal.isString()) {
                    auto selector = selectorVal.as<std::string>();
                    return emscripten::val(self.compounds(selector, tag));
                  } else {
                    auto sel = selectorVal.as<selector_ptr>();
                    return emscripten::val(self.compounds(sel, tag));
                  }
                }))
      .function("ancestors",
                emscripten::optional_override([](workplane &self,
                                                 TopAbs_ShapeEnum kind,
                                                 emscripten::val tagVal) {
                  boost::optional<std::string> tag = boost::none;
                  if (!tagVal.isUndefined() && !tagVal.isNull()) {
                    tag = tagVal.as<std::string>();
                  }
                  return emscripten::val(self.ancestors(kind, tag));
                }))
      .function("siblings",
                emscripten::optional_override(
                    [](workplane &self, TopAbs_ShapeEnum kind, int level,
                       emscripten::val tagVal) {
                      boost::optional<std::string> tag = boost::none;
                      if (!tagVal.isUndefined() && !tagVal.isNull()) {
                        tag = tagVal.as<std::string>();
                      }
                      return emscripten::val(self.siblings(kind, level, tag));
                    }))
      .function("rotateAboutCenter",
                emscripten::optional_override([](workplane &self,
                                                 emscripten::val axisEndPoint,
                                                 double angleDegrees) {
                  auto point = axisEndPoint.as<gp_Pnt>();
                  return emscripten::val(
                      self.rotate_about_center(point, angleDegrees));
                }))
      .function("rotate",
                emscripten::optional_override([](workplane &self,
                                                 emscripten::val axisStartPoint,
                                                 emscripten::val axisEndPoint,
                                                 double angleDegrees) {
                  auto start = axisStartPoint.as<gp_Pnt>();
                  auto end = axisEndPoint.as<gp_Pnt>();
                  return emscripten::val(self.rotate(start, end, angleDegrees));
                }))

      .function(
          "mirror",
          emscripten::optional_override(
              [](workplane &self, emscripten::val mirrorObj,
                 emscripten::val basePointVal = emscripten::val::undefined(),
                 bool unionResult = false) {
                gp_Pnt basePoint;
                if (!basePointVal.isUndefined()) {
                  basePoint = basePointVal.as<gp_Pnt>();
                }

                if (mirrorObj.isString()) {
                  auto planeName = mirrorObj.as<std::string>();
                  return emscripten::val(
                      self.mirror(planeName, basePoint, unionResult));
                } else if (mirrorObj.typeOf().as<std::string>() == "gp_Vec") {
                  auto normal = mirrorObj.as<gp_Vec>();
                  return emscripten::val(
                      self.mirror(normal, basePoint, unionResult));
                } else if (mirrorObj.typeOf().as<std::string>() == "face") {
                  auto mirrorFace = mirrorObj.as<face>();
                  return emscripten::val(
                      self.mirror(mirrorFace, basePoint, unionResult));
                } else {
                  auto mirrorPlane = mirrorObj.as<workplane>();
                  return emscripten::val(
                      self.mirror(mirrorPlane, basePoint, unionResult));
                }
              }))
      .function("translate", emscripten::optional_override(
                                 [](workplane &self, emscripten::val vecVal) {
                                   auto vec = vecVal.as<gp_Vec>();
                                   return emscripten::val(self.translate(vec));
                                 }))
      .function(
          "shell",
          emscripten::optional_override(
              [](workplane &self, double thickness, const std::string &kind) {
                return emscripten::val(self.shell(thickness, kind));
              }))
      .function("fillet", emscripten::optional_override(
                              [](workplane &self, double radius) {
                                return emscripten::val(self.fillet(radius));
                              }))
      .function("chamfer",
                emscripten::optional_override([](workplane &self, double length,
                                                 emscripten::val length2Val) {
                  boost::optional<double> length2 = boost::none;
                  if (!length2Val.isUndefined()) {
                    length2 = length2Val.as<double>();
                  }
                  return emscripten::val(self.chamfer(length, length2));
                }))
      .function("transformed",
                emscripten::optional_override([](workplane &self,
                                                 emscripten::val rotateVal,
                                                 emscripten::val offsetVal) {
                  auto rotate = rotateVal.as<gp_Vec>();
                  auto offset = offsetVal.as<gp_Vec>();
                  return emscripten::val(self.transformed(rotate, offset));
                }))
      .function(
          "rarray",
          emscripten::optional_override(
              [](workplane &self, double xSpacing, double ySpacing, int xCount,
                 int yCount, emscripten::val centerVal) {
                if (centerVal.isUndefined()) {
                  return emscripten::val(
                      self.rarray(xSpacing, ySpacing, xCount, yCount));
                } else if (centerVal.typeOf().as<std::string>() == "boolean") {
                  bool centerAll = centerVal.as<bool>();
                  return emscripten::val(self.rarray(xSpacing, ySpacing, xCount,
                                                     yCount, centerAll));
                } else {
                  auto center = centerVal.as<std::pair<bool, bool>>();
                  return emscripten::val(
                      self.rarray(xSpacing, ySpacing, xCount, yCount, center));
                }
              }))
      .function("polarArray",
                emscripten::optional_override(
                    [](workplane &self, double radius, double startAngle,
                       double angle, int count, bool fill, bool rotate) {
                      return emscripten::val(self.polar_array(
                          radius, startAngle, angle, count, fill, rotate));
                    }))
      .function("pushPoints",
                emscripten::optional_override(
                    [](workplane &self, emscripten::val pntListVal) {
                      if (pntListVal["length"].as<unsigned>() == 0) {
                        return emscripten::val(
                            self.push_points(std::vector<topo_location>{}));
                      }

                      auto first = pntListVal[0];
                      if (first.typeOf().as<std::string>() == "Location") {
                        std::vector<topo_location> points;
                        for (unsigned i = 0;
                             i < pntListVal["length"].as<unsigned>(); i++) {
                          points.push_back(pntListVal[i].as<topo_location>());
                        }
                        return emscripten::val(self.push_points(points));
                      } else {
                        std::vector<topo_vector> points;
                        for (unsigned i = 0;
                             i < pntListVal["length"].as<unsigned>(); i++) {
                          points.push_back(pntListVal[i].as<topo_vector>());
                        }
                        return emscripten::val(self.push_points(points));
                      }
                    }))
      .function("center", emscripten::optional_override(
                              [](workplane &self, double x, double y) {
                                return emscripten::val(self.center(x, y));
                              }))
      .function("lineTo", emscripten::optional_override(
                              [](workplane &self, double x, double y,
                                 emscripten::val forConstructionVal) {
                                bool forConstruction =
                                    forConstructionVal.isUndefined()
                                        ? false
                                        : forConstructionVal.as<bool>();
                                return emscripten::val(
                                    self.line_to(x, y, forConstruction));
                              }))
      .function(
          "bezier",
          emscripten::optional_override(
              [](workplane &self, emscripten::val pointsVal,
                 bool forConstruction, bool includeCurrent, bool makeWire) {
                std::vector<topo_vector> points;
                for (unsigned i = 0; i < pointsVal["length"].as<unsigned>();
                     i++) {
                  points.push_back(pointsVal[i].as<topo_vector>());
                }
                return emscripten::val(self.bezier(points, forConstruction,
                                                   includeCurrent, makeWire));
              }))
      .function(
          "line",
          emscripten::optional_override([](workplane &self, double xDist,
                                           double yDist, bool forConstruction) {
            return emscripten::val(self.line(xDist, yDist, forConstruction));
          }))
      .function("vline",
                emscripten::optional_override(
                    [](workplane &self, double distance, bool forConstruction) {
                      return emscripten::val(
                          self.vline(distance, forConstruction));
                    }))
      .function("hline",
                emscripten::optional_override(
                    [](workplane &self, double distance, bool forConstruction) {
                      return emscripten::val(
                          self.hline(distance, forConstruction));
                    }))
      .function("vlineTo",
                emscripten::optional_override(
                    [](workplane &self, double yCoord, bool forConstruction) {
                      return emscripten::val(
                          self.vline_to(yCoord, forConstruction));
                    }))
      .function("hlineTo",
                emscripten::optional_override(
                    [](workplane &self, double xCoord, bool forConstruction) {
                      return emscripten::val(
                          self.hline_to(xCoord, forConstruction));
                    }))
      .function("polarLine", emscripten::optional_override(
                                 [](workplane &self, double distance,
                                    double angle, bool forConstruction) {
                                   return emscripten::val(self.polar_line(
                                       distance, angle, forConstruction));
                                 }))
      .function("polarLineTo", emscripten::optional_override(
                                   [](workplane &self, double distance,
                                      double angle, bool forConstruction) {
                                     return emscripten::val(self.polar_line_to(
                                         distance, angle, forConstruction));
                                   }))
      .function("moveTo", emscripten::optional_override(
                              [](workplane &self, double x, double y) {
                                return emscripten::val(self.move_to(x, y));
                              }))
      .function("move", emscripten::optional_override(
                            [](workplane &self, double xDist, double yDist) {
                              return emscripten::val(self.move(xDist, yDist));
                            }))
      .function(
          "slot2d",
          emscripten::optional_override([](workplane &self, double length,
                                           double diameter, double angle) {
            return emscripten::val(self.slot2d(length, diameter, angle));
          }))
      .function("spline",
                emscripten::optional_override(
                    [](workplane &self, emscripten::val pointsVal,
                       emscripten::val tangentsVal, bool periodic,
                       emscripten::val parametersVal, bool scale,
                       emscripten::val tolVal, bool forConstruction,
                       bool includeCurrent, bool makeWire) {
                      std::vector<gp_Pnt> points;
                      for (unsigned i = 0;
                           i < pointsVal["length"].as<unsigned>(); i++) {
                        points.push_back(pointsVal[i].as<gp_Pnt>());
                      }

                      boost::optional<std::vector<gp_Vec>> tangents;
                      if (!tangentsVal.isUndefined()) {
                        std::vector<gp_Vec> t;
                        for (unsigned i = 0;
                             i < tangentsVal["length"].as<unsigned>(); i++) {
                          t.push_back(tangentsVal[i].as<gp_Vec>());
                        }
                        tangents = t;
                      }

                      boost::optional<std::vector<double>> parameters;
                      if (!parametersVal.isUndefined()) {
                        std::vector<double> p;
                        for (unsigned i = 0;
                             i < parametersVal["length"].as<unsigned>(); i++) {
                          p.push_back(parametersVal[i].as<double>());
                        }
                        parameters = p;
                      }

                      boost::optional<double> tol;
                      if (!tolVal.isUndefined()) {
                        tol = tolVal.as<double>();
                      }

                      return emscripten::val(self.spline(
                          points, tangents, periodic, parameters, scale, tol,
                          forConstruction, includeCurrent, makeWire));
                    }))
      .function(
          "splineApprox",
          emscripten::optional_override(
              [](workplane &self, emscripten::val pointsVal, int minDeg,
                 int maxDeg, emscripten::val tolVal,
                 emscripten::val smoothingVal, bool forConstruction,
                 bool includeCurrent, bool makeWire) {
                std::vector<gp_Pnt> points;
                for (unsigned i = 0; i < pointsVal["length"].as<unsigned>();
                     i++) {
                  points.push_back(pointsVal[i].as<gp_Pnt>());
                }

                boost::optional<double> tol;
                if (!tolVal.isUndefined()) {
                  tol = tolVal.as<double>();
                }

                boost::optional<std::tuple<double, double, double>> smoothing;
                if (!smoothingVal.isUndefined()) {
                  smoothing = std::make_tuple(smoothingVal[0].as<double>(),
                                              smoothingVal[1].as<double>(),
                                              smoothingVal[2].as<double>());
                }

                return emscripten::val(self.spline_approx(
                    points, tol, minDeg, maxDeg, smoothing, forConstruction,
                    includeCurrent, makeWire));
              }))
      .function(
          "parametricCurve",
          emscripten::optional_override(
              [](workplane &self, emscripten::val funcVal, int N, double start,
                 double stop, double tol, int minDeg, int maxDeg,
                 emscripten::val smoothingVal, bool makeWire) {
                auto func = [funcVal](double t) {
                  return funcVal(t).as<gp_Pnt>();
                };

                auto smoothing = std::make_tuple(smoothingVal[0].as<double>(),
                                                 smoothingVal[1].as<double>(),
                                                 smoothingVal[2].as<double>());

                return emscripten::val(
                    self.parametric_curve(func, N, start, stop, tol, minDeg,
                                          maxDeg, smoothing, makeWire));
              }))
      .function(
          "parametricSurface",
          emscripten::optional_override(
              [](workplane &self, emscripten::val funcVal, int N, double start,
                 double stop, double tol, int minDeg, int maxDeg,
                 emscripten::val smoothingVal) {
                auto func = [funcVal](double u, double v) {
                  return funcVal(u, v).as<gp_Pnt>();
                };

                auto smoothing = std::make_tuple(smoothingVal[0].as<double>(),
                                                 smoothingVal[1].as<double>(),
                                                 smoothingVal[2].as<double>());

                return emscripten::val(self.parametric_surface(
                    func, N, start, stop, tol, minDeg, maxDeg, smoothing));
              }))
      .function(
          "ellipseArc",
          emscripten::optional_override(
              [](workplane &self, double x_radius, double y_radius,
                 double angle1, double angle2, double rotation_angle, int sense,
                 bool forConstruction, bool startAtCurrent, bool makeWire) {
                return emscripten::val(self.ellipse_arc(
                    x_radius, y_radius, angle1, angle2, rotation_angle, sense,
                    forConstruction, startAtCurrent, makeWire));
              }))
      .function("threePointArc",
                emscripten::optional_override(
                    [](workplane &self, emscripten::val point1Val,
                       emscripten::val point2Val, bool forConstruction) {
                      auto point1 = point1Val.as<gp_Pnt>();
                      auto point2 = point2Val.as<gp_Pnt>();
                      return emscripten::val(self.three_point_arc(
                          point1, point2, forConstruction));
                    }))
      .function("sagittaArc",
                emscripten::optional_override(
                    [](workplane &self, emscripten::val endPointVal, double sag,
                       bool forConstruction) {
                      auto endPoint = endPointVal.as<gp_Pnt>();
                      return emscripten::val(
                          self.sagitta_arc(endPoint, sag, forConstruction));
                    }))
      .function("radiusArc",
                emscripten::optional_override(
                    [](workplane &self, emscripten::val endPointVal,
                       double radius, bool forConstruction) {
                      auto endPoint = endPointVal.as<gp_Pnt>();
                      return emscripten::val(
                          self.radius_arc(endPoint, radius, forConstruction));
                    }))
      .function("tangentArcPoint",
                emscripten::optional_override(
                    [](workplane &self, emscripten::val endpointVal,
                       bool forConstruction, bool relative) {
                      auto endpoint = endpointVal.as<gp_Pnt>();
                      return emscripten::val(self.tangent_arc_point(
                          endpoint, forConstruction, relative));
                    }))
      .function("mirrorY", emscripten::optional_override([](workplane &self) {
                  return emscripten::val(self.mirror_y());
                }))
      .function("mirrorX", emscripten::optional_override([](workplane &self) {
                  return emscripten::val(self.mirror_x());
                }))
      .function("consolidateWires",
                emscripten::optional_override([](workplane &self) {
                  return emscripten::val(self.consolidate_wires());
                }))
      .function("each",
                emscripten::optional_override(
                    [](workplane &self, emscripten::val callbackVal,
                       bool useLocalCoordinates, bool combine, bool clean) {
                      auto callback = [callbackVal](shape_object &obj) {
                        return callbackVal(obj).as<shape_object>();
                      };
                      return emscripten::val(self.each(
                          callback, useLocalCoordinates, combine, clean));
                    }))
      .function(
          "eachPoint",
          emscripten::optional_override(
              [](workplane &self, emscripten::val argVal,
                 bool useLocalCoordinates, bool combine, bool clean) {
                if (argVal.typeOf().as<std::string>() == "shape") {
                  auto shapeObj = argVal.as<shape>();
                  return emscripten::val(self.eachpoint(
                      shapeObj, useLocalCoordinates, combine, clean));
                } else if (argVal.typeOf().as<std::string>() == "workplane") {
                  auto wp = argVal.as<workplane>();
                  return emscripten::val(
                      self.eachpoint(wp, useLocalCoordinates, combine, clean));
                } else {
                  auto func = [argVal](topo_location loc) {
                    return argVal(loc).as<shape>();
                  };
                  return emscripten::val(self.eachpoint(
                      func, useLocalCoordinates, combine, clean));
                }
              }))
      .function(
          "rect",
          emscripten::optional_override(
              [](workplane &self, double xLen, double yLen,
                 emscripten::val centerVal, bool forConstruction) {
                if (centerVal.isUndefined()) {
                  return emscripten::val(
                      self.rect(xLen, yLen, {false, false}, forConstruction));
                } else if (centerVal.typeOf().as<std::string>() == "boolean") {
                  bool centerAll = centerVal.as<bool>();
                  return emscripten::val(
                      self.rect(xLen, yLen, centerAll, forConstruction));
                } else {
                  std::pair<bool, bool> center = {centerVal[0].as<bool>(),
                                                  centerVal[1].as<bool>()};
                  return emscripten::val(
                      self.rect(xLen, yLen, center, forConstruction));
                }
              }))

      .function("circle",
                emscripten::optional_override([](workplane &self, double radius,
                                                 bool forConstruction) {
                  return emscripten::val(self.circle(radius, forConstruction));
                }))
      .function("ellipse",
                emscripten::optional_override(
                    [](workplane &self, double x_radius, double y_radius,
                       double rotation_angle, bool forConstruction) {
                      return emscripten::val(self.ellipse(
                          x_radius, y_radius, rotation_angle, forConstruction));
                    }))
      .function("polygon",
                emscripten::optional_override(
                    [](workplane &self, int nSides, double diameter,
                       bool forConstruction, bool circumscribed) {
                      return emscripten::val(self.polygon(
                          nSides, diameter, forConstruction, circumscribed));
                    }))
      .function("polyline", emscripten::optional_override(
                                [](workplane &self, emscripten::val pointsVal,
                                   bool forConstruction, bool includeCurrent) {
                                  std::vector<gp_Pnt> points;
                                  for (unsigned i = 0;
                                       i < pointsVal["length"].as<unsigned>();
                                       i++) {
                                    points.push_back(pointsVal[i].as<gp_Pnt>());
                                  }
                                  return emscripten::val(self.polyline(
                                      points, forConstruction, includeCurrent));
                                }))
      .function("close", emscripten::optional_override([](workplane &self) {
                  return emscripten::val(self.close());
                }))
      .function("wire", emscripten::optional_override([](workplane &self,
                                                         bool forConstruction) {
                  return emscripten::val(self.wire(forConstruction));
                }))
      .function("largestDimension",
                emscripten::optional_override(
                    [](workplane &self) { return self.largest_dimension(); }))
      .function("cutEach", emscripten::optional_override(
                               [](workplane &self, emscripten::val fcnVal,
                                  bool useLocalCoords, bool clean) {
                                 auto fcn = [fcnVal](topo_location loc) {
                                   return fcnVal(loc).as<shape>();
                                 };
                                 return emscripten::val(
                                     self.cut_each(fcn, useLocalCoords, clean));
                               }))
      .function("cboreHole",
                emscripten::optional_override(
                    [](workplane &self, double diameter, double cboreDiameter,
                       double cboreDepth, emscripten::val depthVal,
                       bool clean) {
                      boost::optional<double> depth;
                      if (!depthVal.isUndefined()) {
                        depth = depthVal.as<double>();
                      }
                      return emscripten::val(self.cbore_hole(
                          diameter, cboreDiameter, cboreDepth, depth, clean));
                    }))
      .function("cskHole",
                emscripten::optional_override(
                    [](workplane &self, double diameter, double cskDiameter,
                       double cskAngle, emscripten::val depthVal, bool clean) {
                      boost::optional<double> depth;
                      if (!depthVal.isUndefined()) {
                        depth = depthVal.as<double>();
                      }
                      return emscripten::val(self.csk_hole(
                          diameter, cskDiameter, cskAngle, depth, clean));
                    }))
      .function("hole",
                emscripten::optional_override(
                    [](workplane &self, double diameter,
                       emscripten::val depthVal, bool clean) {
                      boost::optional<double> depth;
                      if (!depthVal.isUndefined()) {
                        depth = depthVal.as<double>();
                      }
                      return emscripten::val(self.hole(diameter, depth, clean));
                    }))
      .function("twistExtrude",
                emscripten::optional_override(
                    [](workplane &self, double distance, double angleDegrees,
                       bool combine, bool clean) {
                      return emscripten::val(self.twist_extrude(
                          distance, angleDegrees, combine, clean));
                    }))

      .function("extrude",
                emscripten::optional_override([](workplane &self,
                                                 emscripten::val argVal,
                                                 emscripten::val combineVal,
                                                 bool clean, bool both,
                                                 emscripten::val taperVal) {
                  combine_mode combine = true;
                  if (!combineVal.isUndefined()) {
                    if (combineVal.typeOf().as<std::string>() == "boolean") {
                      combine = combineVal.as<bool>();
                    } else {
                      combine = combineVal.as<combine_mode_type>();
                    }
                  }

                  boost::optional<double> taper;
                  if (!taperVal.isUndefined()) {
                    taper = taperVal.as<double>();
                  }

                  if (argVal.typeOf().as<std::string>() == "number") {
                    double distance = argVal.as<double>();
                    return emscripten::val(
                        self.extrude(distance, combine, clean, both, taper));
                  } else if (argVal.typeOf().as<std::string>() == "face") {
                    auto face = argVal.as<face>();
                    return emscripten::val(
                        self.extrude(face, combine, clean, both, taper));
                  } else {
                    auto faceType = argVal.as<face_index_type>();
                    return emscripten::val(
                        self.extrude(faceType, combine, clean, both, taper));
                  }
                }))
      .function("sweep",
                emscripten::optional_override(
                    [](workplane &self, emscripten::val pathVal,
                       bool multisection, bool makeSolid, bool isFrenet,
                       bool combine, bool clean, emscripten::val transitionVal,
                       emscripten::val normalVal, emscripten::val auxSpineVal) {
                      transition_mode transition = transition_mode::RIGHT;
                      if (!transitionVal.isUndefined()) {
                        transition = transitionVal.as<transition_mode>();
                      }

                      boost::optional<topo_vector> normal;
                      if (!normalVal.isUndefined()) {
                        normal = normalVal.as<topo_vector>();
                      }

                      std::shared_ptr<workplane> auxSpine;
                      if (!auxSpineVal.isUndefined()) {
                        auxSpine = auxSpineVal.as<std::shared_ptr<workplane>>();
                      }

                      if (pathVal.typeOf().as<std::string>() == "workplane") {
                        auto wp = otherVal.as<std::shared_ptr<workplane>>();
                        return emscripten::val(self.sweep(
                            *wp, multisection, makeSolid, isFrenet, combine,
                            clean, transition, normal, auxSpine));
                      } else if (pathVal.typeOf().as<std::string>() == "wire") {
                        auto wire = pathVal.as<topo::wire>();
                        return emscripten::val(self.sweep(
                            wire, multisection, makeSolid, isFrenet, combine,
                            clean, transition, normal, auxSpine));
                      } else {
                        auto edge = pathVal.as<topo::edge>();
                        return emscripten::val(self.sweep(
                            edge, multisection, makeSolid, isFrenet, combine,
                            clean, transition, normal, auxSpine));
                      }
                    }))
      .function(
          "union",
          emscripten::optional_override([](workplane &self,
                                           emscripten::val otherVal, bool clean,
                                           bool glue, double tol) {
            if (otherVal.typeOf().as<std::string>() == "workplane") {
              auto wp = otherVal.as<std::shared_ptr<workplane>>();
              return emscripten::val(self.union_(*wp, clean, glue, tol));
            } else if (otherVal.typeOf().as<std::string>() == "solid") {
              auto solid = otherVal.as<solid>();
              return emscripten::val(self.union_(solid, clean, glue, tol));
            } else {
              auto compound = otherVal.as<compound>();
              return emscripten::val(self.union_(compound, clean, glue, tol));
            }
          }))
      .function("cut",
                emscripten::optional_override([](workplane &self,
                                                 emscripten::val otherVal,
                                                 bool clean, double tol) {
                  if (otherVal.typeOf().as<std::string>() == "workplane") {
                    auto wp = otherVal.as<std::shared_ptr<workplane>>();
                    return emscripten::val(self.cut(*wp, clean, tol));
                  } else if (otherVal.typeOf().as<std::string>() == "solid") {
                    auto solid = otherVal.as<solid>();
                    return emscripten::val(self.cut(solid, clean, tol));
                  } else {
                    auto compound = otherVal.as<compound>();
                    return emscripten::val(self.cut(compound, clean, tol));
                  }
                }))
      .function("intersect",
                emscripten::optional_override([](workplane &self,
                                                 emscripten::val otherVal,
                                                 bool clean, double tol) {
                  if (otherVal.typeOf().as<std::string>() == "workplane") {
                    auto wp = otherVal.as<std::shared_ptr<workplane>>();
                    return emscripten::val(self.intersect(*wp, clean, tol));
                  } else if (otherVal.typeOf().as<std::string>() == "solid") {
                    auto solid = otherVal.as<solid>();
                    return emscripten::val(self.intersect(solid, clean, tol));
                  } else {
                    auto compound = otherVal.as<compound>();
                    return emscripten::val(
                        self.intersect(compound, clean, tol));
                  }
                }))
      .function("cutBlind",
                emscripten::optional_override(
                    [](workplane &self, emscripten::val untilVal, bool clean,
                       bool both, emscripten::val taperVal) {
                      boost::optional<double> taper;
                      if (!taperVal.isUndefined()) {
                        taper = taperVal.as<double>();
                      }

                      if (untilVal.typeOf().as<std::string>() == "number") {
                        double distance = untilVal.as<double>();
                        return emscripten::val(
                            self.cut_blind(distance, clean, both, taper));
                      } else if (untilVal.typeOf().as<std::string>() ==
                                 "face") {
                        auto face = untilVal.as<face>();
                        return emscripten::val(
                            self.cut_blind(face, clean, both, taper));
                      } else {
                        auto faceType = untilVal.as<face_index_type>();
                        return emscripten::val(
                            self.cut_blind(faceType, clean, both, taper));
                      }
                    }))
      .function("revolve",
                emscripten::optional_override(
                    [](workplane &self, double angleDegrees,
                       emscripten::val axisStartVal, emscripten::val axisEndVal,
                       bool combine, bool clean) {
                      boost::optional<gp_Pnt> axisStart;
                      if (!axisStartVal.isUndefined()) {
                        axisStart = axisStartVal.as<gp_Pnt>();
                      }

                      boost::optional<gp_Pnt> axisEnd;
                      if (!axisEndVal.isUndefined()) {
                        axisEnd = axisEndVal.as<gp_Pnt>();
                      }

                      return emscripten::val(self.revolve(
                          angleDegrees, axisStart, axisEnd, combine, clean));
                    }))
      .function(
          "interpPlate",
          emscripten::optional_override(
              [](workplane &self, emscripten::val edgesOrWpVal,
                 emscripten::val pointsVal, double thickness, bool combine,
                 bool clean, int degree, int nbPtsOnCur, int nbIter,
                 bool anisotropy, double tol2d, double tol3d, double tolAng,
                 double tolCurv, int maxDeg, int maxSegments) {
                std::vector<gp_Pnt> points =
                    pointsVal.as<std::vector<gp_Pnt>>();

                if (edgesOrWpVal.typeOf().as<std::string>() == "workplane") {
                  auto wp = otherVal.as<std::shared_ptr<workplane>>();
                  return emscripten::val(self.interp_plate(
                      *wp, points, thickness, combine, clean, degree,
                      nbPtsOnCur, nbIter, anisotropy, tol2d, tol3d, tolAng,
                      tolCurv, maxDeg, maxSegments));
                } else if (edgesOrWpVal.typeOf().as<std::string>() == "array") {
                  auto edges = edgesOrWpVal.as<std::vector<edge>>();
                  return emscripten::val(self.interp_plate(
                      edges, points, thickness, combine, clean, degree,
                      nbPtsOnCur, nbIter, anisotropy, tol2d, tol3d, tolAng,
                      tolCurv, maxDeg, maxSegments));
                } else {
                  return emscripten::val(self.interp_plate(
                      points, thickness, combine, clean, degree, nbPtsOnCur,
                      nbIter, anisotropy, tol2d, tol3d, tolAng, tolCurv, maxDeg,
                      maxSegments));
                }
              }))
      .function(
          "sphere",
          emscripten::optional_override(
              [](workplane &self, double radius, emscripten::val directVal,
                 double angle1, double angle2, double angle3,
                 emscripten::val centerVal, bool combine, bool clean) {
                gp_Vec direct = gp_Vec(0, 0, 1);
                if (!directVal.isUndefined()) {
                  direct = directVal.as<gp_Vec>();
                }

                if (centerVal.typeOf().as<std::string>() == "boolean") {
                  bool centerAll = centerVal.as<bool>();
                  return emscripten::val(self.sphere(radius, direct, angle1,
                                                     angle2, angle3, centerAll,
                                                     combine, clean));
                } else {
                  auto center = centerVal.as<std::array<bool, 3>>();
                  return emscripten::val(self.sphere(radius, direct, angle1,
                                                     angle2, angle3, center,
                                                     combine, clean));
                }
              }))
      .function("cylinder",
                emscripten::optional_override(
                    [](workplane &self, double height, double radius,
                       emscripten::val directVal, double angle,
                       emscripten::val centerVal, bool combine, bool clean) {
                      gp_Vec direct = gp_Vec(0, 0, 1);
                      if (!directVal.isUndefined()) {
                        direct = directVal.as<gp_Vec>();
                      }

                      if (centerVal.typeOf().as<std::string>() == "boolean") {
                        bool centerAll = centerVal.as<bool>();
                        return emscripten::val(
                            self.cylinder(height, radius, direct, angle,
                                          centerAll, combine, clean));
                      } else {
                        auto center = centerVal.as<std::array<bool, 3>>();
                        return emscripten::val(
                            self.cylinder(height, radius, direct, angle, center,
                                          combine, clean));
                      }
                    }))
      .function("wedge",
                emscripten::optional_override(
                    [](workplane &self, double dx, double dy, double dz,
                       double xmin, double zmin, double xmax, double zmax,
                       emscripten::val pntVal, emscripten::val dirVal,
                       emscripten::val centerVal, bool combine, bool clean) {
                      gp_Pnt pnt = gp_Pnt(0, 0, 0);
                      if (!pntVal.isUndefined()) {
                        pnt = pntVal.as<gp_Pnt>();
                      }

                      gp_Vec dir = gp_Vec(0, 0, 1);
                      if (!dirVal.isUndefined()) {
                        dir = dirVal.as<gp_Vec>();
                      }

                      if (centerVal.typeOf().as<std::string>() == "boolean") {
                        bool centerAll = centerVal.as<bool>();
                        return emscripten::val(
                            self.wedge(dx, dy, dz, xmin, zmin, xmax, zmax, pnt,
                                       dir, centerAll, combine, clean));
                      } else {
                        auto center = centerVal.as<std::array<bool, 3>>();
                        return emscripten::val(
                            self.wedge(dx, dy, dz, xmin, zmin, xmax, zmax, pnt,
                                       dir, center, combine, clean));
                      }
                    }))
      .function(
          "combine",
          emscripten::optional_override([](workplane &self, bool clean,
                                           bool glue, emscripten::val tolVal) {
            boost::optional<double> tol;
            if (!tolVal.isUndefined()) {
              tol = tolVal.as<double>();
            }
            return emscripten::val(self.combine(clean, glue, tol));
          }))
      .function("cutThruAll",
                emscripten::optional_override(
                    [](workplane &self, bool clean, double taper) {
                      return emscripten::val(self.cut_thru_all(clean, taper));
                    }))
      .function("loft",
                emscripten::optional_override(
                    [](workplane &self, bool ruled, bool combine, bool clean) {
                      return emscripten::val(self.loft(ruled, combine, clean));
                    }))
      .function("section", emscripten::optional_override(
                               [](workplane &self, emscripten::val heightVal) {
                                 double height = 0.0;
                                 if (!heightVal.isUndefined()) {
                                   height = heightVal.as<double>();
                                 }
                                 return emscripten::val(self.section(height));
                               }))
      .function("toPending", emscripten::optional_override([](workplane &self) {
                  auto r = self.to_pending();
                  return emscripten::val(r.shared_from_this());
                }))
      .function("offset2d",
                emscripten::optional_override([](workplane &self, double d,
                                                 emscripten::val kindVal,
                                                 bool forConstruction) {
                  GeomAbs_JoinType kind = GeomAbs_Arc;
                  if (!kindVal.isUndefined()) {
                    kind = kindVal.as<GeomAbs_JoinType>();
                  }
                  return emscripten::val(
                      self.offset2d(d, kind, forConstruction));
                }))
      .function("sketch", emscripten::optional_override([](workplane &self) {
                  return emscripten::val(self.sketch());
                }))
      .function(
          "placeSketch",
          emscripten::optional_override(
              [](workplane &self, emscripten::val sketchesVal) {
                std::vector<std::shared_ptr<topo::sketch>> sketches;
                if (!sketchesVal.isUndefined()) {
                  sketches =
                      emscripten::vecFromJSArray<std::shared_ptr<topo::sketch>>(
                          sketchesVal);
                }
                return emscripten::val(self.place_sketch(sketches));
              }))
      .function("at", emscripten::optional_override([](workplane &self,
                                                       emscripten::val arg) {
                  if (arg.isNumber()) {
                    return emscripten::val(self[arg.as<int>()]);
                  } else if (arg.isArray()) {
                    auto vec = emscripten::vecFromJSArray<int>(arg);
                    return emscripten::val(self[vec]);
                  }
                  throw std::runtime_error("Invalid argument type for at()");
                }))
      .function(
          "filter",
          emscripten::optional_override(
              [](workplane &self, emscripten::val predicate) {
                auto func =
                    emscripten::val_to_std_function<bool(const shape_object &)>(
                        predicate);
                return emscripten::val(self.filter(func));
              }))
      .function("map", emscripten::optional_override(
                           [](workplane &self, emscripten::val mapper) {
                             auto func =
                                 emscripten::val_to_std_function<shape_object(
                                     const shape_object &)>(mapper);
                             return emscripten::val(self.map(func));
                           }))
      .function("apply",
                emscripten::optional_override([](workplane &self,
                                                 emscripten::val applier) {
                  auto func =
                      emscripten::val_to_std_function<std::vector<shape_object>(
                          const std::vector<shape_object> &)>(applier);
                  return emscripten::val(self.apply(func));
                }))
      .function("sort",
                emscripten::optional_override([](workplane &self,
                                                 emscripten::val comparator) {
                  auto func = emscripten::val_to_std_function<bool(
                      const shape_object &, const shape_object &)>(comparator);
                  return emscripten::val(self.sort(func));
                }))
      .function(
          "invoke", emscripten::optional_override([](workplane &self,
                                                     emscripten::val func) {
            if (func.isCallable()) {
              auto f =
                  emscripten::val_to_std_function<emscripten::val(workplane &)>(
                      func);
              return emscripten::val(self.invoke(
                  std::function<std::shared_ptr<workplane>(workplane &)>(
                      [f](workplane &wp) {
                        return f(wp).as<std::shared_ptr<workplane>>();
                      })));
            }
            throw std::runtime_error("Invalid function type for invoke");
          }))
      .function("all", emscripten::optional_override([](workplane &self) {
                  auto allWps = self.all();
                  emscripten::val result = emscripten::val::array();
                  for (auto &wp : allWps) {
                    result.call<void>("push", emscripten::val(wp));
                  }
                  return result;
                }))
      .function("shapes", emscripten::optional_override([](workplane &self) {
                  auto shapes = self.shapes();
                  emscripten::val result = emscripten::val::array();
                  for (auto &shape : shapes) {
                    result.call<void>("push", emscripten::val(shape));
                  }
                  return result;
                }))
      .function(
          "vals", emscripten::optional_override([](workplane &self) {
            auto vals = self.vals();
            emscripten::val result = emscripten::val::array();
            for (auto &val : vals) {
              if (val.type() == typeid(shape)) {
                result.call<void>("push",
                                  emscripten::val(boost::get<shape>(val)));
              } else if (val.type() == typeid(topo_vector)) {
                result.call<void>(
                    "push", emscripten::val(boost::get<topo_vector>(val)));
              } else if (val.type() == typeid(topo_location)) {
                result.call<void>(
                    "push", emscripten::val(boost::get<topo_location>(val)));
              } else if (val.type() == typeid(std::shared_ptr<sketch>)) {
                auto sketch = boost::get<std::shared_ptr<sketch>>(val);
                if (sketch) {
                  result.call<void>("push", emscripten::val(*sketch));
                } else {
                  result.call<void>("push", emscripten::val::null());
                }
              } else {
                result.call<void>("push", emscripten::val::null());
              }
            }
            return result;
          }))
      .function("val", emscripten::optional_override([](workplane &self) {
                  auto val = self.val();
                  if (val.type() == typeid(shape)) {
                    return emscripten::val(boost::get<shape>(val));
                  } else if (val.type() == typeid(topo_vector)) {
                    return emscripten::val(boost::get<topo_vector>(val));
                  } else if (val.type() == typeid(topo_location)) {
                    return emscripten::val(boost::get<topo_location>(val));
                  } else if (val.type() == typeid(std::shared_ptr<sketch>)) {
                    auto sketch = boost::get<std::shared_ptr<sketch>>(val);
                    return sketch ? emscripten::val(*sketch)
                                  : emscripten::val::null();
                  } else {
                    return emscripten::val::null();
                  }
                }))
      .function("size", emscripten::optional_override(
                            [](workplane &self) { return self.size(); }))
      .function("hasParent", emscripten::optional_override([](workplane &self) {
                  return self.has_parent();
                }))
      .function("parent", emscripten::optional_override([](workplane &self) {
                  return emscripten::val(self.parent());
                }));
}