package gen

import (
	"fmt"
	"path"
	"regexp"
	"strings"

	"github.com/flywave/jstopo/gen/filter"
	"github.com/flywave/jstopo/gen/wasm"
	"github.com/go-clang/clang-v15/clang"
)

func pick(condition bool, strTrue, strFalse string) string {
	if condition {
		return strTrue
	}
	return strFalse
}

func indent(level int) string {
	return strings.Repeat("  ", level)
}

func shouldProcessClass(child clang.Cursor) bool {
	if child.Definition().IsNull() || !child.Equal(child.Definition()) {
		return false
	}

	if !filter.FilterClass(child, nil) {
		return false
	}

	if (child.Kind() == clang.Cursor_ClassDecl ||
		child.Kind() == clang.Cursor_StructDecl) &&
		child.Type().NumTemplateArguments() != -1 {
		return false
	}

	if child.Kind() == clang.Cursor_ClassDecl ||
		child.Kind() == clang.Cursor_StructDecl {
		var baseSpec []clang.Cursor
		child.Visit(func(c, parent clang.Cursor) clang.ChildVisitResult {
			if c.Kind() == clang.Cursor_CXXBaseSpecifier &&
				c.AccessSpecifier() == clang.AccessSpecifier_Public {
				baseSpec = append(baseSpec, c)
			}
			return clang.ChildVisit_Continue
		})
		if len(baseSpec) > 1 {
			fmt.Printf("cannot handle multiple base classes (%s)\n", child.Spelling())
			return false
		}
		return true
	}

	return false
}

// Type definitions
var builtInTypes = map[string]bool{
	// Integer types
	"short": true, "short int": true, "signed short": true, "signed short int": true,
	"unsigned short": true, "unsigned short int": true,
	"int": true, "signed": true, "signed int": true,
	"unsigned": true, "unsigned int": true,
	"long": true, "long int": true, "signed long": true, "signed long int": true,
	"unsigned long": true, "unsigned long int": true,
	"long long": true, "long long int": true, "signed long long": true, "signed long long int": true,
	"unsigned long long": true, "unsigned long long int": true,
	// Boolean type
	"bool": true,
	// Character types
	"char":        true,
	"signed char": true, "unsigned char": true,
	"wchar_t":  true,
	"char16_t": true, "char32_t": true, "char8_t": true,
	// Floating point types
	"float": true, "double": true, "long double": true,
}

var occtEnumTypes = map[string]bool{
	"Quantity_NameOfColor":                     true,
	"Aspect_TypeOfLine":                        true,
	"IntImp_ConstIsoparametric":                true,
	"TopAbs_Orientation":                       true,
	"GeomAbs_Shape":                            true,
	"TopAbs_State":                             true,
	"BRepOffset_Status":                        true,
	"GeomAbs_BSplKnotDistribution":             true,
	"Convert_ParameterisationType":             true,
	"CSLib_DerivativeStatus":                   true,
	"CSLib_NormalStatus":                       true,
	"FairCurve_AnalysisCode":                   true,
	"Font_FontAspect":                          true,
	"GccEnt_Position":                          true,
	"Graphic3d_DisplayPriority":                true,
	"Graphic3d_NameOfMaterial":                 true,
	"Interface_ParamType":                      true,
	"IGESData_Status":                          true,
	"IFSelect_SelectDeduct":                    true,
	"IFSelect_SelectControl":                   true,
	"IFSelect_SelectBase":                      true,
	"IntCurveSurface_TransitionOnCurve":        true,
	"IntRes2d_Position":                        true,
	"Intf_SectionPoint":                        true,
	"Intf_PIType":                              true,
	"RecordType":                               true,
	"Message_MetricType":                       true,
	"Message_Gravity":                          true,
	"OSD_SingleProtection":                     true,
	"PrsDim_KindOfSurface":                     true,
	"DsgPrs_ArrowSide":                         true,
	"StepBasic_SiPrefix":                       true,
	"StepBasic_SiUnitName":                     true,
	"XCAFDimTolObjects_DimensionFormVariance":  true,
	"XCAFDimTolObjects_DimensionType":          true,
	"XCAFDimTolObjects_DatumTargetType":        true,
	"XCAFDimTolObjects_DimensionQualifier":     true,
	"XCAFDimTolObjects_GeomToleranceTypeValue": true,
	"StepData_Logical":                         true,
	"TopAbs_ShapeEnum":                         true,
	"TopOpeBRepDS_Kind":                        true,
	"TopOpeBRepDS_TKI":                         true,
	"V3d_TypeOfOrientation":                    true,
	"XCAFDimTolObjects_DimensionGrade":         true,
}

var cStringTypes = []string{
	"const char *",
	"const char *const",
	"char *",
	"char *const",
}

func isCString(typ clang.Type) bool {
	canonical := typ.CanonicalType()
	for _, cstr := range cStringTypes {
		if canonical.Spelling() == cstr {
			return true
		}
	}
	return false
}

func getClassTypeName(theClass clang.Cursor, templateDecl clang.Cursor) string {
	if !templateDecl.IsNull() {
		return templateDecl.Spelling()
	}
	return theClass.Spelling()
}

type BindingsIFace interface {
	processSimpleConstructor(theClass clang.Cursor) string
	processMethodOrProperty(theClass, method clang.Cursor, templateDecl clang.Cursor, templateArgs map[string]clang.Type) (string, error)
	processFinalizeClass() string
	processOverloadedConstructors(theClass, templateDecl clang.Cursor, templateArgs map[string]clang.Type, overloads []clang.Cursor) (string, error)
}

