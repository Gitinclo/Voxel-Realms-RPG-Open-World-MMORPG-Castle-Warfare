cmake_minimum_required(VERSION 3.22)
project(VoxelRealmsEngine VERSION 1.2.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

if(MSVC)
    add_compile_options(/W4 /WX /permissive-)
else()
    add_compile_options(-Wall -Wextra -Wpedantic -Werror -Wshadow -Wconversion)
endif()

add_executable(voxel_engine_guardrail_test
    cpp/engine_guardrail_test.cpp
)

target_include_directories(voxel_engine_guardrail_test PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/cpp)

enable_testing()
add_test(NAME Cpp20EngineGuardrailTest COMMAND voxel_engine_guardrail_test)
