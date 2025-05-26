import {
    BasePrimitiveType,
    ECPrimitiveType,
    GSPrimitiveType,
    GTPrimitiveType,
    HPPrimitiveType,
    createBasePrimitive,
    createECPrimitive,
    createGSPrimitive,
    createGTPrimitive,
    createHPPrimitive
} from "topo-primitives"
import { TopoInstance } from "topo-wasm"

export function createShapePrimitive(
    tp: TopoInstance,
    shapeType: BasePrimitiveType | ECPrimitiveType | GSPrimitiveType | GTPrimitiveType | HPPrimitiveType,
    params?: any
) {
    // 缓存上次创建的类型
    let lastCreatedType: string | null = null;
    
    return function() {
        // 如果类型未变化，则不再重复创建
        if (lastCreatedType === shapeType) {
            return undefined;
        }
        
        lastCreatedType = shapeType;
        
        // 根据类型调用不同的创建函数
        if (Object.values(BasePrimitiveType).includes(shapeType as BasePrimitiveType)) {
            return createBasePrimitive(tp, shapeType as BasePrimitiveType);
        }
        if (Object.values(ECPrimitiveType).includes(shapeType as ECPrimitiveType)) {
            return createECPrimitive(tp, shapeType as ECPrimitiveType);
        }
        if (Object.values(GSPrimitiveType).includes(shapeType as GSPrimitiveType)) {
            return createGSPrimitive(tp, shapeType as GSPrimitiveType);
        }
        if (Object.values(GTPrimitiveType).includes(shapeType as GTPrimitiveType)) {
            return createGTPrimitive(tp, shapeType as GTPrimitiveType);
        }
        if (Object.values(HPPrimitiveType).includes(shapeType as HPPrimitiveType)) {
            return createHPPrimitive(tp, shapeType as HPPrimitiveType);
        }

        console.warn(`Unknown shape type: ${shapeType}`);
        return undefined;
    }
}