type Bindings struct {
	iface            BindingsIFace
	typedefs         []clang.Cursor
	templateTypedefs []clang.Cursor
	translationUnit  clang.TranslationUnit
	workDir          string
}

func NewBindings(workDir string, typedefs, templateTypedefs []clang.Cursor, tu clang.TranslationUnit) *Bindings {
	return &Bindings{
		typedefs:         typedefs,
		templateTypedefs: templateTypedefs,
		translationUnit:  tu,
		workDir:          workDir,
	}
}

func (b *Bindings) getTypedefedTemplateTypeAsString(typeSpelling string, templateDecl clang.Cursor, templateArgs map[string]clang.Type, className string) string {
	if templateDecl.IsNull() {
		for _, typedef := range b.typedefs {
			loc := typedef.Location()
			file, _, _, _ := loc.FileLocation()
			spath := path.Join(b.workDir, sourceBasePath)
			if strings.HasPrefix(file.Name(), spath) &&
				typedef.TypedefDeclUnderlyingType().Spelling() == typeSpelling {
				return typedef.Spelling()
			}
		}
	} else {
		templateType := b.replaceTemplateArgs(typeSpelling, templateArgs)

		rawTemplateType := strings.TrimSpace(strings.ReplaceAll(strings.ReplaceAll(strings.ReplaceAll(templateType, "*", ""), "&", ""), "const", ""))

		for _, typedef := range b.templateTypedefs {
			underlying := typedef.TypedefDeclUnderlyingType().Spelling()
			if underlying == rawTemplateType || underlying == "opencascade::"+rawTemplateType {
				tp := strings.Replace(templateType, rawTemplateType, typedef.Spelling(), 1)
				return tp
			}
		}
		return templateType
	}
	if className != "" {
		if strings.Contains(typeSpelling, "OptionsForAttach") && !strings.Contains(typeSpelling, "::") {
			return strings.Replace(typeSpelling, "OptionsForAttach", className+"::OptionsForAttach", 1)
		}
		if strings.HasPrefix(typeSpelling, "Iterator") && !strings.Contains(typeSpelling, "::") {
			return strings.Replace(typeSpelling, "Iterator", className+"::Iterator", 1)
		}
	}
	return typeSpelling
}

func (b *Bindings) replaceTemplateArgs(s string, templateArgs map[string]clang.Type) string {
	if templateArgs == nil {
		return s
	}

	for key, typ := range templateArgs {
		re := regexp.MustCompile(`(\W+|^)` + key + `(\W|$)`)
		s = re.ReplaceAllString(s, "${1}"+typ.Spelling()+"${2}")
	}
	return s
}

func (b *Bindings) processClass(theClass clang.Cursor, templateDecl clang.Cursor, templateArgs map[string]clang.Type) string {
	output := ""

	if !wasm.IsAbstractClass(theClass, b.translationUnit) {
		output += b.iface.processSimpleConstructor(theClass)
	}

	theClass.Visit(func(child, parent clang.Cursor) clang.ChildVisitResult {
		if !filter.FilterMethodOrProperty(theClass, child) {
			return clang.ChildVisit_Continue
		}

		if child.Kind() == clang.Cursor_CXXMethod || child.Kind() == clang.Cursor_FieldDecl {
			methodOutput, err := b.iface.processMethodOrProperty(theClass, child, templateDecl, templateArgs)
			if err != nil {
				fmt.Println(err)
				return clang.ChildVisit_Continue
			}
			output += methodOutput
		}
		return clang.ChildVisit_Continue
	})

	output += b.iface.processFinalizeClass()

	if !wasm.IsAbstractClass(theClass, b.translationUnit) {
		overloadOutput, err := b.iface.processOverloadedConstructors(theClass, templateDecl, templateArgs, nil)
		if err != nil {
			fmt.Println(err)
		} else {
			output += overloadOutput
		}
	}

	return output
}

// EmbindBindings implementation
type EmbindBindings struct {
	*Bindings
}

func NewEmbindBindings(workDir string, typedefs, templateTypedefs []clang.Cursor, tu clang.TranslationUnit) *EmbindBindings {
	bd := &EmbindBindings{
		Bindings: NewBindings(workDir, typedefs, templateTypedefs, tu),
	}
	bd.iface = bd
	return bd
}

