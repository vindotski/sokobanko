# sokobanko

A pnpm monorepo.

## Requirements

- Node.js 26+
- pnpm 12

## Getting started

```sh
pnpm install
```

## Scripts

| Command          | Description                           |
| ---------------- | ------------------------------------- |
| `pnpm build`     | Build all packages                    |
| `pnpm dev`       | Run `dev` in all packages in parallel |
| `pnpm test`      | Run tests with Vitest                 |
| `pnpm typecheck` | Type-check all packages               |
| `pnpm lint`      | Lint and check formatting with Biome  |
| `pnpm format`    | Apply Biome fixes and formatting      |

## Structure

```
apps/       # applications
packages/   # shared libraries
```
