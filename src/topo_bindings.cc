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

class emscripten_mesh_receiver : public flywave::topo::mesh_receiver {
public:
  val js_receiver;

  emscripten_mesh_receiver(val receiver) : js_receiver(receiver) {}

  void begin() override { js_receiver.call<void>("begin"); }

  void end() override { js_receiver.call<void>("end"); }

  int append_face(Quantity_Color color) override {
    return js_receiver.call<int>("appendFace", color.Red(), color.Green(),
                                 color.Blue());
  }

  void append_node(int face, gp_Pnt p, gp_Pnt n) override {
    js_receiver.call<void>("appendNodeWithNormal", face, p.X(), p.Y(), p.Z(),
                           n.X(), n.Y(), n.Z());
  }

  void append_node(int face, gp_Pnt p) override {
    js_receiver.call<void>("appendNode", face, p.X(), p.Y(), p.Z());
  }

  void append_node(int face, gp_Pnt p, gp_Pnt n, gp_Pnt2d uv) override {
    js_receiver.call<void>("appendNodeWithNormalAndUV", face, p.X(), p.Y(),
                           p.Z(), n.X(), n.Y(), n.Z(), uv.X(), uv.Y());
  }

  void append_triangle(int face, int tri[3]) override {
    val jsTri = val::array();
    jsTri.call<void>("push", tri[0]);
    jsTri.call<void>("push", tri[1]);
    jsTri.call<void>("push", tri[2]);
    js_receiver.call<void>("appendTriangle", face, jsTri);
  }
};

template <typename OptionalType> struct OptionalAccess {

  static bool is_initialized(const OptionalType &o) {
    return o.is_initialized();
  }

  static val get(const OptionalType &o) {
    if (o.is_initialized()) {
      return val(o.get());
    }
    return val::undefined();
  }

  static void set(OptionalType &o,
                  const typename OptionalType::value_type &value) {
    o = value;
  }
};

template <typename T>
class_<boost::optional<T>> register_optional(const char *name) {
  typedef boost::optional<T> OptionalType;

  return class_<boost::optional<T>>(name)
      .template constructor<>()
      .template constructor<T>()
      .function("is_initialized", &OptionalAccess<OptionalType>::is_initialized)
      .function("get", &OptionalAccess<OptionalType>::get)
      .function("set", &OptionalAccess<OptionalType>::set);
}

