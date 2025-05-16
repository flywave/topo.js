#include "bbox.hh"
#include "binding.hh"
#include "comp_solid.hh"
#include "compound.hh"
#include "edge.hh"
#include "face.hh"
#include "location.hh"
#include "matrix.hh"
#include "mesh.hh"
#include "plane.hh"
#include "selector.hh"
#include "shape.hh"
#include "shape_ops.hh"
#include "shell.hh"
#include "solid.hh"
#include "vector.hh"
#include "vertex.hh"
#include "wire.hh"

using namespace flywave;
using namespace flywave::topo;

struct shape_ops {};

class emscripten_mesh_receiver : public flywave::topo::mesh_receiver {
public:
  emscripten::val vertices = emscripten::val::array();
  emscripten::val normals = emscripten::val::array();
  emscripten::val uvs = emscripten::val::array();
  emscripten::val triangles = emscripten::val::array();
  emscripten::val faceGroups = emscripten::val::array();
  int currentFaceIndex = -1;
  bool hasTexCoords = false;

  void begin() override {
    vertices.call<void>("push", emscripten::val::array());
    normals.call<void>("push", emscripten::val::array());
    uvs.call<void>("push", emscripten::val::array());
    triangles.call<void>("push", emscripten::val::array());
    currentFaceIndex++;
  }

  void end() override {}

  int append_face(Quantity_Color color) override {
    auto group = emscripten::val::object();
    group.set("faceId", currentFaceIndex);
    group.set("start", triangles[currentFaceIndex]["length"].as<int>());
    group.set("count", 0);
    faceGroups.call<void>("push", group);
    return currentFaceIndex;
  }

  void append_node(int face, gp_Pnt p, gp_Pnt n) override {
    vertices[face].call<void>("push", p.X());
    vertices[face].call<void>("push", p.Y());
    vertices[face].call<void>("push", p.Z());
    normals[face].call<void>("push", n.X());
    normals[face].call<void>("push", n.Y());
    normals[face].call<void>("push", n.Z());
  }

  void append_node(int face, gp_Pnt p) override {
    vertices[face].call<void>("push", p.X());
    vertices[face].call<void>("push", p.Y());
    vertices[face].call<void>("push", p.Z());
  }

  void append_node(int face, gp_Pnt p, gp_Pnt n, gp_Pnt2d uv) override {
    hasTexCoords = true;
    vertices[face].call<void>("push", p.X());
    vertices[face].call<void>("push", p.Y());
    vertices[face].call<void>("push", p.Z());
    normals[face].call<void>("push", n.X());
    normals[face].call<void>("push", n.Y());
    normals[face].call<void>("push", n.Z());
    uvs[face].call<void>("push", uv.X());
    uvs[face].call<void>("push", uv.Y());
  }

  void append_triangle(int face, int tri[3]) override {
    triangles[face].call<void>("push", tri[0]);
    triangles[face].call<void>("push", tri[1]);
    triangles[face].call<void>("push", tri[2]);

    // 更新当前面组的三角形计数
    for (int i = 0; i < faceGroups["length"].as<int>(); i++) {
      auto group = faceGroups[i];
      if (group["faceId"].as<int>() == face) {
        group.set("count", group["count"].as<int>() + 3);
        break;
      }
    }
  }

  emscripten::val get_mesh_data() {
    auto buff = emscripten::val::object();
    buff.set("vertices", vertices);
    buff.set("normals", normals);
    if (hasTexCoords) {
      buff.set("uvs", uvs);
    }
    buff.set("triangles", triangles);
    buff.set("faceGroups", faceGroups);
    return buff;
  }
};

class emscripten_mesh_edges_receiver
    : public flywave::topo::mesh_edges_receiver {
public:
  emscripten::val lines = emscripten::val::array();
  emscripten::val edgeGroups = emscripten::val::array();
  int currentEdgeIndex = -1;

  void begin() override {
    lines.call<void>("push", emscripten::val::array());
    currentEdgeIndex++;
  }

  void end() override {}

  int append_edge(Quantity_Color color) override {
    auto group = emscripten::val::object();
    group.set("edgeId", currentEdgeIndex);
    group.set("start", lines[currentEdgeIndex]["length"].as<int>());
    group.set("count", 0);
    edgeGroups.call<void>("push", group);
    return currentEdgeIndex;
  }

  void append_point(int edge, gp_Pnt p) override {
    lines[edge].call<void>("push", p.X());
    lines[edge].call<void>("push", p.Y());
    lines[edge].call<void>("push", p.Z());

    // 更新当前边组的顶点计数
    for (int i = 0; i < edgeGroups["length"].as<int>(); i++) {
      auto group = edgeGroups[i];
      if (group["edgeId"].as<int>() == edge) {
        group.set("count", group["count"].as<int>() + 1);
        break;
      }
    }
  }

  emscripten::val get_edges_data() {
    auto buff = emscripten::val::object();
    buff.set("lines", lines);
    buff.set("edgeGroups", edgeGroups);
    return buff;
  }
};

