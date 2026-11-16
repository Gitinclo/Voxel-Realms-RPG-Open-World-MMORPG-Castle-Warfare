# CLI & Script Reference (`CLI_REFERENCE.md`)

Complete catalog of npm scripts, database migrations, C++20 verification commands, and HTTP/WebSocket readiness probes for **Voxel Realms RPG (`v1.5.0`)**.

---

## 1. NPM Script Commands (`package.json`)

| Script                 | Underlying Command                                                        | Description                                                                                    |
| :--------------------- | :------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------- |
| `npm run dev`          | `tsx server.ts`                                                           | Starts Express API, `/ws/siege` WebSocket server, and Vite middleware on port `3000`           |
| `npm start`            | `tsx server.ts`                                                           | Launches the Node.js production server (serving built `dist/` when `NODE_ENV=production`)      |
| `npm run build`        | `vite build`                                                              | Compiles production React/Three.js client bundles with Rolldown `manualChunks` into `dist/`    |
| `npm run preview`      | `vite preview`                                                            | Previews static client bundle output locally without backend routes                            |
| `npm run clean`        | `rm -rf dist server.js`                                                   | Removes generated client/server build outputs                                                  |
| `npm run lint`         | `tsc --noEmit`                                                            | Runs strict TypeScript compiler checks (`noUnusedLocals`, `noUnusedParameters`)                |
| `npm run lint:rules`   | `eslint firestore.rules`                                                  | Audits Cloud Firestore rules with `@firebase/eslint-plugin-security-rules`                     |
| `npm run format`       | `prettier --write .`                                                      | Formats `.ts`, `.tsx`, `.md`, `.json`, `.yml`, and `.css` files                                |
| `npm run format:check` | `prettier --check .`                                                      | Fails if any tracked file violates Prettier rules                                              |
| `npm test`             | `tsx --test src/game/*.test.ts src/lib/*.test.ts firestore.rules.test.ts` | Executes all **171 automated tests across 29 suites**                                          |
| `npm run test:rules`   | `tsx --test firestore.rules.test.ts`                                      | Runs only the Dirty Dozen Firestore security rule audit tests                                  |
| `npm run verify:ops`   | `tsx scripts/verify-readiness.ts`                                         | Spawns isolated server, runs 50-way load, exploit rejections, `.bak` failover & `SIGTERM` test |
| `npm run validate`     | `lint && lint:rules && format:check && test && build`                     | Full 5-stage pre-merge validation gate                                                         |

---

## 2. Database & Cloud Operations Commands

```bash
# Push Drizzle ORM schema updates to PostgreSQL / Cloud SQL (uses src/db/drizzle.config.ts)
npx drizzle-kit push

# Generate SQL migration files without executing immediately
npx drizzle-kit generate

# Check for known high/critical security advisories in dependencies
npm audit --audit-level=high
```

---

## 3. C++20 Guardrail Toolchain (`cpp/`)

```bash
# Configure & build native C++20 guardrail unit tests with vcpkg toolchain
cmake -B build -S . -G Ninja \
  -DCMAKE_TOOLCHAIN_FILE="$VCPKG_ROOT/scripts/buildsystems/vcpkg.cmake"
cmake --build build
ctest --test-dir build --output-on-failure

# Verify LLVM C++20 formatting (.clang-format)
clang-format --dry-run --Werror cpp/VoxelRealmsGuardrails.hpp cpp/engine_guardrail_test.cpp
```

---

## 4. Justfile Shortcuts

When `just` is installed (`Justfile`), aliases map directly to the commands above (`just dev`, `just validate`, `just ops`, `just test-one <file>`, `just cpp-test`, `just audit`).
