# RENDER MODULE KNOWLEDGE BASE

**Scope:** `src/core/render/`

## OVERVIEW

Builds HTML templates/cards for Endfield features and delegates final image generation to Koishi puppeteer.

## STRUCTURE

```text
src/core/render/
├── note.ts            # operator list page/card
├── gacha.ts           # gacha statistics/detail page
├── char.ts            # character card
├── detailed-char.ts   # expanded character detail card
└── announcement.ts    # announcement render
```

## WHERE TO LOOK

| Task                    | Location                              | Notes                          |
| ----------------------- | ------------------------------------- | ------------------------------ |
| HTML generation pattern | each `generate*` function             | returns full HTML string       |
| Final rendering step    | each `render*` function               | calls `puppeteer.render(html)` |
| Asset caching strategy  | `note.ts` + `../../utils/image-cache` | pre-cache avatar/image URLs    |
| Styling baseline        | inline `<style>` + Bulma CDN usage    | no separate CSS bundle         |

## LOCAL CONVENTIONS

- Separate `generate...()` (HTML) from `render...()` (puppeteer call).
- Prefer deterministic ordering for lists before rendering (e.g., rarity/level sorting).
- Keep template strings self-contained; dependencies are plain data + utility helpers.
- Use eager loading and explicit width/height where templates already do so.

## ANTI-PATTERNS (RENDER)

- Do not invoke puppeteer inside data processing branches; do it once after HTML assembly.
- Do not move shared image URL cleanup/caching logic into unrelated modules.
- Do not couple render files with database access; inputs should already be prepared.
- Do not introduce framework-heavy runtime templating; current style is pure string template + Bulma.

## CHANGE CHECKLIST

- New/changed card keeps `generate` + `render` separation intact.
- Output HTML remains standalone and valid (doctype/head/body).
- Image-heavy templates continue using cache helpers where possible.
- Any added labels/messages remain consistent with existing Chinese UI text style.