func (e *EmbindBindings) processClass(theClass clang.Cursor, templateDecl clang.Cursor, templateArgs map[string]clang.Type) string {
	output := ""
	className := getClassTypeName(theClass, templateDecl)
	if className == "" {
		className = theClass.Type().Spelling()
	}

	// Find base classes
	var baseSpec []clang.Cursor
	theClass.Visit(func(child, parent clang.Cursor) clang.ChildVisitResult {
		if child.Kind() == clang.Cursor_CXXBaseSpecifier && child.AccessSpecifier() == clang.AccessSpecifier_Public {
			baseSpec = append(baseSpec, child)
		}
		return clang.ChildVisit_Continue
	})

	baseClassBinding := ""
	if len(baseSpec) > 0 {
		baseClassBinding = ", base<" + baseSpec[0].Type().Spelling() + ">"
	}

	output += "EMSCRIPTEN_BINDINGS(" + pick(templateDecl.IsNull(), theClass.Spelling(), templateDecl.Spelling()) + ") {\n"
	output += "  class_<" + className + baseClassBinding + ">(\"" + className + "\")\n"

	output += e.Bindings.processClass(theClass, templateDecl, templateArgs)

	output += "}\n\n"

	// Epilog
	nonPublicDestructor := false
	placementDelete := false

	theClass.Visit(func(child, parent clang.Cursor) clang.ChildVisitResult {
		if child.Kind() == clang.Cursor_Destructor && child.AccessSpecifier() != clang.AccessSpecifier_Public {
			nonPublicDestructor = true
		}
		if child.Spelling() == "operator delete" {
			childCount := 0
			child.Visit(func(c, p clang.Cursor) clang.ChildVisitResult {
				childCount++
				return clang.ChildVisit_Continue
			})
			if childCount == 2 {
				placementDelete = true
			}
		}
		return clang.ChildVisit_Continue
	})

	if nonPublicDestructor || placementDelete {
		output += "namespace emscripten { namespace internal { template<> void raw_destructor<" + theClass.Spelling() + ">(" + theClass.Spelling() + "* ptr) { /* do nothing */ } } }\n"
	}
	return output
}

func (e *EmbindBindings) processFinalizeClass() string {
	return "  ;\n"
}

func (e *EmbindBindings) processSimpleConstructor(theClass clang.Cursor) string {
	output := ""
	constructors := []clang.Cursor{}
	publicConstructors := []clang.Cursor{}

	theClass.Visit(func(child, parent clang.Cursor) clang.ChildVisitResult {
		if child.Kind() == clang.Cursor_Constructor {
			constructors = append(constructors, child)
			if child.AccessSpecifier() == clang.AccessSpecifier_Public {
				publicConstructors = append(publicConstructors, child)
			}
		}
		return clang.ChildVisit_Continue
	})

	if len(constructors) == 0 {
		output += "    .constructor<>()\n"
		return output
	}

	if len(publicConstructors) == 0 || len(publicConstructors) > 1 {
		return output
	}

	standardConstructor := publicConstructors[0]
	if !standardConstructor.IsNull() {
		return output
	}

	var argTypes []string

	for i := 0; int32(i) < standardConstructor.NumArguments(); i++ {
		arg := standardConstructor.Argument(uint32(i))
		argTypes = append(argTypes, arg.Type().Spelling())
	}
	argTypesBindings := strings.Join(argTypes, ", ")

	output += "    .constructor<" + argTypesBindings + ">()\n"
	return output
}

func (e *EmbindBindings) getSingleArgumentBinding(argNames bool, isConstructor bool, templateDecl clang.Cursor, templateArgs map[string]clang.Type, className string) func(clang.Cursor) (string, bool) {
	return func(arg clang.Cursor) (string, bool) {
		var argChildren []clang.Cursor

		arg.Visit(func(child, parent clang.Cursor) clang.ChildVisitResult {
			argChildren = append(argChildren, child)
			return clang.ChildVisit_Continue
		})

		argBinding := ""
		hasDefaultValue := false

		// Check for default value
		argRange := arg.Extent()
		tu := arg.TranslationUnit()
		tokens := tu.Tokenize(argRange)
		for _, token := range tokens {
			if tu.TokenSpelling(token) == "=" {
				hasDefaultValue = true
				break
			}
		}

		isArray := !hasDefaultValue && len(argChildren) > 1 && argChildren[1].Kind() == clang.Cursor_IntegerLiteral
		changed := false

		if isArray {
			constStr := ""
			isConst := false
			argType := arg.Type()
			if argType.IsConstQualifiedType() {
				isConst = true
			}
			if isConst {
				constStr = "const "
			}

			arrayCount := ""
			if len(argChildren) > 1 {
				childRange := argChildren[1].Extent()
				childTokens := tu.Tokenize(childRange)
				if len(childTokens) > 0 {
					arrayCount = tu.TokenSpelling(childTokens[0])
				}
			}
			argBinding = constStr + argChildren[0].Type().Spelling() + " (&" + pick(argNames, arg.Spelling(), "") + ")[" + arrayCount + "]"
			changed = true
		} else {
			typename := e.getTypedefedTemplateTypeAsString(arg.Type().Spelling(), templateDecl, templateArgs, className)
			if className != "" {
				if strings.HasPrefix(typename, "Iterator") && !strings.Contains(typename, "::") {
					typename = strings.Replace(typename, "Iterator", className+"::Iterator", 1)
				}
				if strings.HasPrefix(typename, "const Target &") && !strings.Contains(typename, "::") {
					typename = strings.Replace(typename, "Target", className+"::Target", 1)
				}
				if strings.HasPrefix(typename, "const Point &") && !strings.Contains(typename, "::") {
					typename = strings.Replace(typename, "Point", className+"::Point", 1)
				}
				if strings.HasPrefix(typename, "const ShaderVariableList &") && !strings.Contains(typename, "::") {
					typename = strings.Replace(typename, "ShaderVariableList", className+"::ShaderVariableList", 1)
				}
				if strings.HasPrefix(typename, "const NullString *") && !strings.Contains(typename, "::") {
					typename = strings.Replace(typename, "NullString", className+"::NullString", 1)
				}
				if strings.HasPrefix(typename, "const BVHSubset") && !strings.Contains(typename, "::") {
					typename = strings.Replace(typename, "BVHSubset", className+"::BVHSubset", 1)
				}
			}
			if arg.Type().Kind() == clang.Type_LValueReference {
				isConstRef := arg.Type().IsConstQualifiedType()
				if !isConstRef {
					if strings.HasSuffix(typename, "*") || strings.TrimSpace(strings.TrimSuffix(typename, "&")) == "Standard_Boolean" ||
						strings.TrimSpace(strings.TrimSuffix(typename, "&")) == "Standard_Real" ||
						strings.TrimSpace(strings.TrimSuffix(typename, "&")) == "Standard_Integer" {
						typename = strings.TrimSuffix(typename, "&")
						changed = true
					} else {
						if isConstructor {
							// Keep as is
							changed = true
						} else {
							typename = "const " + typename
							changed = true
						}
					}
				}
			}

			argBinding = typename + pick(argNames, " "+arg.Spelling(), "")
		}
		return argBinding, changed
	}
}

