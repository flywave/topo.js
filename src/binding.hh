#pragma once

#include <emscripten/bind.h>
#include <emscripten/val.h>

#ifdef CONSTRUCTOR
#undef CONSTRUCTOR
#endif

using namespace emscripten;
#include <functional>
