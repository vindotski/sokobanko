---
title: Parity
description: How Sokobanko's play, controls, levels and progress compare with the original Sokoban and the most-installed mobile apps.
---

# Parity

This page compares Sokobanko with the original Sokoban and with today's most-installed Sokoban apps, and lists what's planned to close the gaps. Phases refer to [roadmap.md](roadmap.md), and numbers in parentheses to the [decision records](decisions/README.md).

**The difference in kind:** the others are standalone programs that ship their levels inside the app. Sokobanko is a web page. Its levels are Markdown files with typed front matter, checked by Spotcraft and served by its own small server (from Phase 7, out of the hosted Spotcraft API). Every solution is a LURD string that the game's engine replays. So parity has two halves. The first is to play at least as well as the originals: undo, counters, controls. The second is to offer what being on the web makes possible: shareable links, levels that can be edited without a release, and later on, verified leaderboards.

**Compared** (checked 2026-11-03):
- **The original**, *Sokoban* by Thinking Rabbit, 1982, on the PC-8801 and FM-7 (shown as 1982).
- *Soko-Ban*, the 1988 US release by Spectrum HoloByte, as documented in the Tandy CoCo manual (1988).
- [Sokoban Touch](https://play.google.com/store/apps/details?id=jp.thinkingrabbit.sokobantouch_free), the official app from Falcon Co., Ltd., which holds the Thinking Rabbit trademark. Version 3.0.16 on Android, 3.0.15 on iOS (Touch).
- [Sokoban Original & Extra](https://play.google.com/store/apps/details?id=br.com.orangevoid.sokobanfree) by Orange Void, 1.6.1, Android. The most-installed Sokoban app on Google Play, with 500K+ installs (Orange Void).
- [Sokoban Collection](https://play.google.com/store/apps/details?id=org.alesapps.sokobanfree) by Ales Apps, 3.70, Android, with 100K+ installs (Collection).

No iOS-only Sokoban app had a meaningful number of ratings. The apps are picked by installs and reviews on Google Play, since there was no reliable ranking to go by.

**Others:** ✅ yes · ◐ partly · ✖ no · ? not verified (store listings and reviews don't say)

**Sokobanko:** ✅ built · ◐ partly built · 📐 designed · ⏳ planned (phase) · ✖ not planned

## Rules and core play

All of them use the same rules: push, never pull, one box at a time, and solved when every box is on a goal. The 1982 original also has breakable walls from level 11 on, which later versions dropped.

| Feature | Sokobanko | 1982 | 1988 | Touch | Orange Void | Collection |
| --- | --- | --- | --- | --- | --- | --- |
| Move and push counters | ✅ | ? | ✅ | ? | ✅ | ✅ |
| Undo | ✅ unlimited (button) | ? | ◐ one step | ✅ unlimited | ? | ✅ unlimited |
| Redo | ✅ until the next move | ✖ | ✖ | ✅ | ? | ? |
| Restart | ✅ | ◐ 4 per level | ✅ | ✅ | ? | ? |
| Time counter | ✖ on purpose | ? | ✅ | ? | ? | ? |
| Resume a half-played level | ✅ kept in the browser | ✖ | ✖ | ✅ | ✖ | ✅ |
| Replay a solution | ⏳ 8, from the stored best | ✖ | ✖ | ✅ | ? | ? |
| Deadlock warnings | ✅ a box on a dead square is crossed out, never blocked (17) | ✖ | ✖ | ? | ? | ? |
| Reverse (pull) mode | ✖ | ✖ | ✖ | ✖ | ? | ? |
| Variants (Hexoban, Trioban, Multiban) | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ |

**On purpose:**
- **No timer:** Sokoban is scored by moves and pushes. A clock rewards rushing, not solving.
- **No variants:** the engine, the XSB maps and the LURD solutions are all for square grids. Hexoban and Multiban would need a different format, and the [Sokoban wiki](http://sokobano.de/wiki) is the reference for them.

**Worth knowing:**
- **Unlocking in order:** levels unlock in play order, and progress is checked by replaying the solution in the browser (12). That replay check moves to a server only under Later (15).
- **Restart limits:** the 1982 release allowed only 4 restarts per level, and the 1988 one only one undo step. Unlimited undo became standard with later PC and mobile versions.

## Controls and UX

| Feature | Sokobanko | 1982 | 1988 | Touch | Orange Void | Collection |
| --- | --- | --- | --- | --- | --- | --- |
| Keyboard movement | ✅ arrows and WASD | ✅ numpad | ✅ arrows | ✖ | ? | ? |
| Keyboard undo, redo and restart | ✅ Z or U, Y, R | ? | ✅ U, R | ✖ | ? | ? |
| On-screen joystick or D-pad | ✅ a floating joystick wherever you touch | ✖ | ✅ joystick | ? | ✅ D-pad | ✅ |
| Swipe | ◐ the joystick follows a drag | ✖ | ✖ | ✅ | ✅ | ✅ |
| Tap to walk (pathfinding) | ⏳ 8 (16) | ✖ | ✖ | ✅ | ? | ◐ double tap |
| Drag a box to push it there | ⏳ 8 (16) | ✖ | ✖ | ◐ long press | ? | ? |
| Big levels: camera and overview | ✅ the camera follows the player; Space shows the whole level | ✖ | ✖ | ? | ? | ? |
| Themes | ✅ light and dark, following the system | ✖ | ◐ colours | ? | ? | ✅ |
| Sound | ✅ synthesized, muted by default | ? | ✅ | ✅ | ? | ✅ |
| Reduced motion | ✅ celebrations respect it | ✖ | ✖ | ? | ? | ? |
| Screen readers | ✅ pushes, undos and solves announced in a live region; a labelled board | ✖ | ✖ | ✖ | ? | ? |

**Worth knowing:** the strongest accessibility feature list found was in a smaller app, [Sokoban by Accessible Apps](https://play.google.com/store/search?q=sokoban&c=apps) (5K+ installs). Its listing claims TalkBack support, WCAG AA contrast and tap-to-walk. Sokobanko's monochrome board tells the pieces apart by shape, not colour (6).

## Levels and formats

| Feature | Sokobanko | 1982 | 1988 | Touch | Orange Void | Collection |
| --- | --- | --- | --- | --- | --- | --- |
| Bundled levels | 159 in 2 collections | 20 | 50 | a free set and paid packs | about 600 (?) | 2,950 in 34 collections |
| Well-known collections | ✅ Microban, credited (18) | Original | Original | Falcon's official sets | Original, Extra and its own | Original, Microban, Maelstrom, … |
| XSB maps | ✅ (3) | ✖ | ✖ | ? | ? | ? |
| LURD solutions | ✅ stored for every best (3) | ✖ | ✖ | ◐ share results | ? | ? |
| Paste an XSB level to play it | ⏳ 8, played locally, never saved as official | ✖ | ✖ | ✖ | ? | ? |
| Copy a solution as LURD | ⏳ 8 | ✖ | ✖ | ◐ | ? | ? |
| Level metadata (author, description) | ◐ description in the body (11), shown ⏳ 8; `author` ⏳ 8 | ✖ | ✖ | ? | ? | ◐ difficulty |
| Levels editable without a release | ◐ they live in Postgres, written by migrations; no editor yet | ✖ | ✖ | ✖ | ✖ | ✖ |
| Level editor | ✖ for now (Later, 15) | ✖ (*Sokoban 2*, 1984, had one) | ✖ | ✖ | ? | ? |

**On purpose:**
- **No Original or Extra levels:** they're © 1982 Thinking Rabbit, and the trademark now belongs to Falcon. Nothing grants permission to redistribute them, and the same goes for XSokoban's 90, which derive from them.
- **Microban and Sasquatch** (David W. Skinner) "may be freely distributed provided they remain properly credited". Microban is in, all 155, and Sasquatch is a candidate for a harder collection (18).

**Worth knowing:**
- **XSB floor characters:** standard XSB also accepts `-` and `_` for floor, and needs at least one of them on an empty row inside a puzzle. Run-length encoding (`4#|…`) and the SOK format with its `Title:`/`Author:` headers are common when exchanging levels. The game's parser (3) accepts only the space; `bin/import-collection.ts` turns `-` and `_` into spaces.

## Progress, community and tools

| Feature | Sokobanko | 1982 | 1988 | Touch | Orange Void | Collection |
| --- | --- | --- | --- | --- | --- | --- |
| Progress saved | ✅ in the browser (Supabase today, Dexie from ⏳ 3, 12) | ✖ | ✖ lost at power off | ✅ | ✖ | ✅ |
| Best result per level | ✅ fewest moves | ✖ | ✅ fewest pushes, moves and time | ? | ? | ✅ |
| Statistics | ◐ solved count and bests | ✖ | ◐ top 5 | ? | ? | ◐ |
| Accounts and sync | ✖ for now (Later, 15) | ✖ | ✖ | ? | ? | ◐ Play Games |
| Online leaderboards | ✖ for now (Later, 15) | ✖ | ✖ local, 2-player mode | ? | ? | ◐ Play Games |
| Hints | ✖ | ✖ | ✖ | ✅ | ? | ? |
| Built-in solver | ✖ | ✖ | ✖ | ✅ paid | ? | ✖ |
| Shared player-made levels | ✖ for now (Later, 15) | ✖ | ✖ | ✖ | ? | ? |
| Ads or purchases | ✖ on purpose | boxed | boxed | ads and purchases | ads | ads |

**On purpose:**
- **No ads and no purchases:** Sokobanko is a portfolio piece and a showcase for Spotcraft.
- **No hints or solver:** solving is NP-hard and PSPACE-complete, and good solvers (Rolling Stone, then Festival's FESS, the first to solve all 90 XSokoban problems) are research projects of their own. Deadlock warnings (17) are the useful, cheap part of what solvers do.

**Worth knowing:** being able to verify scores is what sets Sokoban apart, because a solution can be replayed. Sokobanko already stores every best as LURD, so verified leaderboards only need somewhere trusted to replay them. That's either Spotcraft's validators or a server route (Later, 15).

## Sources

- [Wikipedia: Sokoban](https://en.wikipedia.org/wiki/Sokoban): rules, history, the 1982 release (20 levels, breakable walls), *Sokoban 2*, complexity and solvers.
- [The Tandy *Soko-Ban* manual](https://archive.org/details/Soko-Ban_1988-09_Tandy_26-3161) (1988): 50 levels, one-step undo, counters, records, the two-player mode.
- [The Sokoban wiki](http://sokobano.de/wiki): puzzle format, LURD, RLE, the SOK format and variants.
- [David W. Skinner's sets](https://web.archive.org/web/2010/http://users.bentonrea.com/~sasquatch/sokoban/) and [Sneezingtiger's level list](http://sneezingtiger.com/sokoban/levels.html): licensing.
- The store listings linked above, and their reviews, for the apps.
