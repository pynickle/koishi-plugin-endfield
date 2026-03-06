# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-06 18:50 +08:00
**Commit:** 1838090
**Branch:** master

## OVERVIEW
Koishi TypeScript plugin for Endfield game workflows (auth, sign, note, gacha, stamina, subscriptions).
Source in `src/`; distributable output and declaration artifacts in `lib/`.

## STRUCTURE
```text
./
├── src/
│   ├── config/           # Koishi plugin schema/options
│   ├── constants/        # cron intervals, auth/sync constants, pool maps
│   ├── core/
│   │   ├── api/          # HTTP client + typed API modules
│   │   ├── commands/     # endfield.* command handlers
│   │   ├── render/       # HTML/card rendering for puppeteer
│   │   └── services/     # scheduled/background business logic
│   ├── utils/            # image/time/cqcode helpers
│   └── index.ts          # plugin entry (apply)
├── lib/                  # built output (.cjs/.d.ts/html/assets), generated
├── esbuild.config.js     # CJS bundle entry src/index.ts -> lib/index.cjs
└── .github/workflows/release.yml
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Plugin bootstrap / lifecycle | `src/index.ts` | registers DB, commands, cron, service init |
| Command registration map | `src/core/commands.ts` | central `ctx.command('endfield.*')` wiring |
| API contracts / request flow | `src/core/api/*` | `client.ts` + domain APIs + typed exports |
| Rendering templates | `src/core/render/*` | Bulma-based HTML, puppeteer output |
| Scheduled jobs | `src/core/scheduler.ts` + `src/core/services/*` | cron triggers and background checks |
| DB schema extensions | `src/core/database.ts` | `ctx.database.extend(...)` table definitions |
| Plugin options/i18n | `src/config/config.ts`, `src/locales/zh-CN.json` | config schema and user messages |

## CODE MAP
| Symbol | Type | Location | Refs | Role |
|--------|------|----------|------|------|
| `apply` | function | `src/index.ts` | entry-centric | plugin bootstrap |
| `registerCommands` | function | `src/core/commands.ts` | called by `apply` | command routing |
| `extendDatabase` | function | `src/core/database.ts` | called by `apply` | table schemas |
| `registerCronJobs` | function | `src/core/scheduler.ts` | called by `apply` | recurring tasks |
| `initializeServices` | function | `src/core/scheduler.ts` | called by `apply` | startup refresh/checks |
| `ApiClient` | class | `src/core/api/client.ts` | used by API modules | HTTP transport + headers |

## CONVENTIONS (PROJECT-SPECIFIC)
- Package manager: `pnpm` (CI and workflow assume pnpm).
- Build pipeline: `node esbuild.config.js && tsc --emitDeclarationOnly`.
- Module target: ESM source, CJS output (`lib/index.cjs`) for runtime distribution.
- Formatting: `oxfmt` (`singleQuote: true`, `tabWidth: 2`, import sort enabled, JSON ignored).
- Linting: `oxlint` with `correctness: off`; unicorn plugin partially relaxed for `src/**/*.ts`.
- TS config: `moduleResolution: bundler`, `jsxImportSource: @satorijs/element`, declarations only.

## ANTI-PATTERNS (THIS PROJECT)
- Do not edit `lib/` artifacts manually; regenerate via build.
- Do not add runtime entry outside `src/index.ts` plugin-`apply` flow.
- Do not bypass `src/core/commands.ts` for new command registration.
- Do not rely on test scripts/framework presence; repository currently has no automated test harness.
- Do not change release branch semantics casually (`release.yml` triggers on `master`).

## UNIQUE STYLES
- Command namespace is consistently `endfield.*`.
- Render layer outputs HTML strings first, then `puppeteer.render(html)`.
- API layer keeps domain wrappers thin and typed; shared transport in `ApiClient`.

## COMMANDS
```bash
pnpm install
pnpm run lint
pnpm run lint:fix
pnpm run fmt
pnpm run build
pnpm run release
```

## NOTES
- No `tests/` tree and no `test` script in `package.json`.
- CI release includes `npm audit signatures` before build/release.
- `pnpm-workspace.yaml` exists even though repository is single-package in practice.