// 定义数组访问器
EMSCRIPTEN_BINDINGS(Topo) {

  emscripten::enum_<geometry_object_type>("GeometryObjectType")
      .value("Solid", geometry_object_type::SolidType)
      .value("Shell", geometry_object_type::ShellType)
      .value("Face", geometry_object_type::FaceType)
      .value("Edge", geometry_object_type::EdgeType)
      .value("Vertex", geometry_object_type::VertexType)
      .value("Wire", geometry_object_type::WireType)
      .value("Compound", geometry_object_type::CompoundType)
      .value("CompSolid", geometry_object_type::CompSolidType)
      .value("Shape", geometry_object_type::ShapeType);

  emscripten::enum_<orientation>("Orientation")
      .value("FORWARD", orientation::FORWARD)
      .value("REVERSED", orientation::REVERSED)
      .value("INTERNAL", orientation::INTERNAL)
      .value("EXTERNAL", orientation::EXTERNAL)
      .value("UNKNOW", orientation::UNKNOW);

  // 绑定topo_bbox类
  class_<topo_bbox>("BBox")
      .constructor<>()
      .constructor<const Bnd_Box &>()
      .constructor<double, double, double, double, double, double>()
      .function("xMin", &topo_bbox::x_min)
      .function("xMax", &topo_bbox::x_max)
      .function("xLength", &topo_bbox::x_length)
      .function("yMin", &topo_bbox::y_min)
      .function("yMax", &topo_bbox::y_max)
      .function("yLength", &topo_bbox::y_length)
      .function("zMin", &topo_bbox::z_min)
      .function("zMax", &topo_bbox::z_max)
      .function("zLength", &topo_bbox::z_length)
      .function("min", &topo_bbox::min)
      .function("max", &topo_bbox::max)
      .function("center", &topo_bbox::center)
      .function("diagonalLength", &topo_bbox::diagonal_length)
      .function(
          "addVector", emscripten::optional_override([](const topo_bbox &self,
                                                        const topo_vector &obj,
                                                        emscripten::val tol) {
            double tolerance = tol.isUndefined() ? 1e-6 : tol.as<double>();
            return self.add(obj, tolerance);
          }))
      .function("addBBOx", emscripten::optional_override(
                               [](const topo_bbox &self, const topo_bbox &other,
                                  emscripten::val tol) {
                                 double tolerance = tol.isUndefined()
                                                        ? 1e-6
                                                        : tol.as<double>();
                                 return self.add(other, tolerance);
                               }))
      .function("isInside", &topo_bbox::is_inside)
      .function("enlarge", emscripten::optional_override(
                               [](const topo_bbox &self, emscripten::val tol) {
                                 double tolerance = tol.isUndefined()
                                                        ? 1e-6
                                                        : tol.as<double>();
                                 return self.enlarge(tolerance);
                               }))
      .class_function("findOutsideBox2d",
                      emscripten::optional_override([](const topo_bbox &bb1,
                                                       const topo_bbox &bb2,
                                                       emscripten::val tol) {
                        double tolerance =
                            tol.isUndefined() ? 1e-6 : tol.as<double>();
                        auto res =
                            topo_bbox::find_outside_box2d(bb1, bb2, tolerance);
                        if (res) {
                          return emscripten::val(*res);
                        }
                        return emscripten::val::null();
                      }))
      .class_function(
          "fromShape",
          emscripten::optional_override([](const TopoDS_Shape &shape,
                                           emscripten::val tol,
                                           emscripten::val optimal) {
            double tolerance = tol.isUndefined() ? 1e-6 : tol.as<double>();
            bool is_optimal = optimal.isUndefined() ? true : optimal.as<bool>();
            return topo_bbox::from_shape(shape, tolerance, is_optimal);
          }))
      .function("getValue", &topo_bbox::get_value);

  class_<topo_location>("Location")
      .constructor<>()
      .constructor(emscripten::optional_override(
          [](const gp_Vec &t, double rx, double ry, double rz) {
            return topo_location(t, rx, ry, rz);
          }))
      .constructor(emscripten::optional_override(
          [](const gp_Pln &pln, const gp_Pnt &pos) {
            return topo_location(pln, pos);
          }))
      .constructor(emscripten::optional_override(
          [](const gp_Vec &t, const gp_Vec &axis, double angle) {
            return topo_location(t, axis, angle);
          }))
      .constructor(emscripten::optional_override([](emscripten::val v) {
        if (v.instanceof(emscripten::val::global("gp_Trsf"))) {
          return topo_location(v.as<gp_Trsf>());
        } else if (v.instanceof(emscripten::val::global("TopLoc_Location"))) {
          return topo_location(v.as<TopLoc_Location>());
        } else if (v.instanceof(emscripten::val::global("gp_Pnt"))) {
          return topo_location(v.as<gp_Pnt>());
        } else if (v.instanceof(emscripten::val::global("gp_Vec"))) {
          return topo_location(v.as<gp_Vec>());
        } else if (v.instanceof(emscripten::val::global("gp_Pln"))) {
          return topo_location(v.as<gp_Pln>());
        } else if (v.instanceof(emscripten::val::global("topo_vector"))) {
          return topo_location(v.as<topo_vector>());
        } else {
          throw std::runtime_error(
              "Invalid argument type for Location constructor");
        }
      }))
      .function("copy", emscripten::optional_override(
                            [](const topo_location &self) -> topo_location {
                              return self;
                            }))
      // 方法绑定
      .function("hashCode", &topo_location::hash_code)
      .function("inverted", &topo_location::inverted)
      .function("dividedBy", &topo_location::operator/)
      .function("multipliedBy", &topo_location::operator*)
      .function("pow", &topo_location::pow)
      .function("toTuple",
                emscripten::optional_override([](const topo_location &self) {
                  auto result = self.to_tuple();
                  emscripten::val arr = emscripten::val::array();

                  emscripten::val first = emscripten::val::array();
                  first.call<void>("push", std::get<0>(std::get<0>(result)));
                  first.call<void>("push", std::get<1>(std::get<0>(result)));
                  first.call<void>("push", std::get<2>(std::get<0>(result)));

                  arr.call<void>("push", first);

                  emscripten::val second = emscripten::val::array();
                  second.call<void>("push", std::get<0>(std::get<1>(result)));
                  second.call<void>("push", std::get<1>(std::get<1>(result)));
                  second.call<void>("push", std::get<2>(std::get<1>(result)));

                  arr.call<void>("push", second);
                  return arr;
                }))
      .function("toVector",
                emscripten::optional_override([](const topo_location &self) {
                  auto vec = self.to_vector();
                  emscripten::val result = emscripten::val::array();
                  for (const auto &row : vec) {
                    emscripten::val rowArray = emscripten::val::array();
                    for (const auto &val : row) {
                      rowArray.call<void>("push", val);
                    }
                    result.call<void>("push", rowArray);
                  }
                  return result;
                }))
      // 转换操作符
      .function("toTopLocLocation",
                &topo_location::operator const TopLoc_Location &)
      .function("toTrsf", &topo_location::operator gp_Trsf)
      // 比较操作符
      .function("equals",
                emscripten::optional_override(
                    [](const topo_location &self, const topo_location &other) {
                      return self == other;
                    }))
      .function("notEquals",
                emscripten::optional_override(
                    [](const topo_location &self, const topo_location &other) {
                      return self != other;
                    }));

  class_<topo_matrix>("Matrix")
      .constructor<>()
      .constructor(emscripten::optional_override([](emscripten::val v) {
        if (v.instanceof(emscripten::val::global("gp_Trsf"))) {
          return topo_matrix(v.as<gp_Trsf>());
        } else if (v.instanceof(emscripten::val::global("gp_GTrsf"))) {
          return topo_matrix(v.as<gp_GTrsf>());
        } else if (v.isArray()) {
          std::vector<std::vector<double>> matrix;
          const size_t rows = v["length"].as<size_t>();
          matrix.reserve(rows);
          for (size_t i = 0; i < rows; ++i) {
            emscripten::val rowVal = v[i];
            const size_t cols = rowVal["length"].as<size_t>();
            std::vector<double> row;
            row.reserve(cols);
            for (size_t j = 0; j < cols; ++j) {
              row.push_back(rowVal[j].as<double>());
            }
            matrix.push_back(row);
          }
          return topo_matrix(matrix);
        } else {
          throw std::runtime_error(
              "Invalid argument type for Matrix constructor");
        }
      }))
      // Methods
      .function("rotateX", &topo_matrix::rotate_x)
      .function("rotateY", &topo_matrix::rotate_y)
      .function("rotateZ", &topo_matrix::rotate_z)
      .function("inverse", &topo_matrix::inverse)
      .function("multiplyMatrix", &topo_matrix::multiply)
      .function("multiplyVector",
                emscripten::optional_override(
                    [](const topo_matrix &self, const topo_vector &other) {
                      return self * other;
                    }))
      .function("get", &topo_matrix::get)
      .function("transposedList",
                emscripten::optional_override([](const topo_matrix &self) {
                  std::vector<double> vec = self.transposed_list();
                  emscripten::val result = emscripten::val::array();
                  for (const auto &val : vec) {
                    result.call<void>("push", val);
                  }
                  return result;
                }))
      .function("toString", &topo_matrix::to_string)
      // Operators
      .function("getValue", emscripten::select_overload<gp_GTrsf &()>(
                                &topo_matrix::get_value));

  class_<topo_plane>("Plane")
      .constructor<const gp_Pln &>()
      .constructor<const topo_vector &, const topo_vector &,
                   const topo_vector &>()
      // Static factory methods
      .class_function(
          "named", emscripten::optional_override([](emscripten::val stdName,
                                                    emscripten::val origin) {
            std::string name = stdName.as<std::string>();
            topo_vector o = origin.isUndefined() ? topo_vector(0, 0, 0)
                                                 : origin.as<topo_vector>();
            return topo_plane::named(name, o);
          }))
      .class_function(
          "xy", emscripten::optional_override([](emscripten::val origin,
                                                 emscripten::val xDir) {
            topo_vector o = origin.isUndefined() ? topo_vector(0, 0, 0)
                                                 : origin.as<topo_vector>();
            topo_vector x = xDir.isUndefined() ? topo_vector(1, 0, 0)
                                               : xDir.as<topo_vector>();
            return topo_plane::XY(o, x);
          }))
      .class_function(
          "yz", emscripten::optional_override([](emscripten::val origin,
                                                 emscripten::val xDir) {
            topo_vector o = origin.isUndefined() ? topo_vector(0, 0, 0)
                                                 : origin.as<topo_vector>();
            topo_vector x = xDir.isUndefined() ? topo_vector(0, 1, 0)
                                               : xDir.as<topo_vector>();
            return topo_plane::YZ(o, x);
          }))
      .class_function(
          "zx", emscripten::optional_override([](emscripten::val origin,
                                                 emscripten::val xDir) {
            topo_vector o = origin.isUndefined() ? topo_vector(0, 0, 0)
                                                 : origin.as<topo_vector>();
            topo_vector x = xDir.isUndefined() ? topo_vector(0, 0, 1)
                                               : xDir.as<topo_vector>();
            return topo_plane::ZX(o, x);
          }))
      .class_function(
          "xz", emscripten::optional_override([](emscripten::val origin,
                                                 emscripten::val xDir) {
            topo_vector o = origin.isUndefined() ? topo_vector(0, 0, 0)
                                                 : origin.as<topo_vector>();
            topo_vector x = xDir.isUndefined() ? topo_vector(1, 0, 0)
                                               : xDir.as<topo_vector>();
            return topo_plane::XZ(o, x);
          }))
      .class_function(
          "yx", emscripten::optional_override([](emscripten::val origin,
                                                 emscripten::val xDir) {
            topo_vector o = origin.isUndefined() ? topo_vector(0, 0, 0)
                                                 : origin.as<topo_vector>();
            topo_vector x = xDir.isUndefined() ? topo_vector(0, 1, 0)
                                               : xDir.as<topo_vector>();
            return topo_plane::YX(o, x);
          }))
      .class_function(
          "zy", emscripten::optional_override([](emscripten::val origin,
                                                 emscripten::val xDir) {
            topo_vector o = origin.isUndefined() ? topo_vector(0, 0, 0)
                                                 : origin.as<topo_vector>();
            topo_vector x = xDir.isUndefined() ? topo_vector(0, 0, 1)
                                               : xDir.as<topo_vector>();
            return topo_plane::ZY(o, x);
          }))
      .class_function(
          "front", emscripten::optional_override([](emscripten::val origin,
                                                    emscripten::val xDir) {
            topo_vector o = origin.isUndefined() ? topo_vector(0, 0, 0)
                                                 : origin.as<topo_vector>();
            topo_vector x = xDir.isUndefined() ? topo_vector(1, 0, 0)
                                               : xDir.as<topo_vector>();
            return topo_plane::front(o, x);
          }))
      .class_function(
          "back", emscripten::optional_override([](emscripten::val origin,
                                                   emscripten::val xDir) {
            topo_vector o = origin.isUndefined() ? topo_vector(0, 0, 0)
                                                 : origin.as<topo_vector>();
            topo_vector x = xDir.isUndefined() ? topo_vector(-1, 0, 0)
                                               : xDir.as<topo_vector>();
            return topo_plane::back(o, x);
          }))
      .class_function(
          "left", emscripten::optional_override([](emscripten::val origin,
                                                   emscripten::val xDir) {
            topo_vector o = origin.isUndefined() ? topo_vector(0, 0, 0)
                                                 : origin.as<topo_vector>();
            topo_vector x = xDir.isUndefined() ? topo_vector(0, 0, 1)
                                               : xDir.as<topo_vector>();
            return topo_plane::left(o, x);
          }))
      .class_function(
          "right", emscripten::optional_override([](emscripten::val origin,
                                                    emscripten::val xDir) {
            topo_vector o = origin.isUndefined() ? topo_vector(0, 0, 0)
                                                 : origin.as<topo_vector>();
            topo_vector x = xDir.isUndefined() ? topo_vector(0, 0, -1)
                                               : xDir.as<topo_vector>();
            return topo_plane::right(o, x);
          }))
      .class_function(
          "top", emscripten::optional_override([](emscripten::val origin,
                                                  emscripten::val xDir) {
            topo_vector o = origin.isUndefined() ? topo_vector(0, 0, 0)
                                                 : origin.as<topo_vector>();
            topo_vector x = xDir.isUndefined() ? topo_vector(1, 0, 0)
                                               : xDir.as<topo_vector>();
            return topo_plane::top(o, x);
          }))
      .class_function(
          "bottom", emscripten::optional_override([](emscripten::val origin,
                                                     emscripten::val xDir) {
            topo_vector o = origin.isUndefined() ? topo_vector(0, 0, 0)
                                                 : origin.as<topo_vector>();
            topo_vector x = xDir.isUndefined() ? topo_vector(1, 0, 0)
                                               : xDir.as<topo_vector>();
            return topo_plane::bottom(o, x);
          }))
      // Properties
      .function("origin", &topo_plane::origin)
      .function("xDir", &topo_plane::x_dir)
      .function("yDir", &topo_plane::y_dir)
      .function("zDir", &topo_plane::z_dir)
      // Methods
      .function(
          "toWorldCoordsForVector",
          emscripten::select_overload<topo_vector(const topo_vector &) const>(
              &topo_plane::to_world_coords))
      .function("toWorldCoordsForShape",
                emscripten::select_overload<shape(const shape &) const>(
                    &topo_plane::to_world_coords))
      .function(
          "toLocalCoordsForVector",
          emscripten::select_overload<topo_vector(const topo_vector &) const>(
              &topo_plane::to_local_coords))
      .function("toLocalCoordsForShape",
                emscripten::select_overload<shape(const shape &) const>(
                    &topo_plane::to_local_coords))
      .function("location", &topo_plane::location)
      .function("setOrigin", &topo_plane::set_origin)
      .function("setOrigin2d", &topo_plane::set_origin2d)
      .function(
          "rotated", emscripten::optional_override([](const topo_plane &self,
                                                      emscripten::val rotate) {
            topo_vector r = rotate.isUndefined() ? topo_vector(0, 0, 0)
                                                 : rotate.as<topo_vector>();
            return self.rotated(r);
          }))
      .function("mirrorInPlane",
                emscripten::optional_override(
                    [](const topo_plane &self, const std::vector<shape> &shapes,
                       emscripten::val axis) {
                      std::string a =
                          axis.isUndefined() ? "X" : axis.as<std::string>();
                      return self.mirror_in_plane(shapes, a);
                    }))
      // Conversion
      .function("toPln", &topo_plane::operator gp_Pln);

  class_<topo_vector>("Vector")
      .constructor<>()
      .constructor(emscripten::optional_override(
          [](double x, double y, double z) { return topo_vector(x, y, z); }))
      .constructor(emscripten::optional_override([](emscripten::val v) {
        if (v.instanceof(emscripten::val::global("gp_Vec"))) {
          return topo_vector(v.as<gp_Vec>());
        } else if (v.instanceof(emscripten::val::global("gp_Pnt"))) {
          return topo_vector(v.as<gp_Pnt>());
        } else if (v.instanceof(emscripten::val::global("gp_Pnt"))) {
          return topo_vector(v.as<gp_Pnt>());
        } else if (v.instanceof(emscripten::val::global("gp_Dir"))) {
          return topo_vector(v.as<gp_Dir>());
        } else if (v.instanceof(emscripten::val::global("gp_XYZ"))) {
          return topo_vector(v.as<gp_XYZ>());
        } else if (v.isArray() && v["length"].as<unsigned>() == 3) {
          std::array<double, 3> arr = {v[0].as<double>(), v[1].as<double>(),
                                       v[2].as<double>()};
          return topo_vector(arr);
        } else {
          throw std::runtime_error(
              "Invalid argument type for Matrix constructor");
        }
      }))
      // Properties
      .property("x", &topo_vector::x, &topo_vector::set_x)
      .property("y", &topo_vector::y, &topo_vector::set_y)
      .property("z", &topo_vector::z, &topo_vector::set_z)
      // Methods
      .function("length", &topo_vector::length)
      .function("magnitude", &topo_vector::magnitude)
      .function("angle", &topo_vector::angle)
      .function(
          "toTuple", emscripten::optional_override([](const topo_vector &self) {
            auto tuple = self.to_tuple();
            emscripten::val result = emscripten::val::array();
            result.call<void>("push", emscripten::val(std::get<0>(tuple)));
            result.call<void>("push", emscripten::val(std::get<1>(tuple)));
            result.call<void>("push", emscripten::val(std::get<2>(tuple)));
            return result;
          }))
      .function("toPnt", &topo_vector::to_pnt)
      .function("toDir", &topo_vector::to_dir)
      .function("toVec", &topo_vector::to_vec)
      .function("toXYZ", &topo_vector::to_xyz)
      .function("cross", &topo_vector::cross)
      .function("dot", &topo_vector::dot)
      .function("add", &topo_vector::add)
      .function("sub", &topo_vector::sub)
      .function("multiply", &topo_vector::multiply)
      .function("normalized", &topo_vector::normalized)
      .function("getAngle", &topo_vector::get_angle)
      .function("getSignedAngle", &topo_vector::get_signed_angle)
      .function("projectToLine", &topo_vector::project_to_line)
      .function("projectToPlane", &topo_vector::project_to_plane)
      .function("transform", &topo_vector::transform)
      .function("isEqual",
                emscripten::optional_override([](const topo_vector &self,
                                                 const topo_vector &other,
                                                 emscripten::val tolerance) {
                  double tol =
                      tolerance.isUndefined() ? 1e-5 : tolerance.as<double>();
                  return self.is_equal(other, tol);
                }))
      .function("toString", &topo_vector::to_string)
      // Operators
      .function("neg", emscripten::optional_override(
                           [](const topo_vector &self) { return -self; }))
      .function("plus",
                emscripten::optional_override(
                    [](const topo_vector &self, const topo_vector &other) {
                      return self + other;
                    }))
      .function("minus",
                emscripten::optional_override(
                    [](const topo_vector &self, const topo_vector &other) {
                      return self - other;
                    }))
      .function("times", emscripten::optional_override(
                             [](const topo_vector &self, double scalar) {
                               return self * scalar;
                             }))
      .function("div", emscripten::optional_override(
                           [](const topo_vector &self, double scalar) {
                             return self / scalar;
                           }))
      .function("equals",
                emscripten::optional_override(
                    [](const topo_vector &self, const topo_vector &other) {
                      return self == other;
                    }))
      .function("notEquals",
                emscripten::optional_override(
                    [](const topo_vector &self, const topo_vector &other) {
                      return self != other;
                    }));

  emscripten::class_<geometry_object>("GeometryObject")
      .smart_ptr<std::shared_ptr<geometry_object>>("GeometryObject")
      .function("isNull", &geometry_object::is_null)
      .function("isValid", &geometry_object::is_valid)
      .function("type", &geometry_object::type)
      .function("boundingBox",
                emscripten::optional_override([](geometry_object &self,
                                                 emscripten::val tolerance) {
                  double tol =
                      tolerance.isUndefined() ? 1e-12 : tolerance.as<double>();
                  return self.bounding_box(tol);
                }))
      .function("equals", &geometry_object::equals)
      .function("toBrep", &geometry_object::to_brep);

  emscripten::enum_<texture_mapping_rule>("TextureMappingRule")
      .value("CUBE", texture_cube)
      .value("NORMAL", texture_normal)
      .value("NORMAL_AUTO_SCALE", texture_normal_auto_scale);

  // 添加shape_geom_type枚举绑定
  emscripten::enum_<shape_geom_type>("ShapeGeomType")
      .value("NULL", shape_geom_null)
      .value("VERTEX", shape_geom_vertex)
      .value("WIRE", shape_geom_wire)
      .value("SHELL", shape_geom_shell)
      .value("SOLID", shape_geom_solid)
      .value("COMPSOLID", shape_geom_compsolid)
      .value("COMPOUND", shape_geom_compound)
      .value("LINE", shape_geom_line)
      .value("CIRCLE", shape_geom_circle)
      .value("HYPERBOLA", shape_geom_hyperbola)
      .value("PARABOLA", shape_geom_parabola)
      .value("ELLIPSE", shape_geom_ellipse)
      .value("BEZIER_CURVE", shape_geom_bezier_curve)
      .value("BSPLINE_CURVE", shape_geom_bspline_curve)
      .value("OFFSET_CURVE", shape_geom_offset_curve)
      .value("OTHER_CURVE", shape_geom_other_curve)
      .value("PLANE", shape_geom_plane)
      .value("CYLINDER", shape_geom_cylinder)
      .value("CONE", shape_geom_cone)
      .value("SPHERE", shape_geom_sphere)
      .value("TORUS", shape_geom_torus)
      .value("BEZIER_SURFACE", shape_geom_bezier_surface)
      .value("BSPLINE_SURFACE", shape_geom_bspline_surface)
      .value("OFFSET_SURFACE", shape_geom_offset_surface)
      .value("OTHER_SURFACE", shape_geom_other_surface)
      .value("REVOLVED_SURFACE", shape_geom_revolved_surface)
      .value("EXTRUDED_SURFACE", shape_geom_extruded_surface);

  // 绑定shape类基础部分
  class_<shape, base<geometry_object>>("Shape")
      .smart_ptr<std::shared_ptr<shape>>("Shape")
      // 构造函数
      .constructor<>()
      .constructor(emscripten::optional_override(
          [](TopoDS_Shape shp, emscripten::val forConstruction) {
            bool fc = forConstruction.isUndefined()
                          ? false
                          : forConstruction.as<bool>();
            return shape(shp, fc);
          }))
      // 静态方法
      .class_function("makeShape",
                      emscripten::optional_override(
                          [](emscripten::val shpVal) -> emscripten::val {
                            if (shpVal.isNull() || shpVal.isUndefined()) {
                              return emscripten::val::null();
                            }
                            try {
                              TopoDS_Shape shp = shpVal.as<TopoDS_Shape>();
                              auto result = shape::make_shape(shp);
                              if (result) {
                                return emscripten::val(*result);
                              }
                              return emscripten::val::null();
                            } catch (...) {
                              return emscripten::val::null();
                            }
                          }))
      .class_function("importFromBrep", &shape::import_from_brep)
      .class_function(
          "combinedCenter",
          emscripten::optional_override([](emscripten::val shapesVal) {
            std::vector<shape> shapes;
            if (!shapesVal.isUndefined() && !shapesVal.isNull()) {
              const size_t length = shapesVal["length"].as<size_t>();
              shapes.reserve(length);
              for (size_t i = 0; i < length; ++i) {
                shapes.push_back(shapesVal[i].as<shape>());
              }
            }
            return shape::combined_center(shapes);
          }))
      .class_function(
          "combinedCenterOfBoundingBox",
          emscripten::optional_override([](emscripten::val shapesVal) {
            std::vector<shape> shapes;
            if (!shapesVal.isUndefined() && !shapesVal.isNull()) {
              const size_t length = shapesVal["length"].as<size_t>();
              shapes.reserve(length);
              for (size_t i = 0; i < length; ++i) {
                shapes.push_back(shapesVal[i].as<shape>());
              }
            }
            return shape::combined_center_of_bounding_box(shapes);
          }))
      .class_function(
          "filter", emscripten::optional_override(
                        [](const selector_ptr &sel,
                           emscripten::val shapesVal) -> emscripten::val {
                          std::vector<shape> shapes;
                          if (!shapesVal.isUndefined() && !shapesVal.isNull()) {
                            const size_t length =
                                shapesVal["length"].as<size_t>();
                            shapes.reserve(length);
                            for (size_t i = 0; i < length; ++i) {
                              shapes.push_back(shapesVal[i].as<shape>());
                            }
                          }
                          return emscripten::val(shape::filter(sel, shapes));
                        }))
      // 基础方法
      .function("isNull", &shape::is_null)
      .function("isValid", &shape::is_valid)
      .function("isSolid", &shape::is_solid)
      .function("type", &shape::type)
      .function("boundingBox",
                emscripten::optional_override([](const shape &self,
                                                 emscripten::val tolerance) {
                  double tol =
                      tolerance.isUndefined() ? 1e-12 : tolerance.as<double>();
                  return self.bounding_box(tol);
                }))
      .function("bbox", emscripten::optional_override(
                            [](const shape &self, emscripten::val tolerance) {
                              double tol = tolerance.isUndefined()
                                               ? 1e-12
                                               : tolerance.as<double>();
                              return self.bbox(tol);
                            }))
      .function("hashCode", &shape::hash_code)
      .function("equals", &shape::equals)
      .function("isSame", &shape::is_same)
      .function("forConstruction", &shape::for_construction)
      // 属性设置
      .function("setSurfaceColour", &shape::set_surface_colour)
      .function("setCurveColour", &shape::set_curve_colour)
      .function("setLabel", emscripten::optional_override(
                                [](shape &self, const std::string &str) {
                                  self.set_label(str.c_str());
                                }))
      .function("setUOrigin", &shape::set_u_origin)
      .function("setVOrigin", &shape::set_v_origin)
      .function("setURepeat", &shape::set_u_repeat)
      .function("setVRepeat", &shape::set_v_repeat)
      .function("setScaleV", &shape::set_scale_v)
      .function("setScaleU", &shape::set_scale_u)
      .function("setAutoScaleSizeOnU", &shape::set_auto_scale_size_on_u)
      .function("setAutoScaleSizeOnV", &shape::set_auto_scale_size_on_v)
      .function("setTextureMapType", &shape::set_txture_map_type)
      .function("setRotationAngle", &shape::set_rotation_angle)
      // 属性获取&shape::surface_colour
      .function("surfaceColour",
                emscripten::select_overload<Quantity_Color() const>(
                    &shape::surface_colour))
      .function("curveColour", &shape::curve_colour)
      .function("label", emscripten::optional_override([](const shape &self) {
                  std::string label = self.label();
                  return emscripten::val(label);
                }))
      .function("getUOrigin", &shape::get_u_origin)
      .function("getVOrigin", &shape::get_v_origin)
      .function("getURepeat", &shape::get_u_repeat)
      .function("getVRepeat", &shape::get_v_repeat)
      .function("getScaleV", &shape::get_scale_v)
      .function("getScaleU", &shape::get_scale_u)
      .function("getAutoScaleSizeOnU", &shape::get_auto_scale_size_on_u)
      .function("getAutoScaleSizeOnV", &shape::get_auto_scale_size_on_v)
      .function("getTextureMapType", &shape::get_txture_map_type)
      .function("getRotationAngle", &shape::get_rotation_angle)
      // 变换操作
      .function(
          "transform",
          emscripten::optional_override([](shape &self, emscripten::val arg) {
            if (arg.instanceof(emscripten::val::global("gp_Trsf"))) {
              return self.transform(arg.as<gp_Trsf>());
            } else if (arg.instanceof(emscripten::val::global("topo_matrix"))) {
              return self.transform(arg.as<topo_matrix>());
            }
            throw std::runtime_error("Invalid argument type for transform");
          }))
      .function("translate", &shape::translate)
      .function("rotateFromPoint",
                emscripten::select_overload<int(double, gp_Pnt, gp_Pnt)>(
                    &shape::rotate))
      .function(
          "rotateFromAxis1",
          emscripten::select_overload<int(double, gp_Ax1)>(&shape::rotate))
      .function("rotateFromQuaternion",
                emscripten::select_overload<int(gp_Quaternion)>(&shape::rotate))
      .function("scale", &shape::scale)
      .function(
          "mirrorFromTwoPoint",
          emscripten::select_overload<int(gp_Pnt, gp_Pnt)>(&shape::mirror))
      .function(
          "mirrorFromPointNorm",
          emscripten::select_overload<int(gp_Pnt, gp_Vec)>(&shape::mirror))
      .function("mirrorFromAxis1",
                emscripten::select_overload<int(gp_Ax1)>(&shape::mirror))
      .function("mirrorFromAxis2",
                emscripten::select_overload<int(gp_Ax2)>(&shape::mirror))
      // 几何计算
      .function("centreOfMass", &shape::centre_of_mass)
      .function("centerOfBoundBox", &shape::center_of_bound_box)
      .function("computeMass", &shape::compute_mass)
      .function("computeArea", &shape::compute_area)
      .function("distance", &shape::distance)
      .function("distances",
                emscripten::optional_override(
                    [](const topo::shape &self, emscripten::val othersVal) {
                      std::vector<topo::shape> others;
                      if (!othersVal.isUndefined() && !othersVal.isNull()) {
                        const size_t length = othersVal["length"].as<size_t>();
                        others.reserve(length);
                        for (size_t i = 0; i < length; ++i) {
                          others.push_back(othersVal[i].as<topo::shape>());
                        }
                      }

                      auto distances = self.distances(others);
                      emscripten::val result = emscripten::val::array();
                      for (const auto &d : distances) {
                        result.call<void>("push", d);
                      }
                      return result;
                    }))
      // 非破坏性变换方法
      .function(
          "transformed", emscripten::optional_override([](const shape &self,
                                                          emscripten::val arg) {
            if (arg.instanceof(emscripten::val::global("gp_Trsf"))) {
              return self.transformed(arg.as<gp_Trsf>());
            } else if (arg.instanceof(emscripten::val::global("topo_matrix"))) {
              return self.transformed(arg.as<topo_matrix>());
            }
            throw std::runtime_error("Invalid argument type for transformed");
          }))
      .function("translated", &shape::translated)
      .function(
          "rotatedFromPoint",
          emscripten::select_overload<shape(double, gp_Pnt, gp_Pnt) const>(
              &shape::rotated))
      .function("rotatedFromAxis1",
                emscripten::select_overload<shape(double, gp_Ax1) const>(
                    &shape::rotated))
      .function("rotatedFromQuaternion",
                emscripten::select_overload<shape(gp_Quaternion) const>(
                    &shape::rotated))
      .function("scaled", &shape::scaled)
      .function("mirroredFromTwoPoint",
                emscripten::select_overload<shape(gp_Pnt, gp_Pnt) const>(
                    &shape::mirrored))
      .function("mirroredFromPointNorm",
                emscripten::select_overload<shape(gp_Pnt, gp_Vec) const>(
                    &shape::mirrored))
      .function(
          "mirroredFromAxis1",
          emscripten::select_overload<shape(gp_Ax1) const>(&shape::mirrored))
      .function(
          "mirroredFromAxis2",
          emscripten::select_overload<shape(gp_Ax2) const>(&shape::mirrored))
      // 位置和方向操作
      .function("location", emscripten::optional_override(
                                [](const shape &self) -> emscripten::val {
                                  double loc[3];
                                  if (self.location(loc)) {
                                    emscripten::val result =
                                        emscripten::val::array();
                                    result.call<void>("push", loc[0]);
                                    result.call<void>("push", loc[1]);
                                    result.call<void>("push", loc[2]);
                                    return result;
                                  }
                                  return emscripten::val::null();
                                }))
      .function("setLocation", &shape::set_location)
      .function("located", &shape::located)
      .function(
          "moveFromLocation",
          emscripten::select_overload<int(const topo_location &)>(&shape::move))
      .function("move",
                emscripten::optional_override(
                    [](shape &self, emscripten::val x, emscripten::val y,
                       emscripten::val z, emscripten::val rx,
                       emscripten::val ry, emscripten::val rz) {
                      double dx = x.isUndefined() ? 0 : x.as<double>();
                      double dy = y.isUndefined() ? 0 : y.as<double>();
                      double dz = z.isUndefined() ? 0 : z.as<double>();
                      double drx = rx.isUndefined() ? 0 : rx.as<double>();
                      double dry = ry.isUndefined() ? 0 : ry.as<double>();
                      double drz = rz.isUndefined() ? 0 : rz.as<double>();
                      return self.move(dx, dy, dz, drx, dry, drz);
                    }))
      .function("moveFromVector",
                emscripten::select_overload<int(const gp_Vec &)>(&shape::move))
      .function("movedFromLocation",
                emscripten::select_overload<shape(const topo_location &) const>(
                    &shape::moved))
      .function("movedFromLocations",
                emscripten::optional_override(
                    [](const shape &self, emscripten::val locsVal) {
                      std::vector<topo_location> locs;
                      if (!locsVal.isUndefined() && !locsVal.isNull()) {
                        const size_t length = locsVal["length"].as<size_t>();
                        locs.reserve(length);
                        for (size_t i = 0; i < length; ++i) {
                          locs.push_back(locsVal[i].as<topo_location>());
                        }
                      }
                      return self.moved(locs);
                    }))
      .function("moved",
                emscripten::optional_override(
                    [](const shape &self, emscripten::val x, emscripten::val y,
                       emscripten::val z, emscripten::val rx,
                       emscripten::val ry, emscripten::val rz) {
                      double dx = x.isUndefined() ? 0 : x.as<double>();
                      double dy = y.isUndefined() ? 0 : y.as<double>();
                      double dz = z.isUndefined() ? 0 : z.as<double>();
                      double drx = rx.isUndefined() ? 0 : rx.as<double>();
                      double dry = ry.isUndefined() ? 0 : ry.as<double>();
                      double drz = rz.isUndefined() ? 0 : rz.as<double>();
                      return self.moved(dx, dy, dz, drx, dry, drz);
                    }))
      .function("movedFromVector",
                emscripten::select_overload<shape(const gp_Vec &) const>(
                    &shape::moved))
      .function("movedFromVectors",
                emscripten::optional_override(
                    [](const shape &self, emscripten::val vecsVal) {
                      std::vector<gp_Vec> vecs;
                      if (!vecsVal.isUndefined() && !vecsVal.isNull()) {
                        const size_t length = vecsVal["length"].as<size_t>();
                        vecs.reserve(length);
                        for (size_t i = 0; i < length; ++i) {
                          vecs.push_back(vecsVal[i].as<gp_Vec>());
                        }
                      }
                      return self.moved(vecs);
                    }))
      // 方向操作
      .function("getOrientation", &shape::get_orientation)
      .function("setOrientation", &shape::set_orientation)
      .function("oriented", &shape::oriented)
      // 子元素访问
      .function(
          "children",
          emscripten::optional_override([](const shape &s) -> emscripten::val {
            auto vec = s.children();

            emscripten::val result = emscripten::val::array();
            for (const auto &d : vec) {
              result.call<void>("push", d);
            }
            return result;
          }))
      .function(
          "getShapes",
          emscripten::optional_override(
              [](const shape &s, TopAbs_ShapeEnum kind) -> emscripten::val {
                auto vec = s.get_shapes(kind);

                emscripten::val result = emscripten::val::array();
                for (const auto &d : vec) {
                  result.call<void>("push", d);
                }
                return result;
              }))
      .function(
          "vertices",
          emscripten::optional_override([](const shape &s) -> emscripten::val {
            auto vec = s.vertices();

            emscripten::val result = emscripten::val::array();
            for (const auto &d : vec) {
              result.call<void>("push", d);
            }
            return result;
          }))
      .function(
          "edges",
          emscripten::optional_override([](const shape &s) -> emscripten::val {
            auto vec = s.edges();

            emscripten::val result = emscripten::val::array();
            for (const auto &d : vec) {
              result.call<void>("push", d);
            }
            return result;
          }))
      .function(
          "wires",
          emscripten::optional_override([](const shape &s) -> emscripten::val {
            auto vec = s.wires();

            emscripten::val result = emscripten::val::array();
            for (const auto &d : vec) {
              result.call<void>("push", d);
            }
            return result;
          }))
      .function(
          "faces",
          emscripten::optional_override([](const shape &s) -> emscripten::val {
            auto vec = s.faces();

            emscripten::val result = emscripten::val::array();
            for (const auto &d : vec) {
              result.call<void>("push", d);
            }
            return result;
          }))
      .function(
          "shells",
          emscripten::optional_override([](const shape &s) -> emscripten::val {
            auto vec = s.shells();

            emscripten::val result = emscripten::val::array();
            for (const auto &d : vec) {
              result.call<void>("push", d);
            }
            return result;
          }))
      .function(
          "solids",
          emscripten::optional_override([](const shape &s) -> emscripten::val {
            auto vec = s.solids();

            emscripten::val result = emscripten::val::array();
            for (const auto &d : vec) {
              result.call<void>("push", d);
            }
            return result;
          }))
      .function(
          "compounds",
          emscripten::optional_override([](const shape &s) -> emscripten::val {
            auto vec = s.compounds();

            emscripten::val result = emscripten::val::array();
            for (const auto &d : vec) {
              result.call<void>("push", d);
            }
            return result;
          }))
      .function(
          "compSolids",
          emscripten::optional_override([](const shape &s) -> emscripten::val {
            auto vec = s.comp_solids();

            emscripten::val result = emscripten::val::array();
            for (const auto &d : vec) {
              result.call<void>("push", d);
            }
            return result;
          }))
      // 数量统计
      .function("numVertices", &shape::num_vertices)
      .function("numEdges", &shape::num_edges)
      .function("numWires", &shape::num_wires)
      .function("numFaces", &shape::num_faces)
      .function("numShells", &shape::num_shells)
      .function("numSolids", &shape::num_solids)
      .function("numCompounds", &shape::num_compounds)
      .function("numCompSolids", &shape::num_comp_solids)
      // 导出导入
      .function("exportStep", &shape::export_step)
      .function("exportBrep", &shape::export_brep)
      .class_function("importFromBrep", &shape::import_from_brep)
      // 其他实用方法
      .function("clean", &shape::clean)
      .function("ancestors", emscripten::optional_override(
                                 [](const shape &self, const shape &shape,
                                    TopAbs_ShapeEnum kind) -> emscripten::val {
                                   auto result = self.ancestors(shape, kind);
                                   if (result) {
                                     return emscripten::val(*result);
                                   }
                                   return emscripten::val::null();
                                 }))
      .function("siblings", emscripten::optional_override(
                                [](const shape &self, const shape &shape,
                                   TopAbs_ShapeEnum kind,
                                   emscripten::val level) -> emscripten::val {
                                  int lvl =
                                      level.isUndefined() ? 1 : level.as<int>();
                                  auto result = self.siblings(shape, kind, lvl);
                                  if (result) {
                                    return emscripten::val(*result);
                                  }
                                  return emscripten::val::null();
                                }))
      .function("fixShape", &shape::fix_shape)
      .function("findPlane",
                emscripten::optional_override(
                    [](const shape &self,
                       emscripten::val tolerance) -> emscripten::val {
                      double tol = tolerance.isUndefined()
                                       ? 1e-6
                                       : tolerance.as<double>();
                      auto plane = self.find_plane(tol);
                      return emscripten::val(plane);
                    }))
      .function("toSplines",
                emscripten::optional_override(
                    [](const shape &self, emscripten::val degree,
                       emscripten::val tolerance,
                       emscripten::val nurbs) -> emscripten::val {
                      int deg = degree.isUndefined() ? 3 : degree.as<int>();
                      double tol = tolerance.isUndefined()
                                       ? 1e-3
                                       : tolerance.as<double>();
                      bool nrb = nurbs.isUndefined() ? false : nurbs.as<bool>();
                      auto result = self.to_splines(deg, tol, nrb);
                      return result ? emscripten::val(*result)
                                    : emscripten::val::null();
                    }))
      .function("toNurbs", emscripten::optional_override(
                               [](const shape &self) -> emscripten::val {
                                 auto result = self.to_nurbs();
                                 return result ? emscripten::val(*result)
                                               : emscripten::val::null();
                               }))
      .function("toString", emscripten::optional_override(
                                [](const shape &self, emscripten::val tolerance,
                                   emscripten::val angularTolerance) {
                                  double tol = tolerance.isUndefined()
                                                   ? 1e-3
                                                   : tolerance.as<double>();
                                  double angTol =
                                      angularTolerance.isUndefined()
                                          ? 0.1
                                          : angularTolerance.as<double>();
                                  return self.to_string(tol, angTol);
                                }))
      // 操作符重载
      .function("equals", &shape::operator==)
      .function("notEquals", &shape::operator!=)
      .function("lessThan", &shape::operator<)
      // 网格生成方法
      .function("writeTriangulation",
                emscripten::optional_override([](shape &self, double precision,
                                                 double deflection,
                                                 double angle, bool uv_coords) {
                  emscripten_mesh_receiver m;
                  int r = self.write_triangulation(m, precision, deflection,
                                                   angle, uv_coords);
                  if (r == 0) {
                    return m.get_mesh_data();
                  }
                  return emscripten::val::null();
                }))
      .function(
          "mesh",
          emscripten::optional_override(
              [](shape &self, emscripten::val precision,
                 emscripten::val deflection, emscripten::val angle,
                 emscripten::val uv_coords) {
                emscripten_mesh_receiver m;
                double prec =
                    precision.isUndefined() ? 1.0e-06 : precision.as<double>();
                double defl =
                    deflection.isUndefined() ? 0.1 : deflection.as<double>();
                double ang = angle.isUndefined() ? 0.5 : angle.as<double>();
                bool uv =
                    uv_coords.isUndefined() ? false : uv_coords.as<bool>();
                int r = self.mesh(m, prec, defl, ang, uv);
                if (r == 0) {
                  return m.get_mesh_data();
                }
                return emscripten::val::null();
              }))
      .function("meshEdges",
                emscripten::optional_override([](shape &self,
                                                 emscripten::val precision,
                                                 emscripten::val angle) {
                  emscripten_mesh_edges_receiver receiver;
                  double prec = precision.isUndefined()
                                    ? 1.0e-06
                                    : precision.as<double>();
                  double ang = angle.isUndefined() ? 0.1 : angle.as<double>();
                  int r = self.mesh_edges(receiver, prec, ang);
                  if (r == 0) {
                    return receiver.get_edges_data();
                  }
                  return emscripten::val::null();
                }))
      // 选择器相关功能
      .function("selectVertices",
                emscripten::select_overload<shape(const selector_ptr &) const>(
                    &shape::vertices))
      .function("selectEdges",
                emscripten::select_overload<shape(const selector_ptr &) const>(
                    &shape::edges))
      .function("selectWires",
                emscripten::select_overload<shape(const selector_ptr &) const>(
                    &shape::wires))
      .function("selectFaces",
                emscripten::select_overload<shape(const selector_ptr &) const>(
                    &shape::faces))
      .function("selectShells",
                emscripten::select_overload<shape(const selector_ptr &) const>(
                    &shape::shells))
      .function("selectSolids",
                emscripten::select_overload<shape(const selector_ptr &) const>(
                    &shape::solids))
      .function("selectCompounds",
                emscripten::select_overload<shape(const selector_ptr &) const>(
                    &shape::compounds))
      .function("selectCompSolids",
                emscripten::select_overload<shape(const selector_ptr &) const>(
                    &shape::comp_solids))
      // 类型转换
      .function("castVertex", emscripten::optional_override(
                                  [](const shape &self) -> emscripten::val {
                                    auto result = self.cast<vertex>();
                                    return result ? emscripten::val(*result)
                                                  : emscripten::val::null();
                                  }))
      .function("castEdge", emscripten::optional_override(
                                [](const shape &self) -> emscripten::val {
                                  auto result = self.cast<edge>();
                                  return result ? emscripten::val(*result)
                                                : emscripten::val::null();
                                }))
      .function("castWire", emscripten::optional_override(
                                [](const shape &self) -> emscripten::val {
                                  auto result = self.cast<wire>();
                                  return result ? emscripten::val(*result)
                                                : emscripten::val::null();
                                }))
      .function("castFace", emscripten::optional_override(
                                [](const shape &self) -> emscripten::val {
                                  auto result = self.cast<face>();
                                  return result ? emscripten::val(*result)
                                                : emscripten::val::null();
                                }))
      .function("castShell", emscripten::optional_override(
                                 [](const shape &self) -> emscripten::val {
                                   auto result = self.cast<shell>();
                                   return result ? emscripten::val(*result)
                                                 : emscripten::val::null();
                                 }))
      .function("castSolid", emscripten::optional_override(
                                 [](const shape &self) -> emscripten::val {
                                   auto result = self.cast<solid>();
                                   return result ? emscripten::val(*result)
                                                 : emscripten::val::null();
                                 }))
      .function("castCompound", emscripten::optional_override(
                                    [](const shape &self) -> emscripten::val {
                                      auto result = self.cast<compound>();
                                      return result ? emscripten::val(*result)
                                                    : emscripten::val::null();
                                    }))
      .function("castCompSolid", emscripten::optional_override(
                                     [](const shape &self) -> emscripten::val {
                                       auto result = self.cast<comp_solid>();
                                       return result ? emscripten::val(*result)
                                                     : emscripten::val::null();
                                     }))
      .function("autoCast",
                emscripten::optional_override(
                    [](const shape &self) -> emscripten::val {
                      if (!self) {
                        return emscripten::val::null();
                      }

                      switch (self.shape_type()) {
                      case TopAbs_VERTEX:
                        return emscripten::val(*self.cast<vertex>());
                      case TopAbs_EDGE:
                        return emscripten::val(*self.cast<edge>());
                      case TopAbs_WIRE:
                        return emscripten::val(*self.cast<wire>());
                      case TopAbs_FACE:
                        return emscripten::val(*self.cast<face>());
                      case TopAbs_SHELL:
                        return emscripten::val(*self.cast<shell>());
                      case TopAbs_SOLID:
                        return emscripten::val(*self.cast<solid>());
                      case TopAbs_COMPOUND:
                        return emscripten::val(*self.cast<compound>());
                      case TopAbs_COMPSOLID:
                        return emscripten::val(*self.cast<comp_solid>());
                      default:
                        return emscripten::val::null();
                      }
                    }))
      // 其他方法
      .function("copy", emscripten::optional_override([](const shape &self,
                                                         emscripten::val deep) {
                  bool deepCopy = deep.isUndefined() ? true : deep.as<bool>();
                  return self.copy(deepCopy);
                }))
      .function("shapeType", &shape::shape_type)
      .function("geomType", &shape::geom_type)
      .function("value",
                emscripten::select_overload<const TopoDS_Shape &() const>(
                    &shape::value));

  // Vertex class binding
  class_<vertex, base<shape>>("Vertex")
      .smart_ptr<std::shared_ptr<vertex>>("Vertex")
      .constructor<>()
      .constructor<Standard_Real, Standard_Real, Standard_Real>()
      .constructor<const gp_Pnt &>()
      // Static methods
      .class_function(
          "makeVertex", emscripten::optional_override([](emscripten::val arg) {
            if (arg.instanceof(emscripten::val::global("gp_Pnt"))) {
              return vertex::make_vertex(arg.as<gp_Pnt>());
            } else if (arg.instanceof(emscripten::val::global("gp_Vec"))) {
              return vertex::make_vertex(arg.as<gp_Vec>());
            }
            throw std::runtime_error("Invalid argument type for makeVertex");
          }))
      // Methods
      .function("value",
                emscripten::select_overload<const TopoDS_Vertex &() const>(
                    &vertex::value))
      .function("point", &vertex::point)
      .function("type", &vertex::type)
      .function("copy", emscripten::optional_override([](const vertex &self,
                                                         emscripten::val deep) {
                  bool deepCopy = deep.isUndefined() ? true : deep.as<bool>();
                  return self.copy(deepCopy);
                }));

  // VertexIterator class binding
  class_<vertex_iterator>("VertexIterator")
      .constructor<shape &>()
      .function("reset", &vertex_iterator::reset)
      .function("next", &vertex_iterator::next);

  // 绑定ParamMode枚举
  emscripten::enum_<shape1d::ParamMode>("ParamMode")
      .value("LENGTH", shape1d::LENGTH)
      .value("PARAM", shape1d::PARAM);

  // 绑定FrameMode枚举
  emscripten::enum_<shape1d::FrameMode>("FrameMode")
      .value("FRENET", shape1d::FRENET)
      .value("CORRECTED_FRENET", shape1d::CORRECTED_FRENET);

  // 绑定shape1d类，继承自shape
  emscripten::class_<shape1d, emscripten::base<shape>>("Shape1D")
      .function("getCurve", &shape1d::get_curve)
      .function("bounds",
                emscripten::optional_override([](const shape1d &self) {
                  auto bounds = self.bounds();
                  emscripten::val result = emscripten::val::array();
                  result.call<void>("push", bounds.first);
                  result.call<void>("push", bounds.second);
                  return result;
                }))
      .function("length", &shape1d::length)
      .function("isClosed", &shape1d::is_closed)
      // 端点访问
      .function("startPoint", &shape1d::start_point)
      .function("endPoint", &shape1d::end_point)
      // 参数化方法
      .function("paramAt", emscripten::select_overload<double(double) const>(
                               &shape1d::param_at))
      .function(
          "ParamAtPoint",
          emscripten::select_overload<double(gp_Pnt) const>(&shape1d::param_at))
      .function("params",
                emscripten::optional_override(
                    [](const shape1d &self, const std::vector<gp_Pnt> &points,
                       emscripten::val tol) {
                      double tolerance =
                          tol.isUndefined() ? 1e-6 : tol.as<double>();
                      std::vector<double> vec = self.params(points, tolerance);

                      emscripten::val result = emscripten::val::array();
                      for (const auto &v : vec) {
                        result.call<void>("push", v);
                      }
                      return result;
                    }))
      .function("paramsLength",
                emscripten::optional_override([](const shape1d &self,
                                                 emscripten::val locationsVal) {
                  std::vector<double> locations;
                  if (!locationsVal.isUndefined() && !locationsVal.isNull()) {
                    const size_t length = locationsVal["length"].as<size_t>();
                    locations.reserve(length);
                    for (size_t i = 0; i < length; ++i) {
                      locations.push_back(locationsVal[i].as<double>());
                    }
                  }

                  auto result = self.params_length(locations);
                  emscripten::val jsArray = emscripten::val::array();
                  for (const auto &val : result) {
                    jsArray.call<void>("push", val);
                  }
                  return jsArray;
                }))
      // 几何特征
      .function("tangentAt",
                emscripten::optional_override(
                    [](const shape1d &self, emscripten::val param) {
                      double p = param.isUndefined() ? 0.5 : param.as<double>();
                      return self.tangent_at(p);
                    }))
      .function(
          "tangents",
          emscripten::optional_override(
              [](const shape1d &self, emscripten::val parametersVal) {
                std::vector<double> parameters;
                if (!parametersVal.isUndefined() && !parametersVal.isNull()) {
                  const size_t length = parametersVal["length"].as<size_t>();
                  parameters.reserve(length);
                  for (size_t i = 0; i < length; ++i) {
                    parameters.push_back(parametersVal[i].as<double>());
                  }
                }

                std::vector<gp_Dir> tans = self.tangents(parameters);
                emscripten::val result = emscripten::val::array();
                for (const auto &tan : tans) {
                  result.call<void>("push", tan);
                }
                return result;
              }))
      .function("normal", &shape1d::normal)
      .function("center", &shape1d::center)
      .function("radius", &shape1d::radius)
      // 位置和采样
      .function("positionAt",
                emscripten::optional_override([](const shape1d &self, double d,
                                                 emscripten::val modeVal) {
                  shape1d::ParamMode mode =
                      modeVal.isUndefined()
                          ? shape1d::LENGTH
                          : static_cast<shape1d::ParamMode>(modeVal.as<int>());
                  return self.position_at(d, mode);
                }))
      .function("positions",
                emscripten::optional_override([](const shape1d &self,
                                                 emscripten::val dsVal,
                                                 emscripten::val modeVal) {
                  // 处理输入参数
                  std::vector<double> ds;
                  if (!dsVal.isUndefined() && !dsVal.isNull()) {
                    const size_t length = dsVal["length"].as<size_t>();
                    ds.reserve(length);
                    for (size_t i = 0; i < length; ++i) {
                      ds.push_back(dsVal[i].as<double>());
                    }
                  }

                  // 处理模式参数
                  shape1d::ParamMode mode =
                      modeVal.isUndefined()
                          ? shape1d::LENGTH
                          : static_cast<shape1d::ParamMode>(modeVal.as<int>());

                  // 调用原始方法
                  std::vector<gp_Pnt> tans = self.positions(ds, mode);
                  // 将结果转换为JavaScript数组
                  emscripten::val result = emscripten::val::array();
                  for (const auto &tan : tans) {
                    result.call<void>("push", tan);
                  }
                  return result;
                }))
      .function(
          "sampleUniform",
          emscripten::optional_override([](const shape1d &self, double n) {
            auto result = self.sample_uniform(n);

            // 转换点数组
            emscripten::val pointsArray = emscripten::val::array();
            for (const auto &point : result.first) {
              pointsArray.call<void>("push", point);
            }

            // 转换参数数组
            emscripten::val paramsArray = emscripten::val::array();
            for (const auto &param : result.second) {
              paramsArray.call<void>("push", param);
            }

            // 返回组合数组
            emscripten::val returnArray = emscripten::val::array();
            returnArray.call<void>("push", pointsArray);
            returnArray.call<void>("push", paramsArray);
            return returnArray;
          }))
      // 定位和投影
      .function(
          "locationAt",
          emscripten::optional_override(
              [](const shape1d &self, double d, emscripten::val modeVal,
                 emscripten::val frameVal, emscripten::val planarVal) {
                shape1d::ParamMode mode =
                    modeVal.isUndefined()
                        ? shape1d::LENGTH
                        : static_cast<shape1d::ParamMode>(modeVal.as<int>());
                shape1d::FrameMode frame =
                    frameVal.isUndefined()
                        ? shape1d::FRENET
                        : static_cast<shape1d::FrameMode>(frameVal.as<int>());
                bool planar =
                    planarVal.isUndefined() ? false : planarVal.as<bool>();

                topo_location loc = self.location_at(d, mode, frame, planar);
                return emscripten::val(loc); // 假设topo_location有对应的val转换
              }))
      .function(
          "locations",
          emscripten::optional_override(
              [](const shape1d &self, emscripten::val dsVal,
                 emscripten::val modeVal, emscripten::val frameVal,
                 emscripten::val planarVal) {
                // 转换输入参数ds
                std::vector<double> ds;
                if (!dsVal.isUndefined() && !dsVal.isNull()) {
                  const size_t length = dsVal["length"].as<size_t>();
                  ds.reserve(length);
                  for (size_t i = 0; i < length; ++i) {
                    ds.push_back(dsVal[i].as<double>());
                  }
                }

                // 处理可选参数
                shape1d::ParamMode mode =
                    modeVal.isUndefined()
                        ? shape1d::LENGTH
                        : static_cast<shape1d::ParamMode>(modeVal.as<int>());
                shape1d::FrameMode frame =
                    frameVal.isUndefined()
                        ? shape1d::FRENET
                        : static_cast<shape1d::FrameMode>(frameVal.as<int>());
                bool planar =
                    planarVal.isUndefined() ? false : planarVal.as<bool>();

                // 调用原始方法
                std::vector<topo_location> locs =
                    self.locations(ds, mode, frame, planar);

                // 转换返回值
                emscripten::val result = emscripten::val::array();
                for (const auto &loc : locs) {
                  result.call<void>(
                      "push",
                      emscripten::val(loc)); // 假设topo_location有对应的val转换
                }
                return result;
              }))
      .function("projected",
                emscripten::optional_override(
                    [](const shape1d &self, const face &f,
                       const gp_Vec &direction, emscripten::val closestVal) {
                      bool closest = closestVal.isUndefined()
                                         ? true
                                         : closestVal.as<bool>();
                      auto result = self.projected(f, direction, closest);

                      if (result.which() == 0) { // shape
                        return emscripten::val(boost::get<shape>(result));
                      } else { // std::vector<shape>
                        const auto &shapes =
                            boost::get<std::vector<shape>>(result);
                        emscripten::val array = emscripten::val::array();
                        for (const auto &s : shapes) {
                          array.call<void>("push", emscripten::val(s));
                        }
                        return array;
                      }
                    }))
      // 曲率分析
      .function(
          "curvatureAt",
          emscripten::optional_override([](const shape1d &self, double d,
                                           emscripten::val modeVal,
                                           emscripten::val resolutionVal) {
            shape1d::ParamMode mode =
                modeVal.isUndefined()
                    ? shape1d::LENGTH
                    : static_cast<shape1d::ParamMode>(modeVal.as<int>());
            double resolution =
                resolutionVal.isUndefined() ? 1e-6 : resolutionVal.as<double>();
            return self.curvature_at(d, mode, resolution);
          }))
      .function("curvatures",
                emscripten::optional_override(
                    [](const shape1d &self, emscripten::val dsVal,
                       emscripten::val modeVal, emscripten::val resolutionVal) {
                      // 转换输入参数ds
                      std::vector<double> ds;
                      if (!dsVal.isUndefined() && !dsVal.isNull()) {
                        const size_t length = dsVal["length"].as<size_t>();
                        ds.reserve(length);
                        for (size_t i = 0; i < length; ++i) {
                          ds.push_back(dsVal[i].as<double>());
                        }
                      }

                      // 处理可选参数
                      shape1d::ParamMode mode =
                          modeVal.isUndefined()
                              ? shape1d::LENGTH
                              : static_cast<shape1d::ParamMode>(
                                    modeVal.as<int>());
                      double resolution = resolutionVal.isUndefined()
                                              ? 1e-6
                                              : resolutionVal.as<double>();

                      // 调用原始方法并转换返回值
                      std::vector<double> curvatures =
                          self.curvatures(ds, mode, resolution);
                      emscripten::val result = emscripten::val::array();
                      for (const auto &c : curvatures) {
                        result.call<void>("push", c);
                      }
                      return result;
                    }));

  // 绑定edge类，继承自shape1d
  emscripten::class_<edge, emscripten::base<shape1d>>("Edge")
      .constructor<>()
      .constructor(emscripten::optional_override(
          [](emscripten::val shpVal, emscripten::val forConstructionVal) {
            TopoDS_Shape shp = shpVal.as<TopoDS_Shape>();
            bool forConstruction = forConstructionVal.isUndefined()
                                       ? false
                                       : forConstructionVal.as<bool>();
            return edge(shp, forConstruction);
          }))
      // 静态创建方法 - 基本类型
      .class_function(
          "makeEdgeFromTwoVertex",
          emscripten::select_overload<edge(const vertex &, const vertex &)>(
              &edge::make_edge))
      .class_function(
          "makeEdgeFromTwoPoint",
          emscripten::select_overload<edge(const gp_Pnt &, const gp_Pnt &)>(
              &edge::make_edge))
      // 静态创建方法 - 直线
      .class_function(
          "makeEdgeFromLine",
          emscripten::select_overload<edge(const gp_Lin &)>(&edge::make_edge))
      .class_function(
          "makeEdgeFromLineParm",
          emscripten::select_overload<edge(const gp_Lin &, Standard_Real,
                                           Standard_Real)>(&edge::make_edge))
      .class_function(
          "makeEdgeFromLinePoint",
          emscripten::select_overload<edge(const gp_Lin &, const gp_Pnt &,
                                           const gp_Pnt &)>(&edge::make_edge))
      .class_function(
          "makeEdgeFromLineVertex",
          emscripten::select_overload<edge(const gp_Lin &, const vertex &,
                                           const vertex &)>(&edge::make_edge))
      // 静态创建方法 - 圆
      .class_function(
          "makeEdgeFromCirc",
          emscripten::select_overload<edge(const gp_Circ &)>(&edge::make_edge))
      .class_function(
          "makeEdgeFromCircParm",
          emscripten::select_overload<edge(const gp_Circ &, Standard_Real,
                                           Standard_Real)>(&edge::make_edge))
      .class_function(
          "makeEdgeFromCircPoint",
          emscripten::select_overload<edge(const gp_Circ &, const gp_Pnt &,
                                           const gp_Pnt &)>(&edge::make_edge))
      .class_function(
          "makeEdgeFromCircVertex",
          emscripten::select_overload<edge(const gp_Circ &, const vertex &,
                                           const vertex &)>(&edge::make_edge))
      // 静态创建方法 - 椭圆
      .class_function(
          "makeEdgeFromElips",
          emscripten::select_overload<edge(const gp_Elips &)>(&edge::make_edge))
      .class_function(
          "makeEdgeFromElipsParm",
          emscripten::select_overload<edge(const gp_Elips &, Standard_Real,
                                           Standard_Real)>(&edge::make_edge))
      .class_function(
          "makeEdgeFromElipsPoint",
          emscripten::select_overload<edge(const gp_Elips &, const gp_Pnt &,
                                           const gp_Pnt &)>(&edge::make_edge))
      .class_function(
          "makeEdgeFromElipsVertex",
          emscripten::select_overload<edge(const gp_Elips &, const vertex &,
                                           const vertex &)>(&edge::make_edge))
      .class_function(
          "makeEdgeFromHyper",
          emscripten::select_overload<edge(const gp_Hypr &)>(&edge::make_edge))
      .class_function(
          "makeEdgeFromHyperParm",
          emscripten::select_overload<edge(const gp_Hypr &, Standard_Real,
                                           Standard_Real)>(&edge::make_edge))
      .class_function(
          "makeEdgeFromHyperPoint",
          emscripten::select_overload<edge(const gp_Hypr &, const gp_Pnt &,
                                           const gp_Pnt &)>(&edge::make_edge))
      .class_function(
          "makeEdgeFromHyperVertex",
          emscripten::select_overload<edge(const gp_Hypr &, const vertex &,
                                           const vertex &)>(&edge::make_edge))
      // 抛物线创建方法
      .class_function(
          "makeEdgeFromPara",
          emscripten::select_overload<edge(const gp_Parab &)>(&edge::make_edge))
      .class_function(
          "makeEdgeFromParaParm",
          emscripten::select_overload<edge(const gp_Parab &, Standard_Real,
                                           Standard_Real)>(&edge::make_edge))
      .class_function(
          "makeEdgeFromParaPoint",
          emscripten::select_overload<edge(const gp_Parab &, const gp_Pnt &,
                                           const gp_Pnt &)>(&edge::make_edge))
      .class_function(
          "makeEdgeFromParaVertex",
          emscripten::select_overload<edge(const gp_Parab &, const vertex &,
                                           const vertex &)>(&edge::make_edge))
      // 通用曲线创建方法
      .class_function(
          "makeEdgeFromCurve",
          emscripten::select_overload<edge(const Handle(Geom_Curve) &)>(
              &edge::make_edge))
      .class_function(
          "makeEdgeFromCurveParm",
          emscripten::select_overload<edge(const Handle(Geom_Curve) &,
                                           Standard_Real, Standard_Real)>(
              &edge::make_edge))
      .class_function(
          "makeEdgeFromCurvePoint",
          emscripten::select_overload<edge(const Handle(Geom_Curve) &,
                                           const gp_Pnt &, const gp_Pnt &)>(
              &edge::make_edge))
      .class_function(
          "makeEdgeFromCurveVertex",
          emscripten::select_overload<edge(const Handle(Geom_Curve) &,
                                           const vertex &, const vertex &)>(
              &edge::make_edge))
      .class_function(
          "makeEdgeFromCurvePointParm",
          emscripten::select_overload<edge(
              const Handle(Geom_Curve) &, const gp_Pnt &, const gp_Pnt &,
              Standard_Real, Standard_Real)>(&edge::make_edge))
      .class_function(
          "makeEdgeFromCurveVertexParm",
          emscripten::select_overload<edge(
              const Handle(Geom_Curve) &, const vertex &, const vertex &,
              Standard_Real, Standard_Real)>(&edge::make_edge))
      // 2D曲线创建方法
      .class_function(
          "makeEdgeFromSurface",
          emscripten::select_overload<edge(const Handle(Geom2d_Curve) &,
                                           const Handle(Geom_Surface) &)>(
              &edge::make_edge))
      .class_function(
          "makeEdgeFromSurfaceParm",
          emscripten::select_overload<edge(
              const Handle(Geom2d_Curve) &, const Handle(Geom_Surface) &,
              Standard_Real, Standard_Real)>(&edge::make_edge))
      .class_function(
          "makeEdgeFromSurfacePoint",
          emscripten::select_overload<edge(
              const Handle(Geom2d_Curve) &, const Handle(Geom_Surface) &,
              const gp_Pnt &, const gp_Pnt &)>(&edge::make_edge))
      .class_function(
          "makeEdgeFromSurfaceVertex",
          emscripten::select_overload<edge(
              const Handle(Geom2d_Curve) &, const Handle(Geom_Surface) &,
              const vertex &, const vertex &)>(&edge::make_edge))
      .class_function(
          "makeEdgeFromSurfacePointParm",
          emscripten::select_overload<edge(
              const Handle(Geom2d_Curve) &, const Handle(Geom_Surface) &,
              const gp_Pnt &, const gp_Pnt &, Standard_Real, Standard_Real)>(
              &edge::make_edge))
      .class_function(
          "makeEdgeFromSurfaceVertexParm",
          emscripten::select_overload<edge(
              const Handle(Geom2d_Curve) &, const Handle(Geom_Surface) &,
              const vertex &, const vertex &, Standard_Real, Standard_Real)>(
              &edge::make_edge))
      // 值访问
      .function("value",
                emscripten::select_overload<const TopoDS_Edge &() const>(
                    &edge::value))
      // 基本属性
      .function("isSeam", &edge::is_seam)
      .function("isDegenerated", &edge::is_degenerated)
      .function("isClosed", &edge::is_closed)
      .function("isInfinite", &edge::is_inifinite)
      .function("length", &edge::length)
      .function("tolerance", &edge::tolerance)
      .function("isCurve3d", &edge::is_curve3d)
      .function("convertToCurve3d", &edge::convert_to_curve3d)
      .function("reverse", &edge::reverse)
      // 2D曲线创建方法
      .class_function(
          "makeEdge2dFromTwoVertex",
          emscripten::select_overload<edge(const vertex &, const vertex &)>(
              &edge::make_edge2d))
      .class_function(
          "makeEdge2dFromTwoPoint",
          emscripten::select_overload<edge(const gp_Pnt2d &, const gp_Pnt2d &)>(
              &edge::make_edge2d))
      .class_function("makeEdge2dFromLine",
                      emscripten::select_overload<edge(const gp_Lin2d &)>(
                          &edge::make_edge2d))
      .class_function(
          "makeEdge2dFromLineParm",
          emscripten::select_overload<edge(const gp_Lin2d &, Standard_Real,
                                           Standard_Real)>(&edge::make_edge2d))
      .class_function(
          "makeEdge2dFromLinePoint",
          emscripten::select_overload<edge(const gp_Lin2d &, const gp_Pnt2d &,
                                           const gp_Pnt2d &)>(
              &edge::make_edge2d))
      .class_function(
          "makeEdge2dFromLineVertex",
          emscripten::select_overload<edge(const gp_Lin2d &, const vertex &,
                                           const vertex &)>(&edge::make_edge2d))
      // 圆和椭圆2D
      .class_function("makeEdge2dFromCirc",
                      emscripten::select_overload<edge(const gp_Circ2d &)>(
                          &edge::make_edge2d))
      .class_function(
          "makeEdge2dFromCircParm",
          emscripten::select_overload<edge(const gp_Circ2d &, Standard_Real,
                                           Standard_Real)>(&edge::make_edge2d))
      .class_function(
          "makeEdge2dFromCircPoint",
          emscripten::select_overload<edge(const gp_Circ2d &, const gp_Pnt2d &,
                                           const gp_Pnt2d &)>(
              &edge::make_edge2d))
      .class_function(
          "makeEdge2dFromCircVertex",
          emscripten::select_overload<edge(const gp_Circ2d &, const vertex &,
                                           const vertex &)>(&edge::make_edge2d))
      .class_function("makeEdge2dFromElips",
                      emscripten::select_overload<edge(const gp_Elips2d &)>(
                          &edge::make_edge2d))
      .class_function(
          "makeEdge2dFromElipsParm",
          emscripten::select_overload<edge(const gp_Elips2d &, Standard_Real,
                                           Standard_Real)>(&edge::make_edge2d))
      .class_function(
          "makeEdge2dFromElipsPoint",
          emscripten::select_overload<edge(const gp_Elips2d &, const gp_Pnt2d &,
                                           const gp_Pnt2d &)>(
              &edge::make_edge2d))
      .class_function(
          "makeEdge2dFromElipsVertex",
          emscripten::select_overload<edge(const gp_Elips2d &, const vertex &,
                                           const vertex &)>(&edge::make_edge2d))
      // 双曲线和抛物线2D
      .class_function("makeEdge2dFromHyper",
                      emscripten::select_overload<edge(const gp_Hypr2d &)>(
                          &edge::make_edge2d))
      .class_function(
          "makeEdge2dFromHyperParm",
          emscripten::select_overload<edge(const gp_Hypr2d &, Standard_Real,
                                           Standard_Real)>(&edge::make_edge2d))
      .class_function(
          "makeEdge2dFromHyperPoint",
          emscripten::select_overload<edge(const gp_Hypr2d &, const gp_Pnt2d &,
                                           const gp_Pnt2d &)>(
              &edge::make_edge2d))
      .class_function(
          "makeEdge2dFromHyperVertex",
          emscripten::select_overload<edge(const gp_Hypr2d &, const vertex &,
                                           const vertex &)>(&edge::make_edge2d))
      .class_function("makeEdge2dFromPara",
                      emscripten::select_overload<edge(const gp_Parab2d &)>(
                          &edge::make_edge2d))
      .class_function(
          "makeEdge2dFromParaParm",
          emscripten::select_overload<edge(const gp_Parab2d &, Standard_Real,
                                           Standard_Real)>(&edge::make_edge2d))
      .class_function(
          "makeEdge2dFromParaPoint",
          emscripten::select_overload<edge(const gp_Parab2d &, const gp_Pnt2d &,
                                           const gp_Pnt2d &)>(
              &edge::make_edge2d))
      .class_function(
          "makeEdge2dFromParaVertex",
          emscripten::select_overload<edge(const gp_Parab2d &, const vertex &,
                                           const vertex &)>(&edge::make_edge2d))
      // 2D曲线创建方法
      .class_function(
          "makeEdge2dFromCurve",
          emscripten::select_overload<edge(const Handle(Geom2d_Curve) &)>(
              &edge::make_edge2d))
      .class_function(
          "makeEdge2dFromCurveParm",
          emscripten::select_overload<edge(const Handle(Geom2d_Curve) &,
                                           Standard_Real, Standard_Real)>(
              &edge::make_edge2d))
      .class_function(
          "makeEdge2dFromCurvePoint",
          emscripten::select_overload<edge(const Handle(Geom2d_Curve) &,
                                           const gp_Pnt2d &, const gp_Pnt2d &)>(
              &edge::make_edge2d))
      .class_function(
          "makeEdge2dFromCurveVertex",
          emscripten::select_overload<edge(const Handle(Geom2d_Curve) &,
                                           const vertex &, const vertex &)>(
              &edge::make_edge2d))
      .class_function(
          "makeEdge2dFromCurvePointParm",
          emscripten::select_overload<edge(
              const Handle(Geom2d_Curve) &, const gp_Pnt2d &, const gp_Pnt2d &,
              Standard_Real, Standard_Real)>(&edge::make_edge2d))
      .class_function(
          "makeEdge2dFromCurveVertexParm",
          emscripten::select_overload<edge(
              const Handle(Geom2d_Curve) &, const vertex &, const vertex &,
              Standard_Real, Standard_Real)>(&edge::make_edge2d))
      // 多边形创建方法
      .class_function("makePolygon",
                      emscripten::select_overload<edge()>(&edge::make_polygon))
      .class_function(
          "makePolygonFromTwoPoint",
          emscripten::select_overload<edge(const gp_Pnt &, const gp_Pnt &)>(
              &edge::make_polygon))
      .class_function(
          "makePolygonFromThreePoint",
          emscripten::select_overload<edge(const gp_Pnt &, const gp_Pnt &,
                                           const gp_Pnt &, bool)>(
              &edge::make_polygon))
      .class_function("makePolygonFromFourPoint",
                      emscripten::select_overload<edge(
                          const gp_Pnt &, const gp_Pnt &, const gp_Pnt &,
                          const gp_Pnt &, bool)>(&edge::make_polygon))
      .class_function(
          "makePolygonFromTwoVertex",
          emscripten::select_overload<edge(const vertex &, const vertex &)>(
              &edge::make_polygon))
      .class_function(
          "makePolygonFromThreeVertex",
          emscripten::select_overload<edge(const vertex &, const vertex &,
                                           const vertex &, bool)>(
              &edge::make_polygon))
      .class_function("makePolygonFromFourVertex",
                      emscripten::select_overload<edge(
                          const vertex &, const vertex &, const vertex &,
                          const vertex &, bool)>(&edge::make_polygon))
      .class_function(
          "makePolygonFromVertices",
          emscripten::optional_override(
              [](emscripten::val verticesVal, bool closed) {
                std::vector<vertex> vertices;
                if (!verticesVal.isUndefined() && !verticesVal.isNull()) {
                  const size_t length = verticesVal["length"].as<size_t>();
                  vertices.reserve(length);
                  for (size_t i = 0; i < length; ++i) {
                    vertices.push_back(verticesVal[i].as<vertex>());
                  }
                }
                return edge::make_polygon(vertices, closed);
              }))
      .class_function(
          "makePolygonFromPoints",
          emscripten::optional_override(
              [](emscripten::val pointsVal, bool closed) {
                std::vector<gp_Pnt> points;
                if (!pointsVal.isUndefined() && !pointsVal.isNull()) {
                  const size_t length = pointsVal["length"].as<size_t>();
                  points.reserve(length);
                  for (size_t i = 0; i < length; ++i) {
                    emscripten::val pointVal = pointsVal[i];
                    points.push_back(pointsVal[i].as<gp_Pnt>());
                  }
                }
                return edge::make_polygon(points, closed);
              }))
      .class_function("makeRect", &edge::make_rect)
      // 样条曲线创建方法
      .class_function(
          "makeSpline",
          emscripten::optional_override(
              [](emscripten::val pointsVal, double tolerance, bool periodic) {
                std::vector<gp_Pnt> points;
                if (!pointsVal.isUndefined() && !pointsVal.isNull()) {
                  const size_t length = pointsVal["length"].as<size_t>();
                  points.reserve(length);
                  for (size_t i = 0; i < length; ++i) {
                    points.push_back(pointsVal[i].as<gp_Pnt>());
                  }
                }
                return edge::make_spline(points, tolerance, periodic);
              }))
      .class_function(
          "makeSplineFromTangentsAndParametersAndPeriodic",
          emscripten::optional_override(
              [](emscripten::val pointsVal, emscripten::val tangentsVal,
                 emscripten::val parametersVal, double tolerance, bool periodic,
                 bool checkClosed) {
                // 处理点数组
                std::vector<gp_Pnt> points;
                if (!pointsVal.isUndefined() && !pointsVal.isNull()) {
                  const size_t length = pointsVal["length"].as<size_t>();
                  points.reserve(length);
                  for (size_t i = 0; i < length; ++i) {
                    points.push_back(pointsVal[i].as<gp_Pnt>());
                  }
                }

                // 处理切线对(可选)
                std::pair<gp_Vec, gp_Vec> *tangents = nullptr;
                if (!tangentsVal.isUndefined() && !tangentsVal.isNull()) {
                  gp_Vec firstVec(tangentsVal[0].as<gp_Vec>());
                  gp_Vec secondVec(tangentsVal[1].as<gp_Vec>());
                  static std::pair<gp_Vec, gp_Vec> tangentsPair(firstVec,
                                                                secondVec);
                  tangents = &tangentsPair;
                }

                // 处理参数数组(可选)
                std::vector<double> *parameters = nullptr;
                if (!parametersVal.isUndefined() && !parametersVal.isNull()) {
                  static std::vector<double> params;
                  params.clear();
                  const size_t length = parametersVal["length"].as<size_t>();
                  params.reserve(length);
                  for (size_t i = 0; i < length; ++i) {
                    params.push_back(parametersVal[i].as<double>());
                  }
                  parameters = &params;
                }

                return edge::make_spline(points, tangents, parameters,
                                         tolerance, periodic, checkClosed);
              }))
      .class_function(
          "makeSplineFromTangentsAndParameters",
          emscripten::optional_override(
              [](emscripten::val pointsVal, emscripten::val tangentsVal,
                 bool periodic, emscripten::val parametersVal, bool scale,
                 double tol) {
                // 处理点数组
                std::vector<gp_Pnt> points;
                if (!pointsVal.isUndefined() && !pointsVal.isNull()) {
                  const size_t length = pointsVal["length"].as<size_t>();
                  points.reserve(length);
                  for (size_t i = 0; i < length; ++i) {
                    points.push_back(pointsVal[i].as<gp_Pnt>());
                  }
                }

                // 处理切线数组(可选)
                std::vector<gp_Vec> *tangents = nullptr;
                if (!tangentsVal.isUndefined() && !tangentsVal.isNull()) {
                  static std::vector<gp_Vec> tangentsVec;
                  tangentsVec.clear();
                  const size_t length = tangentsVal["length"].as<size_t>();
                  tangentsVec.reserve(length);
                  for (size_t i = 0; i < length; ++i) {
                    tangentsVec.push_back(tangentsVal[i].as<gp_Vec>());
                  }
                  tangents = &tangentsVec;
                }

                // 处理参数数组(可选)
                std::vector<double> *parameters = nullptr;
                if (!parametersVal.isUndefined() && !parametersVal.isNull()) {
                  static std::vector<double> params;
                  params.clear();
                  const size_t length = parametersVal["length"].as<size_t>();
                  params.reserve(length);
                  for (size_t i = 0; i < length; ++i) {
                    params.push_back(parametersVal[i].as<double>());
                  }
                  parameters = &params;
                }

                return edge::make_spline(points, tangents, periodic, parameters,
                                         scale, tol);
              }))
      .class_function(
          "makeSplineApprox",
          emscripten::optional_override(
              [](emscripten::val pointsVal, emscripten::val toleranceVal,
                 emscripten::val smoothingVal, emscripten::val minDegreeVal,
                 emscripten::val maxDegreeVal) {
                // 处理点数组
                std::vector<gp_Pnt> points;
                if (!pointsVal.isUndefined() && !pointsVal.isNull()) {
                  const size_t length = pointsVal["length"].as<size_t>();
                  points.reserve(length);
                  for (size_t i = 0; i < length; ++i) {
                    points.push_back(pointsVal[i].as<gp_Pnt>());
                  }
                }

                // 处理可选参数
                double tolerance = toleranceVal.isUndefined()
                                       ? 1e-3
                                       : toleranceVal.as<double>();

                boost::optional<std::tuple<double, double, double>> smoothing =
                    boost::none;
                if (!smoothingVal.isUndefined() && !smoothingVal.isNull() &&
                    smoothingVal.isArray()) {
                  smoothing = std::make_tuple(smoothingVal[0].as<double>(),
                                              smoothingVal[1].as<double>(),
                                              smoothingVal[2].as<double>());
                }

                int minDegree =
                    minDegreeVal.isUndefined() ? 1 : minDegreeVal.as<int>();
                int maxDegree =
                    maxDegreeVal.isUndefined() ? 6 : maxDegreeVal.as<int>();

                return edge::make_spline_approx(points, tolerance, smoothing,
                                                minDegree, maxDegree);
              }))
      // 圆形创建方法
      .class_function(
          "makeCircle",
          emscripten::optional_override(
              [](emscripten::val radiusVal, emscripten::val centerVal,
                 emscripten::val normalVal, emscripten::val angle1Val,
                 emscripten::val angle2Val, emscripten::val orientationVal) {
                // 处理必需参数radius
                double radius = radiusVal.as<double>();

                // 处理可选参数
                gp_Pnt center = centerVal.isUndefined()
                                    ? gp_Pnt(0, 0, 0)
                                    : centerVal.as<gp_Pnt>();

                gp_Dir normal = normalVal.isUndefined()
                                    ? gp_Dir(0, 0, 1)
                                    : normalVal.as<gp_Dir>();

                double angle1 =
                    angle1Val.isUndefined() ? 360.0 : angle1Val.as<double>();
                double angle2 =
                    angle2Val.isUndefined() ? 360.0 : angle2Val.as<double>();
                bool orientation = orientationVal.isUndefined()
                                       ? true
                                       : orientationVal.as<bool>();

                return edge::make_circle(radius, center, normal, angle1, angle2,
                                         orientation);
              }))
      // 椭圆创建方法
      .class_function(
          "makeEllipse",
          emscripten::optional_override(
              [](emscripten::val majorRadiusVal, emscripten::val minorRadiusVal,
                 emscripten::val centerVal, emscripten::val normalVal,
                 emscripten::val xnormalVal, emscripten::val angle1Val,
                 emscripten::val angle2Val, emscripten::val senseVal) {
                // 处理必需参数
                double majorRadius = majorRadiusVal.as<double>();
                double minorRadius = minorRadiusVal.as<double>();

                // 处理可选参数
                gp_Pnt center = centerVal.isUndefined()
                                    ? gp_Pnt(0, 0, 0)
                                    : centerVal.as<gp_Pnt>();

                gp_Dir normal = normalVal.isUndefined()
                                    ? gp_Dir(0, 0, 1)
                                    : normalVal.as<gp_Dir>();

                gp_Dir xnormal = xnormalVal.isUndefined()
                                     ? gp_Dir(1, 0, 0)
                                     : xnormalVal.as<gp_Dir>();

                double angle1 =
                    angle1Val.isUndefined() ? 360.0 : angle1Val.as<double>();
                double angle2 =
                    angle2Val.isUndefined() ? 360.0 : angle2Val.as<double>();
                int sense = senseVal.isUndefined() ? 1 : senseVal.as<int>();

                return edge::make_ellipse(majorRadius, minorRadius, center,
                                          normal, xnormal, angle1, angle2,
                                          sense);
              }))
      // 三点圆弧创建方法
      .class_function("makeThreePointArc", &edge::make_three_point_arc)
      // 切线圆弧创建方法
      .class_function("makeTangentArc", &edge::make_tangent_arc)
      // 贝塞尔曲线创建方法
      .class_function(
          "makeBezier",
          emscripten::optional_override([](emscripten::val pointsVal) {
            std::vector<gp_Pnt> points;
            if (!pointsVal.isUndefined() && !pointsVal.isNull()) {
              const size_t length = pointsVal["length"].as<size_t>();
              points.reserve(length);
              for (size_t i = 0; i < length; ++i) {
                points.push_back(pointsVal[i].as<gp_Pnt>());
              }
            }
            return edge::make_bezier(points);
          }))
      // 几何操作
      .function("close", emscripten::optional_override([](const edge &self) {
                  auto result = self.close();

                  if (result.type() == typeid(wire)) {
                    return emscripten::val(boost::get<wire>(result));
                  } else {
                    return emscripten::val(boost::get<edge>(result));
                  }

                  return emscripten::val::null();
                }))
      .function("arcCenter", &edge::arc_center)
      .function("trim", &edge::trim)
      // 类型方法
      .function("getGeom", &edge::get_geom)
      .function("type", &edge::type)
      .function("copy", emscripten::optional_override([](const edge &self,
                                                         emscripten::val deep) {
                  bool deepCopy = deep.isUndefined() ? true : deep.as<bool>();
                  return self.copy(deepCopy);
                }));

  // EdgeIterator binding
  emscripten::class_<edge_iterator>("EdgeIterator")
      .constructor<shape &>()
      .function("reset", &edge_iterator::reset)
      .function("next", &edge_iterator::next);

  emscripten::enum_<wire::curve_type>("WireCurveType")
      .value("LINE", wire::curve_type::line)
      .value("THREE_POINT_ARC", wire::curve_type::three_point_arc)
      .value("CIRCLE_CENTER_ARC", wire::curve_type::circle_center_arc)
      .value("SPLINE", wire::curve_type::spline);

  // 绑定wire类，继承自shape1d
  emscripten::class_<wire, emscripten::base<shape1d>>("Wire")
      .constructor<>()
      .constructor(emscripten::optional_override(
          [](emscripten::val shpVal, emscripten::val forConstructionVal) {
            TopoDS_Shape shp = shpVal.as<TopoDS_Shape>();
            bool forConstruction = forConstructionVal.isUndefined()
                                       ? false
                                       : forConstructionVal.as<bool>();
            return wire(shp, forConstruction);
          }))
      .class_function("makePolygon",
                      emscripten::select_overload<wire()>(&wire::make_polygon))
      .class_function(
          "makePolygonFromTwoPoint",
          emscripten::select_overload<wire(const gp_Pnt &, const gp_Pnt &)>(
              &wire::make_polygon))
      .class_function("makePolygonFromThreePoint",
                      emscripten::optional_override(
                          [](emscripten::val p1Val, emscripten::val p2Val,
                             emscripten::val p3Val, emscripten::val closeVal) {
                            bool close = closeVal.isUndefined()
                                             ? false
                                             : closeVal.as<bool>();
                            return wire::make_polygon(
                                p1Val.as<gp_Pnt>(), p2Val.as<gp_Pnt>(),
                                p3Val.as<gp_Pnt>(), close);
                          }))
      .class_function("makePolygonFromFourPoint",
                      emscripten::optional_override(
                          [](emscripten::val p1Val, emscripten::val p2Val,
                             emscripten::val p3Val, emscripten::val p4Val,
                             emscripten::val closeVal) {
                            bool close = closeVal.isUndefined()
                                             ? false
                                             : closeVal.as<bool>();
                            return wire::make_polygon(
                                p1Val.as<gp_Pnt>(), p2Val.as<gp_Pnt>(),
                                p3Val.as<gp_Pnt>(), p4Val.as<gp_Pnt>(), close);
                          }))
      .class_function(
          "makePolygonFromTwoVertex",
          emscripten::select_overload<wire(const vertex &, const vertex &)>(
              &wire::make_polygon))
      .class_function("makePolygonFromThreeVertex",
                      emscripten::optional_override(
                          [](const vertex &v1, const vertex &v2,
                             const vertex &v3, emscripten::val closeVal) {
                            bool close = closeVal.isUndefined()
                                             ? false
                                             : closeVal.as<bool>();
                            return wire::make_polygon(v1, v2, v3, close);
                          }))
      .class_function(
          "makePolygonFromFourVertex",
          emscripten::optional_override([](const vertex &v1, const vertex &v2,
                                           const vertex &v3, const vertex &v4,
                                           emscripten::val closeVal) {
            bool close = closeVal.isUndefined() ? false : closeVal.as<bool>();
            return wire::make_polygon(v1, v2, v3, v4, close);
          }))
      .class_function(
          "makePolygonFromPoints",
          emscripten::optional_override([](emscripten::val verticesVal,
                                           emscripten::val closeVal,
                                           emscripten::val forConstructionVal) {
            std::vector<gp_Pnt> vertices;
            if (!verticesVal.isUndefined() && !verticesVal.isNull()) {
              const size_t length = verticesVal["length"].as<size_t>();
              vertices.reserve(length);
              for (size_t i = 0; i < length; ++i) {
                vertices.push_back(verticesVal[i].as<gp_Pnt>());
              }
            }

            bool close = closeVal.isUndefined() ? false : closeVal.as<bool>();
            bool forConstruction = forConstructionVal.isUndefined()
                                       ? false
                                       : forConstructionVal.as<bool>();

            return wire::make_polygon(vertices, close, forConstruction);
          }))
      // 基础创建方法
      .class_function(
          "makeWireFromEdge",
          emscripten::select_overload<wire(const edge &)>(&wire::make_wire))
      .class_function(
          "makeWireFromTwoEdge",
          emscripten::select_overload<wire(const edge &, const edge &)>(
              &wire::make_wire))
      .class_function(
          "makeWireFromThreeEdge",
          emscripten::select_overload<wire(const edge &, const edge &,
                                           const edge &)>(&wire::make_wire))
      .class_function(
          "makeWireFromFourEdge",
          emscripten::select_overload<wire(const edge &, const edge &,
                                           const edge &, const edge &)>(
              &wire::make_wire))
      .class_function(
          "makeWireFromWire",
          emscripten::select_overload<wire(const wire &)>(&wire::make_wire))
      .class_function(
          "makeWireFromTwoWire",
          emscripten::select_overload<wire(const wire &, const edge &)>(
              &wire::make_wire))
      .class_function(
          "makeWireFromEdges",
          emscripten::optional_override([](emscripten::val edgesVal) {
            std::vector<edge> edges;
            if (!edgesVal.isUndefined() && !edgesVal.isNull()) {
              const size_t length = edgesVal["length"].as<size_t>();
              edges.reserve(length);
              for (size_t i = 0; i < length; ++i) {
                edges.push_back(edgesVal[i].as<edge>());
              }
            }
            return wire::make_wire(edges);
          }))
      .class_function(
          "makeWireFromWires",
          emscripten::optional_override([](emscripten::val wiresVal) {
            std::vector<wire> wires;
            if (!wiresVal.isUndefined() && !wiresVal.isNull()) {
              const size_t length = wiresVal["length"].as<size_t>();
              wires.reserve(length);
              for (size_t i = 0; i < length; ++i) {
                wires.push_back(wiresVal[i].as<wire>());
              }
            }
            return wire::make_wire(wires);
          }))
      // 几何形状创建方法
      .class_function("makeRect", &wire::make_rect)
      .class_function("makeCircle", &wire::make_circle)
      .class_function(
          "makeEllipse",
          emscripten::optional_override(
              [](double x_radius, double y_radius, emscripten::val centerVal,
                 emscripten::val normalVal, emscripten::val xDirVal,
                 emscripten::val angle1Val, emscripten::val angle2Val,
                 emscripten::val rotationAngleVal, emscripten::val closedVal) {
                // 处理必需参数
                gp_Pnt center = centerVal.isUndefined()
                                    ? gp_Pnt(0, 0, 0)
                                    : centerVal.as<gp_Pnt>();
                gp_Dir normal = normalVal.isUndefined()
                                    ? gp_Dir(0, 0, 1)
                                    : normalVal.as<gp_Dir>();
                gp_Dir xDir = xDirVal.isUndefined() ? gp_Dir(1, 0, 0)
                                                    : xDirVal.as<gp_Dir>();

                // 处理可选参数
                double angle1 =
                    angle1Val.isUndefined() ? 360.0 : angle1Val.as<double>();
                double angle2 =
                    angle2Val.isUndefined() ? 360.0 : angle2Val.as<double>();
                double rotationAngle = rotationAngleVal.isUndefined()
                                           ? 0.0
                                           : rotationAngleVal.as<double>();
                bool closed =
                    closedVal.isUndefined() ? true : closedVal.as<bool>();

                return wire::make_ellipse(x_radius, y_radius, center, normal,
                                          xDir, angle1, angle2, rotationAngle,
                                          closed);
              }))
      .class_function(
          "makeHelix",
          emscripten::optional_override(
              [](double pitch, double height, double radius,
                 emscripten::val centerVal, emscripten::val dirVal,
                 emscripten::val angleVal, emscripten::val lefthandVal) {
                // 处理必需参数
                gp_Pnt center = centerVal.isUndefined()
                                    ? gp_Pnt(0, 0, 0)
                                    : centerVal.as<gp_Pnt>();

                gp_Dir dir = dirVal.isUndefined() ? gp_Dir(0, 0, 1)
                                                  : dirVal.as<gp_Dir>();

                // 处理可选参数
                double angle =
                    angleVal.isUndefined() ? 360.0 : angleVal.as<double>();
                bool lefthand =
                    lefthandVal.isUndefined() ? false : lefthandVal.as<bool>();

                return wire::make_helix(pitch, height, radius, center, dir,
                                        angle, lefthand);
              }))
      .class_function(
          "combine", emscripten::optional_override([](emscripten::val wiresVal,
                                                      emscripten::val tolVal) {
            std::vector<shape> wires;
            if (!wiresVal.isUndefined() && !wiresVal.isNull()) {
              const size_t length = wiresVal["length"].as<size_t>();
              wires.reserve(length);
              for (size_t i = 0; i < length; ++i) {
                wires.push_back(wiresVal[i].as<shape>());
              }
            }
            double tol = tolVal.isUndefined() ? 1e-9 : tolVal.as<double>();
            return wire::combine(wires, tol);
          }))
      .class_function(
          "makeWire",
          emscripten::optional_override([](emscripten::val pointsVal,
                                           emscripten::val curveTypesVal) {
            // 处理点数组
            std::vector<std::vector<gp_Pnt>> points;
            if (!pointsVal.isUndefined() && !pointsVal.isNull()) {
              const size_t outerLength = pointsVal["length"].as<size_t>();
              points.reserve(outerLength);
              for (size_t i = 0; i < outerLength; ++i) {
                emscripten::val innerArray = pointsVal[i];
                std::vector<gp_Pnt> innerPoints;
                const size_t innerLength = innerArray["length"].as<size_t>();
                innerPoints.reserve(innerLength);
                for (size_t j = 0; j < innerLength; ++j) {
                  innerPoints.push_back(innerArray[j].as<gp_Pnt>());
                }
                points.push_back(innerPoints);
              }
            }

            // 处理曲线类型数组
            std::vector<wire::curve_type> curveTypes;
            if (!curveTypesVal.isUndefined() && !curveTypesVal.isNull()) {
              const size_t length = curveTypesVal["length"].as<size_t>();
              curveTypes.reserve(length);
              for (size_t i = 0; i < length; ++i) {
                curveTypes.push_back(curveTypesVal[i].as<wire::curve_type>());
              }
            }

            return wire::make_wire(points, curveTypes);
          }))
      // 几何操作方法
      .function("stitch", &wire::stitch)
      .function("numEdges", &wire::num_edges)
      .function("vertices", &wire::vertices)
      .function("length", &wire::length)
      .function("convertToCurves3d", &wire::convert_to_curves3d)
      .function("project", &wire::project)
      // 值访问方法
      .function("value",
                emscripten::select_overload<const TopoDS_Wire &() const>(
                    &wire::value))
      // 类型方法
      .function("type", &wire::type)
      .function("copy", emscripten::optional_override([](const wire &self,
                                                         emscripten::val deep) {
                  bool deepCopy = deep.isUndefined() ? true : deep.as<bool>();
                  return self.copy(deepCopy);
                }))
      .function("close", &wire::close)
      // 偏移和倒角操作
      .function("offset",
                emscripten::optional_override([](wire &self, double distance,
                                                 emscripten::val kindVal) {
                  GeomAbs_JoinType kind =
                      kindVal.isUndefined()
                          ? GeomAbs_Arc
                          : static_cast<GeomAbs_JoinType>(kindVal.as<int>());
                  return self.offset(distance, kind);
                }))
      .function("fillet",
                emscripten::optional_override([](wire &self,
                                                 emscripten::val verticesVal,
                                                 emscripten::val radiusVal) {
                  std::vector<vertex> vertices;
                  if (!verticesVal.isUndefined() && !verticesVal.isNull()) {
                    const size_t vLength = verticesVal["length"].as<size_t>();
                    vertices.reserve(vLength);
                    for (size_t i = 0; i < vLength; ++i) {
                      vertices.push_back(verticesVal[i].as<vertex>());
                    }
                  }

                  std::vector<double> radius;
                  if (!radiusVal.isUndefined() && !radiusVal.isNull()) {
                    const size_t rLength = radiusVal["length"].as<size_t>();
                    radius.reserve(rLength);
                    for (size_t i = 0; i < rLength; ++i) {
                      radius.push_back(radiusVal[i].as<double>());
                    }
                  }

                  return self.fillet(vertices, radius);
                }))
      .function("chamfer",
                emscripten::optional_override([](wire &self,
                                                 emscripten::val verticesVal,
                                                 emscripten::val distancesVal) {
                  std::vector<vertex> vertices;
                  if (!verticesVal.isUndefined() && !verticesVal.isNull()) {
                    const size_t vLength = verticesVal["length"].as<size_t>();
                    vertices.reserve(vLength);
                    for (size_t i = 0; i < vLength; ++i) {
                      vertices.push_back(verticesVal[i].as<vertex>());
                    }
                  }

                  std::vector<double> distances;
                  if (!distancesVal.isUndefined() && !distancesVal.isNull()) {
                    const size_t dLength = distancesVal["length"].as<size_t>();
                    distances.reserve(dLength);
                    for (size_t i = 0; i < dLength; ++i) {
                      distances.push_back(distancesVal[i].as<double>());
                    }
                  }

                  return self.chamfer(vertices, distances);
                }))
      .function(
          "offset2d",
          emscripten::optional_override(
              [](const wire &self, double distances, emscripten::val kindVal) {
                GeomAbs_JoinType kind =
                    kindVal.isUndefined()
                        ? GeomAbs_Arc
                        : static_cast<GeomAbs_JoinType>(kindVal.as<int>());

                std::vector<wire> result = self.offset2d(distances, kind);

                emscripten::val jsResult = emscripten::val::array();
                for (const auto &w : result) {
                  jsResult.call<void>("push", w);
                }
                return jsResult;
              }))
      .function(
          "fillet2d",
          emscripten::optional_override(
              [](const wire &self, double radius, emscripten::val verticesVal) {
                std::vector<vertex> vertices;
                if (!verticesVal.isUndefined() && !verticesVal.isNull()) {
                  const size_t length = verticesVal["length"].as<size_t>();
                  vertices.reserve(length);
                  for (size_t i = 0; i < length; ++i) {
                    vertices.push_back(verticesVal[i].as<vertex>());
                  }
                }
                return self.fillet2d(radius, vertices);
              }))
      .function(
          "chamfer2d",
          emscripten::optional_override([](const wire &self, double distances,
                                           emscripten::val verticesVal) {
            std::vector<vertex> vertices;
            if (!verticesVal.isUndefined() && !verticesVal.isNull()) {
              const size_t length = verticesVal["length"].as<size_t>();
              vertices.reserve(length);
              for (size_t i = 0; i < length; ++i) {
                vertices.push_back(verticesVal[i].as<vertex>());
              }
            }
            return self.chamfer2d(distances, vertices);
          }))
      // 几何操作方法
      .function("getGeom", &wire::get_geom);

  // 绑定wire_iterator类
  emscripten::class_<wire_iterator>("WireIterator")
      .constructor<shape &>()
      .function("reset", &wire_iterator::reset)
      .function("next", &wire_iterator::next);

  // 添加bool_op_type枚举绑定
  emscripten::enum_<bool_op_type>("BooleanOperationType")
      .value("FUSE", bool_op_type::BOOL_FUSE)
      .value("CUT", bool_op_type::BOOL_CUT)
      .value("COMMON", bool_op_type::BOOL_COMMON);

  // 绑定face类，继承自shape
  emscripten::class_<face, emscripten::base<shape>>("Face")
      .constructor<>()
      .constructor(emscripten::optional_override(
          [](emscripten::val shpVal, emscripten::val forConstructionVal) {
            TopoDS_Shape shp = shpVal.as<TopoDS_Shape>();
            bool forConstruction = forConstructionVal.isUndefined()
                                       ? false
                                       : forConstructionVal.as<bool>();
            return face(shp, forConstruction);
          }))
      // 基础创建方法
      .class_function(
          "makeFace",
          emscripten::select_overload<face(const face &)>(&face::make_face))
      .class_function(
          "makeFaceFromPlane",
          emscripten::select_overload<face(const gp_Pln &)>(&face::make_face))
      .class_function("makeFaceFromCylinder",
                      emscripten::select_overload<face(const gp_Cylinder &)>(
                          &face::make_face))
      .class_function(
          "makeFaceFromCone",
          emscripten::select_overload<face(const gp_Cone &)>(&face::make_face))
      .class_function("makeFaceFromSphere",
                      emscripten::select_overload<face(const gp_Sphere &)>(
                          &face::make_face))
      .class_function(
          "makeFaceFromTorus",
          emscripten::select_overload<face(const gp_Torus &)>(&face::make_face))
      .class_function(
          "makeFaceFromSurface",
          emscripten::select_overload<face(const Handle(Geom_Surface) &,
                                           Standard_Real)>(&face::make_face))
      // 带参数范围的创建方法
      .class_function("makeFaceFromPlaneParm",
                      emscripten::select_overload<face(
                          const gp_Pln &, Standard_Real, Standard_Real,
                          Standard_Real, Standard_Real)>(&face::make_face))
      .class_function("makeFaceFromCylinderParm",
                      emscripten::select_overload<face(
                          const gp_Cylinder &, Standard_Real, Standard_Real,
                          Standard_Real, Standard_Real)>(&face::make_face))
      .class_function("makeFaceFromConeParm",
                      emscripten::select_overload<face(
                          const gp_Cone &, Standard_Real, Standard_Real,
                          Standard_Real, Standard_Real)>(&face::make_face))
      .class_function("makeFaceFromSphereParm",
                      emscripten::select_overload<face(
                          const gp_Sphere &, Standard_Real, Standard_Real,
                          Standard_Real, Standard_Real)>(&face::make_face))
      .class_function("makeFaceFromTorusParm",
                      emscripten::select_overload<face(
                          const gp_Torus &, Standard_Real, Standard_Real,
                          Standard_Real, Standard_Real)>(&face::make_face))
      .class_function(
          "makeFaceFromSurfaceParm",
          emscripten::select_overload<face(
              const Handle(Geom_Surface) &, Standard_Real, Standard_Real,
              Standard_Real, Standard_Real, Standard_Real)>(&face::make_face))
      // 基于wire的创建方法
      .class_function("makeFaceFromWire",
                      emscripten::select_overload<face(const wire &, bool)>(
                          &face::make_face))
      .class_function(
          "makeFaceFromPlaneWire",
          emscripten::select_overload<face(const gp_Pln &, const wire &, bool)>(
              &face::make_face))
      .class_function(
          "makeFaceFromCylinderWire",
          emscripten::select_overload<face(const gp_Cylinder &, const wire &,
                                           bool)>(&face::make_face))
      .class_function(
          "makeFaceFromConeWire",
          emscripten::select_overload<face(const gp_Cone &, const wire &,
                                           bool)>(&face::make_face))
      .class_function(
          "makeFaceFromSphereWire",
          emscripten::select_overload<face(const gp_Sphere &, const wire &,
                                           bool)>(&face::make_face))
      .class_function(
          "makeFaceFromTorusWire",
          emscripten::select_overload<face(const gp_Torus &, const wire &,
                                           bool)>(&face::make_face))
      .class_function("makeFaceFromSurfaceWire",
                      emscripten::select_overload<face(
                          const Handle(Geom_Surface) &, const wire &, bool)>(
                          &face::make_face))
      .class_function(
          "makeFaceFromFaceWire",
          emscripten::select_overload<face(const face &, const wire &)>(
              &face::make_face))
      .class_function(
          "makeFaceFromFaceWireWithOuterInners",
          emscripten::optional_override(
              [](const face &f, const wire &outer, emscripten::val innersVal) {
                std::vector<wire> inners;
                if (!innersVal.isUndefined() && !innersVal.isNull()) {
                  const size_t length = innersVal["length"].as<size_t>();
                  inners.reserve(length);
                  for (size_t i = 0; i < length; ++i) {
                    inners.push_back(innersVal[i].as<wire>());
                  }
                }
                return face::make_face(f, outer, inners);
              }))
      // 基于边和点的创建方法
      .class_function(
          "makeFaceFromEdges",
          emscripten::select_overload<face(const edge &, const edge &)>(
              &face::make_face))
      .class_function(
          "makeFaceFaceFromTwoWire",
          emscripten::select_overload<face(const wire &, const wire &)>(
              &face::make_face))
      .class_function(
          "makeFaceFaceFromWires",
          emscripten::optional_override([](emscripten::val wiresVal) {
            std::vector<wire> wires;
            if (!wiresVal.isUndefined() && !wiresVal.isNull()) {
              const size_t length = wiresVal["length"].as<size_t>();
              wires.reserve(length);
              for (size_t i = 0; i < length; ++i) {
                wires.push_back(wiresVal[i].as<wire>());
              }
            }
            return face::make_face(wires);
          }))
      .class_function(
          "makeFaceFromEdgesAndPoints",
          emscripten::optional_override(
              [](emscripten::val edgesVal, emscripten::val pointsVal) {
                std::vector<edge> edges;
                if (!edgesVal.isUndefined() && !edgesVal.isNull()) {
                  const size_t eLength = edgesVal["length"].as<size_t>();
                  edges.reserve(eLength);
                  for (size_t i = 0; i < eLength; ++i) {
                    edges.push_back(edgesVal[i].as<edge>());
                  }
                }

                std::vector<gp_Pnt> points;
                if (!pointsVal.isUndefined() && !pointsVal.isNull()) {
                  const size_t pLength = pointsVal["length"].as<size_t>();
                  points.reserve(pLength);
                  for (size_t i = 0; i < pLength; ++i) {
                    points.push_back(pointsVal[i].as<gp_Pnt>());
                  }
                }

                return face::make_face(edges, points);
              }))
      .class_function(
          "makeFaceFromPoints",
          emscripten::optional_override([](emscripten::val pointsVal) {
            std::vector<gp_Pnt> points;
            if (!pointsVal.isUndefined() && !pointsVal.isNull()) {
              const size_t length = pointsVal["length"].as<size_t>();
              points.reserve(length);
              for (size_t i = 0; i < length; ++i) {
                points.push_back(pointsVal[i].as<gp_Pnt>());
              }
            }
            return face::make_face(points);
          }))
      .class_function(
          "makeFaceFromOuterAndInners",
          emscripten::optional_override(
              [](const wire &outerWire, emscripten::val innerWiresVal) {
                std::vector<wire> innerWires;
                if (!innerWiresVal.isUndefined() && !innerWiresVal.isNull()) {
                  const size_t length = innerWiresVal["length"].as<size_t>();
                  innerWires.reserve(length);
                  for (size_t i = 0; i < length; ++i) {
                    innerWires.push_back(innerWiresVal[i].as<wire>());
                  }
                }
                return face::make_face(outerWire, innerWires);
              }))
      .class_function(
          "makeFromWires",
          emscripten::optional_override(
              [](const wire &outer, emscripten::val innersVal) {
                std::vector<wire> inners;
                if (!innersVal.isUndefined() && !innersVal.isNull()) {
                  const size_t length = innersVal["length"].as<size_t>();
                  inners.reserve(length);
                  for (size_t i = 0; i < length; ++i) {
                    inners.push_back(innersVal[i].as<wire>());
                  }
                }

                std::vector<face> result = face::make_from_wires(outer, inners);

                emscripten::val jsResult = emscripten::val::array();
                for (const auto &f : result) {
                  jsResult.call<void>("push", f);
                }
                return jsResult;
              }))
      // 特殊创建方法
      .class_function(
          "makeComplexFace",
          emscripten::optional_override(
              [](emscripten::val edgesVal, emscripten::val constraintsVal,
                 emscripten::val continuityVal, emscripten::val degreeVal,
                 emscripten::val nbPtsOnCurVal, emscripten::val nbIterVal,
                 emscripten::val anisotropyVal, emscripten::val tol2dVal,
                 emscripten::val tol3dVal, emscripten::val tolAngVal,
                 emscripten::val tolCurvVal, emscripten::val maxDegVal,
                 emscripten::val maxSegmentsVal) {
                // 处理edges数组
                std::vector<boost::variant<wire, edge>> edges;
                if (!edgesVal.isUndefined() && !edgesVal.isNull()) {
                  const size_t eLength = edgesVal["length"].as<size_t>();
                  edges.reserve(eLength);
                  for (size_t i = 0; i < eLength; ++i) {
                    emscripten::val item = edgesVal[i];
                    if (item.instanceof(emscripten::val::global("Edge"))) {
                      edges.push_back(item.as<edge>());
                    } else if (item.instanceof(
                                   emscripten::val::global("Wire"))) {
                      edges.push_back(item.as<wire>());
                    }
                  }
                }

                // 处理constraints数组
                std::vector<boost::variant<wire, edge, gp_Pnt>> constraints;
                if (!constraintsVal.isUndefined() && !constraintsVal.isNull()) {
                  const size_t cLength = constraintsVal["length"].as<size_t>();
                  constraints.reserve(cLength);
                  for (size_t i = 0; i < cLength; ++i) {
                    emscripten::val item = constraintsVal[i];
                    if (item.instanceof(emscripten::val::global("Edge"))) {
                      constraints.push_back(item.as<edge>());
                    } else if (item.instanceof(
                                   emscripten::val::global("Wire"))) {
                      constraints.push_back(item.as<wire>());
                    } else if (item.instanceof(
                                   emscripten::val::global("gp_Pnt"))) {
                      constraints.push_back(item.as<gp_Pnt>());
                    }
                  }
                }

                // 处理可选参数
                GeomAbs_Shape continuity =
                    continuityVal.isUndefined()
                        ? GeomAbs_C0
                        : static_cast<GeomAbs_Shape>(continuityVal.as<int>());
                int degree = degreeVal.isUndefined() ? 3 : degreeVal.as<int>();
                int nbPtsOnCur =
                    nbPtsOnCurVal.isUndefined() ? 15 : nbPtsOnCurVal.as<int>();
                int nbIter = nbIterVal.isUndefined() ? 2 : nbIterVal.as<int>();
                bool anisotropy = anisotropyVal.isUndefined()
                                      ? false
                                      : anisotropyVal.as<bool>();
                double tol2d =
                    tol2dVal.isUndefined() ? 0.00001 : tol2dVal.as<double>();
                double tol3d =
                    tol3dVal.isUndefined() ? 0.0001 : tol3dVal.as<double>();
                double tolAng =
                    tolAngVal.isUndefined() ? 0.01 : tolAngVal.as<double>();
                double tolCurv =
                    tolCurvVal.isUndefined() ? 0.1 : tolCurvVal.as<double>();
                int maxDeg = maxDegVal.isUndefined() ? 8 : maxDegVal.as<int>();
                int maxSegments =
                    maxSegmentsVal.isUndefined() ? 9 : maxSegmentsVal.as<int>();

                return face::make_face(edges, constraints, continuity, degree,
                                       nbPtsOnCur, nbIter, anisotropy, tol2d,
                                       tol3d, tolAng, tolCurv, maxDeg,
                                       maxSegments);
              }))
      .class_function(
          "makePlane",
          emscripten::optional_override(
              [](emscripten::val basePntVal, emscripten::val dirVal,
                 emscripten::val lengthVal, emscripten::val widthVal) {
                // 处理基准点参数
                gp_Pnt basePnt = basePntVal.isUndefined()
                                     ? gp_Pnt(0, 0, 0)
                                     : basePntVal.as<gp_Pnt>();

                // 处理方向参数
                gp_Dir dir = dirVal.isUndefined() ? gp_Dir(0, 0, 1)
                                                  : dirVal.as<gp_Dir>();

                // 处理可选的长度和宽度参数
                boost::optional<double> length =
                    lengthVal.isUndefined()
                        ? boost::none
                        : boost::optional<double>(lengthVal.as<double>());

                boost::optional<double> width =
                    widthVal.isUndefined()
                        ? boost::none
                        : boost::optional<double>(widthVal.as<double>());

                return face::make_plane(basePnt, dir, length, width);
              }))
      .class_function(
          "makeSplineApprox",
          emscripten::optional_override([](emscripten::val pointsVal,
                                           emscripten::val tolVal,
                                           emscripten::val smoothingVal,
                                           emscripten::val minDegVal,
                                           emscripten::val maxDegVal) {
            // 处理点集数组
            std::vector<std::vector<gp_Pnt>> points;
            if (!pointsVal.isUndefined() && !pointsVal.isNull()) {
              const size_t outerLength = pointsVal["length"].as<size_t>();
              points.reserve(outerLength);
              for (size_t i = 0; i < outerLength; ++i) {
                emscripten::val innerArray = pointsVal[i];
                std::vector<gp_Pnt> innerPoints;
                const size_t innerLength = innerArray["length"].as<size_t>();
                innerPoints.reserve(innerLength);
                for (size_t j = 0; j < innerLength; ++j) {
                  emscripten::val pointVal = innerArray[j];
                  innerPoints.push_back(pointVal.as<gp_Pnt>());
                }
                points.push_back(innerPoints);
              }
            }

            // 处理其他可选参数
            double tol = tolVal.isUndefined() ? 1e-2 : tolVal.as<double>();

            std::tuple<double, double, double> *smoothing = nullptr;
            if (!smoothingVal.isUndefined() && !smoothingVal.isNull() &&
                smoothingVal.isArray()) {
              static std::tuple<double, double, double> staticSmoothing(
                  0.0, 0.0, 0.0);
              staticSmoothing = std::tuple<double, double, double>(
                  smoothingVal[0].as<double>(), smoothingVal[1].as<double>(),
                  smoothingVal[2].as<double>());
              smoothing = &staticSmoothing;
            }

            int minDeg = minDegVal.isUndefined() ? 1 : minDegVal.as<int>();
            int maxDeg = maxDegVal.isUndefined() ? 3 : maxDegVal.as<int>();

            auto result = face::make_spline_approx(points, tol, smoothing,
                                                   minDeg, maxDeg);

            return result;
          }))
      // 几何属性方法
      .function("area", &face::area)
      .function("tolerance", &face::tolerance)
      .function("inertia", &face::inertia)
      .function("centreOfMass", &face::centre_of_mass)
      .function("center", &face::center)
      .function("toPlane", &face::to_plane)
      // 参数化方法
      .function("uvBounds", emscripten::optional_override([](const face &self) {
                  auto bounds = self.uv_bounds();
                  emscripten::val jsResult = emscripten::val::array();
                  jsResult.call<void>("push", std::get<0>(bounds));
                  jsResult.call<void>("push", std::get<1>(bounds));
                  jsResult.call<void>("push", std::get<2>(bounds));
                  jsResult.call<void>("push", std::get<3>(bounds));
                  return jsResult;
                }))
      .function("paramAt", emscripten::optional_override([](const face &self,
                                                            const gp_Pnt &pt) {
                  auto params = self.param_at(pt);
                  emscripten::val jsResult = emscripten::val::array();
                  jsResult.call<void>("push", params.first);
                  jsResult.call<void>("push", params.second);
                  return jsResult;
                }))
      .function(
          "params", emscripten::optional_override([](const face &self,
                                                     emscripten::val ptsVal,
                                                     emscripten::val tolVal) {
            // 处理点集参数
            std::vector<gp_Pnt> pts;
            if (!ptsVal.isUndefined() && !ptsVal.isNull()) {
              const size_t length = ptsVal["length"].as<size_t>();
              pts.reserve(length);
              for (size_t i = 0; i < length; ++i) {
                pts.push_back(ptsVal[i].as<gp_Pnt>());
              }
            }

            // 处理容差参数
            double tol = tolVal.isUndefined() ? 1e-9 : tolVal.as<double>();

            // 调用原始方法
            auto result = self.params(pts, tol);

            emscripten::val jsResult = emscripten::val::array();
            jsResult.call<void>("push", emscripten::val::array(result.first));
            jsResult.call<void>("push", emscripten::val::array(result.second));
            return jsResult;
          }))
      .function("positionAt", &face::position_at)
      .function("positions",
                emscripten::optional_override(
                    [](const face &self, emscripten::val uvsVal) {
                      // 处理UV参数数组
                      std::vector<std::pair<double, double>> uvs;
                      if (!uvsVal.isUndefined() && !uvsVal.isNull()) {
                        const size_t length = uvsVal["length"].as<size_t>();
                        uvs.reserve(length);
                        for (size_t i = 0; i < length; ++i) {
                          emscripten::val uvVal = uvsVal[i];
                          uvs.emplace_back(uvVal[0].as<double>(),
                                           uvVal[1].as<double>());
                        }
                      }

                      // 调用原始方法
                      auto points = self.positions(uvs);

                      // 转换为JavaScript数组
                      emscripten::val jsResult = emscripten::val::array();
                      for (const auto &pnt : points) {
                        jsResult.call<void>("push", pnt);
                      }
                      return jsResult;
                    }))
      // 法线计算和偏移操作
      .function("normalAt",
                emscripten::optional_override(
                    [](const face &self, emscripten::val locationVal) {
                      gp_Pnt *locationVector = nullptr;
                      if (!locationVal.isUndefined() && !locationVal.isNull()) {
                        static gp_Pnt pnt;
                        pnt = locationVal.as<gp_Pnt>();
                        locationVector = &pnt;
                      }

                      return self.normal_at(locationVector);
                    }))
      .function("normalAtUV", emscripten::optional_override(
                                  [](const face &self, double u, double v) {
                                    auto result = self.normal_at(u, v);

                                    emscripten::val jsResult =
                                        emscripten::val::array();

                                    jsResult.call<void>("push", result.first);
                                    jsResult.call<void>("push", result.second);

                                    return jsResult;
                                  }))
      .function("normals",
                emscripten::optional_override([](const face &self,
                                                 emscripten::val usVal,
                                                 emscripten::val vsVal) {
                  // 处理u参数数组
                  std::vector<double> us;
                  if (!usVal.isUndefined() && !usVal.isNull()) {
                    const size_t uLength = usVal["length"].as<size_t>();
                    us.reserve(uLength);
                    for (size_t i = 0; i < uLength; ++i) {
                      us.push_back(usVal[i].as<double>());
                    }
                  }

                  // 处理v参数数组
                  std::vector<double> vs;
                  if (!vsVal.isUndefined() && !vsVal.isNull()) {
                    const size_t vLength = vsVal["length"].as<size_t>();
                    vs.reserve(vLength);
                    for (size_t i = 0; i < vLength; ++i) {
                      vs.push_back(vsVal[i].as<double>());
                    }
                  }

                  // 调用原始方法
                  auto result = self.normals(us, vs);

                  // 转换为JavaScript对象
                  emscripten::val jsResult = emscripten::val::object();

                  // 处理法向量数组
                  emscripten::val normalsArray = emscripten::val::array();
                  for (const auto &vec : result.first) {
                    normalsArray.call<void>("push", vec);
                  }
                  jsResult.set("normals", normalsArray);

                  // 处理点位置数组
                  emscripten::val pointsArray = emscripten::val::array();
                  for (const auto &pnt : result.second) {
                    pointsArray.call<void>("push", pnt);
                  }
                  jsResult.set("points", pointsArray);

                  return jsResult;
                }))
      .function("offset",
                emscripten::optional_override([](face &self, double offset,
                                                 emscripten::val toleranceVal) {
                  double tolerance = toleranceVal.isUndefined()
                                         ? 1e-6
                                         : toleranceVal.as<double>();
                  return self.offset(offset, tolerance);
                }))
      // 几何变换方法
      .function("extrude", &face::extrude)
      .function("revolve", &face::revolve)
      .function(
          "sweep",
          emscripten::optional_override([](face &self, const wire &spine,
                                           emscripten::val profilesVal,
                                           emscripten::val cornerModeVal) {
            // 处理profiles数组参数
            std::vector<shape> profiles;
            if (!profilesVal.isUndefined() && !profilesVal.isNull()) {
              const size_t length = profilesVal["length"].as<size_t>();
              profiles.reserve(length);
              for (size_t i = 0; i < length; ++i) {
                profiles.push_back(profilesVal[i].as<shape>());
              }
            }

            // 处理cornerMode默认值
            int cornerMode =
                cornerModeVal.isUndefined() ? 0 : cornerModeVal.as<int>();

            return self.sweep(spine, profiles, cornerMode);
          }))
      .function("loft",
                emscripten::optional_override(
                    [](face &self, emscripten::val profilesVal,
                       emscripten::val ruledVal, emscripten::val toleranceVal) {
                      // 处理profiles数组参数
                      std::vector<shape> profiles;
                      if (!profilesVal.isUndefined() && !profilesVal.isNull()) {
                        const size_t length =
                            profilesVal["length"].as<size_t>();
                        profiles.reserve(length);
                        for (size_t i = 0; i < length; ++i) {
                          profiles.push_back(profilesVal[i].as<shape>());
                        }
                      }

                      // 处理ruled默认值
                      bool ruled =
                          ruledVal.isUndefined() ? false : ruledVal.as<bool>();

                      // 处理tolerance默认值
                      double tolerance = toleranceVal.isUndefined()
                                             ? 1e-6
                                             : toleranceVal.as<double>();

                      return self.loft(profiles, ruled, tolerance);
                    }))
      // 布尔运算和2D操作
      .function("boolean", &face::boolean)
      .function(
          "fillet2d",
          emscripten::optional_override(
              [](const face &self, double radius, emscripten::val verticesVal) {
                std::vector<vertex> vertices;
                if (!verticesVal.isUndefined() && !verticesVal.isNull()) {
                  const size_t length = verticesVal["length"].as<size_t>();
                  vertices.reserve(length);
                  for (size_t i = 0; i < length; ++i) {
                    vertices.push_back(verticesVal[i].as<vertex>());
                  }
                }
                return self.fillet2d(radius, vertices);
              }))
      .function(
          "chamfer2d",
          emscripten::optional_override([](const face &self, double distances,
                                           emscripten::val verticesVal) {
            std::vector<vertex> vertices;
            if (!verticesVal.isUndefined() && !verticesVal.isNull()) {
              const size_t length = verticesVal["length"].as<size_t>();
              vertices.reserve(length);
              for (size_t i = 0; i < length; ++i) {
                vertices.push_back(verticesVal[i].as<vertex>());
              }
            }
            return self.chamfer2d(distances, vertices);
          }))
      .function("thicken", &face::thicken)
      .function("project", &face::project)
      // 其他操作方法
      .function("toArcs",
                emscripten::optional_override(
                    [](const face &self, emscripten::val toleranceVal) {
                      double tolerance = toleranceVal.isUndefined()
                                             ? 1e-3
                                             : toleranceVal.as<double>();
                      return self.to_arcs(tolerance);
                    }))
      .function("trim", emscripten::optional_override(
                            [](const face &self, double u0, double u1,
                               double v0, double v1, emscripten::val tolVal) {
                              double tol = tolVal.isUndefined()
                                               ? 1e-6
                                               : tolVal.as<double>();
                              return self.trim(u0, u1, v0, v1, tol);
                            }))
      .function("isoline",
                emscripten::optional_override([](const face &self, double param,
                                                 emscripten::val directionVal) {
                  std::string direction = directionVal.isUndefined()
                                              ? "v"
                                              : directionVal.as<std::string>();
                  return self.isoline(param, direction);
                }))
      .function("isolines",
                emscripten::optional_override([](const face &self,
                                                 emscripten::val paramsVal,
                                                 emscripten::val directionVal) {
                  // 处理参数数组
                  std::vector<double> params;
                  if (!paramsVal.isUndefined() && !paramsVal.isNull()) {
                    const size_t length = paramsVal["length"].as<size_t>();
                    params.reserve(length);
                    for (size_t i = 0; i < length; ++i) {
                      params.push_back(paramsVal[i].as<double>());
                    }
                  }

                  // 处理方向默认值
                  std::string direction = directionVal.isUndefined()
                                              ? "v"
                                              : directionVal.as<std::string>();

                  // 调用原始方法
                  auto edges = self.isolines(params, direction);

                  // 转换为JavaScript数组
                  emscripten::val jsResult = emscripten::val::array();
                  for (const auto &edge : edges) {
                    jsResult.call<void>("push", edge);
                  }
                  return jsResult;
                }))
      // 边界访问
      .function("outerWire", &face::outer_wire)
      .function("innerWires",
                emscripten::optional_override([](const face &self) {
                  auto wires = self.inner_wires();
                  emscripten::val jsResult = emscripten::val::array();
                  for (const auto &wire : wires) {
                    jsResult.call<void>("push", wire);
                  }
                  return jsResult;
                }))
      // 值访问和类型方法
      .function("value",
                emscripten::select_overload<const TopoDS_Face &() const>(
                    &face::value))
      .function("getGeom", &face::get_geom)
      .function("type", &face::type)
      .function("copy", emscripten::optional_override([](const face &self,
                                                         emscripten::val deep) {
                  bool deepCopy = deep.isUndefined() ? true : deep.as<bool>();
                  return self.copy(deepCopy);
                }));

  // Bind Shell class
  emscripten::class_<shell, emscripten::base<shape>>("Shell")
      .constructor<>()
      .constructor(emscripten::optional_override(
          [](emscripten::val shpVal, emscripten::val forConstructionVal) {
            TopoDS_Shape shp = shpVal.as<TopoDS_Shape>();
            bool forConstruction = forConstructionVal.isUndefined()
                                       ? false
                                       : forConstructionVal.as<bool>();
            return shell(shp, forConstruction);
          }))
      // Surface creation methods
      .class_function(
          "makeShellFromSurface",
          emscripten::optional_override(
              [](emscripten::val surfaceVal, emscripten::val segmentVal) {
                Handle(Geom_Surface) S = surfaceVal.as<Handle(Geom_Surface)>();
                bool segment =
                    segmentVal.isUndefined() ? false : segmentVal.as<bool>();
                return shell::make_shell(S, segment);
              }))
      .class_function(
          "makeShellFromSurfaceFromSurfaceParm",
          emscripten::optional_override(
              [](emscripten::val surfaceVal, double UMin, double UMax,
                 double VMin, double VMax, emscripten::val segmentVal) {
                Handle(Geom_Surface) S = surfaceVal.as<Handle(Geom_Surface)>();
                bool segment =
                    segmentVal.isUndefined() ? false : segmentVal.as<bool>();
                return shell::make_shell(S, UMin, UMax, VMin, VMax, segment);
              }))
      // Box creation methods
      .class_function("makeShellFromBox",
                      emscripten::select_overload<shell(
                          Standard_Real, Standard_Real, Standard_Real)>(
                          &shell::make_shell_from_box))
      .class_function(
          "makeShellFromBoxPoint",
          emscripten::select_overload<shell(const gp_Pnt &, Standard_Real,
                                            Standard_Real, Standard_Real)>(
              &shell::make_shell_from_box))
      .class_function(
          "makeShellFromBoxTwoPoint",
          emscripten::select_overload<shell(const gp_Pnt &, const gp_Pnt &)>(
              &shell::make_shell_from_box))
      .class_function(
          "makeShellFromBoxAxis2",
          emscripten::select_overload<shell(const gp_Ax2 &, Standard_Real,
                                            Standard_Real, Standard_Real)>(
              &shell::make_shell_from_box))
      // Cylinder creation methods
      .class_function(
          "makeShellFromCylinder",
          emscripten::select_overload<shell(Standard_Real, Standard_Real)>(
              &shell::make_shell_from_cylinder))
      .class_function("makeShellFromCylinderAngle",
                      emscripten::select_overload<shell(
                          Standard_Real, Standard_Real, Standard_Real)>(
                          &shell::make_shell_from_cylinder))
      .class_function("makeShellFromCylinderAxis2",
                      emscripten::select_overload<shell(
                          const gp_Ax2 &, Standard_Real, Standard_Real)>(
                          &shell::make_shell_from_cylinder))
      .class_function(
          "makeShellFromCylinderAxis2Angle",
          emscripten::select_overload<shell(const gp_Ax2 &, Standard_Real,
                                            Standard_Real, Standard_Real)>(
              &shell::make_shell_from_cylinder))
      // Cone creation methods
      .class_function("makeShellFromCone",
                      emscripten::select_overload<shell(
                          Standard_Real, Standard_Real, Standard_Real)>(
                          &shell::make_shell_from_cone))
      .class_function(
          "makeShellFromConeAngle",
          emscripten::select_overload<shell(Standard_Real, Standard_Real,
                                            Standard_Real, Standard_Real)>(
              &shell::make_shell_from_cone))
      .class_function(
          "makeShellFromConeAxis2",
          emscripten::select_overload<shell(const gp_Ax2 &, Standard_Real,
                                            Standard_Real, Standard_Real)>(
              &shell::make_shell_from_cone))
      .class_function(
          "makeShellFromConeAxis2Angle",
          emscripten::select_overload<shell(
              const gp_Ax2 &, Standard_Real, Standard_Real, Standard_Real,
              Standard_Real)>(&shell::make_shell_from_cone))
      // Revolution creation methods
      .class_function(
          "makeShellFromRevolution",
          emscripten::select_overload<shell(const Handle(Geom_Curve) &)>(
              &shell::make_shell_from_revolution))
      .class_function("makeShellFromRevolutionAngle",
                      emscripten::select_overload<shell(
                          const Handle(Geom_Curve) &, Standard_Real)>(
                          &shell::make_shell_from_revolution))
      .class_function(
          "makeShellFromRevolutionLimit",
          emscripten::select_overload<shell(const Handle(Geom_Curve) &,
                                            Standard_Real, Standard_Real)>(
              &shell::make_shell_from_revolution))
      .class_function(
          "makeShellFromRevolutionLimitAngle",
          emscripten::select_overload<shell(
              const Handle(Geom_Curve) &, Standard_Real, Standard_Real,
              Standard_Real)>(&shell::make_shell_from_revolution))
      .class_function("makeShellFromRevolutionAxis2",
                      emscripten::select_overload<shell(
                          const gp_Ax2 &, const Handle(Geom_Curve) &)>(
                          &shell::make_shell_from_revolution))
      .class_function(
          "makeShellFromRevolutionAxis2Angle",
          emscripten::select_overload<shell(
              const gp_Ax2 &, const Handle(Geom_Curve) &, Standard_Real)>(
              &shell::make_shell_from_revolution))
      .class_function(
          "makeShellFromRevolutionAxis2Limit",
          emscripten::select_overload<shell(
              const gp_Ax2 &, const Handle(Geom_Curve) &, Standard_Real,
              Standard_Real)>(&shell::make_shell_from_revolution))
      .class_function("makeShellFromRevolutionAxis2LimitAngle",
                      emscripten::select_overload<shell(
                          const gp_Ax2 &, const Handle(Geom_Curve) &,
                          Standard_Real, Standard_Real, Standard_Real)>(
                          &shell::make_shell_from_revolution))
      // Sphere creation methods
      .class_function("makeShellFromSphere",
                      emscripten::select_overload<shell(Standard_Real)>(
                          &shell::make_shell_from_sphere))
      .class_function(
          "makeShellFromSphereAngle",
          emscripten::select_overload<shell(Standard_Real, Standard_Real)>(
              &shell::make_shell_from_sphere))
      .class_function("makeShellFromSphereTwoAngle",
                      emscripten::select_overload<shell(
                          Standard_Real, Standard_Real, Standard_Real)>(
                          &shell::make_shell_from_sphere))
      .class_function(
          "makeShellFromSphereThreeAngle",
          emscripten::select_overload<shell(Standard_Real, Standard_Real,
                                            Standard_Real, Standard_Real)>(
              &shell::make_shell_from_sphere))
      .class_function(
          "makeShellFromSphereCenterRaduis",
          emscripten::select_overload<shell(const gp_Pnt &, Standard_Real)>(
              &shell::make_shell_from_sphere))
      .class_function("makeShellFromSphereCenterAngle",
                      emscripten::select_overload<shell(
                          const gp_Pnt &, Standard_Real, Standard_Real)>(
                          &shell::make_shell_from_sphere))
      .class_function(
          "makeShellFromSphereCenterTwoAngle",
          emscripten::select_overload<shell(const gp_Pnt &, Standard_Real,
                                            Standard_Real, Standard_Real)>(
              &shell::make_shell_from_sphere))
      .class_function(
          "makeShellFromSphereCenterThreeAngle",
          emscripten::select_overload<shell(
              const gp_Pnt &, Standard_Real, Standard_Real, Standard_Real,
              Standard_Real)>(&shell::make_shell_from_sphere))
      .class_function(
          "makeShellFromSphereAxis2",
          emscripten::select_overload<shell(const gp_Ax2 &, Standard_Real)>(
              &shell::make_shell_from_sphere))
      .class_function("makeShellFromSphereAxis2Angle",
                      emscripten::select_overload<shell(
                          const gp_Ax2 &, Standard_Real, Standard_Real)>(
                          &shell::make_shell_from_sphere))
      .class_function(
          "makeShellFromSphereAxis2TwoAngle",
          emscripten::select_overload<shell(const gp_Ax2 &, Standard_Real,
                                            Standard_Real, Standard_Real)>(
              &shell::make_shell_from_sphere))
      .class_function(
          "makeShellFromSphereAxis2ThreeAngle",
          emscripten::select_overload<shell(
              const gp_Ax2 &, Standard_Real, Standard_Real, Standard_Real,
              Standard_Real)>(&shell::make_shell_from_sphere))
      // Torus creation methods
      .class_function(
          "makeShellFromTorus",
          emscripten::select_overload<shell(Standard_Real, Standard_Real)>(
              &shell::make_shell_from_torus))
      .class_function("makeShellFromTorusAngle",
                      emscripten::select_overload<shell(
                          Standard_Real, Standard_Real, Standard_Real)>(
                          &shell::make_shell_from_torus))
      .class_function(
          "makeShellFromTorusTwoAngle",
          emscripten::select_overload<shell(Standard_Real, Standard_Real,
                                            Standard_Real, Standard_Real)>(
              &shell::make_shell_from_torus))
      .class_function("makeShellFromTorusThreeAngle",
                      emscripten::select_overload<shell(
                          Standard_Real, Standard_Real, Standard_Real,
                          Standard_Real, Standard_Real)>(
                          &shell::make_shell_from_torus))
      .class_function("makeShellFromTorusAxis2",
                      emscripten::select_overload<shell(
                          const gp_Ax2 &, Standard_Real, Standard_Real)>(
                          &shell::make_shell_from_torus))
      .class_function(
          "makeShellFromTorusAxis2Angle",
          emscripten::select_overload<shell(const gp_Ax2 &, Standard_Real,
                                            Standard_Real, Standard_Real)>(
              &shell::make_shell_from_torus))
      .class_function(
          "makeShellFromTorusAxis2TwoAngle",
          emscripten::select_overload<shell(
              const gp_Ax2 &, Standard_Real, Standard_Real, Standard_Real,
              Standard_Real)>(&shell::make_shell_from_torus))
      .class_function(
          "makeShellFromTorusAxis2ThreeAngle",
          emscripten::select_overload<shell(
              const gp_Ax2 &, Standard_Real, Standard_Real, Standard_Real,
              Standard_Real, Standard_Real)>(&shell::make_shell_from_torus))
      // Wedge creation methods
      .class_function(
          "makeShellFromWedge",
          emscripten::select_overload<shell(Standard_Real, Standard_Real,
                                            Standard_Real, Standard_Real)>(
              &shell::make_shell_from_wedge))
      .class_function(
          "makeShellFromWedgeAxis2",
          emscripten::select_overload<shell(
              const gp_Ax2 &, Standard_Real, Standard_Real, Standard_Real,
              Standard_Real)>(&shell::make_shell_from_wedge))
      .class_function(
          "makeShellFromWedgeLimit",
          emscripten::select_overload<
              shell(Standard_Real, Standard_Real, Standard_Real, Standard_Real,
                    Standard_Real, Standard_Real, Standard_Real)>(
              &shell::make_shell_from_wedge))
      .class_function(
          "makeShellFromWedgeAxis2Limit",
          emscripten::select_overload<shell(
              const gp_Ax2 &, Standard_Real, Standard_Real, Standard_Real,
              Standard_Real, Standard_Real, Standard_Real, Standard_Real)>(
              &shell::make_shell_from_wedge))
      // Other methods
      .function("sweep",
                emscripten::optional_override([](shell &self, const wire &spine,
                                                 emscripten::val profilesVal,
                                                 int cornerMode) {
                  std::vector<shape> profiles;
                  if (!profilesVal.isUndefined() && !profilesVal.isNull()) {
                    const size_t length = profilesVal["length"].as<size_t>();
                    profiles.reserve(length);
                    for (size_t i = 0; i < length; ++i) {
                      profiles.push_back(profilesVal[i].as<shape>());
                    }
                  }
                  return self.sweep(spine, profiles, cornerMode);
                }))
      .function("value",
                emscripten::select_overload<const TopoDS_Shell &() const>(
                    &shell::value))
      .function("type", &shell::type)
      .function("copy", emscripten::optional_override([](const shell &self,
                                                         emscripten::val deep) {
                  bool deepCopy = deep.isUndefined() ? true : deep.as<bool>();
                  return self.copy(deepCopy);
                }));

  // Bind ShellIterator
  emscripten::class_<shell_iterator>("ShellIterator")
      .constructor<shape &>()
      .function("reset", &shell_iterator::reset)
      .function("next", &shell_iterator::next);

  // 绑定face_iterator类
  emscripten::class_<face_iterator>("FaceIterator")
      .constructor<shape &>()
      .function("reset", &face_iterator::reset)
      .function("next", &face_iterator::next);

  // 绑定shape3d类，继承自shape
  emscripten::class_<shape3d, emscripten::base<shape>>("Shape3D")
      .constructor<>()
      // 几何判断方法
      .function("isInside", &shape3d::is_inside);

  // 绑定solid类，继承自shape3d
  emscripten::class_<solid, emscripten::base<shape3d>>("Solid")
      .constructor<>()
      .constructor(emscripten::optional_override(
          [](emscripten::val shpVal, emscripten::val forConstructionVal) {
            TopoDS_Shape shp = shpVal.as<TopoDS_Shape>();
            bool forConstruction = forConstructionVal.isUndefined()
                                       ? false
                                       : forConstructionVal.as<bool>();
            return solid(shp, forConstruction);
          }))
      // 基础创建方法
      .class_function("makeSolidFromCompSolid",
                      emscripten::select_overload<solid(const comp_solid &)>(
                          &solid::make_solid))
      .class_function(
          "makeSolidFromShell",
          emscripten::select_overload<solid(const shell &)>(&solid::make_solid))
      .class_function(
          "makeSolidFromTwoShell",
          emscripten::select_overload<solid(const shell &, const shell &)>(
              &solid::make_solid))
      .class_function(
          "makeSolidFromThreeShell",
          emscripten::select_overload<solid(const shell &, const shell &,
                                            const shell &)>(&solid::make_solid))
      .class_function(
          "makeSolidFromShells",
          emscripten::optional_override([](emscripten::val shellsVal) {
            std::vector<shell> shells;
            if (!shellsVal.isUndefined() && !shellsVal.isNull()) {
              const size_t length = shellsVal["length"].as<size_t>();
              shells.reserve(length);
              for (size_t i = 0; i < length; ++i) {
                shells.push_back(shellsVal[i].as<shell>());
              }
            }
            return solid::make_solid(shells);
          }))
      .class_function(
          "makeSolidFromSolid",
          emscripten::select_overload<solid(const solid &)>(&solid::make_solid))
      .class_function(
          "makeSolidFromSolidShell",
          emscripten::select_overload<solid(const solid &, const shell &)>(
              &solid::make_solid))
      .class_function(
          "makeSolidFromFaces",
          emscripten::optional_override([](emscripten::val facesVal,
                                           emscripten::val toleranceVal) {
            std::vector<face> faces;
            if (!facesVal.isUndefined() && !facesVal.isNull()) {
              const size_t length = facesVal["length"].as<size_t>();
              faces.reserve(length);
              for (size_t i = 0; i < length; ++i) {
                faces.push_back(facesVal[i].as<face>());
              }
            }
            double tolerance =
                toleranceVal.isUndefined() ? 1.0e-6 : toleranceVal.as<double>();
            return solid::make_solid(faces, tolerance);
          }))
      // 基本几何体创建方法 - 盒子
      .class_function(
          "makeSolidFromBox",
          emscripten::select_overload<solid(
              const Standard_Real, const Standard_Real, const Standard_Real)>(
              &solid::make_solid_from_box))
      .class_function(
          "makeSolidFromBoxPoint",
          emscripten::select_overload<solid(
              const gp_Pnt &, const Standard_Real, const Standard_Real,
              const Standard_Real)>(&solid::make_solid_from_box))
      .class_function(
          "makeSolidFromBoxTwoPoint",
          emscripten::select_overload<solid(const gp_Pnt &, const gp_Pnt &)>(
              &solid::make_solid_from_box))
      .class_function(
          "makeSolidFromBoxAxis2",
          emscripten::select_overload<solid(
              const gp_Ax2 &, const Standard_Real, const Standard_Real,
              const Standard_Real)>(&solid::make_solid_from_box))
      // 基本几何体创建方法 - 圆柱
      .class_function(
          "makeSolidFromCylinderAngle",
          emscripten::select_overload<solid(
              const Standard_Real, const Standard_Real, const Standard_Real)>(
              &solid::make_solid_from_cylinder))
      .class_function(
          "makeSolidFromCylinderAxis2",
          emscripten::select_overload<solid(const gp_Ax2 &, const Standard_Real,
                                            const Standard_Real)>(
              &solid::make_solid_from_cylinder))
      .class_function(
          "makeSolidFromCylinderAxis2Angle",
          emscripten::select_overload<solid(
              const gp_Ax2 &, const Standard_Real, const Standard_Real,
              const Standard_Real)>(&solid::make_solid_from_cylinder))
      .class_function(
          "makeSolidFromCylinder",
          emscripten::optional_override(
              [](double radius, double height, emscripten::val pntVal,
                 emscripten::val dirVal, emscripten::val angleVal) {
                gp_Pnt pnt = pntVal.isUndefined() ? gp_Pnt(0, 0, 0)
                                                  : pntVal.as<gp_Pnt>();

                gp_Dir dir = dirVal.isUndefined() ? gp_Dir(0, 0, 1)
                                                  : dirVal.as<gp_Dir>();

                double angle =
                    angleVal.isUndefined() ? 360.0 : angleVal.as<double>();

                return solid::make_solid_from_cylinder(radius, height, pnt, dir,
                                                       angle);
              }))
      // 基本几何体创建方法 - 圆锥
      .class_function(
          "makeSolidFromCone",
          emscripten::optional_override(
              [](double radius1, double radius2, double height,
                 emscripten::val pntVal, emscripten::val dirVal,
                 emscripten::val angleVal) {
                gp_Pnt pnt = pntVal.isUndefined() ? gp_Pnt(0, 0, 0)
                                                  : pntVal.as<gp_Pnt>();

                gp_Dir dir = dirVal.isUndefined() ? gp_Dir(0, 0, 1)
                                                  : dirVal.as<gp_Dir>();

                double angle =
                    angleVal.isUndefined() ? 360.0 : angleVal.as<double>();

                return solid::make_solid_from_cone(radius1, radius2, height,
                                                   pnt, dir, angle);
              }))
      .class_function(
          "makeSolidFromConeAngle",
          emscripten::select_overload<solid(
              const Standard_Real, const Standard_Real, const Standard_Real,
              const Standard_Real)>(&solid::make_solid_from_cone))
      .class_function(
          "makeSolidFromConeAxis2",
          emscripten::select_overload<solid(
              const gp_Ax2 &, const Standard_Real, const Standard_Real,
              const Standard_Real)>(&solid::make_solid_from_cone))
      .class_function(
          "makeSolidFromConeAxis2Angle",
          emscripten::select_overload<solid(
              const gp_Ax2 &, const Standard_Real, const Standard_Real,
              const Standard_Real, const Standard_Real)>(
              &solid::make_solid_from_cone))
      // 旋转体创建方法
      .class_function(
          "makeSolidFromRevolution",
          emscripten::select_overload<solid(const Handle(Geom_Curve) &)>(
              &solid::make_solid_from_revolution))
      .class_function("makeSolidFromRevolutionAngle",
                      emscripten::select_overload<solid(
                          const Handle(Geom_Curve) &, const Standard_Real)>(
                          &solid::make_solid_from_revolution))
      .class_function(
          "makeSolidFromRevolutionLimit",
          emscripten::select_overload<solid(
              const Handle(Geom_Curve) &, const Standard_Real,
              const Standard_Real)>(&solid::make_solid_from_revolution))
      .class_function("makeSolidFromRevolutionLimitAngle",
                      emscripten::select_overload<solid(
                          const Handle(Geom_Curve) &, const Standard_Real,
                          const Standard_Real, const Standard_Real)>(
                          &solid::make_solid_from_revolution))
      .class_function("makeSolidFromRevolutionAxis2",
                      emscripten::select_overload<solid(
                          const gp_Ax2 &, const Handle(Geom_Curve) &)>(
                          &solid::make_solid_from_revolution))
      .class_function(
          "makeSolidFromRevolutionAxis2Angle",
          emscripten::select_overload<solid(
              const gp_Ax2 &, const Handle(Geom_Curve) &, const Standard_Real)>(
              &solid::make_solid_from_revolution))
      .class_function(
          "makeSolidFromRevolutionAxis2Limit",
          emscripten::select_overload<solid(
              const gp_Ax2 &, const Handle(Geom_Curve) &, const Standard_Real,
              const Standard_Real)>(&solid::make_solid_from_revolution))
      .class_function(
          "makeSolidFromRevolutionAxis2LimitAngle",
          emscripten::select_overload<solid(
              const gp_Ax2 &, const Handle(Geom_Curve) &, const Standard_Real,
              const Standard_Real, const Standard_Real)>(
              &solid::make_solid_from_revolution))
      // 球体创建方法
      .class_function("makeSolidFromSphere",
                      emscripten::select_overload<solid(const Standard_Real)>(
                          &solid::make_solid_from_sphere))
      .class_function("makeSolidFromSphere",
                      emscripten::select_overload<solid(const Standard_Real,
                                                        const Standard_Real)>(
                          &solid::make_solid_from_sphere))
      .class_function(
          "makeSolidFromSphere",
          emscripten::select_overload<solid(
              const Standard_Real, const Standard_Real, const Standard_Real)>(
              &solid::make_solid_from_sphere))
      .class_function(
          "makeSolidFromSphere",
          emscripten::select_overload<solid(
              const Standard_Real, const Standard_Real, const Standard_Real,
              const Standard_Real)>(&solid::make_solid_from_sphere))
      .class_function("makeSolidFromSphere",
                      emscripten::select_overload<solid(const gp_Pnt &,
                                                        const Standard_Real)>(
                          &solid::make_solid_from_sphere))
      .class_function(
          "makeSolidFromSphere",
          emscripten::select_overload<solid(const gp_Pnt &, const Standard_Real,
                                            const Standard_Real)>(
              &solid::make_solid_from_sphere))
      .class_function(
          "makeSolidFromSphere",
          emscripten::select_overload<solid(
              const gp_Pnt &, const Standard_Real, const Standard_Real,
              const Standard_Real)>(&solid::make_solid_from_sphere))
      .class_function(
          "makeSolidFromSphere",
          emscripten::select_overload<solid(
              const gp_Pnt &, const Standard_Real, const Standard_Real,
              const Standard_Real, const Standard_Real)>(
              &solid::make_solid_from_sphere))
      .class_function("makeSolidFromSphere",
                      emscripten::select_overload<solid(const gp_Ax2 &,
                                                        const Standard_Real)>(
                          &solid::make_solid_from_sphere))
      .class_function(
          "makeSolidFromSphere",
          emscripten::select_overload<solid(const gp_Ax2 &, const Standard_Real,
                                            const Standard_Real)>(
              &solid::make_solid_from_sphere))
      .class_function(
          "makeSolidFromSphere",
          emscripten::select_overload<solid(
              const gp_Ax2 &, const Standard_Real, const Standard_Real,
              const Standard_Real)>(&solid::make_solid_from_sphere))
      .class_function(
          "makeSolidFromSphere",
          emscripten::select_overload<solid(
              const gp_Ax2 &, const Standard_Real, const Standard_Real,
              const Standard_Real, const Standard_Real)>(
              &solid::make_solid_from_sphere))
      // 圆环体创建方法
      .class_function("makeSolidFromTorus",
                      emscripten::select_overload<solid(const Standard_Real,
                                                        const Standard_Real)>(
                          &solid::make_solid_from_torus))
      .class_function(
          "makeSolidFromTorus",
          emscripten::select_overload<solid(
              const Standard_Real, const Standard_Real, const Standard_Real)>(
              &solid::make_solid_from_torus))
      .class_function(
          "makeSolidFromTorus",
          emscripten::select_overload<solid(
              const Standard_Real, const Standard_Real, const Standard_Real,
              const Standard_Real)>(&solid::make_solid_from_torus))
      .class_function(
          "makeSolidFromTorus",
          emscripten::select_overload<solid(
              const Standard_Real, const Standard_Real, const Standard_Real,
              const Standard_Real, const Standard_Real)>(
              &solid::make_solid_from_torus))
      .class_function(
          "makeSolidFromTorus",
          emscripten::select_overload<solid(const gp_Ax2 &, const Standard_Real,
                                            const Standard_Real)>(
              &solid::make_solid_from_torus))
      .class_function(
          "makeSolidFromTorus",
          emscripten::select_overload<solid(
              const gp_Ax2 &, const Standard_Real, const Standard_Real,
              const Standard_Real)>(&solid::make_solid_from_torus))
      .class_function(
          "makeSolidFromTorus",
          emscripten::select_overload<solid(
              const gp_Ax2 &, const Standard_Real, const Standard_Real,
              const Standard_Real, const Standard_Real)>(
              &solid::make_solid_from_torus))
      // 楔形体创建方法
      .class_function(
          "makeSolidFromWedge",
          emscripten::select_overload<solid(
              const Standard_Real, const Standard_Real, const Standard_Real,
              const Standard_Real)>(&solid::make_solid_from_wedge))
      .class_function(
          "makeSolidFromWedge",
          emscripten::select_overload<solid(
              const gp_Ax2 &, const Standard_Real, const Standard_Real,
              const Standard_Real, const Standard_Real)>(
              &solid::make_solid_from_wedge))
      .class_function(
          "makeSolidFromWedge",
          emscripten::select_overload<solid(
              const Standard_Real, const Standard_Real, const Standard_Real,
              const Standard_Real, const Standard_Real, const Standard_Real,
              const Standard_Real)>(&solid::make_solid_from_wedge))
      .class_function(
          "makeSolidFromWedge",
          emscripten::select_overload<solid(
              const gp_Ax2 &, const Standard_Real, const Standard_Real,
              const Standard_Real, const Standard_Real)>(
              &solid::make_solid_from_wedge))
      .class_function(
          "makeSolidFromLoft",
          emscripten::optional_override([](emscripten::val wiresVal,
                                           emscripten::val ruledVal) {
            std::vector<wire> wires;
            if (!wiresVal.isUndefined() && !wiresVal.isNull()) {
              const size_t length = wiresVal["length"].as<size_t>();
              wires.reserve(length);
              for (size_t i = 0; i < length; ++i) {
                wires.push_back(wiresVal[i].as<wire>());
              }
            }
            bool ruled = ruledVal.isUndefined() ? false : ruledVal.as<bool>();
            return solid::make_solid_from_loft(wires, ruled);
          }))
      // 外壳访问方法
      .function("outerShell", &solid::outer_shell)
      .function("innerShells",
                emscripten::optional_override([](const solid &self) {
                  auto shells = self.inner_shells();
                  emscripten::val jsResult = emscripten::val::array();
                  for (const auto &shell : shells) {
                    jsResult.call<void>("push", shell);
                  }
                  return jsResult;
                }))
      // 几何操作方法
      .function(
          "extrudeWithRotationFromWire",
          emscripten::optional_override(
              [](solid &self, const wire &outerWire,
                 emscripten::val innerWiresVal, const gp_Pnt &vecCenter,
                 const gp_Vec &vecNormal, double angleDegrees) {
                std::vector<wire> innerWires;
                if (!innerWiresVal.isUndefined() && !innerWiresVal.isNull()) {
                  const size_t length = innerWiresVal["length"].as<size_t>();
                  innerWires.reserve(length);
                  for (size_t i = 0; i < length; ++i) {
                    innerWires.push_back(innerWiresVal[i].as<wire>());
                  }
                }
                return self.extrude_with_rotation(
                    outerWire, innerWires, vecCenter, vecNormal, angleDegrees);
              }))
      .function("extrudeWithRotationFromFace",
                emscripten::select_overload<int(const face &, const gp_Pnt &,
                                                const gp_Vec &, double)>(
                    &solid::extrude_with_rotation))
      .function(
          "extrudeFromWire",
          emscripten::optional_override([](solid &self, const wire &outerWire,
                                           emscripten::val innerWiresVal,
                                           const gp_Vec &vecNormal,
                                           emscripten::val taperVal) {
            std::vector<wire> innerWires;
            if (!innerWiresVal.isUndefined() && !innerWiresVal.isNull()) {
              const size_t length = innerWiresVal["length"].as<size_t>();
              innerWires.reserve(length);
              for (size_t i = 0; i < length; ++i) {
                innerWires.push_back(innerWiresVal[i].as<wire>());
              }
            }
            double taper = taperVal.isUndefined() ? 0.0 : taperVal.as<double>();
            return self.extrude(outerWire, innerWires, vecNormal, taper);
          }))
      .function("extrudeFromFacePoint",
                emscripten::select_overload<int(const face &, gp_Pnt, gp_Pnt)>(
                    &solid::extrude))
      .function("extrudeFromFaceVector",
                emscripten::optional_override([](solid &self, const face &f,
                                                 const gp_Vec &dir,
                                                 emscripten::val taperVal) {
                  double taper =
                      taperVal.isUndefined() ? 0.0 : taperVal.as<double>();
                  return self.extrude(f, dir, taper);
                }))
      .function("revolveFromFacePoint",
                emscripten::select_overload<int(const face &, gp_Pnt, gp_Pnt,
                                                double)>(&solid::revolve))
      .function(
          "revolveFromWire",
          emscripten::optional_override(
              [](solid &self, const wire &outerWire,
                 emscripten::val innerWiresVal, double angleDegrees,
                 const gp_Pnt &axisStart, const gp_Pnt &axisEnd) {
                std::vector<wire> innerWires;
                if (!innerWiresVal.isUndefined() && !innerWiresVal.isNull()) {
                  const size_t length = innerWiresVal["length"].as<size_t>();
                  innerWires.reserve(length);
                  for (size_t i = 0; i < length; ++i) {
                    innerWires.push_back(innerWiresVal[i].as<wire>());
                  }
                }
                return self.revolve(outerWire, innerWires, angleDegrees,
                                    axisStart, axisEnd);
              }))
      .function(
          "revolveFromFaceAnglePoint",
          emscripten::select_overload<int(const face &, double, const gp_Pnt &,
                                          const gp_Pnt &)>(&solid::revolve))
      .function("loft",
                emscripten::optional_override(
                    [](solid &self, emscripten::val profilesVal,
                       emscripten::val ruledVal, emscripten::val toleranceVal) {
                      std::vector<shape> profiles;
                      if (!profilesVal.isUndefined() && !profilesVal.isNull()) {
                        const size_t length =
                            profilesVal["length"].as<size_t>();
                        profiles.reserve(length);
                        for (size_t i = 0; i < length; ++i) {
                          profiles.push_back(profilesVal[i].as<shape>());
                        }
                      }
                      bool ruled =
                          ruledVal.isUndefined() ? false : ruledVal.as<bool>();
                      double tolerance = toleranceVal.isUndefined()
                                             ? 1.0e-06
                                             : toleranceVal.as<double>();
                      return self.loft(profiles, ruled, tolerance);
                    }))
      .function("pipe", &solid::pipe)
      .function("sweepCompound",
                emscripten::optional_override([](solid &self, const wire &spine,
                                                 emscripten::val profilesVal,
                                                 int cornerMode) {
                  std::vector<solid::sweep_profile> profiles;
                  if (!profilesVal.isUndefined() && !profilesVal.isNull()) {
                    const size_t length = profilesVal["length"].as<size_t>();
                    profiles.reserve(length);
                    for (size_t i = 0; i < length; ++i) {
                      auto profileVal = profilesVal[i];
                      solid::sweep_profile profile{
                          profileVal["profile"].as<shape>(),
                          profileVal["index"].as<int>()};
                      profiles.push_back(profile);
                    }
                  }
                  return self.sweep(spine, profiles, cornerMode);
                }))
      .function("sweep",
                emscripten::optional_override([](solid &self, const wire &spine,
                                                 emscripten::val profilesVal,
                                                 int cornerMode) {
                  std::vector<shape> profiles;
                  if (!profilesVal.isUndefined() && !profilesVal.isNull()) {
                    const size_t length = profilesVal["length"].as<size_t>();
                    profiles.reserve(length);
                    for (size_t i = 0; i < length; ++i) {
                      profiles.push_back(profilesVal[i].as<shape>());
                    }
                  }
                  return self.sweep(spine, profiles, cornerMode);
                }))
      .function(
          "sweepWire",
          emscripten::optional_override(
              [](solid &self, const wire &outerWire,
                 emscripten::val innerWiresVal, const TopoDS_Shape &path,
                 emscripten::val makeSolidVal, emscripten::val isFrenetVal,
                 emscripten::val modeVal, emscripten::val transitionModeVal) {
                // 处理innerWires数组
                std::vector<wire> innerWires;
                if (!innerWiresVal.isUndefined() && !innerWiresVal.isNull()) {
                  const size_t length = innerWiresVal["length"].as<size_t>();
                  innerWires.reserve(length);
                  for (size_t i = 0; i < length; ++i) {
                    innerWires.push_back(innerWiresVal[i].as<wire>());
                  }
                }

                // 处理布尔参数默认值
                bool makeSolid =
                    makeSolidVal.isUndefined() ? true : makeSolidVal.as<bool>();
                bool isFrenet =
                    isFrenetVal.isUndefined() ? false : isFrenetVal.as<bool>();

                // 处理可选的SweepMode
                boost::optional<solid::SweepMode> mode;
                if (!modeVal.isUndefined() && !modeVal.isNull()) {
                  if (modeVal.instanceof(emscripten::val::global("gp_Vec"))) {
                    gp_Vec vec = modeVal.as<gp_Vec>();
                    mode = vec;
                  } else if (modeVal.instanceof(
                                 emscripten::val::global("TopoDS_Wire"))) {
                    TopoDS_Wire wire = modeVal.as<TopoDS_Wire>();
                    mode = wire;
                  }
                  // 检查是否为TopoDS_Edge类型
                  else if (modeVal.instanceof(
                               emscripten::val::global("TopoDS_Edge"))) {
                    TopoDS_Edge edge = modeVal.as<TopoDS_Edge>();
                    mode = edge;
                  }
                }

                // 处理transitionMode默认值
                std::string transitionMode =
                    transitionModeVal.isUndefined()
                        ? "transformed"
                        : transitionModeVal.as<std::string>();

                return self.sweep(outerWire, innerWires, path, makeSolid,
                                  isFrenet, mode, transitionMode);
              }))
      .function(
          "sweepFace",
          emscripten::optional_override(
              [](solid &self, const face &f, const TopoDS_Shape &path,
                 emscripten::val makeSolidVal, emscripten::val isFrenetVal,
                 emscripten::val modeVal, emscripten::val transitionModeVal) {
                // 处理布尔参数默认值
                bool makeSolid =
                    makeSolidVal.isUndefined() ? true : makeSolidVal.as<bool>();
                bool isFrenet =
                    isFrenetVal.isUndefined() ? false : isFrenetVal.as<bool>();

                // 处理可选的SweepMode
                boost::optional<solid::SweepMode> mode;
                if (!modeVal.isUndefined() && !modeVal.isNull()) {
                  if (modeVal.instanceof(emscripten::val::global("gp_Vec"))) {
                    gp_Vec vec = modeVal.as<gp_Vec>();
                    mode = vec;
                  } else if (modeVal.instanceof(
                                 emscripten::val::global("TopoDS_Wire"))) {
                    // TopoDS_Wire类型
                    mode = modeVal.as<TopoDS_Wire>();
                  } else if (modeVal.instanceof(
                                 emscripten::val::global("TopoDS_Edge"))) {
                    // TopoDS_Edge类型
                    mode = modeVal.as<TopoDS_Edge>();
                  }
                }

                // 处理transitionMode默认值
                std::string transitionMode =
                    transitionModeVal.isUndefined()
                        ? "transformed"
                        : transitionModeVal.as<std::string>();

                return self.sweep(f, path, makeSolid, isFrenet, mode,
                                  transitionMode);
              }))
      .class_function(
          "sweepMulti",
          emscripten::optional_override(
              [](solid &self, emscripten::val profilesVal,
                 const TopoDS_Shape &path, emscripten::val makeSolidVal,
                 emscripten::val isFrenetVal, emscripten::val modeVal) {
                // 处理profiles数组
                std::vector<boost::variant<wire, face>> profiles;
                if (!profilesVal.isUndefined() && !profilesVal.isNull()) {
                  const size_t length = profilesVal["length"].as<size_t>();
                  profiles.reserve(length);
                  for (size_t i = 0; i < length; ++i) {
                    emscripten::val item = profilesVal[i];
                    if (item.instanceof(emscripten::val::global("Wire"))) {
                      profiles.emplace_back(item.as<wire>());
                    } else if (item.instanceof(
                                   emscripten::val::global("Face"))) {
                      profiles.emplace_back(item.as<face>());
                    }
                  }
                }

                // 处理布尔参数默认值
                bool makeSolid =
                    makeSolidVal.isUndefined() ? true : makeSolidVal.as<bool>();
                bool isFrenet =
                    isFrenetVal.isUndefined() ? false : isFrenetVal.as<bool>();

                // 处理可选的SweepMode
                boost::optional<solid::SweepMode> mode;
                if (!modeVal.isUndefined() && !modeVal.isNull()) {
                  if (modeVal.instanceof(emscripten::val::global("gp_Vec"))) {
                    gp_Vec vec = modeVal.as<gp_Vec>();
                    mode = vec;
                  } else if (modeVal.instanceof(
                                 emscripten::val::global("TopoDS_Wire"))) {
                    // TopoDS_Wire类型
                    mode = modeVal.as<TopoDS_Wire>();
                  } else if (modeVal.instanceof(
                                 emscripten::val::global("TopoDS_Edge"))) {
                    // TopoDS_Edge类型
                    mode = modeVal.as<TopoDS_Edge>();
                  }
                }

                return self.sweep_multi(profiles, path, makeSolid, isFrenet,
                                        mode);
              }))
      // 布尔运算和特征操作
      .function("split",
                emscripten::optional_override([](solid &self,
                                                 emscripten::val splittersVal) {
                  std::vector<shape> splitters;
                  if (!splittersVal.isUndefined() && !splittersVal.isNull()) {
                    const size_t length = splittersVal["length"].as<size_t>();
                    splitters.reserve(length);
                    for (size_t i = 0; i < length; ++i) {
                      splitters.push_back(splittersVal[i].as<shape>());
                    }
                  }
                  return self.split(splitters);
                }))
      .function("fillet",
                emscripten::optional_override([](solid &self,
                                                 emscripten::val edgesVal,
                                                 emscripten::val radiusVal) {
                  std::vector<edge> edges;
                  if (!edgesVal.isUndefined() && !edgesVal.isNull()) {
                    const size_t edgesLength = edgesVal["length"].as<size_t>();
                    edges.reserve(edgesLength);
                    for (size_t i = 0; i < edgesLength; ++i) {
                      edges.push_back(edgesVal[i].as<edge>());
                    }
                  }

                  std::vector<double> radius;
                  if (!radiusVal.isUndefined() && !radiusVal.isNull()) {
                    const size_t radiusLength =
                        radiusVal["length"].as<size_t>();
                    radius.reserve(radiusLength);
                    for (size_t i = 0; i < radiusLength; ++i) {
                      radius.push_back(radiusVal[i].as<double>());
                    }
                  }

                  return self.fillet(edges, radius);
                }))
      .function("chamfer",
                emscripten::optional_override([](solid &self,
                                                 emscripten::val edgesVal,
                                                 emscripten::val distancesVal) {
                  std::vector<edge> edges;
                  if (!edgesVal.isUndefined() && !edgesVal.isNull()) {
                    const size_t edgesLength = edgesVal["length"].as<size_t>();
                    edges.reserve(edgesLength);
                    for (size_t i = 0; i < edgesLength; ++i) {
                      edges.push_back(edgesVal[i].as<edge>());
                    }
                  }

                  std::vector<double> distances;
                  if (!distancesVal.isUndefined() && !distancesVal.isNull()) {
                    const size_t distancesLength =
                        distancesVal["length"].as<size_t>();
                    distances.reserve(distancesLength);
                    for (size_t i = 0; i < distancesLength; ++i) {
                      distances.push_back(distancesVal[i].as<double>());
                    }
                  }

                  return self.chamfer(edges, distances);
                }))
      .function("shelling",
                emscripten::optional_override(
                    [](solid &self, emscripten::val facesVal, double offset,
                       emscripten::val toleranceVal) {
                      std::vector<face> faces;
                      if (!facesVal.isUndefined() && !facesVal.isNull()) {
                        const size_t length = facesVal["length"].as<size_t>();
                        faces.reserve(length);
                        for (size_t i = 0; i < length; ++i) {
                          faces.push_back(facesVal[i].as<face>());
                        }
                      }
                      double tolerance = toleranceVal.isUndefined()
                                             ? 1.0e-06
                                             : toleranceVal.as<double>();
                      return self.shelling(faces, offset, tolerance);
                    }))
      .function("offset", emscripten::optional_override(
                              [](solid &self, const face &f, double offset,
                                 emscripten::val toleranceVal) {
                                double tolerance =
                                    toleranceVal.isUndefined()
                                        ? 1.0e-06
                                        : toleranceVal.as<double>();
                                return self.offset(f, offset, tolerance);
                              }))
      .function("draft", &solid::draft)
      .function("evolved",
                emscripten::select_overload<int(const face &, const wire &)>(
                    &solid::evolved))
      .function("evolved",
                emscripten::select_overload<int(const wire &, const wire &)>(
                    &solid::evolved))
      // 特征操作
      .function("featPrism",
                emscripten::optional_override([](solid &self, const face &f,
                                                 const gp_Dir &d, double height,
                                                 emscripten::val fuseVal) {
                  bool fuse = fuseVal.isUndefined() ? true : fuseVal.as<bool>();
                  return self.feat_prism(f, d, height, fuse);
                }))
      .function(
          "featPrismForRange",
          emscripten::optional_override(
              [](solid &self, const face &f, const gp_Dir &d, const face &from,
                 const face &end, emscripten::val fuseVal) {
                bool fuse = fuseVal.isUndefined() ? true : fuseVal.as<bool>();
                return self.feat_prism(f, d, from, end, fuse);
              }))
      .function("featPrismForUntil",
                emscripten::optional_override(
                    [](solid &self, const face &f, const gp_Dir &d,
                       const face &until, emscripten::val fuseVal) {
                      bool fuse =
                          fuseVal.isUndefined() ? true : fuseVal.as<bool>();
                      return self.feat_prism(f, d, until, fuse);
                    }))
      .function("featDraftPrism",
                emscripten::optional_override([](solid &self, const face &f,
                                                 double angle, double height,
                                                 emscripten::val fuseVal) {
                  bool fuse = fuseVal.isUndefined() ? true : fuseVal.as<bool>();
                  return self.feat_draft_prism(f, angle, height, fuse);
                }))
      .function("featDraftPrismForRange",
                emscripten::optional_override([](solid &self, const face &f,
                                                 double angle, const face &from,
                                                 const face &end,
                                                 emscripten::val fuseVal) {
                  bool fuse = fuseVal.isUndefined() ? true : fuseVal.as<bool>();
                  return self.feat_draft_prism(f, angle, from, end, fuse);
                }))
      .function("featDraftPrismForUntil",
                emscripten::optional_override(
                    [](solid &self, const face &f, double angle,
                       const face &until, emscripten::val fuseVal) {
                      bool fuse =
                          fuseVal.isUndefined() ? true : fuseVal.as<bool>();
                      return self.feat_draft_prism(f, angle, until, fuse);
                    }))
      .function(
          "featRevolForRange",
          emscripten::optional_override(
              [](solid &self, const face &f, const gp_Ax1 &Axes,
                 const face &from, const face &end, emscripten::val fuseVal) {
                bool fuse = fuseVal.isUndefined() ? true : fuseVal.as<bool>();
                return self.feat_revol(f, Axes, from, end, fuse);
              }))
      .function("featRevolForUntil",
                emscripten::optional_override(
                    [](solid &self, const face &f, const gp_Ax1 &Axes,
                       const face &until, emscripten::val fuseVal) {
                      bool fuse =
                          fuseVal.isUndefined() ? true : fuseVal.as<bool>();
                      return self.feat_revol(f, Axes, until, fuse);
                    }))
      .function(
          "featPipeForRange",
          emscripten::optional_override(
              [](solid &self, const face &f, const wire &Spine,
                 const face &from, const face &end, emscripten::val fuseVal) {
                bool fuse = fuseVal.isUndefined() ? true : fuseVal.as<bool>();
                return self.feat_pipe(f, Spine, from, end, fuse);
              }))
      .function("featPipeForUntil",
                emscripten::optional_override(
                    [](solid &self, const face &f, const wire &Spine,
                       const face &until, emscripten::val fuseVal) {
                      bool fuse =
                          fuseVal.isUndefined() ? true : fuseVal.as<bool>();
                      return self.feat_pipe(f, Spine, until, fuse);
                    }))
      // 线性形式和旋转形式
      .function("linearForm",
                emscripten::optional_override(
                    [](solid &self, const wire &w, const Handle(Geom_Plane) & p,
                       gp_Dir d, gp_Dir d1, emscripten::val fuseVal) {
                      bool fuse =
                          fuseVal.isUndefined() ? true : fuseVal.as<bool>();
                      return self.linear_form(w, p, d, d1, fuse);
                    }))
      .function("revolutionForm",
                emscripten::optional_override(
                    [](solid &self, const wire &w, const Handle(Geom_Plane) & p,
                       const gp_Ax1 &Axes, Standard_Real h1, Standard_Real h2,
                       emscripten::val fuseVal) {
                      bool fuse =
                          fuseVal.isUndefined() ? true : fuseVal.as<bool>();
                      return self.revolution_form(w, p, Axes, h1, h2, fuse);
                    }))
      // 布尔运算方法
      .function("boolean", &solid::boolean)

      // 几何属性方法
      .function("area", &solid::area)
      .function("volume", &solid::volume)
      .function("inertia", &solid::inertia)
      .function("section",
                emscripten::optional_override(
                    [](solid &self, gp_Pnt pnt, gp_Pnt nor) -> emscripten::val {
                      auto result = self.section(pnt, nor);
                      if (result) {
                        return emscripten::val(*result);
                      }
                      return emscripten::val::null();
                    }))
      // ... 其
      .function("convertToNurbs", &solid::convert_to_nurbs)
      // 值访问方法
      .function("value",
                emscripten::select_overload<const TopoDS_Solid &() const>(
                    &solid::value))
      // 类型方法
      .function("type", &solid::type)
      .function("copy", emscripten::optional_override([](const solid &self,
                                                         emscripten::val deep) {
                  bool deepCopy = deep.isUndefined() ? true : deep.as<bool>();
                  return self.copy(deepCopy);
                }));

  // SolidIterator binding
  emscripten::class_<solid_iterator>("SolidIterator")
      .constructor<shape &>()
      .function("reset", &solid_iterator::reset)
      .function("next", &solid_iterator::next);

  // 绑定compound类，继承自shape3d
  emscripten::class_<compound, emscripten::base<shape3d>>("Compound")
      .constructor<>()
      .constructor(emscripten::optional_override(
          [](emscripten::val shpVal, emscripten::val forConstructionVal) {
            TopoDS_Shape shp = shpVal.as<TopoDS_Shape>();
            bool forConstruction = forConstructionVal.isUndefined()
                                       ? false
                                       : forConstructionVal.as<bool>();
            return compound(shp, forConstruction);
          }))
      // 基础创建方法
      .class_function(
          "makeCompound",
          emscripten::optional_override([](emscripten::val shapesVal) {
            std::vector<shape> shapes;
            if (shapesVal.isArray()) {
              const size_t length = shapesVal["length"].as<size_t>();
              for (size_t i = 0; i < length; i++) {
                shapes.push_back(shapesVal[i].as<shape>());
              }
            }
            return compound::make_compound(shapes);
          }))
      // 几何操作方法
      .function("remove", &compound::remove)
      // 值访问和类型方法
      .function("value",
                emscripten::select_overload<const TopoDS_Compound &() const>(
                    &compound::value))
      .function("type", &compound::type)
      .function("copy", emscripten::optional_override([](const compound &self,
                                                         emscripten::val deep) {
                  bool deepCopy = deep.isUndefined() ? true : deep.as<bool>();
                  return self.copy(deepCopy);
                }));

  // 绑定compound_iterator类
  emscripten::class_<compound_iterator>("CompoundIterator")
      .constructor<shape &>()
      .function("reset", &compound_iterator::reset)
      .function("next", &compound_iterator::next);

  // 绑定comp_solid类，继承自solid
  emscripten::class_<comp_solid, emscripten::base<solid>>("CompSolid")
      .constructor<>()
      .constructor(emscripten::optional_override(
          [](emscripten::val shpVal, emscripten::val forConstructionVal) {
            TopoDS_Shape shp = shpVal.as<TopoDS_Shape>();
            bool forConstruction = forConstructionVal.isUndefined()
                                       ? false
                                       : forConstructionVal.as<bool>();
            return comp_solid(shp, forConstruction);
          }))
      // 基础创建方法
      .class_function(
          "makeCompSolid",
          emscripten::optional_override([](emscripten::val shapesVal) {
            std::vector<solid> shapes;
            if (shapesVal.isArray()) {
              const size_t length = shapesVal["length"].as<size_t>();
              for (size_t i = 0; i < length; i++) {
                shapes.push_back(shapesVal[i].as<solid>());
              }
            }
            return comp_solid::make_comp_solid(shapes);
          }))
      // 值访问方法
      .function("value",
                emscripten::select_overload<const TopoDS_CompSolid &() const>(
                    &comp_solid::value))
      // 类型方法
      .function("type", &comp_solid::type)
      .function("copy", emscripten::optional_override([](const comp_solid &self,
                                                         emscripten::val deep) {
                  bool deepCopy = deep.isUndefined() ? true : deep.as<bool>();
                  return self.copy(deepCopy);
                }));

  // 绑定comp_solid_iterator类
  emscripten::class_<comp_solid_iterator>("CompSolidIterator")
      .constructor<shape &>()
      .function("reset", &comp_solid_iterator::reset)
      .function("next", &comp_solid_iterator::next);

  // 绑定mesh类
  emscripten::class_<mesh>("Mesh")
      .smart_ptr<std::shared_ptr<mesh>>("MeshPtr")
      .constructor(emscripten::optional_override([](emscripten::val arg) {
        if (arg.isUndefined() || arg.isNull()) {
          return std::make_shared<mesh>();
        } else if (arg.instanceof(emscripten::val::global("TopoDS_Shape"))) {
          return std::make_shared<mesh>(arg.as<TopoDS_Shape>());
        } else if (arg.instanceof(emscripten::val::global("shape"))) {
          return std::make_shared<mesh>(arg.as<shape>());
        } else if (arg.instanceof(
                       emscripten::val::global("Handle_TDocStd_Document"))) {
          return std::make_shared<mesh>(arg.as<Handle_TDocStd_Document>());
        }
        throw std::runtime_error("Invalid argument type for shape creation");
      }))
      // 形状映射方法
      .function(
          "mapShapes",
          emscripten::select_overload<void(Handle_TopTools_HSequenceOfShape)>(
              &mesh::map_shapes))
      .function(
          "mapShape",
          emscripten::optional_override([](mesh &self, emscripten::val arg) {
            if (arg.instanceof(emscripten::val::global("TopoDS_Shape"))) {
              self.map_shape(arg.as<TopoDS_Shape>());
            } else if (arg.instanceof(emscripten::val::global("shape"))) {
              self.map_shape(arg.as<shape>());
            } else if (arg.isArray()) {
              std::vector<shape> shapes;
              const size_t length = arg["length"].as<size_t>();
              for (size_t i = 0; i < length; i++) {
                shapes.push_back(arg[i].as<shape>());
              }
              self.map_shape(shapes);
            } else {
              throw std::runtime_error("Invalid argument type for mapShape");
            }
          }))
      // 三角化方法
      .function(
          "triangulation",
          emscripten::optional_override([](mesh &self, emscripten::val meshVal,
                                           emscripten::val deflectionVal,
                                           emscripten::val toleranceVal) {
            emscripten_mesh_receiver receiver;
            double deflection =
                deflectionVal.isUndefined() ? 0.01 : deflectionVal.as<double>();
            double tolerance =
                toleranceVal.isUndefined() ? 1.e-6 : toleranceVal.as<double>();
            self.triangulation(receiver, deflection, tolerance);
            return receiver.get_mesh_data();
          }));

  // 绑定基础selector类
  emscripten::class_<selector>("Selector")
      .smart_ptr<selector_ptr>("SelectorPtr")
      .function("filter", &selector::filter);

  // 绑定custom_selector
  emscripten::class_<custom_selector, emscripten::base<selector>>(
      "CustomSelector")
      .constructor(emscripten::optional_override([](emscripten::val jsFunc) {
        auto cppFunc =
            [jsFunc](const std::vector<shape> &shapes) -> std::vector<shape> {
          auto jsShapes = emscripten::val::array();
          for (const auto &s : shapes) {
            jsShapes.call<void>("push", emscripten::val(s));
          }
          auto jsResult = jsFunc(jsShapes);

          std::vector<shape> result;
          if (jsResult.isArray()) {
            const size_t length = jsResult["length"].as<size_t>();
            result.reserve(length);
            for (size_t i = 0; i < length; i++) {
              result.push_back(jsResult[i].as<shape>());
            }
          }

          return result;
        };
        return std::make_shared<custom_selector>(std::move(cppFunc));
      }))
      .smart_ptr<std::shared_ptr<custom_selector>>("CustomSelector");

  // 绑定nearest_to_point_selector
  emscripten::class_<nearest_to_point_selector, emscripten::base<selector>>(
      "NearestToPointSelector")
      .constructor(emscripten::optional_override([](const topo_vector &vec) {
        return std::make_shared<nearest_to_point_selector>(vec);
      }))
      .smart_ptr<std::shared_ptr<nearest_to_point_selector>>(
          "NearestToPointSelector");

  // 绑定box_selector
  emscripten::class_<box_selector, emscripten::base<selector>>("BoxSelector")
      .constructor(emscripten::optional_override([](emscripten::val p0Val,
                                                    emscripten::val p1Val,
                                                    emscripten::val useBBVal) {
        auto p0 = p0Val.as<topo_vector>();
        auto p1 = p1Val.as<topo_vector>();
        bool useBB = useBBVal.isUndefined() ? false : useBBVal.as<bool>();
        return std::make_shared<box_selector>(p0, p1, useBB);
      }))
      .smart_ptr<std::shared_ptr<box_selector>>("BoxSelector");

  // 绑定type_selector
  emscripten::class_<type_selector, emscripten::base<selector>>("TypeSelector")
      .constructor(
          emscripten::optional_override([](const shape_geom_type &type) {
            return std::make_shared<type_selector>(type);
          }))
      .smart_ptr<std::shared_ptr<type_selector>>("TypeSelector");

  // 绑定direction_selector及其派生类
  emscripten::class_<direction_selector, emscripten::base<selector>>(
      "DirectionSelector")
      .smart_ptr<std::shared_ptr<direction_selector>>("DirectionSelector");

  emscripten::class_<parallel_dir_selector,
                     emscripten::base<direction_selector>>(
      "ParallelDirSelector")
      .constructor(emscripten::optional_override(
          [](emscripten::val dirVal, emscripten::val tolVal) {
            auto dir = dirVal.as<topo_vector>();
            double tol = tolVal.isUndefined() ? 1e-4 : tolVal.as<double>();
            return std::make_shared<parallel_dir_selector>(dir, tol);
          }))
      .smart_ptr<std::shared_ptr<parallel_dir_selector>>("ParallelDirSelector");

  emscripten::class_<dir_selector, emscripten::base<direction_selector>>(
      "DirSelector")
      .constructor(emscripten::optional_override(
          [](emscripten::val dirVal, emscripten::val tolVal) {
            auto dir = dirVal.as<topo_vector>();
            double tol = tolVal.isUndefined() ? 1e-4 : tolVal.as<double>();
            return std::make_shared<dir_selector>(dir, tol);
          }))
      .smart_ptr<std::shared_ptr<dir_selector>>("DirSelector");

  emscripten::class_<perpendicular_dir_selector,
                     emscripten::base<direction_selector>>(
      "PerpendicularDirSelector")
      .constructor(emscripten::optional_override(
          [](emscripten::val dirVal, emscripten::val tolVal) {
            auto dir = dirVal.as<topo_vector>();
            double tol = tolVal.isUndefined() ? 1e-4 : tolVal.as<double>();
            return std::make_shared<perpendicular_dir_selector>(dir, tol);
          }))
      .smart_ptr<std::shared_ptr<perpendicular_dir_selector>>(
          "PerpendicularDirSelector");

  // 绑定nth_selector及其派生类
  emscripten::class_<nth_selector, emscripten::base<selector>>("NthSelector")
      .smart_ptr<std::shared_ptr<nth_selector>>("NthSelector");

  emscripten::class_<radius_nth_selector, emscripten::base<nth_selector>>(
      "RadiusNthSelector")
      .constructor(emscripten::optional_override([](emscripten::val nVal,
                                                    emscripten::val dirMaxVal,
                                                    emscripten::val tolVal) {
        int n = nVal.as<int>();
        bool dirMax = dirMaxVal.isUndefined() ? true : dirMaxVal.as<bool>();
        double tol = tolVal.isUndefined() ? 1e-4 : tolVal.as<double>();
        return std::make_shared<radius_nth_selector>(n, dirMax, tol);
      }))
      .smart_ptr<std::shared_ptr<radius_nth_selector>>("RadiusNthSelector");

  emscripten::class_<center_nth_selector, emscripten::base<nth_selector>>(
      "CenterNthSelector")
      .constructor(emscripten::optional_override(
          [](emscripten::val dirVal, emscripten::val nVal,
             emscripten::val dirMaxVal, emscripten::val tolVal) {
            auto dir = dirVal.as<topo_vector>();
            int n = nVal.as<int>();
            bool dirMax = dirMaxVal.isUndefined() ? true : dirMaxVal.as<bool>();
            double tol = tolVal.isUndefined() ? 1e-4 : tolVal.as<double>();
            return std::make_shared<center_nth_selector>(dir, n, dirMax, tol);
          }))
      .smart_ptr<std::shared_ptr<center_nth_selector>>("CenterNthSelector");

  emscripten::class_<direction_minmax_selector,
                     emscripten::base<center_nth_selector>>(
      "DirectionMinmaxSelector")
      .constructor(emscripten::optional_override(
          [](emscripten::val dirVal, emscripten::val nVal,
             emscripten::val dirMaxVal, emscripten::val tolVal) {
            auto dir = dirVal.as<topo_vector>();
            bool dirMax = dirMaxVal.isUndefined() ? true : dirMaxVal.as<bool>();
            double tol = tolVal.isUndefined() ? 1e-4 : tolVal.as<double>();
            return std::make_shared<direction_minmax_selector>(dir, dirMax,
                                                               tol);
          }))
      .smart_ptr<std::shared_ptr<direction_minmax_selector>>(
          "DirectionMinmaxSelector");

  emscripten::class_<direction_nth_selector, emscripten::base<selector>>(
      "DirectionNthSelector")
      .constructor(emscripten::optional_override(
          [](emscripten::val dirVal, emscripten::val nVal,
             emscripten::val dirMaxVal, emscripten::val tolVal) {
            auto dir = dirVal.as<topo_vector>();
            int n = nVal.as<int>();
            bool dirMax = dirMaxVal.isUndefined() ? true : dirMaxVal.as<bool>();
            double tol = tolVal.isUndefined() ? 1e-4 : tolVal.as<double>();
            return std::make_shared<direction_nth_selector>(dir, n, dirMax,
                                                            tol);
          }))
      .smart_ptr<std::shared_ptr<direction_nth_selector>>(
          "DirectionNthSelector");

  emscripten::class_<length_nth_selector, emscripten::base<nth_selector>>(
      "LengthNthSelector")
      .constructor(emscripten::optional_override([](emscripten::val nVal,
                                                    emscripten::val dirMaxVal,
                                                    emscripten::val tolVal) {
        int n = nVal.as<int>();
        bool dirMax = dirMaxVal.isUndefined() ? true : dirMaxVal.as<bool>();
        double tol = tolVal.isUndefined() ? 1e-4 : tolVal.as<double>();
        return std::make_shared<length_nth_selector>(n, dirMax, tol);
      }))
      .smart_ptr<std::shared_ptr<length_nth_selector>>("LengthNthSelector");

  emscripten::class_<area_nth_selector, emscripten::base<nth_selector>>(
      "AreaNthSelector")
      .constructor(emscripten::optional_override([](emscripten::val nVal,
                                                    emscripten::val dirMaxVal,
                                                    emscripten::val tolVal) {
        int n = nVal.as<int>();
        bool dirMax = dirMaxVal.isUndefined() ? true : dirMaxVal.as<bool>();
        double tol = tolVal.isUndefined() ? 1e-4 : tolVal.as<double>();
        return std::make_shared<area_nth_selector>(n, dirMax, tol);
      }))
      .smart_ptr<std::shared_ptr<area_nth_selector>>("AreaNthSelector");

  // 绑定组合选择器
  emscripten::class_<binary_selector, emscripten::base<selector>>(
      "BinarySelector")
      .smart_ptr<std::shared_ptr<binary_selector>>("BinarySelector");

  emscripten::class_<and_selector, emscripten::base<binary_selector>>(
      "AndSelector")
      .constructor(
          emscripten::optional_override([](selector_ptr fi, selector_ptr se) {
            return std::make_shared<and_selector>(fi, se);
          }))
      .smart_ptr<std::shared_ptr<and_selector>>("AndSelector");

  emscripten::class_<or_selector, emscripten::base<binary_selector>>(
      "OrSelector")
      .constructor(
          emscripten::optional_override([](selector_ptr fi, selector_ptr se) {
            return std::make_shared<or_selector>(fi, se);
          }))
      .smart_ptr<std::shared_ptr<or_selector>>("OrSelector");

  emscripten::class_<subtract_selector, emscripten::base<binary_selector>>(
      "SubtractSelector")
      .constructor(
          emscripten::optional_override([](selector_ptr fi, selector_ptr se) {
            return std::make_shared<subtract_selector>(fi, se);
          }))
      .smart_ptr<std::shared_ptr<subtract_selector>>("SubtractSelector");

  emscripten::class_<not_selector, emscripten::base<selector>>("NotSelector")
      .constructor(emscripten::optional_override(
          [](selector_ptr ptr) { return std::make_shared<not_selector>(ptr); }))
      .smart_ptr<std::shared_ptr<not_selector>>("NotSelector");

  // 绑定字符串语法选择器
  emscripten::class_<string_syntax_selector, emscripten::base<selector>>(
      "StringSyntaxSelector")
      .constructor(emscripten::optional_override([](const std::string &str) {
        return std::make_shared<string_syntax_selector>(str);
      }))
      .smart_ptr<std::shared_ptr<string_syntax_selector>>(
          "StringSyntaxSelector");

  // Intersection operations
  enum_<flywave::topo::intersection_direction>("IntersectionDirection")
      .value("None", flywave::topo::intersection_direction::None)
      .value("AlongAxis", flywave::topo::intersection_direction::AlongAxis)
      .value("Opposite", flywave::topo::intersection_direction::Opposite);

  // Sweep operations
  enum_<flywave::topo::transition_mode>("TransitionMode")
      .value("TRANSFORMED", flywave::topo::transition_mode::TRANSFORMED)
      .value("ROUND", flywave::topo::transition_mode::ROUND)
      .value("RIGHT", flywave::topo::transition_mode::RIGHT);

  value_object<flywave::topo::wire_sample_point>("WireSamplePoint")
      .field("position", &flywave::topo::wire_sample_point::position)
      .field("tangent", &flywave::topo::wire_sample_point::tangent)
      .field("edge", &flywave::topo::wire_sample_point::edge);

  value_object<flywave::topo::profile_projection>("ProfileProjection")
      .field("axes", &flywave::topo::profile_projection::axes)
      .field("trsf", &flywave::topo::profile_projection::trsf)
      .field("tangent", &flywave::topo::profile_projection::tangent)
      .field("position", &flywave::topo::profile_projection::position);

  emscripten::class_<shape_ops>("ShapeOps")
      .class_function(
          "fuse",
          emscripten::optional_override(
              [](emscripten::val shapesVal, emscripten::val tolVal,
                 emscripten::val glueVal) -> emscripten::val {
                std::vector<shape> shapes;
                if (shapesVal.isArray()) {
                  const size_t length = shapesVal["length"].as<size_t>();
                  for (size_t i = 0; i < length; i++) {
                    shapes.push_back(shapesVal[i].as<shape>());
                  }
                }
                double tol = tolVal.isUndefined() ? 0.0 : tolVal.as<double>();
                bool glue = glueVal.isUndefined() ? false : glueVal.as<bool>();

                auto result = flywave::topo::fuse(shapes, tol, glue);
                if (result) {
                  return emscripten::val(*result);
                }
                return emscripten::val::undefined();
              }))
      .class_function(
          "cut",
          emscripten::optional_override(
              [](emscripten::val shpVal, emscripten::val toolVal,
                 emscripten::val tolVal,
                 emscripten::val glueVal) -> emscripten::val {
                auto shp = shpVal.as<shape>();
                auto tool = toolVal.as<shape>();
                double tol = tolVal.isUndefined() ? 0.0 : tolVal.as<double>();
                bool glue = glueVal.isUndefined() ? false : glueVal.as<bool>();

                auto result = flywave::topo::cut(shp, tool, tol, glue);
                if (result) {
                  return emscripten::val(*result);
                }
                return emscripten::val::undefined();
              }))
      .class_function(
          "cutMulti",
          emscripten::optional_override(
              [](emscripten::val shpVal, emscripten::val toCutsVal,
                 emscripten::val tolVal,
                 emscripten::val glueVal) -> emscripten::val {
                auto shp = shpVal.as<shape>();
                std::vector<shape> toCuts;
                if (toCutsVal.isArray()) {
                  const size_t length = toCutsVal["length"].as<size_t>();
                  for (size_t i = 0; i < length; i++) {
                    toCuts.push_back(toCutsVal[i].as<shape>());
                  }
                }
                double tol = tolVal.isUndefined() ? 0.0 : tolVal.as<double>();
                bool glue = glueVal.isUndefined() ? false : glueVal.as<bool>();

                auto result = flywave::topo::cut(shp, toCuts, tol, glue);
                if (result) {
                  return emscripten::val(*result);
                }
                return emscripten::val::undefined();
              }))
      .class_function(
          "intersect",
          emscripten::optional_override(
              [](emscripten::val shpVal, emscripten::val toIntersectVal,
                 emscripten::val tolVal,
                 emscripten::val glueVal) -> emscripten::val {
                auto shp = shpVal.as<shape>();
                auto toIntersect = toIntersectVal.as<shape>();
                double tol = tolVal.isUndefined() ? 0.0 : tolVal.as<double>();
                bool glue = glueVal.isUndefined() ? false : glueVal.as<bool>();

                auto result =
                    flywave::topo::intersect(shp, toIntersect, tol, glue);
                if (result) {
                  return emscripten::val(*result);
                }
                return emscripten::val::undefined();
              }))
      .class_function(
          "intersectMulti",
          emscripten::optional_override(
              [](emscripten::val shpVal, emscripten::val toIntersectsVal,
                 emscripten::val tolVal,
                 emscripten::val glueVal) -> emscripten::val {
                auto shp = shpVal.as<shape>();
                std::vector<shape> toIntersects;
                if (toIntersectsVal.isArray()) {
                  const size_t length = toIntersectsVal["length"].as<size_t>();
                  for (size_t i = 0; i < length; i++) {
                    toIntersects.push_back(toIntersectsVal[i].as<shape>());
                  }
                }
                double tol = tolVal.isUndefined() ? 0.0 : tolVal.as<double>();
                bool glue = glueVal.isUndefined() ? false : glueVal.as<bool>();

                auto result =
                    flywave::topo::intersect(shp, toIntersects, tol, glue);
                if (result) {
                  return emscripten::val(*result);
                }
                return emscripten::val::undefined();
              }))
      .class_function(
          "splitMulti",
          emscripten::optional_override(
              [](emscripten::val shpVal, emscripten::val splittersVal,
                 emscripten::val tolVal) -> emscripten::val {
                auto shp = shpVal.as<shape>();
                std::vector<shape> splitters;
                if (splittersVal.isArray()) {
                  const size_t length = splittersVal["length"].as<size_t>();
                  for (size_t i = 0; i < length; i++) {
                    splitters.push_back(splittersVal[i].as<shape>());
                  }
                }
                double tol = tolVal.isUndefined() ? 0.0 : tolVal.as<double>();

                auto result = flywave::topo::split(shp, splitters, tol);
                if (result) {
                  return emscripten::val(*result);
                }
                return emscripten::val::undefined();
              }))
      .class_function(
          "split", emscripten::optional_override(
                       [](emscripten::val shpVal, emscripten::val splitterVal,
                          emscripten::val tolVal) -> emscripten::val {
                         auto shp = shpVal.as<shape>();
                         auto splitter = splitterVal.as<shape>();
                         double tol =
                             tolVal.isUndefined() ? 0.0 : tolVal.as<double>();

                         auto result = flywave::topo::split(shp, splitter, tol);
                         if (result) {
                           return emscripten::val(*result);
                         }
                         return emscripten::val::undefined();
                       }))
      .class_function(
          "facesIntersectedByLine",
          emscripten::optional_override(
              [](emscripten::val shpVal, emscripten::val pointVal,
                 emscripten::val axisVal, emscripten::val toleranceVal,
                 emscripten::val directionVal) {
                auto shp = shpVal.as<shape>();
                auto point = pointVal.as<gp_Pnt>();
                auto axis = axisVal.as<gp_Dir>();
                double tolerance = toleranceVal.isUndefined()
                                       ? 1e-4
                                       : toleranceVal.as<double>();
                auto direction = directionVal.isUndefined()
                                     ? intersection_direction::None
                                     : static_cast<intersection_direction>(
                                           directionVal.as<int>());

                auto faces = flywave::topo::faces_intersected_by_line(
                    shp, point, axis, tolerance, direction);
                emscripten::val result = emscripten::val::array();
                for (auto &face : faces) {
                  result.call<void>("push", emscripten::val(face));
                }
                return result;
              }))
      .class_function(
          "fill",
          emscripten::optional_override(
              [](emscripten::val shpVal,
                 emscripten::val constraintsVal) -> emscripten::val {
                auto shp = shpVal.as<shape>();
                std::vector<shape> constraints;
                if (constraintsVal.isArray()) {
                  const size_t length = constraintsVal["length"].as<size_t>();
                  for (size_t i = 0; i < length; i++) {
                    constraints.push_back(constraintsVal[i].as<shape>());
                  }
                }

                auto result = flywave::topo::fill(shp, constraints);
                if (result) {
                  return emscripten::val(*result);
                }
                return emscripten::val::undefined();
              }))
      .class_function(
          "shelling",
          emscripten::optional_override(
              [](emscripten::val shpVal, emscripten::val faceListVal,
                 emscripten::val thicknessVal, emscripten::val toleranceVal,
                 emscripten::val joinTypeVal) -> emscripten::val {
                auto shp = shpVal.as<shape>();
                std::vector<face> faceList;
                if (faceListVal.isArray()) {
                  const size_t length = faceListVal["length"].as<size_t>();
                  for (size_t i = 0; i < length; i++) {
                    faceList.push_back(faceListVal[i].as<face>());
                  }
                }
                double thickness = thicknessVal.as<double>();
                double tolerance = toleranceVal.isUndefined()
                                       ? 0.0001
                                       : toleranceVal.as<double>();
                auto joinType =
                    joinTypeVal.isUndefined()
                        ? GeomAbs_JoinType::GeomAbs_Arc
                        : static_cast<GeomAbs_JoinType>(joinTypeVal.as<int>());

                auto result = flywave::topo::shelling(shp, faceList, thickness,
                                                      tolerance, joinType);
                if (result) {
                  return emscripten::val(*result);
                }
                return emscripten::val::undefined();
              }))
      .class_function("fillet",
                      emscripten::optional_override(
                          [](emscripten::val shpVal, emscripten::val edgesVal,
                             emscripten::val radiusVal) -> emscripten::val {
                            auto shp = shpVal.as<shape>();
                            std::vector<edge> edges;
                            if (edgesVal.isArray()) {
                              const size_t length =
                                  edgesVal["length"].as<size_t>();
                              for (size_t i = 0; i < length; i++) {
                                edges.push_back(edgesVal[i].as<edge>());
                              }
                            }
                            double radius = radiusVal.as<double>();

                            auto result =
                                flywave::topo::fillet(shp, edges, radius);
                            if (result) {
                              return emscripten::val(*result);
                            }
                            return emscripten::val::undefined();
                          }))
      .class_function(
          "chamfer",
          emscripten::optional_override(
              [](emscripten::val baseShapeVal, emscripten::val edgesVal,
                 emscripten::val distanceVal,
                 emscripten::val distance2Val) -> emscripten::val {
                auto baseShape = baseShapeVal.as<shape>();
                std::vector<edge> edges;
                if (edgesVal.isArray()) {
                  const size_t length = edgesVal["length"].as<size_t>();
                  for (size_t i = 0; i < length; i++) {
                    edges.push_back(edgesVal[i].as<edge>());
                  }
                }
                double distance = distanceVal.as<double>();
                boost::optional<double> distance2 =
                    distance2Val.isUndefined()
                        ? boost::none
                        : boost::optional<double>(distance2Val.as<double>());

                auto result = flywave::topo::chamfer(baseShape, edges, distance,
                                                     distance2);
                if (result) {
                  return emscripten::val(*result);
                }
                return emscripten::val::undefined();
              }))
      .class_function(
          "extrude", emscripten::optional_override(
                         [](emscripten::val shapeVal,
                            emscripten::val directionVal) -> emscripten::val {
                           auto shp = shapeVal.as<shape>();
                           auto direction = directionVal.as<gp_Vec>();

                           auto result = flywave::topo::extrude(shp, direction);
                           if (result) {
                             return emscripten::val(*result);
                           }
                           return emscripten::val::undefined();
                         }))
      .class_function(
          "extrudeLinearWithWire",
          emscripten::optional_override(
              [](emscripten::val outerWireVal, emscripten::val innerWiresVal,
                 emscripten::val vecNormalVal,
                 emscripten::val taperVal) -> emscripten::val {
                auto outerWire = outerWireVal.as<wire>();
                std::vector<wire> innerWires;
                if (innerWiresVal.isArray()) {
                  const size_t length = innerWiresVal["length"].as<size_t>();
                  for (size_t i = 0; i < length; i++) {
                    innerWires.push_back(innerWiresVal[i].as<wire>());
                  }
                }
                auto vecNormal = vecNormalVal.as<gp_Vec>();
                double taper =
                    taperVal.isUndefined() ? 0.0 : taperVal.as<double>();

                auto result = flywave::topo::extrude_linear(
                    outerWire, innerWires, vecNormal, taper);
                if (result) {
                  return emscripten::val(*result);
                }
                return emscripten::val::undefined();
              }))
      .class_function(
          "extrudeLinearWithFace",
          emscripten::optional_override(
              [](emscripten::val faceVal, emscripten::val vecNormalVal,
                 emscripten::val taperVal) -> emscripten::val {
                auto f = faceVal.as<face>();
                auto vecNormal = vecNormalVal.as<gp_Vec>();
                double taper =
                    taperVal.isUndefined() ? 0.0 : taperVal.as<double>();

                auto result =
                    flywave::topo::extrude_linear(f, vecNormal, taper);
                if (result) {
                  return emscripten::val(*result);
                }
                return emscripten::val::undefined();
              }))
      .class_function(
          "extrudeLinearWithRotationWithWire",
          emscripten::optional_override(
              [](emscripten::val outerWireVal, emscripten::val innerWiresVal,
                 emscripten::val centerVal, emscripten::val normalVal,
                 emscripten::val angleDegreesVal) -> emscripten::val {
                auto outerWire = outerWireVal.as<wire>();
                std::vector<wire> innerWires;
                if (innerWiresVal.isArray()) {
                  const size_t length = innerWiresVal["length"].as<size_t>();
                  for (size_t i = 0; i < length; i++) {
                    innerWires.push_back(innerWiresVal[i].as<wire>());
                  }
                }
                auto center = centerVal.as<gp_Pnt>();
                auto normal = normalVal.as<gp_Vec>();
                double angleDegrees = angleDegreesVal.as<double>();

                auto result = flywave::topo::extrude_linear_with_rotation(
                    outerWire, innerWires, center, normal, angleDegrees);
                if (result) {
                  return emscripten::val(*result);
                }
                return emscripten::val::undefined();
              }))
      .class_function(
          "extrudeLinearWithRotationWithFace",
          emscripten::optional_override(
              [](emscripten::val faceVal, emscripten::val centerVal,
                 emscripten::val normalVal,
                 emscripten::val angleDegreesVal) -> emscripten::val {
                auto f = faceVal.as<face>();
                auto center = centerVal.as<gp_Pnt>();
                auto normal = normalVal.as<gp_Vec>();
                double angleDegrees = angleDegreesVal.as<double>();

                auto result = flywave::topo::extrude_linear_with_rotation(
                    f, center, normal, angleDegrees);
                if (result) {
                  return emscripten::val(*result);
                }
                return emscripten::val::undefined();
              }))
      .class_function(
          "revolve",
          emscripten::optional_override(
              [](emscripten::val shapeVal, emscripten::val axisPointVal,
                 emscripten::val axisDirectionVal,
                 emscripten::val angleDegreesVal) -> emscripten::val {
                auto shp = shapeVal.as<shape>();
                auto axisPoint = axisPointVal.as<gp_Pnt>();
                auto axisDirection = axisDirectionVal.as<gp_Dir>();
                double angleDegrees = angleDegreesVal.isUndefined()
                                          ? 360.0
                                          : angleDegreesVal.as<double>();

                auto result = flywave::topo::revolve(
                    shp, axisPoint, axisDirection, angleDegrees);
                if (result) {
                  return emscripten::val(*result);
                }
                return emscripten::val::undefined();
              }))
      .class_function(
          "revolveWithFace",
          emscripten::optional_override(
              [](emscripten::val outerWireVal, emscripten::val innerWiresVal,
                 emscripten::val angleDegreesVal, emscripten::val axisStartVal,
                 emscripten::val axisEndVal) -> emscripten::val {
                auto outerWire = outerWireVal.as<wire>();
                std::vector<wire> innerWires;
                if (innerWiresVal.isArray()) {
                  const size_t length = innerWiresVal["length"].as<size_t>();
                  for (size_t i = 0; i < length; i++) {
                    innerWires.push_back(innerWiresVal[i].as<wire>());
                  }
                }
                double angleDegrees = angleDegreesVal.as<double>();
                auto axisStart = axisStartVal.as<gp_Pnt>();
                auto axisEnd = axisEndVal.as<gp_Pnt>();

                auto result = flywave::topo::revolve(
                    outerWire, innerWires, angleDegrees, axisStart, axisEnd);
                if (result) {
                  return emscripten::val(*result);
                }
                return emscripten::val::undefined();
              }))
      .class_function("revolveWithFace",
                      emscripten::optional_override(
                          [](emscripten::val faceVal, double angleDegrees,
                             emscripten::val axisStartVal,
                             emscripten::val axisEndVal) -> emscripten::val {
                            auto f = faceVal.as<face>();
                            auto axisStart = axisStartVal.as<gp_Pnt>();
                            auto axisEnd = axisEndVal.as<gp_Pnt>();

                            auto result = flywave::topo::revolve(
                                f, angleDegrees, axisStart, axisEnd);
                            if (result) {
                              return emscripten::val(*result);
                            }
                            return emscripten::val::undefined();
                          }))
      .class_function(
          "offset",
          emscripten::optional_override(
              [](emscripten::val shapeVal, emscripten::val offsetVal,
                 emscripten::val capVal, emscripten::val bothVal,
                 emscripten::val tolVal) -> emscripten::val {
                auto shp = shapeVal.as<shape>();
                double offset = offsetVal.as<double>();
                bool cap = capVal.isUndefined() ? true : capVal.as<bool>();
                bool both = bothVal.isUndefined() ? false : bothVal.as<bool>();
                double tol = tolVal.isUndefined() ? 1e-6 : tolVal.as<double>();

                auto result =
                    flywave::topo::offset(shp, offset, cap, both, tol);
                if (result) {
                  return emscripten::val(*result);
                }
                return emscripten::val::undefined();
              }))
      .class_function(
          "sweepWithWire",
          emscripten::optional_override(
              [](emscripten::val outerWireVal, emscripten::val innerWiresVal,
                 emscripten::val pathVal, emscripten::val makeSolidVal,
                 emscripten::val isFrenetVal, emscripten::val modeVal,
                 emscripten::val transitionModeVal) -> emscripten::val {
                auto outerWire = outerWireVal.as<wire>();
                std::vector<wire> innerWires;
                if (innerWiresVal.isArray()) {
                  const size_t length = innerWiresVal["length"].as<size_t>();
                  for (size_t i = 0; i < length; i++) {
                    innerWires.push_back(innerWiresVal[i].as<wire>());
                  }
                }
                auto path = pathVal.as<shape>();
                bool makeSolid =
                    makeSolidVal.isUndefined() ? true : makeSolidVal.as<bool>();
                bool isFrenet =
                    isFrenetVal.isUndefined() ? false : isFrenetVal.as<bool>();

                boost::optional<shape> mode;
                if (!modeVal.isNull()) {
                  mode = modeVal.as<shape>();
                }
                auto transitionMode = transitionModeVal.isUndefined()
                                          ? transition_mode::RIGHT
                                          : static_cast<transition_mode>(
                                                transitionModeVal.as<int>());

                auto result = flywave::topo::sweep(
                    outerWire, innerWires, path, makeSolid, isFrenet,
                    mode.get_ptr(), transitionMode);
                if (result) {
                  return emscripten::val(*result);
                }
                return emscripten::val::undefined();
              }))
      .class_function(
          "sweepWithFace",
          emscripten::optional_override(
              [](emscripten::val faceVal, emscripten::val pathVal,
                 emscripten::val makeSolidVal, emscripten::val isFrenetVal,
                 emscripten::val modeVal,
                 emscripten::val transitionModeVal) -> emscripten::val {
                auto f = faceVal.as<face>();
                auto path = pathVal.as<shape>();
                bool makeSolid =
                    makeSolidVal.isUndefined() ? true : makeSolidVal.as<bool>();
                bool isFrenet =
                    isFrenetVal.isUndefined() ? false : isFrenetVal.as<bool>();

                boost::optional<shape> mode;
                if (!modeVal.isNull()) {
                  mode = modeVal.as<shape>();
                }
                auto transitionMode = transitionModeVal.isUndefined()
                                          ? transition_mode::RIGHT
                                          : static_cast<transition_mode>(
                                                transitionModeVal.as<int>());

                auto result =
                    flywave::topo::sweep(f, path, makeSolid, isFrenet,
                                         mode.get_ptr(), transitionMode);
                if (result) {
                  return emscripten::val(*result);
                }
                return emscripten::val::undefined();
              }))
      .class_function(
          "sweepMulti",
          emscripten::optional_override(
              [](emscripten::val profilesVal, emscripten::val pathVal,
                 emscripten::val makeSolidVal, emscripten::val isFrenetVal,
                 emscripten::val modeVal) -> emscripten::val {
                std::vector<shape> profiles;
                if (profilesVal.isArray()) {
                  const size_t length = profilesVal["length"].as<size_t>();
                  for (size_t i = 0; i < length; i++) {
                    profiles.push_back(profilesVal[i].as<shape>());
                  }
                }
                auto path = pathVal.as<shape>();
                bool makeSolid =
                    makeSolidVal.isUndefined() ? true : makeSolidVal.as<bool>();
                bool isFrenet =
                    isFrenetVal.isUndefined() ? false : isFrenetVal.as<bool>();
                boost::optional<shape> mode;
                if (!modeVal.isNull()) {
                  mode = modeVal.as<shape>();
                }

                auto result = flywave::topo::sweep_multi(
                    profiles, path, makeSolid, isFrenet, mode.get_ptr());
                if (result) {
                  return emscripten::val(*result);
                }
                return emscripten::val::undefined();
              }))
      .class_function(
          "loft",
          emscripten::optional_override(
              [](emscripten::val profilesVal, emscripten::val capVal,
                 emscripten::val ruledVal, emscripten::val continuityVal,
                 emscripten::val parametrizationVal, emscripten::val degreeVal,
                 emscripten::val compatVal, emscripten::val smoothingVal,
                 emscripten::val weightsVal) -> emscripten::val {
                std::vector<shape> profiles;
                if (profilesVal.isArray()) {
                  const size_t length = profilesVal["length"].as<size_t>();
                  for (size_t i = 0; i < length; i++) {
                    profiles.push_back(profilesVal[i].as<shape>());
                  }
                }
                bool cap = capVal.isUndefined() ? false : capVal.as<bool>();
                bool ruled =
                    ruledVal.isUndefined() ? false : ruledVal.as<bool>();
                std::string continuity = continuityVal.isUndefined()
                                             ? "C2"
                                             : continuityVal.as<std::string>();
                std::string parametrization =
                    parametrizationVal.isUndefined()
                        ? "uniform"
                        : parametrizationVal.as<std::string>();
                int degree = degreeVal.isUndefined() ? 3 : degreeVal.as<int>();
                bool compat =
                    compatVal.isUndefined() ? true : compatVal.as<bool>();
                bool smoothing = smoothingVal.isUndefined()
                                     ? false
                                     : smoothingVal.as<bool>();
                std::array<double, 3> weights;
                if (!weightsVal.isUndefined() && weightsVal.isArray()) {
                  const size_t length = weightsVal["length"].as<size_t>();
                  if (length != 3) {
                    throw std::runtime_error(
                        "weights array must have 3 elements");
                  }
                  weights[0] = (weightsVal[0].as<double>());
                  weights[1] = (weightsVal[1].as<double>());
                  weights[2] = (weightsVal[2].as<double>());
                } else {
                  weights = std::array<double, 3>{1.0, 1.0, 1.0};
                }
                auto result = flywave::topo::loft(
                    profiles, cap, ruled, continuity, parametrization, degree,
                    compat, smoothing, weights);
                if (result) {
                  return emscripten::val(*result);
                }
                return emscripten::val::undefined();
              }))
      .class_function(
          "loftWithFaces",
          emscripten::optional_override(
              [](emscripten::val faceProfilesVal,
                 emscripten::val continuityVal) -> emscripten::val {
                std::vector<face> faceProfiles;
                if (faceProfilesVal.isArray()) {
                  const size_t length = faceProfilesVal["length"].as<size_t>();
                  for (size_t i = 0; i < length; i++) {
                    faceProfiles.push_back(faceProfilesVal[i].as<face>());
                  }
                }
                std::string continuity = continuityVal.isUndefined()
                                             ? "C2"
                                             : continuityVal.as<std::string>();

                auto result = flywave::topo::loft(faceProfiles, continuity);
                if (result) {
                  return emscripten::val(*result);
                }
                return emscripten::val::undefined();
              }))
      .class_function(
          "dprism",
          emscripten::optional_override(
              [](emscripten::val shpVal, emscripten::val basisVal,
                 emscripten::val profilesVal, emscripten::val depthVal,
                 emscripten::val taperVal, emscripten::val upToFaceVal,
                 emscripten::val thruAllVal,
                 emscripten::val additiveVal) -> emscripten::val {
                auto shp = shpVal.as<shape>();
                auto basis = basisVal.as<face>();
                std::vector<wire> profiles;
                if (profilesVal.isArray()) {
                  const size_t length = profilesVal["length"].as<size_t>();
                  for (size_t i = 0; i < length; i++) {
                    profiles.push_back(profilesVal[i].as<wire>());
                  }
                }
                boost::optional<double> depth =
                    depthVal.isUndefined()
                        ? boost::none
                        : boost::optional<double>(depthVal.as<double>());
                double taper =
                    taperVal.isUndefined() ? 0.0 : taperVal.as<double>();

                boost::optional<face> upToFace;
                if (!upToFaceVal.isNull()) {
                  upToFace = upToFaceVal.as<face>();
                }

                bool thruAll =
                    thruAllVal.isUndefined() ? true : thruAllVal.as<bool>();
                bool additive =
                    additiveVal.isUndefined() ? true : additiveVal.as<bool>();

                auto result = flywave::topo::dprism(shp, basis, profiles, depth,
                                                    taper, upToFace.get_ptr(),
                                                    thruAll, additive);
                if (result) {
                  return emscripten::val(*result);
                }
                return emscripten::val::undefined();
              }))
      .class_function(
          "dprismWithFaces",
          emscripten::optional_override(
              [](emscripten::val shpVal, emscripten::val basisVal,
                 emscripten::val facesVal, emscripten::val depthVal,
                 emscripten::val taperVal, emscripten::val upToFaceVal,
                 emscripten::val thruAllVal,
                 emscripten::val additiveVal) -> emscripten::val {
                auto shp = shpVal.as<shape>();
                auto basis = basisVal.as<face>();
                std::vector<face> faces;
                if (facesVal.isArray()) {
                  const size_t length = facesVal["length"].as<size_t>();
                  for (size_t i = 0; i < length; i++) {
                    faces.push_back(facesVal[i].as<face>());
                  }
                }
                boost::optional<double> depth =
                    depthVal.isUndefined()
                        ? boost::none
                        : boost::optional<double>(depthVal.as<double>());
                double taper =
                    taperVal.isUndefined() ? 0.0 : taperVal.as<double>();
                boost::optional<face> upToFace;
                if (!upToFaceVal.isNull()) {
                  upToFace = upToFaceVal.as<face>();
                }

                bool thruAll =
                    thruAllVal.isUndefined() ? true : thruAllVal.as<bool>();
                bool additive =
                    additiveVal.isUndefined() ? true : additiveVal.as<bool>();

                auto result = flywave::topo::dprism(shp, basis, faces, depth,
                                                    taper, upToFace.get_ptr(),
                                                    thruAll, additive);
                if (result) {
                  return emscripten::val(*result);
                }
                return emscripten::val::undefined();
              }))
      .class_function(
          "imprint",
          emscripten::optional_override(
              [](emscripten::val shapesVal, emscripten::val tolVal,
                 emscripten::val glueVal) -> emscripten::val {
                std::vector<shape> shapes;
                if (shapesVal.isArray()) {
                  const size_t length = shapesVal["length"].as<size_t>();
                  for (size_t i = 0; i < length; i++) {
                    shapes.push_back(shapesVal[i].as<shape>());
                  }
                }
                double tol = tolVal.isUndefined() ? 0.0 : tolVal.as<double>();
                bool glue = glueVal.isUndefined() ? true : glueVal.as<bool>();

                std::map<std::string, shape> history;
                auto result =
                    flywave::topo::imprint(shapes, tol, glue, &history);

                emscripten::val jsResult = emscripten::val::object();
                if (result) {
                  jsResult.set("result", emscripten::val(*result));
                } else {
                  jsResult.set("result", emscripten::val::undefined());
                }

                emscripten::val jsHistory = emscripten::val::object();
                for (const auto &entry : history) {
                  jsHistory.set(entry.first, emscripten::val(entry.second));
                }
                jsResult.set("history", jsHistory);

                return jsResult;
              }))
      .class_function("clean",
                      emscripten::optional_override(
                          [](emscripten::val shapeVal) -> emscripten::val {
                            auto shp = shapeVal.as<shape>();

                            auto result = flywave::topo::clean(shp);
                            if (result) {
                              return emscripten::val(*result);
                            }
                            return emscripten::val::undefined();
                          }))
      .class_function(
          "check",
          emscripten::optional_override(
              [](emscripten::val shpVal,
                 emscripten::val tolVal) -> emscripten::val {
                auto shp = shpVal.as<shape>();
                double tol = tolVal.isUndefined() ? 0.0 : tolVal.as<double>();

                std::vector<std::pair<std::vector<shape>, BOPAlgo_CheckStatus>>
                    results;
                bool isValid = flywave::topo::check(shp, &results, tol);

                emscripten::val jsResult = emscripten::val::object();
                jsResult.set("isValid", isValid);

                emscripten::val jsErrors = emscripten::val::array();
                for (const auto &error : results) {
                  emscripten::val jsError = emscripten::val::object();

                  emscripten::val jsShapes = emscripten::val::array();
                  for (const auto &shape : error.first) {
                    jsShapes.call<void>("push", emscripten::val(shape));
                  }

                  jsError.set("shapes", jsShapes);
                  jsError.set("status", error.second);
                  jsErrors.call<void>("push", jsError);
                }

                jsResult.set("results", jsErrors);
                return jsResult;
              }))
      .class_function(
          "closest",
          emscripten::optional_override(
              [](emscripten::val shape1Val,
                 emscripten::val shape2Val) -> emscripten::val {
                auto shape1 = shape1Val.as<shape>();
                auto shape2 = shape2Val.as<shape>();

                auto result = flywave::topo::closest(shape1, shape2);

                emscripten::val points = emscripten::val::array();
                points.call<void>("push", emscripten::val(result.first));
                points.call<void>("push", emscripten::val(result.second));
                return points;
              }))
      .class_function("combinedCenter",
                      emscripten::optional_override(
                          [](emscripten::val objectsVal) -> emscripten::val {
                            std::vector<shape> objects;
                            if (objectsVal.isArray()) {
                              const size_t length =
                                  objectsVal["length"].as<size_t>();
                              for (size_t i = 0; i < length; i++) {
                                objects.push_back(objectsVal[i].as<shape>());
                              }
                            }

                            auto result =
                                flywave::topo::combined_center(objects);
                            return emscripten::val(result);
                          }))
      .class_function(
          "combinedCenterOfBoundBox",
          emscripten::optional_override(
              [](emscripten::val objectsVal) -> emscripten::val {
                std::vector<shape> objects;
                if (objectsVal.isArray()) {
                  const size_t length = objectsVal["length"].as<size_t>();
                  for (size_t i = 0; i < length; i++) {
                    objects.push_back(objectsVal[i].as<shape>());
                  }
                }

                auto result =
                    flywave::topo::combined_center_of_bound_box(objects);
                return emscripten::val(result);
              }))
      .class_function("readShapeFromStep",
                      emscripten::optional_override(
                          [](emscripten::val filenameVal) -> emscripten::val {
                            auto filename = filenameVal.as<std::string>();
                            auto result =
                                flywave::topo::read_shape_from_step(filename);
                            return emscripten::val(result);
                          }))
      .class_function(
          "sampleWireAtDistances",
          emscripten::optional_override(
              [](emscripten::val wirePathVal,
                 emscripten::val distancesVal) -> emscripten::val {
                auto wire_path = wirePathVal.as<wire>();

                std::vector<double> distances;
                if (distancesVal.isArray()) {
                  const size_t length = distancesVal["length"].as<size_t>();
                  for (size_t i = 0; i < length; i++) {
                    distances.push_back(distancesVal[i].as<double>());
                  }
                }

                auto result = flywave::topo::sample_wire_at_distances(
                    wire_path, distances);
                emscripten::val points = emscripten::val::array();
                for (const auto &p : result) {
                  points.call<void>("push", emscripten::val(p));
                }
                return points;
              }))
      .class_function("clipWireBetweenDistances",
                      emscripten::optional_override(
                          [](emscripten::val wirePathVal, double startDistance,
                             double endDistance) -> emscripten::val {
                            auto wire_path = wirePathVal.as<wire>();
                            auto result =
                                flywave::topo::clip_wire_between_distances(
                                    wire_path, startDistance, endDistance);
                            return emscripten::val(result);
                          }))
      .class_function(
          "calcProfileProjection",
          emscripten::optional_override(
              [](emscripten::val pathVal, emscripten::val upDirVal,
                 emscripten::val offsetVal) -> emscripten::val {
                auto path = pathVal.as<wire>();
                auto upDir = upDirVal.as<gp_Dir>();
                boost::optional<double> offset =
                    offsetVal.isUndefined()
                        ? boost::none
                        : boost::optional<double>(offsetVal.as<double>());

                auto result =
                    flywave::topo::cacl_profile_projection(path, upDir, offset);

                return emscripten::val(result);
              }))
      .class_function("profileProjectPoint",
                      emscripten::optional_override(
                          [](emscripten::val projVal,
                             emscripten::val pointVal) -> emscripten::val {
                            auto proj =
                                projVal.as<flywave::topo::profile_projection>();
                            auto point = pointVal.as<gp_Pnt>();

                            auto result = flywave::topo::profile_project_point(
                                &proj, point);
                            return emscripten::val(result);
                          }))
      .class_function(
          "wireLength",
          emscripten::optional_override([](emscripten::val pathVal) -> double {
            auto path = pathVal.as<wire>();
            return flywave::topo::wrie_length(path);
          }));
}