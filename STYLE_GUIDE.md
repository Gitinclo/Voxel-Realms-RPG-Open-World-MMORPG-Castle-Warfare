# 🎨 Code & Documentation Style Guide (`STYLE_GUIDE.md`)

> **Project:** Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `15/11/2026`)  
> **Sovereign Root Owner:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com) · **License:** Apache-2.0 (Source) / EULA v1.5.0 (Service)

## TypeScript & React

- **Formatter**: Prettier (`.prettierrc`): run `npm run format` before commits.
- **Strictness**: Never introduce `@ts-ignore`, unused parameters/locals, or unawaited promises.
- **Modals & Bundle Budget**: Register heavy modals under `React.lazy` in `src/App.tsx` so initial chunk size stays lean.
- **Styling**: Tailwind CSS v4 utility classes only; avoid inline styles except dynamic computed coordinates.

## C++20 (`cpp/`)

- **Formatter**: LLVM style via `.clang-format` (`IndentWidth: 4`, `ColumnLimit: 100`).
- **Static Analysis**: Smart pointers only (`std::unique_ptr`, `std::shared_ptr`) enforced by `.clang-tidy`.
