# COMMANDS MODULE KNOWLEDGE BASE

**Scope:** `src/core/commands/`

## OVERVIEW

Implements individual `endfield.*` command handlers; each file maps one user-facing command family.

## STRUCTURE

```text
src/core/commands/
├── auth.ts
├── sign.ts
├── char.ts
├── note.ts
├── gacha.ts
├── stamina.ts
├── subscribe.ts
├── announcement.ts
├── qr.ts
└── setweaponup.ts
```

## WHERE TO LOOK

| Task                          | Location                                       | Notes                                          |
| ----------------------------- | ---------------------------------------------- | ---------------------------------------------- |
| Command fan-in wiring         | `../commands.ts`                               | all handlers imported and registered           |
| Subscription command behavior | `subscribe.ts`                                 | regular + stamina subscription variants        |
| Card/query command behavior   | `char.ts`, `note.ts`, `gacha.ts`, `stamina.ts` | API + render orchestration                     |
| Admin-only command behavior   | `announcement.ts`, `setweaponup.ts`            | gated upstream with authority in `commands.ts` |
| Login/bind flows              | `auth.ts`, `qr.ts`                             | binding/session related command entry          |

## LOCAL CONVENTIONS

- Export style: `export async function endfieldXxx(...)` per file.
- Signature pattern: `(ctx: Context, session: Session, cfg: Config, ...)`.
- User-facing errors: return i18n key via `session.text(...)`, not raw exception text.
- Persistence access is direct through `ctx.database` using table keys from root schema.
- Time/duration validation relies on utility helpers/regex before database write.

## ANTI-PATTERNS (COMMANDS)

- Do not register new commands inside these files; registration stays centralized in `src/core/commands.ts`.
- Do not hardcode untranslated user messages; keep response keys in locale files.
- Do not bypass binding checks for commands that require `endfield_bindings_v3`.
- Do not duplicate authority policy in handler logic when already enforced at registration.

## CHANGE CHECKLIST

- Added/changed command has corresponding registration in `src/core/commands.ts`.
- Parameter parsing and validation path is explicit (`time`, `duration`, flags).
- All DB writes include timestamp updates where applicable.
- Returned messages are locale keys under the same command namespace.
