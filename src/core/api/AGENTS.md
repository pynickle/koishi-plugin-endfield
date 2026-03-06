# API MODULE KNOWLEDGE BASE

**Scope:** `src/core/api/`

## OVERVIEW

Thin typed wrappers over Endfield HTTP endpoints with shared transport in `client.ts` and barrel export in `index.ts`.

## STRUCTURE

```text
src/core/api/
├── client.ts         # axios instance, headers, generic get/post
├── auth.ts
├── sign.ts
├── stamina.ts
├── character.ts
├── gacha.ts
├── announcement.ts
└── index.ts          # re-export all APIs + response types
```

## WHERE TO LOOK

| Task                             | Location                   | Notes                                     |
| -------------------------------- | -------------------------- | ----------------------------------------- |
| Shared header/auth behavior      | `client.ts`                | `X-API-KEY`, optional `X-Framework-Token` |
| Endpoint path changes            | domain `*.ts` file         | each module maps one domain               |
| Type surface exported to callers | `index.ts`                 | command/services import from barrel       |
| Base URL/API key plumbing        | `createApiClient` + caller | `Config` passed at construction           |

## LOCAL CONVENTIONS

- Keep wrappers thin: call `client.get/post`, return typed `ApiResponse<T>` data.
- Endpoint modules define domain types beside request methods.
- Cross-module transport logic belongs only in `client.ts`.
- Use `postWithoutAuth` only for endpoints that explicitly do not require API key.

## ANTI-PATTERNS (API)

- Do not instantiate raw axios clients in domain files.
- Do not duplicate header construction logic outside `client.ts`.
- Do not leak untyped `any` payloads when a stable schema can be declared.
- Do not couple API modules to Koishi `Context`/`Session` types.

## CHANGE CHECKLIST

- New endpoint file is exported from `index.ts`.
- Auth requirements (API key/framework token) are explicit and correct.
- Added types reflect actual response shape and optional fields.
- No command/business logic introduced into API layer.
