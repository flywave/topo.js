#include "binding.hh"
#include "primitives.hh"

EMSCRIPTEN_BINDINGS(Primitive) {
  // 球体参数结构体
  value_object<sphere_params>("SphereParams")
      .field("radius", &sphere_params::radius);

  // 球体创建函数
  function("createSphere", select_overload<TopoDS_Shape(const sphere_params &)>(
                               &create_sphere));
  function("createSphereWithCenter",
           select_overload<TopoDS_Shape(const sphere_params &, const gp_Pnt &)>(
               &create_sphere));

  // 旋转椭球体参数结构体
  value_object<rotational_ellipsoid_params>("RotationalEllipsoidParams")
      .field("polarRadius", &rotational_ellipsoid_params::polarRadius)
      .field("equatorialRadius", &rotational_ellipsoid_params::equatorialRadius)
      .field("height", &rotational_ellipsoid_params::height);

  // 旋转椭球体创建函数
  function("createRotationalEllipsoid",
           select_overload<TopoDS_Shape(const rotational_ellipsoid_params &)>(
               &create_rotational_ellipsoid));
  function("createRotationalEllipsoidWithCenter",
           select_overload<TopoDS_Shape(const rotational_ellipsoid_params &,
                                        const gp_Pnt &, const gp_Dir &)>(
               &create_rotational_ellipsoid));

  // 长方体参数结构体
  value_object<cuboid_params>("CuboidParams")
      .field("length", &cuboid_params::length)
      .field("width", &cuboid_params::width)
      .field("height", &cuboid_params::height);

  // 长方体创建函数
  function("createCuboid", select_overload<TopoDS_Shape(const cuboid_params &)>(
                               &create_cuboid));
  function("createCuboidWithCenter",
           select_overload<TopoDS_Shape(const cuboid_params &, const gp_Pnt &,
                                        const gp_Dir &, const gp_Dir &)>(
               &create_cuboid));

  // 菱形台参数结构体
  value_object<diamond_frustum>("DiamondFrustumParams")
      .field("topDiag1", &diamond_frustum::topDiag1)
      .field("topDiag2", &diamond_frustum::topDiag2)
      .field("bottomDiag1", &diamond_frustum::bottomDiag1)
      .field("bottomDiag2", &diamond_frustum::bottomDiag2)
      .field("height", &diamond_frustum::height);

  // 菱形台创建函数
  function("createDiamondFrustum",
           select_overload<TopoDS_Shape(const diamond_frustum &)>(
               &create_diamond_frustum));
  function("createDiamondFrustumWithPosition",
           select_overload<TopoDS_Shape(const diamond_frustum &, const gp_Pnt &,
                                        const gp_Dir &, const gp_Dir &)>(
               &create_diamond_frustum));

  // 偏移矩形台参数结构体
  value_object<offset_rectangular_table_params>("OffsetRectangularTableParams")
      .field("topLength", &offset_rectangular_table_params::topLength)
      .field("topWidth", &offset_rectangular_table_params::topWidth)
      .field("bottomLength", &offset_rectangular_table_params::bottomLength)
      .field("bottomWidth", &offset_rectangular_table_params::bottomWidth)
      .field("height", &offset_rectangular_table_params::height)
      .field("xOffset", &offset_rectangular_table_params::xOffset)
      .field("yOffset", &offset_rectangular_table_params::yOffset);

  // 偏移矩形台创建函数
  function(
      "createOffsetRectangularTable",
      select_overload<TopoDS_Shape(const offset_rectangular_table_params &)>(
          &create_offset_rectangular_table));

  function("createOffsetRectangularTableWithPosition",
           select_overload<TopoDS_Shape(const offset_rectangular_table_params &,
                                        const gp_Pnt &, const gp_Dir &,
                                        const gp_Dir &)>(
               &create_offset_rectangular_table));

  // 圆柱参数结构体
  value_object<cylinder_params>("CylinderParams")
      .field("radius", &cylinder_params::radius)
      .field("height", &cylinder_params::height);

  // 圆柱创建函数
  function(
      "createCylinder",
      select_overload<TopoDS_Shape(const cylinder_params &)>(&create_cylinder));
  function("createCylinderWithBase",
           select_overload<TopoDS_Shape(const cylinder_params &, const gp_Pnt &,
                                        const gp_Dir &)>(&create_cylinder));

  // 弯折圆柱参数结构体
  value_object<sharp_bent_cylinder_params>("SharpBentCylinderParams")
      .field("radius", &sharp_bent_cylinder_params::radius)
      .field("length", &sharp_bent_cylinder_params::length)
      .field("bendAngle", &sharp_bent_cylinder_params::bendAngle);

  // 弯折圆柱创建函数
  function("createSharpBentCylinder",
           select_overload<TopoDS_Shape(const sharp_bent_cylinder_params &)>(
               &create_sharp_bent_cylinder));
  function("createSharpBentCylinderWithBendPoint",
           select_overload<TopoDS_Shape(
               const sharp_bent_cylinder_params &, const gp_Pnt &,
               const gp_Dir &, const gp_Dir &)>(&create_sharp_bent_cylinder));

  // 截锥参数结构体
  value_object<truncated_cone_params>("TruncatedConeParams")
      .field("topRadius", &truncated_cone_params::topRadius)
      .field("bottomRadius", &truncated_cone_params::bottomRadius)
      .field("height", &truncated_cone_params::height);

  // 截锥创建函数
  function("createTruncatedCone",
           select_overload<TopoDS_Shape(const truncated_cone_params &)>(
               &create_truncated_cone));
  function("createTruncatedConeWithBase",
           select_overload<TopoDS_Shape(const truncated_cone_params &,
                                        const gp_Pnt &, const gp_Dir &)>(
               &create_truncated_cone));

  // 偏心截锥参数结构体
  value_object<eccentric_truncated_cone_params>("EccentricTruncatedConeParams")
      .field("topRadius", &eccentric_truncated_cone_params::topRadius)
      .field("bottomRadius", &eccentric_truncated_cone_params::bottomRadius)
      .field("height", &eccentric_truncated_cone_params::height)
      .field("topXOffset", &eccentric_truncated_cone_params::topXOffset)
      .field("topYOffset", &eccentric_truncated_cone_params::topYOffset);

  // 偏心截锥创建函数
  function(
      "createEccentricTruncatedCone",
      select_overload<TopoDS_Shape(const eccentric_truncated_cone_params &)>(
          &create_eccentric_truncated_cone));
  function("createEccentricTruncatedConeWithBase",
           select_overload<TopoDS_Shape(const eccentric_truncated_cone_params &,
                                        const gp_Pnt &, const gp_Dir &)>(
               &create_eccentric_truncated_cone));

  // 环形参数结构体
  value_object<ring_params>("RingParams")
      .field("ringRadius", &ring_params::ringRadius)
      .field("tubeRadius", &ring_params::tubeRadius)
      .field("angle", &ring_params::angle);

  // 环形创建函数
  function("createRing",
           select_overload<TopoDS_Shape(const ring_params &)>(&create_ring));
  function("createRingWithCenter",
           select_overload<TopoDS_Shape(const ring_params &, const gp_Pnt &,
                                        const gp_Dir &, const gp_Dir &)>(
               &create_ring));

  // 矩形环参数结构体
  value_object<rectangular_ring_params>("RectangularRingParams")
      .field("tubeRadius", &rectangular_ring_params::tubeRadius)
      .field("filletRadius", &rectangular_ring_params::filletRadius)
      .field("length", &rectangular_ring_params::length)
      .field("width", &rectangular_ring_params::width);

  // 矩形环创建函数
  function("createRectangularRing",
           select_overload<TopoDS_Shape(const rectangular_ring_params &)>(
               &create_rectangular_ring));
  function("createRectangularRingWithCenter",
           select_overload<TopoDS_Shape(
               const rectangular_ring_params &, const gp_Pnt &, const gp_Dir &,
               const gp_Dir &)>(&create_rectangular_ring));

  // 椭圆环参数结构体
  value_object<elliptic_ring_params>("EllipticRingParams")
      .field("tubeRadius", &elliptic_ring_params::tubeRadius)
      .field("majorRadius", &elliptic_ring_params::majorRadius)
      .field("minorRadius", &elliptic_ring_params::minorRadius);

  // 椭圆环创建函数
  function("createEllipticRing",
           select_overload<TopoDS_Shape(const elliptic_ring_params &)>(
               &create_elliptic_ring));
  function(
      "createEllipticRingWithCenter",
      select_overload<TopoDS_Shape(const elliptic_ring_params &, const gp_Pnt &,
                                   const gp_Dir &, const gp_Dir &)>(
          &create_elliptic_ring));

  // 圆形垫片参数结构体
  value_object<circular_gasket_params>("CircularGasketParams")
      .field("outerRadius", &circular_gasket_params::outerRadius)
      .field("innerRadius", &circular_gasket_params::innerRadius)
      .field("height", &circular_gasket_params::height)
      .field("angle", &circular_gasket_params::angle);

  // 圆形垫片创建函数
  function("createCircularGasket",
           select_overload<TopoDS_Shape(const circular_gasket_params &)>(
               &create_circular_gasket));
  function("createCircularGasketWithCenter",
           select_overload<TopoDS_Shape(
               const circular_gasket_params &, const gp_Pnt &, const gp_Dir &,
               const gp_Dir &)>(&create_circular_gasket));

  // 台形垫片参数结构体
  value_object<table_gasket_params>("TableGasketParams")
      .field("topRadius", &table_gasket_params::topRadius)
      .field("outerRadius", &table_gasket_params::outerRadius)
      .field("innerRadius", &table_gasket_params::innerRadius)
      .field("height", &table_gasket_params::height)
      .field("angle", &table_gasket_params::angle);

  // 台形垫片创建函数
  function("createTableGasket",
           select_overload<TopoDS_Shape(const table_gasket_params &)>(
               &create_table_gasket));
  function(
      "createTableGasketWithCenter",
      select_overload<TopoDS_Shape(const table_gasket_params &, const gp_Pnt &,
                                   const gp_Dir &, const gp_Dir &)>(
          &create_table_gasket));

  // 方形垫片参数结构体
  value_object<square_gasket_params>("SquareGasketParams")
      .field("outerLength", &square_gasket_params::outerLength)
      .field("outerWidth", &square_gasket_params::outerWidth)
      .field("innerLength", &square_gasket_params::innerLength)
      .field("innerWidth", &square_gasket_params::innerWidth)
      .field("height", &square_gasket_params::height)
      .field("cornerType", &square_gasket_params::cornerType)
      .field("cornerParam", &square_gasket_params::cornerParam);

  // 方形垫片创建函数
  function("createSquareGasket",
           select_overload<TopoDS_Shape(const square_gasket_params &)>(
               &create_square_gasket));
  function(
      "createSquareGasketWithCenter",
      select_overload<TopoDS_Shape(const square_gasket_params &, const gp_Pnt &,
                                   const gp_Dir &, const gp_Dir &)>(
          &create_square_gasket));

  // 拉伸体参数结构体
  value_object<stretched_body_params>("StretchedBodyParams")
      .field("points", &stretched_body_params::points)
      .field("normal", &stretched_body_params::normal)
      .field("length", &stretched_body_params::length);

  // 拉伸体创建函数
  function("createStretchedBody",
           select_overload<TopoDS_Shape(const stretched_body_params &)>(
               &create_stretched_body));
  function("createStretchedBodyWithBase",
           select_overload<TopoDS_Shape(const stretched_body_params &,
                                        const gp_Pnt &, const gp_Dir &)>(
               &create_stretched_body));

  // 瓷套绝缘子参数结构体
  value_object<porcelain_bushing_params>("PorcelainBushingParams")
      .field("height", &porcelain_bushing_params::height)
      .field("radius", &porcelain_bushing_params::radius)
      .field("bigSkirtRadius", &porcelain_bushing_params::bigSkirtRadius)
      .field("smallSkirtRadius", &porcelain_bushing_params::smallSkirtRadius)
      .field("count", &porcelain_bushing_params::count);

  // 瓷套绝缘子创建函数
  function("createPorcelainBushing",
           select_overload<TopoDS_Shape(const porcelain_bushing_params &)>(
               &create_porcelain_bushing));
  function("createPorcelainBushingWithBase",
           select_overload<TopoDS_Shape(const porcelain_bushing_params &,
                                        const gp_Pnt &, const gp_Dir &)>(
               &create_porcelain_bushing));

  // 锥形瓷套绝缘子参数结构体
  value_object<cone_porcelain_bushing_params>("ConePorcelainBushingParams")
      .field("height", &cone_porcelain_bushing_params::height)
      .field("bottomRadius", &cone_porcelain_bushing_params::bottomRadius)
      .field("topRadius", &cone_porcelain_bushing_params::topRadius)
      .field("bottomSkirtRadius1",
             &cone_porcelain_bushing_params::bottomSkirtRadius1)
      .field("bottomSkirtRadius2",
             &cone_porcelain_bushing_params::bottomSkirtRadius2)
      .field("topSkirtRadius1", &cone_porcelain_bushing_params::topSkirtRadius1)
      .field("topSkirtRadius2", &cone_porcelain_bushing_params::topSkirtRadius2)
      .field("count", &cone_porcelain_bushing_params::count);

  // 锥形瓷套绝缘子创建函数
  function("createConePorcelainBushing",
           select_overload<TopoDS_Shape(const cone_porcelain_bushing_params &)>(
               &create_cone_porcelain_bushing));
  function("createConePorcelainBushingWithBase",
           select_overload<TopoDS_Shape(const cone_porcelain_bushing_params &,
                                        const gp_Pnt &, const gp_Dir &)>(
               &create_cone_porcelain_bushing));

  // 绝缘子串参数结构体
  value_object<insulator_string_params>("InsulatorStringParams")
      .field("count", &insulator_string_params::count)
      .field("spacing", &insulator_string_params::spacing)
      .field("insulatorCount", &insulator_string_params::insulatorCount)
      .field("height", &insulator_string_params::height)
      .field("bigSkirtRadius", &insulator_string_params::bigSkirtRadius)
      .field("smallSkirtRadius", &insulator_string_params::smallSkirtRadius)
      .field("radius", &insulator_string_params::radius)
      .field("frontLength", &insulator_string_params::frontLength)
      .field("backLength", &insulator_string_params::backLength)
      .field("splitCount", &insulator_string_params::splitCount);

  // 绝缘子串创建函数
  function("createInsulatorString",
           select_overload<TopoDS_Shape(const insulator_string_params &)>(
               &create_insulator_string));
  function("createInsulatorStringWithPosition",
           select_overload<TopoDS_Shape(
               const insulator_string_params &, const gp_Pnt &, const gp_Dir &,
               const gp_Dir &)>(&create_insulator_string));

  // V型绝缘子参数结构体
  value_object<vtype_insulator_params>("VTypeInsulatorParams")
      .field("frontSpacing", &vtype_insulator_params::frontSpacing)
      .field("backSpacing", &vtype_insulator_params::backSpacing)
      .field("insulatorCount", &vtype_insulator_params::insulatorCount)
      .field("height", &vtype_insulator_params::height)
      .field("radius", &vtype_insulator_params::radius)
      .field("bigSkirtRadius", &vtype_insulator_params::bigSkirtRadius)
      .field("smallSkirtRadius", &vtype_insulator_params::smallSkirtRadius)
      .field("frontLength", &vtype_insulator_params::frontLength)
      .field("backLength", &vtype_insulator_params::backLength)
      .field("splitCount", &vtype_insulator_params::splitCount);

  // V型绝缘子创建函数
  function("createVTypeInsulator",
           select_overload<TopoDS_Shape(const vtype_insulator_params &)>(
               &create_vtype_insulator));
  function("createVTypeInsulatorWithPosition",
           select_overload<TopoDS_Shape(
               const vtype_insulator_params &, const gp_Pnt &, const gp_Dir &,
               const gp_Dir &)>(&create_vtype_insulator));

  // 端子排参数结构体
  value_object<terminal_block_params>("TerminalBlockParams")
      .field("length", &terminal_block_params::length)
      .field("width", &terminal_block_params::width)
      .field("thickness", &terminal_block_params::thickness)
      .field("chamferLength", &terminal_block_params::chamferLength)
      .field("columnSpacing", &terminal_block_params::columnSpacing)
      .field("rowSpacing", &terminal_block_params::rowSpacing)
      .field("holeRadius", &terminal_block_params::holeRadius)
      .field("columnCount", &terminal_block_params::columnCount)
      .field("rowCount", &terminal_block_params::rowCount)
      .field("bottomOffset", &terminal_block_params::bottomOffset);

  // 端子排创建函数
  function("createTerminalBlock",
           select_overload<TopoDS_Shape(const terminal_block_params &)>(
               &create_terminal_block));
  function("createTerminalBlockWithPosition",
           select_overload<TopoDS_Shape(
               const terminal_block_params &, const gp_Pnt &, const gp_Dir &,
               const gp_Dir &)>(&create_terminal_block));

  // 矩形开孔板参数结构体
  value_object<rectangular_hole_plate_params>("RectangularHolePlateParams")
      .field("length", &rectangular_hole_plate_params::length)
      .field("width", &rectangular_hole_plate_params::width)
      .field("thickness", &rectangular_hole_plate_params::thickness)
      .field("columnSpacing", &rectangular_hole_plate_params::columnSpacing)
      .field("rowSpacing", &rectangular_hole_plate_params::rowSpacing)
      .field("columnCount", &rectangular_hole_plate_params::columnCount)
      .field("rowCount", &rectangular_hole_plate_params::rowCount)
      .field("hasMiddleHole", &rectangular_hole_plate_params::hasMiddleHole)
      .field("holeDiameter", &rectangular_hole_plate_params::holeDiameter);

  // 矩形开孔板创建函数
  function("createRectangularFixedPlate",
           select_overload<TopoDS_Shape(const rectangular_hole_plate_params &)>(
               &create_rectangular_fixed_plate));
  function("createRectangularFixedPlateWithPosition",
           select_overload<TopoDS_Shape(const rectangular_hole_plate_params &,
                                        const gp_Pnt &, const gp_Dir &,
                                        const gp_Dir &)>(
               &create_rectangular_fixed_plate));

  // 圆形开孔板参数结构体
  value_object<circular_fixed_plate_params>("CircularFixedPlateParams")
      .field("length", &circular_fixed_plate_params::length)
      .field("width", &circular_fixed_plate_params::width)
      .field("thickness", &circular_fixed_plate_params::thickness)
      .field("ringRadius", &circular_fixed_plate_params::ringRadius)
      .field("holeCount", &circular_fixed_plate_params::holeCount)
      .field("hasMiddleHole", &circular_fixed_plate_params::hasMiddleHole)
      .field("holeDiameter", &circular_fixed_plate_params::holeDiameter);

  // 圆形开孔板创建函数
  function("createCircularFixedPlate",
           select_overload<TopoDS_Shape(const circular_fixed_plate_params &)>(
               &create_circular_fixed_plate));
  function("createCircularFixedPlateWithPosition",
           select_overload<TopoDS_Shape(
               const circular_fixed_plate_params &, const gp_Pnt &,
               const gp_Dir &, const gp_Dir &)>(&create_circular_fixed_plate));

  // 导线参数结构体
  value_object<wire_params>("WireParams")
      .field("startPoint", &wire_params::startPoint)
      .field("endPoint", &wire_params::endPoint)
      .field("startDir", &wire_params::startDir)
      .field("endDir", &wire_params::endDir)
      .field("sag", &wire_params::sag)
      .field("diameter", &wire_params::diameter)
      .field("fitPoints", &wire_params::fitPoints);

  // 导线创建函数
  function("createWire",
           select_overload<TopoDS_Shape(const wire_params &)>(&create_wire));
  function("createWireWithPosition",
           select_overload<TopoDS_Shape(const wire_params &, const gp_Pnt &,
                                        const gp_Dir &, const gp_Dir &)>(
               &create_wire));

  // 电缆参数结构体
  value_object<cable_params>("CableParams")
      .field("startPoint", &cable_params::startPoint)
      .field("endPoint", &cable_params::endPoint)
      .field("inflectionPoints", &cable_params::inflectionPoints)
      .field("radii", &cable_params::radii)
      .field("diameter", &cable_params::diameter);

  // 电缆创建函数
  function("createCable",
           select_overload<TopoDS_Shape(const cable_params &)>(&create_cable));
  function("createCableWithPosition",
           select_overload<TopoDS_Shape(const cable_params &, const gp_Pnt &,
                                        const gp_Dir &, const gp_Dir &)>(
               &create_cable));

  // 曲线类型枚举
  enum_<curve_type>("CurveType")
      .value("LINE", curve_type::LINE)
      .value("ARC", curve_type::ARC)
      .value("SPLINE", curve_type::SPLINE);

  // 曲线电缆参数结构体
  value_object<curve_cable_params>("CurveCableParams")
      .field("controlPoints", &curve_cable_params::controlPoints)
      .field("curveTypes", &curve_cable_params::curveTypes)
      .field("diameter", &curve_cable_params::diameter);

  // 曲线电缆创建函数
  function("createCurveCable",
           select_overload<TopoDS_Shape(const curve_cable_params &)>(
               &create_curve_cable));
  function(
      "createCurveCableWithPosition",
      select_overload<TopoDS_Shape(const curve_cable_params &, const gp_Pnt &,
                                   const gp_Dir &, const gp_Dir &)>(
          &create_curve_cable));

  // 角钢参数结构体
  value_object<angle_steel_params>("AngleSteelParams")
      .field("L1", &angle_steel_params::L1)
      .field("L2", &angle_steel_params::L2)
      .field("X", &angle_steel_params::X)
      .field("length", &angle_steel_params::length);

  // 角钢创建函数
  function("createAngleSteel",
           select_overload<TopoDS_Shape(const angle_steel_params &)>(
               &create_angle_steel));
  function(
      "createAngleSteelWithPosition",
      select_overload<TopoDS_Shape(const angle_steel_params &, const gp_Pnt &,
                                   const gp_Dir &, const gp_Dir &)>(
          &create_angle_steel));

  // 工字钢参数结构体
  value_object<i_shaped_steel_params>("IShapedSteelParams")
      .field("height", &i_shaped_steel_params::height)
      .field("flangeWidth", &i_shaped_steel_params::flangeWidth)
      .field("webThickness", &i_shaped_steel_params::webThickness)
      .field("flangeThickness", &i_shaped_steel_params::flangeThickness)
      .field("length", &i_shaped_steel_params::length);

  // 工字钢创建函数
  function("createIShapedSteel",
           select_overload<TopoDS_Shape(const i_shaped_steel_params &)>(
               &create_i_shaped_steel));
  function("createIShapedSteelWithPosition",
           select_overload<TopoDS_Shape(
               const i_shaped_steel_params &, const gp_Pnt &, const gp_Dir &,
               const gp_Dir &)>(&create_i_shaped_steel));

  // 槽钢参数结构体
  value_object<channel_steel_params>("ChannelSteelParams")
      .field("height", &channel_steel_params::height)
      .field("flangeWidth", &channel_steel_params::flangeWidth)
      .field("webThickness", &channel_steel_params::webThickness)
      .field("flangeThickness", &channel_steel_params::flangeThickness)
      .field("length", &channel_steel_params::length);

  // 槽钢创建函数
  function("createChannelSteel",
           select_overload<TopoDS_Shape(const channel_steel_params &)>(
               &create_channel_steel));
  function(
      "createChannelSteelWithPosition",
      select_overload<TopoDS_Shape(const channel_steel_params &, const gp_Pnt &,
                                   const gp_Dir &, const gp_Dir &)>(
          &create_channel_steel));

  // T型钢参数结构体
  value_object<t_steel_params>("TSteelParams")
      .field("height", &t_steel_params::height)
      .field("width", &t_steel_params::width)
      .field("webThickness", &t_steel_params::webThickness)
      .field("flangeThickness", &t_steel_params::flangeThickness)
      .field("length", &t_steel_params::length);

  // T型钢创建函数
  function(
      "createTSteel",
      select_overload<TopoDS_Shape(const t_steel_params &)>(&create_t_steel));
  function("createTSteelWithPosition",
           select_overload<TopoDS_Shape(const t_steel_params &, const gp_Pnt &,
                                        const gp_Dir &, const gp_Dir &)>(
               &create_t_steel));

  // 钻孔桩参数结构体
  value_object<bored_pile_params>("BoredPileParams")
      .field("H1", &bored_pile_params::H1)
      .field("H2", &bored_pile_params::H2)
      .field("H3", &bored_pile_params::H3)
      .field("H4", &bored_pile_params::H4)
      .field("d", &bored_pile_params::d)
      .field("D", &bored_pile_params::D);

  // 钻孔桩创建函数
  function("createBoredPileBase",
           select_overload<TopoDS_Shape(const bored_pile_params &)>(
               &create_bored_pile_base));
  function(
      "createBoredPileBaseWithPosition",
      select_overload<TopoDS_Shape(const bored_pile_params &, const gp_Pnt &,
                                   const gp_Dir &)>(&create_bored_pile_base));

  // 桩承台参数结构体
  value_object<pile_cap_params>("PileCapParams")
      .field("H1", &pile_cap_params::H1)
      .field("H2", &pile_cap_params::H2)
      .field("H3", &pile_cap_params::H3)
      .field("H4", &pile_cap_params::H4)
      .field("H5", &pile_cap_params::H5)
      .field("H6", &pile_cap_params::H6)
      .field("d", &pile_cap_params::d)
      .field("D", &pile_cap_params::D)
      .field("b", &pile_cap_params::b)
      .field("B1", &pile_cap_params::B1)
      .field("L1", &pile_cap_params::L1)
      .field("e1", &pile_cap_params::e1)
      .field("e2", &pile_cap_params::e2)
      .field("cs", &pile_cap_params::cs)
      .field("ZCOUNT", &pile_cap_params::ZCOUNT)
      .field("ZPOSTARRAY", &pile_cap_params::ZPOSTARRAY);

  // 桩承台创建函数
  function("createPileCapBase",
           select_overload<TopoDS_Shape(const pile_cap_params &)>(
               &create_pile_cap_base));
  function(
      "createPileCapBaseWithPosition",
      select_overload<TopoDS_Shape(const pile_cap_params &, const gp_Pnt &,
                                   const gp_Dir &)>(&create_pile_cap_base));

  // 岩石锚杆参数结构体
  value_object<rock_anchor_params>("RockAnchorParams")
      .field("H1", &rock_anchor_params::H1)
      .field("H2", &rock_anchor_params::H2)
      .field("d", &rock_anchor_params::d)
      .field("B1", &rock_anchor_params::B1)
      .field("L1", &rock_anchor_params::L1)
      .field("ZCOUNT", &rock_anchor_params::ZCOUNT)
      .field("ZPOSTARRAY", &rock_anchor_params::ZPOSTARRAY);

  // 岩石锚杆创建函数
  function("createRockAnchorBase",
           select_overload<TopoDS_Shape(const rock_anchor_params &)>(
               &create_rock_anchor_base));
  function(
      "createRockAnchorBaseWithPosition",
      select_overload<TopoDS_Shape(const rock_anchor_params &, const gp_Pnt &,
                                   const gp_Dir &)>(&create_rock_anchor_base));

  // 岩石桩承台参数结构体
  value_object<rock_pile_cap_params>("RockPileCapParams")
      .field("H1", &rock_pile_cap_params::H1)
      .field("H2", &rock_pile_cap_params::H2)
      .field("H3", &rock_pile_cap_params::H3)
      .field("d", &rock_pile_cap_params::d)
      .field("b", &rock_pile_cap_params::b)
      .field("B1", &rock_pile_cap_params::B1)
      .field("L1", &rock_pile_cap_params::L1)
      .field("e1", &rock_pile_cap_params::e1)
      .field("e2", &rock_pile_cap_params::e2)
      .field("cs", &rock_pile_cap_params::cs)
      .field("ZCOUNT", &rock_pile_cap_params::ZCOUNT)
      .field("ZPOSTARRAY", &rock_pile_cap_params::ZPOSTARRAY);

  // 岩石桩承台创建函数
  function("createRockPileCapBase",
           select_overload<TopoDS_Shape(const rock_pile_cap_params &)>(
               &create_rock_pile_cap_base));
  function("createRockPileCapBaseWithPosition",
           select_overload<TopoDS_Shape(const rock_pile_cap_params &,
                                        const gp_Pnt &, const gp_Dir &)>(
               &create_rock_pile_cap_base));

  // 嵌入式岩石锚杆参数结构体
  value_object<embedded_rock_anchor_params>("EmbeddedRockAnchorParams")
      .field("H1", &embedded_rock_anchor_params::H1)
      .field("H2", &embedded_rock_anchor_params::H2)
      .field("H3", &embedded_rock_anchor_params::H3)
      .field("d", &embedded_rock_anchor_params::d)
      .field("D", &embedded_rock_anchor_params::D);

  // 嵌入式岩石锚杆创建函数
  function("createEmbeddedRockAnchorBase",
           select_overload<TopoDS_Shape(const embedded_rock_anchor_params &)>(
               &create_embedded_rock_anchor_base));
  function("createEmbeddedRockAnchorBaseWithPosition",
           select_overload<TopoDS_Shape(const embedded_rock_anchor_params &,
                                        const gp_Pnt &, const gp_Dir &)>(
               &create_embedded_rock_anchor_base));

  // 倾斜岩石锚杆基础参数结构体
  value_object<inclined_rock_anchor_params>("InclinedRockAnchorParams")
      .field("H1", &inclined_rock_anchor_params::H1)
      .field("H2", &inclined_rock_anchor_params::H2)
      .field("d", &inclined_rock_anchor_params::d)
      .field("D", &inclined_rock_anchor_params::D)
      .field("B", &inclined_rock_anchor_params::B)
      .field("L", &inclined_rock_anchor_params::L)
      .field("e1", &inclined_rock_anchor_params::e1)
      .field("e2", &inclined_rock_anchor_params::e2)
      .field("alpha1", &inclined_rock_anchor_params::alpha1)
      .field("alpha2", &inclined_rock_anchor_params::alpha2);

  // 倾斜岩石锚杆基础创建函数
  function("createInclinedRockAnchorBase",
           select_overload<TopoDS_Shape(const inclined_rock_anchor_params &)>(
               &create_inclined_rock_anchor_base));
  function("createInclinedRockAnchorBaseWithPosition",
           select_overload<TopoDS_Shape(const inclined_rock_anchor_params &,
                                        const gp_Pnt &, const gp_Dir &)>(
               &create_inclined_rock_anchor_base));

  // 开挖式基础参数结构体
  value_object<excavated_base_params>("ExcavatedBaseParams")
      .field("H1", &excavated_base_params::H1)
      .field("H2", &excavated_base_params::H2)
      .field("H3", &excavated_base_params::H3)
      .field("d", &excavated_base_params::d)
      .field("D", &excavated_base_params::D)
      .field("alpha1", &excavated_base_params::alpha1)
      .field("alpha2", &excavated_base_params::alpha2);

  // 开挖式基础创建函数
  function("createExcavatedBase",
           select_overload<TopoDS_Shape(const excavated_base_params &)>(
               &create_excavated_base));
  function("createExcavatedBaseWithPosition",
           select_overload<TopoDS_Shape(const excavated_base_params &,
                                        const gp_Pnt &, const gp_Dir &)>(
               &create_excavated_base));

  // 阶梯式基础参数结构体
  value_object<step_base_params>("StepBaseParams")
      .field("H", &step_base_params::H)
      .field("H1", &step_base_params::H1)
      .field("H2", &step_base_params::H2)
      .field("H3", &step_base_params::H3)
      .field("b", &step_base_params::b)
      .field("B1", &step_base_params::B1)
      .field("B2", &step_base_params::B2)
      .field("B3", &step_base_params::B3)
      .field("L1", &step_base_params::L1)
      .field("L2", &step_base_params::L2)
      .field("L3", &step_base_params::L3)
      .field("N", &step_base_params::N);

  // 阶梯式基础创建函数
  function("createStepBase",
           select_overload<TopoDS_Shape(const step_base_params &)>(
               &create_step_base));
  function(
      "createStepBaseWithPosition",
      select_overload<TopoDS_Shape(const step_base_params &, const gp_Pnt &,
                                   const gp_Dir &)>(&create_step_base));

  // 阶梯板式基础参数结构体
  value_object<step_plate_base_params>("StepPlateBaseParams")
      .field("H", &step_plate_base_params::H)
      .field("H1", &step_plate_base_params::H1)
      .field("H2", &step_plate_base_params::H2)
      .field("H3", &step_plate_base_params::H3)
      .field("b", &step_plate_base_params::b)
      .field("L1", &step_plate_base_params::L1)
      .field("L2", &step_plate_base_params::L2)
      .field("B1", &step_plate_base_params::B1)
      .field("B2", &step_plate_base_params::B2)
      .field("alpha1", &step_plate_base_params::alpha1)
      .field("alpha2", &step_plate_base_params::alpha2)
      .field("N", &step_plate_base_params::N);

  // 阶梯板式基础创建函数
  function("createStepPlateBase",
           select_overload<TopoDS_Shape(const step_plate_base_params &)>(
               &create_step_plate_base));
  function("createStepPlateBaseWithPosition",
           select_overload<TopoDS_Shape(const step_plate_base_params &,
                                        const gp_Pnt &, const gp_Dir &)>(
               &create_step_plate_base));

  // 斜坡式基础参数结构体
  value_object<sloped_base_base_params>("SlopedBaseBaseParams")
      .field("H1", &sloped_base_base_params::H1)
      .field("H2", &sloped_base_base_params::H2)
      .field("H3", &sloped_base_base_params::H3)
      .field("b", &sloped_base_base_params::b)
      .field("L1", &sloped_base_base_params::L1)
      .field("L2", &sloped_base_base_params::L2)
      .field("B1", &sloped_base_base_params::B1)
      .field("B2", &sloped_base_base_params::B2)
      .field("alpha1", &sloped_base_base_params::alpha1)
      .field("alpha2", &sloped_base_base_params::alpha2);

  // 斜坡式基础创建函数
  function("createSlopedBaseBase",
           select_overload<TopoDS_Shape(const sloped_base_base_params &)>(
               &create_sloped_base_base));
  function("createSlopedBaseBaseWithPosition",
           select_overload<TopoDS_Shape(const sloped_base_base_params &,
                                        const gp_Pnt &, const gp_Dir &)>(
               &create_sloped_base_base));

  // 复合沉井基础参数结构体
  value_object<composite_caisson_base_params>("CompositeCaissonBaseParams")
      .field("H1", &composite_caisson_base_params::H1)
      .field("H2", &composite_caisson_base_params::H2)
      .field("H3", &composite_caisson_base_params::H3)
      .field("H4", &composite_caisson_base_params::H4)
      .field("b", &composite_caisson_base_params::b)
      .field("D", &composite_caisson_base_params::D)
      .field("t", &composite_caisson_base_params::t)
      .field("B1", &composite_caisson_base_params::B1)
      .field("B2", &composite_caisson_base_params::B2)
      .field("L1", &composite_caisson_base_params::L1)
      .field("L2", &composite_caisson_base_params::L2);

  // 复合沉井基础创建函数
  function("createCompositeCaissonBase",
           select_overload<TopoDS_Shape(const composite_caisson_base_params &)>(
               &create_composite_caisson_base));
  function("createCompositeCaissonBaseWithPosition",
           select_overload<TopoDS_Shape(const composite_caisson_base_params &,
                                        const gp_Pnt &, const gp_Dir &)>(
               &create_composite_caisson_base));

  // 筏板基础参数结构体
  value_object<raft_base_params>("RaftBaseParams")
      .field("H1", &raft_base_params::H1)
      .field("H2", &raft_base_params::H2)
      .field("H3", &raft_base_params::H3)
      .field("b1", &raft_base_params::b1)
      .field("b2", &raft_base_params::b2)
      .field("B1", &raft_base_params::B1)
      .field("B2", &raft_base_params::B2)
      .field("L1", &raft_base_params::L1)
      .field("L2", &raft_base_params::L2);

  // 筏板基础创建函数
  function("createRaftBase",
           select_overload<TopoDS_Shape(const raft_base_params &)>(
               &create_raft_base));
  function(
      "createRaftBaseWithPosition",
      select_overload<TopoDS_Shape(const raft_base_params &, const gp_Pnt &,
                                   const gp_Dir &)>(&create_raft_base));

  // 直埋基础参数结构体
  value_object<direct_buried_base_params>("DirectBuriedBaseParams")
      .field("H1", &direct_buried_base_params::H1)
      .field("H2", &direct_buried_base_params::H2)
      .field("d", &direct_buried_base_params::d)
      .field("D", &direct_buried_base_params::D)
      .field("B", &direct_buried_base_params::B)
      .field("t", &direct_buried_base_params::t);

  // 直埋基础创建函数
  function("createDirectBuriedBase",
           select_overload<TopoDS_Shape(const direct_buried_base_params &)>(
               &create_direct_buried_base));
  function("createDirectBuriedBaseWithPosition",
           select_overload<TopoDS_Shape(const direct_buried_base_params &,
                                        const gp_Pnt &, const gp_Dir &)>(
               &create_direct_buried_base));

  // 钢套筒基础参数结构体
  value_object<steel_sleeve_base_params>("SteelSleeveBaseParams")
      .field("H1", &steel_sleeve_base_params::H1)
      .field("H2", &steel_sleeve_base_params::H2)
      .field("H3", &steel_sleeve_base_params::H3)
      .field("H4", &steel_sleeve_base_params::H4)
      .field("d", &steel_sleeve_base_params::d)
      .field("D1", &steel_sleeve_base_params::D1)
      .field("D2", &steel_sleeve_base_params::D2)
      .field("t", &steel_sleeve_base_params::t)
      .field("B1", &steel_sleeve_base_params::B1)
      .field("B2", &steel_sleeve_base_params::B2);

  // 钢套筒基础创建函数
  function("createSteelSleeveBase",
           select_overload<TopoDS_Shape(const steel_sleeve_base_params &)>(
               &create_steel_sleeve_base));
  function("createSteelSleeveBaseWithPosition",
           select_overload<TopoDS_Shape(const steel_sleeve_base_params &,
                                        const gp_Pnt &, const gp_Dir &)>(
               &create_steel_sleeve_base));

  // 预制柱基础参数结构体
  value_object<precast_column_base_params>("PrecastColumnBaseParams")
      .field("H1", &precast_column_base_params::H1)
      .field("H2", &precast_column_base_params::H2)
      .field("H3", &precast_column_base_params::H3)
      .field("d", &precast_column_base_params::d)
      .field("B1", &precast_column_base_params::B1)
      .field("B2", &precast_column_base_params::B2)
      .field("L1", &precast_column_base_params::L1)
      .field("L2", &precast_column_base_params::L2);

  // 预制柱基础创建函数
  function("createPrecastColumnBase",
           select_overload<TopoDS_Shape(const precast_column_base_params &)>(
               &create_precast_column_base));
  function("createPrecastColumnBaseWithPosition",
           select_overload<TopoDS_Shape(const precast_column_base_params &,
                                        const gp_Pnt &, const gp_Dir &)>(
               &create_precast_column_base));

  // 预制插接基础参数结构体
  value_object<precast_pinned_base_params>("PrecastPinnedBaseParams")
      .field("H1", &precast_pinned_base_params::H1)
      .field("H2", &precast_pinned_base_params::H2)
      .field("H3", &precast_pinned_base_params::H3)
      .field("d", &precast_pinned_base_params::d)
      .field("B1", &precast_pinned_base_params::B1)
      .field("B2", &precast_pinned_base_params::B2)
      .field("L1", &precast_pinned_base_params::L1)
      .field("L2", &precast_pinned_base_params::L2)
      .field("B", &precast_pinned_base_params::B)
      .field("H", &precast_pinned_base_params::H)
      .field("L", &precast_pinned_base_params::L);

  // 预制插接基础创建函数
  function("createPrecastPinnedBase",
           select_overload<TopoDS_Shape(const precast_pinned_base_params &)>(
               &create_precast_pinned_base));
  function("createPrecastPinnedBaseWithPosition",
           select_overload<TopoDS_Shape(const precast_pinned_base_params &,
                                        const gp_Pnt &, const gp_Dir &)>(
               &create_precast_pinned_base));

  // 预制金属支撑基础参数结构体
  value_object<precast_metal_support_base_params>(
      "PrecastMetalSupportBaseParams")
      .field("H1", &precast_metal_support_base_params::H1)
      .field("H2", &precast_metal_support_base_params::H2)
      .field("H3", &precast_metal_support_base_params::H3)
      .field("H4", &precast_metal_support_base_params::H4)
      .field("b1", &precast_metal_support_base_params::b1)
      .field("b2", &precast_metal_support_base_params::b2)
      .field("B1", &precast_metal_support_base_params::B1)
      .field("B2", &precast_metal_support_base_params::B2)
      .field("L1", &precast_metal_support_base_params::L1)
      .field("L2", &precast_metal_support_base_params::L2)
      .field("S1", &precast_metal_support_base_params::S1)
      .field("S2", &precast_metal_support_base_params::S2)
      .field("n1", &precast_metal_support_base_params::n1)
      .field("n2", &precast_metal_support_base_params::n2)
      .field("HX", &precast_metal_support_base_params::HX);

  // 预制金属支撑基础创建函数
  function(
      "createPrecastMetalSupportBase",
      select_overload<TopoDS_Shape(const precast_metal_support_base_params &)>(
          &create_precast_metal_support_base));
  function(
      "createPrecastMetalSupportBaseWithPosition",
      select_overload<TopoDS_Shape(const precast_metal_support_base_params &,
                                   const gp_Pnt &, const gp_Dir &)>(
          &create_precast_metal_support_base));

  // 预制混凝土支撑基础参数结构体
  value_object<precast_concrete_support_base_params>(
      "PrecastConcreteSupportBaseParams")
      .field("H1", &precast_concrete_support_base_params::H1)
      .field("H2", &precast_concrete_support_base_params::H2)
      .field("H3", &precast_concrete_support_base_params::H3)
      .field("H4", &precast_concrete_support_base_params::H4)
      .field("H5", &precast_concrete_support_base_params::H5)
      .field("b1", &precast_concrete_support_base_params::b1)
      .field("b2", &precast_concrete_support_base_params::b2)
      .field("b3", &precast_concrete_support_base_params::b3)
      .field("B1", &precast_concrete_support_base_params::B1)
      .field("B2", &precast_concrete_support_base_params::B2)
      .field("L1", &precast_concrete_support_base_params::L1)
      .field("L2", &precast_concrete_support_base_params::L2)
      .field("S1", &precast_concrete_support_base_params::S1)
      .field("n1", &precast_concrete_support_base_params::n1);

  // 预制混凝土支撑基础创建函数
  function("createPrecastConcreteSupportBase",
           select_overload<TopoDS_Shape(
               const precast_concrete_support_base_params &)>(
               &create_precast_concrete_support_base));
  function(
      "createPrecastConcreteSupportBaseWithPosition",
      select_overload<TopoDS_Shape(const precast_concrete_support_base_params &,
                                   const gp_Pnt &, const gp_Dir &)>(
          &create_precast_concrete_support_base));

  // 输电线路参数结构体
  value_object<transmission_line_params>("TransmissionLineParams")
      .field("type", &transmission_line_params::type)
      .field("sectionalArea", &transmission_line_params::sectionalArea)
      .field("outsideDiameter", &transmission_line_params::outsideDiameter)
      .field("wireWeight", &transmission_line_params::wireWeight)
      .field("coefficientOfElasticity",
             &transmission_line_params::coefficientOfElasticity)
      .field("expansionCoefficient",
             &transmission_line_params::expansionCoefficient)
      .field("ratedStrength", &transmission_line_params::ratedStrength);

  // 输电线路创建函数
  function("createTransmissionLine",
           select_overload<TopoDS_Shape(const transmission_line_params &,
                                        const gp_Pnt &, const gp_Pnt &)>(
               &create_transmission_line));

  // 绝缘子材质枚举绑定
  enum_<insulator_material>("InsulatorMaterial")
      .value("CERAMIC", insulator_material::CERAMIC)
      .value("GLASS", insulator_material::GLASS)
      .value("COMPOSITE", insulator_material::COMPOSITE);

  // 排列方式枚举绑定
  enum_<arrangement_type>("ArrangementType")
      .value("HORIZONTAL", arrangement_type::HORIZONTAL)
      .value("VERTICAL", arrangement_type::VERTICAL);

  // 串用途枚举绑定
  enum_<application_type>("ApplicationType")
      .value("CONDUCTOR", application_type::CONDUCTOR)
      .value("GROUND_WIRE", application_type::GROUND_WIRE);

  // 串类型枚举绑定
  enum_<string_type>("StringType")
      .value("SUSPENSION", string_type::SUSPENSION)
      .value("TENSION", string_type::TENSION);

  // 复合绝缘子参数结构体绑定
  value_object<composite_insulator_params>("CompositeInsulatorParams")
      .field("majorRadius", &composite_insulator_params::majorRadius)
      .field("minorRadius", &composite_insulator_params::minorRadius)
      .field("gap", &composite_insulator_params::gap);

  // 绝缘子参数结构体绑定
  value_object<insulator_params>("InsulatorParams")
      .field("type", &insulator_params::type)
      .field("subNum", &insulator_params::subNum)
      .field("subType", &insulator_params::subType)
      .field("splitDistance", &insulator_params::splitDistance)
      .field("vAngleLeft", &insulator_params::vAngleLeft)
      .field("vAngleRight", &insulator_params::vAngleRight)
      .field("uLinkLength", &insulator_params::uLinkLength)
      .field("weight", &insulator_params::weight)
      // 金具尺寸子结构
      .field("fittingLengths", &insulator_params::fittingLengths)
      // 多联配置子结构
      .field("multiLink", &insulator_params::multiLink)
      // 绝缘子参数子结构
      .field("insulator", &insulator_params::insulator)
      // 均压环配置子结构
      .field("gradingRing", &insulator_params::gradingRing)
      // 用途类型
      .field("application", &insulator_params::application)
      .field("stringType", &insulator_params::stringType);

  // 绝缘子串创建函数
  function("createInsulatorString",
           select_overload<TopoDS_Shape(const insulator_params &)>(
               &create_insulator_string));
  function(
      "createInsulatorStringWithPosition",
      select_overload<TopoDS_Shape(const insulator_params &, const gp_Pnt &,
                                   const gp_Dir &)>(&create_insulator_string));

  // 杆件类型枚举绑定
  enum_<member_type>("MemberType")
      .value("ANGLE", member_type::ANGLE)
      .value("TUBE", member_type::TUBE)
      .value("TAPERED_TUBE", member_type::TAPERED_TUBE);

  // 挂点类型枚举绑定
  enum_<attachment_type>("AttachmentType")
      .value("GROUND_WIRE", attachment_type::GROUND_WIRE)
      .value("CONDUCTOR", attachment_type::CONDUCTOR)
      .value("JUMPER", attachment_type::JUMPER);

  // 杆塔节点结构体绑定
  value_object<pole_tower_node>("PoleTowerNode")
      .field("id", &pole_tower_node::id)
      .field("position", &pole_tower_node::position);

  // 杆塔杆件结构体绑定
  value_object<pole_tower_member>("PoleTowerMember")
      .field("id", &pole_tower_member::id)
      .field("startNodeId", &pole_tower_member::startNodeId)
      .field("endNodeId", &pole_tower_member::endNodeId)
      .field("type", &pole_tower_member::type)
      .field("specification", &pole_tower_member::specification)
      .field("material", &pole_tower_member::material)
      .field("xDirection", &pole_tower_member::xDirection)
      .field("yDirection", &pole_tower_member::yDirection)
      .field("end1Diameter", &pole_tower_member::end1Diameter)
      .field("end2Diameter", &pole_tower_member::end2Diameter)
      .field("thickness", &pole_tower_member::thickness)
      .field("sides", &pole_tower_member::sides);

  // 杆塔挂点结构体绑定
  value_object<pole_tower_attachment>("PoleTowerAttachment")
      .field("name", &pole_tower_attachment::name)
      .field("type", &pole_tower_attachment::type)
      .field("position", &pole_tower_attachment::position);

  // 杆塔接腿结构体绑定
  value_object<pole_tower_leg>("PoleTowerLeg")
      .field("id", &pole_tower_leg::id)
      .field("commonHeight", &pole_tower_leg::commonHeight)
      .field("specificHeight", &pole_tower_leg::specificHeight)
      .field("nodes", &pole_tower_leg::nodes);

  // 杆塔本体结构体绑定
  value_object<pole_tower_body>("PoleTowerBody")
      .field("id", &pole_tower_body::id)
      .field("height", &pole_tower_body::height)
      .field("nodes", &pole_tower_body::nodes)
      .field("legs", &pole_tower_body::legs);

  // 杆塔呼高结构体绑定
  value_object<pole_tower_height>("PoleTowerHeight")
      .field("value", &pole_tower_height::value)
      .field("bodyId", &pole_tower_height::bodyId)
      .field("legId", &pole_tower_height::legId);

  // 杆塔参数结构体绑定
  value_object<pole_tower_params>("PoleTowerParams")
      .field("heights", &pole_tower_params::heights)
      .field("bodies", &pole_tower_params::bodies)
      .field("members", &pole_tower_params::members)
      .field("attachments", &pole_tower_params::attachments);

  // 杆塔创建函数
  function("createPoleTower",
           select_overload<TopoDS_Shape(const pole_tower_params &)>(
               &create_pole_tower));
  function(
      "createPoleTowerWithPosition",
      select_overload<TopoDS_Shape(const pole_tower_params &, const gp_Pnt &,
                                   const gp_Dir &, const gp_Dir &)>(
          &create_pole_tower));

  // 单钩锚固参数结构体绑定
  value_object<single_hook_anchor_params>("SingleHookAnchorParams")
      .field("boltDiameter", &single_hook_anchor_params::boltDiameter)
      .field("exposedLength", &single_hook_anchor_params::exposedLength)
      .field("nutCount", &single_hook_anchor_params::nutCount)
      .field("nutHeight", &single_hook_anchor_params::nutHeight)
      .field("nutOD", &single_hook_anchor_params::nutOD)
      .field("washerCount", &single_hook_anchor_params::washerCount)
      .field("washerShape", &single_hook_anchor_params::washerShape)
      .field("washerSize", &single_hook_anchor_params::washerSize)
      .field("washerThickness", &single_hook_anchor_params::washerThickness)
      .field("anchorLength", &single_hook_anchor_params::anchorLength)
      .field("hookStraightLength",
             &single_hook_anchor_params::hookStraightLength)
      .field("hookDiameter", &single_hook_anchor_params::hookDiameter);

  // 单钩锚固创建函数
  function("createSingleHookAnchor",
           select_overload<TopoDS_Shape(const single_hook_anchor_params &)>(
               &create_single_hook_anchor));
  function("createSingleHookAnchorWithPosition",
           select_overload<TopoDS_Shape(
               const single_hook_anchor_params &, const gp_Pnt &,
               const gp_Dir &, const gp_Dir &)>(&create_single_hook_anchor));

  // 三钩锚固参数结构体绑定
  value_object<triple_hook_anchor_params>("TripleHookAnchorParams")
      .field("boltDiameter", &triple_hook_anchor_params::boltDiameter)
      .field("exposedLength", &triple_hook_anchor_params::exposedLength)
      .field("nutCount", &triple_hook_anchor_params::nutCount)
      .field("nutHeight", &triple_hook_anchor_params::nutHeight)
      .field("nutOD", &triple_hook_anchor_params::nutOD)
      .field("washerCount", &triple_hook_anchor_params::washerCount)
      .field("washerShape", &triple_hook_anchor_params::washerShape)
      .field("washerSize", &triple_hook_anchor_params::washerSize)
      .field("washerThickness", &triple_hook_anchor_params::washerThickness)
      .field("anchorLength", &triple_hook_anchor_params::anchorLength)
      .field("hookStraightLengthA",
             &triple_hook_anchor_params::hookStraightLengthA)
      .field("hookStraightLengthB",
             &triple_hook_anchor_params::hookStraightLengthB)
      .field("hookDiameter", &triple_hook_anchor_params::hookDiameter)
      .field("anchorBarDiameter",
             &triple_hook_anchor_params::anchorBarDiameter);

  // 三钩锚固创建函数
  function("createTripleHookAnchor",
           select_overload<TopoDS_Shape(const triple_hook_anchor_params &)>(
               &create_triple_hook_anchor));
  function("createTripleHookAnchorWithPosition",
           select_overload<TodoDS_Shape(
               const triple_hook_anchor_params &, const gp_Pnt &,
               const gp_Dir &, const gp_Dir &)>(&create_triple_hook_anchor));

  // 肋板锚固参数结构体绑定
  value_object<ribbed_anchor_params>("RibbedAnchorParams")
      .field("boltDiameter", &ribbed_anchor_params::boltDiameter)
      .field("exposedLength", &ribbed_anchor_params::exposedLength)
      .field("nutCount", &ribbed_anchor_params::nutCount)
      .field("nutHeight", &ribbed_anchor_params::nutHeight)
      .field("nutOD", &ribbed_anchor_params::nutOD)
      .field("washerCount", &ribbed_anchor_params::washerCount)
      .field("washerShape", &ribbed_anchor_params::washerShape)
      .field("washerSize", &ribbed_anchor_params::washerSize)
      .field("washerThickness", &ribbed_anchor_params::washerThickness)
      .field("anchorLength", &ribbed_anchor_params::anchorLength)
      .field("basePlateSize", &ribbed_anchor_params::basePlateSize)
      .field("ribTopWidth", &ribbed_anchor_params::ribTopWidth)
      .field("ribBottomWidth", &ribbed_anchor_params::ribBottomWidth)
      .field("basePlateThickness", &ribbed_anchor_params::basePlateThickness)
      .field("ribHeight", &ribbed_anchor_params::ribHeight)
      .field("ribThickness", &ribbed_anchor_params::ribThickness);

  // 肋板锚固创建函数
  function("createRibbedAnchor",
           select_overload<TopoDS_Shape(const ribbed_anchor_params &)>(
               &create_ribbed_anchor));
  function(
      "createRibbedAnchorWithPosition",
      select_overload<TopoDS_Shape(const ribbed_anchor_params &, const gp_Pnt &,
                                   const gp_Dir &, const gp_Dir &)>(
          &create_ribbed_anchor));

  // 螺帽锚固参数结构体绑定
  value_object<nut_anchor_params>("NutAnchorParams")
      .field("boltDiameter", &nut_anchor_params::boltDiameter)
      .field("exposedLength", &nut_anchor_params::exposedLength)
      .field("nutCount", &nut_anchor_params::nutCount)
      .field("nutHeight", &nut_anchor_params::nutHeight)
      .field("nutOD", &nut_anchor_params::nutOD)
      .field("washerCount", &nut_anchor_params::washerCount)
      .field("washerShape", &nut_anchor_params::washerShape)
      .field("washerSize", &nut_anchor_params::washerSize)
      .field("washerThickness", &nut_anchor_params::washerThickness)
      .field("anchorLength", &nut_anchor_params::anchorLength)
      .field("basePlateSize", &nut_anchor_params::basePlateSize)
      .field("basePlateThickness", &nut_anchor_params::basePlateThickness)
      .field("boltToPlateDistance", &nut_anchor_params::boltToPlateDistance);

  // 螺帽锚固创建函数
  function("createNutAnchor",
           select_overload<TopoDS_Shape(const nut_anchor_params &)>(
               &create_nut_anchor));
  function(
      "createNutAnchorWithPosition",
      select_overload<TopoDS_Shape(const nut_anchor_params &, const gp_Pnt &,
                                   const gp_Dir &, const gp_Dir &)>(
          &create_nut_anchor));

  // 三支锚固参数结构体绑定
  value_object<triple_arm_anchor_params>("TripleArmAnchorParams")
      .field("boltDiameter", &triple_arm_anchor_params::boltDiameter)
      .field("exposedLength", &triple_arm_anchor_params::exposedLength)
      .field("nutCount", &triple_arm_anchor_params::nutCount)
      .field("nutHeight", &triple_arm_anchor_params::nutHeight)
      .field("nutOD", &triple_arm_anchor_params::nutOD)
      .field("washerCount", &triple_arm_anchor_params::washerCount)
      .field("washerShape", &triple_arm_anchor_params::washerShape)
      .field("washerSize", &triple_arm_anchor_params::washerSize)
      .field("washerThickness", &triple_arm_anchor_params::washerThickness)
      .field("anchorLength", &triple_arm_anchor_params::anchorLength)
      .field("armDiameter", &triple_arm_anchor_params::armDiameter)
      .field("armStraightLength", &triple_arm_anchor_params::armStraightLength)
      .field("armBendLength", &triple_arm_anchor_params::armBendLength)
      .field("armBendAngle", &triple_arm_anchor_params::armBendAngle);

  // 三支锚固创建函数
  function("createTripleArmAnchor",
           select_overload<TopoDS_Shape(const triple_arm_anchor_params &)>(
               &create_triple_arm_anchor));
  function("createTripleArmAnchorWithPosition",
           select_overload<TopoDS_Shape(
               const triple_arm_anchor_params &, const gp_Pnt &, const gp_Dir &,
               const gp_Dir &)>(&create_triple_arm_anchor));

  // 定位板锚固参数结构体绑定
  value_object<positioning_plate_anchor_params>("PositioningPlateAnchorParams")
      .field("boltDiameter", &positioning_plate_anchor_params::boltDiameter)
      .field("exposedLength", &positioning_plate_anchor_params::exposedLength)
      .field("nutCount", &positioning_plate_anchor_params::nutCount)
      .field("nutHeight", &positioning_plate_anchor_params::nutHeight)
      .field("nutOD", &positioning_plate_anchor_params::nutOD)
      .field("washerCount", &positioning_plate_anchor_params::washerCount)
      .field("washerShape", &positioning_plate_anchor_params::washerShape)
      .field("washerSize", &positioning_plate_anchor_params::washerSize)
      .field("washerThickness",
             &positioning_plate_anchor_params::washerThickness)
      .field("anchorLength", &positioning_plate_anchor_params::anchorLength)
      .field("plateLength", &positioning_plate_anchor_params::plateLength)
      .field("plateThickness", &positioning_plate_anchor_params::plateThickness)
      .field("toBaseDistance", &positioning_plate_anchor_params::toBaseDistance)
      .field("toBottomDistance",
             &positioning_plate_anchor_params::toBottomDistance)
      .field("groutHoleDiameter",
             &positioning_plate_anchor_params::groutHoleDiameter);

  // 定位板锚固创建函数
  function(
      "createPositioningPlateAnchor",
      select_overload<TopoDS_Shape(const positioning_plate_anchor_params &)>(
          &create_positioning_plate_anchor));
  function("createPositioningPlateAnchorWithPosition",
           select_overload<TopoDS_Shape(const positioning_plate_anchor_params &,
                                        const gp_Pnt &, const gp_Dir &,
                                        const gp_Dir &)>(
               &create_positioning_plate_anchor));

  // 插入角钢参数结构体绑定
  value_object<stub_angle_params>("StubAngleParams")
      .field("legWidth", &stub_angle_params::legWidth)
      .field("thickness", &stub_angle_params::thickness)
      .field("slope", &stub_angle_params::slope)
      .field("exposedLength", &stub_angle_params::exposedLength)
      .field("anchorLength", &stub_angle_params::anchorLength);

  // 插入角钢创建函数
  function("createStubAngle",
           select_overload<TopoDS_Shape(const stub_angle_params &)>(
               &create_stub_angle));
  function(
      "createStubAngleWithPosition",
      select_overload<TopoDS_Shape(const stub_angle_params &, const gp_Pnt &,
                                   const gp_Dir &, const gp_Dir &)>(
          &create_stub_angle));

  // 插入钢管参数结构体绑定
  value_object<stub_tube_params>("StubTubeParams")
      .field("diameter", &stub_tube_params::diameter)
      .field("thickness", &stub_tube_params::thickness)
      .field("slope", &stub_tube_params::slope)
      .field("exposedLength", &stub_tube_params::exposedLength)
      .field("anchorLength", &stub_tube_params::anchorLength);

  // 插入钢管创建函数
  function("createStubTube",
           select_overload<TopoDS_Shape(const stub_tube_params &)>(
               &create_stub_tube));
  function(
      "createStubTubeWithPosition",
      select_overload<TopoDS_Shape(const stub_tube_params &, const gp_Pnt &,
                                   const gp_Dir &, const gp_Dir &)>(
          &create_stub_tube));

  // 电缆参数结构体绑定
  value_object<cable_wire_params>("CableWireParams")
      .field("points", &cable_wire_params::points)
      .field("outsideDiameter", &cable_wire_params::outsideDiameter);

  // 电缆创建函数
  function("createCableWire",
           select_overload<TopoDS_Shape(const cable_wire_params &)>(
               &create_cable_wire));
  function(
      "createCableWireWithPosition",
      select_overload<TopoDS_Shape(const cable_wire_params &, const gp_Pnt &,
                                   const gp_Dir &, const gp_Dir &)>(
          &create_cable_wire));

  // 电缆接头参数结构体绑定
  value_object<cable_joint_params>("CableJointParams")
      .field("length", &cable_joint_params::length)
      .field("outerDiameter", &cable_joint_params::outerDiameter)
      .field("terminalLength", &cable_joint_params::terminalLength)
      .field("innerDiameter", &cable_joint_params::innerDiameter);

  // 电缆接头创建函数
  function("createCableJoint",
           select_overload<TopoDS_Shape(const cable_joint_params &)>(
               &create_cable_joint));
  function(
      "createCableJointWithPosition",
      select_overload<TopoDS_Shape(const cable_joint_params &, const gp_Pnt &,
                                   const gp_Dir &, const gp_Dir &)>(
          &create_cable_joint));

  // 光缆接头盒参数结构体绑定
  value_object<optical_fiber_box_params>("OpticalFiberBoxParams")
      .field("length", &optical_fiber_box_params::length)
      .field("height", &optical_fiber_box_params::height)
      .field("width", &optical_fiber_box_params::width);

  // 光缆接头盒创建函数
  function("createOpticalFiberBox",
           select_overload<TopoDS_Shape(const optical_fiber_box_params &)>(
               &create_optical_fiber_box));
  function("createOpticalFiberBoxWithPosition",
           select_overload<TopoDS_Shape(
               const optical_fiber_box_params &, const gp_Pnt &, const gp_Dir &,
               const gp_Dir &)>(&create_optical_fiber_box));

  // 电缆终端参数结构体绑定
  value_object<cable_terminal_params>("CableTerminalParams")
      .field("sort", &cable_terminal_params::sort)
      .field("height", &cable_terminal_params::height)
      .field("topDiameter", &cable_terminal_params::topDiameter)
      .field("bottomDiameter", &cable_terminal_params::bottomDiameter)
      .field("tailDiameter", &cable_terminal_params::tailDiameter)
      .field("tailHeight", &cable_terminal_params::tailHeight)
      .field("skirtCount", &cable_terminal_params::skirtCount)
      .field("upperSkirtTopDiameter",
             &cable_terminal_params::upperSkirtTopDiameter)
      .field("upperSkirtBottomDiameter",
             &cable_terminal_params::upperSkirtBottomDiameter)
      .field("lowerSkirtTopDiameter",
             &cable_terminal_params::lowerSkirtTopDiameter)
      .field("lowerSkirtBottomDiameter",
             &cable_terminal_params::lowerSkirtBottomDiameter)
      .field("skirtSectionHeight", &cable_terminal_params::skirtSectionHeight)
      .field("upperTerminalLength", &cable_terminal_params::upperTerminalLength)
      .field("upperTerminalDiameter",
             &cable_terminal_params::upperTerminalDiameter)
      .field("lowerTerminalLength", &cable_terminal_params::lowerTerminalLength)
      .field("lowerTerminalDiameter",
             &cable_terminal_params::lowerTerminalDiameter)
      .field("hole1Diameter", &cable_terminal_params::hole1Diameter)
      .field("hole2Diameter", &cable_terminal_params::hole2Diameter)
      .field("hole1Distance", &cable_terminal_params::hole1Distance)
      .field("holeSpacing", &cable_terminal_params::holeSpacing)
      .field("flangeHoleDiameter", &cable_terminal_params::flangeHoleDiameter)
      .field("flangeHoleSpacing", &cable_terminal_params::flangeHoleSpacing)
      .field("flangeWidth", &cable_terminal_params::flangeWidth)
      .field("flangeCenterHoleRadius",
             &cable_terminal_params::flangeCenterHoleRadius)
      .field("flangeChamferRadius", &cable_terminal_params::flangeChamferRadius)
      .field("flangeOpeningWidth", &cable_terminal_params::flangeOpeningWidth)
      .field("flangeBoltHeight", &cable_terminal_params::flangeBoltHeight);

  // 电缆终端创建函数
  function("createCableTerminal",
           select_overload<TopoDS_Shape(const cable_terminal_params &)>(
               &create_cable_terminal));
  function("createCableTerminalWithPosition",
           select_overload<TopoDS_Shape(const cable_terminal_params &,
                                        const gp_Pnt &, const gp_Dir &)>(
               &create_cable_terminal));

  // 接地箱类型枚举绑定
  enum_<cable_box_type>("CableBoxType")
      .value("DIRECT_GROUND", cable_box_type::DIRECT_GROUND)
      .value("PROTECTIVE_GROUND", cable_box_type::PROTECTIVE_GROUND)
      .value("CROSS_INTERCONNECT", cable_box_type::CROSS_INTERCONNECT);

  // 接地箱参数结构体绑定
  value_object<cable_accessory_params>("CableAccessoryParams")
      .field("type", &cable_accessory_params::type)
      .field("length", &cable_accessory_params::length)
      .field("width", &cable_accessory_params::width)
      .field("height", &cable_accessory_params::height)
      .field("portCount", &cable_accessory_params::portCount)
      .field("portDiameter", &cable_accessory_params::portDiameter)
      .field("portSpacing", &cable_accessory_params::portSpacing)
      .field("backPanelDistance", &cable_accessory_params::backPanelDistance)
      .field("sidePanelDistance", &cable_accessory_params::sidePanelDistance);

  // 接地箱创建函数
  function("createCableAccessory",
           select_overload<TopoDS_Shape(const cable_accessory_params &)>(
               &create_cable_accessory));
  function("createCableAccessoryWithPosition",
           select_overload<TopoDS_Shape(
               const cable_accessory_params &, const gp_Pnt &, const gp_Dir &,
               const gp_Dir &)>(&create_cable_accessory));

  // 电缆支架参数结构体绑定
  value_object<cable_bracket_params>("CableBracketParams")
      .field("length", &cable_bracket_params::length)
      .field("rootHeight", &cable_bracket_params::rootHeight)
      .field("rootWidth", &cable_bracket_params::rootWidth)
      .field("width", &cable_bracket_params::width)
      .field("topThickness", &cable_bracket_params::topThickness)
      .field("rootThickness", &cable_bracket_params::rootThickness)
      .field("columnMountPoints", &cable_bracket_params::columnMountPoints)
      .field("clampMountPoints", &cable_bracket_params::clampMountPoints);

  // 电缆支架创建函数
  function("createCableBracket",
           select_overload<TopoDS_Shape(const cable_bracket_params &)>(
               &create_cable_bracket));
  function(
      "createCableBracketWithPosition",
      select_overload<TopoDS_Shape(const cable_bracket_params &, const gp_Pnt &,
                                   const gp_Dir &, const gp_Dir &)>(
          &create_cable_bracket));

  // 电缆夹具类型枚举绑定
  enum_<cable_clamp_type>("CableClampType")
      .value("SINGLE", cable_clamp_type::SINGLE)
      .value("LINEAR", cable_clamp_type::LINEAR)
      .value("CONTACT_TRIPLE", cable_clamp_type::CONTACT_TRIPLE)
      .value("SEPARATE_TRIPLE", cable_clamp_type::SEPARATE_TRIPLE);

  // 电缆夹具参数结构体绑定
  value_object<cable_clamp_params>("CableClampParams")
      .field("type", &cable_clamp_params::type)
      .field("diameter", &cable_clamp_params::diameter)
      .field("thickness", &cable_clamp_params::thickness)
      .field("width", &cable_clamp_params::width);

  // 电缆夹具创建函数
  function("createCableClamp",
           select_overload<TopoDS_Shape(const cable_clamp_params &)>(
               &create_c cable_clamp));
  function(
      "createCableClampWithPosition",
      select_overload<TopoDS_Shape(const cable_clamp_params &, const gp_Pnt &,
                                   const gp_Dir &, const gp_Dir &)>(
          &create_cable_clamp));

  // 电缆立柱参数结构体绑定
  value_object<cable_pole_params>("CablePoleParams")
      .field("specification", &cable_pole_params::specification)
      .field("length", &c cable_pole_params::length)
      .field("radius", &cable_pole_params::radius)
      .field("arcAngle", &cable_pole_params::arcAngle)
      .field("width", &cable_pole_params::width)
      .field("fixedLegLength", &cable_pole_params::fixedLegLength)
      .field("fixedLegWidth", &cable_pole_params::fixedLegWidth)
      .field("thickness", &cable_pole_params::thickness)
      .field("mountPoints", &cable_pole_params::mountPoints);

  // 电缆立柱创建函数
  function("createCablePole",
           select_overload<TopoDS_Shape(const cable_pole_params &)>(
               &create_cable_pole));
  function(
      "createCablePoleWithPosition",
      select_overload<TopoDS_Shape(const cable_pole_params &, const gp_Pnt &,
                                   const gp_Dir &)>(&create_cable_pole));

  // 接地扁铁参数结构体绑定
  value_object<ground_flat_iron_params>("GroundFlatIronParams")
      .field("length", &ground_flat_iron_params::length)
      .field("height", &ground_flat_iron_params::height)
      .field("thickness", &ground_flat_iron_params::thickness);

  // 接地扁铁创建函数
  function("createGroundFlatIron",
           select_overload<TopoDS_Shape(const ground_flat_iron_params &)>(
               &create_ground_flat_iron));
  function("createGroundFlatIronWithPosition",
           select_overload<TopoDS_Shape(
               const ground_flat_iron_params &, const gp_Pnt &, const gp_Dir &,
               const gp_Dir &)>(&create_ground_flat_iron));

  // 预埋件参数结构体绑定
  value_object<embedded_part_params>("EmbeddedPartParams")
      .field("length", &embedded_part_params::length)
      .field("radius", &embedded_part_params::radius)
      .field("height", &embedded_part_params::height)
      .field("materialRadius", &embedded_part_params::materialRadius)
      .field("lowerLength", &embedded_part_params::lowerLength);

  // 预埋件创建函数
  function("createEmbeddedPart",
           select_overload<TopoDS_Shape(const embedded_part_params &)>(
               &create_embedded_part));
  function(
      "createEmbeddedPartWithPosition",
      select_overload<TopoDS_Shape(const embedded_part_params &, const gp_Pnt &,
                                   const gp_Dir &, const gp_Dir &)>(
          &create_embedded_part));

  // U型环参数结构体绑定
  value_object<u_shaped_ring_params>("UShapedRingParams")
      .field("thickness", &u_shaped_ring_params::thickness)
      .field("height", &u_shaped_ring_params::height)
      .field("radius", &u_shaped_ring_params::radius)
      .field("length", &u_shaped_ring_params::length);

  // U型环创建函数
  function("createUShapedRing",
           select_overload<TopoDS_Shape(const u_shaped_ring_params &)>(
               &create_u_shaped_ring));
  function(
      "createUShapedRingWithPosition",
      select_overload<TopoDS_Shape(const u_shaped_ring_params &, const gp_Pnt &,
                                   const gp_Dir &, const gp_Dir &)>(
          &create_u_shaped_ring));

  // 吊环参数结构体绑定
  value_object<lifting_eye_params>("LiftingEyeParams")
      .field("height", &lifting_eye_params::height)
      .field("ringRadius", &lifting_eye_params::ringRadius)
      .field("pipeDiameter", &lifting_eye_params::pipeDiameter);

  // 吊环创建函数
  function("createLiftingEye",
           select_overload<TopoDS_Shape(const lifting_eye_params &)>(
               &create_lifting_eye));
  function(
      "createLiftingEyeWithPosition",
      select_overload<TopoDS_Shape(const lifting_eye_params &, const gp_Pnt &,
                                   const gp_Dir &, const gp_Dir &)>(
          &create_lifting_eye));

  // 连接段截面样式枚举绑定
  enum_<connection_section_style>("ConnectionSectionStyle")
      .value("RECTANGULAR", connection_section_style::RECTANGULAR)
      .value("HORSESHOE", connection_section_style::HORSESHOE)
      .value("CIRCULAR", connection_section_style::CIRCULAR);

  // 井类型枚举绑定
  enum_<tunnel_well_type>("TunnelWellType")
      .value("STRAIGHT", tunnel_well_type::STRAIGHT)
      .value("STRAIGHT_TUNNEL", tunnel_well_type::STRAIGHT_TUNNEL);

  // 转角井参数结构体绑定
  value_object<corner_well_params>("CornerWellParams")
      .field("leftLength", &corner_well_params::leftLength)
      .field("rightLength", &corner_well_params::rightLength)
      .field("width", &corner_well_params::width)
      .field("height", &corner_well_params::height)
      .field("topThickness", &corner_well_params::topThickness)
      .field("bottomThickness", &corner_well_params::bottomThickness)
      .field("wallThickness", &corner_well_params::wallThickness)
      .field("angle", &corner_well_params::angle)
      .field("cornerRadius", &corner_well_params::cornerRadius)
      .field("cushionExtension", &corner_well_params::cushionExtension)
      .field("cushionThickness", &corner_well_params::cushionThickness);

  // 转角井创建函数
  function("createCornerWell",
           select_overload<TopoDS_Shape(const corner_well_params &)>(
               &create_corner_well));
  function(
      "createCornerWellWithPosition",
      select_overload<TopoDS_Shape(const corner_well_params &, const gp_Pnt &,
                                   const gp_Dir &, const gp_Dir &)>(
          &create_corner_well));

  // 隧道井参数结构体绑定
  value_object<tunnel_well_params>("TunnelWellParams")
      .field("type", &tunnel_well_params::type)
      .field("length", &tunnel_well_params::length)
      .field("width", &tunnel_well_params::width)
      .field("height", &tunnel_well_params::height)
      .field("radius", &tunnel_well_params::radius)
      .field("topThickness", &tunnel_well_params::topThickness)
      .field("bottomThickness", &tunnel_well_params::bottomThickness)
      .field("leftSectionType", &tunnel_well_params::leftSectionType)
      .field("leftLength", &tunnel_well_params::leftLength)
      .field("leftWidth", &tunnel_well_params::leftWidth)
      .field("leftHeight", &tunnel_well_params::leftHeight)
      .field("leftArcHeight", &tunnel_well_params::leftArcHeight)
      .field("rightSectionType", &tunnel_well_params::rightSectionType)
      .field("rightLength", &tunnel_well_params::rightLength)
      .field("rightWidth", &tunnel_well_params::rightWidth)
      .field("rightHeight", &tunnel_well_params::rightHeight)
      .field("rightArcHeight", &tunnel_well_params::rightArcHeight)
      .field("outerWallThickness", &tunnel_well_params::outerWallThickness)
      .field("innerWallThickness", &tunnel_well_params::innerWallThickness)
      .field("cushionExtension", &tunnel_well_params::cushionExtension)
      .field("cushionThickness", &tunnel_well_params::cushionThickness);

  // 隧道井创建函数
  function("createTunnelWell",
           select_overload<TopoDS_Shape(const tunnel_well_params &)>(
               &create_tunnel_well));
  function(
      "createTunnelWellWithPosition",
      select_overload<TopoDS_Shape(const tunnel_well_params &, const gp_Pnt &,
                                   const gp_Dir &, const gp_Dir &)>(
          &create_tunnel_well));

  // 三通井类型枚举绑定
  enum_<three_way_well_type>("ThreeWayWellType")
      .value("WORKING_WELL", three_way_well_type::WORKING_WELL)
      .value("OPEN_CUT_TUNNEL", three_way_well_type::OPEN_CUT_TUNNEL)
      .value("UNDERGROUND_TUNNEL", three_way_well_type::UNDERGROUND_TUNNEL);

  // 转角样式枚举绑定
  enum_<corner_style>("CornerStyle")
      .value("ROUNDED", corner_style::ROUNDED)
      .value("ANGLED", corner_style::ANGLED);

  // 竖井样式枚举绑定
  enum_<shaft_style>("ShaftStyle")
      .value("CIRCULAR", shaft_style::CIRCULAR)
      .value("RECTANGULAR", shaft_style::RECTANGULAR);

  // 三通井参数结构体绑定
  value_object<three_way_well_params>("ThreeWayWellParams")
      .field("type", &three_way_well_params::type)
      .field("cornerType", &three_way_well_params::cornerType)
      .field("shaftType", &three_way_well_params::shaftType)
      .field("length", &three_way_well_params::length)
      .field("width", &three_way_well_params::width)
      .field("height", &three_way_well_params::height)
      .field("shaftRadius", &three_way_well_params::shaftRadius)
      .field("cornerRadius", &three_way_well_params::cornerRadius)
      .field("cornerLength", &three_way_well_params::cornerLength)
      .field("cornerWidth", &three_way_well_params::cornerWidth)
      .field("angle", &three_way_well_params::angle)
      .field("branchLength", &three_way_well_params::branchLength)
      .field("branchLeftLength", &three_way_well_params::branchLeftLength)
      .field("branchWidth", &three_way_well_params::branchWidth)
      .field("topThickness", &three_way_well_params::topThickness)
      .field("bottomThickness", &three_way_well_params::bottomThickness)
      .field("leftSectionStyle", &three_way_well_params::leftSectionStyle)
      .field("leftSectionLength", &three_way_well_params::leftSectionLength)
      .field("leftSectionWidth", &three_way_well_params::leftSectionWidth)
      .field("leftSectionHeight", &three_way_well_params::leftSectionHeight)
      .field("leftSectionArcHeight",
             &three_way_well_params::leftSectionArcHeight)
      .field("rightSectionStyle", &three_way_well_params::rightSectionStyle)
      .field("rightSectionLength", &three_way_well_params::rightSectionLength)
      .field("rightSectionWidth", &three_way_well_params::rightSectionWidth)
      .field("rightSectionHeight", &three_way_well_params::rightSectionHeight)
      .field("rightSectionArcHeight",
             &three_way_well_params::rightSectionArcHeight)
      .field("branchSectionStyle", &three_way_well_params::branchSectionStyle)
      .field("branchSectionLength", &three_way_well_params::branchSectionLength)
      .field("branchSectionWidth", &three_way_well_params::branchSectionWidth)
      .field("branchSectionHeight", &three_way_well_params::branchSectionHeight)
      .field("branchSectionArcHeight",
             &three_way_well_params::branchSectionArcHeight)
      .field("outerWallThickness", &three_way_well_params::outerWallThickness)
      .field("innerWallThickness", &three_way_well_params::innerWallThickness)
      .field("isDoubleShaft", &three_way_well_params::isDoubleShaft)
      .field("doubleShaftSpacing", &three_way_well_params::doubleShaftSpacing)
      .field("outerWallExtension", &three_way_well_params::outerWallExtension)
      .field("innerWallExtension", &three_way_well_params::innerWallExtension)
      .field("cushionExtension", &three_way_well_params::cushionExtension)
      .field("cushionThickness", &three_way_well_params::cushionThickness)
      .field("innerBottomThickness",
             &three_way_well_params::innerBottomThickness)
      .field("outerBottomThickness",
             &three_way_well_params::outerBottomThickness);

  // 三通井创建函数
  function("createThreeWayWell",
           select_overload<TopoDS_Shape(const three_way_well_params &)>(
               &create_three_way_well));
  function("createThreeWayWellWithPosition",
           select_overload<TopoDS_Shape(
               const three_way_well_params &, const gp_Pnt &, const gp_Dir &,
               const gp_Dir &)>(&create_three_way_well));

  // 四通井类型枚举绑定
  enum_<four_way_well_type>("FourWayWellType")
      .value("WORKING_WELL", four_way_well_type::WORKING_WELL)
      .value("OPEN_CUT_TUNNEL", four_way_well_type::OPEN_CUT_TUNNEL)
      .value("UNDERGROUND_TUNNEL", four_way_well_type::UNDERGROUND_TUNNEL);

  // 四通井参数结构体绑定
  value_object<four_way_well_params>("FourWayWellParams")
      .field("type", &four_way_well_params::type)
      .field("length", &four_way_well_params::length)
      .field("width", &four_way_well_params::width)
      .field("height", &four_way_well_params::height)
      .field("shaftRadius", &four_way_well_params::shaftRadius)
      .field("cornerStyle", &four_way_well_params::cornerStyle)
      .field("cornerRadius", &four_way_well_params::cornerRadius)
      .field("cornerLength", &four_way_well_params::cornerLength)
      .field("cornerWidth", &four_way_well_params::cornerWidth)
      .field("branchLength", &four_way_well_params::branchLength)
      .field("branchWidth", &four_way_well_params::branchWidth)
      .field("topThickness", &four_way_well_params::topThickness)
      .field("bottomThickness", &four_way_well_params::bottomThickness)
      .field("leftSection", &four_way_well_params::leftSection)
      .field("rightSection", &four_way_well_params::rightSection)
      .field("branchSection1", &four_way_well_params::branchSection1)
      .field("branchSection2", &four_way_well_params::branchSection2)
      .field("outerWallThickness", &four_way_well_params::outerWallThickness)
      .field("innerWallThickness", &four_way_well_params::innerWallThickness)
      .field("cushionExtension", &four_way_well_params::cushionExtension)
      .field("cushionThickness", &four_way_well_params::cushionThickness);

  // 四通井创建函数
  function("createFourWayWell",
           select_overload<TopoDS_Shape(const four_way_well_params &)>(
               &create_four_way_well));
  function(
      "createFourWayWellWithPosition",
      select_overload<TopoDS_Shape(const four_way_well_params &, const gp_Pnt &,
                                   const gp_Dir &, const gp_Dir &)>(
          &create_four_way_well));

  // 通道点结构体绑定
  value_object<channel_point>("ChannelPoint")
      .field("position", &channel_point::position)
      .field("type", &channel_point::type);

  // 桥架样式枚举绑定
  enum_<cable_tray_style>("CableTrayStyle")
      .value("ARCH", cable_tray_style::ARCH)
      .value("BEAM", cable_tray_style::BEAM);

  // 排管参数结构体绑定
  value_object<pipe_row_params>("PipeRowParams")
      .field("pipeType", &pipe_row_params::pipeType)
      .field("hasEnclosure", &pipe_row_params::hasEnclosure)
      .field("enclosureWidth", &pipe_row_params::enclosureWidth)
      .field("enclosureHeight", &pipe_row_params::enclosureHeight)
      .field("baseExtension", &pipe_row_params::baseExtension)
      .field("baseThickness", &pipe_row_params::baseThickness)
      .field("cushionExtension", &pipe_row_params::cushionExtension)
      .field("cushionThickness", &pipe_row_params::cushionThickness)
      .field("pipePositions", &pipe_row_params::pipePositions)
      .field("pipeInnerDiameters", &pipe_row_params::pipeInnerDiameters)
      .field("pipeWallThicknesses", &pipe_row_params::pipeWallThicknesses)
      .field("pullPipeInnerDiameter", &pipe_row_params::pullPipeInnerDiameter)
      .field("pullPipeThickness", &pipe_row_params::pullPipeThickness)
      .field("points", &pipe_row_params::points);

  // 排管创建函数
  function(
      "createPipeRow",
      select_overload<TopoDS_Shape(const pipe_row_params &)>(&create_pipe_row));
  function("createPipeRowWithPosition",
           select_overload<TopoDS_Shape(const pipe_row_params &, const gp_Pnt &,
                                        const gp_Dir &, const gp_Dir &)>(
               &create_pipe_row));

  // 电缆沟参数结构体绑定
  value_object<cable_trench_params>("CableTrenchParams")
      .field("width", &cable_trench_params::width)
      .field("height", &cable_trench_params::height)
      .field("coverWidth", &cable_trench_params::coverWidth)
      .field("coverThickness", &cable_trench_params::coverThickness)
      .field("baseExtension", &cable_trench_params::baseExtension)
      .field("baseThickness", &cable_trench_params::baseThickness)
      .field("cushionExtension", &cable_trench_params::cushionExtension)
      .field("cushionThickness", &cable_trench_params::cushionThickness)
      .field("wallThickness", &cable_trench_params::wallThickness)
      .field("wallThickness2", &cable_trench_params::wallThickness2)
      .field("points", &c cable_trench_params::points);

  // 电缆沟创建函数
  function("createCableTrench",
           select_overload<TopoDS_Shape(const cable_trench_params &)>(
               &create_cable_trench));
  function(
      "createCableTrenchWithPosition",
      select_overload<TopoDS_Shape(const cable_trench_params &, const gp_Pnt &,
                                   const gp_Dir &, const gp_Dir &)>(
          &create_cable_trench));

  // 电缆隧道参数结构体绑定
  value_object<cable_tunnel_params>("CableTunnelParams")
      .field("style", &cable_tunnel_params::style)
      .field("width", &cable_tunnel_params::width)
      .field("height", &cable_tunnel_params::height)
      .field("topThickness", &cable_tunnel_params::topThickness)
      .field("bottomThickness", &cable_tunnel_params::bottomThickness)
      .field("outerWallThickness", &cable_tunnel_params::outerWallThickness)
      .field("innerWallThickness", &cable_tunnel_params::innerWallThickness)
      .field("arcHeight", &cable_tunnel_params::arcHeight)
      .field("bottomPlatformHeight", &cable_tunnel_params::bottomPlatformHeight)
      .field("cushionExtension", &cable_tunnel_params::cushionExtension)
      .field("cushionThickness", &cable_tunnel_params::cushionThickness)
      .field("points", &cable_tunnel_params::points);

  // 电缆隧道创建函数
  function("createCableTunnel",
           select_overload<TopoDS_Shape(const cable_tunnel_params &)>(
               &create_cable_tunnel));
  function(
      "createCableTunnelWithPosition",
      select_overload<TopoDS_Shape(const cable_tunnel_params &, const gp_Pnt &,
                                   const gp_Dir &, const gp_Dir &)>(
          &create_cable_tunnel));

  // 电缆桥架参数结构体绑定
  value_object<cable_tray_params>("CableTrayParams")
      .field("style", &cable_tray_params::style)
      .field("columnDiameter", &cable_tray_params::columnDiameter)
      .field("columnHeight", &cable_tray_params::columnHeight)
      .field("span", &cable_tray_params::span)
      .field("width", &cable_tray_params::width)
      .field("height", &cable_tray_params::height)
      .field("topPlateHeight", &cable_tray_params::topPlateHeight)
      .field("arcHeight", &cable_tray_params::arcHeight)
      .field("wallThickness", &cable_tray_params::wallThickness)
      .field("pipeCount", &cable_tray_params::pipeCount)
      .field("pipePositions", &cable_tray_params::pipePositions)
      .field("pipeInnerDiameters", &cable_tray_params::pipeInnerDiameters)
      .field("pipeWallThicknesses", &cable_tray_params::pipeWallThicknesses)
      .field("hasProtectionPlate", &cable_tray_params::hasProtectionPlate)
      .field("points", &cable_tray_params::points);

  // 电缆桥架创建函数
  function("createCableTray",
           select_overload<TopoDS_Shape(const cable_tray_params &)>(
               &create_cable_tray));
  function(
      "createCableTrayWithPosition",
      select_overload<TopoDS_Shape(const cable_tray_params &, const gp_Pnt &,
                                   const gp_Dir &, const gp_Dir &)>(
          &create_cable_tray));

  // 电缆L型梁参数结构体绑定
  value_object<cable_L_beam_params>("CableLBeamParams")
      .field("length", &cable_L_beam_params::length)
      .field("width", &cable_L_beam_params::width)
      .field("height", &cable_L_beam_params::height);

  // 电缆L型梁创建函数
  function("createCableLBeam",
           select_overload<TopoDS_Shape(const cable_L_beam_params &)>(
               &create_cable_L_beam));
  function(
      "createCableLBeamWithPosition",
      select_overload<TopoDS_Shape(const cable_L_beam_params &, const gp_Pnt &,
                                   const gp_Dir &, const gp_Dir &)>(
          &create_cable_L_beam));

  // 人孔样式枚举绑定
  enum_<manhole_style>("ManholeStyle")
      .value("CIRCULAR", manhole_style::CIRCULAR)
      .value("RECTANGULAR", manhole_style::RECTANGULAR);

  // 人孔参数结构体绑定
  value_object<manhole_params>("ManholeParams")
      .field("style", &manhole_params::style)
      .field("length", &manhole_params::length)
      .field("width", &manhole_params::width)
      .field("height", &manhole_params::height)
      .field("wallThickness", &manhole_params::wallThickness);

  // 人孔创建函数
  function(
      "createManhole",
      select_overload<TopoDS_Shape(const manhole_params &)>(&create_manhole));
  function("createManholeWithPosition",
           select_overload<TopoDS_Shape(const manhole_params &, const gp_Pnt &,
                                        const gp_Dir &, const gp_Dir &)>(
               &create_manhole));

  // 井盖样式枚举绑定
  enum_<manhole_cover_style>("ManholeCoverStyle")
      .value("CIRCULAR", manhole_cover_style::CIRCULAR)
      .value("RECTANGULAR", manhole_cover_style::RECTANGULAR);

  // 井盖参数结构体绑定
  value_object<manhole_cover_params>("ManholeCoverParams")
      .field("style", &manhole_cover_params::style)
      .field("length", &manhole_cover_params::length)
      .field("width", &manhole_cover_params::width)
      .field("thickness", &manhole_cover_params::thickness);

  // 井盖创建函数
  function("createManholeCover",
           select_overload<TopoDS_Shape(const manhole_cover_params &)>(
               &create_manhole_cover));
  function(
      "createManholeCoverWithPosition",
      select_overload<TopoDS_Shape(const manhole_cover_params &, const gp_Pnt &,
                                   const gp_Dir &, const gp_Dir &)>(
          &create_manhole_cover));

  // 爬梯参数结构体绑定
  value_object<ladder_params>("LadderParams")
      .field("length", &ladder_params::length)
      .field("width", &ladder_params::width)
      .field("thickness", &ladder_params::thickness);

  // 爬梯创建函数
  function("createLadder", select_overload<TopoDS_Shape(const ladder_params &)>(
                               &create_ladder));
  function("createLadderWithPosition",
           select_overload<TopoDS_Shape(const ladder_params &, const gp_Pnt &,
                                        const gp_Dir &, const gp_Dir &)>(
               &create_ladder));

  // 集水坑参数结构体绑定
  value_object<sump_params>("SumpParams")
      .field("length", &sump_params::length)
      .field("width", &sump_params::width)
      .field("depth", &sump_params::depth)
      .field("bottomThickness", &sump_params::bottomThickness);

  // 集水坑创建函数
  function("createSump",
           select_overload<TopoDS_Shape(const sump_params &)>(&create_sump));
  function("createSumpWithPosition",
           select_overload<TopoDS_Shape(const sump_params &, const gp_Pnt &,
                                        const gp_Dir &, const gp_Dir &)>(
               &create_sump));

  // 步道参数结构体绑定
  value_object<footpath_params>("FootpathParams")
      .field("height", &footpath_params::height)
      .field("width", &footpath_params::width)
      .field("points", &footpath_params::points);

  // 步道创建函数
  function(
      "createFootpath",
      select_overload<TopoDS_Shape(const footpath_params &)>(&create_footpath));
  function("createFootpathWithPosition",
           select_overload<TopoDS_Shape(const footpath_params &, const gp_Pnt &,
                                        const gp_Dir &, const gp_Dir &)>(
               &create_footpath));

  // 竖井参数结构体绑定
  value_object<shaft_chamber_params>("ShaftChamberParams")
      .field("supportWallThickness",
             &shaft_chamber_params::supportWallThickness)
      .field("supportDiameter", &shaft_chamber_params::supportDiameter)
      .field("supportHeight", &shaft_chamber_params::supportHeight)
      .field("topThickness", &shaft_chamber_params::topThickness)
      .field("innerDiameter", &shaft_chamber_params::innerDiameter)
      .field("workingHeight", &shaft_chamber_params::workingHeight)
      .field("outerWallThickness", &shaft_chamber_params::outerWallThickness)
      .field("innerWallThickness", &shaft_chamber_params::innerWallThickness);

  // 竖井创建函数
  function("createShaftChamber",
           select_overload<TopoDS_Shape(const shaft_chamber_params &)>(
               &create_shaft_chamber));
  function(
      "createShaftChamberWithPosition",
      select_overload<TopoDS_Shape(const shaft_chamber_params &, const gp_Pnt &,
                                   const gp_Dir &, const gp_Dir &)>(
          &create_shaft_chamber));

  // 隧道隔板参数结构体绑定
  value_object<tunnel_compartment_partition_params>(
      "TunnelCompartmentPartitionParams")
      .field("width", &tunnel_compartment_partition_params::width)
      .field("thickness", &tunnel_compartment_partition_params::thickness);

  // 隧道隔板创建函数
  function("createTunnelCompartmentPartition",
           select_overload<TopoDS_Shape(
               const tunnel_compartment_partition_params &)>(
               &create_tunnel_compartment_partition));
  function("createTunnelCompartmentPartitionWithPosition",
           select_overload<TopoDS_Shape(
               const tunnel_compartment_partition_params &, const gp_Pnt &,
               const gp_Dir &, const gp_Dir &)>(
               &create_tunnel_compartment_partition));

  // 隧道分区板参数结构体绑定
  value_object<tunnel_partition_board_params>("TunnelPartitionBoardParams")
      .field("style", &tunnel_partition_board_params::style)
      .field("length", &tunnel_partition_board_params::length)
      .field("width", &tunnel_partition_board_params::width)
      .field("thickness", &tunnel_partition_board_params::thickness)
      .field("holeCount", &tunnel_partition_board_params::holeCount)
      .field("holePositions", &tunnel_partition_board_params::holePositions)
      .field("holeStyles", &tunnel_partition_board_params::holeStyles)
      .field("holeDiameters", &tunnel_partition_board_params::holeDiameters)
      .field("holeWidths", &tunnel_partition_board_params::holeWidths);

  // 隧道分区板创建函数
  function("createTunnelPartitionBoard",
           select_overload<TopoDS_Shape(const tunnel_partition_board_params &)>(
               &create_tunnel_partition_board));
  function("createTunnelPartitionBoardWithPosition",
           select_overload<TopoDS_Shape(const tunnel_partition_board_params &,
                                        const gp_Pnt &, const gp_Dir &,
                                        const gp_Dir &)>(
               &create_tunnel_partition_board));

  // 风亭参数结构体绑定
  value_object<ventilation_pavilion_params>("VentilationPavilionParams")
      .field("topLength", &ventilation_pavilion_params::topLength)
      .field("middleLength", &ventilation_pavilion_params::middleLength)
      .field("bottomLength", &ventilation_pavilion_params::bottomLength)
      .field("topWidth", &ventilation_pavilion_params::topWidth)
      .field("middleWidth", &ventilation_pavilion_params::middleWidth)
      .field("bottomWidth", &ventilation_pavilion_params::bottomWidth)
      .field("topHeight", &ventilation_pavilion_params::topHeight)
      .field("height", &ventilation_pavilion_params::height)
      .field("baseHeight", &ventilation_pavilion_params::baseHeight);

  // 风亭创建函数
  function("createVentilationPavilion",
           select_overload<TopoDS_Shape(const ventilation_pavilion_params &)>(
               &create_ventilation_pavilion));
  function("createVentilationPavilionWithPosition",
           select_overload<TopoDS_Shape(
               const ventilation_pavilion_params &, const gp_Pnt &,
               const gp_Dir &, const gp_Dir &)>(&create_ventilation_pavilion));

  // 直通风管参数结构体绑定
  value_object<straight_ventilation_duct_params>(
      "StraightVentilationDuctParams")
      .field("diameter", &straight_ventilation_duct_params::diameter)
      .field("wallThickness", &straight_ventilation_duct_params::wallThickness)
      .field("height", &straight_ventilation_duct_params::height);

  // 直通风管创建函数
  function(
      "createStraightVentilationDuct",
      select_overload<TopoDS_Shape(const straight_ventilation_duct_params &)>(
          &create_straight_ventilation_duct));
  function(
      "createStraightVentilationDuctWithPosition",
      select_overload<TopoDS_Shape(
          const straight_ventilation_duct_params &, const gp_Pnt &,
          const gp_Dir &, const gp_Dir &)>(&create_straight_ventilation_duct));

  // 斜通风管参数结构体绑定
  value_object<oblique_ventilation_duct_params>("ObliqueVentilationDuctParams")
      .field("hoodRoomLength", &oblique_ventilation_duct_params::hoodRoomLength)
      .field("hoodRoomWidth", &oblique_ventilation_duct_params::hoodRoomWidth)
      .field("hoodRoomHeight", &oblique_ventilation_duct_params::hoodRoomHeight)
      .field("hoodWallThickness",
             &oblique_ventilation_duct_params::hoodWallThickness)
      .field("ductCenterHeight",
             &oblique_ventilation_duct_params::ductCenterHeight)
      .field("ductLeftDistance",
             &oblique_ventilation_duct_params::ductLeftDistance)
      .field("ductDiameter", &oblique_ventilation_duct_params::ductDiameter)
      .field("ductWallThickness",
             &oblique_ventilation_duct_params::ductWallThickness)
      .field("ductLength", &oblique_ventilation_duct_params::ductLength)
      .field("ductHeightDifference",
             &oblique_ventilation_duct_params::ductHeightDifference)
      .field("baseLength", &oblique_ventilation_duct_params::baseLength)
      .field("baseWidth", &oblique_ventilation_duct_params::baseWidth)
      .field("baseHeight", &oblique_ventilation_duct_params::baseHeight)
      .field("baseRoomLength", &oblique_ventilation_duct_params::baseRoomLength)
      .field("baseRoomWallThickness",
             &oblique_ventilation_duct_params::baseRoomWallThickness)
      .field("baseRoomWidth", &oblique_ventilation_duct_params::baseRoomWidth)
      .field("baseRoomHeight",
             &oblique_ventilation_duct_params::baseRoomHeight);

  // 斜通风管创建函数
  function(
      "createObliqueVentilationDuct",
      select_overload<TopoDS_Shape(const oblique_ventilation_duct_params &)>(
          &create_oblique_ventilation_duct));
  function("createObliqueVentilationDuctWithPosition",
           select_overload<TopoDS_Shape(const oblique_ventilation_duct_params &,
                                        const gp_Pnt &, const gp_Dir &,
                                        const gp_Dir &)>(
               &create_oblique_ventilation_duct));

  // 排水井参数结构体绑定
  value_object<drainage_well_params>("DrainageWellParams")
      .field("length", &drainage_well_params::length)
      .field("width", &drainage_well_params::width)
      .field("height", &drainage_well_params::height)
      .field("neckDiameter", &drainage_well_params::neckDiameter)
      .field("neckHeight", &drainage_well_params::neckHeight)
      .field("cushionExtension", &drainage_well_params::cushionExtension)
      .field("bottomThickness", &drainage_well_params::bottomThickness)
      .field("wallThickness", &drainage_well_params::wallThickness);

  // 排水井创建函数
  function("createDrainageWell",
           select_overload<TopoDS_Shape(const drainage_well_params &)>(
               &create_drainage_well));
  function(
      "createDrainageWellWithPosition",
      select_overload<TopoDS_Shape(const drainage_well_params &, const gp_Pnt &,
                                   const gp_Dir &, const gp_Dir &)>(
          &create_drainage_well));

  // 管枕参数结构体绑定
  value_object<pipe_support_params>("PipeSupportParams")
      .field("style", &pipe_support_params::style)
      .field("count", &pipe_support_params::count)
      .field("positions", &pipe_support_params::positions)
      .field("radii", &pipe_support_params::radii)
      .field("length", &pipe_support_params::length)
      .field("width", &pipe_support_params::width)
      .field("height", &pipe_support_params::height);

  // 管枕创建函数
  function("createPipeSupport",
           select_overload<TopoDS_Shape(const pipe_support_params &)>(
               &create_pipe_support));
  function(
      "createPipeSupportWithPosition",
      select_overload<TopoDS_Shape(const pipe_support_params &, const gp_Pnt &,
                                   const gp_Dir &, const gp_Dir &)>(
          &create_pipe_support));

  // 盖板参数结构体绑定
  value_object<cover_plate_params>("CoverPlateParams")
      .field("style", &cover_plate_params::style)
      .field("length", &cover_plate_params::length)
      .field("width", &cover_plate_params::width)
      .field("smallRadius", &cover_plate_params::smallRadius)
      .field("largeRadius", &cover_plate_params::largeRadius)
      .field("thickness", &cover_plate_params::thickness);

  // 盖板创建函数
  function("createCoverPlate",
           select_overload<TopoDS_Shape(const cover_plate_params &)>(
               &create_cover_plate));
  function(
      "createCoverPlateWithPosition",
      select_overload<TopoDS_Shape(const cover_plate_params &, const gp_Pnt &,
                                   const gp_Dir &, const gp_Dir &)>(
          &create_cover_plate));

  // 槽盒参数结构体绑定
  value_object<cable_ray_params>("CableRayParams")
      .field("outerLength", &cable_ray_params::outerLength)
      .field("outerHeight", &cable_ray_params::outerHeight)
      .field("innerLength", &cable_ray_params::innerLength)
      .field("innerHeight", &cable_ray_params::innerHeight)
      .field("coverThickness", &cable_ray_params::coverThickness);

  // 槽盒创建函数
  function("createCableRay",
           select_overload<TopoDS_Shape(const cable_ray_params &)>(
               &create_cable_ray));
  function(
      "createCableRayWithPosition",
      select_overload<TopoDS_Shape(const cable_ray_params &, const gp_Pnt &,
                                   const gp_Dir &, const gp_Dir &)>(
          &create_cable_ray));

  // 水隧道截面样式枚举绑定
  enum_<water_tunnel_section_style>("WaterTunnelSectionStyle")
      .value("RECTANGULAR", water_tunnel_section_style::RECTANGULAR)
      .value("CITYOPENING", water_tunnel_section_style::CITYOPENING)
      .value("CIRCULAR", water_tunnel_section_style::CIRCULAR)
      .value("HORSESHOE", water_tunnel_section_style::HORSESHOE);

  // 水隧道参数结构体绑定
  value_object<water_tunnel_params>("WaterTunnelParams")
      .field("style", &water_tunnel_params::style)
      .field("width", &water_tunnel_params::width)
      .field("height", &water_tunnel_params::height)
      .field("topThickness", &water_tunnel_params::topThickness)
      .field("bottomThickness", &water_tunnel_params::bottomThickness)
      .field("outerWallThickness", &water_tunnel_params::outerWallThickness)
      .field("innerWallThickness", &water_tunnel_params::innerWallThickness)
      .field("arcHeight", &water_tunnel_params::arcHeight)
      .field("arcRadius", &water_tunnel_params::arcRadius)
      .field("arcAngle", &water_tunnel_params::arcAngle)
      .field("bottomPlatformHeight", &water_tunnel_params::bottomPlatformHeight)
      .field("cushionExtension", &water_tunnel_params::cushionExtension)
      .field("cushionThickness", &water_tunnel_params::cushionThickness)
      .field("points", &water_tunnel_params::points);

  // 水隧道创建函数
  function("createWaterTunnel",
           select_overload<TopoDS_Shape(const water_tunnel_params &)>(
               &create_water_tunnel));
  function(
      "createWaterTunnelWithPosition",
      select_overload<TopoDS_Shape(const water_tunnel_params &, const gp_Pnt &,
                                   const gp_Dir &, const gp_Dir &)>(
          &create_water_tunnel));
}