func (b *EmbindBindings) processMethodOrProperty(theClass, method clang.Cursor, templateDecl clang.Cursor, templateArgs map[string]clang.Type) (string, error) {
	var output strings.Builder
	className := getClassTypeName(theClass, templateDecl)
	if className == "" {
		className = theClass.Type().Spelling()
	}

	// Process public methods (non-operator)
	if method.AccessSpecifier() == clang.AccessSpecifier_Public &&
		method.Kind() == clang.Cursor_CXXMethod &&
		!strings.HasPrefix(method.Spelling(), "operator") {

		overloadPostfix, numOverloads := wasm.GetMethodOverloadPostfix(theClass, method, nil)

		// Helper function to check if type needs wrapper
		needsWrapper := func(typ clang.Type) bool {
			canonical := typ.CanonicalType()
			if typ.Kind() == clang.Type_LValueReference {
				pointee := typ.PointeeType()
				if builtInTypes[pointee.CanonicalType().Spelling()] ||
					occtEnumTypes[pointee.CanonicalType().Spelling()] ||
					pointee.Kind() == clang.Type_Enum ||
					pointee.Kind() == clang.Type_Pointer {
					return true
				}
				if theClass.Kind() == clang.Cursor_ClassTemplate {
					if pointeeSpelling := strings.TrimPrefix(pointee.Spelling(), "const "); templateArgs != nil {
						return builtInTypes[templateArgs[pointeeSpelling].CanonicalType().Spelling()]
					}
				}
			}
			return canonical.Kind() == clang.Type_Pointer && isCString(typ)
		}
		var args []clang.Cursor
		for i := int32(0); i < method.NumArguments(); i++ {
			arg := method.Argument(uint32(i))
			args = append(args, arg)
		}
		argsNeedingWrapper := make([]bool, len(args))
		for i, arg := range args {
			argsNeedingWrapper[i] = needsWrapper(arg.Type())
		}
		returnNeedsWrapper := needsWrapper(method.ResultType())

		var functionBinding strings.Builder

		if anyTrue(argsNeedingWrapper) || returnNeedsWrapper {
			// Helper functions for wrapper generation
			replaceTemplateArgs := func(i int) string {
				argType := args[i].Type()
				if templateArgs != nil {
					pointeeSpelling := strings.TrimPrefix(argType.PointeeType().Spelling(), "const ")
					if replacement, ok := templateArgs[pointeeSpelling]; ok {
						return strings.Replace(argType.Spelling(), pointeeSpelling, replacement.Spelling(), 1)
					}
				}
				typename := argType.Spelling()
				if className != "" {
					if strings.HasPrefix(typename, "Iterator") && !strings.Contains(typename, "::") {
						typename = strings.Replace(typename, "Iterator", className+"::Iterator", 1)
					}
					if strings.HasPrefix(typename, "const Target &") && !strings.Contains(typename, "::") {
						typename = strings.Replace(typename, "Target", className+"::Target", 1)
					}
					if strings.HasPrefix(typename, "const Point &") && !strings.Contains(typename, "::") {
						typename = strings.Replace(typename, "Point", className+"::Point", 1)
					}
					if strings.HasPrefix(typename, "const ShaderVariableList &") && !strings.Contains(typename, "::") {
						typename = strings.Replace(typename, "ShaderVariableList", className+"::ShaderVariableList", 1)
					}
					if strings.HasPrefix(typename, "const NullString *") && !strings.Contains(typename, "::") {
						typename = strings.Replace(typename, "NullString", className+"::NullString", 1)
					}
					if strings.HasPrefix(typename, "const BVHSubset") && !strings.Contains(typename, "::") {
						typename = strings.Replace(typename, "BVHSubset", className+"::BVHSubset", 1)
					}
				}
				return typename
			}

			getArgName := func(i int) string {
				if args[i].Spelling() != "" {
					return args[i].Spelling()
				}
				return fmt.Sprintf("argNo%d", i)
			}

			getArgTypeName := func(typ clang.Type) string {
				pointee := typ.PointeeType()
				if templateArgs != nil {
					pointeeSpelling := strings.TrimPrefix(pointee.Spelling(), "const ")
					if replacement, ok := templateArgs[pointeeSpelling]; ok {
						return strings.Replace(pointee.Spelling(), pointeeSpelling, replacement.Spelling(), 1)
					}
				}
				return pointee.Spelling()
			}

			// Generate wrapped parameter types and names
			var wrappedParamTypes, wrappedParamTypesAndNames []string
			for i, needsWrap := range argsNeedingWrapper {
				if needsWrap {
					wrappedParamTypes = append(wrappedParamTypes, "emscripten::val")
					wrappedParamTypesAndNames = append(wrappedParamTypesAndNames,
						fmt.Sprintf("emscripten::val %s", getArgName(i)))
				} else {
					wrappedParamTypes = append(wrappedParamTypes, replaceTemplateArgs(i))
					wrappedParamTypesAndNames = append(wrappedParamTypesAndNames,
						fmt.Sprintf("%s %s", replaceTemplateArgs(i), getArgName(i)))
				}
			}

			// Generate function binding
			resultTypeSpelling := b.getTypedefedTemplateTypeAsString(method.ResultType().Spelling(), templateDecl, templateArgs, className)
			if returnNeedsWrapper {
				resultTypeSpelling = "emscripten::val"
			}

			// Function binding head
			functionBinding.WriteString("\n")
			functionBinding.WriteString(indent(3))
			if !method.CXXMethod_IsStatic() {
				functionBinding.WriteString(fmt.Sprintf("std::function<%s(", resultTypeSpelling))
			} else {
				functionBinding.WriteString(fmt.Sprintf("((%s (*)(", resultTypeSpelling))
			}

			// Parameters
			var params []string
			if !method.CXXMethod_IsStatic() {
				params = append(params, fmt.Sprintf("%s&", className))
			}
			params = append(params, wrappedParamTypes...)
			functionBinding.WriteString(strings.Join(params, ", "))

			if !method.CXXMethod_IsStatic() {
				functionBinding.WriteString(")>(")
			} else {
				functionBinding.WriteString("))")
			}

			// Lambda start
			functionBinding.WriteString("[](")
			if !method.CXXMethod_IsStatic() {
				functionBinding.WriteString(fmt.Sprintf("%s& that", className))
				if len(wrappedParamTypesAndNames) > 0 {
					functionBinding.WriteString(", ")
				}
			}
			functionBinding.WriteString(strings.Join(wrappedParamTypesAndNames, ", "))
			functionBinding.WriteString(fmt.Sprintf(") -> %s {{\n", resultTypeSpelling))

			// Generate reference values
			for i, needsWrap := range argsNeedingWrapper {
				if needsWrap && !isCString(args[i].Type()) {
					functionBinding.WriteString(indent(4))
					functionBinding.WriteString(fmt.Sprintf("auto ref_%s = getReferenceValue<%s>(%s);\n",
						getArgName(i), getArgTypeName(args[i].Type()), getArgName(i)))
				}
			}

			// Function body
			functionBinding.WriteString(indent(4))
			if method.ResultType().Spelling() != "void" {
				if !isCString(method.ResultType()) &&
					(method.ResultType().IsConstQualifiedType() || method.ResultType().PointeeType().IsConstQualifiedType()) {
					functionBinding.WriteString("const ")
				}
				functionBinding.WriteString("auto")
				if !isCString(method.ResultType()) && method.ResultType().Kind() == clang.Type_LValueReference {
					functionBinding.WriteString("& ")
				} else {
					functionBinding.WriteString(" ")
				}
				functionBinding.WriteString("ret = ")
			}

			// Method invocation
			var invocationArgs []string
			for i, needsWrap := range argsNeedingWrapper {
				if needsWrap {
					if !isCString(args[i].Type()) {
						invocationArgs = append(invocationArgs, fmt.Sprintf("ref_%s", getArgName(i)))
					} else {
						if !args[i].Type().CanonicalType().PointeeType().IsConstQualifiedType() ||
							args[i].Type().IsConstQualifiedType() {
							invocationArgs = append(invocationArgs,
								fmt.Sprintf("%s.isNull() ? nullptr : strdup(%s.as<std::string>().c_str())",
									getArgName(i), getArgName(i)))
						} else {
							invocationArgs = append(invocationArgs,
								fmt.Sprintf("%s.isNull() ? nullptr : %s.as<std::string>().c_str()",
									getArgName(i), getArgName(i)))
						}
					}
				} else {
					invocationArgs = append(invocationArgs, getArgName(i))
				}
			}

			if !method.CXXMethod_IsStatic() {
				functionBinding.WriteString(fmt.Sprintf("that.%s(%s)", method.Spelling(), strings.Join(invocationArgs, ", ")))
			} else {
				functionBinding.WriteString(fmt.Sprintf("%s::%s(%s)", theClass.Spelling(), method.Spelling(), strings.Join(invocationArgs, ", ")))
			}
			functionBinding.WriteString(";\n")

			// Update reference values
			for i, needsWrap := range argsNeedingWrapper {
				if needsWrap && !isCString(args[i].Type()) {
					functionBinding.WriteString(indent(4))
					functionBinding.WriteString(fmt.Sprintf("updateReferenceValue<%s>(%s, ref_%s);\n",
						getArgTypeName(args[i].Type()), getArgName(i), getArgName(i)))
				}
			}

			// Return value handling
			if method.ResultType().Spelling() != "void" {
				if returnNeedsWrapper {
					if method.ResultType().Kind() == clang.Type_Pointer {
						returnType := "std::string"
						if !isCString(method.ResultType()) {
							returnType = b.getTypedefedTemplateTypeAsString(method.ResultType().Spelling(), templateDecl, templateArgs, className)
						}
						functionBinding.WriteString(indent(4))
						functionBinding.WriteString(fmt.Sprintf(
							"return ret == nullptr ? emscripten::val::null() : emscripten::val(static_cast<%s>(ret));\n",
							returnType))
					} else {
						functionBinding.WriteString(indent(4))
						functionBinding.WriteString("return emscripten::val(ret);\n")
					}
				} else {
					functionBinding.WriteString(indent(4))
					functionBinding.WriteString("return ret;\n")
				}
			}

			functionBinding.WriteString(indent(3))
			functionBinding.WriteString("}}\n")
			functionBinding.WriteString(indent(2))
			functionBinding.WriteString(")")

		} else {
			// Simple case - no wrapper needed
			if numOverloads == 1 {
				functionBinding.WriteString(fmt.Sprintf("%s&%s::%s\n", indent(2), className, method.Spelling()))
			} else {
				var params []string
				for _, arg := range args {
					binding, _ := b.getSingleArgumentBinding(true, true, templateDecl, templateArgs, className)(arg)
					params = append(params, binding)
				}

				overloadSpec := fmt.Sprintf("<%s(%s)",
					b.getTypedefedTemplateTypeAsString(method.ResultType().Spelling(), templateDecl, templateArgs, className),
					strings.Join(params, ", "))

				if method.CXXMethod_IsConst() {
					overloadSpec += " const"
				}

				if !method.CXXMethod_IsStatic() {
					overloadSpec += fmt.Sprintf(", %s", getClassTypeName(theClass, templateDecl))
				}

				overloadSpec += ">"

				functionBinding.WriteString(fmt.Sprintf("%sselect_overload%s(&%s::%s)\n",
					indent(2), overloadSpec, className, method.Spelling()))
			}
		}

		output.WriteString(indent(2))
		if method.CXXMethod_IsStatic() {
			output.WriteString(".class_function(")
		} else {
			output.WriteString(".function(")
		}
		output.WriteString(fmt.Sprintf("\"%s%s\",%s, allow_raw_pointers())\n",
			method.Spelling(), overloadPostfix, functionBinding.String()))
	}

	// Process public fields
	if method.AccessSpecifier() == clang.AccessSpecifier_Public &&
		method.Kind() == clang.Cursor_FieldDecl {
		if method.Type().Kind() == clang.Type_ConstantArray {
			fmt.Printf("Cannot handle array properties, skipping %s::%s\n", className, method.Spelling())
		} else if method.Type().PointeeType().Kind() != clang.Type_Invalid {
			fmt.Printf("Cannot handle pointer properties, skipping %s::%s\n", className, method.Spelling())
		} else {
			output.WriteString(fmt.Sprintf("%s.property(\"%s\", &%s::%s)\n",
				indent(2), method.Spelling(), className, method.Spelling()))
		}
	}

	return output.String(), nil
}

