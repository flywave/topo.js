package gen

// #cgo darwin CFLAGS: -I/opt/homebrew/Cellar/llvm@15/15.0.7/include -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -D__STDC_LIMIT_MACROS
// #cgo darwin LDFLAGS: -L/opt/homebrew/Cellar/llvm@15/15.0.7/lib -Wl,-search_paths_first -Wl,-headerpad_max_install_names
import "C"
