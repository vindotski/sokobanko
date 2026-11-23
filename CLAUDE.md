# Sokobanko

A box-pushing puzzle game in the browser (Nuxt 4, Vue 3, shadcn-vue, PixiJS, Postgres with
Drizzle), deployed on Spotcraft. The first app built on Spotcraft, spotkit and Spotstrap.

Read the shared rules for every Kodentuzo repository first:
[AGENTS.md](https://github.com/kodentuzo/.github/blob/main/AGENTS.md), in a local checkout
@~/Repositories/kodentuzo/.github/AGENTS.md. This file adds this repository's layout, commands and
conventions, and wins where the two differ.

## Commands

```bash
pnpm lint && pnpm typecheck && pnpm test:unit && pnpm build   # what CI's verify runs
pnpm exec spotcraft dev   # Spotcraft's local stack: Postgres, the user pool, .env
pnpm self-host            # the self-hosting stack, without Spotcraft; then pnpm self-host:smoke
```

Node from `.nvmrc`, pnpm from `packageManager`. Don't start `pnpm dev` or Storybook in the
user's checkout without asking.

## Conventions

- **Docs** live in `docs/` (index: `docs/README.md`).
- **Releases:** a signed `vX.Y.Z` tag on `main` publishes the image and deploys it
  ([CONTRIBUTING.md](CONTRIBUTING.md), `docs/Contributing.md`). Note user-facing changes
  under `[Unreleased]` in `CHANGELOG.md`.
- **Legal pages** come from `LEGAL_FACTS` and Spotstrap's blocks; no personal details in the
  repository.
