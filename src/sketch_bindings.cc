#include "binding.hh"
#include "sketch.hh"

using namespace flywave;
using namespace flywave::topo;

EMSCRIPTEN_BINDINGS(Sketch) {

  enum_<Mode>("SketchMode")
      .value("ADD", Mode::ADD)
      .value("SUBTRACT", Mode::SUBTRACT)
      .value("INTERSECT", Mode::INTERSECT)
      .value("CONSTRUCT", Mode::CONSTRUCT)
      .value("REPLACE", Mode::REPLACE);

  class_<sketch>("Sketch")
      .smart_ptr<std::shared_ptr<sketch>>("Sketch")
      .constructor(emscripten::optional_override(
          [] { return std::make_shared<sketch>(); }))
      .constructor(emscripten::optional_override([](emscripten::val inPlane,
                                                    emscripten::val locsVal,
                                                    emscripten::val objVal) {
        if (inPlane.instanceof(emscripten::val::global("Workplane"))) {
          auto plane = inPlane.as<std::shared_ptr<workplane>>();
          std::vector<topo_location> locs;
          if (!locsVal.isUndefined() && locsVal.isArray()) {
            const size_t rows = locsVal["length"].as<size_t>();
            locs.reserve(rows);
            for (size_t i = 0; i < rows; ++i) {
              emscripten::val rowVal = locsVal[i];
              locs.push_back(rowVal.as<topo_location>());
            }
          }
          boost::optional<compound> obj = boost::none;
          if (!objVal.isUndefined()) {
            obj = objVal.as<boost::optional<compound>>();
          }
          return std::make_shared<sketch>(plane, locs, obj);
        } else {
          return std::make_shared<sketch>();
        }
      }))
      .constructor(emscripten::optional_override(
          [](emscripten::val locsVal, emscripten::val objVal) {
            if (locsVal.isArray()) {
              std::vector<topo_location> locs;
              const size_t rows = locsVal["length"].as<size_t>();
              locs.reserve(rows);
              for (size_t i = 0; i < rows; ++i) {
                emscripten::val rowVal = locsVal[i];
                locs.push_back(rowVal.as<topo_location>());
              }
              boost::optional<compound> obj = boost::none;
              if (!objVal.isUndefined()) {
                obj = objVal.as<boost::optional<compound>>();
              }
              return std::make_shared<sketch>(locs, obj);
            } else {
              return std::make_shared<sketch>();
            }
          }))
      .function("hashCode", &sketch::hash_code)
      .function(
          "getFaces",
          emscripten::optional_override([](sketch &self) -> emscripten::val {
            const auto &faces = self.get_faces();
            emscripten::val result = emscripten::val::array();
            for (size_t i = 0; i < faces.size(); ++i) {
              result.set(i, faces[i]);
            }
            return result;
          }),
          emscripten::allow_raw_pointers())
      .function(
          "face",
          emscripten::optional_override(
              [](sketch &self, emscripten::val shp, emscripten::val angleVal,
                 emscripten::val modeVal, emscripten::val tagVal,
                 emscripten::val ignoreSelectionVal) -> emscripten::val {
                double angle =
                    angleVal.isUndefined() ? 0.0 : angleVal.as<double>();
                Mode mode =
                    modeVal.isUndefined() ? Mode::ADD : modeVal.as<Mode>();
                std::string tag =
                    tagVal.isUndefined() ? "" : tagVal.as<std::string>();
                bool ignoreSelection = ignoreSelectionVal.isUndefined()
                                           ? false
                                           : ignoreSelectionVal.as<bool>();

                if (shp.instanceof(emscripten::val::global("Wire"))) {
                  auto w = shp.as<wire>();
                  auto &r = self.face(w, angle, mode, tag, ignoreSelection);
                  return emscripten::val(r.shared_from_this());
                } else if (shp.isArray()) { // vector<topo::edge>
                  std::vector<topo::edge> edges;
                  const size_t len = shp["length"].as<size_t>();
                  edges.reserve(len);
                  for (size_t i = 0; i < len; ++i) {
                    edges.push_back(shp[i].as<topo::edge>());
                  }
                  auto &r = self.face(edges, angle, mode, tag, ignoreSelection);
                  return emscripten::val(r.shared_from_this());
                } else if (shp.instanceof(emscripten::val::global("Shape"))) {
                  auto sh = shp.as<shape>();
                  auto &r = self.face(sh, angle, mode, tag, ignoreSelection);
                  return emscripten::val(r.shared_from_this());
                } else if (shp.instanceof(emscripten::val::global("Sketch"))) {
                  auto sk = shp.as<std::shared_ptr<sketch>>();
                  auto &r = self.face(sk, angle, mode, tag, ignoreSelection);
                  return emscripten::val(r.shared_from_this());
                } else {
                  throw std::runtime_error("Unsupported type for face()");
                }
              }),
          emscripten::allow_raw_pointers())
      .function("rect",
                emscripten::optional_override(
                    [](sketch &self, double w, double h,
                       emscripten::val angleVal, emscripten::val modeVal,
                       emscripten::val tagVal) -> emscripten::val {
                      double angle =
                          angleVal.isUndefined() ? 0.0 : angleVal.as<double>();
                      Mode mode = modeVal.isUndefined() ? Mode::ADD
                                                        : modeVal.as<Mode>();
                      boost::optional<std::string> tag =
                          tagVal.isUndefined()
                              ? boost::none
                              : boost::make_optional(tagVal.as<std::string>());

                      auto &r = self.rect(w, h, angle, mode, tag);
                      return emscripten::val(r.shared_from_this());
                    }),
                emscripten::allow_raw_pointers())
      // Circle
      .function("circle",
                emscripten::optional_override(
                    [](sketch &self, double r, emscripten::val modeVal,
                       emscripten::val tagVal) -> emscripten::val {
                      Mode mode = modeVal.isUndefined() ? Mode::ADD
                                                        : modeVal.as<Mode>();
                      boost::optional<std::string> tag =
                          tagVal.isUndefined()
                              ? boost::none
                              : boost::make_optional(tagVal.as<std::string>());

                      auto &rr = self.circle(r, mode, tag);
                      return emscripten::val(rr.shared_from_this());
                    }),
                emscripten::allow_raw_pointers())
      // Ellipse
      .function("ellipse",
                emscripten::optional_override(
                    [](sketch &self, double a1, double a2,
                       emscripten::val angleVal, emscripten::val modeVal,
                       emscripten::val tagVal) -> emscripten::val {
                      double angle =
                          angleVal.isUndefined() ? 0.0 : angleVal.as<double>();
                      Mode mode = modeVal.isUndefined() ? Mode::ADD
                                                        : modeVal.as<Mode>();
                      boost::optional<std::string> tag =
                          tagVal.isUndefined()
                              ? boost::none
                              : boost::make_optional(tagVal.as<std::string>());
                      auto &r = self.ellipse(a1, a2, angle, mode, tag);
                      return emscripten::val(r.shared_from_this());
                    }),
                emscripten::allow_raw_pointers())
      // Trapezoid
      .function("trapezoid",
                emscripten::optional_override(
                    [](sketch &self, double w, double h, double a1,
                       emscripten::val a2Val, emscripten::val angleVal,
                       emscripten::val modeVal,
                       emscripten::val tagVal) -> emscripten::val {
                      boost::optional<double> a2 =
                          a2Val.isUndefined()
                              ? boost::none
                              : boost::make_optional(a2Val.as<double>());
                      double angle =
                          angleVal.isUndefined() ? 0.0 : angleVal.as<double>();
                      Mode mode = modeVal.isUndefined() ? Mode::ADD
                                                        : modeVal.as<Mode>();
                      boost::optional<std::string> tag =
                          tagVal.isUndefined()
                              ? boost::none
                              : boost::make_optional(tagVal.as<std::string>());

                      auto &r = self.trapezoid(w, h, a1, a2, angle, mode, tag);
                      return emscripten::val(r.shared_from_this());
                    }),
                emscripten::allow_raw_pointers())
      // Slot
      .function("slot",
                emscripten::optional_override(
                    [](sketch &self, double w, double h,
                       emscripten::val angleVal, emscripten::val modeVal,
                       emscripten::val tagVal) -> emscripten::val {
                      double angle =
                          angleVal.isUndefined() ? 0.0 : angleVal.as<double>();
                      Mode mode = modeVal.isUndefined() ? Mode::ADD
                                                        : modeVal.as<Mode>();
                      boost::optional<std::string> tag =
                          tagVal.isUndefined()
                              ? boost::none
                              : boost::make_optional(tagVal.as<std::string>());
                      auto &r = self.slot(w, h, angle, mode, tag);
                      return emscripten::val(r.shared_from_this());
                    }),
                emscripten::allow_raw_pointers())
      // Regular Polygon
      .function("regularPolygon",
                emscripten::optional_override(
                    [](sketch &self, double r, int n, emscripten::val angleVal,
                       emscripten::val modeVal,
                       emscripten::val tagVal) -> emscripten::val {
                      double angle =
                          angleVal.isUndefined() ? 0.0 : angleVal.as<double>();
                      Mode mode = modeVal.isUndefined() ? Mode::ADD
                                                        : modeVal.as<Mode>();
                      boost::optional<std::string> tag =
                          tagVal.isUndefined()
                              ? boost::none
                              : boost::make_optional(tagVal.as<std::string>());
                      auto &rr = self.regular_polygon(r, n, angle, mode, tag);
                      return emscripten::val(rr.shared_from_this());
                    }),
                emscripten::allow_raw_pointers())
      // Polygon
      .function("polygon",
                emscripten::optional_override(
                    [](sketch &self, emscripten::val ptsVal,
                       emscripten::val angleVal, emscripten::val modeVal,
                       emscripten::val tagVal) -> emscripten::val {
                      std::vector<topo_vector> pts;
                      const size_t len = ptsVal["length"].as<size_t>();
                      pts.reserve(len);
                      for (size_t i = 0; i < len; ++i) {
                        pts.push_back(ptsVal[i].as<topo_vector>());
                      }
                      double angle =
                          angleVal.isUndefined() ? 0.0 : angleVal.as<double>();
                      Mode mode = modeVal.isUndefined() ? Mode::ADD
                                                        : modeVal.as<Mode>();
                      boost::optional<std::string> tag =
                          tagVal.isUndefined()
                              ? boost::none
                              : boost::make_optional(tagVal.as<std::string>());

                      auto &r = self.polygon(pts, angle, mode, tag);
                      return emscripten::val(r.shared_from_this());
                    }),
                emscripten::allow_raw_pointers())
      .function(
          "rarray",
          emscripten::optional_override([](sketch &self, double xs, double ys,
                                           int nx, int ny) -> emscripten::val {
            auto &r = self.rarray(xs, ys, nx, ny);
            return emscripten::val(r.shared_from_this());
          }),
          emscripten::allow_raw_pointers())
      // PArray
      .function("parray",
                emscripten::optional_override(
                    [](sketch &self, double r, double a1, double da, int n,
                       emscripten::val rotateVal) -> emscripten::val {
                      bool rotate =
                          rotateVal.isUndefined() ? true : rotateVal.as<bool>();
                      auto &rr = self.parray(r, a1, da, n, rotate);
                      return emscripten::val(rr.shared_from_this());
                    }),
                emscripten::allow_raw_pointers())
      // Distribute
      .function("distribute",
                emscripten::optional_override(
                    [](sketch &self, int n, emscripten::val startVal,
                       emscripten::val stopVal,
                       emscripten::val rotateVal) -> emscripten::val {
                      double start =
                          startVal.isUndefined() ? 0.0 : startVal.as<double>();
                      double stop =
                          stopVal.isUndefined() ? 1.0 : stopVal.as<double>();
                      bool rotate =
                          rotateVal.isUndefined() ? true : rotateVal.as<bool>();
                      auto &r = self.distribute(n, start, stop, rotate);
                      return emscripten::val(r.shared_from_this());
                    }),
                emscripten::allow_raw_pointers())

      .function("push",
                emscripten::optional_override(
                    [](sketch &self, emscripten::val locsVal,
                       emscripten::val tagVal) -> emscripten::val {
                      std::vector<topo_location> locs;
                      if (locsVal.isArray()) {
                        const size_t len = locsVal["length"].as<size_t>();
                        locs.reserve(len);
                        for (size_t i = 0; i < len; ++i) {
                          locs.push_back(locsVal[i].as<topo_location>());
                        }
                      }

                      boost::optional<std::string> tag =
                          tagVal.isUndefined()
                              ? boost::none
                              : boost::make_optional(tagVal.as<std::string>());

                      auto &r = self.push(locs, tag);
                      return emscripten::val(r.shared_from_this());
                    }),
                emscripten::allow_raw_pointers())
      // eachFace - 处理返回face的回调
      .function("eachFace",
                emscripten::optional_override(
                    [](sketch &self, emscripten::val callbackVal,
                       emscripten::val modeVal, emscripten::val tagVal,
                       emscripten::val ignoreSelectionVal) -> emscripten::val {
                      auto callback = [callbackVal](const topo_location &loc) {
                        return callbackVal(loc).as<topo::face>();
                      };

                      Mode mode = modeVal.isUndefined() ? Mode::ADD
                                                        : modeVal.as<Mode>();
                      std::string tag =
                          tagVal.isUndefined() ? "" : tagVal.as<std::string>();
                      bool ignoreSelection =
                          ignoreSelectionVal.isUndefined()
                              ? false
                              : ignoreSelectionVal.as<bool>();

                      auto &r = self.each(callback, mode, tag, ignoreSelection);
                      return emscripten::val(r.shared_from_this());
                    }),
                emscripten::allow_raw_pointers())
      // eachSketch - 处理返回sketch的回调
      .function("eachSketch",
                emscripten::optional_override(
                    [](sketch &self, emscripten::val callbackVal,
                       emscripten::val modeVal, emscripten::val tagVal,
                       emscripten::val ignoreSelectionVal) -> emscripten::val {
                      auto callback = [callbackVal](const topo_location &loc) {
                        return callbackVal(loc).as<std::shared_ptr<sketch>>();
                      };

                      Mode mode = modeVal.isUndefined() ? Mode::ADD
                                                        : modeVal.as<Mode>();
                      std::string tag =
                          tagVal.isUndefined() ? "" : tagVal.as<std::string>();
                      bool ignoreSelection =
                          ignoreSelectionVal.isUndefined()
                              ? false
                              : ignoreSelectionVal.as<bool>();

                      auto &r = self.each(callback, mode, tag, ignoreSelection);
                      return emscripten::val(r.shared_from_this());
                    }),
                emscripten::allow_raw_pointers())
      // eachCompound - 处理返回compound的回调
      .function("eachCompound",
                emscripten::optional_override(
                    [](sketch &self, emscripten::val callbackVal,
                       emscripten::val modeVal, emscripten::val tagVal,
                       emscripten::val ignoreSelectionVal) -> emscripten::val {
                      auto callback = [callbackVal](const topo_location &loc) {
                        return callbackVal(loc).as<compound>();
                      };

                      Mode mode = modeVal.isUndefined() ? Mode::ADD
                                                        : modeVal.as<Mode>();
                      std::string tag =
                          tagVal.isUndefined() ? "" : tagVal.as<std::string>();
                      bool ignoreSelection =
                          ignoreSelectionVal.isUndefined()
                              ? false
                              : ignoreSelectionVal.as<bool>();

                      auto &r = self.each(callback, mode, tag, ignoreSelection);
                      return emscripten::val(r.shared_from_this());
                    }),
                emscripten::allow_raw_pointers())
      .function("hull",
                emscripten::optional_override(
                    [](sketch &self, emscripten::val modeVal,
                       emscripten::val tagVal) -> emscripten::val {
                      Mode mode = modeVal.isUndefined() ? Mode::ADD
                                                        : modeVal.as<Mode>();
                      boost::optional<std::string> tag =
                          tagVal.isUndefined()
                              ? boost::none
                              : boost::make_optional(tagVal.as<std::string>());
                      auto &r = self.hull(mode, tag);
                      return emscripten::val(r.shared_from_this());
                    }),
                emscripten::allow_raw_pointers())

      // Offset
      .function("offset",
                emscripten::optional_override(
                    [](sketch &self, double d, emscripten::val modeVal,
                       emscripten::val tagVal) -> emscripten::val {
                      Mode mode = modeVal.isUndefined() ? Mode::ADD
                                                        : modeVal.as<Mode>();
                      boost::optional<std::string> tag =
                          tagVal.isUndefined()
                              ? boost::none
                              : boost::make_optional(tagVal.as<std::string>());
                      auto &r = self.offset(d, mode, tag);
                      return emscripten::val(r.shared_from_this());
                    }),
                emscripten::allow_raw_pointers())

      // Fillet
      .function("fillet",
                emscripten::optional_override(
                    [](sketch &self, double d) -> emscripten::val {
                      auto &r = self.fillet(d);
                      return emscripten::val(r.shared_from_this());
                    }),
                emscripten::allow_raw_pointers())

      // Chamfer
      .function("chamfer",
                emscripten::optional_override(
                    [](sketch &self, double d) -> emscripten::val {
                      auto &r = self.chamfer(d);
                      return emscripten::val(r.shared_from_this());
                    }),
                emscripten::allow_raw_pointers())
      // Clean
      .function(
          "clean",
          emscripten::optional_override([](sketch &self) -> emscripten::val {
            auto &r = self.clean();
            return emscripten::val(r.shared_from_this());
          }),
          emscripten::allow_raw_pointers())
      // Tag
      .function(
          "tag",
          emscripten::optional_override(
              [](sketch &self, const std::string &tag) -> emscripten::val {
                auto &r = self.tag(tag);
                return emscripten::val(r.shared_from_this());
              }),
          emscripten::allow_raw_pointers())

      // Select
      .function(
          "select",
          emscripten::optional_override(
              [](sketch &self, emscripten::val tagsVal) -> emscripten::val {
                std::vector<std::string> tags;
                const size_t len = tagsVal["length"].as<size_t>();
                tags.reserve(len);
                for (size_t i = 0; i < len; ++i) {
                  tags.push_back(tagsVal[i].as<std::string>());
                }
                auto &r = self.select(tags);
                return emscripten::val(r.shared_from_this());
              }),
          emscripten::allow_raw_pointers())

      .function("faces",
                emscripten::optional_override(
                    [](sketch &self, emscripten::val selectorVal,
                       emscripten::val tagVal) -> emscripten::val {
                      std::string tag =
                          tagVal.isUndefined() ? "" : tagVal.as<std::string>();

                      if (selectorVal.isString()) {
                        std::string selector = selectorVal.as<std::string>();
                        auto &r = self.faces(selector, tag);
                        return emscripten::val(r.shared_from_this());
                      } else {
                        auto sel = selectorVal.as<selector_ptr>();
                        auto &r = self.faces(sel, tag);
                        return emscripten::val(r.shared_from_this());
                      }
                    }),
                emscripten::allow_raw_pointers())
      // wires - 统一处理字符串和选择器
      .function("wires",
                emscripten::optional_override(
                    [](sketch &self, emscripten::val selectorVal,
                       emscripten::val tagVal) -> emscripten::val {
                      std::string tag =
                          tagVal.isUndefined() ? "" : tagVal.as<std::string>();

                      if (selectorVal.isString()) {
                        std::string selector = selectorVal.as<std::string>();
                        auto &r = self.wires(selector, tag);
                        return emscripten::val(r.shared_from_this());
                      } else {
                        auto sel = selectorVal.as<selector_ptr>();
                        auto &r = self.wires(sel, tag);
                        return emscripten::val(r.shared_from_this());
                      }
                    }),
                emscripten::allow_raw_pointers())

      // edges - 统一处理字符串和选择器
      .function("edges",
                emscripten::optional_override(
                    [](sketch &self, emscripten::val selectorVal,
                       emscripten::val tagVal) -> emscripten::val {
                      std::string tag =
                          tagVal.isUndefined() ? "" : tagVal.as<std::string>();

                      if (selectorVal.isString()) {
                        std::string selector = selectorVal.as<std::string>();
                        auto &r = self.edges(selector, tag);
                        return emscripten::val(r.shared_from_this());
                      } else {
                        auto sel = selectorVal.as<selector_ptr>();
                        auto &r = self.edges(sel, tag);
                        return emscripten::val(r.shared_from_this());
                      }
                    }),
                emscripten::allow_raw_pointers())

      // vertices - 统一处理字符串和选择器
      .function("vertices",
                emscripten::optional_override(
                    [](sketch &self, emscripten::val selectorVal,
                       emscripten::val tagVal) -> emscripten::val {
                      std::string tag =
                          tagVal.isUndefined() ? "" : tagVal.as<std::string>();

                      if (selectorVal.isString()) {
                        std::string selector = selectorVal.as<std::string>();
                        auto &r = self.vertices(selector, tag);
                        return emscripten::val(r.shared_from_this());
                      } else {
                        auto sel = selectorVal.as<selector_ptr>();
                        auto &r = self.vertices(sel, tag);
                        return emscripten::val(r.shared_from_this());
                      }
                    }),
                emscripten::allow_raw_pointers())
      // Reset
      .function(
          "reset",
          emscripten::optional_override([](sketch &self) -> emscripten::val {
            auto &r = self.reset();
            return emscripten::val(r.shared_from_this());
          }),
          emscripten::allow_raw_pointers())

      // Delete Selected
      .function(
          "deleteSelected",
          emscripten::optional_override([](sketch &self) -> emscripten::val {
            auto &r = self.delete_selected();
            return emscripten::val(r.shared_from_this());
          }),
          emscripten::allow_raw_pointers())

      // Edge
      .function(
          "edge",
          emscripten::optional_override(
              [](sketch &self, emscripten::val edgeVal, emscripten::val tagVal,
                 emscripten::val forConstructionVal) -> emscripten::val {
                auto edge = edgeVal.as<topo::edge>();
                boost::optional<std::string> tag =
                    tagVal.isUndefined()
                        ? boost::none
                        : boost::make_optional(tagVal.as<std::string>());
                bool forConstruction = forConstructionVal.isUndefined()
                                           ? false
                                           : forConstructionVal.as<bool>();
                auto &r = self.edge(edge, tag, forConstruction);
                return emscripten::val(r.shared_from_this());
              }),
          emscripten::allow_raw_pointers())
      // segmentBetweenPoints - 两点间线段
      .function("segmentBetweenPoints",
                emscripten::optional_override(
                    [](sketch &self, emscripten::val p1Val,
                       emscripten::val p2Val, emscripten::val tagVal,
                       emscripten::val forConstructionVal) -> emscripten::val {
                      auto p1 = p1Val.as<topo_vector>();
                      auto p2 = p2Val.as<topo_vector>();
                      boost::optional<std::string> tag =
                          tagVal.isUndefined()
                              ? boost::none
                              : boost::make_optional(tagVal.as<std::string>());
                      bool forConstruction =
                          forConstructionVal.isUndefined()
                              ? false
                              : forConstructionVal.as<bool>();
                      auto &r = self.segment(p1, p2, tag, forConstruction);
                      return emscripten::val(r.shared_from_this());
                    }),
                emscripten::allow_raw_pointers())
      // segmentToPoint - 从当前位置到指定点
      .function(
          "segmentToPoint",
          emscripten::optional_override(
              [](sketch &self, emscripten::val p2Val, emscripten::val tagVal,
                 emscripten::val forConstructionVal) -> emscripten::val {
                auto p2 = p2Val.as<topo_vector>();
                boost::optional<std::string> tag =
                    tagVal.isUndefined()
                        ? boost::none
                        : boost::make_optional(tagVal.as<std::string>());
                bool forConstruction = forConstructionVal.isUndefined()
                                           ? false
                                           : forConstructionVal.as<bool>();
                auto &r = self.segment(p2, tag, forConstruction);
                return emscripten::val(r.shared_from_this());
              }),
          emscripten::allow_raw_pointers())
      // segmentByLengthAngle - 通过长度和角度创建线段
      .function("segmentByLengthAngle",
                emscripten::optional_override(
                    [](sketch &self, double l, double a, emscripten::val tagVal,
                       emscripten::val forConstructionVal) -> emscripten::val {
                      boost::optional<std::string> tag =
                          tagVal.isUndefined()
                              ? boost::none
                              : boost::make_optional(tagVal.as<std::string>());
                      bool forConstruction =
                          forConstructionVal.isUndefined()
                              ? false
                              : forConstructionVal.as<bool>();
                      auto &r = self.segment(l, a, tag, forConstruction);
                      return emscripten::val(r.shared_from_this());
                    }),
                emscripten::allow_raw_pointers())

      // arcByThreePoints - 三点圆弧
      .function(
          "arcByThreePoints",
          emscripten::optional_override(
              [](sketch &self, emscripten::val p1Val, emscripten::val p2Val,
                 emscripten::val p3Val, emscripten::val tagVal,
                 emscripten::val forConstructionVal) -> emscripten::val {
                auto p1 = p1Val.as<topo_vector>();
                auto p2 = p2Val.as<topo_vector>();
                auto p3 = p3Val.as<topo_vector>();
                boost::optional<std::string> tag =
                    tagVal.isUndefined()
                        ? boost::none
                        : boost::make_optional(tagVal.as<std::string>());
                bool forConstruction = forConstructionVal.isUndefined()
                                           ? false
                                           : forConstructionVal.as<bool>();
                auto &r = self.arc(p1, p2, p3, tag, forConstruction);
                return emscripten::val(r.shared_from_this());
              }),
          emscripten::allow_raw_pointers())

      // arcByTwoPoints - 两点圆弧(从当前位置到指定点)
      .function("arcByTwoPoints",
                emscripten::optional_override(
                    [](sketch &self, emscripten::val p2Val,
                       emscripten::val p3Val, emscripten::val tagVal,
                       emscripten::val forConstructionVal) -> emscripten::val {
                      auto p2 = p2Val.as<topo_vector>();
                      auto p3 = p3Val.as<topo_vector>();
                      boost::optional<std::string> tag =
                          tagVal.isUndefined()
                              ? boost::none
                              : boost::make_optional(tagVal.as<std::string>());
                      bool forConstruction =
                          forConstructionVal.isUndefined()
                              ? false
                              : forConstructionVal.as<bool>();
                      auto &r = self.arc(p2, p3, tag, forConstruction);
                      return emscripten::val(r.shared_from_this());
                    }),
                emscripten::allow_raw_pointers())

      // arcByCenter - 中心点圆弧
      .function(
          "arcByCenter",
          emscripten::optional_override(
              [](sketch &self, emscripten::val centerVal, double radius,
                 double startAngle, double deltaAngle, emscripten::val tagVal,
                 emscripten::val forConstructionVal) -> emscripten::val {
                auto center = centerVal.as<topo_vector>();
                boost::optional<std::string> tag =
                    tagVal.isUndefined()
                        ? boost::none
                        : boost::make_optional(tagVal.as<std::string>());
                bool forConstruction = forConstructionVal.isUndefined()
                                           ? false
                                           : forConstructionVal.as<bool>();
                auto &r = self.arc(center, radius, startAngle, deltaAngle, tag,
                                  forConstruction);
                return emscripten::val(r.shared_from_this());
              }),
          emscripten::allow_raw_pointers())
      // splineWithTangents - 带切线控制的样条曲线
      .function(
          "splineWithTangents",
          emscripten::optional_override(
              [](sketch &self, emscripten::val pointsVal,
                 emscripten::val tangentsVal, emscripten::val periodicVal,
                 emscripten::val tagVal,
                 emscripten::val forConstructionVal) -> emscripten::val {
                std::vector<topo_vector> points;
                const size_t len = pointsVal["length"].as<size_t>();
                points.reserve(len);
                for (size_t i = 0; i < len; ++i) {
                  points.push_back(pointsVal[i].as<topo_vector>());
                }

                boost::optional<std::pair<topo_vector, topo_vector>> tangents;
                if (!tangentsVal.isUndefined()) {
                  auto t1 = tangentsVal["first"].as<topo_vector>();
                  auto t2 = tangentsVal["second"].as<topo_vector>();
                  tangents = std::make_pair(t1, t2);
                }

                bool periodic =
                    periodicVal.isUndefined() ? false : periodicVal.as<bool>();
                boost::optional<std::string> tag =
                    tagVal.isUndefined()
                        ? boost::none
                        : boost::make_optional(tagVal.as<std::string>());
                bool forConstruction = forConstructionVal.isUndefined()
                                           ? false
                                           : forConstructionVal.as<bool>();

                auto &r = self.spline(points, tangents, periodic, tag,
                                     forConstruction);
                return emscripten::val(r.shared_from_this());
              }),
          emscripten::allow_raw_pointers())

      // spline - 简单样条曲线
      .function("spline",
                emscripten::optional_override(
                    [](sketch &self, emscripten::val pointsVal,
                       emscripten::val tagVal,
                       emscripten::val forConstructionVal) -> emscripten::val {
                      std::vector<topo_vector> points;
                      const size_t len = pointsVal["length"].as<size_t>();
                      points.reserve(len);
                      for (size_t i = 0; i < len; ++i) {
                        points.push_back(pointsVal[i].as<topo_vector>());
                      }

                      boost::optional<std::string> tag =
                          tagVal.isUndefined()
                              ? boost::none
                              : boost::make_optional(tagVal.as<std::string>());
                      bool forConstruction =
                          forConstructionVal.isUndefined()
                              ? false
                              : forConstructionVal.as<bool>();

                      auto &r = self.spline(points, tag, forConstruction);
                      return emscripten::val(r.shared_from_this());
                    }),
                emscripten::allow_raw_pointers())
      // bezier - 贝塞尔曲线
      .function("bezier",
                emscripten::optional_override(
                    [](sketch &self, emscripten::val pointsVal,
                       emscripten::val tagVal,
                       emscripten::val forConstructionVal) -> emscripten::val {
                      std::vector<topo_vector> points;
                      const size_t len = pointsVal["length"].as<size_t>();
                      points.reserve(len);
                      for (size_t i = 0; i < len; ++i) {
                        points.push_back(pointsVal[i].as<topo_vector>());
                      }

                      boost::optional<std::string> tag =
                          tagVal.isUndefined()
                              ? boost::none
                              : boost::make_optional(tagVal.as<std::string>());
                      bool forConstruction =
                          forConstructionVal.isUndefined()
                              ? false
                              : forConstructionVal.as<bool>();

                      auto &r = self.bezier(points, tag, forConstruction);
                      return emscripten::val(r.shared_from_this());
                    }),
                emscripten::allow_raw_pointers())
      // close - 闭合图形
      .function(
          "close",
          emscripten::optional_override(
              [](sketch &self, emscripten::val tagVal) -> emscripten::val {
                boost::optional<std::string> tag =
                    tagVal.isUndefined()
                        ? boost::none
                        : boost::make_optional(tagVal.as<std::string>());
                auto &r = self.close(tag);
                return emscripten::val(r.shared_from_this());
              }),
          emscripten::allow_raw_pointers())
      // assemble - 装配操作
      .function("assemble",
                emscripten::optional_override(
                    [](sketch &self, emscripten::val modeVal,
                       emscripten::val tagVal) -> emscripten::val {
                      Mode mode = modeVal.as<Mode>();
                      boost::optional<std::string> tag =
                          tagVal.isUndefined()
                              ? boost::none
                              : boost::make_optional(tagVal.as<std::string>());
                      auto &r = self.assemble(mode, tag);
                      return emscripten::val(r.shared_from_this());
                    }),
                emscripten::allow_raw_pointers())
      // copy - 复制草图
      .function(
          "copy",
          emscripten::optional_override([](sketch &self) -> emscripten::val {
            auto result = self.copy();
            return emscripten::val(result);
          }),
          emscripten::allow_raw_pointers())
      // moved - 移动草图到多个位置
      .function(
          "moved",
          emscripten::optional_override(
              [](sketch &self, emscripten::val locsVal) -> emscripten::val {
                std::vector<topo_location> locs;
                const size_t len = locsVal["length"].as<size_t>();
                locs.reserve(len);
                for (size_t i = 0; i < len; ++i) {
                  locs.push_back(locsVal[i].as<topo_location>());
                }
                auto result = self.moved(locs);
                return emscripten::val(result);
              }),
          emscripten::allow_raw_pointers())
      // located - 移动草图到单个位置
      .function(
          "located",
          emscripten::optional_override(
              [](sketch &self, emscripten::val locVal) -> emscripten::val {
                auto loc = locVal.as<topo_location>();
                auto result = self.located(loc);
                return emscripten::val(result);
              }),
          emscripten::allow_raw_pointers())
      // finalize - 完成草图
      .function(
          "finalize",
          emscripten::optional_override([](sketch &self) -> emscripten::val {
            auto result = self.finalize();
            return emscripten::val(result);
          }),
          emscripten::allow_raw_pointers())
      // val - 获取单个值
      .function(
          "val",
          emscripten::optional_override([](sketch &self) -> emscripten::val {
            auto result = self.val();
            if (result.type() == typeid(shape)) {
              return emscripten::val(boost::get<shape>(result));
            } else {
              return emscripten::val(boost::get<topo_location>(result));
            }
          }),
          emscripten::allow_raw_pointers())
      // vals - 获取值数组
      .function(
          "vals",
          emscripten::optional_override([](sketch &self) -> emscripten::val {
            auto results = self.vals();
            emscripten::val array = emscripten::val::array();
            for (const auto &result : results) {
              if (result.type() == typeid(shape)) {
                array.call<void>("push",
                                 emscripten::val(boost::get<shape>(result)));
              } else {
                array.call<void>(
                    "push", emscripten::val(boost::get<topo_location>(result)));
              }
            }
            return array;
          }),
          emscripten::allow_raw_pointers())
      // add - 添加操作
      .function(
          "add",
          emscripten::optional_override([](sketch &self) -> emscripten::val {
            auto &r = self.add();
            return emscripten::val(r.shared_from_this());
          }),
          emscripten::allow_raw_pointers())

      // subtract - 减去操作
      .function(
          "subtract",
          emscripten::optional_override([](sketch &self) -> emscripten::val {
            auto &r = self.subtract();
            return emscripten::val(r.shared_from_this());
          }),
          emscripten::allow_raw_pointers())

      // replace - 替换操作
      .function(
          "replace",
          emscripten::optional_override([](sketch &self) -> emscripten::val {
            auto &r = self.replace();
            return emscripten::val(r.shared_from_this());
          }),
          emscripten::allow_raw_pointers())

      // operator+ - 加法运算符
      .function(
          "plus",
          emscripten::optional_override(
              [](sketch &self, emscripten::val otherVal) -> emscripten::val {
                auto other = otherVal.as<std::shared_ptr<sketch>>();
                auto result = self + *other;
                return emscripten::val(result.shared_from_this());
              }),
          emscripten::allow_raw_pointers())

      // operator- - 减法运算符
      .function(
          "minus",
          emscripten::optional_override(
              [](sketch &self, emscripten::val otherVal) -> emscripten::val {
                auto other = otherVal.as<std::shared_ptr<sketch>>();
                auto result = self - *other;
                return emscripten::val(result.shared_from_this());
              }),
          emscripten::allow_raw_pointers())

      // operator* - 乘法运算符
      .function(
          "multiply",
          emscripten::optional_override(
              [](sketch &self, emscripten::val otherVal) -> emscripten::val {
                auto other = otherVal.as<std::shared_ptr<sketch>>();
                auto result = self * *other;
                return emscripten::val(result.shared_from_this());
              }),
          emscripten::allow_raw_pointers())

      // operator/ - 除法运算符
      .function(
          "divide",
          emscripten::optional_override(
              [](sketch &self, emscripten::val otherVal) -> emscripten::val {
                auto other = otherVal.as<std::shared_ptr<sketch>>();
                auto result = self / *other;
                return emscripten::val(result.shared_from_this());
              }),
          emscripten::allow_raw_pointers())

      // operator[] - 索引运算符
      .function(
          "at",
          emscripten::optional_override(
              [](sketch &self, emscripten::val indicesVal) -> emscripten::val {
                std::vector<int> indices;
                const size_t len = indicesVal["length"].as<size_t>();
                indices.reserve(len);
                for (size_t i = 0; i < len; ++i) {
                  indices.push_back(indicesVal[i].as<int>());
                }
                auto &r = self[indices];
                return emscripten::val(r.shared_from_this());
              }),
          emscripten::allow_raw_pointers())
      // filter - 过滤草图元素
      .function(
          "filter",
          emscripten::optional_override(
              [](sketch &self, emscripten::val predVal) -> emscripten::val {
                auto pred = [predVal](const sketch_val &val) {
                  emscripten::val jsVal;
                  if (val.type() == typeid(shape)) {
                    jsVal = emscripten::val(boost::get<shape>(val));
                  } else {
                    jsVal = emscripten::val(boost::get<topo_location>(val));
                  }
                  return predVal(jsVal).as<bool>();
                };
                auto &r = self.filter(pred);
                return emscripten::val(r.shared_from_this());
              }),
          emscripten::allow_raw_pointers())
      // map - 映射草图元素
      .function("map",
                emscripten::optional_override(
                    [](sketch &self, emscripten::val fVal) -> emscripten::val {
                      auto f = [fVal](const sketch_val &val) -> sketch_val {
                        emscripten::val jsVal;
                        if (val.type() == typeid(shape)) {
                          jsVal = emscripten::val(boost::get<shape>(val));
                        } else {
                          jsVal =
                              emscripten::val(boost::get<topo_location>(val));
                        }
                        auto result = fVal(jsVal);
                        if (result.isUndefined()) {
                          return val;
                        }
                        if (result.typeOf().as<std::string>() == "object") {
                          if (result.hasOwnProperty("isShape") &&
                              result["isShape"].as<bool>()) {
                            return result.as<shape>();
                          } else {
                            return result.as<topo_location>();
                          }
                        }
                        return val;
                      };
                      auto &r = self.map(f);
                      return emscripten::val(r.shared_from_this());
                    }),
                emscripten::allow_raw_pointers())
      // apply - 应用函数到所有元素
      .function(
          "apply",
          emscripten::optional_override(
              [](sketch &self, emscripten::val fVal) -> emscripten::val {
                auto f = [fVal](const std::vector<sketch_val> &vals)
                    -> std::vector<sketch_val> {
                  emscripten::val jsVals = emscripten::val::array();
                  for (const auto &val : vals) {
                    if (val.type() == typeid(shape)) {
                      jsVals.call<void>(
                          "push", emscripten::val(boost::get<shape>(val)));
                    } else {
                      jsVals.call<void>(
                          "push",
                          emscripten::val(boost::get<topo_location>(val)));
                    }
                  }
                  emscripten::val result = fVal(jsVals);

                  std::vector<sketch_val> cppResults;
                  const size_t len = result["length"].as<size_t>();
                  cppResults.reserve(len);
                  for (size_t i = 0; i < len; ++i) {
                    emscripten::val item = result[i];
                    if (item.typeOf().as<std::string>() == "object") {
                      if (item.hasOwnProperty("isShape") &&
                          item["isShape"].as<bool>()) {
                        cppResults.push_back(item.as<shape>());
                      } else {
                        cppResults.push_back(item.as<topo_location>());
                      }
                    }
                  }
                  return cppResults;
                };
                auto &r = self.apply(f);
                return emscripten::val(r.shared_from_this());
              }),
          emscripten::allow_raw_pointers())
      // sort - 排序元素
      .function(
          "sort",
          emscripten::optional_override(
              [](sketch &self, emscripten::val compVal) -> emscripten::val {
                auto comp = [compVal](const sketch_val &a,
                                      const sketch_val &b) -> bool {
                  emscripten::val jsA, jsB;
                  if (a.type() == typeid(shape)) {
                    jsA = emscripten::val(boost::get<shape>(a));
                  } else {
                    jsA = emscripten::val(boost::get<topo_location>(a));
                  }
                  if (b.type() == typeid(shape)) {
                    jsB = emscripten::val(boost::get<shape>(b));
                  } else {
                    jsB = emscripten::val(boost::get<topo_location>(b));
                  }
                  return compVal(jsA, jsB).as<bool>();
                };
                auto &r = self.sort(comp);
                return emscripten::val(r.shared_from_this());
              }),
          emscripten::allow_raw_pointers());
}