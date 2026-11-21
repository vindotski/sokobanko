---
name: github-workflows
description: Sokobanko's conventions for GitHub Actions workflows and Dependabot — SHA-pinned actions, least-privilege permissions, environments, OIDC publishing, branch triggers, required checks. Use when creating, editing or reviewing anything in .github/.
---

# GitHub workflows

This is Sokobanko's copy of the ecosystem's shared skill
([kodentuzo/ecosystem](https://github.com/kodentuzo/ecosystem/tree/main/.claude/skills/github-workflows)),
with Sokobanko's workflows and required checks. Change a shared rule there first, then here.

## Branches and triggers

- `main` is the only long-lived branch; PRs target it, from `feature/`, `bugfix/` or `chore/`
  branches, and `branch-name.yml` fails anything else (it also runs on `edited`, so a retargeted
  pull request is checked again). Releases, where a repository has them, are signed `vX.Y.Z` tags on
  `main`.
- `ci.yml` runs on PRs and pushes to `main`, plus the repository's release tags. Anything that
  publishes (images, npm, a website) runs on push events or tags only, never on PRs.
- **Required checks** on `main` come from a ruleset: at least `branch-name` and `verify`. Each
  repository lists the rest in its README or `CONTRIBUTING.md`. Renaming a required job means
  updating the ruleset too.
- Deploys are manual (`workflow_dispatch`) or follow a release tag, and use an environment such as
  `production`.

## Rules

- **Pin every action to a full commit SHA** with the version in a comment:
  `uses: actions/checkout@<40-hex sha> # v7.0.1`. Find the SHA for a tag with
  `gh api repos/<owner>/<repo>/commits/<tag> --jq .sha`. Reuse the SHA already used elsewhere in
  `.github/` for the same action. Dependabot (`github-actions` ecosystem, weekly, a day's cooldown)
  keeps them current. The comment holds the version and nothing else; Dependabot leaves a comment
  with more text after the version unchanged. Put any note on its own line above.
- **Permissions:** `permissions: contents: read` at the top of each workflow; a job that needs more
  declares only that (e.g. `id-token: write` for npm trusted publishing or Pages, `pages: write` for
  Pages).
- `actions/checkout` with `persist-credentials: false` unless a later step needs to push.
- **Secrets and variables** belong to an environment (`production`, `npm`), not the repository. Pass
  them to steps through `env:`, never interpolate `${{ secrets.* }}` or untrusted input
  (`github.event.*`, inputs, branch names) directly into `run:` scripts. Validate inputs in a first
  step.
- Node and pnpm come from the repository: `pnpm/action-setup` (version from `packageManager`) and
  `actions/setup-node` with `node-version-file: .nvmrc`.
- Only the original repository publishes (`github.repository == '<owner>/<repo>'`), so forks don't
  try.
- Set `concurrency` for anything that deploys or publishes, with `cancel-in-progress: false`.
- Comments at the top of a workflow say what it does and when it runs.

## Checking

There's no local runner. Check syntax with `actionlint` when it's installed
(`brew install actionlint`); otherwise read the diff carefully and let the PR's CI run prove it. A
workflow that only runs on `main` or tags can't be tested on a PR: say so to the user.

## In Sokobanko

- `ci.yml` runs on PRs, pushes to `main` and `v*.*.*` tags:
  - `branch-name`, `verify` (against Spotcraft's local stack), `storybook`, `image` (built, pushed
    to Docker Hub on push events) and `self-host` (the image without Spotcraft);
  - `wiki` publishes `docs/` to the wiki from `main`;
  - `deploy` sends a `v*` tag's image to Spotcraft through its deploy hook.
- `update-screenshots.yml` is manual: it renders the stories' screenshots on Linux.
- Required checks on `main`: `branch-name`, `verify`, `image`, `storybook`.
