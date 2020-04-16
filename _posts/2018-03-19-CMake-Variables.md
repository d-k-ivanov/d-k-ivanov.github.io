---
layout: post
title: Examples of CMake Variables
description: "Examples of CMake Variables"
date: 2018-03-19
tag: cmake
---

## **Table of Contents**
* TOC
{:toc}

### Visual Studio 15 2017 Win64

```bash
-- CMAKE_BINARY_DIR:         C:/Users/dkiva/workspace/my/info-cmake/cmake-variables/build
-- CMAKE_CURRENT_BINARY_DIR: C:/Users/dkiva/workspace/my/info-cmake/cmake-variables/build
-- CMAKE_SOURCE_DIR:         C:/Users/dkiva/workspace/my/info-cmake/cmake-variables
-- CMAKE_CURRENT_SOURCE_DIR: C:/Users/dkiva/workspace/my/info-cmake/cmake-variables
-- PROJECT_BINARY_DIR: C:/Users/dkiva/workspace/my/info-cmake/cmake-variables/build
-- PROJECT_SOURCE_DIR: C:/Users/dkiva/workspace/my/info-cmake/cmake-variables
-- EXECUTABLE_OUTPUT_PATH:
-- LIBRARY_OUTPUT_PATH:
-- CMAKE_MODULE_PATH:
-- CMAKE_COMMAND: C:/ProgramData/chocolatey/lib/cmake.portable/tools/cmake-3.10.2-win64-x64/bin/cmake.exe
-- CMAKE_ROOT: C:/ProgramData/chocolatey/lib/cmake.portable/tools/cmake-3.10.2-win64-x64/share/cmake-3.10
-- CMAKE_CURRENT_LIST_FILE: C:/Users/dkiva/workspace/my/info-cmake/cmake-variables/vars.cmake
-- CMAKE_CURRENT_LIST_LINE: 46
-- CMAKE_INCLUDE_PATH:
-- CMAKE_LIBRARY_PATH:
-- CMAKE_SYSTEM: Windows-10.0.16299
-- CMAKE_SYSTEM_NAME: Windows
-- CMAKE_SYSTEM_VERSION: 10.0.16299
-- UNIX:
-- WIN32: 1
-- APPLE:
-- MINGW:
-- CYGWIN:
-- BORLAND:
-- MSVC: 1
-- MSVC_IDE: 1
-- MSVC60:
-- MSVC70:
-- MSVC71:
-- MSVC80:
-- CMAKE_COMPILER_2005:
-- CMAKE_SKIP_RULE_DEPENDENCY:
-- CMAKE_SKIP_INSTALL_ALL_DEPENDENCY:
-- CMAKE_SKIP_RPATH: NO
-- CMAKE_VERBOSE_MAKEFILE: FALSE
-- CMAKE_SUPPRESS_REGENERATION:
-- CMAKE_C_FLAGS: /DWIN32 /D_WINDOWS /W3
-- CMAKE_CXX_FLAGS: /DWIN32 /D_WINDOWS /W3 /GR /EHsc
-- CMAKE_BUILD_TYPE:
-- BUILD_SHARED_LIBS:
-- CMAKE_C_COMPILER: C:/Program Files (x86)/Microsoft Visual Studio/2017/Community/VC/Tools/MSVC/14.13.26128/bin/Hostx86/x64/cl.exe
-- CMAKE_CXX_COMPILER: C:/Program Files (x86)/Microsoft Visual Studio/2017/Community/VC/Tools/MSVC/14.13.26128/bin/Hostx86/x64/cl.exe
-- CMAKE_COMPILER_IS_GNUCC:
-- CMAKE_COMPILER_IS_GNUCXX :
-- CMAKE_AR:
-- CMAKE_RANLIB:
-- CMAKE_AR=
-- CMAKE_AUTOMOC_COMPILER_PREDEFINES=ON
-- CMAKE_AUTOMOC_MACRO_NAMES=Q_OBJECT;Q_GADGET;Q_NAMESPACE
-- CMAKE_BASE_NAME=cl
-- CMAKE_BINARY_DIR=C:/Users/dkiva/workspace/my/info-cmake/cmake-variables/build
-- CMAKE_BUILD_TOOL=C:/Program Files (x86)/Microsoft Visual Studio/2017/Community/MSBuild/15.0/Bin/MSBuild.exe
-- CMAKE_BUILD_TYPE_INIT=Debug
-- CMAKE_C11_COMPILE_FEATURES=
-- CMAKE_C90_COMPILE_FEATURES=
-- CMAKE_C99_COMPILE_FEATURES=
-- CMAKE_CFG_INTDIR=$(Configuration)
-- CMAKE_CL_64=1
-- CMAKE_CL_NOLOGO=/nologo
-- CMAKE_COMMAND=C:/ProgramData/chocolatey/lib/cmake.portable/tools/cmake-3.10.2-win64-x64/bin/cmake.exe
-- CMAKE_CONFIGURATION_TYPES=Debug;Release;MinSizeRel;RelWithDebInfo
-- CMAKE_CPACK_COMMAND=C:/ProgramData/chocolatey/lib/cmake.portable/tools/cmake-3.10.2-win64-x64/bin/cpack.exe
-- CMAKE_CREATE_CONSOLE_EXE=/subsystem:console
-- CMAKE_CREATE_WIN32_EXE=/subsystem:windows
-- CMAKE_CROSSCOMPILING=FALSE
-- CMAKE_CTEST_COMMAND=C:/ProgramData/chocolatey/lib/cmake.portable/tools/cmake-3.10.2-win64-x64/bin/ctest.exe
-- CMAKE_CURRENT_BINARY_DIR=C:/Users/dkiva/workspace/my/info-cmake/cmake-variables/build
-- CMAKE_CURRENT_LIST_DIR=C:/Users/dkiva/workspace/my/info-cmake/cmake-variables
-- CMAKE_CURRENT_LIST_FILE=C:/Users/dkiva/workspace/my/info-cmake/cmake-variables/vars.cmake
-- CMAKE_CURRENT_SOURCE_DIR=C:/Users/dkiva/workspace/my/info-cmake/cmake-variables
-- CMAKE_CXX11_COMPILE_FEATURES=
-- CMAKE_CXX11_EXTENSION_COMPILE_OPTION=
-- CMAKE_CXX11_STANDARD_COMPILE_OPTION=
-- CMAKE_CXX14_COMPILE_FEATURES=cxx_std_14
-- CMAKE_CXX14_EXTENSION_COMPILE_OPTION=-std:c++14
-- CMAKE_CXX14_STANDARD_COMPILE_OPTION=-std:c++14
-- CMAKE_CXX17_COMPILE_FEATURES=cxx_std_17
-- CMAKE_CXX17_EXTENSION_COMPILE_OPTION=-std:c++17
-- CMAKE_CXX17_STANDARD_COMPILE_OPTION=-std:c++17
-- CMAKE_CXX98_COMPILE_FEATURES=cxx_std_11;cxx_std_98;cxx_aggregate_default_initializers;cxx_alias_templates;cxx_alignas;cxx_alignof;cxx_attributes;cxx_attribute_deprecated;cxx_auto_type;cxx_binary_literals;cxx_constexpr;cxx_contextual_conversions;cxx_decltype;cxx_decltype_auto;cxx_default_function_template_args;cxx_defaulted_functions;cxx_defaulted_move_initializers;cxx_delegating_constructors;cxx_deleted_functions;cxx_digit_separators;cxx_enum_forward_declarations;cxx_explicit_conversions;cxx_extended_friend_declarations;cxx_extern_templates;cxx_final;cxx_func_identifier;cxx_generalized_initializers;cxx_generic_lambdas;cxx_inheriting_constructors;cxx_inline_namespaces;cxx_lambdas;cxx_lambda_init_captures;cxx_local_type_template_args;cxx_long_long_type;cxx_noexcept;cxx_nonstatic_member_init;cxx_nullptr;cxx_override;cxx_range_for;cxx_raw_string_literals;cxx_reference_qualified_functions;cxx_return_type_deduction;cxx_right_angle_brackets;cxx_rvalue_references;cxx_sizeof_member;cxx_static_assert;cxx_strong_enums;cxx_template_template_parameters;cxx_thread_local;cxx_trailing_return_types;cxx_unicode_literals;cxx_uniform_initialization;cxx_unrestricted_unions;cxx_user_literals;cxx_variable_templates;cxx_variadic_macros;cxx_variadic_templates
-- CMAKE_CXX98_EXTENSION_COMPILE_OPTION=
-- CMAKE_CXX98_STANDARD_COMPILE_OPTION=
-- CMAKE_CXX_ABI_COMPILED=TRUE
-- CMAKE_CXX_ARCHIVE_APPEND=<CMAKE_AR> q  <TARGET> <LINK_FLAGS> <OBJECTS>
-- CMAKE_CXX_ARCHIVE_CREATE=<CMAKE_AR> qc <TARGET> <LINK_FLAGS> <OBJECTS>
-- CMAKE_CXX_ARCHIVE_FINISH=<CMAKE_RANLIB> <TARGET>
-- CMAKE_CXX_CL_SHOWINCLUDES_PREFIX=
-- CMAKE_CXX_COMPILER=C:/Program Files (x86)/Microsoft Visual Studio/2017/Community/VC/Tools/MSVC/14.13.26128/bin/Hostx86/x64/cl.exe
-- CMAKE_CXX_COMPILER_ABI=
-- CMAKE_CXX_COMPILER_AR=
-- CMAKE_CXX_COMPILER_ARCHITECTURE_ID=x64
-- CMAKE_CXX_COMPILER_ARG1=
-- CMAKE_CXX_COMPILER_ENV_VAR=CXX
-- CMAKE_CXX_COMPILER_EXCLUDE=CC;aCC;xlC
-- CMAKE_CXX_COMPILER_ID=MSVC
-- CMAKE_CXX_COMPILER_ID_PLATFORM_CONTENT=#define STRINGIFY_HELPER(X) #X
#define STRINGIFY(X) STRINGIFY_HELPER(X)

/* Identify known platforms by name.  */
#if defined(__linux) || defined(__linux__) || defined(linux)
# define PLATFORM_ID "Linux"

#elif defined(__CYGWIN__)
# define PLATFORM_ID "Cygwin"

#elif defined(__MINGW32__)
# define PLATFORM_ID "MinGW"

#elif defined(__APPLE__)
# define PLATFORM_ID "Darwin"

#elif defined(_WIN32) || defined(__WIN32__) || defined(WIN32)
# define PLATFORM_ID "Windows"

#elif defined(__FreeBSD__) || defined(__FreeBSD)
# define PLATFORM_ID "FreeBSD"

#elif defined(__NetBSD__) || defined(__NetBSD)
# define PLATFORM_ID "NetBSD"

#elif defined(__OpenBSD__) || defined(__OPENBSD)
# define PLATFORM_ID "OpenBSD"

#elif defined(__sun) || defined(sun)
# define PLATFORM_ID "SunOS"

#elif defined(_AIX) || defined(__AIX) || defined(__AIX__) || defined(__aix) || defined(__aix__)
# define PLATFORM_ID "AIX"

#elif defined(__sgi) || defined(__sgi__) || defined(_SGI)
# define PLATFORM_ID "IRIX"

#elif defined(__hpux) || defined(__hpux__)
# define PLATFORM_ID "HP-UX"

#elif defined(__HAIKU__)
# define PLATFORM_ID "Haiku"

#elif defined(__BeOS) || defined(__BEOS__) || defined(_BEOS)
# define PLATFORM_ID "BeOS"

#elif defined(__QNX__) || defined(__QNXNTO__)
# define PLATFORM_ID "QNX"

#elif defined(__tru64) || defined(_tru64) || defined(__TRU64__)
# define PLATFORM_ID "Tru64"

#elif defined(__riscos) || defined(__riscos__)
# define PLATFORM_ID "RISCos"

#elif defined(__sinix) || defined(__sinix__) || defined(__SINIX__)
# define PLATFORM_ID "SINIX"

#elif defined(__UNIX_SV__)
# define PLATFORM_ID "UNIX_SV"

#elif defined(__bsdos__)
# define PLATFORM_ID "BSDOS"

#elif defined(_MPRAS) || defined(MPRAS)
# define PLATFORM_ID "MP-RAS"

#elif defined(__osf) || defined(__osf__)
# define PLATFORM_ID "OSF1"

#elif defined(_SCO_SV) || defined(SCO_SV) || defined(sco_sv)
# define PLATFORM_ID "SCO_SV"

#elif defined(__ultrix) || defined(__ultrix__) || defined(_ULTRIX)
# define PLATFORM_ID "ULTRIX"

#elif defined(__XENIX__) || defined(_XENIX) || defined(XENIX)
# define PLATFORM_ID "Xenix"

#elif defined(__WATCOMC__)
# if defined(__LINUX__)
#  define PLATFORM_ID "Linux"

# elif defined(__DOS__)
#  define PLATFORM_ID "DOS"

# elif defined(__OS2__)
#  define PLATFORM_ID "OS2"

# elif defined(__WINDOWS__)
#  define PLATFORM_ID "Windows3x"

# else /* unknown platform */
#  define PLATFORM_ID
# endif

#else /* unknown platform */
# define PLATFORM_ID

#endif

/* For windows compilers MSVC and Intel we can determine
   the architecture of the compiler being used.  This is because
   the compilers do not have flags that can change the architecture,
   but rather depend on which compiler is being used
*/
#if defined(_WIN32) && defined(_MSC_VER)
# if defined(_M_IA64)
#  define ARCHITECTURE_ID "IA64"

# elif defined(_M_X64) || defined(_M_AMD64)
#  define ARCHITECTURE_ID "x64"

# elif defined(_M_IX86)
#  define ARCHITECTURE_ID "X86"

# elif defined(_M_ARM64)
#  define ARCHITECTURE_ID "ARM64"

# elif defined(_M_ARM)
#  if _M_ARM == 4
#   define ARCHITECTURE_ID "ARMV4I"
#  elif _M_ARM == 5
#   define ARCHITECTURE_ID "ARMV5I"
#  else
#   define ARCHITECTURE_ID "ARMV" STRINGIFY(_M_ARM)
#  endif

# elif defined(_M_MIPS)
#  define ARCHITECTURE_ID "MIPS"

# elif defined(_M_SH)
#  define ARCHITECTURE_ID "SHx"

# else /* unknown architecture */
#  define ARCHITECTURE_ID ""
# endif

#elif defined(__WATCOMC__)
# if defined(_M_I86)
#  define ARCHITECTURE_ID "I86"

# elif defined(_M_IX86)
#  define ARCHITECTURE_ID "X86"

# else /* unknown architecture */
#  define ARCHITECTURE_ID ""
# endif

#elif defined(__IAR_SYSTEMS_ICC__) || defined(__IAR_SYSTEMS_ICC)
# if defined(__ICCARM__)
#  define ARCHITECTURE_ID "ARM"

# elif defined(__ICCAVR__)
#  define ARCHITECTURE_ID "AVR"

# else /* unknown architecture */
#  define ARCHITECTURE_ID ""
# endif
#else
#  define ARCHITECTURE_ID
#endif

/* Convert integer to decimal digit literals.  */
#define DEC(n)                   \
  ('0' + (((n) / 10000000)%10)), \
  ('0' + (((n) / 1000000)%10)),  \
  ('0' + (((n) / 100000)%10)),   \
  ('0' + (((n) / 10000)%10)),    \
  ('0' + (((n) / 1000)%10)),     \
  ('0' + (((n) / 100)%10)),      \
  ('0' + (((n) / 10)%10)),       \
  ('0' +  ((n) % 10))

/* Convert integer to hex digit literals.  */
#define HEX(n)             \
  ('0' + ((n)>>28 & 0xF)), \
  ('0' + ((n)>>24 & 0xF)), \
  ('0' + ((n)>>20 & 0xF)), \
  ('0' + ((n)>>16 & 0xF)), \
  ('0' + ((n)>>12 & 0xF)), \
  ('0' + ((n)>>8  & 0xF)), \
  ('0' + ((n)>>4  & 0xF)), \
  ('0' + ((n)     & 0xF))

/* Construct a string literal encoding the version number components. */
#ifdef COMPILER_VERSION_MAJOR
char const info_version[] = {
  'I', 'N', 'F', 'O', ':',
  'c','o','m','p','i','l','e','r','_','v','e','r','s','i','o','n','[',
  COMPILER_VERSION_MAJOR,
# ifdef COMPILER_VERSION_MINOR
  '.', COMPILER_VERSION_MINOR,
#  ifdef COMPILER_VERSION_PATCH
   '.', COMPILER_VERSION_PATCH,
#   ifdef COMPILER_VERSION_TWEAK
    '.', COMPILER_VERSION_TWEAK,
#   endif
#  endif
# endif
  ']','\0'};
#endif

/* Construct a string literal encoding the internal version number. */
#ifdef COMPILER_VERSION_INTERNAL
char const info_version_internal[] = {
  'I', 'N', 'F', 'O', ':',
  'c','o','m','p','i','l','e','r','_','v','e','r','s','i','o','n','_',
  'i','n','t','e','r','n','a','l','[',
  COMPILER_VERSION_INTERNAL,']','\0'};
#endif

/* Construct a string literal encoding the version number components. */
#ifdef SIMULATE_VERSION_MAJOR
char const info_simulate_version[] = {
  'I', 'N', 'F', 'O', ':',
  's','i','m','u','l','a','t','e','_','v','e','r','s','i','o','n','[',
  SIMULATE_VERSION_MAJOR,
# ifdef SIMULATE_VERSION_MINOR
  '.', SIMULATE_VERSION_MINOR,
#  ifdef SIMULATE_VERSION_PATCH
   '.', SIMULATE_VERSION_PATCH,
#   ifdef SIMULATE_VERSION_TWEAK
    '.', SIMULATE_VERSION_TWEAK,
#   endif
#  endif
# endif
  ']','\0'};
#endif

/* Construct the string literal in pieces to prevent the source from
   getting matched.  Store it in a pointer rather than an array
   because some compilers will just produce instructions to fill the
   array rather than assigning a pointer to a static array.  */
char const* info_platform = "INFO" ":" "platform[" PLATFORM_ID "]";
char const* info_arch = "INFO" ":" "arch[" ARCHITECTURE_ID "]";


-- CMAKE_CXX_COMPILER_ID_RUN=1
-- CMAKE_CXX_COMPILER_ID_TOOL_MATCH_INDEX=2
-- CMAKE_CXX_COMPILER_ID_TOOL_MATCH_REGEX=
Ld[^
]*(
[ 	]+[^
]*)*
[ 	]+([^
]+)[^
]*-o[^
]*CompilerIdCXX/(\./)?(CompilerIdCXX.xctest/)?CompilerIdCXX[
\"]
-- CMAKE_CXX_COMPILER_ID_VENDORS=IAR
-- CMAKE_CXX_COMPILER_ID_VENDOR_REGEX_IAR=IAR .+ Compiler
-- CMAKE_CXX_COMPILER_LOADED=1
-- CMAKE_CXX_COMPILER_NAMES=c++
-- CMAKE_CXX_COMPILER_PRODUCED_FILES=CompilerIdCXX.exe;CompilerIdCXX.vcxproj
-- CMAKE_CXX_COMPILER_PRODUCED_OUTPUT=Microsoft (R) Build Engine version 15.6.82.30579 for .NET Framework
Copyright (C) Microsoft Corporation. All rights reserved.

Build started 20.03.2018 1:36:58.
Project "C:\Users\dkiva\workspace\my\info-cmake\cmake-variables\build\CMakeFiles\3.10.2\CompilerIdCXX\CompilerIdCXX.vcxproj" on node 1 (default targets).
PrepareForBuild:
  Creating directory "Debug\".
  Creating directory "Debug\CompilerIdCXX.tlog\".
InitializeBuildStatus:
  Creating "Debug\CompilerIdCXX.tlog\unsuccessfulbuild" because "AlwaysCreate" was specified.
ClCompile:
  C:\Program Files (x86)\Microsoft Visual Studio\2017\Community\VC\Tools\MSVC\14.13.26128\bin\HostX86\x64\CL.exe /c /nologo /W0 /WX- /diagnostics:classic /Od /D _MBCS /Gm- /EHsc /RTC1 /MDd /GS /fp:precise /Zc:wchar_t /Zc:forScope /Zc:inline /Fo"Debug\\" /Fd"Debug\vc141.pdb" /Gd /TP /FC /errorReport:queue CMakeCXXCompilerId.cpp
  CMakeCXXCompilerId.cpp
Link:
  C:\Program Files (x86)\Microsoft Visual Studio\2017\Community\VC\Tools\MSVC\14.13.26128\bin\HostX86\x64\link.exe /ERRORREPORT:QUEUE /OUT:".\CompilerIdCXX.exe" /INCREMENTAL:NO /NOLOGO kernel32.lib user32.lib gdi32.lib winspool.lib comdlg32.lib advapi32.lib shell32.lib ole32.lib oleaut32.lib uuid.lib odbc32.lib odbccp32.lib /MANIFEST /MANIFESTUAC:"level='asInvoker' uiAccess='false'" /manifest:embed /PDB:".\CompilerIdCXX.pdb" /SUBSYSTEM:CONSOLE /TLBID:1 /DYNAMICBASE /NXCOMPAT /IMPLIB:".\CompilerIdCXX.lib" /MACHINE:X64 Debug\CMakeCXXCompilerId.obj
  CompilerIdCXX.vcxproj -> C:\Users\dkiva\workspace\my\info-cmake\cmake-variables\build\CMakeFiles\3.10.2\CompilerIdCXX\.\CompilerIdCXX.exe
PostBuildEvent:
  for %%i in (cl.exe) do @echo CMAKE_CXX_COMPILER=%%~$PATH:i
  :VCEnd
  CMAKE_CXX_COMPILER=C:\Program Files (x86)\Microsoft Visual Studio\2017\Community\VC\Tools\MSVC\14.13.26128\bin\Hostx86\x64\cl.exe
FinalizeBuildStatus:
  Deleting file "Debug\CompilerIdCXX.tlog\unsuccessfulbuild".
  Touching "Debug\CompilerIdCXX.tlog\CompilerIdCXX.lastbuildstate".
Done Building Project "C:\Users\dkiva\workspace\my\info-cmake\cmake-variables\build\CMakeFiles\3.10.2\CompilerIdCXX\CompilerIdCXX.vcxproj" (default targets).

Build succeeded.
    0 Warning(s)
    0 Error(s)

Time Elapsed 00:00:01.02

-- CMAKE_CXX_COMPILER_RANLIB=
-- CMAKE_CXX_COMPILER_VERSION=19.13.26128.0
-- CMAKE_CXX_COMPILER_VERSION_INTERNAL=
-- CMAKE_CXX_COMPILER_WORKS=TRUE
-- CMAKE_CXX_COMPILER_WRAPPER=
-- CMAKE_CXX_COMPILE_FEATURES=cxx_std_11;cxx_std_98;cxx_aggregate_default_initializers;cxx_alias_templates;cxx_alignas;cxx_alignof;cxx_attributes;cxx_attribute_deprecated;cxx_auto_type;cxx_binary_literals;cxx_constexpr;cxx_contextual_conversions;cxx_decltype;cxx_decltype_auto;cxx_default_function_template_args;cxx_defaulted_functions;cxx_defaulted_move_initializers;cxx_delegating_constructors;cxx_deleted_functions;cxx_digit_separators;cxx_enum_forward_declarations;cxx_explicit_conversions;cxx_extended_friend_declarations;cxx_extern_templates;cxx_final;cxx_func_identifier;cxx_generalized_initializers;cxx_generic_lambdas;cxx_inheriting_constructors;cxx_inline_namespaces;cxx_lambdas;cxx_lambda_init_captures;cxx_local_type_template_args;cxx_long_long_type;cxx_noexcept;cxx_nonstatic_member_init;cxx_nullptr;cxx_override;cxx_range_for;cxx_raw_string_literals;cxx_reference_qualified_functions;cxx_return_type_deduction;cxx_right_angle_brackets;cxx_rvalue_references;cxx_sizeof_member;cxx_static_assert;cxx_strong_enums;cxx_template_template_parameters;cxx_thread_local;cxx_trailing_return_types;cxx_unicode_literals;cxx_uniform_initialization;cxx_unrestricted_unions;cxx_user_literals;cxx_variable_templates;cxx_variadic_macros;cxx_variadic_templates;cxx_std_14;cxx_std_17
-- CMAKE_CXX_COMPILE_OBJECT=<CMAKE_CXX_COMPILER>  /nologo /TP <DEFINES> <INCLUDES> <FLAGS> /Fo<OBJECT> /Fd<TARGET_COMPILE_PDB> /FS -c <SOURCE>
-- CMAKE_CXX_CREATE_ASSEMBLY_SOURCE=<CMAKE_CXX_COMPILER>  /nologo /TP <DEFINES> <INCLUDES> <FLAGS> /FoNUL /FAs /Fa<ASSEMBLY_SOURCE> /c <SOURCE>
-- CMAKE_CXX_CREATE_PREPROCESSED_SOURCE=<CMAKE_CXX_COMPILER> > <PREPROCESSED_SOURCE>  /nologo /TP <DEFINES> <INCLUDES> <FLAGS> -E <SOURCE>
-- CMAKE_CXX_CREATE_SHARED_LIBRARY=<CMAKE_COMMAND> -E vs_link_dll --intdir=<OBJECT_DIR> --manifests <MANIFESTS> -- <CMAKE_LINKER> /nologo <OBJECTS>  /out:<TARGET> /implib:<TARGET_IMPLIB> /pdb:<TARGET_PDB> /dll /version:<TARGET_VERSION_MAJOR>.<TARGET_VERSION_MINOR> <LINK_FLAGS> <LINK_LIBRARIES>
-- CMAKE_CXX_CREATE_SHARED_MODULE=<CMAKE_COMMAND> -E vs_link_dll --intdir=<OBJECT_DIR> --manifests <MANIFESTS> -- <CMAKE_LINKER> /nologo <OBJECTS>  /out:<TARGET> /implib:<TARGET_IMPLIB> /pdb:<TARGET_PDB> /dll /version:<TARGET_VERSION_MAJOR>.<TARGET_VERSION_MINOR> <LINK_FLAGS> <LINK_LIBRARIES>
-- CMAKE_CXX_CREATE_STATIC_LIBRARY=<CMAKE_LINKER> /lib /nologo <LINK_FLAGS> /out:<TARGET> <OBJECTS>
-- CMAKE_CXX_FLAGS=/DWIN32 /D_WINDOWS /W3 /GR /EHsc
-- CMAKE_CXX_FLAGS_DEBUG=/MDd /Zi /Ob0 /Od /RTC1
-- CMAKE_CXX_FLAGS_DEBUG_INIT=/MDd /Zi /Ob0 /Od /RTC1
-- CMAKE_CXX_FLAGS_INIT=/DWIN32 /D_WINDOWS /W3 /GR /EHsc
-- CMAKE_CXX_FLAGS_MINSIZEREL=/MD /O1 /Ob1 /DNDEBUG
-- CMAKE_CXX_FLAGS_MINSIZEREL_INIT=/MD /O1 /Ob1 /DNDEBUG
-- CMAKE_CXX_FLAGS_RELEASE=/MD /O2 /Ob2 /DNDEBUG
-- CMAKE_CXX_FLAGS_RELEASE_INIT=/MD /O2 /Ob2 /DNDEBUG
-- CMAKE_CXX_FLAGS_RELWITHDEBINFO=/MD /Zi /O2 /Ob1 /DNDEBUG
-- CMAKE_CXX_FLAGS_RELWITHDEBINFO_INIT=/MD /Zi /O2 /Ob1 /DNDEBUG
-- CMAKE_CXX_IGNORE_EXTENSIONS=inl;h;hpp;HPP;H;o;O;obj;OBJ;def;DEF;rc;RC
-- CMAKE_CXX_IMPLICIT_LINK_DIRECTORIES=
-- CMAKE_CXX_IMPLICIT_LINK_FRAMEWORK_DIRECTORIES=
-- CMAKE_CXX_IMPLICIT_LINK_LIBRARIES=
-- CMAKE_CXX_INFORMATION_LOADED=1
-- CMAKE_CXX_LIBRARY_ARCHITECTURE=
-- CMAKE_CXX_LINKER_PREFERENCE=30
-- CMAKE_CXX_LINKER_PREFERENCE_PROPAGATES=1
-- CMAKE_CXX_LINKER_SUPPORTS_PDB=ON
-- CMAKE_CXX_LINK_EXECUTABLE=<CMAKE_COMMAND> -E vs_link_exe --intdir=<OBJECT_DIR> --manifests <MANIFESTS> -- <CMAKE_LINKER> /nologo <OBJECTS>  /out:<TARGET> /implib:<TARGET_IMPLIB> /pdb:<TARGET_PDB> /version:<TARGET_VERSION_MAJOR>.<TARGET_VERSION_MINOR> <CMAKE_CXX_LINK_FLAGS> <LINK_FLAGS> <LINK_LIBRARIES>
-- CMAKE_CXX_OUTPUT_EXTENSION=.obj
-- CMAKE_CXX_PLATFORM_ID=Windows
-- CMAKE_CXX_SIMULATE_ID=
-- CMAKE_CXX_SIMULATE_VERSION=
-- CMAKE_CXX_SIZEOF_DATA_PTR=8
-- CMAKE_CXX_SOURCE_FILE_EXTENSIONS=C;M;c++;cc;cpp;cxx;mm;CPP
-- CMAKE_CXX_STANDARD_COMPUTED_DEFAULT=14
-- CMAKE_CXX_STANDARD_DEFAULT=14
-- CMAKE_CXX_STANDARD_LIBRARIES=kernel32.lib user32.lib gdi32.lib winspool.lib shell32.lib ole32.lib oleaut32.lib uuid.lib comdlg32.lib advapi32.lib
-- CMAKE_CXX_STANDARD_LIBRARIES_INIT=kernel32.lib user32.lib gdi32.lib winspool.lib shell32.lib ole32.lib oleaut32.lib uuid.lib comdlg32.lib advapi32.lib
-- CMAKE_CXX_USE_RESPONSE_FILE_FOR_OBJECTS=1
-- CMAKE_CXX_XCODE_CURRENT_ARCH=
-- CMAKE_C_ABI_COMPILED=TRUE
-- CMAKE_C_ARCHIVE_APPEND=<CMAKE_AR> q  <TARGET> <LINK_FLAGS> <OBJECTS>
-- CMAKE_C_ARCHIVE_CREATE=<CMAKE_AR> qc <TARGET> <LINK_FLAGS> <OBJECTS>
-- CMAKE_C_ARCHIVE_FINISH=<CMAKE_RANLIB> <TARGET>
-- CMAKE_C_CL_SHOWINCLUDES_PREFIX=
-- CMAKE_C_COMPILER=C:/Program Files (x86)/Microsoft Visual Studio/2017/Community/VC/Tools/MSVC/14.13.26128/bin/Hostx86/x64/cl.exe
-- CMAKE_C_COMPILER_ABI=
-- CMAKE_C_COMPILER_AR=
-- CMAKE_C_COMPILER_ARCHITECTURE_ID=x64
-- CMAKE_C_COMPILER_ARG1=
-- CMAKE_C_COMPILER_ENV_VAR=CC
-- CMAKE_C_COMPILER_ID=MSVC
-- CMAKE_C_COMPILER_ID_PLATFORM_CONTENT=#define STRINGIFY_HELPER(X) #X
#define STRINGIFY(X) STRINGIFY_HELPER(X)

/* Identify known platforms by name.  */
#if defined(__linux) || defined(__linux__) || defined(linux)
# define PLATFORM_ID "Linux"

#elif defined(__CYGWIN__)
# define PLATFORM_ID "Cygwin"

#elif defined(__MINGW32__)
# define PLATFORM_ID "MinGW"

#elif defined(__APPLE__)
# define PLATFORM_ID "Darwin"

#elif defined(_WIN32) || defined(__WIN32__) || defined(WIN32)
# define PLATFORM_ID "Windows"

#elif defined(__FreeBSD__) || defined(__FreeBSD)
# define PLATFORM_ID "FreeBSD"

#elif defined(__NetBSD__) || defined(__NetBSD)
# define PLATFORM_ID "NetBSD"

#elif defined(__OpenBSD__) || defined(__OPENBSD)
# define PLATFORM_ID "OpenBSD"

#elif defined(__sun) || defined(sun)
# define PLATFORM_ID "SunOS"

#elif defined(_AIX) || defined(__AIX) || defined(__AIX__) || defined(__aix) || defined(__aix__)
# define PLATFORM_ID "AIX"

#elif defined(__sgi) || defined(__sgi__) || defined(_SGI)
# define PLATFORM_ID "IRIX"

#elif defined(__hpux) || defined(__hpux__)
# define PLATFORM_ID "HP-UX"

#elif defined(__HAIKU__)
# define PLATFORM_ID "Haiku"

#elif defined(__BeOS) || defined(__BEOS__) || defined(_BEOS)
# define PLATFORM_ID "BeOS"

#elif defined(__QNX__) || defined(__QNXNTO__)
# define PLATFORM_ID "QNX"

#elif defined(__tru64) || defined(_tru64) || defined(__TRU64__)
# define PLATFORM_ID "Tru64"

#elif defined(__riscos) || defined(__riscos__)
# define PLATFORM_ID "RISCos"

#elif defined(__sinix) || defined(__sinix__) || defined(__SINIX__)
# define PLATFORM_ID "SINIX"

#elif defined(__UNIX_SV__)
# define PLATFORM_ID "UNIX_SV"

#elif defined(__bsdos__)
# define PLATFORM_ID "BSDOS"

#elif defined(_MPRAS) || defined(MPRAS)
# define PLATFORM_ID "MP-RAS"

#elif defined(__osf) || defined(__osf__)
# define PLATFORM_ID "OSF1"

#elif defined(_SCO_SV) || defined(SCO_SV) || defined(sco_sv)
# define PLATFORM_ID "SCO_SV"

#elif defined(__ultrix) || defined(__ultrix__) || defined(_ULTRIX)
# define PLATFORM_ID "ULTRIX"

#elif defined(__XENIX__) || defined(_XENIX) || defined(XENIX)
# define PLATFORM_ID "Xenix"

#elif defined(__WATCOMC__)
# if defined(__LINUX__)
#  define PLATFORM_ID "Linux"

# elif defined(__DOS__)
#  define PLATFORM_ID "DOS"

# elif defined(__OS2__)
#  define PLATFORM_ID "OS2"

# elif defined(__WINDOWS__)
#  define PLATFORM_ID "Windows3x"

# else /* unknown platform */
#  define PLATFORM_ID
# endif

#else /* unknown platform */
# define PLATFORM_ID

#endif

/* For windows compilers MSVC and Intel we can determine
   the architecture of the compiler being used.  This is because
   the compilers do not have flags that can change the architecture,
   but rather depend on which compiler is being used
*/
#if defined(_WIN32) && defined(_MSC_VER)
# if defined(_M_IA64)
#  define ARCHITECTURE_ID "IA64"

# elif defined(_M_X64) || defined(_M_AMD64)
#  define ARCHITECTURE_ID "x64"

# elif defined(_M_IX86)
#  define ARCHITECTURE_ID "X86"

# elif defined(_M_ARM64)
#  define ARCHITECTURE_ID "ARM64"

# elif defined(_M_ARM)
#  if _M_ARM == 4
#   define ARCHITECTURE_ID "ARMV4I"
#  elif _M_ARM == 5
#   define ARCHITECTURE_ID "ARMV5I"
#  else
#   define ARCHITECTURE_ID "ARMV" STRINGIFY(_M_ARM)
#  endif

# elif defined(_M_MIPS)
#  define ARCHITECTURE_ID "MIPS"

# elif defined(_M_SH)
#  define ARCHITECTURE_ID "SHx"

# else /* unknown architecture */
#  define ARCHITECTURE_ID ""
# endif

#elif defined(__WATCOMC__)
# if defined(_M_I86)
#  define ARCHITECTURE_ID "I86"

# elif defined(_M_IX86)
#  define ARCHITECTURE_ID "X86"

# else /* unknown architecture */
#  define ARCHITECTURE_ID ""
# endif

#elif defined(__IAR_SYSTEMS_ICC__) || defined(__IAR_SYSTEMS_ICC)
# if defined(__ICCARM__)
#  define ARCHITECTURE_ID "ARM"

# elif defined(__ICCAVR__)
#  define ARCHITECTURE_ID "AVR"

# else /* unknown architecture */
#  define ARCHITECTURE_ID ""
# endif
#else
#  define ARCHITECTURE_ID
#endif

/* Convert integer to decimal digit literals.  */
#define DEC(n)                   \
  ('0' + (((n) / 10000000)%10)), \
  ('0' + (((n) / 1000000)%10)),  \
  ('0' + (((n) / 100000)%10)),   \
  ('0' + (((n) / 10000)%10)),    \
  ('0' + (((n) / 1000)%10)),     \
  ('0' + (((n) / 100)%10)),      \
  ('0' + (((n) / 10)%10)),       \
  ('0' +  ((n) % 10))

/* Convert integer to hex digit literals.  */
#define HEX(n)             \
  ('0' + ((n)>>28 & 0xF)), \
  ('0' + ((n)>>24 & 0xF)), \
  ('0' + ((n)>>20 & 0xF)), \
  ('0' + ((n)>>16 & 0xF)), \
  ('0' + ((n)>>12 & 0xF)), \
  ('0' + ((n)>>8  & 0xF)), \
  ('0' + ((n)>>4  & 0xF)), \
  ('0' + ((n)     & 0xF))

/* Construct a string literal encoding the version number components. */
#ifdef COMPILER_VERSION_MAJOR
char const info_version[] = {
  'I', 'N', 'F', 'O', ':',
  'c','o','m','p','i','l','e','r','_','v','e','r','s','i','o','n','[',
  COMPILER_VERSION_MAJOR,
# ifdef COMPILER_VERSION_MINOR
  '.', COMPILER_VERSION_MINOR,
#  ifdef COMPILER_VERSION_PATCH
   '.', COMPILER_VERSION_PATCH,
#   ifdef COMPILER_VERSION_TWEAK
    '.', COMPILER_VERSION_TWEAK,
#   endif
#  endif
# endif
  ']','\0'};
#endif

/* Construct a string literal encoding the internal version number. */
#ifdef COMPILER_VERSION_INTERNAL
char const info_version_internal[] = {
  'I', 'N', 'F', 'O', ':',
  'c','o','m','p','i','l','e','r','_','v','e','r','s','i','o','n','_',
  'i','n','t','e','r','n','a','l','[',
  COMPILER_VERSION_INTERNAL,']','\0'};
#endif

/* Construct a string literal encoding the version number components. */
#ifdef SIMULATE_VERSION_MAJOR
char const info_simulate_version[] = {
  'I', 'N', 'F', 'O', ':',
  's','i','m','u','l','a','t','e','_','v','e','r','s','i','o','n','[',
  SIMULATE_VERSION_MAJOR,
# ifdef SIMULATE_VERSION_MINOR
  '.', SIMULATE_VERSION_MINOR,
#  ifdef SIMULATE_VERSION_PATCH
   '.', SIMULATE_VERSION_PATCH,
#   ifdef SIMULATE_VERSION_TWEAK
    '.', SIMULATE_VERSION_TWEAK,
#   endif
#  endif
# endif
  ']','\0'};
#endif

/* Construct the string literal in pieces to prevent the source from
   getting matched.  Store it in a pointer rather than an array
   because some compilers will just produce instructions to fill the
   array rather than assigning a pointer to a static array.  */
char const* info_platform = "INFO" ":" "platform[" PLATFORM_ID "]";
char const* info_arch = "INFO" ":" "arch[" ARCHITECTURE_ID "]";


-- CMAKE_C_COMPILER_ID_RUN=1
-- CMAKE_C_COMPILER_ID_TOOL_MATCH_INDEX=2
-- CMAKE_C_COMPILER_ID_TOOL_MATCH_REGEX=
Ld[^
]*(
[ 	]+[^
]*)*
[ 	]+([^
]+)[^
]*-o[^
]*CompilerIdC/(\./)?(CompilerIdC.xctest/)?CompilerIdC[
\"]
-- CMAKE_C_COMPILER_ID_VENDORS=IAR
-- CMAKE_C_COMPILER_ID_VENDOR_REGEX_IAR=IAR .+ Compiler
-- CMAKE_C_COMPILER_LOADED=1
-- CMAKE_C_COMPILER_NAMES=cc
-- CMAKE_C_COMPILER_PRODUCED_FILES=CompilerIdC.exe;CompilerIdC.vcxproj
-- CMAKE_C_COMPILER_PRODUCED_OUTPUT=Microsoft (R) Build Engine version 15.6.82.30579 for .NET Framework
Copyright (C) Microsoft Corporation. All rights reserved.

Build started 20.03.2018 1:36:57.
Project "C:\Users\dkiva\workspace\my\info-cmake\cmake-variables\build\CMakeFiles\3.10.2\CompilerIdC\CompilerIdC.vcxproj" on node 1 (default targets).
PrepareForBuild:
  Creating directory "Debug\".
  Creating directory "Debug\CompilerIdC.tlog\".
InitializeBuildStatus:
  Creating "Debug\CompilerIdC.tlog\unsuccessfulbuild" because "AlwaysCreate" was specified.
ClCompile:
  C:\Program Files (x86)\Microsoft Visual Studio\2017\Community\VC\Tools\MSVC\14.13.26128\bin\HostX86\x64\CL.exe /c /nologo /W0 /WX- /diagnostics:classic /Od /D _MBCS /Gm- /EHsc /RTC1 /MDd /GS /fp:precise /Zc:wchar_t /Zc:forScope /Zc:inline /Fo"Debug\\" /Fd"Debug\vc141.pdb" /Gd /TC /FC /errorReport:queue CMakeCCompilerId.c
  CMakeCCompilerId.c
Link:
  C:\Program Files (x86)\Microsoft Visual Studio\2017\Community\VC\Tools\MSVC\14.13.26128\bin\HostX86\x64\link.exe /ERRORREPORT:QUEUE /OUT:".\CompilerIdC.exe" /INCREMENTAL:NO /NOLOGO kernel32.lib user32.lib gdi32.lib winspool.lib comdlg32.lib advapi32.lib shell32.lib ole32.lib oleaut32.lib uuid.lib odbc32.lib odbccp32.lib /MANIFEST /MANIFESTUAC:"level='asInvoker' uiAccess='false'" /manifest:embed /PDB:".\CompilerIdC.pdb" /SUBSYSTEM:CONSOLE /TLBID:1 /DYNAMICBASE /NXCOMPAT /IMPLIB:".\CompilerIdC.lib" /MACHINE:X64 Debug\CMakeCCompilerId.obj
  CompilerIdC.vcxproj -> C:\Users\dkiva\workspace\my\info-cmake\cmake-variables\build\CMakeFiles\3.10.2\CompilerIdC\.\CompilerIdC.exe
PostBuildEvent:
  for %%i in (cl.exe) do @echo CMAKE_C_COMPILER=%%~$PATH:i
  :VCEnd
  CMAKE_C_COMPILER=C:\Program Files (x86)\Microsoft Visual Studio\2017\Community\VC\Tools\MSVC\14.13.26128\bin\Hostx86\x64\cl.exe
FinalizeBuildStatus:
  Deleting file "Debug\CompilerIdC.tlog\unsuccessfulbuild".
  Touching "Debug\CompilerIdC.tlog\CompilerIdC.lastbuildstate".
Done Building Project "C:\Users\dkiva\workspace\my\info-cmake\cmake-variables\build\CMakeFiles\3.10.2\CompilerIdC\CompilerIdC.vcxproj" (default targets).

Build succeeded.
    0 Warning(s)
    0 Error(s)

Time Elapsed 00:00:01.14

-- CMAKE_C_COMPILER_RANLIB=
-- CMAKE_C_COMPILER_VERSION=19.13.26128.0
-- CMAKE_C_COMPILER_VERSION_INTERNAL=
-- CMAKE_C_COMPILER_WORKS=TRUE
-- CMAKE_C_COMPILER_WRAPPER=
-- CMAKE_C_COMPILE_FEATURES=
-- CMAKE_C_COMPILE_OBJECT=<CMAKE_C_COMPILER>  /nologo <DEFINES> <INCLUDES> <FLAGS> /Fo<OBJECT> /Fd<TARGET_COMPILE_PDB> /FS -c <SOURCE>
-- CMAKE_C_CREATE_ASSEMBLY_SOURCE=<CMAKE_C_COMPILER>  /nologo <DEFINES> <INCLUDES> <FLAGS> /FoNUL /FAs /Fa<ASSEMBLY_SOURCE> /c <SOURCE>
-- CMAKE_C_CREATE_PREPROCESSED_SOURCE=<CMAKE_C_COMPILER> > <PREPROCESSED_SOURCE>  /nologo <DEFINES> <INCLUDES> <FLAGS> -E <SOURCE>
-- CMAKE_C_CREATE_SHARED_LIBRARY=<CMAKE_COMMAND> -E vs_link_dll --intdir=<OBJECT_DIR> --manifests <MANIFESTS> -- <CMAKE_LINKER> /nologo <OBJECTS>  /out:<TARGET> /implib:<TARGET_IMPLIB> /pdb:<TARGET_PDB> /dll /version:<TARGET_VERSION_MAJOR>.<TARGET_VERSION_MINOR> <LINK_FLAGS> <LINK_LIBRARIES>
-- CMAKE_C_CREATE_SHARED_MODULE=<CMAKE_COMMAND> -E vs_link_dll --intdir=<OBJECT_DIR> --manifests <MANIFESTS> -- <CMAKE_LINKER> /nologo <OBJECTS>  /out:<TARGET> /implib:<TARGET_IMPLIB> /pdb:<TARGET_PDB> /dll /version:<TARGET_VERSION_MAJOR>.<TARGET_VERSION_MINOR> <LINK_FLAGS> <LINK_LIBRARIES>
-- CMAKE_C_CREATE_STATIC_LIBRARY=<CMAKE_LINKER> /lib /nologo <LINK_FLAGS> /out:<TARGET> <OBJECTS>
-- CMAKE_C_FLAGS=/DWIN32 /D_WINDOWS /W3
-- CMAKE_C_FLAGS_DEBUG=/MDd /Zi /Ob0 /Od /RTC1
-- CMAKE_C_FLAGS_DEBUG_INIT=/MDd /Zi /Ob0 /Od /RTC1
-- CMAKE_C_FLAGS_INIT=/DWIN32 /D_WINDOWS /W3
-- CMAKE_C_FLAGS_MINSIZEREL=/MD /O1 /Ob1 /DNDEBUG
-- CMAKE_C_FLAGS_MINSIZEREL_INIT=/MD /O1 /Ob1 /DNDEBUG
-- CMAKE_C_FLAGS_RELEASE=/MD /O2 /Ob2 /DNDEBUG
-- CMAKE_C_FLAGS_RELEASE_INIT=/MD /O2 /Ob2 /DNDEBUG
-- CMAKE_C_FLAGS_RELWITHDEBINFO=/MD /Zi /O2 /Ob1 /DNDEBUG
-- CMAKE_C_FLAGS_RELWITHDEBINFO_INIT=/MD /Zi /O2 /Ob1 /DNDEBUG
-- CMAKE_C_IGNORE_EXTENSIONS=h;H;o;O;obj;OBJ;def;DEF;rc;RC
-- CMAKE_C_IMPLICIT_LINK_DIRECTORIES=
-- CMAKE_C_IMPLICIT_LINK_FRAMEWORK_DIRECTORIES=
-- CMAKE_C_IMPLICIT_LINK_LIBRARIES=
-- CMAKE_C_INFORMATION_LOADED=1
-- CMAKE_C_LIBRARY_ARCHITECTURE=
-- CMAKE_C_LINKER_PREFERENCE=10
-- CMAKE_C_LINKER_SUPPORTS_PDB=ON
-- CMAKE_C_LINK_EXECUTABLE=<CMAKE_COMMAND> -E vs_link_exe --intdir=<OBJECT_DIR> --manifests <MANIFESTS> -- <CMAKE_LINKER> /nologo <OBJECTS>  /out:<TARGET> /implib:<TARGET_IMPLIB> /pdb:<TARGET_PDB> /version:<TARGET_VERSION_MAJOR>.<TARGET_VERSION_MINOR> <CMAKE_C_LINK_FLAGS> <LINK_FLAGS> <LINK_LIBRARIES>
-- CMAKE_C_OUTPUT_EXTENSION=.obj
-- CMAKE_C_PLATFORM_ID=Windows
-- CMAKE_C_SIMULATE_ID=
-- CMAKE_C_SIMULATE_VERSION=
-- CMAKE_C_SIZEOF_DATA_PTR=8
-- CMAKE_C_SOURCE_FILE_EXTENSIONS=c;m
-- CMAKE_C_STANDARD_COMPUTED_DEFAULT=90
-- CMAKE_C_STANDARD_LIBRARIES=kernel32.lib user32.lib gdi32.lib winspool.lib shell32.lib ole32.lib oleaut32.lib uuid.lib comdlg32.lib advapi32.lib
-- CMAKE_C_STANDARD_LIBRARIES_INIT=kernel32.lib user32.lib gdi32.lib winspool.lib shell32.lib ole32.lib oleaut32.lib uuid.lib comdlg32.lib advapi32.lib
-- CMAKE_C_USE_RESPONSE_FILE_FOR_OBJECTS=1
-- CMAKE_C_XCODE_CURRENT_ARCH=
-- CMAKE_DL_LIBS=
-- CMAKE_EXECUTABLE_FORMAT=Unknown
-- CMAKE_EXECUTABLE_SUFFIX=.exe
-- CMAKE_EXE_LINKER_FLAGS=/machine:x64
-- CMAKE_EXE_LINKER_FLAGS_DEBUG=/debug /INCREMENTAL
-- CMAKE_EXE_LINKER_FLAGS_DEBUG_INIT=/debug /INCREMENTAL
-- CMAKE_EXE_LINKER_FLAGS_INIT=/machine:x64
-- CMAKE_EXE_LINKER_FLAGS_MINSIZEREL=/INCREMENTAL:NO
-- CMAKE_EXE_LINKER_FLAGS_MINSIZEREL_INIT=/INCREMENTAL:NO
-- CMAKE_EXE_LINKER_FLAGS_RELEASE=/INCREMENTAL:NO
-- CMAKE_EXE_LINKER_FLAGS_RELEASE_INIT=/INCREMENTAL:NO
-- CMAKE_EXE_LINKER_FLAGS_RELWITHDEBINFO=/debug /INCREMENTAL
-- CMAKE_EXE_LINKER_FLAGS_RELWITHDEBINFO_INIT=/debug /INCREMENTAL
-- CMAKE_EXTRA_GENERATOR=
-- CMAKE_EXTRA_LINK_EXTENSIONS=.targets
-- CMAKE_FILES_DIRECTORY=/CMakeFiles
-- CMAKE_FIND_LIBRARY_PREFIXES=
-- CMAKE_FIND_LIBRARY_SUFFIXES=.lib
-- CMAKE_FORCE_WIN64=TRUE
-- CMAKE_GENERATOR=Visual Studio 15 2017 Win64
-- CMAKE_GENERATOR_NO_COMPILER_ENV=1
-- CMAKE_GENERATOR_PLATFORM=
-- CMAKE_GENERATOR_RC=rc
-- CMAKE_GENERATOR_TOOLSET=
-- CMAKE_HOME_DIRECTORY=C:/Users/dkiva/workspace/my/info-cmake/cmake-variables
-- CMAKE_HOST_SYSTEM=Windows-10.0.16299
-- CMAKE_HOST_SYSTEM_NAME=Windows
-- CMAKE_HOST_SYSTEM_PROCESSOR=AMD64
-- CMAKE_HOST_SYSTEM_VERSION=10.0.16299
-- CMAKE_HOST_WIN32=1
-- CMAKE_IMPORT_LIBRARY_PREFIX=
-- CMAKE_IMPORT_LIBRARY_SUFFIX=.lib
-- CMAKE_INCLUDE_FLAG_C=-I
-- CMAKE_INCLUDE_FLAG_CXX=-I
-- CMAKE_INCLUDE_FLAG_C_SEP=
-- CMAKE_INCLUDE_FLAG_RC=-I
-- CMAKE_INSTALL_DEFAULT_COMPONENT_NAME=Unspecified
-- CMAKE_INSTALL_PREFIX=C:/Program Files/CmakeVariables
-- CMAKE_INSTALL_PREFIX_INITIALIZED_TO_DEFAULT=1
-- CMAKE_LIBRARY_PATH_FLAG=-LIBPATH:
-- CMAKE_LIBRARY_PATH_TERMINATOR=
-- CMAKE_LINKER=C:/Program Files (x86)/Microsoft Visual Studio/2017/Community/VC/Tools/MSVC/14.13.26128/bin/Hostx86/x64/link.exe
-- CMAKE_LINKER=C:/Program Files (x86)/Microsoft Visual Studio/2017/Community/VC/Tools/MSVC/14.13.26128/bin/Hostx86/x64/link.exe
-- CMAKE_LINK_DEF_FILE_FLAG=/DEF:
-- CMAKE_LINK_LIBRARY_FLAG=
-- CMAKE_LINK_LIBRARY_SUFFIX=.lib
-- CMAKE_MAJOR_VERSION=3
-- CMAKE_MAKE_PROGRAM=C:/Program Files (x86)/Microsoft Visual Studio/2017/Community/MSBuild/15.0/Bin/MSBuild.exe
-- CMAKE_MATCH_0=
-- CMAKE_MATCH_1=
-- CMAKE_MATCH_2=
-- CMAKE_MATCH_COUNT=0
-- CMAKE_MINIMUM_REQUIRED_VERSION=3.10
-- CMAKE_MINOR_VERSION=10
-- CMAKE_MODULE_LINKER_FLAGS=/machine:x64
-- CMAKE_MODULE_LINKER_FLAGS_DEBUG=/debug /INCREMENTAL
-- CMAKE_MODULE_LINKER_FLAGS_DEBUG_INIT=/debug /INCREMENTAL
-- CMAKE_MODULE_LINKER_FLAGS_INIT=/machine:x64
-- CMAKE_MODULE_LINKER_FLAGS_MINSIZEREL=/INCREMENTAL:NO
-- CMAKE_MODULE_LINKER_FLAGS_MINSIZEREL_INIT=/INCREMENTAL:NO
-- CMAKE_MODULE_LINKER_FLAGS_RELEASE=/INCREMENTAL:NO
-- CMAKE_MODULE_LINKER_FLAGS_RELEASE_INIT=/INCREMENTAL:NO
-- CMAKE_MODULE_LINKER_FLAGS_RELWITHDEBINFO=/debug /INCREMENTAL
-- CMAKE_MODULE_LINKER_FLAGS_RELWITHDEBINFO_INIT=/debug /INCREMENTAL
-- CMAKE_NINJA_CMCLDEPS_RC=1
-- CMAKE_NINJA_DEPTYPE_C=msvc
-- CMAKE_NINJA_DEPTYPE_CXX=msvc
-- CMAKE_NO_BUILD_TYPE=1
-- CMAKE_PARENT_LIST_FILE=C:/Users/dkiva/workspace/my/info-cmake/cmake-variables/CMakeLists.txt
-- CMAKE_PATCH_VERSION=2
-- CMAKE_PLATFORM_INFO_DIR=C:/Users/dkiva/workspace/my/info-cmake/cmake-variables/build/CMakeFiles/3.10.2
-- CMAKE_PLATFORM_INFO_INITIALIZED=1
-- CMAKE_PROJECT_NAME=CmakeVariables
-- CMAKE_RANLIB=
-- CMAKE_RC_COMPILER=rc
-- CMAKE_RC_COMPILER=rc
-- CMAKE_RC_COMPILER_ARG1=
-- CMAKE_RC_COMPILER_ENV_VAR=RC
-- CMAKE_RC_COMPILER_INIT=rc
-- CMAKE_RC_COMPILER_LIST=rc
-- CMAKE_RC_COMPILER_LOADED=1
-- CMAKE_RC_COMPILER_WORKS=1
-- CMAKE_RC_COMPILE_OBJECT=<CMAKE_RC_COMPILER> <DEFINES> <INCLUDES> <FLAGS> /fo<OBJECT> <SOURCE>
-- CMAKE_RC_FLAGS=/DWIN32
-- CMAKE_RC_FLAGS_DEBUG=/D_DEBUG
-- CMAKE_RC_FLAGS_DEBUG_INIT=/D_DEBUG
-- CMAKE_RC_FLAGS_INIT=/DWIN32
-- CMAKE_RC_FLAGS_MINSIZEREL=
-- CMAKE_RC_FLAGS_MINSIZEREL_INIT=
-- CMAKE_RC_FLAGS_RELEASE=
-- CMAKE_RC_FLAGS_RELEASE_INIT=
-- CMAKE_RC_FLAGS_RELWITHDEBINFO=
-- CMAKE_RC_FLAGS_RELWITHDEBINFO_INIT=
-- CMAKE_RC_FLAG_REGEX=^[-/](D|I)
-- CMAKE_RC_INFORMATION_LOADED=1
-- CMAKE_RC_OUTPUT_EXTENSION=.res
-- CMAKE_RC_SOURCE_FILE_EXTENSIONS=rc;RC
-- CMAKE_ROOT=C:/ProgramData/chocolatey/lib/cmake.portable/tools/cmake-3.10.2-win64-x64/share/cmake-3.10
-- CMAKE_SHARED_LIBRARY_CREATE_CXX_FLAGS=-shared
-- CMAKE_SHARED_LIBRARY_CREATE_C_FLAGS=-shared
-- CMAKE_SHARED_LIBRARY_C_FLAGS=
-- CMAKE_SHARED_LIBRARY_LINK_C_FLAGS=
-- CMAKE_SHARED_LIBRARY_PREFIX=
-- CMAKE_SHARED_LIBRARY_RUNTIME_C_FLAG=
-- CMAKE_SHARED_LIBRARY_RUNTIME_C_FLAG_SEP=
-- CMAKE_SHARED_LIBRARY_SUFFIX=.dll
-- CMAKE_SHARED_LINKER_FLAGS=/machine:x64
-- CMAKE_SHARED_LINKER_FLAGS_DEBUG=/debug /INCREMENTAL
-- CMAKE_SHARED_LINKER_FLAGS_DEBUG_INIT=/debug /INCREMENTAL
-- CMAKE_SHARED_LINKER_FLAGS_INIT=/machine:x64
-- CMAKE_SHARED_LINKER_FLAGS_MINSIZEREL=/INCREMENTAL:NO
-- CMAKE_SHARED_LINKER_FLAGS_MINSIZEREL_INIT=/INCREMENTAL:NO
-- CMAKE_SHARED_LINKER_FLAGS_RELEASE=/INCREMENTAL:NO
-- CMAKE_SHARED_LINKER_FLAGS_RELEASE_INIT=/INCREMENTAL:NO
-- CMAKE_SHARED_LINKER_FLAGS_RELWITHDEBINFO=/debug /INCREMENTAL
-- CMAKE_SHARED_LINKER_FLAGS_RELWITHDEBINFO_INIT=/debug /INCREMENTAL
-- CMAKE_SHARED_MODULE_CREATE_CXX_FLAGS=-shared
-- CMAKE_SHARED_MODULE_CREATE_C_FLAGS=-shared
-- CMAKE_SHARED_MODULE_PREFIX=
-- CMAKE_SHARED_MODULE_SUFFIX=.dll
-- CMAKE_SIZEOF_VOID_P=8
-- CMAKE_SKIP_INSTALL_RPATH=NO
-- CMAKE_SKIP_RPATH=NO
-- CMAKE_SOURCE_DIR=C:/Users/dkiva/workspace/my/info-cmake/cmake-variables
-- CMAKE_STATIC_LIBRARY_PREFIX=
-- CMAKE_STATIC_LIBRARY_SUFFIX=.lib
-- CMAKE_STATIC_LINKER_FLAGS=/machine:x64
-- CMAKE_STATIC_LINKER_FLAGS_DEBUG=
-- CMAKE_STATIC_LINKER_FLAGS_DEBUG_INIT=
-- CMAKE_STATIC_LINKER_FLAGS_INIT=/machine:x64
-- CMAKE_STATIC_LINKER_FLAGS_MINSIZEREL=
-- CMAKE_STATIC_LINKER_FLAGS_MINSIZEREL_INIT=
-- CMAKE_STATIC_LINKER_FLAGS_RELEASE=
-- CMAKE_STATIC_LINKER_FLAGS_RELEASE_INIT=
-- CMAKE_STATIC_LINKER_FLAGS_RELWITHDEBINFO=
-- CMAKE_STATIC_LINKER_FLAGS_RELWITHDEBINFO_INIT=
-- CMAKE_SUPPORT_WINDOWS_EXPORT_ALL_SYMBOLS=1
-- CMAKE_SYSTEM=Windows-10.0.16299
-- CMAKE_SYSTEM_AND_RC_COMPILER_INFO_FILE=C:/ProgramData/chocolatey/lib/cmake.portable/tools/cmake-3.10.2-win64-x64/share/cmake-3.10/Modules/Platform/Windows-rc.cmake
-- CMAKE_SYSTEM_INFO_FILE=Platform/Windows
-- CMAKE_SYSTEM_LIBRARY_PATH=C:/Program Files/CmakeVariables/bin;C:/ProgramData/chocolatey/lib/cmake.portable/tools/cmake-3.10.2-win64-x64/bin;/bin
-- CMAKE_SYSTEM_LOADED=1
-- CMAKE_SYSTEM_NAME=Windows
-- CMAKE_SYSTEM_PREFIX_PATH=C:/Program Files;C:/Program Files (x86);C:/ProgramData/chocolatey/lib/cmake.portable/tools/cmake-3.10.2-win64-x64;C:/Program Files/CmakeVariables
-- CMAKE_SYSTEM_PROCESSOR=AMD64
-- CMAKE_SYSTEM_SPECIFIC_INFORMATION_LOADED=1
-- CMAKE_SYSTEM_SPECIFIC_INITIALIZE_LOADED=1
-- CMAKE_SYSTEM_VERSION=10.0.16299
-- CMAKE_TWEAK_VERSION=0
-- CMAKE_VERBOSE_MAKEFILE=FALSE
-- CMAKE_VERSION=3.10.2
-- CMAKE_VS_DEVENV_COMMAND=C:/Program Files (x86)/Microsoft Visual Studio/2017/Community/Common7/IDE/devenv.com
-- CMAKE_VS_INTEL_Fortran_PROJECT_VERSION=11.0
-- CMAKE_VS_MSBUILD_COMMAND=C:/Program Files (x86)/Microsoft Visual Studio/2017/Community/MSBuild/15.0/Bin/MSBuild.exe
-- CMAKE_VS_PLATFORM_NAME=x64
-- CMAKE_VS_PLATFORM_TOOLSET=v141
-- CMAKE_VS_PLATFORM_TOOLSET_CUDA=9.1
-- CMAKE_VS_WINDOWS_TARGET_PLATFORM_VERSION=10.0.16299.0
-- CXX_TEST_WAS_RUN=1
-- C_TEST_WAS_RUN=1
-- CmakeVariables_BINARY_DIR=C:/Users/dkiva/workspace/my/info-cmake/cmake-variables/build
-- CmakeVariables_SOURCE_DIR=C:/Users/dkiva/workspace/my/info-cmake/cmake-variables
-- MSVC=1
-- MSVC14=1
-- MSVC_CXX_ARCHITECTURE_ID=x64
-- MSVC_C_ARCHITECTURE_ID=x64
-- MSVC_IDE=1
-- MSVC_INCREMENTAL_DEFAULT=ON
-- MSVC_INCREMENTAL_YES_FLAG=/INCREMENTAL
-- MSVC_VERSION=1913
-- PRESET_CMAKE_SYSTEM_NAME=FALSE
-- PROJECT_BINARY_DIR=C:/Users/dkiva/workspace/my/info-cmake/cmake-variables/build
-- PROJECT_NAME=CmakeVariables
-- PROJECT_SOURCE_DIR=C:/Users/dkiva/workspace/my/info-cmake/cmake-variables
-- RUN_CONFIGURE=ON
-- SET_MSVC_CXX_ARCHITECTURE_ID=set(MSVC_CXX_ARCHITECTURE_ID x64)
-- SET_MSVC_C_ARCHITECTURE_ID=set(MSVC_C_ARCHITECTURE_ID x64)
-- WIN32=1
-- _CMAKE_INSTALL_DIR=C:/ProgramData/chocolatey/lib/cmake.portable/tools/cmake-3.10.2-win64-x64
-- _CMAKE_RC_COMPILER_NAME_WE=rc
-- _CMAKE_TOOLCHAIN_LOCATION=C:/Program Files (x86)/Microsoft Visual Studio/2017/Community/VC/Tools/MSVC/14.13.26128/bin/Hostx86/x64
-- _CMAKE_VS_LINK_DLL=<CMAKE_COMMAND> -E vs_link_dll --intdir=<OBJECT_DIR> --manifests <MANIFESTS> --
-- _CMAKE_VS_LINK_EXE=<CMAKE_COMMAND> -E vs_link_exe --intdir=<OBJECT_DIR> --manifests <MANIFESTS> --
-- _COMPILE_CXX= /TP
-- _FLAGS_CXX= /GR /EHsc
-- _FS_C= /FS
-- _FS_CXX= /FS
-- _INCLUDED_FILE=C:/ProgramData/chocolatey/lib/cmake.portable/tools/cmake-3.10.2-win64-x64/share/cmake-3.10/Modules/Platform/Windows-MSVC-CXX.cmake
-- _INCLUDED_SYSTEM_INFO_FILE=C:/ProgramData/chocolatey/lib/cmake.portable/tools/cmake-3.10.2-win64-x64/share/cmake-3.10/Modules/Platform/Windows.cmake
-- _MSVC_CXX_ARCHITECTURE_FAMILY=x64
-- _MSVC_C_ARCHITECTURE_FAMILY=x64
-- _PLATFORM_DEFINES=/DWIN32
-- _PLATFORM_LINK_FLAGS=
-- _RTC1=/RTC1
-- _SET_CMAKE_CXX_COMPILER_ARCHITECTURE_ID=set(CMAKE_CXX_COMPILER_ARCHITECTURE_ID x64)
-- _SET_CMAKE_C_COMPILER_ARCHITECTURE_ID=set(CMAKE_C_COMPILER_ARCHITECTURE_ID x64)
-- __COMPILER_CMAKE_COMMON_COMPILER_MACROS=1
-- __WINDOWS_MSVC=1
-- __WINDOWS_PATHS_INCLUDED=1
-- _compiler_version=19.13.26128.0
-- c=
-- d=
-- f=
-- lang=
-- t=
-- type=
-- v=
```

