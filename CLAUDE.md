# CLAUDE.md

Guía de arquitectura, stack y convenciones para trabajar en este repo. Léelo antes de tocar código.

## 1. Qué es este proyecto

Motor de optimización de rutas (VRP) para empresas de distribución del Gran Mendoza. Es el prototipo de software del paper *"Optimización de rutas para empresas de distribución: un enfoque computacional"* (CACIC 2026, Grupo 8 — Martinez, Sallenave, Quevedo, Fermentini, Méndez-Garabetti, Universidad del Aconcagua).

La idea central del paper: no reinventar el algoritmo de optimización, sino integrar librerías de alto rendimiento (Google OR-Tools) con datos de tránsito reales (OSRM) detrás de una API backend desacoplada, y evaluar esa integración contra las restricciones operativas y la topología real del Gran Mendoza. El aporte del proyecto no es el algoritmo en sí, sino su adaptación y validación empírica a ese contexto.

Resuelve dos variantes del problema:
- **CVRP** (Capacitated VRP): rutas respetando la capacidad de carga de cada vehículo.
- **VRPTW** (VRP with Time Windows): CVRP + ventanas horarias por cliente y depósito.

**Estado actual**: prototipo funcional (API + solver + benchmarks), sin gestión de dependencias, tests, linting, configuración ni Docker todavía. Este documento describe tanto lo que ya existe como el roadmap para llevarlo al diseño objetivo. No asumas que las secciones 3, 6 y 7 ya están implementadas — están marcadas explícitamente como objetivo.

## 2. Stack tecnológico

| Capa | Tecnología | Notas |
|---|---|---|
| Lenguaje | Python 3.12 | |
| Gestión de entorno/dependencias | **uv** | `pyproject.toml` + `uv.lock`. Reemplaza pip/venv sueltos. |
| API | **FastAPI** + Pydantic v2 | Único framework web del proyecto. |
| Servidor ASGI | uvicorn | |
| Optimización (core) | **Google OR-Tools** (`ortools.constraint_solver`) | Motor principal de ruteo. |
| Comparación empírica | **PyVRP** | Heurística constructiva de referencia para medir gap contra OR-Tools (pedido por el paper, Sección 4.3). |
| Datos de tránsito | **OSRM** (self-hosted vía Docker, perfil `driving`) | Matriz de distancias (metros) y tiempos (segundos) reales, no euclidianas. |
| Contenedores | Docker + docker-compose | Levanta OSRM (con extracto de Mendoza/Argentina) y, opcionalmente, la API. |
| Config | **pydantic-settings** + `.env` | Nada de URLs o parámetros hardcodeados. |
| Tests | **pytest** | Unit tests de solver/cliente OSRM + al menos un test de integración de la API. |
| Lint/formato | **ruff** | Lint y formateo en una sola herramienta, config en `pyproject.toml`. |

No uses otras librerías de optimización, otro framework web, ni otro gestor de paquetes sin discutirlo antes — el stack ya está decidido.

## 3. Arquitectura objetivo

Estructura de directorios a la que el proyecto debe converger (ver roadmap en §8 para el orden de migración; hoy varias de estas piezas todavía no existen):

```
main.py                       # entrypoint: crea la app FastAPI, monta routers
core/
  config.py                   # Settings (pydantic-settings): OSRM_BASE_URL, tiempo límite del solver, etc.
api/
  schemas.py                  # Cliente, Deposito, Vehiculo, VentanaHoraria, Coordenada, PeticionRutas
  routes.py                   # POST /api/v1/optimizar y futuros endpoints
routing/
  solver.py                   # resolver_ruteo(): el modelo OR-Tools, generalizado para reuso en benchmarks
services/
  osrm_client.py               # obtener_matriz_osrm(): URL desde Settings, no hardcodeada
scripts/
  benchmark_solomon.py         # benchmark VRPTW, reusa routing/solver.py
  benchmark_uchoa.py           # benchmark CVRP, reusa routing/solver.py
  compare_pyvrp.py             # comparación OR-Tools vs PyVRP (planificado)
  generar_dataset_mendoza.py   # genera el dataset sintético georreferenciado (planificado)
data/
  solomon/                     # instancias VRPTW (Solomon), ya existe
  uchoa/                       # instancias CVRP (Uchoa et al.), ya existe
  mendoza/                     # dataset sintético del Gran Mendoza (planificado)
tests/
  test_solver.py
  test_osrm_client.py
  test_api.py
docker-compose.yml             # servicio osrm (+ opcionalmente api)
pyproject.toml
uv.lock
.env.example
```

