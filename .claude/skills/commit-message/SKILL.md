---
name: commit-message
description: Write a Conventional Commits message and commit the current changes in Sokobanko. Use when a step is finished and verified, or when the user asks for a commit. The agent commits and pushes its branch; it merges and tags only as the repository's rules say.
---

# Commit

You commit finished, verified work with this message and push the branch. Never force-push or push
to `main`; the branch is `feature/`, `bugfix/` or `chore/` from `origin/main`, and its PR goes into
`main`. Tags are signed (`git tag -s`) and made only when the user asks.

## Steps

1. Read the change: `git status` and `git diff` (plus `git diff --staged` if anything is staged).
   Base the message on the diff, not on memory.
2. If the changes mix unrelated work, say so and propose how to split them into separate commits.
3. If the repository has a `CHANGELOG.md` and the change is user-facing, add it under `Unreleased`
   in the same commit, and update the README the change touches. Internal changes (`ci`, `chore`,
   `ai`, refactors) get no entry. Breaking changes say how to migrate.
4. Stage only the files that belong to the commit (`git add <paths>`), commit with the message
   (signed), and show the user the resulting `git log --oneline` line.

## Format

```
<type>(<scope>)<!>: <summary>

<body>

<footer>
```

- **Summary:** imperative and lower case, with no trailing period, **at most 50 characters**
  including the type and scope (72 is the hard limit). Count before suggesting.
- **Body (optional):** explains _why_, plus anything non-obvious. Wrap at 72 characters. Skip it for
  trivial changes.
- **Breaking changes:** add `!` after the scope, and a `BREAKING CHANGE: <what and how to migrate>`
  footer.
- A commit an agent wrote ends with its `Co-Authored-By:` trailer (the shared rules in
  kodentuzo/.github AGENTS.md).

## Types

`feat`, `fix`, `refactor`, `perf`, `style` (formatting only), `test`, `docs`, `build` (toolchain,
dependencies), `ci`, `chore` (repo housekeeping), `revert`.

## Scopes

Optional, but use one when it fits:

| Scope       | Covers                                                                    |
| ----------- | ------------------------------------------------------------------------- |
| `game`      | `packages/game`, `packages/core`: the rules, shared by browser and server |
| `play`      | the playing screen                                                        |
| `map`       | the level map                                                             |
| `progress`  | Progress and Your data                                                    |
| `legal`     | the privacy policy, terms and legal notice                                |
| `levels`    | the level sets                                                            |
| `server`    | `server/`: the API and the database                                       |
| `ui`        | `app/components/ui`: shadcn-vue components                                |
| `storybook` | `stories/`, `.storybook/`, screenshots                                    |
| `self-host` | `self-host/`: running without Spotcraft                                   |
| `web`       | the app as a whole, when no narrower scope fits                           |
| `docs`      | `docs/`, ADRs                                                             |
| `deps`      | dependency changes                                                        |
| `ci`        | GitHub workflows                                                          |
| `ai`        | `AGENTS.md`, `CLAUDE.md`, `.claude/`, skills                              |
| `repo`      | license, root config, repository metadata                                 |

Leave the scope out for repo-wide changes.

## Example

```
feat(play): three undos per attempt, checked by the server

The browser sends the whole input log, so the server can replay it
and refuse a run that used more.
```