EMSCRIPTEN_BINDINGS(Topo) {

  // 注册boost::optional转换器
  emscripten::register_vector<shape>("VectorShape");
  emscripten::register_vector<vertex>("VectorVertex");
  emscripten::register_vector<edge>("VectorEdge");
  emscripten::register_vector<wire>("VectorWire");
  emscripten::register_vector<face>("VectorFace");
  emscripten::register_vector<shell>("VectorShell");
  emscripten::register_vector<solid>("VectorSolid");
  emscripten::register_vector<compound>("VectorCompound");
  emscripten::register_vector<comp_solid>("VectorCompSolid");
  emscripten::register_vector<std::vector<shape>>("VectorVectorShape");

  register_optional<shape>("OptionalShape");
  register_optional<vertex>("OptionalVertex");
  register_optional<edge>("OptionalEdge");
  register_optional<wire>("OptionalWire");
  register_optional<face>("OptionalFace");
  register_optional<shell>("OptionalShell");
  register_optional<solid>("OptionalSolid");
  register_optional<compound>("OptionalCompound");
  register_optional<comp_solid>("OptionalCompSolid");

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
      .function("add", emscripten::select_overload<topo_bbox(
                           const topo_vector &, double) const>(&topo_bbox::add))
      .function("add", emscripten::select_overload<topo_bbox(
                           const topo_bbox &, double) const>(&topo_bbox::add))
      .function("isInside", &topo_bbox::is_inside)
      .function("enlarge", &topo_bbox::enlarge)
      .class_function("findOutsideBox2d", &topo_bbox::find_outside_box2d)
      .class_function("fromShape", &topo_bbox::from_shape)
      .function("getValue", &topo_bbox::get_value);

  class_<topo_location>("Location")
      .constructor<>()
      .constructor<gp_Trsf>()
      .constructor<TopLoc_Location>()
      // 构造函数绑定
      .function("fromPnt", &topo_location::topo_location(const gp_Pnt &))
      .function("fromVec", &topo_location::topo_location(const gp_Vec &))
      .function("fromVecRotation", &topo_location::topo_location(
                                       const gp_Vec &, double, double, double))
      .function("fromPln", &topo_location::topo_location(const gp_Pln &))
      .function("fromPlnPos",
                &topo_location::topo_location(const gp_Pln &, const gp_Pnt &))
      .function("fromVecAxisAngle", &topo_location::topo_location(
                                        const gp_Vec &, const gp_Vec &, double))
      .function("fromTopoVector",
                &topo_location::topo_location(const topo_vector &))
      // 方法绑定
      .function("hashCode", &topo_location::hash_code)
      .function("inverted", &topo_location::inverted)
      .function("dividedBy", &topo_location::operator/)
      .function("multipliedBy", &topo_location::operator*)
      .function("pow", &topo_location::pow)
      .function("toTuple", &topo_location::to_tuple)
      // 转换操作符
      .function("toTopLocLocation",
                &topo_location::operator const TopLoc_Location &)
      .function("toTrsf", &topo_location::operator gp_Trsf)
      // 比较操作符
      .function("equals", &operator==)
      .function("notEquals", &operator!=);

  class_<topo_matrix>("Matrix")
      .constructor<>()
      .constructor<const gp_GTrsf &>()
      .constructor<const gp_Trsf &>()
      .constructor<const std::vector<std::vector<double>> &>()
      // Methods
      .function("rotateX", &topo_matrix::rotate_x)
      .function("rotateY", &topo_matrix::rotate_y)
      .function("rotateZ", &topo_matrix::rotate_z)
      .function("inverse", &topo_matrix::inverse)
      .function("multiply", &topo_matrix::multiply)
      .function("get", &topo_matrix::get)
      .function("transposedList", &topo_matrix::transposed_list)
      .function("toString", &topo_matrix::to_string)
      // Operators
      .function("getValue", emscripten::select_overload<gp_GTrsf &()>(
                                &topo_matrix::get_value))
      // Conversion
      .function("toGTrsf", &topo_matrix::operator gp_GTrsf);

  // Global operator binding
  function("multiplyMatrixVector", &operator* <topo_matrix, topo_vector>);

  class_<topo_plane>("Plane")
      .constructor<>()
      .constructor<const gp_Pln &>()
      .constructor<const topo_vector &, const topo_vector &,
                   const topo_vector &>()
      // Static factory methods
      .class_function("named", &topo_plane::named)
      .class_function("xy", &topo_plane::XY)
      .class_function("yz", &topo_plane::YZ)
      .class_function("zx", &topo_plane::ZX)
      .class_function("xz", &topo_plane::XZ)
      .class_function("yx", &topo_plane::YX)
      .class_function("zy", &topo_plane::ZY)
      .class_function("front", &topo_plane::front)
      .class_function("back", &topo_plane::back)
      .class_function("left", &topo_plane::left)
      .class_function("right", &topo_plane::right)
      .class_function("top", &topo_plane::top)
      .class_function("bottom", &topo_plane::bottom)
      // Properties
      .function("origin", &topo_plane::origin)
      .function("xDir", &topo_plane::x_dir)
      .function("yDir", &topo_plane::y_dir)
      .function("zDir", &topo_plane::z_dir)
      // Methods
      .function(
          "toWorldCoords",
          emscripten::select_overload<topo_vector(const topo_vector &) const>(
              &topo_plane::to_world_coords))
      .function("toWorldCoords",
                emscripten::select_overload<shape(const shape &) const>(
                    &topo_plane::to_world_coords))
      .function(
          "toLocalCoords",
          emscripten::select_overload<topo_vector(const topo_vector &) const>(
              &topo_plane::to_local_coords))
      .function("toLocalCoords",
                emscripten::select_overload<shape(const shape &) const>(
                    &topo_plane::to_local_coords))
      .function("location", &topo_plane::location)
      .function("setOrigin", &topo_plane::set_origin)
      .function("setOrigin2d", &topo_plane::set_origin2d)
      .function("rotated", &topo_plane::rotated)
      .function("mirrorInPlane", &topo_plane::mirror_in_plane)
      // Conversion
      .function("toPln", &topo_plane::operator gp_Pln);

  class_<topo_vector>("Vector")
      .constructor<>()
      .constructor<double, double, double>()
      .constructor<std::array<double, 3>>()
      .constructor<const gp_Vec &>()
      .constructor<const gp_Pnt &>()
      .constructor<const gp_Dir &>()
      .constructor<const gp_XYZ &>()
      // Properties
      .property("x", &topo_vector::x, &topo_vector::set_x)
      .property("y", &topo_vector::y, &topo_vector::set_y)
      .property("z", &topo_vector::z, &topo_vector::set_z)
      // Methods
      .function("length", &topo_vector::length)
      .function("magnitude", &topo_vector::magnitude)
      .function("angle", &topo_vector::angle)
      .function("toTuple", &topo_vector::to_tuple)
      .function("toPnt", &topo_vector::to_pnt)
      .function("toDir", &topo_vector::to_dir)
      .function("toVec", &topo_vector::to_vec)
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
      .function("isEqual", &topo_vector::is_equal)
      .function("toString", &topo_vector::to_string)
      // Operators
      .function("neg", &topo_vector::operator-)
      .function("plus", &topo_vector::operator+)
      .function("minus", &topo_vector::operator-)
      .function("times", &topo_vector::operator*)
      .function("div", &topo_vector::operator/)
      .function("equals", &topo_vector::operator==)
      .function("notEquals", &topo_vector::operator!=)
      // Conversions
      .function("toArray", &topo_vector::operator std::array<double, 3>);

  function("multiplyScalarVector", &operator* <double, topo_vector>);

  class_<emscripten_mesh_receiver>("MeshReceiver").constructor<val>();

  emscripten::class_<geometry_object>("GeometryObject")
      .smart_ptr<std::shared_ptr<geometry_object>>("GeometryObject")
      .function("isNull", &geometry_object::is_null)
      .function("isValid", &geometry_object::is_valid)
      .function("type", &geometry_object::type)
      .function("boundingBox", &geometry_object::bounding_box)
      .function("equals", &geometry_object::equals)
      .function("toBrep", &geometry_object::to_brep)
      .function("getTag", &geometry_object::get_tag)
      .function("setTag", &geometry_object::set_tag);

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
      .constructor<TopoDS_Shape, bool>()
      // 静态方法
      .class_function("makeShape", &shape::make_shape)
      .class_function("importFromBrep", &shape::import_from_brep)
      .class_function("combinedCenter", &shape::combined_center)
      .class_function("combinedCenterOfBoundingBox",
                      &shape::combined_center_of_bounding_box)
      .class_function("filter", &shape::filter)
      // 基础方法
      .function("isNull", &shape::is_null)
      .function("isValid", &shape::is_valid)
      .function("isSolid", &shape::is_solid)
      .function("type", &shape::type)
      .function("bbox", &shape::bbox)
      .function("hashCode", &shape::hash_code)
      .function("equals", &shape::equals)
      .function("isSame", &shape::is_same)
      .function("forConstruction", &shape::for_construction)
      // 属性设置
      .function("setSurfaceColour", &shape::set_surface_colour)
      .function("setCurveColour", &shape::set_curve_colour)
      .function("setLabel", &shape::set_label)
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
      // 属性获取
      .function("surfaceColour", &shape::surface_colour)
      .function("curveColour", &shape::curve_colour)
      .function("label", &shape::label)
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
      .function("transform",
                emscripten::select_overload<int(gp_Trsf)>(&shape::transform))
      .function("transform",
                emscripten::select_overload<int(const topo_matrix &)>(
                    &shape::transform))
      .function("translate", &shape::translate)
      .function("rotate",
                emscripten::select_overload<int(double, gp_Pnt, gp_Pnt)>(
                    &shape::rotate))
      .function("rotate", emscripten::select_overload<int(double, gp_Ax1)>(
                              &shape::rotate))
      .function("rotate",
                emscripten::select_overload<int(gp_Quaternion)>(&shape::rotate))
      .function("scale", &shape::scale)
      .function("mirror", emscripten::select_overload<int(gp_Pnt, gp_Pnt)>(
                              &shape::mirror))
      .function("mirror", emscripten::select_overload<int(gp_Pnt, gp_Vec)>(
                              &shape::mirror))
      .function("mirror",
                emscripten::select_overload<int(gp_Ax1)>(&shape::mirror))
      .function("mirror",
                emscripten::select_overload<int(gp_Ax2)>(&shape::mirror))
      // 几何计算
      .function("centreOfMass", &shape::centre_of_mass)
      .function("centerOfBoundBox", &shape::center_of_bound_box)
      .function("computeMass", &shape::compute_mass)
      .function("computeArea", &shape::compute_area)
      .function("distance", &shape::distance)
      .function("distances", &shape::distances)
      // 非破坏性变换方法
      .function("transformed",
                emscripten::select_overload<shape(gp_Trsf) const>(
                    &shape::transformed))
      .function("transformed",
                emscripten::select_overload<shape(const topo_matrix &) const>(
                    &shape::transformed))
      .function("translated", &shape::translated)
      .function(
          "rotated",
          emscripten::select_overload<shape(double, gp_Pnt, gp_Pnt) const>(
              &shape::rotated))
      .function("rotated",
                emscripten::select_overload<shape(double, gp_Ax1) const>(
                    &shape::rotated))
      .function("rotated",
                emscripten::select_overload<shape(gp_Quaternion) const>(
                    &shape::rotated))
      .function("scaled", &shape::scaled)
      .function("mirrored",
                emscripten::select_overload<shape(gp_Pnt, gp_Pnt) const>(
                    &shape::mirrored))
      .function("mirrored",
                emscripten::select_overload<shape(gp_Pnt, gp_Vec) const>(
                    &shape::mirrored))
      .function("mirrored", emscripten::select_overload<shape(gp_Ax1) const>(
                                &shape::mirrored))
      .function("mirrored", emscripten::select_overload<shape(gp_Ax2) const>(
                                &shape::mirrored))
      // 位置和方向操作
      .function("location", &shape::location)
      .function("setLocation", &shape::set_location)
      .function("located", &shape::located)
      .function("move", emscripten::select_overload<int(const topo_location &)>(
                            &shape::move))
      .function("move",
                emscripten::select_overload<int(double, double, double, double,
                                                double, double)>(&shape::move))
      .function("move",
                emscripten::select_overload<int(const gp_Vec &)>(&shape::move))
      .function("moved",
                emscripten::select_overload<shape(const topo_location &) const>(
                    &shape::moved))
      .function("moved",
                emscripten::select_overload<shape(
                    double, double, double, double, double, double) const>(
                    &shape::moved))
      .function("moved",
                emscripten::select_overload<shape(const gp_Vec &) const>(
                    &shape::moved))
      // 方向操作
      .function("getOrientation", &shape::get_orientation)
      .function("setOrientation", &shape::set_orientation)
      .function("oriented", &shape::oriented)
      // 子元素访问
      .function("children", &shape::children)
      .function("getShapes", &shape::get_shapes)
      .function("vertices",
                emscripten::select_overload<std::vector<vertex>() const>(
                    &shape::vertices))
      .function("edges", emscripten::select_overload<std::vector<edge>() const>(
                             &shape::edges))
      .function("wires", emscripten::select_overload<std::vector<wire>() const>(
                             &shape::wires))
      .function("faces", emscripten::select_overload<std::vector<face>() const>(
                             &shape::faces))
      .function("shells",
                emscripten::select_overload<std::vector<shell>() const>(
                    &shape::shells))
      .function("solids",
                emscripten::select_overload<std::vector<solid>() const>(
                    &shape::solids))
      .function("compounds",
                emscripten::select_overload<std::vector<compound>() const>(
                    &shape::compounds))
      .function("compSolids",
                emscripten::select_overload<std::vector<comp_solid>() const>(
                    &shape::comp_solids))
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
      .function("fixShape", &shape::fix_shape)
      .function("toSplines", &shape::to_splines)
      .function("toNurbs", &shape::to_nurbs)
      .function("toString", &shape::to_string)
      // 操作符重载
      .function("equals", &shape::operator==)
      .function("notEquals", &shape::operator!=)
      .function("lessThan", &shape::operator<)
      // 网格生成方法
      .function("writeTriangulation", &shape::write_triangulation)
      .function("mesh", &shape::mesh)
      // 选择器相关功能
      .function("vertices",
                emscripten::select_overload<shape(selector *) const>(
                    &shape::vertices))
      .function("edges", emscripten::select_overload<shape(selector *) const>(
                             &shape::edges))
      .function("wires", emscripten::select_overload<shape(selector *) const>(
                             &shape::wires))
      .function("faces", emscripten::select_overload<shape(selector *) const>(
                             &shape::faces))
      .function("shells", emscripten::select_overload<shape(selector *) const>(
                              &shape::shells))
      .function("solids", emscripten::select_overload<shape(selector *) const>(
                              &shape::solids))
      // 类型转换
      .function("cast",
                emscripten::select_overload<boost::optional<vertex>() const>(
                    &shape::cast<vertex>))
      .function("cast",
                emscripten::select_overload<boost::optional<edge>() const>(
                    &shape::cast<edge>))
      .function("cast",
                emscripten::select_overload<boost::optional<wire>() const>(
                    &shape::cast<wire>))
      .function("cast",
                emscripten::select_overload<boost::optional<face>() const>(
                    &shape::cast<face>))
      .function("cast",
                emscripten::select_overload<boost::optional<shell>() const>(
                    &shape::cast<shell>))
      .function("cast",
                emscripten::select_overload<boost::optional<solid>() const>(
                    &shape::cast<solid>))
      .function("cast",
                emscripten::select_overload<boost::optional<compound>() const>(
                    &shape::cast<compound>))
      .function(
          "cast",
          emscripten::select_overload<boost::optional<comp_solid>() const>(
              &shape::cast<comp_solid>))
      .function("autoCast", &shape::auto_cast)
      // 其他方法
      .function("copy", &shape::copy)
      .function("shapeType", &shape::shape_type)
      .function("geomType", &shape::geom_type);

  // Vertex class binding
  class_<vertex, base<shape>>("Vertex")
      .smart_ptr<std::shared_ptr<vertex>>("Vertex")
      .constructor<>()
      .constructor<Standard_Real, Standard_Real, Standard_Real>()
      .constructor<const gp_Pnt &>()
      // Static methods
      .class_function("makeVertex",
                      emscripten::select_overload<vertex(const gp_Pnt &)>(
                          &vertex::make_vertex))
      .class_function("makeVertex",
                      emscripten::select_overload<vertex(const gp_Vec &)>(
                          &vertex::make_vertex))
      // Methods
      .function("value",
                emscripten::select_overload<TopoDS_Vertex &()>(&vertex::value))
      .function("value",
                emscripten::select_overload<const TopoDS_Vertex &() const>(
                    &vertex::value))
      .function("toPnt", &vertex::operator const gp_Pnt)
      .function("point", &vertex::point)
      .function("type", &vertex::type)
      .function("copy", &vertex::copy);

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
      .constructor<>()
      .constructor<TopoDS_Shape, bool>()
      // 几何属性方法
      .function("getCurve", &shape1d::get_curve)
      .function("bounds", &shape1d::bounds)
      .function("length", &shape1d::length)
      .function("isClosed", &shape1d::is_closed)
      // 端点访问
      .function("startPoint", &shape1d::start_point)
      .function("endPoint", &shape1d::end_point)
      // 参数化方法
      .function("paramAt", emscripten::select_overload<double(double) const>(
                               &shape1d::param_at))
      .function("paramAt", emscripten::select_overload<double(gp_Pnt) const>(
                               &shape1d::param_at))
      .function("params", &shape1d::params)
      .function("paramsLength", &shape1d::params_length)
      // 几何特征
      .function("tangentAt", &shape1d::tangent_at)
      .function("tangents", &shape1d::tangents)
      .function("normal", &shape1d::normal)
      .function("center", &shape1d::center)
      .function("radius", &shape1d::radius)
      // 位置和采样
      .function("positionAt", &shape1d::position_at)
      .function("positions", &shape1d::positions)
      .function("sampleUniform", &shape1d::sample_uniform)
      // 定位和投影
      .function("locationAt", &shape1d::location_at)
      .function("locations", &shape1d::locations)
      .function("projected", &shape1d::projected)
      // 曲率分析
      .function("curvatureAt", &shape1d::curvature_at)
      .function("curvatures", &shape1d::curvatures);

  // 绑定edge类，继承自shape1d
  emscripten::class_<edge, emscripten::base<shape1d>>("Edge")
      .constructor<>()
      .constructor<TopoDS_Shape, bool>()
      // 静态创建方法 - 基本类型
      .class_function(
          "makeEdge",
          emscripten::select_overload<edge(const vertex &, const vertex &)>(
              &edge::make_edge))
      .class_function(
          "makeEdge",
          emscripten::select_overload<edge(const gp_Pnt &, const gp_Pnt &)>(
              &edge::make_edge))
      // 静态创建方法 - 直线
      .class_function(
          "makeEdge",
          emscripten::select_overload<edge(const gp_Lin &)>(&edge::make_edge))
      .class_function(
          "makeEdge",
          emscripten::select_overload<edge(const gp_Lin &, Standard_Real,
                                           Standard_Real)>(&edge::make_edge))
      .class_function(
          "makeEdge",
          emscripten::select_overload<edge(const gp_Lin &, const gp_Pnt &,
                                           const gp_Pnt &)>(&edge::make_edge))
      .class_function(
          "makeEdge",
          emscripten::select_overload<edge(const gp_Lin &, const vertex &,
                                           const vertex &)>(&edge::make_edge))
      // 静态创建方法 - 圆
      .class_function(
          "makeEdge",
          emscripten::select_overload<edge(const gp_Circ &)>(&edge::make_edge))
      .class_function(
          "makeEdge",
          emscripten::select_overload<edge(const gp_Circ &, Standard_Real,
                                           Standard_Real)>(&edge::make_edge))
      .class_function(
          "makeEdge",
          emscripten::select_overload<edge(const gp_Circ &, const gp_Pnt &,
                                           const gp_Pnt &)>(&edge::make_edge))
      .class_function(
          "makeEdge",
          emscripten::select_overload<edge(const gp_Circ &, const vertex &,
                                           const vertex &)>(&edge::make_edge))
      // 静态创建方法 - 椭圆
      .class_function(
          "makeEdge",
          emscripten::select_overload<edge(const gp_Elips &)>(&edge::make_edge))
      .class_function(
          "makeEdge",
          emscripten::select_overload<edge(const gp_Elips &, Standard_Real,
                                           Standard_Real)>(&edge::make_edge))
      .class_function(
          "makeEdge",
          emscripten::select_overload<edge(const gp_Elips &, const gp_Pnt &,
                                           const gp_Pnt &)>(&edge::make_edge))
      .class_function(
          "makeEdge",
          emscripten::select_overload<edge(const gp_Elips &, const vertex &,
                                           const vertex &)>(&edge::make_edge))
      .class_function(
          "makeEdge",
          emscripten::select_overload<edge(const gp_Hypr &)>(&edge::make_edge))
      .class_function(
          "makeEdge",
          emscripten::select_overload<edge(const gp_Hypr &, Standard_Real,
                                           Standard_Real)>(&edge::make_edge))
      .class_function(
          "makeEdge",
          emscripten::select_overload<edge(const gp_Hypr &, const gp_Pnt &,
                                           const gp_Pnt &)>(&edge::make_edge))
      .class_function(
          "makeEdge",
          emscripten::select_overload<edge(const gp_Hypr &, const vertex &,
                                           const vertex &)>(&edge::make_edge))
      // 抛物线创建方法
      .class_function(
          "makeEdge",
          emscripten::select_overload<edge(const gp_Parab &)>(&edge::make_edge))
      .class_function(
          "makeEdge",
          emscripten::select_overload<edge(const gp_Parab &, Standard_Real,
                                           Standard_Real)>(&edge::make_edge))
      .class_function(
          "makeEdge",
          emscripten::select_overload<edge(const gp_Parab &, const gp_Pnt &,
                                           const gp_Pnt &)>(&edge::make_edge))
      .class_function(
          "makeEdge",
          emscripten::select_overload<edge(const gp_Parab &, const vertex &,
                                           const vertex &)>(&edge::make_edge))
      // 通用曲线创建方法
      .class_function(
          "makeEdge",
          emscripten::select_overload<edge(const Handle(Geom_Curve) &)>(
              &edge::make_edge))
      .class_function(
          "makeEdge",
          emscripten::select_overload<edge(const Handle(Geom_Curve) &,
                                           Standard_Real, Standard_Real)>(
              &edge::make_edge))
      .class_function(
          "makeEdge",
          emscripten::select_overload<edge(const Handle(Geom_Curve) &,
                                           const gp_Pnt &, const gp_Pnt &)>(
              &edge::make_edge))
      .class_function(
          "makeEdge",
          emscripten::select_overload<edge(const Handle(Geom_Curve) &,
                                           const vertex &, const vertex &)>(
              &edge::make_edge))
      .class_function(
          "makeEdge",
          emscripten::select_overload<edge(
              const Handle(Geom_Curve) &, const gp_Pnt &, const gp_Pnt &,
              Standard_Real, Standard_Real)>(&edge::make_edge))
      .class_function(
          "makeEdge",
          emscripten::select_overload<edge(
              const Handle(Geom_Curve) &, const vertex &, const vertex &,
              Standard_Real, Standard_Real)>(&edge::make_edge))
      // 2D曲线创建方法
      .class_function(
          "makeEdge",
          emscripten::select_overload<edge(const Handle(Geom2d_Curve) &,
                                           const Handle(Geom_Surface) &)>(
              &edge::make_edge))
      .class_function(
          "makeEdge",
          emscripten::select_overload<edge(
              const Handle(Geom2d_Curve) &, const Handle(Geom_Surface) &,
              Standard_Real, Standard_Real)>(&edge::make_edge))
      .class_function(
          "makeEdge",
          emscripten::select_overload<edge(
              const Handle(Geom2d_Curve) &, const Handle(Geom_Surface) &,
              const gp_Pnt &, const gp_Pnt &)>(&edge::make_edge))
      .class_function(
          "makeEdge",
          emscripten::select_overload<edge(
              const Handle(Geom2d_Curve) &, const Handle(Geom_Surface) &,
              const vertex &, const vertex &)>(&edge::make_edge))
      .class_function(
          "makeEdge",
          emscripten::select_overload<edge(
              const Handle(Geom2d_Curve) &, const Handle(Geom_Surface) &,
              const gp_Pnt &, const gp_Pnt &, Standard_Real, Standard_Real)>(
              &edge::make_edge))
      .class_function(
          "makeEdge",
          emscripten::select_overload<edge(
              const Handle(Geom2d_Curve) &, const Handle(Geom_Surface) &,
              const vertex &, const vertex &, Standard_Real, Standard_Real)>(
              &edge::make_edge))
      // 值访问
      .function("value",
                emscripten::select_overload<TopoDS_Edge &()>(&edge::value))
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
          "makeEdge2d",
          emscripten::select_overload<edge(const vertex &, const vertex &)>(
              &edge::make_edge2d))
      .class_function(
          "makeEdge2d",
          emscripten::select_overload<edge(const gp_Pnt2d &, const gp_Pnt2d &)>(
              &edge::make_edge2d))
      .class_function("makeEdge2d",
                      emscripten::select_overload<edge(const gp_Lin2d &)>(
                          &edge::make_edge2d))
      .class_function(
          "makeEdge2d",
          emscripten::select_overload<edge(const gp_Lin2d &, Standard_Real,
                                           Standard_Real)>(&edge::make_edge2d))
      .class_function(
          "makeEdge2d",
          emscripten::select_overload<edge(const gp_Lin2d &, const gp_Pnt2d &,
                                           const gp_Pnt2d &)>(
              &edge::make_edge2d))
      .class_function(
          "makeEdge2d",
          emscripten::select_overload<edge(const gp_Lin2d &, const vertex &,
                                           const vertex &)>(&edge::make_edge2d))
      // 圆和椭圆2D
      .class_function("makeEdge2d",
                      emscripten::select_overload<edge(const gp_Circ2d &)>(
                          &edge::make_edge2d))
      .class_function(
          "makeEdge2d",
          emscripten::select_overload<edge(const gp_Circ2d &, Standard_Real,
                                           Standard_Real)>(&edge::make_edge2d))
      .class_function(
          "makeEdge2d",
          emscripten::select_overload<edge(const gp_Circ2d &, const gp_Pnt2d &,
                                           const gp_Pnt2d &)>(
              &edge::make_edge2d))
      .class_function(
          "makeEdge2d",
          emscripten::select_overload<edge(const gp_Circ2d &, const vertex &,
                                           const vertex &)>(&edge::make_edge2d))
      .class_function("makeEdge2d",
                      emscripten::select_overload<edge(const gp_Elips2d &)>(
                          &edge::make_edge2d))
      .class_function(
          "makeEdge2d",
          emscripten::select_overload<edge(const gp_Elips2d &, Standard_Real,
                                           Standard_Real)>(&edge::make_edge2d))
      .class_function(
          "makeEdge2d",
          emscripten::select_overload<edge(const gp_Elips2d &, const gp_Pnt2d &,
                                           const gp_Pnt2d &)>(
              &edge::make_edge2d))
      .class_function(
          "makeEdge2d",
          emscripten::select_overload<edge(const gp_Elips2d &, const vertex &,
                                           const vertex &)>(&edge::make_edge2d))
      // 双曲线和抛物线2D
      .class_function("makeEdge2d",
                      emscripten::select_overload<edge(const gp_Hypr2d &)>(
                          &edge::make_edge2d))
      .class_function(
          "makeEdge2d",
          emscripten::select_overload<edge(const gp_Hypr2d &, Standard_Real,
                                           Standard_Real)>(&edge::make_edge2d))
      .class_function(
          "makeEdge2d",
          emscripten::select_overload<edge(const gp_Hypr2d &, const gp_Pnt2d &,
                                           const gp_Pnt2d &)>(
              &edge::make_edge2d))
      .class_function(
          "makeEdge2d",
          emscripten::select_overload<edge(const gp_Hypr2d &, const vertex &,
                                           const vertex &)>(&edge::make_edge2d))
      .class_function("makeEdge2d",
                      emscripten::select_overload<edge(const gp_Parab2d &)>(
                          &edge::make_edge2d))
      .class_function(
          "makeEdge2d",
          emscripten::select_overload<edge(const gp_Parab2d &, Standard_Real,
                                           Standard_Real)>(&edge::make_edge2d))
      .class_function(
          "makeEdge2d",
          emscripten::select_overload<edge(const gp_Parab2d &, const gp_Pnt2d &,
                                           const gp_Pnt2d &)>(
              &edge::make_edge2d))
      .class_function(
          "makeEdge2d",
          emscripten::select_overload<edge(const gp_Parab2d &, const vertex &,
                                           const vertex &)>(&edge::make_edge2d))
      // 2D曲线创建方法
      .class_function(
          "makeEdge2d",
          emscripten::select_overload<edge(const Handle(Geom2d_Curve) &)>(
              &edge::make_edge2d))
      .class_function(
          "makeEdge2d",
          emscripten::select_overload<edge(const Handle(Geom2d_Curve) &,
                                           Standard_Real, Standard_Real)>(
              &edge::make_edge2d))
      .class_function(
          "makeEdge2d",
          emscripten::select_overload<edge(const Handle(Geom2d_Curve) &,
                                           const gp_Pnt2d &, const gp_Pnt2d &)>(
              &edge::make_edge2d))
      .class_function(
          "makeEdge2d",
          emscripten::select_overload<edge(const Handle(Geom2d_Curve) &,
                                           const vertex &, const vertex &)>(
              &edge::make_edge2d))
      .class_function(
          "makeEdge2d",
          emscripten::select_overload<edge(
              const Handle(Geom2d_Curve) &, const gp_Pnt2d &, const gp_Pnt2d &,
              Standard_Real, Standard_Real)>(&edge::make_edge2d))
      .class_function(
          "makeEdge2d",
          emscripten::select_overload<edge(
              const Handle(Geom2d_Curve) &, const vertex &, const vertex &,
              Standard_Real, Standard_Real)>(&edge::make_edge2d))
      // 多边形创建方法
      .class_function("makePolygon",
                      emscripten::select_overload<edge()>(&edge::make_polygon))
      .class_function(
          "makePolygon",
          emscripten::select_overload<edge(const gp_Pnt &, const gp_Pnt &)>(
              &edge::make_polygon))
      .class_function(
          "makePolygon",
          emscripten::select_overload<edge(const gp_Pnt &, const gp_Pnt &,
                                           const gp_Pnt &, bool)>(
              &edge::make_polygon))
      .class_function("makePolygon",
                      emscripten::select_overload<edge(
                          const gp_Pnt &, const gp_Pnt &, const gp_Pnt &,
                          const gp_Pnt &, bool)>(&edge::make_polygon))
      .class_function(
          "makePolygon",
          emscripten::select_overload<edge(const vertex &, const vertex &)>(
              &edge::make_polygon))
      .class_function(
          "makePolygon",
          emscripten::select_overload<edge(const vertex &, const vertex &,
                                           const vertex &, bool)>(
              &edge::make_polygon))
      .class_function("makePolygon",
                      emscripten::select_overload<edge(
                          const vertex &, const vertex &, const vertex &,
                          const vertex &, bool)>(&edge::make_polygon))
      .class_function(
          "makePolygon",
          emscripten::select_overload<edge(std::vector<vertex *> &, bool)>(
              &edge::make_polygon))
      .class_function(
          "makePolygon",
          emscripten::select_overload<edge(std::initializer_list<vertex *>,
                                           bool)>(&edge::make_polygon))
      .class_function(
          "makePolygon",
          emscripten::select_overload<edge(std::vector<gp_Pnt> &, bool)>(
              &edge::make_polygon))
      .class_function("makePolygon", emscripten::select_overload<edge(
                                         std::initializer_list<gp_Pnt>, bool)>(
                                         &edge::make_polygon))
      .class_function("makeRect", &edge::make_rect)
      // 样条曲线创建方法
      .class_function(
          "makeSpline",
          emscripten::select_overload<edge(const std::vector<gp_Pnt> &, double,
                                           bool)>(&edge::make_spline))
      .class_function(
          "makeSpline",
          emscripten::select_overload<edge(const std::vector<gp_Pnt> &,
                                           const std::pair<gp_Vec, gp_Vec> *,
                                           const std::vector<double> *, double,
                                           bool, bool)>(&edge::make_spline))
      .class_function(
          "makeSpline",
          emscripten::select_overload<
              edge(const std::vector<gp_Pnt> &, const std::vector<gp_Vec> *,
                   bool, const std::vector<double> *, bool, double)>(
              &edge::make_spline))
      .class_function("makeSplineApprox", &edge::make_spline_approx)
      // 圆形创建方法
      .class_function("makeCircle", &edge::make_circle)
      // 椭圆创建方法
      .class_function("makeEllipse", &edge::make_ellipse)
      // 三点圆弧创建方法
      .class_function("makeThreePointArc", &edge::make_three_point_arc)
      // 切线圆弧创建方法
      .class_function("makeTangentArc", &edge::make_tangent_arc)
      // 贝塞尔曲线创建方法
      .class_function("makeBezier", &edge::make_bezier)
      // 几何操作
      .function("close", &edge::close)
      .function("arcCenter", &edge::arc_center)
      .function("trim", &edge::trim)
      // 类型方法
      .function("getGeom", &edge::get_geom)
      .function("type", &edge::type)
      .function("copy", &edge::copy);

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
      .constructor<TopoDS_Shape, bool>()
      // 多边形创建方法
      .class_function("makePolygon",
                      emscripten::select_overload<wire()>(&wire::make_polygon))
      .class_function(
          "makePolygon",
          emscripten::select_overload<wire(const gp_Pnt &, const gp_Pnt &)>(
              &wire::make_polygon))
      .class_function(
          "makePolygon",
          emscripten::select_overload<wire(const gp_Pnt &, const gp_Pnt &,
                                           const gp_Pnt &, bool)>(
              &wire::make_polygon))
      .class_function("makePolygon",
                      emscripten::select_overload<wire(
                          const gp_Pnt &, const gp_Pnt &, const gp_Pnt &,
                          const gp_Pnt &, bool)>(&wire::make_polygon))
      .class_function(
          "makePolygon",
          emscripten::select_overload<wire(const vertex &, const vertex &)>(
              &wire::make_polygon))
      .class_function(
          "makePolygon",
          emscripten::select_overload<wire(const vertex &, const vertex &,
                                           const vertex &, bool)>(
              &wire::make_polygon))
      .class_function("makePolygon",
                      emscripten::select_overload<wire(
                          const vertex &, const vertex &, const vertex &,
                          const vertex &, bool)>(&wire::make_polygon))
      .class_function(
          "makePolygon",
          emscripten::select_overload<wire(const std::vector<gp_Pnt> &, bool,
                                           bool)>(&wire::make_polygon))
      // 基础创建方法
      .class_function(
          "makeWire",
          emscripten::select_overload<wire(const edge &)>(&wire::make_wire))
      .class_function(
          "makeWire",
          emscripten::select_overload<wire(const edge &, const edge &)>(
              &wire::make_wire))
      .class_function(
          "makeWire",
          emscripten::select_overload<wire(const edge &, const edge &,
                                           const edge &)>(&wire::make_wire))
      .class_function(
          "makeWire",
          emscripten::select_overload<wire(const edge &, const edge &,
                                           const edge &, const edge &)>(
              &wire::make_wire))
      .class_function(
          "makeWire",
          emscripten::select_overload<wire(const wire &)>(&wire::make_wire))
      .class_function(
          "makeWire",
          emscripten::select_overload<wire(const wire &, const edge &)>(
              &wire::make_wire))
      .class_function("makeWire",
                      emscripten::select_overload<wire(std::vector<edge> &)>(
                          &wire::make_wire))
      .class_function(
          "makeWire",
          emscripten::select_overload<wire(std::initializer_list<edge>)>(
              &wire::make_wire))
      .class_function("makeWire",
                      emscripten::select_overload<wire(std::vector<wire> &)>(
                          &wire::make_wire))
      .class_function(
          "makeWire",
          emscripten::select_overload<wire(std::initializer_list<wire>)>(
              &wire::make_wire))
      // 几何形状创建方法
      .class_function("makeRect", &wire::make_rect)
      .class_function("makeCircle", &wire::make_circle)
      .class_function("makeEllipse", &wire::make_ellipse)
      .class_function("makeHelix", &wire::make_helix)
      .class_function("combine", &wire::combine)
      .class_function("makeWire", emscripten::select_overload<wire(
                                      const std::vector<std::vector<gp_Pnt>> &,
                                      const std::vector<wire::curve_type> &)>(
                                      &wire::make_wire))
      // 几何操作方法
      .function("stitch", &wire::stitch)
      .function("numEdges", &wire::num_edges)
      .function("vertices", &wire::vertices)
      .function("length", &wire::length)
      .function("convertToCurves3d", &wire::convert_to_curves3d)
      .function("project", &wire::project)
      // 值访问方法
      .function("value",
                emscripten::select_overload<TopoDS_Wire &()>(&wire::value))
      .function("value",
                emscripten::select_overload<const TopoDS_Wire &() const>(
                    &wire::value))
      // 类型方法
      .function("type", &wire::type)
      .function("copy", &wire::copy)
      .function("close", &wire::close)
      // 偏移和倒角操作
      .function("offset", &wire::offset)
      .function("fillet", &wire::fillet)
      .function("chamfer", &wire::chamfer)
      .function("offset2d", &wire::offset2d)
      .function("fillet2d", &wire::fillet2d)
      .function("chamfer2d", &wire::chamfer2d)
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
      .constructor<TopoDS_Shape, bool>()
      // 基础创建方法
      .class_function(
          "makeFace",
          emscripten::select_overload<face(const face &)>(&face::make_face))
      .class_function(
          "makeFace",
          emscripten::select_overload<face(const gp_Pln &)>(&face::make_face))
      .class_function("makeFace",
                      emscripten::select_overload<face(const gp_Cylinder &)>(
                          &face::make_face))
      .class_function(
          "makeFace",
          emscripten::select_overload<face(const gp_Cone &)>(&face::make_face))
      .class_function("makeFace",
                      emscripten::select_overload<face(const gp_Sphere &)>(
                          &face::make_face))
      .class_function(
          "makeFace",
          emscripten::select_overload<face(const gp_Torus &)>(&face::make_face))
      .class_function(
          "makeFace",
          emscripten::select_overload<face(const Handle(Geom_Surface) &,
                                           Standard_Real)>(&face::make_face))
      // 带参数范围的创建方法
      .class_function("makeFace",
                      emscripten::select_overload<face(
                          const gp_Pln &, Standard_Real, Standard_Real,
                          Standard_Real, Standard_Real)>(&face::make_face))
      .class_function("makeFace",
                      emscripten::select_overload<face(
                          const gp_Cylinder &, Standard_Real, Standard_Real,
                          Standard_Real, Standard_Real)>(&face::make_face))
      .class_function("makeFace",
                      emscripten::select_overload<face(
                          const gp_Cone &, Standard_Real, Standard_Real,
                          Standard_Real, Standard_Real)>(&face::make_face))
      .class_function("makeFace",
                      emscripten::select_overload<face(
                          const gp_Sphere &, Standard_Real, Standard_Real,
                          Standard_Real, Standard_Real)>(&face::make_face))
      .class_function("makeFace",
                      emscripten::select_overload<face(
                          const gp_Torus &, Standard_Real, Standard_Real,
                          Standard_Real, Standard_Real)>(&face::make_face))
      .class_function(
          "makeFace",
          emscripten::select_overload<face(
              const Handle(Geom_Surface) &, Standard_Real, Standard_Real,
              Standard_Real, Standard_Real, Standard_Real)>(&face::make_face))
      // 基于wire的创建方法
      .class_function("makeFace",
                      emscripten::select_overload<face(const wire &, bool)>(
                          &face::make_face))
      .class_function(
          "makeFace",
          emscripten::select_overload<face(const gp_Pln &, const wire &, bool)>(
              &face::make_face))
      .class_function("makeFace", emscripten::select_overload<face(
                                      const gp_Cylinder &, const wire &, bool)>(
                                      &face::make_face))
      .class_function("makeFace", emscripten::select_overload<face(
                                      const gp_Cone &, const wire &, bool)>(
                                      &face::make_face))
      .class_function("makeFace", emscripten::select_overload<face(
                                      const gp_Sphere &, const wire &, bool)>(
                                      &face::make_face))
      .class_function("makeFace", emscripten::select_overload<face(
                                      const gp_Torus &, const wire &, bool)>(
                                      &face::make_face))
      .class_function("makeFace",
                      emscripten::select_overload<face(
                          const Handle(Geom_Surface) &, const wire &, bool)>(
                          &face::make_face))
      .class_function(
          "makeFace",
          emscripten::select_overload<face(const face &, const wire &)>(
              &face::make_face))
      .class_function(
          "makeFace",
          emscripten::select_overload<face(const face &, const wire &,
                                           const std::vector<wire> &)>(
              &face::make_face))
      // 基于边和点的创建方法
      .class_function(
          "makeFace",
          emscripten::select_overload<face(const edge &, const edge &)>(
              &face::make_face))
      .class_function(
          "makeFace",
          emscripten::select_overload<face(const wire &, const wire &)>(
              &face::make_face))
      .class_function("makeFace",
                      emscripten::select_overload<face(std::vector<wire> &)>(
                          &face::make_face))
      .class_function(
          "makeFace",
          emscripten::select_overload<face(std::initializer_list<wire>)>(
              &face::make_face))
      .class_function(
          "makeFace",
          emscripten::select_overload<face(
              std::vector<edge> &, std::vector<gp_Pnt>)>(&face::make_face))
      .class_function("makeFace",
                      emscripten::select_overload<face(std::vector<gp_Pnt>)>(
                          &face::make_face))
      .class_function(
          "makeFace",
          emscripten::select_overload<face(std::initializer_list<gp_Pnt>)>(
              &face::make_face))
      .class_function("makeFace", emscripten::select_overload<face(
                                      const wire &, const std::vector<wire> &)>(
                                      &face::make_face))
      .class_function("makeFromWires", &face::make_from_wires)
      // 特殊创建方法
      .class_function(
          "makeFace",
          emscripten::select_overload<face(
              const std::vector<boost::variant<edge, wire>> &,
              const std::vector<boost::variant<edge, wire, gp_Pnt>> &,
              GeomAbs_Shape, int, int, int, bool, double, double, double,
              double, int, int)>(&face::make_face))
      .class_function("makePlane", &face::make_plane)
      .class_function("makeSplineApprox", &face::make_spline_approx)
      // 几何属性方法
      .function("area", &face::area)
      .function("tolerance", &face::tolerance)
      .function("inertia", &face::inertia)
      .function("centreOfMass", &face::centre_of_mass)
      .function("center", &face::center)
      .function("toPlane", &face::to_plane)
      // 参数化方法
      .function("uvBounds", &face::uv_bounds)
      .function("paramAt", &face::param_at)
      .function("params", &face::params)
      .function("positionAt", &face::position_at)
      .function("positions", &face::positions)
      // 法线计算和偏移操作
      .function("normalAt",
                emscripten::select_overload<gp_Vec(const gp_Pnt *) const>(
                    &face::normal_at))
      .function("normalAt",
                emscripten::select_overload<std::pair<gp_Vec, gp_Pnt>(
                    double, double) const>(&face::normal_at))
      .function("normals", &face::normals)
      .function("offset", &face::offset)
      // 几何变换方法
      .function("extrude", &face::extrude)
      .function("revolve", &face::revolve)
      .function("sweep", &face::sweep)
      .function("loft", &face::loft)
      // 布尔运算和2D操作
      .function("boolean", &face::boolean)
      .function("fillet2d", &face::fillet2d)
      .function("chamfer2d", &face::chamfer2d)
      .function("thicken", &face::thicken)
      .function("project", &face::project)
      // 其他操作方法
      .function("toArcs", &face::to_arcs)
      .function("trim", &face::trim)
      .function("isoline", &face::isoline)
      .function("isolines", &face::isolines)
      // 边界访问
      .function("outerWire", &face::outer_wire)
      .function("innerWires", &face::inner_wires)
      // 值访问和类型方法
      .function("value",
                emscripten::select_overload<TopoDS_Face &()>(&face::value))
      .function("value",
                emscripten::select_overload<const TopoDS_Face &() const>(
                    &face::value))
      .function("getGeom", &face::get_geom)
      .function("type", &face::type)
      .function("copy", &face::copy);

  // Bind Shell class
  emscripten::class_<shell, emscripten::base<shape>>("Shell")
      .constructor<>()
      .constructor<TopoDS_Shape, bool>()
      // Surface creation methods
      .class_function("makeShell", emscripten::select_overload<shell(
                                       const Handle(Geom_Surface) &, bool)>(
                                       &shell::make_shell))
      .class_function(
          "makeShell",
          emscripten::select_overload<shell(
              const Handle(Geom_Surface) &, Standard_Real, Standard_Real,
              Standard_Real, Standard_Real, bool)>(&shell::make_shell))
      // Box creation methods
      .class_function("makeShellFromBox",
                      emscripten::select_overload<shell(
                          Standard_Real, Standard_Real, Standard_Real)>(
                          &shell::make_shell_from_box))
      .class_function(
          "makeShellFromBox",
          emscripten::select_overload<shell(const gp_Pnt &, Standard_Real,
                                            Standard_Real, Standard_Real)>(
              &shell::make_shell_from_box))
      .class_function(
          "makeShellFromBox",
          emscripten::select_overload<shell(const gp_Pnt &, const gp_Pnt &)>(
              &shell::make_shell_from_box))
      .class_function(
          "makeShellFromBox",
          emscripten::select_overload<shell(const gp_Ax2 &, Standard_Real,
                                            Standard_Real, Standard_Real)>(
              &shell::make_shell_from_box))
      // Cylinder creation methods
      .class_function(
          "makeShellFromCylinder",
          emscripten::select_overload<shell(Standard_Real, Standard_Real)>(
              &shell::make_shell_from_cylinder))
      .class_function("makeShellFromCylinder",
                      emscripten::select_overload<shell(
                          Standard_Real, Standard_Real, Standard_Real)>(
                          &shell::make_shell_from_cylinder))
      .class_function("makeShellFromCylinder",
                      emscripten::select_overload<shell(
                          const gp_Ax2 &, Standard_Real, Standard_Real)>(
                          &shell::make_shell_from_cylinder))
      .class_function(
          "makeShellFromCylinder",
          emscripten::select_overload<shell(const gp_Ax2 &, Standard_Real,
                                            Standard_Real, Standard_Real)>(
              &shell::make_shell_from_cylinder))
      // Cone creation methods
      .class_function("makeShellFromCone",
                      emscripten::select_overload<shell(
                          Standard_Real, Standard_Real, Standard_Real)>(
                          &shell::make_shell_from_cone))
      .class_function(
          "makeShellFromCone",
          emscripten::select_overload<shell(Standard_Real, Standard_Real,
                                            Standard_Real, Standard_Real)>(
              &shell::make_shell_from_cone))
      .class_function(
          "makeShellFromCone",
          emscripten::select_overload<shell(const gp_Ax2 &, Standard_Real,
                                            Standard_Real, Standard_Real)>(
              &shell::make_shell_from_cone))
      .class_function(
          "makeShellFromCone",
          emscripten::select_overload<shell(
              const gp_Ax2 &, Standard_Real, Standard_Real, Standard_Real,
              Standard_Real)>(&shell::make_shell_from_cone))
      // Revolution creation methods
      .class_function(
          "makeShellFromRevolution",
          emscripten::select_overload<shell(const Handle(Geom_Curve) &)>(
              &shell::make_shell_from_revolution))
      .class_function("makeShellFromRevolution",
                      emscripten::select_overload<shell(
                          const Handle(Geom_Curve) &, Standard_Real)>(
                          &shell::make_shell_from_revolution))
      .class_function(
          "makeShellFromRevolution",
          emscripten::select_overload<shell(const Handle(Geom_Curve) &,
                                            Standard_Real, Standard_Real)>(
              &shell::make_shell_from_revolution))
      .class_function(
          "makeShellFromRevolution",
          emscripten::select_overload<shell(
              const Handle(Geom_Curve) &, Standard_Real, Standard_Real,
              Standard_Real)>(&shell::make_shell_from_revolution))
      .class_function("makeShellFromRevolution",
                      emscripten::select_overload<shell(
                          const gp_Ax2 &, const Handle(Geom_Curve) &)>(
                          &shell::make_shell_from_revolution))
      .class_function(
          "makeShellFromRevolution",
          emscripten::select_overload<shell(
              const gp_Ax2 &, const Handle(Geom_Curve) &, Standard_Real)>(
              &shell::make_shell_from_revolution))
      .class_function(
          "makeShellFromRevolution",
          emscripten::select_overload<shell(
              const gp_Ax2 &, const Handle(Geom_Curve) &, Standard_Real,
              Standard_Real)>(&shell::make_shell_from_revolution))
      .class_function("makeShellFromRevolution",
                      emscripten::select_overload<shell(
                          const gp_Ax2 &, const Handle(Geom_Curve) &,
                          Standard_Real, Standard_Real, Standard_Real)>(
                          &shell::make_shell_from_revolution))
      // Sphere creation methods
      .class_function("makeShellFromSphere",
                      emscripten::select_overload<shell(Standard_Real)>(
                          &shell::make_shell_from_sphere))
      .class_function(
          "makeShellFromSphere",
          emscripten::select_overload<shell(Standard_Real, Standard_Real)>(
              &shell::make_shell_from_sphere))
      .class_function("makeShellFromSphere",
                      emscripten::select_overload<shell(
                          Standard_Real, Standard_Real, Standard_Real)>(
                          &shell::make_shell_from_sphere))
      .class_function(
          "makeShellFromSphere",
          emscripten::select_overload<shell(Standard_Real, Standard_Real,
                                            Standard_Real, Standard_Real)>(
              &shell::make_shell_from_sphere))
      .class_function(
          "makeShellFromSphere",
          emscripten::select_overload<shell(const gp_Pnt &, Standard_Real)>(
              &shell::make_shell_from_sphere))
      .class_function("makeShellFromSphere",
                      emscripten::select_overload<shell(
                          const gp_Pnt &, Standard_Real, Standard_Real)>(
                          &shell::make_shell_from_sphere))
      .class_function(
          "makeShellFromSphere",
          emscripten::select_overload<shell(const gp_Pnt &, Standard_Real,
                                            Standard_Real, Standard_Real)>(
              &shell::make_shell_from_sphere))
      .class_function(
          "makeShellFromSphere",
          emscripten::select_overload<shell(
              const gp_Pnt &, Standard_Real, Standard_Real, Standard_Real,
              Standard_Real)>(&shell::make_shell_from_sphere))
      .class_function(
          "makeShellFromSphere",
          emscripten::select_overload<shell(const gp_Ax2 &, Standard_Real)>(
              &shell::make_shell_from_sphere))
      .class_function("makeShellFromSphere",
                      emscripten::select_overload<shell(
                          const gp_Ax2 &, Standard_Real, Standard_Real)>(
                          &shell::make_shell_from_sphere))
      .class_function(
          "makeShellFromSphere",
          emscripten::select_overload<shell(const gp_Ax2 &, Standard_Real,
                                            Standard_Real, Standard_Real)>(
              &shell::make_shell_from_sphere))
      .class_function(
          "makeShellFromSphere",
          emscripten::select_overload<shell(
              const gp_Ax2 &, Standard_Real, Standard_Real, Standard_Real,
              Standard_Real)>(&shell::make_shell_from_sphere))
      // Torus creation methods
      .class_function(
          "makeShellFromTorus",
          emscripten::select_overload<shell(Standard_Real, Standard_Real)>(
              &shell::make_shell_from_torus))
      .class_function("makeShellFromTorus",
                      emscripten::select_overload<shell(
                          Standard_Real, Standard_Real, Standard_Real)>(
                          &shell::make_shell_from_torus))
      .class_function(
          "makeShellFromTorus",
          emscripten::select_overload<shell(Standard_Real, Standard_Real,
                                            Standard_Real, Standard_Real)>(
              &shell::make_shell_from_torus))
      .class_function("makeShellFromTorus",
                      emscripten::select_overload<shell(
                          Standard_Real, Standard_Real, Standard_Real,
                          Standard_Real, Standard_Real)>(
                          &shell::make_shell_from_torus))
      .class_function("makeShellFromTorus",
                      emscripten::select_overload<shell(
                          const gp_Ax2 &, Standard_Real, Standard_Real)>(
                          &shell::make_shell_from_torus))
      .class_function(
          "makeShellFromTorus",
          emscripten::select_overload<shell(const gp_Ax2 &, Standard_Real,
                                            Standard_Real, Standard_Real)>(
              &shell::make_shell_from_torus))
      .class_function(
          "makeShellFromTorus",
          emscripten::select_overload<shell(
              const gp_Ax2 &, Standard_Real, Standard_Real, Standard_Real,
              Standard_Real)>(&shell::make_shell_from_torus))
      .class_function(
          "makeShellFromTorus",
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
          "makeShellFromWedge",
          emscripten::select_overload<shell(
              const gp_Ax2 &, Standard_Real, Standard_Real, Standard_Real,
              Standard_Real)>(&shell::make_shell_from_wedge))
      .class_function(
          "makeShellFromWedge",
          emscripten::select_overload<
              shell(Standard_Real, Standard_Real, Standard_Real, Standard_Real,
                    Standard_Real, Standard_Real, Standard_Real)>(
              &shell::make_shell_from_wedge))
      .class_function(
          "makeShellFromWedge",
          emscripten::select_overload<shell(
              const gp_Ax2 &, Standard_Real, Standard_Real, Standard_Real,
              Standard_Real, Standard_Real, Standard_Real, Standard_Real)>(
              &shell::make_shell_from_wedge))
      // Other methods
      .function("sweep", &shell::sweep)
      .function("value", &shell::value)
      .function("type", &shell::type)
      .function("copy", &shell::copy);

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
      .constructor<TopoDS_Shape, bool>()
      .constructor<const shape &, TopoDS_Shape>()
      // 几何判断方法
      .function("isInside", &shape3d::is_inside);

  emscripten::class_<solid::SweepMode>("SweepMode")
      .constructor<>()
      .constructor<gp_Vec>()
      .constructor<TopoDS_Wire>()
      .constructor<TopoDS_Edge>()
      .function("isVector", &solid::SweepMode::is<gp_Vec>)
      .function("isWire", &solid::SweepMode::is<TopoDS_Wire>)
      .function("isEdge", &solid::SweepMode::is<TopoDS_Edge>)
      .function("getVector",
                emscripten::select_overload<const gp_Vec &() const>(
                    &solid::SweepMode::get<gp_Vec>))
      .function("getWire",
                emscripten::select_overload<const TopoDS_Wire &() const>(
                    &solid::SweepMode::get<TopoDS_Wire>))
      .function("getEdge",
                emscripten::select_overload<const TopoDS_Edge &() const>(
                    &solid::SweepMode::get<TopoDS_Edge>));

  // 绑定solid类，继承自shape3d
  emscripten::class_<solid, emscripten::base<shape3d>>("Solid")
      .constructor<>()
      .constructor<TopoDS_Shape, bool>()
      .constructor<const shape &, TopoDS_Shape>()
      // 基础创建方法
      .class_function("makeSolid",
                      emscripten::select_overload<solid(const comp_solid &)>(
                          &solid::make_solid))
      .class_function(
          "makeSolid",
          emscripten::select_overload<solid(const shell &)>(&solid::make_solid))
      .class_function(
          "makeSolid",
          emscripten::select_overload<solid(const shell &, const shell &)>(
              &solid::make_solid))
      .class_function(
          "makeSolid",
          emscripten::select_overload<solid(const shell &, const shell &,
                                            const shell &)>(&solid::make_solid))
      .class_function("makeSolid",
                      emscripten::select_overload<solid(std::vector<shell> &)>(
                          &solid::make_solid))
      .class_function(
          "makeSolid",
          emscripten::select_overload<solid(std::initializer_list<shell>)>(
              &solid::make_solid))
      .class_function(
          "makeSolid",
          emscripten::select_overload<solid(const solid &)>(&solid::make_solid))
      .class_function(
          "makeSolid",
          emscripten::select_overload<solid(const solid &, const shell &)>(
              &solid::make_solid))
      .class_function(
          "makeSolid",
          emscripten::select_overload<solid(std::vector<face> &, double)>(
              &solid::make_solid))
      .class_function("makeSolid", emscripten::select_overload<solid(
                                       std::initializer_list<face>, double)>(
                                       &solid::make_solid))
      // 基本几何体创建方法 - 盒子
      .class_function(
          "makeSolidFromBox",
          emscripten::select_overload<solid(
              const Standard_Real, const Standard_Real, const Standard_Real)>(
              &solid::make_solid_from_box))
      .class_function(
          "makeSolidFromBox",
          emscripten::select_overload<solid(
              const gp_Pnt &, const Standard_Real, const Standard_Real,
              const Standard_Real)>(&solid::make_solid_from_box))
      .class_function(
          "makeSolidFromBox",
          emscripten::select_overload<solid(const gp_Pnt &, const gp_Pnt &)>(
              &solid::make_solid_from_box))
      .class_function(
          "makeSolidFromBox",
          emscripten::select_overload<solid(
              const gp_Ax2 &, const Standard_Real, const Standard_Real,
              const Standard_Real)>(&solid::make_solid_from_box))
      // 基本几何体创建方法 - 圆柱
      .class_function(
          "makeSolidFromCylinder",
          emscripten::select_overload<solid(
              const Standard_Real, const Standard_Real, const Standard_Real)>(
              &solid::make_solid_from_cylinder))
      .class_function(
          "makeSolidFromCylinder",
          emscripten::select_overload<solid(const gp_Ax2 &, const Standard_Real,
                                            const Standard_Real)>(
              &solid::make_solid_from_cylinder))
      .class_function(
          "makeSolidFromCylinder",
          emscripten::select_overload<solid(
              const gp_Ax2 &, const Standard_Real, const Standard_Real,
              const Standard_Real)>(&solid::make_solid_from_cylinder))
      .class_function(
          "makeSolidFromCylinder",
          emscripten::select_overload<solid(
              Standard_Real, Standard_Real, const gp_Pnt &, const gp_Dir &,
              double)>(&solid::make_solid_from_cylinder))
      // 基本几何体创建方法 - 圆锥
      .class_function("makeSolidFromCone",
                      emscripten::select_overload<solid(
                          Standard_Real, Standard_Real, Standard_Real,
                          const gp_Pnt &, const gp_Dir &, double)>(
                          &solid::make_solid_from_cone))
      .class_function(
          "makeSolidFromCone",
          emscripten::select_overload<solid(
              const Standard_Real, const Standard_Real, const Standard_Real,
              const Standard_Real)>(&solid::make_solid_from_cone))
      .class_function(
          "makeSolidFromCone",
          emscripten::select_overload<solid(
              const gp_Ax2 &, const Standard_Real, const Standard_Real,
              const Standard_Real)>(&solid::make_solid_from_cone))
      .class_function(
          "makeSolidFromCone",
          emscripten::select_overload<solid(
              const gp_Ax2 &, const Standard_Real, const Standard_Real,
              const Standard_Real, const Standard_Real)>(
              &solid::make_solid_from_cone))
      // 旋转体创建方法
      .class_function(
          "makeSolidFromRevolution",
          emscripten::select_overload<solid(const Handle(Geom_Curve) &)>(
              &solid::make_solid_from_revolution))
      .class_function("makeSolidFromRevolution",
                      emscripten::select_overload<solid(
                          const Handle(Geom_Curve) &, const Standard_Real)>(
                          &solid::make_solid_from_revolution))
      .class_function(
          "makeSolidFromRevolution",
          emscripten::select_overload<solid(
              const Handle(Geom_Curve) &, const Standard_Real,
              const Standard_Real)>(&solid::make_solid_from_revolution))
      .class_function("makeSolidFromRevolution",
                      emscripten::select_overload<solid(
                          const Handle(Geom_Curve) &, const Standard_Real,
                          const Standard_Real, const Standard_Real)>(
                          &solid::make_solid_from_revolution))
      .class_function("makeSolidFromRevolution",
                      emscripten::select_overload<solid(
                          const gp_Ax2 &, const Handle(Geom_Curve) &)>(
                          &solid::make_solid_from_revolution))
      .class_function(
          "makeSolidFromRevolution",
          emscripten::select_overload<solid(
              const gp_Ax2 &, const Handle(Geom_Curve) &, const Standard_Real)>(
              &solid::make_solid_from_revolution))
      .class_function(
          "makeSolidFromRevolution",
          emscripten::select_overload<solid(
              const gp_Ax2 &, const Handle(Geom_Curve) &, const Standard_Real,
              const Standard_Real)>(&solid::make_solid_from_revolution))
      .class_function(
          "makeSolidFromRevolution",
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
              const Standard_Real, const Standard_Real, const Standard_Real,
              const Standard_Real)>(&solid::make_solid_from_wedge))
      .class_function(
          "makeSolidFromLoft",
          emscripten::select_overload<solid(const std::vector<wire> &, bool)>(
              &solid::make_solid_from_loft))
      // 外壳访问方法
      .function("outerShell", &solid::outer_shell)
      .function("innerShells", &solid::inner_shells)
      // 几何操作方法
      .function("extrudeWithRotation",
                emscripten::select_overload<int(
                    const wire &, const std::vector<wire> &, const gp_Pnt &,
                    const gp_Vec &, double)>(&solid::extrude_with_rotation))
      .function("extrudeWithRotation",
                emscripten::select_overload<int(const face &, const gp_Pnt &,
                                                const gp_Vec &, double)>(
                    &solid::extrude_with_rotation))
      .function(
          "extrude",
          emscripten::select_overload<int(
              const wire &, const std::vector<wire> &, const gp_Vec &, double)>(
              &solid::extrude))
      .function("extrude",
                emscripten::select_overload<int(const face &, gp_Pnt, gp_Pnt)>(
                    &solid::extrude))
      .function("extrude",
                emscripten::select_overload<int(const face &, gp_Vec, double)>(
                    &solid::extrude))
      .function("revolve",
                emscripten::select_overload<int(const face &, gp_Pnt, gp_Pnt,
                                                double)>(&solid::revolve))
      .function("revolve",
                emscripten::select_overload<int(
                    const wire &, const std::vector<wire> &, double,
                    const gp_Pnt &, const gp_Pnt &)>(&solid::revolve))
      .function(
          "revolve",
          emscripten::select_overload<int(const face &, double, const gp_Pnt &,
                                          const gp_Pnt &)>(&solid::revolve))
      .function("loft", &solid::loft)
      .function("pipe", &solid::pipe)
      .function("sweep",
                emscripten::select_overload<int(
                    const wire &, std::vector<solid::sweep_profile> &, int)>(
                    &solid::sweep))
      .function("sweep",
                emscripten::select_overload<int(
                    const wire &, std::vector<shape> &, int)>(&solid::sweep))
      .function(
          "sweep",
          emscripten::select_overload<int(
              const wire &, const std::vector<wire> &, const TopoDS_Shape &,
              bool, bool, const boost::optional<solid::SweepMode> &,
              const std::string &)>(&solid::sweep))
      .function(
          "sweep",
          emscripten::select_overload<int(
              const face &, const TopoDS_Shape &, bool, bool,
              const boost::optional<solid::SweepMode> &, const std::string &)>(
              &solid::sweep))
      .class_function(
          "sweepMulti",
          emscripten::select_overload<int(
              const std::vector<boost::variant<wire, face>> &,
              const TopoDS_Shape &, bool, bool,
              const boost::optional<SweepMode> &)>(&solid::sweep_multi))
      // 布尔运算和特征操作
      .function("split", &solid::split)
      .function("fillet", &solid::fillet)
      .function("chamfer", &solid::chamfer)
      .function("shelling", &solid::shelling)
      .function("offset", &solid::offset)
      .function("draft", &solid::draft)
      .function("evolved",
                emscripten::select_overload<int(const face &, const wire &)>(
                    &solid::evolved))
      .function("evolved",
                emscripten::select_overload<int(const wire &, const wire &)>(
                    &solid::evolved))
      // 特征操作
      .function(
          "featPrism",
          emscripten::select_overload<int(const face &, gp_Dir, double, bool)>(
              &solid::feat_prism))
      .function("featPrism",
                emscripten::select_overload<int(
                    const face &, gp_Dir, const face &, const face &, bool)>(
                    &solid::feat_prism))
      .function("featPrism", emscripten::select_overload<int(
                                 const face &, gp_Dir, const face &, bool)>(
                                 &solid::feat_prism))
      .function(
          "featDraftPrism",
          emscripten::select_overload<int(const face &, double, double, bool)>(
              &solid::feat_draft_prism))
      .function("featDraftPrism",
                emscripten::select_overload<int(
                    const face &, double, const face &, const face &, bool)>(
                    &solid::feat_draft_prism))
      .function(
          "featDraftPrism",
          emscripten::select_overload<int(const face &, double, const face &,
                                          bool)>(&solid::feat_draft_prism))
      .function(
          "featRevol",
          emscripten::select_overload<int(const face &, const gp_Ax1 &,
                                          const face &, const face &, bool)>(
              &solid::feat_revol))
      .function("featRevol",
                emscripten::select_overload<int(const face &, const gp_Ax1 &,
                                                const face &, bool)>(
                    &solid::feat_revol))
      .function(
          "featPipe",
          emscripten::select_overload<int(const face &, const wire &,
                                          const face &, const face &, bool)>(
              &solid::feat_pipe))
      .function("featPipe",
                emscripten::select_overload<int(const face &, const wire &,
                                                const face &, bool)>(
                    &solid::feat_pipe))
      // 线性形式和旋转形式
      .function("linearForm", &solid::linear_form)
      .function("revolutionForm", &solid::revolution_form)
      // 布尔运算方法
      .function("boolean", &solid::boolean)
      .function("union", &solid::boolean_union)
      .function("subtract", &solid::boolean_subtract)
      .function("intersect", &solid::boolean_intersect)
      // 几何属性方法
      .function("area", &solid::area)
      .function("volume", &solid::volume)
      .function("inertia", &solid::inertia)
      .function("centerOfMass", &solid::center_of_mass)
      .function("boundingBox", &solid::bounding_box)
      .function("section", &solid::section)
      .function("convertToNurbs", &solid::convert_to_nurbs)
      // 值访问方法
      .function("value",
                emscripten::select_overload<TopoDS_Solid &()>(&solid::value))
      // 类型方法
      .function("type", &solid::type)
      .function("copy", &solid::copy);

  // SolidIterator binding
  emscripten::class_<solid_iterator>("SolidIterator")
      .constructor<shape &>()
      .function("reset", &solid_iterator::reset)
      .function("next", &solid_iterator::next);

  // 绑定compound类，继承自shape3d
  emscripten::class_<compound, emscripten::base<shape3d>>("Compound")
      .constructor<>()
      .constructor<TopoDS_Shape, bool>()
      .constructor<const shape &, TopoDS_Shape>()
      // 基础创建方法
      .class_function(
          "makeCompound",
          emscripten::select_overload<compound(const std::vector<shape> &)>(
              &compound::make_compound))
      .class_function(
          "makeCompound",
          emscripten::select_overload<compound(std::initializer_list<shape> &)>(
              &compound::make_compound))
      // 布尔运算方法
      .function("cut", &compound::cut)
      .function("fuse", &compound::fuse)
      .function("intersect", &compound::intersect)
      // 几何操作方法
      .function("remove", &compound::remove)
      .function("ancestors", &compound::ancestors)
      .function("siblings", &compound::siblings)
      // 值访问和类型方法
      .function("value", emscripten::select_overload<TopoDS_Compound &()>(
                             &compound::value))
      .function("value",
                emscripten::select_overload<const TopoDS_Compound &() const>(
                    &compound::value))
      .function("type", &compound::type)
      .function("copy", &compound::copy);

  // 绑定compound_iterator类
  emscripten::class_<compound_iterator>("CompoundIterator")
      .constructor<shape &>()
      .function("reset", &compound_iterator::reset)
      .function("next", &compound_iterator::next);

  // 绑定comp_solid类，继承自solid
  emscripten::class_<comp_solid, emscripten::base<solid>>("CompSolid")
      .constructor<>()
      .constructor<TopoDS_Shape, bool>()
      .constructor<const shape &, TopoDS_Shape>()
      // 基础创建方法
      .class_function(
          "makeCompSolid",
          emscripten::select_overload<comp_solid(std::vector<solid> &)>(
              &comp_solid::make_comp_solid))
      .class_function("makeCompSolid", emscripten::select_overload<comp_solid(
                                           std::initializer_list<solid> &)>(
                                           &comp_solid::make_comp_solid))
      // 值访问方法
      .function("value", emscripten::select_overload<TopoDS_CompSolid &()>(
                             &comp_solid::value))
      .function("value",
                emscripten::select_overload<const TopoDS_CompSolid &() const>(
                    &comp_solid::value))
      // 类型方法
      .function("type", &comp_solid::type)
      .function("copy", &comp_solid::copy);

  // 绑定comp_solid_iterator类
  emscripten::class_<comp_solid_iterator>("CompSolidIterator")
      .constructor<shape &>()
      .function("reset", &comp_solid_iterator::reset)
      .function("next", &comp_solid_iterator::next);

  // 绑定mesh类
  emscripten::class_<mesh, std::shared_ptr<mesh>>("Mesh")
      .constructor<>()
      .constructor<TopoDS_Shape>()
      .constructor<const shape &>()
      .constructor<Handle_TDocStd_Document>()
      // 形状映射方法
      .function("mapShapes", &mesh::map_shapes)
      .function("mapShape", emscripten::select_overload<void(TopoDS_Shape)>(
                                &mesh::map_shape))
      .function("mapShape", emscripten::select_overload<void(const shape &)>(
                                &mesh::map_shape))
      .function("mapShape",
                emscripten::select_overload<void(const std::vector<shape> &)>(
                    &mesh::map_shape))
      // 三角化方法
      .function("triangulation", &mesh::triangulation);

  // 绑定基础selector类
  emscripten::class_<selector, std::shared_ptr<selector>>("Selector")
      .smart_ptr<selector_ptr>("SelectorPtr")
      .function("filter", &selector::filter)
      .class_function("and", &selector::operator&&)
      .class_function("or", &selector::operator||)
      .class_function("subtract", &selector::operator-)
      .class_function("not", &selector::operator!);

  // 绑定custom_selector
  emscripten::class_<custom_selector, selector>("CustomSelector")
      .constructor<
          std::function<std::vector<shape>(const std::vector<shape> &)>>();

  // 绑定nearest_to_point_selector
  emscripten::class_<nearest_to_point_selector, selector>(
      "NearestToPointSelector")
      .constructor<const topo_vector &>();

  // 绑定box_selector
  emscripten::class_<box_selector, selector>("BoxSelector")
      .constructor<const topo_vector &, const topo_vector &, bool>();

  // 绑定type_selector
  emscripten::class_<type_selector, selector>("TypeSelector")
      .constructor<const shape_geom_type &>();

  // 绑定direction_selector及其派生类
  emscripten::class_<direction_selector, selector>("DirectionSelector")
      .constructor<const topo_vector &, double>();

  emscripten::class_<parallel_dir_selector, direction_selector>(
      "ParallelDirSelector")
      .constructor<const topo_vector &, double>();

  emscripten::class_<dir_selector, direction_selector>("DirSelector")
      .constructor<const topo_vector &, double>();

  emscripten::class_<perpendicular_dir_selector, direction_selector>(
      "PerpendicularDirSelector")
      .constructor<const topo_vector &, double>();

  // 绑定nth_selector及其派生类
  emscripten::class_<nth_selector, selector>("NthSelector")
      .constructor<int, bool, double>();

  emscripten::class_<radius_nth_selector, nth_selector>("RadiusNthSelector")
      .constructor<int, bool, double>();

  emscripten::class_<center_nth_selector, nth_selector>("CenterNthSelector")
      .constructor<const topo_vector &, int, bool, double>();

  emscripten::class_<direction_minmax_selector, center_nth_selector>(
      "DirectionMinmaxSelector")
      .constructor<const topo_vector &, bool, double>();

  emscripten::class_<direction_nth_selector, selector>("DirectionNthSelector")
      .constructor<const topo_vector &, int, bool, double>();

  emscripten::class_<length_nth_selector, nth_selector>("LengthNthSelector")
      .constructor<int, bool, double>();

  emscripten::class_<area_nth_selector, nth_selector>("AreaNthSelector")
      .constructor<int, bool, double>();

  // 绑定组合选择器
  emscripten::class_<binary_selector, selector>("BinarySelector")
      .constructor<selector_ptr, selector_ptr>();

  emscripten::class_<and_selector, binary_selector>("AndSelector")
      .constructor<selector_ptr, selector_ptr>();

  emscripten::class_<or_selector, binary_selector>("OrSelector")
      .constructor<selector_ptr, selector_ptr>();

  emscripten::class_<subtract_selector, binary_selector>("SubtractSelector")
      .constructor<selector_ptr, selector_ptr>();

  emscripten::class_<not_selector, selector>("NotSelector")
      .constructor<selector_ptr>();

  // 绑定字符串语法选择器
  emscripten::class_<string_syntax_selector, selector>("StringSyntaxSelector")
      .constructor<const std::string &>();

  EMSCRIPTEN_BINDINGS(ShapeOps) {
    // 布尔运算封装
    function("fuse", &flywave::topo::fuse);

    function("cut", emscripten::select_overload<boost::optional<shape>(
                        const shape &, const shape &, double, bool)>(
                        &flywave::topo::cut));

    function("cut",
             emscripten::select_overload<boost::optional<shape>(
                 const shape &, const std::vector<shape> &, double, bool)>(
                 &flywave::topo::cut));

    function("intersect", emscripten::select_overload<boost::optional<shape>(
                              const shape &, const shape &, double, bool)>(
                              &flywave::topo::intersect));

    function("intersect",
             emscripten::select_overload<boost::optional<shape>(
                 const shape &, const std::vector<shape> &, double, bool)>(
                 &flywave::topo::intersect));

    // 枚举类型绑定
    enum_<flywave::topo::intersection_direction>("IntersectionDirection")
        .value("None", flywave::topo::intersection_direction::None)
        .value("AlongAxis", flywave::topo::intersection_direction::AlongAxis)
        .value("Opposite", flywave::topo::intersection_direction::Opposite);

    // Split operations
    function("split", emscripten::select_overload<boost::optional<shape>(
                          const shape &, const std::vector<shape> &, double)>(
                          &flywave::topo::split));
    function("split",
             emscripten::select_overload<boost::optional<shape>(
                 const shape &, const shape &, double)>(&flywave::topo::split));

    // Intersection operations
    enum_<flywave::topo::intersection_direction>("IntersectionDirection")
        .value("None", flywave::topo::intersection_direction::None)
        .value("AlongAxis", flywave::topo::intersection_direction::AlongAxis)
        .value("Opposite", flywave::topo::intersection_direction::Opposite);

    function("facesIntersectedByLine",
             &flywave::topo::faces_intersected_by_line);

    // Filling and shell operations
    function("fill", &flywave::topo::fill);
    function("shelling", &flywave::topo::shelling);

    // Edge operations
    function("fillet", &flywave::topo::fillet);
    function("chamfer", &flywave::topo::chamfer);

    // Extrusion operations
    function("extrude", &flywave::topo::extrude);
    function(
        "extrudeLinear",
        emscripten::select_overload<boost::optional<shape>(
            const wire &, const std::vector<wire> &, const gp_Vec &, double)>(
            &flywave::topo::extrude_linear));

    // Extrusion operations
    function("extrudeLinear",
             emscripten::select_overload<boost::optional<shape>(
                 const face &, const gp_Vec &, double)>(
                 &flywave::topo::extrude_linear));

    function("extrudeLinearWithRotation",
             emscripten::select_overload<boost::optional<shape>(
                 const wire &, const std::vector<wire> &, const gp_Pnt &,
                 const gp_Vec &, double)>(
                 &flywave::topo::extrude_linear_with_rotation));

    function("extrudeLinearWithRotation",
             emscripten::select_overload<boost::optional<shape>(
                 const face &, const gp_Pnt &, const gp_Vec &, double)>(
                 &flywave::topo::extrude_linear_with_rotation));

    // Revolution operations
    function("revolve",
             emscripten::select_overload<boost::optional<shape>(
                 const shape &, const gp_Pnt &, const gp_Dir &, double)>(
                 &flywave::topo::revolve));

    function("revolve",
             emscripten::select_overload<boost::optional<shape>(
                 const wire &, const std::vector<wire> &, double,
                 const gp_Pnt &, const gp_Pnt &)>(&flywave::topo::revolve));

    function("revolve",
             emscripten::select_overload<boost::optional<shape>(
                 const face &, double, const gp_Pnt &, const gp_Pnt &)>(
                 &flywave::topo::revolve));

    // Offset operation
    function("offset", &flywave::topo::offset);

    // Sweep operations
    enum_<flywave::topo::transition_mode>("TransitionMode")
        .value("TRANSFORMED", flywave::topo::transition_mode::TRANSFORMED)
        .value("ROUND", flywave::topo::transition_mode::ROUND)
        .value("RIGHT", flywave::topo::transition_mode::RIGHT);

    function("sweep",
             emscripten::select_overload<boost::optional<shape>(
                 const wire &, const std::vector<wire> &, const shape &, bool,
                 bool, const shape *, flywave::topo::transition_mode)>(
                 &flywave::topo::sweep));

    function("sweep",
             emscripten::select_overload<boost::optional<shape>(
                 const face &, const shape &, bool, bool, const shape *,
                 flywave::topo::transition_mode)>(&flywave::topo::sweep));

    function("sweepMulti", &flywave::topo::sweep_multi);

    // Loft operations
    function("loft",
             emscripten::select_overload<boost::optional<shape>(
                 const std::vector<shape> &, bool, bool, const std::string &,
                 const std::string &, int, bool, bool,
                 const std::array<double, 3> &)>(&flywave::topo::loft));

    function("loft", emscripten::select_overload<boost::optional<shape>(
                         const std::vector<face> &, const std::string &)>(
                         &flywave::topo::loft));

    // DPrism operations
    function("dprism",
             emscripten::select_overload<boost::optional<shape>(
                 const shape &, const std::shared_ptr<face> &,
                 const std::vector<wire> &, const boost::optional<double> &,
                 double, const face *, bool, bool)>(&flywave::topo::dprism));

    function("dprism",
             emscripten::select_overload<boost::optional<shape>(
                 const shape &, const std::shared_ptr<face> &,
                 const std::vector<face> &, const boost::optional<double> &,
                 double, const face *, bool, bool)>(&flywave::topo::dprism));

    // Other operations
    function("imprint", &flywave::topo::imprint);
    function("clean", &flywave::topo::clean);
    function("check", &flywave::topo::check);
    function("closest", &flywave::topo::closest);
    function("combinedCenter", &flywave::topo::combined_center);
    function("combinedCenterOfBoundBox",
             &flywave::topo::combined_center_of_bound_box);
    function("readShapeFromStep", &flywave::topo::read_shape_from_step);

    // Wire sample point struct binding
    value_object<flywave::topo::wire_sample_point>("WireSamplePoint")
        .field("position", &flywave::topo::wire_sample_point::position)
        .field("tangent", &flywave::topo::wire_sample_point::tangent)
        .field("edge", &flywave::topo::wire_sample_point::edge);

    // Profile projection struct binding
    value_object<flywave::topo::profile_projection>("ProfileProjection")
        .field("axes", &flywave::topo::profile_projection::axes)
        .field("trsf", &flywave::topo::profile_projection::trsf)
        .field("tangent", &flywave::topo::profile_projection::tangent)
        .field("position", &flywave::topo::profile_projection::position);

    // Wire operations
    function("sampleWireAtDistances", &flywave::topo::sample_wire_at_distances);
    function("clipWireBetweenDistances",
             &flywave::topo::clip_wire_between_distances);
    function("calcProfileProjection", &flywave::topo::cacl_profile_projection);
    function("profileProjectPoint", &flywave::topo::profile_project_point);
    function("wireLength", &flywave::topo::wrie_length);
  }
}
