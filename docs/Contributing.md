`main` is the only long-lived branch. Work happens on short-lived branches cut from it and merged back into it through pull requests. Releases are version tags, and only a tag deploys.

## Branches

| Prefix | For |
|---|---|
| `feature/` | New behaviour, e.g. `feature/local-first-sync` |
| `bugfix/` | Fixing something that's broken |
| `chore/` | Dependencies, CI, docs and releases (`chore/release-0.5.0`) |

After the prefix, use lowercase letters, digits, dots and hyphens. CI's `branch-name` check fails a pull request whose branch doesn't follow this, or that targets anything but `main`.

## Pull requests

1. `git switch -c feature/<name> origin/main`
2. Commit. Commits are signed, in the `type(scope): summary` style (`feat`, `fix`, `chore`, `docs`, `refactor`, `test`).
3. Open a pull request into `main`. Note user-facing changes under `[Unreleased]` in `CHANGELOG.md`.
4. Once `branch-name`, `verify`, `image` and `storybook` pass, merge with a **merge commit**. Squash and rebase merges are turned off: a rebase merge rewrites the commits and drops their signatures. GitHub deletes the branch after merging.

A ruleset on `main` enforces this: changes arrive only through pull requests with passing checks, with no force pushes and no deletion.

Merging to `main` builds and publishes the image (`sha-<short>`), but deploys nothing.

## Releasing

1. Open a `chore/release-x.y.z` pull request. In `CHANGELOG.md`, rename `[Unreleased]` to `[x.y.z] - YYYY-MM-DD`, start a new empty `[Unreleased]`, and update the compare links. Bump `version` in the root `package.json`. Merge it.
2. Tag the merge commit with a signed tag, and push it:

   ```bash
   git fetch origin
   git tag -s vX.Y.Z -m "Sokoban X.Y.Z" origin/main
   git push origin vX.Y.Z
   ```

3. CI publishes `X.Y.Z`, `X.Y`, `latest` and `sha-<short>`, then copies `X.Y.Z` to the instance's registry, deploys it to Spotcraft and waits until it's live ([Deploying on Spotcraft](Deploying-on-Spotcraft.md)). The `production` environment accepts only `v*.*.*` tags, and version tags can't be moved or deleted.
4. Draft a GitHub Release for the tag from the CHANGELOG section, and publish it.

An urgent fix is a `bugfix/` pull request followed by these same steps. A tiny fix may carry its own version bump instead of a separate release pull request.

Rolling back is releasing the previous version in Studio ([Deploying on Spotcraft](Deploying-on-Spotcraft.md)).

Running the app and its tests is in [Getting Started](Getting-Started.md) and [Development](Development.md).
