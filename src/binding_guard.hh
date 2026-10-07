// T1.4 (roadmap): 绑定层 C++ 异常 → 可读 JS Error 的公共翻译设施。
//
// Embind 默认不翻译 C++ 异常 (上层拿到裸指针数字, LLM 无法据此自修复)。
// 布尔家族/workplane 17 个重方法此前是手写的三段 catch; 本头文件把它抽成
// 公共 helper, 供各 *_bindings.cc 的 optional_override lambda 统一使用:
//
//   emscripten::optional_override([](sketch &self) -> emscripten::val {
//     try {
//       ...
//     } catch (const Standard_Failure &f) { topo_bindings::rethrowAsJsError("Sketch.face", f); }
//       catch (const std::exception &e) { topo_bindings::rethrowAsJsError("Sketch.face", e); }
//       catch (...)                     { topo_bindings::rethrowAsJsError("Sketch.face"); }
//   })
//
// rethrowAsJsError 以 JS Error 形式 rethrow (val::throw_ 是 [[noreturn]]),
// 因此 catch 之后不需要补 return。
#pragma once

#include <emscripten/val.h>
#include <Standard_Failure.hxx>
#include <string>

namespace topo_bindings {

inline void rethrowAsJsError(const char *api, const Standard_Failure &f) {
  emscripten::val::global("Error")
      .new_(std::string(api) + ": " +
            (f.GetMessageString() ? f.GetMessageString()
                                  : f.DynamicType()->Name()))
      .throw_();
}

inline void rethrowAsJsError(const char *api, const std::exception &e) {
  emscripten::val::global("Error")
      .new_(std::string(api) + ": " + e.what())
      .throw_();
}

inline void rethrowAsJsError(const char *api) {
  emscripten::val::global("Error")
      .new_(std::string(api) + ": unknown error")
      .throw_();
}

// 供机械变换生成的代码使用的三段 catch (api 为字面量字符串)。
#define TOPO_BINDING_CATCH(api)                                              \
  catch (const Standard_Failure &_topo_f) {                                 \
    ::topo_bindings::rethrowAsJsError(api, _topo_f);                        \
  }                                                                         \
  catch (const std::exception &_topo_e) {                                   \
    ::topo_bindings::rethrowAsJsError(api, _topo_e);                        \
  }                                                                         \
  catch (...) {                                                             \
    ::topo_bindings::rethrowAsJsError(api);                                 \
  }

} // namespace topo_bindings
