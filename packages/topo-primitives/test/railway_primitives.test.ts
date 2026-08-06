// 52 个铁路 Primitive 类冒烟: setDefault -> build -> shape 非 null / bbox 有限
// 固化 go-topo/.cache/smoke_railway_wasm{,_2}.mjs 覆盖的绑定成果 (经由 TS Primitive 类层)
import { beforeAll, describe, expect, it } from "vitest";
import {
    AnchorFittingPrimitive, ArresterPrimitive, AuxBracketPrimitive, AuxiliaryWirePrimitive,
    BalanceWeightPrimitive, BallastPrimitive, CantileverBasePrimitive, CantileverBracePrimitive,
    ConcreteMastPrimitive, ContactWirePrimitive, CrossArmPrimitive, CrossingPrimitive,
    CurvedArmPrimitive, CurveTrackPrimitive, DisconnectorPrimitive, DropperPrimitive,
    FastenerPrimitive, FrogPrimitive, GuardRailPrimitive, GuyWirePrimitive,
    HangerPostPrimitive, HeadSpanPrimitive, LevelCantileverPrimitive, MastAssemblyPrimitive,
    MastBracketPrimitive, MessengerWirePrimitive, MWSaddlePrimitive, OcsFoundationPrimitive,
    PortalFramePrimitive, PositioningCablePrimitive, PulleyCompensatorPrimitive,
    RailPairPrimitive, RailPrimitive, RatchetCompensatorPrimitive, RegArmBracketPrimitive,
    RegistrationArmPrimitive, RetarderPointPrimitive, RodInsulatorPrimitive, SleeperLayoutPrimitive,
    SleeperPrimitive, SleeveConnectorPrimitive, SleeveEarPrimitive, SlantCantileverPrimitive,
    SteelMastPrimitive, StraightTrackPrimitive, SuspensionHardSpanPrimitive, SwitchRailPrimitive,
    TrackSlabPrimitive, TransverseSpanPrimitive, TurnoutPrimitive, WeightRodPrimitive,
    WeightStackPrimitive,
} from "../lib/railway/index";
import { checkShape, getTopo } from "./helpers/topo";

// 每个类一例: 默认参数构建 (重几何类型默认参数即小参数口径, 与冒烟脚本一致)
const CASES: Array<[string, new (tp: any) => any]> = [
    ["RodInsulator", RodInsulatorPrimitive],
    ["CrossArm", CrossArmPrimitive],
    ["LevelCantilever", LevelCantileverPrimitive],
    ["SlantCantilever", SlantCantileverPrimitive],
    ["CantileverBrace", CantileverBracePrimitive],
    ["RegArmBracket", RegArmBracketPrimitive],
    ["RegistrationArm", RegistrationArmPrimitive],
    ["CurvedArm", CurvedArmPrimitive],
    ["Dropper", DropperPrimitive],
    ["GuyWire", GuyWirePrimitive],
    ["ContactWire", ContactWirePrimitive],
    ["MessengerWire", MessengerWirePrimitive],
    ["MastBracket", MastBracketPrimitive],
    ["SteelMast", SteelMastPrimitive],
    ["ConcreteMast", ConcreteMastPrimitive],
    ["OcsFoundation", OcsFoundationPrimitive],
    ["CantileverBase", CantileverBasePrimitive],
    ["MWSaddle", MWSaddlePrimitive],
    ["BalanceWeight", BalanceWeightPrimitive],
    ["WeightRod", WeightRodPrimitive],
    ["AnchorFitting", AnchorFittingPrimitive],
    ["Crossing", CrossingPrimitive],
    ["HeadSpan", HeadSpanPrimitive],
    ["TransverseSpan", TransverseSpanPrimitive],
    ["HangerPost", HangerPostPrimitive],
    ["PortalFrame", PortalFramePrimitive],
    ["SuspensionHardSpan", SuspensionHardSpanPrimitive],
    ["PositioningCable", PositioningCablePrimitive],
    ["AuxBracket", AuxBracketPrimitive],
    ["Rail", RailPrimitive],
    ["Sleeper", SleeperPrimitive],
    ["Ballast", BallastPrimitive],
    ["TrackSlab", TrackSlabPrimitive],
    ["Fastener", FastenerPrimitive],
    ["GuardRail", GuardRailPrimitive],
    ["MastAssembly", MastAssemblyPrimitive],
    ["WeightStack", WeightStackPrimitive],
    ["RatchetCompensator", RatchetCompensatorPrimitive],
    ["AuxiliaryWire", AuxiliaryWirePrimitive],
    ["Disconnector", DisconnectorPrimitive],
    ["Arrester", ArresterPrimitive],
    ["PulleyCompensator", PulleyCompensatorPrimitive],
    ["SleeveConnector", SleeveConnectorPrimitive],
    ["SleeveEar", SleeveEarPrimitive],
    ["SwitchRail", SwitchRailPrimitive],
    ["Frog", FrogPrimitive],
    ["Turnout", TurnoutPrimitive],
    ["StraightTrack", StraightTrackPrimitive],
    ["CurveTrack", CurveTrackPrimitive],
    ["RailPair", RailPairPrimitive],
    ["SleeperLayout", SleeperLayoutPrimitive],
    ["RetarderPoint", RetarderPointPrimitive],
];

describe("railway primitives", () => {
    let tp: any;
    beforeAll(async () => {
        tp = await getTopo();
    });

    it.each(CASES)("%s: setDefault -> build -> bbox 有限", (_name, Cls) => {
        const prim = new Cls(tp).setDefault();
        expect(prim.valid(), `${_name} 默认参数 valid() == false`).toBe(true);
        const shape = prim.build();
        const r = checkShape(shape);
        expect(r.ok, `${_name}: ${r.reason ?? ""}`).toBe(true);
    });
});
