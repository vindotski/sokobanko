---
title: Product
description: The player's loop and the team's, what each stage has and lacks, the bar for calling Sokobanko a product, and the metrics that tell us how it's going.
---

# Product

Sokobanko works: 159 levels, results checked by the server, undo and redo, keyboard and touch, sound. What it lacks is the part a stranger judges in their first minute, and the part that brings them back. This page names that part. The work to build it is the active phase of the [roadmap](roadmap.md).

The audience is real players, not just visitors to a portfolio piece.

## The loop

The player's loop is the one every good puzzle app has. The team's loop runs once per release.

```
 Discover → First win → Mastery → Daily return → Share ─┐
    ▲                                                   │
    └───────────────────────────────────────────────────┘
          Measure → Learn → Ship (the team's loop, each release)
```

- **Discover:** someone sees a link and it looks real.
- **First win:** they solve a level in under two minutes, without reading anything.
- **Mastery:** they want to do it in fewer moves.
- **Daily return:** there's a new puzzle today, and a streak to keep.
- **Share:** they post their result, without spoiling the puzzle, and someone else discovers the game.
- **Measure → Learn → Ship:** we read the numbers below, decide what to change, and release it.

## The stages

| Stage | What the player feels | What's there | What's missing |
| --- | --- | --- | --- |
| **Discover** | A link preview looks real, and the tab has an icon | The landing page | A favicon and app icons, Open Graph and Twitter cards, a title and description per page, robots.txt and a sitemap |
| **First win** | Solved something in under two minutes, without reading docs | The Basics collection, the FAQ | A one-time controls hint on the first level, and "Next level" right after the win |
| **Mastery** | "I can do better than that" | Best moves per level | Par for each level, 1–3 stars, stars on level select and the profile |
| **Daily return** | "Today's puzzle, keep my streak" | — | A daily puzzle, a streak, a countdown to tomorrow's |
| **Share** | Bragging that spoils nothing | — | Share text like `Sokobanko #42 ⭐⭐⭐ 31 moves 🔥5`, with a link |
| **Measure** | — | Umami page views, added by Spotcraft | Custom events and a funnel |
| **Trust** | "Who runs this, and what's collected?" | An email address in the FAQ | A privacy page that links `/_spotcraft/privacy`, and a footer with About, Privacy, Feedback and the version |

## The bar

Sokobanko is a product when all of these are true on https://sokobanko.app:

1. A link pasted into iMessage, Slack or X shows a title, a description and an image. The tab shows an icon.
2. A new visitor reaches their first solve without reading anything, on a phone and on a laptop.
3. Every level shows stars, and the profile shows progress.
4. There's a new daily puzzle each day. The streak survives a reload, and works on a second device that shares the same guest cookie.
5. Sharing gives a spoiler-free result with a link.
6. A privacy page exists and is truthful. Feedback is one click away.
7. Spotcraft's dashboard shows visitors, and Umami has the custom events. The funnel below can be read off it.
8. It's released as v0.4.0, with a CHANGELOG entry and a signed tag.

## Measuring

Spotcraft injects the Umami script, which counts page views. The game adds its own events through one `track(event, data)` helper. It does nothing when the script is missing, because analytics are off or the visitor opted out. No event carries an id: that's Spotcraft's rule.

| Event | When | Data |
| --- | --- | --- |
| `level_start` | A level opens | — |
| `level_solve` | A level is solved | `collection`, `moves`, `stars` |
| `level_restart` | The player restarts a level | — |
| `daily_solve` | Today's daily puzzle is solved | `stars`, `streak` |
| `share` | The player shares a result | — |
| `hint_dismissed` | The first-run controls hint is closed | — |

### The funnel

| Step | Where it comes from |
| --- | --- |
| Landing | Umami's page views of `/` |
| Started a level | `level_start` |
| First solve | `level_solve` |
| Came back the next day | Umami's returning visitors, by its own anonymous visitor count |
| Shared | `share` |

### The metrics

These are baselines, not targets. We read them two weeks after the events ship, and set targets only then.

| Metric | What it is | How it's read |
| --- | --- | --- |
| **Activation** | The share of visitors who solve a level | Visitors with a `level_solve`, over all visitors |
| **D1 and D7 return** | The share of visitors who come back one day, and seven days, later | Umami's retention report |
| **Daily completion rate** | The share of daily-puzzle visitors who solve it | Visitors with a `daily_solve`, over visitors to `/daily` |
| **Share rate** | How often a solve is shared | `share` events, over `level_solve` and `daily_solve` events |

`level_restart` and `hint_dismissed` aren't metrics. They help explain them: many restarts on one level mean it's too hard for where it sits, and a hint dismissed at once means the player didn't need it.

## Out of scope

Real accounts (waiting on Spotcraft), leaderboards, a level editor and player-made levels, offline play, translations, and tap to walk. The [roadmap](roadmap.md) keeps them for later.
