# Contributing

`main` is the only long-lived branch. Work happens on short-lived branches cut from it and merged back into it through pull requests. Releases are signed version tags, and only a tag deploys.

- **Branches:** `feature/<name>`, `bugfix/<name>` or `chore/<name>`, with lowercase letters, digits, dots and hyphens. CI's `branch-name` check fails anything else, and any pull request that doesn't target `main`.
- **Commits** are signed, in the `type(scope): summary` style (`feat`, `fix`, `chore`, `docs`, `refactor`, `test`). Note user-facing changes under `[Unreleased]` in `CHANGELOG.md`.
- **Pull requests** merge once `branch-name`, `verify`, `image` and `storybook` pass, with a **merge commit**. Squash and rebase merges are off.
- **Docs** live in `docs/` and are published to the [wiki](https://github.com/vindotski/sokobanko/wiki) from `main`. Edit them there, not in the wiki.

The full flow, releases included, is on the wiki's [Contributing](https://github.com/vindotski/sokobanko/wiki/Contributing) page. Setting up the project is in [Getting Started](https://github.com/vindotski/sokobanko/wiki/Getting-Started).
