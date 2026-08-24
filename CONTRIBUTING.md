# Cómo contribuir

Somos 4 devs trabajando en este repo. Usamos **GitHub Flow**: ramas cortas por feature, Pull Request, review, merge a `main`. Nada de ramas `develop`/`release` — para un equipo de este tamaño solo agregan ceremonia.

## Reglas

1. **Nunca pushear directo a `main`.** Todo cambio entra por PR, incluso los chiquitos.
2. **Ramas cortas y con nombre descriptivo**: `feature/dashboard-empresa`, `fix/atomicidad-registro`, `chore/actualizar-deps`. Si una rama vive más de unos días, probablemente haya que partirla.
3. **Al menos 1 review antes de mergear.** El CI (ver abajo) tiene que estar en verde.
4. **Mensajes de commit claros**, explicando el *por qué* del cambio, no solo el qué. No hace falta Conventional Commits estricto, pero sí que se entienda sin abrir el diff.
5. **PRs chicos y enfocados.** Un PR = un cambio lógico. Más fácil de revisar, más fácil de revertir si algo sale mal.
6. **`.env` nunca se commitea** — cada uno tiene el suyo local a partir de `.env.example` / `frontend/.env.example`.

## Antes de abrir un PR

Backend:

```bash
uv run ruff check .
uv run ruff format --check .
uv run pytest
```

Frontend:

```bash
cd frontend
npx tsc -b
npm run lint
```

El CI (`.github/workflows/ci.yml`) corre exactamente esto mismo en cada PR contra `main` — si falla localmente, va a fallar en GitHub. Correrlo antes ahorra el ida y vuelta.

## Migraciones de base de datos

Si tocás `db/modelos.py`, generá la migración y **revisala a mano** antes de commitearla (Alembic no siempre detecta bien cambios de tipo/constraint):

```bash
uv run alembic revision --autogenerate -m "descripción del cambio"
uv run alembic upgrade head   # aplicarla localmente y confirmar que anda
```

## Protección de rama (una sola vez, la configura quien tenga admin del repo)

En GitHub → Settings → Branches → Branch protection rules → `main`:
- Require a pull request before merging (mínimo 1 approval)
- Require status checks to pass before merging → tildar los jobs `backend` y `frontend` del workflow CI
- Require branches to be up to date before merging

## Convenciones de código

Ver [CLAUDE.md](CLAUDE.md) — stack, arquitectura, y las convenciones de naming (todo en español, snake_case/PascalCase, etc.) que aplican tanto al backend como al frontend.