### MinGW Makefiles

```bash
-- The C compiler identification is GNU 5.3.0
-- The CXX compiler identification is GNU 5.3.0
-- Check for working C compiler: C:/tools/mingw64/bin/gcc.exe
-- Check for working C compiler: C:/tools/mingw64/bin/gcc.exe -- works
-- Detecting C compiler ABI info
-- Detecting C compiler ABI info - done
-- Detecting C compile features
-- Detecting C compile features - done
-- Check for working CXX compiler: C:/tools/mingw64/bin/g++.exe
-- Check for working CXX compiler: C:/tools/mingw64/bin/g++.exe -- works
-- Detecting CXX compiler ABI info
-- Detecting CXX compiler ABI info - done
-- Detecting CXX compile features
-- Detecting CXX compile features - done
-- CMAKE_BINARY_DIR:         C:/Users/dkiva/workspace/my/info-cmake/cmake-variables/build
-- CMAKE_CURRENT_BINARY_DIR: C:/Users/dkiva/workspace/my/info-cmake/cmake-variables/build
-- CMAKE_SOURCE_DIR:         C:/Users/dkiva/workspace/my/info-cmake/cmake-variables
-- CMAKE_CURRENT_SOURCE_DIR: C:/Users/dkiva/workspace/my/info-cmake/cmake-variables
-- PROJECT_BINARY_DIR: C:/Users/dkiva/workspace/my/info-cmake/cmake-variables/build
-- PROJECT_SOURCE_DIR: C:/Users/dkiva/workspace/my/info-cmake/cmake-variables
-- EXECUTABLE_OUTPUT_PATH:
-- LIBRARY_OUTPUT_PATH:
-- CMAKE_MODULE_PATH:
-- CMAKE_COMMAND: C:/ProgramData/chocolatey/lib/cmake.portable/tools/cmake-3.10.2-win64-x64/bin/cmake.exe
-- CMAKE_ROOT: C:/ProgramData/chocolatey/lib/cmake.portable/tools/cmake-3.10.2-win64-x64/share/cmake-3.10
-- CMAKE_CURRENT_LIST_FILE: C:/Users/dkiva/workspace/my/info-cmake/cmake-variables/vars.cmake
-- CMAKE_CURRENT_LIST_LINE: 46
-- CMAKE_INCLUDE_PATH:
-- CMAKE_LIBRARY_PATH:
-- CMAKE_SYSTEM: Windows-10.0.16299
-- CMAKE_SYSTEM_NAME: Windows
-- CMAKE_SYSTEM_VERSION: 10.0.16299
-- CMAKE_SYSTEM_PROCESSOR: AMD64
-- UNIX:
-- WIN32: 1
-- APPLE:
-- MINGW: 1
-- CYGWIN:
-- BORLAND:
-- MSVC:
-- MSVC_IDE:
-- MSVC60:
-- MSVC70:
-- MSVC71:
-- MSVC80:
-- CMAKE_COMPILER_2005:
-- CMAKE_SKIP_RULE_DEPENDENCY:
-- CMAKE_SKIP_INSTALL_ALL_DEPENDENCY:
-- CMAKE_SKIP_RPATH: NO
-- CMAKE_VERBOSE_MAKEFILE: FALSE
-- CMAKE_SUPPRESS_REGENERATION:
-- CMAKE_C_FLAGS:
-- CMAKE_CXX_FLAGS:
-- CMAKE_BUILD_TYPE:
-- BUILD_SHARED_LIBS:
-- CMAKE_C_COMPILER: C:/tools/mingw64/bin/gcc.exe
-- CMAKE_CXX_COMPILER: C:/tools/mingw64/bin/g++.exe
-- CMAKE_COMPILER_IS_GNUCC: 1
-- CMAKE_COMPILER_IS_GNUCXX : 1
-- CMAKE_AR: C:/tools/mingw64/bin/ar.exe
-- CMAKE_RANLIB: C:/tools/mingw64/bin/ranlib.exe
-- :
-- CMAKE_AR=C:/tools/mingw64/bin/ar.exe
-- CMAKE_AR=C:/tools/mingw64/bin/ar.exe
-- CMAKE_AUTOMOC_COMPILER_PREDEFINES=ON
-- CMAKE_AUTOMOC_MACRO_NAMES=Q_OBJECT;Q_GADGET;Q_NAMESPACE
-- CMAKE_BASE_NAME=g++
-- CMAKE_BINARY_DIR=C:/Users/dkiva/workspace/my/info-cmake/cmake-variables/build
-- CMAKE_BUILD_TOOL=C:/tools/mingw64/bin/mingw32-make.exe
-- CMAKE_BUILD_TYPE=
-- CMAKE_C11_COMPILE_FEATURES=c_std_11;c_static_assert
-- CMAKE_C11_EXTENSION_COMPILE_OPTION=-std=gnu11
-- CMAKE_C11_STANDARD_COMPILE_OPTION=-std=c11
-- CMAKE_C90_COMPILE_FEATURES=c_std_90;c_function_prototypes
-- CMAKE_C90_EXTENSION_COMPILE_OPTION=-std=gnu90
-- CMAKE_C90_STANDARD_COMPILE_OPTION=-std=c90
-- CMAKE_C99_COMPILE_FEATURES=c_std_99;c_restrict;c_variadic_macros
-- CMAKE_C99_EXTENSION_COMPILE_OPTION=-std=gnu99
-- CMAKE_C99_STANDARD_COMPILE_OPTION=-std=c99
-- CMAKE_CFG_INTDIR=.
-- CMAKE_COLOR_MAKEFILE=ON
-- CMAKE_COMMAND=C:/ProgramData/chocolatey/lib/cmake.portable/tools/cmake-3.10.2-win64-x64/bin/cmake.exe
-- CMAKE_COMPILER_IS_GNUCC=1
-- CMAKE_COMPILER_IS_GNUCXX=1
-- CMAKE_COMPILER_IS_MINGW=1
-- CMAKE_CPACK_COMMAND=C:/ProgramData/chocolatey/lib/cmake.portable/tools/cmake-3.10.2-win64-x64/bin/cpack.exe
-- CMAKE_CREATE_WIN32_EXE=-mwindows
-- CMAKE_CROSSCOMPILING=FALSE
-- CMAKE_CTEST_COMMAND=C:/ProgramData/chocolatey/lib/cmake.portable/tools/cmake-3.10.2-win64-x64/bin/ctest.exe
-- CMAKE_CURRENT_BINARY_DIR=C:/Users/dkiva/workspace/my/info-cmake/cmake-variables/build
-- CMAKE_CURRENT_LIST_DIR=C:/Users/dkiva/workspace/my/info-cmake/cmake-variables
-- CMAKE_CURRENT_LIST_FILE=C:/Users/dkiva/workspace/my/info-cmake/cmake-variables/vars.cmake
-- CMAKE_CURRENT_SOURCE_DIR=C:/Users/dkiva/workspace/my/info-cmake/cmake-variables
-- CMAKE_CXX11_COMPILE_FEATURES=cxx_std_11;cxx_alias_templates;cxx_alignas;cxx_alignof;cxx_attributes;cxx_auto_type;cxx_constexpr;cxx_decltype;cxx_decltype_incomplete_return_types;cxx_default_function_template_args;cxx_defaulted_functions;cxx_defaulted_move_initializers;cxx_delegating_constructors;cxx_deleted_functions;cxx_enum_forward_declarations;cxx_explicit_conversions;cxx_extended_friend_declarations;cxx_extern_templates;cxx_final;cxx_func_identifier;cxx_generalized_initializers;cxx_inheriting_constructors;cxx_inline_namespaces;cxx_lambdas;cxx_local_type_template_args;cxx_long_long_type;cxx_noexcept;cxx_nonstatic_member_init;cxx_nullptr;cxx_override;cxx_range_for;cxx_raw_string_literals;cxx_reference_qualified_functions;cxx_right_angle_brackets;cxx_rvalue_references;cxx_sizeof_member;cxx_static_assert;cxx_strong_enums;cxx_thread_local;cxx_trailing_return_types;cxx_unicode_literals;cxx_uniform_initialization;cxx_unrestricted_unions;cxx_user_literals;cxx_variadic_macros;cxx_variadic_templates
-- CMAKE_CXX11_EXTENSION_COMPILE_OPTION=-std=gnu++11
-- CMAKE_CXX11_STANDARD_COMPILE_OPTION=-std=c++11
-- CMAKE_CXX14_COMPILE_FEATURES=cxx_std_14;cxx_aggregate_default_initializers;cxx_attribute_deprecated;cxx_binary_literals;cxx_contextual_conversions;cxx_decltype_auto;cxx_digit_separators;cxx_generic_lambdas;cxx_lambda_init_captures;cxx_relaxed_constexpr;cxx_return_type_deduction;cxx_variable_templates
-- CMAKE_CXX14_EXTENSION_COMPILE_OPTION=-std=gnu++14
-- CMAKE_CXX14_STANDARD_COMPILE_OPTION=-std=c++14
-- CMAKE_CXX17_COMPILE_FEATURES=cxx_std_17
-- CMAKE_CXX17_EXTENSION_COMPILE_OPTION=-std=gnu++1z
-- CMAKE_CXX17_STANDARD_COMPILE_OPTION=-std=c++1z
-- CMAKE_CXX98_COMPILE_FEATURES=cxx_std_98;cxx_template_template_parameters
-- CMAKE_CXX98_EXTENSION_COMPILE_OPTION=-std=gnu++98
-- CMAKE_CXX98_STANDARD_COMPILE_OPTION=-std=c++98
-- CMAKE_CXX_ABI_COMPILED=TRUE
-- CMAKE_CXX_ARCHIVE_APPEND=<CMAKE_AR> q  <TARGET> <LINK_FLAGS> <OBJECTS>
-- CMAKE_CXX_ARCHIVE_APPEND_IPO="C:/tools/mingw64/bin/gcc-ar.exe" r <TARGET> <LINK_FLAGS> <OBJECTS>
-- CMAKE_CXX_ARCHIVE_CREATE=<CMAKE_AR> qc <TARGET> <LINK_FLAGS> <OBJECTS>
-- CMAKE_CXX_ARCHIVE_CREATE_IPO="C:/tools/mingw64/bin/gcc-ar.exe" cr <TARGET> <LINK_FLAGS> <OBJECTS>
-- CMAKE_CXX_ARCHIVE_FINISH=<CMAKE_RANLIB> <TARGET>
-- CMAKE_CXX_ARCHIVE_FINISH_IPO="C:/tools/mingw64/bin/gcc-ranlib.exe" <TARGET>
-- CMAKE_CXX_CL_SHOWINCLUDES_PREFIX=
-- CMAKE_CXX_COMPILER=C:/tools/mingw64/bin/g++.exe
-- CMAKE_CXX_COMPILER=C:/tools/mingw64/bin/g++.exe
-- CMAKE_CXX_COMPILER_ABI=
-- CMAKE_CXX_COMPILER_AR=C:/tools/mingw64/bin/gcc-ar.exe
-- CMAKE_CXX_COMPILER_AR=C:/tools/mingw64/bin/gcc-ar.exe
-- CMAKE_CXX_COMPILER_ARCHITECTURE_ID=
-- CMAKE_CXX_COMPILER_ARG1=
-- CMAKE_CXX_COMPILER_ENV_VAR=CXX
-- CMAKE_CXX_COMPILER_EXCLUDE=CC;aCC;xlC
-- CMAKE_CXX_COMPILER_ID=GNU
-- CMAKE_CXX_COMPILER_ID_PLATFORM_CONTENT=#define STRINGIFY_HELPER(X) #X
#define STRINGIFY(X) STRINGIFY_HELPER(X)

/* Identify known platforms by name.  */
#if defined(__linux) || defined(__linux__) || defined(linux)
# define PLATFORM_ID "Linux"

#elif defined(__CYGWIN__)
# define PLATFORM_ID "Cygwin"

#elif defined(__MINGW32__)
# define PLATFORM_ID "MinGW"

#elif defined(__APPLE__)
# define PLATFORM_ID "Darwin"

#elif defined(_WIN32) || defined(__WIN32__) || defined(WIN32)
# define PLATFORM_ID "Windows"

#elif defined(__FreeBSD__) || defined(__FreeBSD)
# define PLATFORM_ID "FreeBSD"

#elif defined(__NetBSD__) || defined(__NetBSD)
# define PLATFORM_ID "NetBSD"

#elif defined(__OpenBSD__) || defined(__OPENBSD)
# define PLATFORM_ID "OpenBSD"

#elif defined(__sun) || defined(sun)
# define PLATFORM_ID "SunOS"

#elif defined(_AIX) || defined(__AIX) || defined(__AIX__) || defined(__aix) || defined(__aix__)
# define PLATFORM_ID "AIX"

#elif defined(__sgi) || defined(__sgi__) || defined(_SGI)
# define PLATFORM_ID "IRIX"

#elif defined(__hpux) || defined(__hpux__)
# define PLATFORM_ID "HP-UX"

#elif defined(__HAIKU__)
# define PLATFORM_ID "Haiku"

#elif defined(__BeOS) || defined(__BEOS__) || defined(_BEOS)
# define PLATFORM_ID "BeOS"

#elif defined(__QNX__) || defined(__QNXNTO__)
# define PLATFORM_ID "QNX"

#elif defined(__tru64) || defined(_tru64) || defined(__TRU64__)
# define PLATFORM_ID "Tru64"

#elif defined(__riscos) || defined(__riscos__)
# define PLATFORM_ID "RISCos"

#elif defined(__sinix) || defined(__sinix__) || defined(__SINIX__)
# define PLATFORM_ID "SINIX"

#elif defined(__UNIX_SV__)
# define PLATFORM_ID "UNIX_SV"

#elif defined(__bsdos__)
# define PLATFORM_ID "BSDOS"

#elif defined(_MPRAS) || defined(MPRAS)
# define PLATFORM_ID "MP-RAS"

#elif defined(__osf) || defined(__osf__)
# define PLATFORM_ID "OSF1"

#elif defined(_SCO_SV) || defined(SCO_SV) || defined(sco_sv)
# define PLATFORM_ID "SCO_SV"

#elif defined(__ultrix) || defined(__ultrix__) || defined(_ULTRIX)
# define PLATFORM_ID "ULTRIX"

#elif defined(__XENIX__) || defined(_XENIX) || defined(XENIX)
# define PLATFORM_ID "Xenix"

#elif defined(__WATCOMC__)
# if defined(__LINUX__)
#  define PLATFORM_ID "Linux"

# elif defined(__DOS__)
#  define PLATFORM_ID "DOS"

# elif defined(__OS2__)
#  define PLATFORM_ID "OS2"

# elif defined(__WINDOWS__)
#  define PLATFORM_ID "Windows3x"

# else /* unknown platform */
#  define PLATFORM_ID
# endif

#else /* unknown platform */
# define PLATFORM_ID

#endif

/* For windows compilers MSVC and Intel we can determine
   the architecture of the compiler being used.  This is because
   the compilers do not have flags that can change the architecture,
   but rather depend on which compiler is being used
*/
#if defined(_WIN32) && defined(_MSC_VER)
# if defined(_M_IA64)
#  define ARCHITECTURE_ID "IA64"

# elif defined(_M_X64) || defined(_M_AMD64)
#  define ARCHITECTURE_ID "x64"

# elif defined(_M_IX86)
#  define ARCHITECTURE_ID "X86"

# elif defined(_M_ARM64)
#  define ARCHITECTURE_ID "ARM64"

# elif defined(_M_ARM)
#  if _M_ARM == 4
#   define ARCHITECTURE_ID "ARMV4I"
#  elif _M_ARM == 5
#   define ARCHITECTURE_ID "ARMV5I"
#  else
#   define ARCHITECTURE_ID "ARMV" STRINGIFY(_M_ARM)
#  endif

# elif defined(_M_MIPS)
#  define ARCHITECTURE_ID "MIPS"

# elif defined(_M_SH)
#  define ARCHITECTURE_ID "SHx"

# else /* unknown architecture */
#  define ARCHITECTURE_ID ""
# endif

#elif defined(__WATCOMC__)
# if defined(_M_I86)
#  define ARCHITECTURE_ID "I86"

# elif defined(_M_IX86)
#  define ARCHITECTURE_ID "X86"

# else /* unknown architecture */
#  define ARCHITECTURE_ID ""
# endif

#elif defined(__IAR_SYSTEMS_ICC__) || defined(__IAR_SYSTEMS_ICC)
# if defined(__ICCARM__)
#  define ARCHITECTURE_ID "ARM"

# elif defined(__ICCAVR__)
#  define ARCHITECTURE_ID "AVR"

# else /* unknown architecture */
#  define ARCHITECTURE_ID ""
# endif
#else
#  define ARCHITECTURE_ID
#endif

/* Convert integer to decimal digit literals.  */
#define DEC(n)                   \
  ('0' + (((n) / 10000000)%10)), \
  ('0' + (((n) / 1000000)%10)),  \
  ('0' + (((n) / 100000)%10)),   \
  ('0' + (((n) / 10000)%10)),    \
  ('0' + (((n) / 1000)%10)),     \
  ('0' + (((n) / 100)%10)),      \
  ('0' + (((n) / 10)%10)),       \
  ('0' +  ((n) % 10))

/* Convert integer to hex digit literals.  */
#define HEX(n)             \
  ('0' + ((n)>>28 & 0xF)), \
  ('0' + ((n)>>24 & 0xF)), \
  ('0' + ((n)>>20 & 0xF)), \
  ('0' + ((n)>>16 & 0xF)), \
  ('0' + ((n)>>12 & 0xF)), \
  ('0' + ((n)>>8  & 0xF)), \
  ('0' + ((n)>>4  & 0xF)), \
  ('0' + ((n)     & 0xF))

/* Construct a string literal encoding the version number components. */
#ifdef COMPILER_VERSION_MAJOR
char const info_version[] = {
  'I', 'N', 'F', 'O', ':',
  'c','o','m','p','i','l','e','r','_','v','e','r','s','i','o','n','[',
  COMPILER_VERSION_MAJOR,
# ifdef COMPILER_VERSION_MINOR
  '.', COMPILER_VERSION_MINOR,
#  ifdef COMPILER_VERSION_PATCH
   '.', COMPILER_VERSION_PATCH,
#   ifdef COMPILER_VERSION_TWEAK
    '.', COMPILER_VERSION_TWEAK,
#   endif
#  endif
# endif
  ']','\0'};
#endif

/* Construct a string literal encoding the internal version number. */
#ifdef COMPILER_VERSION_INTERNAL
char const info_version_internal[] = {
  'I', 'N', 'F', 'O', ':',
  'c','o','m','p','i','l','e','r','_','v','e','r','s','i','o','n','_',
  'i','n','t','e','r','n','a','l','[',
  COMPILER_VERSION_INTERNAL,']','\0'};
#endif

/* Construct a string literal encoding the version number components. */
#ifdef SIMULATE_VERSION_MAJOR
char const info_simulate_version[] = {
  'I', 'N', 'F', 'O', ':',
  's','i','m','u','l','a','t','e','_','v','e','r','s','i','o','n','[',
  SIMULATE_VERSION_MAJOR,
# ifdef SIMULATE_VERSION_MINOR
  '.', SIMULATE_VERSION_MINOR,
#  ifdef SIMULATE_VERSION_PATCH
   '.', SIMULATE_VERSION_PATCH,
#   ifdef SIMULATE_VERSION_TWEAK
    '.', SIMULATE_VERSION_TWEAK,
#   endif
#  endif
# endif
  ']','\0'};
#endif

/* Construct the string literal in pieces to prevent the source from
   getting matched.  Store it in a pointer rather than an array
   because some compilers will just produce instructions to fill the
   array rather than assigning a pointer to a static array.  */
char const* info_platform = "INFO" ":" "platform[" PLATFORM_ID "]";
char const* info_arch = "INFO" ":" "arch[" ARCHITECTURE_ID "]";


-- CMAKE_CXX_COMPILER_ID_RUN=1
-- CMAKE_CXX_COMPILER_ID_TEST_FLAGS=-c;--c++;--ec++
-- CMAKE_CXX_COMPILER_ID_TOOL_MATCH_INDEX=2
-- CMAKE_CXX_COMPILER_ID_TOOL_MATCH_REGEX=
Ld[^
]*(
[ 	]+[^
]*)*
[ 	]+([^
]+)[^
]*-o[^
]*CompilerIdCXX/(\./)?(CompilerIdCXX.xctest/)?CompilerIdCXX[
\"]
-- CMAKE_CXX_COMPILER_ID_VENDORS=IAR
-- CMAKE_CXX_COMPILER_ID_VENDOR_REGEX_IAR=IAR .+ Compiler
-- CMAKE_CXX_COMPILER_INIT=C:/tools/mingw64/bin/g++.exe
-- CMAKE_CXX_COMPILER_LIST=C:/tools/mingw64/bin/g++.exe
-- CMAKE_CXX_COMPILER_LOADED=1
-- CMAKE_CXX_COMPILER_NAMES=c++
-- CMAKE_CXX_COMPILER_PRODUCED_FILES=a.exe
-- CMAKE_CXX_COMPILER_PRODUCED_OUTPUT=
-- CMAKE_CXX_COMPILER_RANLIB=C:/tools/mingw64/bin/gcc-ranlib.exe
-- CMAKE_CXX_COMPILER_RANLIB=C:/tools/mingw64/bin/gcc-ranlib.exe
-- CMAKE_CXX_COMPILER_VERSION=5.3.0
-- CMAKE_CXX_COMPILER_VERSION_INTERNAL=
-- CMAKE_CXX_COMPILER_WORKS=TRUE
-- CMAKE_CXX_COMPILER_WRAPPER=
-- CMAKE_CXX_COMPILE_FEATURES=cxx_std_98;cxx_template_template_parameters;cxx_std_11;cxx_alias_templates;cxx_alignas;cxx_alignof;cxx_attributes;cxx_auto_type;cxx_constexpr;cxx_decltype;cxx_decltype_incomplete_return_types;cxx_default_function_template_args;cxx_defaulted_functions;cxx_defaulted_move_initializers;cxx_delegating_constructors;cxx_deleted_functions;cxx_enum_forward_declarations;cxx_explicit_conversions;cxx_extended_friend_declarations;cxx_extern_templates;cxx_final;cxx_func_identifier;cxx_generalized_initializers;cxx_inheriting_constructors;cxx_inline_namespaces;cxx_lambdas;cxx_local_type_template_args;cxx_long_long_type;cxx_noexcept;cxx_nonstatic_member_init;cxx_nullptr;cxx_override;cxx_range_for;cxx_raw_string_literals;cxx_reference_qualified_functions;cxx_right_angle_brackets;cxx_rvalue_references;cxx_sizeof_member;cxx_static_assert;cxx_strong_enums;cxx_thread_local;cxx_trailing_return_types;cxx_unicode_literals;cxx_uniform_initialization;cxx_unrestricted_unions;cxx_user_literals;cxx_variadic_macros;cxx_variadic_templates;cxx_std_14;cxx_aggregate_default_initializers;cxx_attribute_deprecated;cxx_binary_literals;cxx_contextual_conversions;cxx_decltype_auto;cxx_digit_separators;cxx_generic_lambdas;cxx_lambda_init_captures;cxx_relaxed_constexpr;cxx_return_type_deduction;cxx_variable_templates;cxx_std_17
-- CMAKE_CXX_COMPILE_OBJECT=<CMAKE_CXX_COMPILER>  <DEFINES> <INCLUDES> <FLAGS> -o <OBJECT> -c <SOURCE>
-- CMAKE_CXX_COMPILE_OPTIONS_IPO=-flto;-fno-fat-lto-objects
-- CMAKE_CXX_COMPILE_OPTIONS_SYSROOT=--sysroot=
-- CMAKE_CXX_COMPILE_OPTIONS_VISIBILITY=-fvisibility=
-- CMAKE_CXX_COMPILE_OPTIONS_VISIBILITY_INLINES_HIDDEN=-fno-keep-inline-dllexport
-- CMAKE_CXX_CREATE_ASSEMBLY_SOURCE=<CMAKE_CXX_COMPILER> <DEFINES> <INCLUDES> <FLAGS> -S <SOURCE> -o <ASSEMBLY_SOURCE>
-- CMAKE_CXX_CREATE_PREPROCESSED_SOURCE=<CMAKE_CXX_COMPILER> <DEFINES> <INCLUDES> <FLAGS> -E <SOURCE> > <PREPROCESSED_SOURCE>
-- CMAKE_CXX_CREATE_SHARED_LIBRARY=<CMAKE_COMMAND> -E remove -f <OBJECT_DIR>/objects.a;<CMAKE_AR> cr <OBJECT_DIR>/objects.a <OBJECTS>;<CMAKE_CXX_COMPILER> <CMAKE_SHARED_LIBRARY_CXX_FLAGS> <LANGUAGE_COMPILE_FLAGS> <LINK_FLAGS> <CMAKE_SHARED_LIBRARY_CREATE_CXX_FLAGS> -o <TARGET> -Wl,--out-implib,<TARGET_IMPLIB> -Wl,--major-image-version,<TARGET_VERSION_MAJOR>,--minor-image-version,<TARGET_VERSION_MINOR> -Wl,--whole-archive <OBJECT_DIR>/objects.a -Wl,--no-whole-archive <LINK_LIBRARIES>
-- CMAKE_CXX_CREATE_SHARED_MODULE=<CMAKE_COMMAND> -E remove -f <OBJECT_DIR>/objects.a;<CMAKE_AR> cr <OBJECT_DIR>/objects.a <OBJECTS>;<CMAKE_CXX_COMPILER> <CMAKE_SHARED_MODULE_CXX_FLAGS> <LANGUAGE_COMPILE_FLAGS> <LINK_FLAGS> <CMAKE_SHARED_MODULE_CREATE_CXX_FLAGS> -o <TARGET> -Wl,--major-image-version,<TARGET_VERSION_MAJOR>,--minor-image-version,<TARGET_VERSION_MINOR> -Wl,--whole-archive <OBJECT_DIR>/objects.a -Wl,--no-whole-archive <LINK_LIBRARIES>
-- CMAKE_CXX_FLAGS=
-- CMAKE_CXX_FLAGS_DEBUG=-g
-- CMAKE_CXX_FLAGS_DEBUG_INIT=-g
-- CMAKE_CXX_FLAGS_INIT=
-- CMAKE_CXX_FLAGS_MINSIZEREL=-Os -DNDEBUG
-- CMAKE_CXX_FLAGS_MINSIZEREL_INIT=-Os -DNDEBUG
-- CMAKE_CXX_FLAGS_RELEASE=-O3 -DNDEBUG
-- CMAKE_CXX_FLAGS_RELEASE_INIT=-O3 -DNDEBUG
-- CMAKE_CXX_FLAGS_RELWITHDEBINFO=-O2 -g -DNDEBUG
-- CMAKE_CXX_FLAGS_RELWITHDEBINFO_INIT=-O2 -g -DNDEBUG
-- CMAKE_CXX_IGNORE_EXTENSIONS=inl;h;hpp;HPP;H;o;O;obj;OBJ;def;DEF;rc;RC
-- CMAKE_CXX_IMPLICIT_LINK_DIRECTORIES=C:/tools/mingw64/lib/gcc/x86_64-w64-mingw32/5.3.0;C:/tools/mingw64/lib/gcc;C:/tools/mingw64/x86_64-w64-mingw32/lib;C:/tools/mingw64/lib
-- CMAKE_CXX_IMPLICIT_LINK_FRAMEWORK_DIRECTORIES=
-- CMAKE_CXX_IMPLICIT_LINK_LIBRARIES=stdc++;mingw32;gcc_s;gcc;moldname;mingwex;pthread;advapi32;shell32;user32;kernel32;iconv;mingw32;gcc_s;gcc;moldname;mingwex
-- CMAKE_CXX_INFORMATION_LOADED=1
-- CMAKE_CXX_LIBRARY_ARCHITECTURE=
-- CMAKE_CXX_LINKER_PREFERENCE=30
-- CMAKE_CXX_LINKER_PREFERENCE_PROPAGATES=1
-- CMAKE_CXX_LINK_EXECUTABLE=<CMAKE_COMMAND> -E remove -f <OBJECT_DIR>/objects.a;<CMAKE_AR> cr <OBJECT_DIR>/objects.a <OBJECTS>;<CMAKE_CXX_COMPILER> <FLAGS> <CMAKE_CXX_LINK_FLAGS> <LINK_FLAGS> -Wl,--whole-archive <OBJECT_DIR>/objects.a -Wl,--no-whole-archive  -o <TARGET> -Wl,--out-implib,<TARGET_IMPLIB> -Wl,--major-image-version,<TARGET_VERSION_MAJOR>,--minor-image-version,<TARGET_VERSION_MINOR> <LINK_LIBRARIES>
-- CMAKE_CXX_OUTPUT_EXTENSION=.obj
-- CMAKE_CXX_PLATFORM_ID=MinGW
-- CMAKE_CXX_RESPONSE_FILE_LINK_FLAG=@
-- CMAKE_CXX_SIMULATE_ID=
-- CMAKE_CXX_SIMULATE_VERSION=
-- CMAKE_CXX_SIZEOF_DATA_PTR=8
-- CMAKE_CXX_SOURCE_FILE_EXTENSIONS=C;M;c++;cc;cpp;cxx;mm;CPP
-- CMAKE_CXX_STANDARD_COMPUTED_DEFAULT=98
-- CMAKE_CXX_STANDARD_DEFAULT=98
-- CMAKE_CXX_STANDARD_LIBRARIES=-lkernel32 -luser32 -lgdi32 -lwinspool -lshell32 -lole32 -loleaut32 -luuid -lcomdlg32 -ladvapi32
-- CMAKE_CXX_STANDARD_LIBRARIES_INIT=-lkernel32 -luser32 -lgdi32 -lwinspool -lshell32 -lole32 -loleaut32 -luuid -lcomdlg32 -ladvapi32
-- CMAKE_CXX_USE_RESPONSE_FILE_FOR_INCLUDES=1
-- CMAKE_CXX_USE_RESPONSE_FILE_FOR_LIBRARIES=1
-- CMAKE_CXX_USE_RESPONSE_FILE_FOR_OBJECTS=1
-- CMAKE_CXX_VERBOSE_FLAG=-v
-- CMAKE_CXX_XCODE_CURRENT_ARCH=
-- CMAKE_C_ABI_COMPILED=TRUE
-- CMAKE_C_ARCHIVE_APPEND=<CMAKE_AR> q  <TARGET> <LINK_FLAGS> <OBJECTS>
-- CMAKE_C_ARCHIVE_APPEND_IPO="C:/tools/mingw64/bin/gcc-ar.exe" r <TARGET> <LINK_FLAGS> <OBJECTS>
-- CMAKE_C_ARCHIVE_CREATE=<CMAKE_AR> qc <TARGET> <LINK_FLAGS> <OBJECTS>
-- CMAKE_C_ARCHIVE_CREATE_IPO="C:/tools/mingw64/bin/gcc-ar.exe" cr <TARGET> <LINK_FLAGS> <OBJECTS>
-- CMAKE_C_ARCHIVE_FINISH=<CMAKE_RANLIB> <TARGET>
-- CMAKE_C_ARCHIVE_FINISH_IPO="C:/tools/mingw64/bin/gcc-ranlib.exe" <TARGET>
-- CMAKE_C_CL_SHOWINCLUDES_PREFIX=
-- CMAKE_C_COMPILER=C:/tools/mingw64/bin/gcc.exe
-- CMAKE_C_COMPILER=C:/tools/mingw64/bin/gcc.exe
-- CMAKE_C_COMPILER_ABI=
-- CMAKE_C_COMPILER_AR=C:/tools/mingw64/bin/gcc-ar.exe
-- CMAKE_C_COMPILER_AR=C:/tools/mingw64/bin/gcc-ar.exe
-- CMAKE_C_COMPILER_ARCHITECTURE_ID=
-- CMAKE_C_COMPILER_ARG1=
-- CMAKE_C_COMPILER_ENV_VAR=CC
-- CMAKE_C_COMPILER_ID=GNU
-- CMAKE_C_COMPILER_ID_PLATFORM_CONTENT=#define STRINGIFY_HELPER(X) #X
#define STRINGIFY(X) STRINGIFY_HELPER(X)

/* Identify known platforms by name.  */
#if defined(__linux) || defined(__linux__) || defined(linux)
# define PLATFORM_ID "Linux"

#elif defined(__CYGWIN__)
# define PLATFORM_ID "Cygwin"

#elif defined(__MINGW32__)
# define PLATFORM_ID "MinGW"

#elif defined(__APPLE__)
# define PLATFORM_ID "Darwin"

#elif defined(_WIN32) || defined(__WIN32__) || defined(WIN32)
# define PLATFORM_ID "Windows"

#elif defined(__FreeBSD__) || defined(__FreeBSD)
# define PLATFORM_ID "FreeBSD"

#elif defined(__NetBSD__) || defined(__NetBSD)
# define PLATFORM_ID "NetBSD"

#elif defined(__OpenBSD__) || defined(__OPENBSD)
# define PLATFORM_ID "OpenBSD"

#elif defined(__sun) || defined(sun)
# define PLATFORM_ID "SunOS"

#elif defined(_AIX) || defined(__AIX) || defined(__AIX__) || defined(__aix) || defined(__aix__)
# define PLATFORM_ID "AIX"

#elif defined(__sgi) || defined(__sgi__) || defined(_SGI)
# define PLATFORM_ID "IRIX"

#elif defined(__hpux) || defined(__hpux__)
# define PLATFORM_ID "HP-UX"

#elif defined(__HAIKU__)
# define PLATFORM_ID "Haiku"

#elif defined(__BeOS) || defined(__BEOS__) || defined(_BEOS)
# define PLATFORM_ID "BeOS"

#elif defined(__QNX__) || defined(__QNXNTO__)
# define PLATFORM_ID "QNX"

#elif defined(__tru64) || defined(_tru64) || defined(__TRU64__)
# define PLATFORM_ID "Tru64"

#elif defined(__riscos) || defined(__riscos__)
# define PLATFORM_ID "RISCos"

#elif defined(__sinix) || defined(__sinix__) || defined(__SINIX__)
# define PLATFORM_ID "SINIX"

#elif defined(__UNIX_SV__)
# define PLATFORM_ID "UNIX_SV"

#elif defined(__bsdos__)
# define PLATFORM_ID "BSDOS"

#elif defined(_MPRAS) || defined(MPRAS)
# define PLATFORM_ID "MP-RAS"

#elif defined(__osf) || defined(__osf__)
# define PLATFORM_ID "OSF1"

#elif defined(_SCO_SV) || defined(SCO_SV) || defined(sco_sv)
# define PLATFORM_ID "SCO_SV"

#elif defined(__ultrix) || defined(__ultrix__) || defined(_ULTRIX)
# define PLATFORM_ID "ULTRIX"

#elif defined(__XENIX__) || defined(_XENIX) || defined(XENIX)
# define PLATFORM_ID "Xenix"

#elif defined(__WATCOMC__)
# if defined(__LINUX__)
#  define PLATFORM_ID "Linux"

# elif defined(__DOS__)
#  define PLATFORM_ID "DOS"

# elif defined(__OS2__)
#  define PLATFORM_ID "OS2"

# elif defined(__WINDOWS__)
#  define PLATFORM_ID "Windows3x"

# else /* unknown platform */
#  define PLATFORM_ID
# endif

#else /* unknown platform */
# define PLATFORM_ID

#endif

/* For windows compilers MSVC and Intel we can determine
   the architecture of the compiler being used.  This is because
   the compilers do not have flags that can change the architecture,
   but rather depend on which compiler is being used
*/
#if defined(_WIN32) && defined(_MSC_VER)
# if defined(_M_IA64)
#  define ARCHITECTURE_ID "IA64"

# elif defined(_M_X64) || defined(_M_AMD64)
#  define ARCHITECTURE_ID "x64"

# elif defined(_M_IX86)
#  define ARCHITECTURE_ID "X86"

# elif defined(_M_ARM64)
#  define ARCHITECTURE_ID "ARM64"

# elif defined(_M_ARM)
#  if _M_ARM == 4
#   define ARCHITECTURE_ID "ARMV4I"
#  elif _M_ARM == 5
#   define ARCHITECTURE_ID "ARMV5I"
#  else
#   define ARCHITECTURE_ID "ARMV" STRINGIFY(_M_ARM)
#  endif

# elif defined(_M_MIPS)
#  define ARCHITECTURE_ID "MIPS"

# elif defined(_M_SH)
#  define ARCHITECTURE_ID "SHx"

# else /* unknown architecture */
#  define ARCHITECTURE_ID ""
# endif

#elif defined(__WATCOMC__)
# if defined(_M_I86)
#  define ARCHITECTURE_ID "I86"

# elif defined(_M_IX86)
#  define ARCHITECTURE_ID "X86"

# else /* unknown architecture */
#  define ARCHITECTURE_ID ""
# endif

#elif defined(__IAR_SYSTEMS_ICC__) || defined(__IAR_SYSTEMS_ICC)
# if defined(__ICCARM__)
#  define ARCHITECTURE_ID "ARM"

# elif defined(__ICCAVR__)
#  define ARCHITECTURE_ID "AVR"

# else /* unknown architecture */
#  define ARCHITECTURE_ID ""
# endif
#else
#  define ARCHITECTURE_ID
#endif

/* Convert integer to decimal digit literals.  */
#define DEC(n)                   \
  ('0' + (((n) / 10000000)%10)), \
  ('0' + (((n) / 1000000)%10)),  \
  ('0' + (((n) / 100000)%10)),   \
  ('0' + (((n) / 10000)%10)),    \
  ('0' + (((n) / 1000)%10)),     \
  ('0' + (((n) / 100)%10)),      \
  ('0' + (((n) / 10)%10)),       \
  ('0' +  ((n) % 10))

/* Convert integer to hex digit literals.  */
#define HEX(n)             \
  ('0' + ((n)>>28 & 0xF)), \
  ('0' + ((n)>>24 & 0xF)), \
  ('0' + ((n)>>20 & 0xF)), \
  ('0' + ((n)>>16 & 0xF)), \
  ('0' + ((n)>>12 & 0xF)), \
  ('0' + ((n)>>8  & 0xF)), \
  ('0' + ((n)>>4  & 0xF)), \
  ('0' + ((n)     & 0xF))

/* Construct a string literal encoding the version number components. */
#ifdef COMPILER_VERSION_MAJOR
char const info_version[] = {
  'I', 'N', 'F', 'O', ':',
  'c','o','m','p','i','l','e','r','_','v','e','r','s','i','o','n','[',
  COMPILER_VERSION_MAJOR,
# ifdef COMPILER_VERSION_MINOR
  '.', COMPILER_VERSION_MINOR,
#  ifdef COMPILER_VERSION_PATCH
   '.', COMPILER_VERSION_PATCH,
#   ifdef COMPILER_VERSION_TWEAK
    '.', COMPILER_VERSION_TWEAK,
#   endif
#  endif
# endif
  ']','\0'};
#endif

/* Construct a string literal encoding the internal version number. */
#ifdef COMPILER_VERSION_INTERNAL
char const info_version_internal[] = {
  'I', 'N', 'F', 'O', ':',
  'c','o','m','p','i','l','e','r','_','v','e','r','s','i','o','n','_',
  'i','n','t','e','r','n','a','l','[',
  COMPILER_VERSION_INTERNAL,']','\0'};
#endif

/* Construct a string literal encoding the version number components. */
#ifdef SIMULATE_VERSION_MAJOR
char const info_simulate_version[] = {
  'I', 'N', 'F', 'O', ':',
  's','i','m','u','l','a','t','e','_','v','e','r','s','i','o','n','[',
  SIMULATE_VERSION_MAJOR,
# ifdef SIMULATE_VERSION_MINOR
  '.', SIMULATE_VERSION_MINOR,
#  ifdef SIMULATE_VERSION_PATCH
   '.', SIMULATE_VERSION_PATCH,
#   ifdef SIMULATE_VERSION_TWEAK
    '.', SIMULATE_VERSION_TWEAK,
#   endif
#  endif
# endif
  ']','\0'};
#endif

/* Construct the string literal in pieces to prevent the source from
   getting matched.  Store it in a pointer rather than an array
   because some compilers will just produce instructions to fill the
   array rather than assigning a pointer to a static array.  */
char const* info_platform = "INFO" ":" "platform[" PLATFORM_ID "]";
char const* info_arch = "INFO" ":" "arch[" ARCHITECTURE_ID "]";


-- CMAKE_C_COMPILER_ID_RUN=1
-- CMAKE_C_COMPILER_ID_TEST_FLAGS=-c;-Aa;-D__CLASSIC_C__
-- CMAKE_C_COMPILER_ID_TOOL_MATCH_INDEX=2
-- CMAKE_C_COMPILER_ID_TOOL_MATCH_REGEX=
Ld[^
]*(
[ 	]+[^
]*)*
[ 	]+([^
]+)[^
]*-o[^
]*CompilerIdC/(\./)?(CompilerIdC.xctest/)?CompilerIdC[
\"]
-- CMAKE_C_COMPILER_ID_VENDORS=IAR
-- CMAKE_C_COMPILER_ID_VENDOR_REGEX_IAR=IAR .+ Compiler
-- CMAKE_C_COMPILER_INIT=C:/tools/mingw64/bin/gcc.exe
-- CMAKE_C_COMPILER_LIST=C:/tools/mingw64/bin/gcc.exe
-- CMAKE_C_COMPILER_LOADED=1
-- CMAKE_C_COMPILER_NAMES=cc
-- CMAKE_C_COMPILER_PRODUCED_FILES=a.exe
-- CMAKE_C_COMPILER_PRODUCED_OUTPUT=
-- CMAKE_C_COMPILER_RANLIB=C:/tools/mingw64/bin/gcc-ranlib.exe
-- CMAKE_C_COMPILER_RANLIB=C:/tools/mingw64/bin/gcc-ranlib.exe
-- CMAKE_C_COMPILER_VERSION=5.3.0
-- CMAKE_C_COMPILER_VERSION_INTERNAL=
-- CMAKE_C_COMPILER_WORKS=TRUE
-- CMAKE_C_COMPILER_WRAPPER=
-- CMAKE_C_COMPILE_FEATURES=c_std_90;c_function_prototypes;c_std_99;c_restrict;c_variadic_macros;c_std_11;c_static_assert
-- CMAKE_C_COMPILE_OBJECT=<CMAKE_C_COMPILER> <DEFINES> <INCLUDES> <FLAGS> -o <OBJECT>   -c <SOURCE>
-- CMAKE_C_COMPILE_OPTIONS_IPO=-flto;-fno-fat-lto-objects
-- CMAKE_C_COMPILE_OPTIONS_PIC=
-- CMAKE_C_COMPILE_OPTIONS_PIE=
-- CMAKE_C_COMPILE_OPTIONS_SYSROOT=--sysroot=
-- CMAKE_C_COMPILE_OPTIONS_VISIBILITY=-fvisibility=
-- CMAKE_C_CREATE_ASSEMBLY_SOURCE=<CMAKE_C_COMPILER> <DEFINES> <INCLUDES> <FLAGS> -S <SOURCE> -o <ASSEMBLY_SOURCE>
-- CMAKE_C_CREATE_PREPROCESSED_SOURCE=<CMAKE_C_COMPILER> <DEFINES> <INCLUDES> <FLAGS> -E <SOURCE> > <PREPROCESSED_SOURCE>
-- CMAKE_C_CREATE_SHARED_LIBRARY=<CMAKE_COMMAND> -E remove -f <OBJECT_DIR>/objects.a;<CMAKE_AR> cr <OBJECT_DIR>/objects.a <OBJECTS>;<CMAKE_C_COMPILER> <CMAKE_SHARED_LIBRARY_C_FLAGS> <LANGUAGE_COMPILE_FLAGS> <LINK_FLAGS> <CMAKE_SHARED_LIBRARY_CREATE_C_FLAGS> -o <TARGET> -Wl,--out-implib,<TARGET_IMPLIB> -Wl,--major-image-version,<TARGET_VERSION_MAJOR>,--minor-image-version,<TARGET_VERSION_MINOR> -Wl,--whole-archive <OBJECT_DIR>/objects.a -Wl,--no-whole-archive <LINK_LIBRARIES>
-- CMAKE_C_CREATE_SHARED_MODULE=<CMAKE_COMMAND> -E remove -f <OBJECT_DIR>/objects.a;<CMAKE_AR> cr <OBJECT_DIR>/objects.a <OBJECTS>;<CMAKE_C_COMPILER> <CMAKE_SHARED_MODULE_C_FLAGS> <LANGUAGE_COMPILE_FLAGS> <LINK_FLAGS> <CMAKE_SHARED_MODULE_CREATE_C_FLAGS> -o <TARGET> -Wl,--major-image-version,<TARGET_VERSION_MAJOR>,--minor-image-version,<TARGET_VERSION_MINOR> -Wl,--whole-archive <OBJECT_DIR>/objects.a -Wl,--no-whole-archive <LINK_LIBRARIES>
-- CMAKE_C_FLAGS=
-- CMAKE_C_FLAGS_DEBUG=-g
-- CMAKE_C_FLAGS_DEBUG_INIT=-g
-- CMAKE_C_FLAGS_INIT=
-- CMAKE_C_FLAGS_MINSIZEREL=-Os -DNDEBUG
-- CMAKE_C_FLAGS_MINSIZEREL_INIT=-Os -DNDEBUG
-- CMAKE_C_FLAGS_RELEASE=-O3 -DNDEBUG
-- CMAKE_C_FLAGS_RELEASE_INIT=-O3 -DNDEBUG
-- CMAKE_C_FLAGS_RELWITHDEBINFO=-O2 -g -DNDEBUG
-- CMAKE_C_FLAGS_RELWITHDEBINFO_INIT=-O2 -g -DNDEBUG
-- CMAKE_C_IGNORE_EXTENSIONS=h;H;o;O;obj;OBJ;def;DEF;rc;RC
-- CMAKE_C_IMPLICIT_LINK_DIRECTORIES=C:/tools/mingw64/lib/gcc/x86_64-w64-mingw32/5.3.0;C:/tools/mingw64/lib/gcc;C:/tools/mingw64/x86_64-w64-mingw32/lib;C:/tools/mingw64/lib
-- CMAKE_C_IMPLICIT_LINK_FRAMEWORK_DIRECTORIES=
-- CMAKE_C_IMPLICIT_LINK_LIBRARIES=mingw32;gcc;moldname;mingwex;pthread;advapi32;shell32;user32;kernel32;iconv;mingw32;gcc;moldname;mingwex
-- CMAKE_C_INFORMATION_LOADED=1
-- CMAKE_C_LIBRARY_ARCHITECTURE=
-- CMAKE_C_LINKER_PREFERENCE=10
-- CMAKE_C_LINK_EXECUTABLE=<CMAKE_COMMAND> -E remove -f <OBJECT_DIR>/objects.a;<CMAKE_AR> cr <OBJECT_DIR>/objects.a <OBJECTS>;<CMAKE_C_COMPILER> <FLAGS> <CMAKE_C_LINK_FLAGS> <LINK_FLAGS> -Wl,--whole-archive <OBJECT_DIR>/objects.a -Wl,--no-whole-archive  -o <TARGET> -Wl,--out-implib,<TARGET_IMPLIB> -Wl,--major-image-version,<TARGET_VERSION_MAJOR>,--minor-image-version,<TARGET_VERSION_MINOR> <LINK_LIBRARIES>
-- CMAKE_C_OUTPUT_EXTENSION=.obj
-- CMAKE_C_PLATFORM_ID=MinGW
-- CMAKE_C_RESPONSE_FILE_LINK_FLAG=@
-- CMAKE_C_SIMULATE_ID=
-- CMAKE_C_SIMULATE_VERSION=
-- CMAKE_C_SIZEOF_DATA_PTR=8
-- CMAKE_C_SOURCE_FILE_EXTENSIONS=c;m
-- CMAKE_C_STANDARD_COMPUTED_DEFAULT=11
-- CMAKE_C_STANDARD_DEFAULT=11
-- CMAKE_C_STANDARD_LIBRARIES=-lkernel32 -luser32 -lgdi32 -lwinspool -lshell32 -lole32 -loleaut32 -luuid -lcomdlg32 -ladvapi32
-- CMAKE_C_STANDARD_LIBRARIES_INIT=-lkernel32 -luser32 -lgdi32 -lwinspool -lshell32 -lole32 -loleaut32 -luuid -lcomdlg32 -ladvapi32
-- CMAKE_C_USE_RESPONSE_FILE_FOR_INCLUDES=1
-- CMAKE_C_USE_RESPONSE_FILE_FOR_LIBRARIES=1
-- CMAKE_C_USE_RESPONSE_FILE_FOR_OBJECTS=1
-- CMAKE_C_VERBOSE_FLAG=-v
-- CMAKE_C_XCODE_CURRENT_ARCH=
-- CMAKE_DEPFILE_FLAGS_C=-MD -MT <OBJECT> -MF <DEPFILE>
-- CMAKE_DEPFILE_FLAGS_CXX=-MD -MT <OBJECT> -MF <DEPFILE>
-- CMAKE_DL_LIBS=
-- CMAKE_EDIT_COMMAND=C:/ProgramData/chocolatey/lib/cmake.portable/tools/cmake-3.10.2-win64-x64/bin/cmake-gui.exe
-- CMAKE_EXECUTABLE_FORMAT=Unknown
-- CMAKE_EXECUTABLE_SUFFIX=.exe
-- CMAKE_EXE_LINKER_FLAGS=
-- CMAKE_EXE_LINKER_FLAGS_DEBUG=
-- CMAKE_EXE_LINKER_FLAGS_DEBUG_INIT=
-- CMAKE_EXE_LINKER_FLAGS_INIT=
-- CMAKE_EXE_LINKER_FLAGS_MINSIZEREL=
-- CMAKE_EXE_LINKER_FLAGS_MINSIZEREL_INIT=
-- CMAKE_EXE_LINKER_FLAGS_RELEASE=
-- CMAKE_EXE_LINKER_FLAGS_RELEASE_INIT=
-- CMAKE_EXE_LINKER_FLAGS_RELWITHDEBINFO=
-- CMAKE_EXE_LINKER_FLAGS_RELWITHDEBINFO_INIT=
-- CMAKE_EXE_LINK_DYNAMIC_CXX_FLAGS=-Wl,-Bdynamic
-- CMAKE_EXE_LINK_DYNAMIC_C_FLAGS=-Wl,-Bdynamic
-- CMAKE_EXE_LINK_STATIC_CXX_FLAGS=-Wl,-Bstatic
-- CMAKE_EXE_LINK_STATIC_C_FLAGS=-Wl,-Bstatic
-- CMAKE_EXTRA_GENERATOR=
-- CMAKE_EXTRA_LINK_EXTENSIONS=.lib
-- CMAKE_FILES_DIRECTORY=/CMakeFiles
-- CMAKE_FIND_LIBRARY_PREFIXES=lib;
-- CMAKE_FIND_LIBRARY_SUFFIXES=.dll;.dll.a;.a;.lib
-- CMAKE_GENERATOR=MinGW Makefiles
-- CMAKE_GENERATOR_CC=C:/tools/mingw64/bin/gcc.exe
-- CMAKE_GENERATOR_CXX=C:/tools/mingw64/bin/g++.exe
-- CMAKE_GENERATOR_PLATFORM=
-- CMAKE_GENERATOR_RC=C:/tools/mingw64/bin/windres.exe
-- CMAKE_GENERATOR_TOOLSET=
-- CMAKE_GNULD_IMAGE_VERSION=-Wl,--major-image-version,<TARGET_VERSION_MAJOR>,--minor-image-version,<TARGET_VERSION_MINOR>
-- CMAKE_GNUtoMS=OFF
-- CMAKE_HOME_DIRECTORY=C:/Users/dkiva/workspace/my/info-cmake/cmake-variables
-- CMAKE_HOST_SYSTEM=Windows-10.0.16299
-- CMAKE_HOST_SYSTEM_NAME=Windows
-- CMAKE_HOST_SYSTEM_PROCESSOR=AMD64
-- CMAKE_HOST_SYSTEM_VERSION=10.0.16299
-- CMAKE_HOST_WIN32=1
-- CMAKE_IMPORT_LIBRARY_PREFIX=lib
-- CMAKE_IMPORT_LIBRARY_SUFFIX=.dll.a
-- CMAKE_INCLUDE_FLAG_C=-I
-- CMAKE_INCLUDE_FLAG_CXX=-I
-- CMAKE_INCLUDE_FLAG_C_SEP=
-- CMAKE_INCLUDE_FLAG_RC=-I
-- CMAKE_INCLUDE_SYSTEM_FLAG_C=-isystem
-- CMAKE_INCLUDE_SYSTEM_FLAG_CXX=-isystem
-- CMAKE_INSTALL_DEFAULT_COMPONENT_NAME=Unspecified
-- CMAKE_INSTALL_PREFIX=C:/Program Files (x86)/CmakeVariables
-- CMAKE_INSTALL_PREFIX_INITIALIZED_TO_DEFAULT=1
-- CMAKE_LIBRARY_PATH_FLAG=-L
-- CMAKE_LIBRARY_PATH_TERMINATOR=
-- CMAKE_LINKER=C:/tools/mingw64/bin/ld.exe
-- CMAKE_LINKER=C:/tools/mingw64/bin/ld.exe
-- CMAKE_LINK_DEF_FILE_FLAG=
-- CMAKE_LINK_LIBRARY_FLAG=-l
-- CMAKE_LINK_LIBRARY_SUFFIX=
-- CMAKE_MAJOR_VERSION=3
-- CMAKE_MAKE_PROGRAM=C:/tools/mingw64/bin/mingw32-make.exe
-- CMAKE_MATCH_0=
-- CMAKE_MATCH_1=
-- CMAKE_MATCH_COUNT=0
-- CMAKE_MINIMUM_REQUIRED_VERSION=3.10
-- CMAKE_MINOR_VERSION=10
-- CMAKE_MODULE_LINKER_FLAGS=
-- CMAKE_MODULE_LINKER_FLAGS_DEBUG=
-- CMAKE_MODULE_LINKER_FLAGS_DEBUG_INIT=
-- CMAKE_MODULE_LINKER_FLAGS_INIT=
-- CMAKE_MODULE_LINKER_FLAGS_MINSIZEREL=
-- CMAKE_MODULE_LINKER_FLAGS_MINSIZEREL_INIT=
-- CMAKE_MODULE_LINKER_FLAGS_RELEASE=
-- CMAKE_MODULE_LINKER_FLAGS_RELEASE_INIT=
-- CMAKE_MODULE_LINKER_FLAGS_RELWITHDEBINFO=
-- CMAKE_MODULE_LINKER_FLAGS_RELWITHDEBINFO_INIT=
-- CMAKE_NM=C:/tools/mingw64/bin/nm.exe
-- CMAKE_OBJCOPY=C:/tools/mingw64/bin/objcopy.exe
-- CMAKE_OBJDUMP=C:/tools/mingw64/bin/objdump.exe
-- CMAKE_PARENT_LIST_FILE=C:/Users/dkiva/workspace/my/info-cmake/cmake-variables/CMakeLists.txt
-- CMAKE_PATCH_VERSION=2
-- CMAKE_PLATFORM_INFO_DIR=C:/Users/dkiva/workspace/my/info-cmake/cmake-variables/build/CMakeFiles/3.10.2
-- CMAKE_PLATFORM_INFO_INITIALIZED=1
-- CMAKE_PROJECT_NAME=CmakeVariables
-- CMAKE_RANLIB=C:/tools/mingw64/bin/ranlib.exe
-- CMAKE_RANLIB=C:/tools/mingw64/bin/ranlib.exe
-- CMAKE_RC_COMPILER=C:/tools/mingw64/bin/windres.exe
-- CMAKE_RC_COMPILER=C:/tools/mingw64/bin/windres.exe
-- CMAKE_RC_COMPILER_ARG1=
-- CMAKE_RC_COMPILER_ENV_VAR=RC
-- CMAKE_RC_COMPILER_INIT=C:/tools/mingw64/bin/windres.exe
-- CMAKE_RC_COMPILER_LIST=C:/tools/mingw64/bin/windres.exe
-- CMAKE_RC_COMPILER_LOADED=1
-- CMAKE_RC_COMPILER_WORKS=1
-- CMAKE_RC_COMPILE_OBJECT=<CMAKE_RC_COMPILER> -O coff <DEFINES> <INCLUDES> <FLAGS> <SOURCE> <OBJECT>
-- CMAKE_RC_FLAGS=
-- CMAKE_RC_FLAGS_DEBUG=
-- CMAKE_RC_FLAGS_DEBUG_INIT=
-- CMAKE_RC_FLAGS_INIT=
-- CMAKE_RC_FLAGS_MINSIZEREL=
-- CMAKE_RC_FLAGS_MINSIZEREL_INIT=
-- CMAKE_RC_FLAGS_RELEASE=
-- CMAKE_RC_FLAGS_RELEASE_INIT=
-- CMAKE_RC_FLAGS_RELWITHDEBINFO=
-- CMAKE_RC_FLAGS_RELWITHDEBINFO_INIT=
-- CMAKE_RC_FLAG_REGEX=^[-/](D|I)
-- CMAKE_RC_INFORMATION_LOADED=1
-- CMAKE_RC_OUTPUT_EXTENSION=.obj
-- CMAKE_RC_SOURCE_FILE_EXTENSIONS=rc;RC
-- CMAKE_ROOT=C:/ProgramData/chocolatey/lib/cmake.portable/tools/cmake-3.10.2-win64-x64/share/cmake-3.10
-- CMAKE_SH=CMAKE_SH-NOTFOUND
-- CMAKE_SHARED_LIBRARY_CREATE_CXX_FLAGS=-shared
-- CMAKE_SHARED_LIBRARY_CREATE_C_FLAGS=-shared
-- CMAKE_SHARED_LIBRARY_C_FLAGS=
-- CMAKE_SHARED_LIBRARY_LINK_C_FLAGS=
-- CMAKE_SHARED_LIBRARY_LINK_DYNAMIC_CXX_FLAGS=-Wl,-Bdynamic
-- CMAKE_SHARED_LIBRARY_LINK_DYNAMIC_C_FLAGS=-Wl,-Bdynamic
-- CMAKE_SHARED_LIBRARY_LINK_STATIC_CXX_FLAGS=-Wl,-Bstatic
-- CMAKE_SHARED_LIBRARY_LINK_STATIC_C_FLAGS=-Wl,-Bstatic
-- CMAKE_SHARED_LIBRARY_PREFIX=lib
-- CMAKE_SHARED_LIBRARY_RUNTIME_C_FLAG=
-- CMAKE_SHARED_LIBRARY_RUNTIME_C_FLAG_SEP=
-- CMAKE_SHARED_LIBRARY_SUFFIX=.dll
-- CMAKE_SHARED_LINKER_FLAGS=
-- CMAKE_SHARED_LINKER_FLAGS_DEBUG=
-- CMAKE_SHARED_LINKER_FLAGS_DEBUG_INIT=
-- CMAKE_SHARED_LINKER_FLAGS_INIT=
-- CMAKE_SHARED_LINKER_FLAGS_MINSIZEREL=
-- CMAKE_SHARED_LINKER_FLAGS_MINSIZEREL_INIT=
-- CMAKE_SHARED_LINKER_FLAGS_RELEASE=
-- CMAKE_SHARED_LINKER_FLAGS_RELEASE_INIT=
-- CMAKE_SHARED_LINKER_FLAGS_RELWITHDEBINFO=
-- CMAKE_SHARED_LINKER_FLAGS_RELWITHDEBINFO_INIT=
-- CMAKE_SHARED_MODULE_CREATE_CXX_FLAGS=-shared
-- CMAKE_SHARED_MODULE_CREATE_C_FLAGS=-shared
-- CMAKE_SHARED_MODULE_LINK_DYNAMIC_CXX_FLAGS=-Wl,-Bdynamic
-- CMAKE_SHARED_MODULE_LINK_DYNAMIC_C_FLAGS=-Wl,-Bdynamic
-- CMAKE_SHARED_MODULE_LINK_STATIC_CXX_FLAGS=-Wl,-Bstatic
-- CMAKE_SHARED_MODULE_LINK_STATIC_C_FLAGS=-Wl,-Bstatic
-- CMAKE_SHARED_MODULE_PREFIX=lib
-- CMAKE_SHARED_MODULE_SUFFIX=.dll
-- CMAKE_SIZEOF_VOID_P=8
-- CMAKE_SKIP_INSTALL_RPATH=NO
-- CMAKE_SKIP_RPATH=NO
-- CMAKE_SOURCE_DIR=C:/Users/dkiva/workspace/my/info-cmake/cmake-variables
-- CMAKE_STATIC_LIBRARY_PREFIX=lib
-- CMAKE_STATIC_LIBRARY_SUFFIX=.a
-- CMAKE_STATIC_LINKER_FLAGS=
-- CMAKE_STATIC_LINKER_FLAGS_DEBUG=
-- CMAKE_STATIC_LINKER_FLAGS_DEBUG_INIT=
-- CMAKE_STATIC_LINKER_FLAGS_INIT=
-- CMAKE_STATIC_LINKER_FLAGS_MINSIZEREL=
-- CMAKE_STATIC_LINKER_FLAGS_MINSIZEREL_INIT=
-- CMAKE_STATIC_LINKER_FLAGS_RELEASE=
-- CMAKE_STATIC_LINKER_FLAGS_RELEASE_INIT=
-- CMAKE_STATIC_LINKER_FLAGS_RELWITHDEBINFO=
-- CMAKE_STATIC_LINKER_FLAGS_RELWITHDEBINFO_INIT=
-- CMAKE_STRIP=C:/tools/mingw64/bin/strip.exe
-- CMAKE_SYSTEM=Windows-10.0.16299
-- CMAKE_SYSTEM_AND_RC_COMPILER_INFO_FILE=C:/ProgramData/chocolatey/lib/cmake.portable/tools/cmake-3.10.2-win64-x64/share/cmake-3.10/Modules/Platform/Windows-windres.cmake
-- CMAKE_SYSTEM_INFO_FILE=Platform/Windows
-- CMAKE_SYSTEM_LIBRARY_PATH=C:/Program Files (x86)/CmakeVariables/bin;C:/ProgramData/chocolatey/lib/cmake.portable/tools/cmake-3.10.2-win64-x64/bin;/bin
-- CMAKE_SYSTEM_LOADED=1
-- CMAKE_SYSTEM_NAME=Windows
-- CMAKE_SYSTEM_PREFIX_PATH=C:/Program Files;C:/Program Files (x86);C:/ProgramData/chocolatey/lib/cmake.portable/tools/cmake-3.10.2-win64-x64;C:/Program Files (x86)/CmakeVariables
-- CMAKE_SYSTEM_PROCESSOR=AMD64
-- CMAKE_SYSTEM_SPECIFIC_INFORMATION_LOADED=1
-- CMAKE_SYSTEM_SPECIFIC_INITIALIZE_LOADED=1
-- CMAKE_SYSTEM_VERSION=10.0.16299
-- CMAKE_TWEAK_VERSION=0
-- CMAKE_VERBOSE_MAKEFILE=FALSE
-- CMAKE_VERSION=3.10.2
-- CXX_TEST_WAS_RUN=1
-- C_TEST_WAS_RUN=1
-- CmakeVariables_BINARY_DIR=C:/Users/dkiva/workspace/my/info-cmake/cmake-variables/build
-- CmakeVariables_SOURCE_DIR=C:/Users/dkiva/workspace/my/info-cmake/cmake-variables
-- MINGW=1
-- MSVC_CXX_ARCHITECTURE_ID=
-- MSVC_C_ARCHITECTURE_ID=
-- PRESET_CMAKE_SYSTEM_NAME=FALSE
-- PROJECT_BINARY_DIR=C:/Users/dkiva/workspace/my/info-cmake/cmake-variables/build
-- PROJECT_NAME=CmakeVariables
-- PROJECT_SOURCE_DIR=C:/Users/dkiva/workspace/my/info-cmake/cmake-variables
-- RUN_CONFIGURE=ON
-- WIN32=1
-- _CMAKE_CXX_IPO_MAY_BE_SUPPORTED_BY_COMPILER=YES
-- _CMAKE_CXX_IPO_SUPPORTED_BY_CMAKE=YES
-- _CMAKE_C_IPO_MAY_BE_SUPPORTED_BY_COMPILER=YES
-- _CMAKE_C_IPO_SUPPORTED_BY_CMAKE=YES
-- _CMAKE_INSTALL_DIR=C:/ProgramData/chocolatey/lib/cmake.portable/tools/cmake-3.10.2-win64-x64
-- _CMAKE_RC_COMPILER_NAME_WE=windres
-- _CMAKE_TOOLCHAIN_LOCATION=C:/tools/mingw64/bin
-- _INCLUDED_FILE=C:/ProgramData/chocolatey/lib/cmake.portable/tools/cmake-3.10.2-win64-x64/share/cmake-3.10/Modules/Platform/Windows-GNU-CXX.cmake
-- _INCLUDED_SYSTEM_INFO_FILE=C:/ProgramData/chocolatey/lib/cmake.portable/tools/cmake-3.10.2-win64-x64/share/cmake-3.10/Modules/Platform/Windows.cmake
-- _IN_TC=0
-- _SET_CMAKE_CXX_COMPILER_ARCHITECTURE_ID=
-- _SET_CMAKE_C_COMPILER_ARCHITECTURE_ID=
-- __COMPILER_CMAKE_COMMON_COMPILER_MACROS=1
-- __COMPILER_GNU=1
-- __WINDOWS_GNU=1
-- __WINDOWS_GNU_LD_RESPONSE=1
-- __WINDOWS_PATHS_INCLUDED=1
-- __gcc_hints=C:/tools/mingw64/bin
-- __lto_flags=-flto;-fno-fat-lto-objects
-- __version_x=5
-- __version_x_y=5.3
-- _help=GNU ld (GNU Binutils) 2.25
-- _ver=g++.exe (x86_64-posix-seh-rev0, Built by MinGW-W64 project) 5.3.0
Copyright (C) 2015 Free Software Foundation, Inc.
This is free software; see the source for copying conditions.  There is NO
warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
-- c=
-- d=
-- f=
-- l=
-- rule=
-- t=
-- type=
-- v=
```
