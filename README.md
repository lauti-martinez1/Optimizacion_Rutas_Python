# Optimización de Rutas — Gran Mendoza

Motor de optimización de rutas (VRP) para empresas de distribución del Gran
Mendoza, con una app web (PWA) para que un chofer arme, confirme y ejecute
su ruta del día. Prototipo del paper *"Optimización de rutas para empresas
de distribución: un enfoque computacional"* (CACIC 2026, Grupo 8).

## Stack

Backend: Python 3.12 + **uv** + FastAPI + Google OR-Tools (motor VRP) +
PostgreSQL (SQLAlchemy + Alembic) + OSRM (matriz de distancias/tiempos
reales). Frontend: React 19 + Vite + TypeScript + Tailwind CSS.

Arquitectura completa, convenciones y roadmap: [CLAUDE.md](CLAUDE.md).
Flujo de trabajo del equipo (ramas, PRs, CI): [CONTRIBUTING.md](CONTRIBUTING.md).

## Requisitos

- **[uv](https://docs.astral.sh/uv/getting-started/installation/)** (instala
  y gestiona Python por vos — no hace falta instalar Python 3.12 aparte).
- **Docker Desktop** (levanta Postgres local).
- **Node.js 22+** y npm (frontend).
- **Git**.

## Instalación

```bash
git clone https://github.com/lauti-martinez1/Optimizacion_Rutas_Python.git
cd Optimizacion_Rutas_Python
```

### 1. Backend

```bash
uv sync                                  # instala Python 3.12 (si falta) + dependencias
cp .env.example .env                     # reemplazá JWT_SECRET_KEY y POSTGRES_PASSWORD por los tuyos
docker compose up -d postgres            # levanta Postgres en background
uv run alembic upgrade head              # crea las tablas
uv run pytest                            # opcional: confirma que todo compila y conecta bien
uv run uvicorn main:app --reload         # http://localhost:8000 (docs en /docs)
```

`JWT_SECRET_KEY` no tiene default (la app no arranca sin uno propio) —
generá el tuyo con:

```bash
uv run python -c "import secrets; print(secrets.token_urlsafe(64))"
```

### 2. Frontend

En otra terminal, con el backend ya corriendo:

```bash
cd frontend
npm install
cp .env.example .env                     # ya viene con el valor correcto, no hace falta tocarlo
npm run dev                              # http://localhost:5174
```

El puerto del frontend está fijo en `5174` (`vite.config.ts`, `strictPort: true`)
porque el backend solo acepta pedidos desde ese origen (`FRONTEND_URL` en tu
`.env` de la raíz) — si algo más ya está usando ese puerto, Vite va a fallar
al arrancar en vez de saltar a otro puerto en silencio.

## Verificar que quedó todo andando

1. Abrí `http://localhost:5174/registro` y creá una cuenta de chofer independiente.
2. Deberías caer en la pantalla de Inicio, ya logueado.
3. `http://localhost:8000/docs` tiene que responder con la documentación interactiva de la API.

Si algo falla, `uv run pytest` y `cd frontend && npx tsc -b && npm run lint`
corren exactamente lo mismo que el CI (`.github/workflows/ci.yml`) — sirven
para aislar si el problema es de setup local o de código.

## Notas

- El `.env` de cada uno es local y **nunca se commitea** (está en `.gitignore`).
- OSRM (el servicio que calcula distancias/tiempos reales) apunta hoy al
  servidor demo público (`router.project-osrm.org`) — tiene rate-limiting,
  no hace falta instalar nada aparte para desarrollo local.
- Antes de abrir un PR, revisá los checks de [CONTRIBUTING.md](CONTRIBUTING.md#antes-de-abrir-un-pr).