**Estado real hoy**: `main.py` (raíz) contiene todos los schemas Pydantic y el endpoint juntos; `routing/solver.py` y `services/osrm_client.py` ya existen tal cual se describen arriba. No hay `core/`, `api/`, `tests/`, `pyproject.toml`, `docker-compose.yml` ni `.env` todavía.

## 4. Convenciones de código

- **Idioma: español en todo.** Nombres de funciones, variables, campos de modelos Pydantic, claves de los JSON de request/response, y comentarios van en español (ej. `resolver_ruteo`, `matriz_distancias`, `carga_total`, `demanda_carga`). Es el estado actual del código y se mantiene así — no migres a inglés ni mezcles.
- **snake_case** para funciones/variables, **PascalCase** para modelos Pydantic.
- **Type hints completos** en código nuevo: preferí `list[list[int]]` / `List[int]` en vez de `list` a secas (el código viejo usa hints laxos; no hace falta reescribirlo retroactivamente, pero el código nuevo sí debe llevarlos).
- **Comentarios**: solo cuando expliquen un *por qué* no obvio (una convención OSRM rara, un valor mágico, una restricción del solver). No documentes *qué* hace el código si el nombre ya lo dice. Nada de docstrings largos — una línea si aporta.
- **ruff** es la única herramienta de lint/formato una vez configurada (§8). No introduzcas black/flake8/isort en paralelo.
- Los benchmarks y el solver de producción deben compartir la misma lógica de modelado OR-Tools (ver gap en §9) — no dupliques el armado del `RoutingModel` en un script nuevo si `routing/solver.py` ya lo resuelve.

## 5. Dominio del problema (semántica ya establecida en el código)

Para no reinventar convenciones al tocar `routing/solver.py` o `services/osrm_client.py`:

- **Nodo 0 = depósito**, siempre. El resto de los índices son clientes en el orden en que llegan en `clientes`.
- OSRM espera coordenadas como `"longitud,latitud"` (al revés que la convención `lat,lon` usada en los schemas Pydantic) — ver `services/osrm_client.py`.
- La **matriz de distancias** que devuelve OSRM está en **metros**; es la que se usa directamente como costo de arco en OR-Tools (`SetArcCostEvaluatorOfAllVehicles`).
- La **matriz de tiempos** que devuelve OSRM está en **segundos**; el solver la convierte a **minutos** para la dimensión de tiempo.
- **Ventanas horarias** (`VentanaHoraria.inicio` / `.fin`) se expresan en **minuto del día** (ej. 480 = 8:00 AM), no en formato hora.
- Dimensión `'Capacidad'`: sin holgura (slack=0), capacidad por vehículo tomada de `Vehiculo.capacidad`.
- Dimensión `'Tiempo'` (solo VRPTW): holgura de 120 min (tiempo máximo de espera si el vehículo llega antes de que abra el cliente), tope de 1440 min por vehículo (24 hs). El depósito le impone su ventana horaria a la salida y el regreso de cada vehículo.
- Búsqueda: `PATH_CHEAPEST_ARC` como estrategia inicial + `GUIDED_LOCAL_SEARCH` como metaheurística, con `time_limit.seconds` fijo (hoy 5s en el solver de producción, 60s en los benchmarks — ver §9, debería ser configurable en vez de estar duplicado con valores distintos).
- Si el solver no encuentra solución factible, `resolver_ruteo` devuelve `{"estado": "Fallo", "mensaje": ...}` en vez de tirar una excepción — el endpoint lo traduce a HTTP 400.

## 6. Configuración (objetivo, no implementado aún)

Todo parámetro que hoy está hardcodeado debe migrar a `core/config.py` (una clase `Settings` de `pydantic-settings`, leída desde `.env`), con un `.env.example` versionado documentando cada variable. Como mínimo:

- `OSRM_BASE_URL` — hoy hardcodeado en `services/osrm_client.py` como `http://router.project-osrm.org`. Debe apuntar a la instancia local levantada por `docker-compose.yml` en desarrollo/benchmarking.
- `SOLVER_TIME_LIMIT_SEGUNDOS` — hoy hardcodeado en 5 dentro de `routing/solver.py` (y en 60 en cada script de benchmark, con su propio valor). Un único parámetro configurable, con override explícito en los benchmarks si necesitan más tiempo.

No hardcodees URLs, timeouts ni límites nuevos — si es un valor que alguien podría querer cambiar sin tocar código, va en `Settings`.

## 7. Cómo correr el proyecto (flujo objetivo)