// Helper functions
func anyTrue(bools []bool) bool {
	for _, b := range bools {
		if b {
			return true
		}
	}
	return false
}

func (e *EmbindBindings) processOverloadedConstructors(theClass clang.Cursor, templateDecl clang.Cursor, templateArgs map[string]clang.Type, children []clang.Cursor) (string, error) {
	output := ""

	theClass.Visit(func(child, parent clang.Cursor) clang.ChildVisitResult {
		children = append(children, child)
		return clang.ChildVisit_Continue
	})

	var constructors []clang.Cursor
	for _, child := range children {
		if child.Kind() == clang.Cursor_Constructor && child.AccessSpecifier() == clang.AccessSpecifier_Public {
			constructors = append(constructors, child)
		}
	}

	if len(constructors) <= 1 {
		return output, nil
	}

	var allOverloads []clang.Cursor
	for _, m := range children {
		if m.Kind() == clang.Cursor_Constructor && m.AccessSpecifier() == clang.AccessSpecifier_Public {
			allOverloads = append(allOverloads, m)
		}
	}

	if len(allOverloads) == 1 {
		return "", fmt.Errorf("something weird happened")
	}

	var constructorBindings strings.Builder
	for _, constructor := range constructors {
		if !filter.FilterMethodOrProperty(theClass, constructor) {
			continue
		}

		overloadPostfix := ""
		if len(allOverloads) > 1 {
			for i, m := range allOverloads {
				if m.Equal(constructor) {
					overloadPostfix = fmt.Sprintf("_%d", i+1)
					break
				}
			}
		}

		var args, argNames, argTypes []string
		for i := int32(0); i < constructor.NumArguments(); i++ {
			arg := constructor.Argument(uint32(i))
			if isCString(arg.Type()) {
				args = append(args, "std::string "+arg.Spelling())
				argNames = append(argNames, arg.Spelling()+".c_str()")
				argTypes = append(argTypes, "std::string")
			} else {
				binding, _ := e.getSingleArgumentBinding(true, true, templateDecl, templateArgs, theClass.Spelling())(arg)
				args = append(args, binding)
				argNames = append(argNames, arg.Spelling())
				binding, _ = e.getSingleArgumentBinding(false, true, templateDecl, templateArgs, theClass.Spelling())(arg)
				argTypes = append(argTypes, binding)

				if strings.HasPrefix(binding, "const T *") {
					print(fmt.Sprintf("Warning: const pointer passed to constructor %s::%s\n", theClass.Spelling(), constructor.Spelling()))
				}
			}
		}

		name := getClassTypeName(theClass, templateDecl)
		constructorBindings.WriteString("    struct " + name + overloadPostfix + " : public " + name + " {\n")
		constructorBindings.WriteString("      " + name + overloadPostfix + "(" + strings.Join(args, ", ") + ") : " + name + "(" + strings.Join(argNames, ", ") + ") {}\n")
		constructorBindings.WriteString("    };\n")
		constructorBindings.WriteString("    class_<" + name + overloadPostfix + ", base<" + name + ">>(\"" + name + overloadPostfix + "\")\n")
		constructorBindings.WriteString("      .constructor<" + strings.Join(argTypes, ", ") + ">()\n")
		constructorBindings.WriteString("    ;\n")
	}

	output += constructorBindings.String()
	return output, nil
}

