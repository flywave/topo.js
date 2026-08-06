import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        include: ["test/**/*.test.ts"],
        // 铁路重几何用例 (Turnout / SuspensionHardSpan / layout 再生成) 可能跑到 30-120s
        testTimeout: 180000,
        hookTimeout: 180000,
        // WASM 实例为进程级单例且几何库非线程安全, 单线程串行跑
        threads: false,
    },
});