```bash
uv sync                                  # instala dependencias desde pyproject.toml/uv.lock
docker compose up -d osrm                # levanta OSRM local con el extracto de Mendoza
uv run uvicorn main:app --reload         # levanta la API en desarrollo
uv run pytest                            # corre la suite de tests
uv run ruff check . && uv run ruff format .   # lint + formato
uv run python scripts/benchmark_solomon.py    # benchmark VRPTW
uv run python scripts/benchmark_uchoa.py      # benchmark CVRP
uv run python scripts/compare_pyvrp.py        # comparación OR-Tools vs PyVRP
```

Hoy (antes de la migración a uv/Docker) el proyecto se corre con un venv manual y `python main.py`/`uvicorn main:app` desde la raíz del repo, con `python` apuntando a un intérprete que tenga `fastapi`, `pydantic`, `ortools` y `requests` instalados a mano.

## 8. Roadmap accionable

Basado en las secciones 4.3 y 5 del paper (dataset, validación, métricas empíricas) más la deuda técnica actual. Orden sugerido — cada ítem es una sesión de código razonable:

1. Migrar a `uv`: crear `pyproject.toml`, generar `uv.lock`, fijar Python 3.12.
2. Reestructurar `main.py`: separar en `api/schemas.py`, `api/routes.py`, `core/config.py`; `main.py` queda solo como entrypoint. `routing/` y `services/` se mantienen donde están.
3. Introducir `core/config.py` con `pydantic-settings` + `.env.example` (ver §6).
4. Self-hostear OSRM: `docker-compose.yml` con el servicio OSRM usando un extracto `.osm.pbf` de Mendoza/Argentina preprocesado (`osrm-extract` + `osrm-partition` + `osrm-customize`), apuntado desde `OSRM_BASE_URL`.
5. Generalizar `routing/solver.py` para que reciba matrices de cualquier origen (OSRM real o distancias euclidianas de benchmarks) sin duplicar el armado del `RoutingModel`; migrar `scripts/benchmark_solomon.py` y `scripts/benchmark_uchoa.py` para que lo importen en vez de reimplementarlo.
6. Agregar `pytest`: tests unitarios de `routing/solver.py` (casos CVRP/VRPTW con resultado conocido), `services/osrm_client.py` (mockeando `requests`), y un test de integración del endpoint `/api/v1/optimizar`.
7. Adoptar `ruff` (lint + format), configurado en `pyproject.toml`.
8. Agregar `pyvrp` como dependencia y `scripts/compare_pyvrp.py`: correr las mismas instancias (Solomon/Uchoa/Mendoza) contra OR-Tools y PyVRP, comparando gap y tiempo de cómputo.
9. Generar el dataset sintético georreferenciado del Gran Mendoza (`scripts/generar_dataset_mendoza.py`): 30-80 nodos con coordenadas dentro de un bounding box real del Gran Mendoza (validadas contra la red vial vía OSRM), demandas y ventanas horarias simuladas de forma realista (horario comercial local, posible corte tipo siesta).
10. Recolectar métricas empíricas exhaustivas sobre las tres fuentes de datos (Uchoa, Solomon/Homberger, Mendoza sintético): distancia total recorrida, tiempo de ejecución, número de vehículos usados, cumplimiento de ventanas horarias, y gap % vs. Best Known Solutions — documentando el hardware usado en los ensayos (pedido explícito de la Sección 5 del paper).

## 9. Gaps conocidos (no "arreglar" por sorpresa sin avisar)

- `scripts/benchmark_solomon.py` y `scripts/benchmark_uchoa.py` **duplican** la lógica de modelado de `routing/solver.py` con parámetros de búsqueda propios (estrategias iniciales distintas, `time_limit` de 60s vs 5s, escalado de distancias por separado). Se resuelve en el ítem 5 del roadmap — no es un bug, es deuda técnica ya identificada.
- `services/osrm_client.py` apunta hoy al **servidor demo público** de OSRM (`router.project-osrm.org`), que tiene rate-limiting y no está pensado para uso intensivo/producción. Se reemplaza por una instancia self-hosted en el ítem 4.
- No hay dataset del Gran Mendoza todavía — el título de la API ("Gran Mendoza") es aspiracional hasta el ítem 9 del roadmap.
- No hay `response_model` tipado en el endpoint (devuelve un `dict` plano) ni validación declarativa de las reglas cruzadas VRPTW (hoy se valida a mano dentro del handler). No es prioritario resolverlo fuera del roadmap salvo que se decida explícitamente.
