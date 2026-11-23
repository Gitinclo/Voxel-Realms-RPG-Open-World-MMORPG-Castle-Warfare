# Task runner definitions for Voxel Realms RPG (`v1.5.0`)
# Run `just --list` to inspect all recipes.

set shell := ["bash", "-euo", "pipefail", "-c"]

# List available tasks
default:
    @just --list

# Install npm dependencies
install:
    npm install

# Start unified Express + WebSocket + Vite dev server on port 3000
dev:
    npm run dev

# Build production client bundle to dist/
build:
    npm run build

# Format entire repository with Prettier
format:
    npm run format

# Run full 6-stage validation gate (lockfile:verify + tsc + firestore eslint + prettier + 264 tests + vite build)
validate:
    npm run validate

# Run all 264 TypeScript & Firestore security rule tests (50 test files)
test:
    npm test

# Run single targeted test file: `just test-one src/game/eula.test.ts`
test-one file:
    npx tsx --test {{file}}

# Run live isolated production server load, exploit & crash-recovery verification
ops:
    npm run verify:ops

# Audit npm dependencies for high/critical advisories
audit:
    npm audit --audit-level=high

# Build & execute native C++20 guardrail unit tests via CMake + vcpkg
cpp-test:
    cmake -B build -S . -G Ninja -DCMAKE_TOOLCHAIN_FILE="${VCPKG_ROOT:-$HOME/vcpkg}/scripts/buildsystems/vcpkg.cmake"
    cmake --build build
    ctest --test-dir build --output-on-failure

# Clean build outputs
clean:
    npm run clean
    rm -rf build