func (e *EmbindBindings) processEnum(theEnum clang.Cursor) string {
	output := "EMSCRIPTEN_BINDINGS(" + theEnum.Spelling() + ") {\n"

	bindingsOutput := "  enum_<" + theEnum.Spelling() + ">(\"" + theEnum.Spelling() + "\")\n"
	var enumChildren []clang.Cursor

	theEnum.Visit(func(child, parent clang.Cursor) clang.ChildVisitResult {
		enumChildren = append(enumChildren, child)
		return clang.ChildVisit_Continue
	})
	prefix := ""
	if theEnum.EnumDecl_IsScoped() {
		prefix = theEnum.Spelling() + "::"
	}
	for _, enumChild := range enumChildren {
		bindingsOutput += "    .value(\"" + enumChild.Spelling() + "\", " + prefix + enumChild.Spelling() + ")\n"
	}
	bindingsOutput += "  ;\n"
	output += bindingsOutput

	output += "}\n\n"
	return output
}

type TypescriptBindings struct {
	*Bindings
	imports map[string]bool
	exports []string
}

func NewTypescriptBindings(workDir string, typedefs, templateTypedefs []clang.Cursor, tu clang.TranslationUnit) *TypescriptBindings {
	bd := &TypescriptBindings{
		Bindings: NewBindings(workDir, typedefs, templateTypedefs, tu),
		imports:  make(map[string]bool),
		exports:  []string{},
	}

	bd.iface = bd
	return bd
}

