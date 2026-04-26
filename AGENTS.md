# AGENTS.md

## Overview

Demo veterinary clinic app: Spring Boot REST API (`server/`) + SvelteKit frontend (`client/`). Two co-located apps, not a monorepo with shared packages.

## Story Workflow

If the user specifies a story located in `.opencode/refined/`, treat that story file as the source of truth for scope and acceptance criteria.

When the requested story has been implemented, validated with the appropriate project checks, and explicitly accepted by the user:

1. Move the story file from `.opencode/refined/` to `.opencode/completed/`.
2. Add a corresponding entry to `.opencode/CHANGELOG.md` with the date, feature title, and a short summary of what was delivered.

Do not move the story or update the changelog before the user has accepted the completed work.

## Tool Versions (managed by `mise`)

```
mise install   # provisions all tools
```

| Tool | Version |
|------|---------|
| Java | Temurin 25 |
| Bun  | 1.3.0 |
| Node | 22.20.0 |

## Server (`server/` — Gradle Kotlin DSL)

```bash
./gradlew bootRun           # start dev server (port 8080)
./gradlew build             # compile + test + quality checks
./gradlew test              # run tests only
./gradlew spotlessApply     # auto-format Java code
./gradlew check             # lint (Checkstyle, PMD, SpotBugs, Codenarc)
```

Single test:
```bash
./gradlew test --tests "dev.ilionx.workshop.api.owner.controller.OwnerControllerTest"
./gradlew test --tests "dev.ilionx.workshop.api.owner.controller.OwnerControllerTest.methodName"
```

## Client (`client/` — Bun/Vite/SvelteKit)

```bash
bun install         # install deps
bun run dev         # dev server
bun run build       # production build
bun run check       # TypeScript type-check (required after codegen)
bun run sync:api    # full OpenAPI codegen pipeline (requires backend running)
bun run generate:api  # generate TS types from existing server/openapi.json
```

## Critical Quirks

**Spotless is a compile-time gate.** `spotlessApply` runs as a dependency of every `JavaCompile` task. Code that is not Spotless-formatted will not compile. Always run `./gradlew spotlessApply` before committing Java changes.

**`-Werror` is active.** All Java warnings are errors (`-Xlint:all` minus `-serial`, `-processing`, `-this-escape`). Any deprecation or lint warning breaks the build.

**`src/lib/types/api.d.ts` is auto-generated — never edit manually.** Regenerate with:
1. Start backend: `./gradlew bootRun` (from `server/`)
2. Run: `bun run sync:api` (from `client/`) — downloads spec, regenerates types
3. Verify: `bun run check`

Or if the backend is already running, just run `bun run sync:api`.

## Architecture Notes

- All API paths go through servlet context `/api`. Production URLs: `http://localhost:8080/api/v1/...`
- **Test profile strips context path** (`server.servlet.context-path: ""`), so MockMvc requests use bare paths like `/v1/owners` — not `/api/v1/owners`.
- **Global vs nested endpoints:** Pet and Visit controllers are split — e.g., `PetController` handles `/v1/owners/{ownerId}/pets/{petId}` and `PetGlobalController` handles `/v1/pets/{id}`. All path constants live in `Paths.java`.
- **MapStruct** generates DTO ↔ entity mappers at compile time. Mapper implementations are in `target/` — don't create manual mappers. On a fresh clone, run `./gradlew build` once to generate them before the IDE resolves references.
- **Liquibase contexts:**
  - `prd` = schema only
  - `tst` = schema + seed data (used in dev and test profiles)
  - Tests use H2 in-memory DB; no external DB required.

## Testing Setup

No external services needed. All server tests use H2 in-memory.

- `UnitTest` — `@ExtendWith(MockitoExtension.class)`, no Spring context. Provides static fixture factories (`aValidOwner()`, `aValidPet()`, etc.). Dependencies are mocked manually with `mock(XxxRepository.class)` and services are instantiated with `new XxxService(mock)` — no `@InjectMocks`.
- `IntegrationTest` — `@SpringBootTest(webEnvironment = RANDOM_PORT)`, `@ActiveProfiles("test")`, provides `MockMvc` + all repositories. Also provides persistence factories (`aSavedOwner()`, `aSavedPet(owner)`, etc.) and request factories (`aCreateOwnerRequest()`, etc.).

**Seed data is fixture-stable.** `IntegrationTest.cleanDatabase()` runs `@BeforeEach`/`@AfterEach` and deletes all visits/pets/owners unconditionally, then deletes vets/petTypes/specialties only where `id > threshold` (6, 6, 3). Seed records at or below those IDs are always preserved — safe to hardcode in tests (e.g. pet type ID 1 = "Cat").

**Test assertions:** Hamcrest (`assertThat`/`is`/`equalTo`/`hasSize`) — not AssertJ. Error response bodies are deserialised with `fromJson(content, ErrorResponseResource.class)` (jframe utility, not Jackson directly). Request bodies are serialised with `toJson(request)` from the same library.

**No `@Valid` on any controller `@RequestBody`.** Bean validation is not wired up — this is an intentional workshop gap. Input reaches the service unchecked; only DB `NOT NULL` constraints enforce anything.

**Test naming:** `@DisplayName("Should ... when ...")` on every class and method. Method names mirror the display name in camelCase.

No frontend tests exist.

## Environment Variables

| Variable | Default | Component |
|----------|---------|-----------|
| `SPRING_PROFILES_ACTIVE` | `dev` | Server |
| `SERVER_PORT` | `8080` | Server |
| `CORS_ALLOWED_ORIGIN` | `http://localhost:*` | Server |
| `VITE_SERVER_BASE_URL` | `http://localhost:8080` | Client |
| `VITE_API_USERNAME` | `user` | Client |
| `VITE_API_PASSWORD` | `password` | Client |

Dev Basic Auth credentials: `user` / `password` (hardcoded in `application-dev.yml`).

## Key File Locations

| What | Where |
|------|-------|
| URL path constants | `server/src/main/java/dev/ilionx/workshop/api/Paths.java` |
| Quality tool configs | `server/src/quality/config/` |
| Spotless formatter config | `server/src/quality/config/spotless/styling.xml` |
| Liquibase changesets | `server/src/main/resources/db/changelog/changesets/` |
| Generated API types | `client/src/lib/types/api.d.ts` |
| Friendly type re-exports | `client/src/lib/api/models.ts` |
| API client setup | `client/src/lib/api/client.ts` |
| OpenAPI codegen script | `scripts/openapi-sync.sh` |
