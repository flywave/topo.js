package gen

// #cgo darwin CFLAGS: -I/opt/homebrew/opt/llvm/include -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -D__STDC_LIMIT_MACROS
// #cgo darwin LDFLAGS: -L/opt/homebrew/opt/llvm/lib -Wl,-search_paths_first -Wl,-headerpad_max_install_names
// #cgo linux LDFLAGS: -L/usr/lib/llvm-15/lib
import "C"