func (t *TypescriptBindings) processClass(theClass clang.Cursor, templateDecl clang.Cursor, templateArgs map[string]clang.Type) string {
	var output strings.Builder

	// Handle base class
	var baseSpec []clang.Cursor
	theClass.Visit(func(child, parent clang.Cursor) clang.ChildVisitResult {
		if child.Kind() == clang.Cursor_CXXBaseSpecifier && child.AccessSpecifier() == clang.AccessSpecifier_Public {
			baseSpec = append(baseSpec, child)
		}
		return clang.ChildVisit_Continue
	})

	baseClassDefinition := ""
	if len(baseSpec) > 0 {
		baseType := baseSpec[0].Type().Spelling()
		if strings.Contains(baseType, ":") || strings.Contains(baseType, "<") {
			fmt.Printf("Unsupported character for base class \"%s\" (%s)\n", baseType, theClass.Spelling())
		} else {
			baseClassDefinition = " extends " + baseType
			// t.addImportIfWeHaveTo(baseType)
		}
	}

	name := getClassTypeName(theClass, templateDecl)
	output.WriteString(fmt.Sprintf("export declare class %s%s {\n", name, baseClassDefinition))
	t.exports = append(t.exports, name)

	output.WriteString(t.Bindings.processClass(theClass, templateDecl, templateArgs))
	return output.String()
}

func (t *TypescriptBindings) processFinalizeClass() string {
	return "  delete(): void;\n}\n\n"
}

func (t *TypescriptBindings) processSimpleConstructor(theClass clang.Cursor) string {
	var output strings.Builder
	var constructors []clang.Cursor

	theClass.Visit(func(child, parent clang.Cursor) clang.ChildVisitResult {
		if child.Kind() == clang.Cursor_Constructor {
			constructors = append(constructors, child)
		}
		return clang.ChildVisit_Continue
	})

	if len(constructors) == 0 {
		output.WriteString("  constructor();\n")
		return output.String()
	}

	var publicConstructors []clang.Cursor
	for _, c := range constructors {
		if c.AccessSpecifier() == clang.AccessSpecifier_Public {
			publicConstructors = append(publicConstructors, c)
		}
	}

	if len(publicConstructors) == 0 || len(publicConstructors) > 1 {
		return output.String()
	}

	standardConstructor := publicConstructors[0]
	if !standardConstructor.IsNull() {
		return output.String()
	}

	var args []string
	for i := int32(0); i < standardConstructor.NumArguments(); i++ {
		arg := standardConstructor.Argument(uint32(i))
		args = append(args, t.getTypescriptDefFromArg(arg))
	}

	output.WriteString(fmt.Sprintf("  constructor(%s)\n", strings.Join(args, ", ")))
	return output.String()
}

func (t *TypescriptBindings) convertBuiltinTypes(typeName string) string {
	switch typeName {
	case "int", "int16_t", "unsigned", "uint32_t", "unsigned int", "unsigned long",
		"long", "long int", "unsigned short", "short", "short int",
		"float", "unsigned float", "double", "unsigned double":
		return "number"
	case "char", "unsigned char", "std::string":
		return "string"
	case "bool":
		return "boolean"
	default:
		return typeName
	}
}

func (t *TypescriptBindings) getTypescriptDefFromResultType(res clang.Type, templateDecl clang.Cursor, templateArgs map[string]clang.Type) string {
	if res.Spelling() != "void" {
		typedefType := t.getTypedefedTemplateTypeAsString(
			strings.TrimSpace(strings.ReplaceAll(strings.ReplaceAll(res.Spelling(), "&", ""), "const", "")),
			templateDecl, templateArgs, "")
		resTypeName := strings.TrimSpace(strings.ReplaceAll(strings.ReplaceAll(typedefType, "&", ""), "const", ""))
		resTypeName = t.convertBuiltinTypes(resTypeName)
		if resTypeName == "" || strings.Contains(resTypeName, "(") ||
			strings.Contains(resTypeName, ":") || strings.Contains(resTypeName, "<") {
			fmt.Printf("could not generate proper types for type name '%s', using 'any' instead.\n", resTypeName)
			return "any"
		}
		return resTypeName
	}
	return "void"
}

func (t *TypescriptBindings) getTypescriptDefFromArg(arg clang.Cursor, suffix ...string) string {
	suffixVal := ""
	if len(suffix) > 0 {
		suffixVal = suffix[0]
	}

	argTypeName := t.getTypedefedTemplateTypeAsString(
		strings.TrimSpace(strings.ReplaceAll(strings.ReplaceAll(arg.Type().Spelling(), "&", ""), "const", "")),
		clang.NewNullCursor(), nil, "")
	argTypeName = strings.TrimSpace(strings.ReplaceAll(strings.ReplaceAll(argTypeName, "&", ""), "const", ""))
	argTypeName = t.convertBuiltinTypes(argTypeName)
	if argTypeName == "" || strings.Contains(argTypeName, "(") || strings.Contains(argTypeName, ":") {
		fmt.Printf("could not generate proper types for type name '%s', using 'any' instead.\n", argTypeName)
		argTypeName = "any"
	}

	argname := arg.Spelling()
	if argname == "" {
		argname = "a" + suffixVal
	}
	if argname == "var" || argname == "with" || argname == "super" {
		argname += "_"
	}
	return argname + ": " + argTypeName
}

func (t *TypescriptBindings) processMethodOrProperty(theClass, method clang.Cursor, templateDecl clang.Cursor, templateArgs map[string]clang.Type) (string, error) {
	var output strings.Builder

	if method.AccessSpecifier() == clang.AccessSpecifier_Public &&
		method.Kind() == clang.Cursor_CXXMethod &&
		!strings.HasPrefix(method.Spelling(), "operator") {

		overloadPostfix, _ := wasm.GetMethodOverloadPostfix(theClass, method, nil)

		var args []string
		for i := int32(0); i < method.NumArguments(); i++ {
			arg := method.Argument(uint32(i))
			args = append(args, t.getTypescriptDefFromArg(arg, fmt.Sprintf("%d", i)))
		}

		returnType := t.getTypescriptDefFromResultType(method.ResultType(), templateDecl, templateArgs)

		if method.CXXMethod_IsStatic() {
			output.WriteString("  static ")
		} else {
			output.WriteString("  ")
		}
		output.WriteString(fmt.Sprintf("%s%s(%s): %s;\n",
			method.Spelling(), overloadPostfix, strings.Join(args, ", "), returnType))
	}

	return output.String(), nil
}

func (t *TypescriptBindings) processOverloadedConstructors(theClass clang.Cursor, templateDecl clang.Cursor, templateArgs map[string]clang.Type, children []clang.Cursor) (string, error) {
	var output strings.Builder

	theClass.Visit(func(child, parent clang.Cursor) clang.ChildVisitResult {
		children = append(children, child)
		return clang.ChildVisit_Continue
	})

	var constructors []clang.Cursor
	for _, child := range children {
		if child.Kind() == clang.Cursor_Constructor &&
			child.AccessSpecifier() == clang.AccessSpecifier_Public {
			constructors = append(constructors, child)
		}
	}

	if len(constructors) <= 1 {
		return output.String(), nil
	}

	var constructorTypescriptDef strings.Builder
	var allOverloadedConstructors []string

	for _, constructor := range constructors {
		if !filter.FilterMethodOrProperty(theClass, constructor) {
			continue
		}

		overloadPostfix, _ := wasm.GetMethodOverloadPostfix(theClass, constructor, children)

		var args []string
		for i := int32(0); i < constructor.NumArguments(); i++ {
			arg := constructor.Argument(uint32(i))
			args = append(args, t.getTypescriptDefFromArg(arg))
		}

		name := getClassTypeName(theClass, templateDecl)
		constructorTypescriptDef.WriteString(fmt.Sprintf("  export declare class %s%s extends %s {\n",
			name, overloadPostfix, name))
		constructorTypescriptDef.WriteString(fmt.Sprintf("    constructor(%s);\n", strings.Join(args, ", ")))
		constructorTypescriptDef.WriteString("  }\n\n")
		allOverloadedConstructors = append(allOverloadedConstructors, name+overloadPostfix)
	}

	output.WriteString(constructorTypescriptDef.String())
	t.exports = append(t.exports, allOverloadedConstructors...)
	return output.String(), nil
}

func (t *TypescriptBindings) processEnum(theEnum clang.Cursor) string {
	var output strings.Builder
	var bindingsOutput strings.Builder

	bindingsOutput.WriteString(fmt.Sprintf("export declare type %s = {\n", theEnum.Spelling()))
	theEnum.Visit(func(enumChild, parent clang.Cursor) clang.ChildVisitResult {
		bindingsOutput.WriteString(fmt.Sprintf("  %s: {};\n", enumChild.Spelling()))
		return clang.ChildVisit_Continue
	})
	bindingsOutput.WriteString("}\n\n")

	output.WriteString(bindingsOutput.String())
	t.exports = append(t.exports, theEnum.Spelling())
	return output.String()
}
