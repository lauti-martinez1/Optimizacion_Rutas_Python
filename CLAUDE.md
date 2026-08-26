# CLAUDE.md

Guía de arquitectura, stack y convenciones para trabajar en este repo. Léelo antes de tocar código.

## 1. Qué es este proyecto

Motor de optimización de rutas (VRP) para empresas de distribución del Gran Mendoza. Es el prototipo de software del paper *"Optimización de rutas para empresas de distribución: un enfoque computacional"* (CACIC 2026, Grupo 8 — Martinez, Sallenave, Quevedo, Fermentini, Méndez-Garabetti, Universidad del Aconcagua).

La idea central del paper: no reinventar el algoritmo de optimización, sino integrar librerías de alto rendimiento (Google OR-Tools) con datos de tránsito reales (OSRM) detrás de una API backend desacoplada, y evaluar esa integración contra las restricciones operativas y la topología real del Gran Mendoza. El aporte del proyecto no es el algoritmo en sí, sino su adaptación y validación empírica a ese contexto.

Resuelve dos variantes del problema:
- **CVRP** (Capacitated VRP): rutas respetando la capacidad de carga de cada vehículo.
- **VRPTW** (VRP with Time Windows): CVRP + ventanas horarias por cliente y depósito.

**Evolución del alcance**: además del motor VRP (el aporte académico del paper), el proyecto está creciendo hacia una app web PWA real para choferes de reparto — con cuentas de usuario, empresas de distribución que gestionan flotas de choferes, y (a futuro) planes de suscripción. El motor VRP y su validación empírica siguen siendo el núcleo del paper; la capa de cuentas/auth/frontend es la plataforma que lo va a poner en manos de usuarios reales. Ver §10 para el estado de esta capa.

**Estado actual**: el motor VRP (API + solver + benchmarks) es un prototipo funcional. La capa de fundaciones (`uv`, `core/config.py`, Docker para Postgres, `pytest`) y el sistema de autenticación (backend + frontend) ya están implementados — ver §3 y §10. Sigue pendiente: self-hostear OSRM, generalizar el solver de benchmarks (ítem 5 del roadmap), y el dataset del Gran Mendoza (ítem 9).

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
| Tests | **pytest** | Suite de auth (`tests/test_auth.py`) contra una DB Postgres de test separada. Faltan tests de `routing/solver.py` y `services/osrm_client.py` (roadmap ítem 6, parcial). |
| Lint/formato | **ruff** | Config en `pyproject.toml`. `alembic/versions/` excluido (migraciones autogeneradas). |
| Base de datos | **PostgreSQL** (vía Docker) | Cuentas de usuario, empresas, códigos de invitación. El motor VRP en sí sigue siendo stateless. |
| ORM / migraciones | **SQLAlchemy 2.0** (sync) + **Alembic** | Sync, no async — consistente con el resto del backend (OR-Tools/OSRM ya son sync). |
| Auth | **passlib[bcrypt]** + **python-jose** | Hash de contraseñas + JWT firmado en cookie httpOnly (no localStorage). |
| Frontend | **React 19 + Vite + TypeScript** | Monorepo en `frontend/`. |
| Estado global (frontend) | **Zustand** | Sin `persist` — la sesión se re-hidrata siempre desde `GET /api/v1/auth/me`. |
| Ruteo (frontend) | **react-router-dom** | |

No uses otras librerías de optimización, otro framework web, otro ORM, ni otro gestor de paquetes (backend o frontend) sin discutirlo antes — el stack ya está decidido.

## 3. Arquitectura (estado real)

```
main.py                       # entrypoint: crea la app FastAPI, CORS, monta routers
core/
  config.py                   # Settings (pydantic-settings): OSRM, solver, DATABASE_URL, JWT_*, frontend_url
  seguridad.py                 # hash de contraseñas (passlib) + crear/decodificar JWT (python-jose)
db/
  base.py                      # Base declarativa SQLAlchemy + naming convention (constraints estables en Alembic)
  sesion.py                    # engine, SessionLocal, get_db()
  modelos.py                   # Empresa, Usuario, CodigoInvitacion, Vehiculo, Deposito, Cliente, Ruta, ParadaRuta,
                                # PruebaEntrega, Incidencia (+ DuenioMixin/Duenio — dueño = empresa o chofer indep.)
  crud.py                      # funciones de acceso a datos (crear_*, obtener_*, listar_*), scoping por Duenio
api/
  schemas.py                   # Cliente, Deposito, Vehiculo, VentanaHoraria, Coordenada, PeticionRutas (VRP, stateless)
  routes.py                    # POST /api/v1/optimizar (motor VRP puro, sin persistencia — ver §5)
  schemas_auth.py / routes_auth.py     # registro/login/me/invitaciones (ver §10)
  schemas_clientes.py / routes_clientes.py     # CRUD de Cliente ("lugares" guardados) — ver §11
  schemas_depositos.py / routes_depositos.py   # CRUD de Deposito — ver §11
  schemas_rutas.py / routes_rutas.py           # optimizar/confirmar/activa — ver §11
  schemas_geocoding.py / routes_geocoding.py   # proxy de geocoding inverso (Nominatim) — ver §11
  dependencies.py                # get_db, obtener_usuario_actual, requiere_admin, requiere_chofer_independiente
routing/
  solver.py                    # resolver_ruteo(): el modelo OR-Tools (lee settings.solver_time_limit_segundos)
  planificador.py              # planificar_ruta(): arma el problema desde Cliente/Vehiculo/Deposito de un usuario
                                # y llama a resolver_ruteo — compartido por /rutas/optimizar y /rutas/confirmar
services/
  osrm_client.py                # obtener_matriz_osrm(): URL desde settings.osrm_base_url
  nominatim_client.py           # geocodificar_inverso(): URL desde settings.nominatim_base_url
scripts/
  benchmark_solomon.py          # benchmark VRPTW — TODAVÍA duplica lógica de routing/solver.py (ver §9)
  benchmark_uchoa.py            # benchmark CVRP — ídem
  compare_pyvrp.py              # comparación OR-Tools vs PyVRP (planificado, roadmap ítem 8)
  generar_dataset_mendoza.py    # dataset sintético georreferenciado (planificado, roadmap ítem 9)
data/
  solomon/                      # instancias VRPTW (Solomon), ya existe
  uchoa/                        # instancias CVRP (Uchoa et al.), ya existe
  mendoza/                      # dataset sintético del Gran Mendoza (planificado)
alembic/
  env.py                        # configurado con settings.database_url + metadata de db.modelos
  versions/                     # migraciones — excluidas de ruff, no reescribir su estilo a mano
tests/
  conftest.py                   # DB Postgres de test separada (sufijo _test), TestClient con get_db overrideado,
                                 # payload_chofer() compartido para registrar un chofer independiente de prueba
  test_auth.py / test_clientes.py / test_depositos.py / test_rutas.py
                                 # test_rutas.py mockea obtener_matriz_osrm (routing.planificador) con una matriz
                                 # sintética con floats — no depende del servidor OSRM real
frontend/                       # PWA React+Vite+TS — ver §10
docker-compose.yml              # servicio postgres (osrm queda comentado, pendiente roadmap ítem 4)
pyproject.toml / uv.lock
.env.example / .env             # .env gitignored
```

Todo lo de arriba ya existe y funciona (`uv sync && docker compose up -d postgres && uv run alembic upgrade head && uv run pytest` corre en verde). Lo que falta del roadmap original: self-hostear OSRM (ítem 4), generalizar el solver para benchmarks (ítem 5), `pyvrp`/dataset Mendoza (ítems 8-9).

## 4. Convenciones de código

- **Idioma: español en todo.** Nombres de funciones, variables, campos de modelos Pydantic, claves de los JSON de request/response, y comentarios van en español (ej. `resolver_ruteo`, `matriz_distancias`, `carga_total`, `demanda_carga`). Es el estado actual del código y se mantiene así — no migres a inglés ni mezcles.
- **snake_case** para funciones/variables, **PascalCase** para modelos Pydantic.
- **Type hints completos** en código nuevo: preferí `list[list[int]]` / `List[int]` en vez de `list` a secas (el código viejo usa hints laxos; no hace falta reescribirlo retroactivamente, pero el código nuevo sí debe llevarlos).
- **Comentarios**: solo cuando expliquen un *por qué* no obvio (una convención OSRM rara, un valor mágico, una restricción del solver). No documentes *qué* hace el código si el nombre ya lo dice. Nada de docstrings largos — una línea si aporta.
- **ruff** es la única herramienta de lint/formato una vez configurada (§8). No introduzcas black/flake8/isort en paralelo.
- Los benchmarks y el solver de producción deben compartir la misma lógica de modelado OR-Tools (ver gap en §9) — no dupliques el armado del `RoutingModel` en un script nuevo si `routing/solver.py` ya lo resuelve.
- **Frontend (`frontend/`)**: mismo idioma español en nombres de carpetas, componentes, funciones y variables (`FormularioLogin`, `useAuthStore`, `registrarChoferIndependiente`, `cargarSesion`). PascalCase para componentes React, camelCase para el resto — igual que el backend, no mezclar inglés salvo términos propios de la librería (`props`, `state`, hooks de React/Zustand). TypeScript con tipos completos (`tipos/auth.ts` espeja los schemas Pydantic de `api/schemas_auth.py` — si cambia uno, actualizar el otro a mano, no hay generación automática todavía).

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

## 6. Configuración (`core/config.py`, implementado)

Clase `Settings` (`pydantic-settings`), leída desde `.env` (ver `.env.example` versionado). Variables actuales:

- `OSRM_BASE_URL` — hoy sigue apuntando al servidor demo público de OSRM (default `http://router.project-osrm.org`). Pasará a la instancia local de `docker-compose.yml` recién en el roadmap ítem 4 (todavía no implementado).
- `SOLVER_TIME_LIMIT_SEGUNDOS` — default 5. Los benchmarks siguen con su propio valor hardcodeado en 60 (no leen `Settings` — ver gap en §9, roadmap ítem 5 sin resolver).
- `DATABASE_URL` — sin default, la app falla al arrancar si falta (fail-fast). Formato `postgresql+psycopg://...`.
- `JWT_SECRET_KEY` — sin default, ídem. `JWT_ALGORITHM` (default `HS256`), `JWT_EXPIRE_MINUTES` (default 10080 = 7 días).
- `ENTORNO` (`desarrollo` | `produccion`) — controla el flag `secure` de la cookie de sesión.
- `FRONTEND_URL` — usado en `CORSMiddleware` (`allow_origins`), debe matchear el origin real del frontend.
- `NOMINATIM_BASE_URL` — default `https://nominatim.openstreetmap.org` (servidor público, sin API key). Usado solo para geocoding inverso (pin del mapa → texto de dirección) en el alta de `Cliente`/`Deposito`; nunca para el motor VRP en sí.

No hardcodees URLs, timeouts ni límites nuevos — si es un valor que alguien podría querer cambiar sin tocar código, va en `Settings`.

## 7. Cómo correr el proyecto

```bash
# --- Backend ---
uv sync                                  # instala dependencias desde pyproject.toml/uv.lock
docker compose up -d postgres            # levanta Postgres (OSRM todavía no está dockerizado, ver §9)
uv run alembic upgrade head              # aplica las migraciones (crea empresas/usuarios/codigos_invitacion)
uv run uvicorn main:app --reload         # levanta la API en http://localhost:8000
uv run pytest                            # corre la suite de tests (auth; falta solver/osrm_client)
uv run ruff check . && uv run ruff format .   # lint + formato
uv run python scripts/benchmark_solomon.py    # benchmark VRPTW
uv run python scripts/benchmark_uchoa.py      # benchmark CVRP
uv run python scripts/compare_pyvrp.py        # comparación OR-Tools vs PyVRP (planificado)

# --- Frontend ---
cd frontend
npm install
npm run dev                              # http://localhost:5173
```

Nueva migración tras cambiar `db/modelos.py`: `uv run alembic revision --autogenerate -m "descripción"` y revisar el archivo generado a mano antes de `alembic upgrade head` (Alembic no siempre detecta bien cambios de tipo/constraint).

## 8. Roadmap accionable (motor VRP / paper)

Basado en las secciones 4.3 y 5 del paper (dataset, validación, métricas empíricas) más la deuda técnica actual.

1. ~~Migrar a `uv`~~ ✅ hecho.
2. ~~Reestructurar `main.py` en `api/`/`core/`~~ ✅ hecho.
3. ~~Introducir `core/config.py`~~ ✅ hecho (ver §6).
4. Self-hostear OSRM: `docker-compose.yml` con el servicio OSRM usando un extracto `.osm.pbf` de Mendoza/Argentina preprocesado (`osrm-extract` + `osrm-partition` + `osrm-customize`), apuntado desde `OSRM_BASE_URL`. **Pendiente** — hoy `docker-compose.yml` solo levanta Postgres, el servicio `osrm` está comentado como placeholder.
5. Generalizar `routing/solver.py` para que reciba matrices de cualquier origen (OSRM real o distancias euclidianas de benchmarks) sin duplicar el armado del `RoutingModel`; migrar `scripts/benchmark_solomon.py` y `scripts/benchmark_uchoa.py` para que lo importen en vez de reimplementarlo. **Pendiente**, sigue siendo el gap original.
6. ~~Agregar `pytest`~~ parcial: hecho para auth (`tests/test_auth.py`), **falta** `test_solver.py` y `test_osrm_client.py`.
7. ~~Adoptar `ruff`~~ ✅ hecho, configurado en `pyproject.toml` (excluye `alembic/versions/`, ignora `B008` por el patrón `Depends()` de FastAPI).
8. Agregar `pyvrp` y `scripts/compare_pyvrp.py`. **Pendiente**.
9. Generar el dataset sintético georreferenciado del Gran Mendoza (`scripts/generar_dataset_mendoza.py`). **Pendiente**.
10. Recolectar métricas empíricas exhaustivas (Uchoa, Solomon/Homberger, Mendoza sintético) documentando hardware. **Pendiente**.

## 9. Gaps conocidos (no "arreglar" por sorpresa sin avisar)

- `scripts/benchmark_solomon.py` y `scripts/benchmark_uchoa.py` **duplican** la lógica de modelado de `routing/solver.py` con parámetros de búsqueda propios (estrategias iniciales distintas, `time_limit` de 60s vs 5s, escalado de distancias por separado) y **no leen `core/config.py`**. Se resuelve en el ítem 5 del roadmap — no es un bug, es deuda técnica ya identificada.
- `services/osrm_client.py` apunta hoy al **servidor demo público** de OSRM (`router.project-osrm.org`), que tiene rate-limiting y no está pensado para uso intensivo/producción. Se reemplaza por una instancia self-hosted en el ítem 4.
- No hay dataset del Gran Mendoza todavía — el título de la API ("Gran Mendoza") es aspiracional hasta el ítem 9 del roadmap.
- No hay `response_model` tipado en el endpoint `/api/v1/optimizar` (devuelve un `dict` plano) ni validación declarativa de las reglas cruzadas VRPTW (hoy se valida a mano dentro del handler). No es prioritario resolverlo fuera del roadmap salvo que se decida explícitamente.
- **Bug pre-existente conocido, no corregido todavía**: en `api/routes.py`, si `resolver_ruteo` devuelve `{"estado": "Fallo"}`, el `HTTPException(400, ...)` que se lanza queda dentro del mismo `try` que captura `except Exception` más abajo — como `HTTPException` hereda de `Exception`, termina reconvertido en un 500 en vez de un 400. Es un bug heredado de antes de esta sesión; no se tocó al reestructurar `main.py` en `api/routes.py` para no mezclar refactor con fix de comportamiento sin avisar. Corregirlo es un cambio de una línea (`except HTTPException: raise` antes del `except Exception` genérico) cuando se decida abordarlo.

## 10. Sistema de cuentas / autenticación (nuevo, implementado)

Capa nueva para soportar la app PWA (más allá del motor VRP puro). Backend: `db/modelos.py`, `api/routes_auth.py`, `core/seguridad.py`. Frontend: `frontend/src/store/useAuthStore.ts`, `frontend/src/paginas/{Login,Registro}.tsx`.

**Modelo de cuentas**:
- `Empresa` (1) —N— `Usuario` vía `Usuario.empresa_id` (nullable). Un `Usuario` es o bien **chofer independiente** (`rol=chofer`, `empresa_id=NULL`) o **chofer de una empresa** (`rol=chofer`, `empresa_id` seteado) o **admin de una empresa** (`rol=admin`, siempre con `empresa_id`).
- Vínculo chofer↔empresa: **código de invitación de un solo uso** (`CodigoInvitacion`, 8 caracteres alfanuméricos). Lo genera un admin (`POST /api/v1/auth/invitaciones`), lo consume un chofer al registrarse (`POST /api/v1/auth/registro/chofer-invitado`); una vez usado (`usado=True`) no se puede reutilizar.
- `plan`/`fecha_fin_prueba` existen en `Empresa` y `Usuario` (modelo freemium futuro) pero **sin enforcement real todavía** — no hay billing (Stripe/MercadoPago) implementado ni planificado para esta etapa.

**Auth/sesión**: JWT (claims `sub`, `rol`, `empresa_id`, `iat`, `exp`) en cookie `httponly` + `samesite=lax`, expira a los 7 días (`JWT_EXPIRE_MINUTES`). `obtener_usuario_actual` (en `api/dependencies.py`) decodifica el token y **siempre revalida contra la DB** (no confía ciegamente en los claims), así un `activo=False` surte efecto inmediato. No hay refresh token — al expirar, re-login manual. No hay rate limiting ni bloqueo de cuenta tras intentos fallidos de login todavía.

**Endpoints** (`/api/v1/auth`, prefijo): `POST /registro/chofer-independiente`, `POST /registro/empresa`, `POST /registro/chofer-invitado`, `POST /login`, `POST /logout`, `GET /me`, `POST /invitaciones` (rol admin), `GET /invitaciones` (rol admin).

**Frontend**: `frontend/` es un proyecto Vite+React+TS separado (propio `package.json`/`node_modules`, no gestionado por `uv`). Sin `localStorage` para la sesión — el store de Zustand (`useAuthStore`) siempre re-hidrata vía `GET /me` al montar la app. Estilos: `frontend/src/estilos/tokens.css` — colores/tipografía extraídos de un mockup `Active Route View.dc.html` diseñado en Claude Design (azul `#2E5CFF`, verde éxito `#12B76A`, `Inter`+`JetBrains Mono`). **Importante**: ese mismo proyecto de Claude Design tiene un design system separado ("Trazo", tema oscuro/verde lima, terminología de levantamiento olímpico) que **no tiene relación con esta app** — no confundirlos ni usar esos tokens.

**Fuera de alcance todavía** (no construir por sorpresa sin que se pida explícitamente):
- Dashboard de empresa (ver/listar choferes, copiar códigos de invitación desde la UI — hoy solo existe el endpoint, se prueba por API).
- Asignación de rutas por parte de la empresa a un chofer específico (el chofer independiente ya arma y confirma la suya solo — ver §11 — pero un chofer de empresa todavía no recibe nada, ni de un admin ni de sí mismo).
- Detalle de Parada, Prueba de Entrega (POD — el modelo `PruebaEntrega` ya existe pero sin UI ni endpoint), Mi Flota, Incidencias, Resumen de cierre.
- Billing/suscripciones reales, verificación de email, PWA offline/service worker/manifest.json.

`Inicio.tsx` dejó de ser un placeholder — ver §11.

## 11. Libreta de direcciones y armado de rutas (chofer independiente, nuevo, implementado)

Primer punto de contacto entre el motor VRP (§5) y un usuario real: un chofer sin empresa arma, confirma, ejecuta y cierra su propia ruta del día, sin intervención de un admin. Backend: `db/modelos.py` (`Cliente`, `Deposito`, `Ruta`, `ParadaRuta`), `api/routes_clientes.py`, `api/routes_depositos.py`, `api/routes_rutas.py`, `routing/planificador.py`. Frontend: `frontend/src/paginas/{Inicio,PestanaInicio,PestanaLugares}.tsx`, `frontend/src/componentes/rutas/{FlujoArmarRuta,MapaRutaActiva}.tsx`, `frontend/src/componentes/mapa/SelectorUbicacion.tsx`.

**Dueño de un recurso compartido** (`Cliente`, `Deposito`, y a futuro cualquier cosa con `DuenioMixin`): `Usuario.ambito_dueño` (propiedad en `db/modelos.py`, devuelve un `Duenio` — `NamedTuple` con `empresa_id`/`usuario_id`) es el único lugar que decide si un recurso nuevo pertenece a la empresa del usuario (compartido entre toda su flota) o al usuario mismo (independiente). `db/crud._condicion_dueño(modelo, duenio)` aplica ese mismo filtro como `WHERE` — nunca se trae una fila por id sin la condición de dueño adentro de la query (evita el típico bug de "traer y comparar después").

**Selector de ubicación** (`SelectorUbicacion.tsx`, componente de mapa reusado por `FormularioCliente` y `FormularioDeposito`): Leaflet + tiles de OpenStreetMap (sin API key) para marcar el pin; al tocar el mapa dispara geocoding inverso contra Nominatim (`api/routes_geocoding.py` → `services/nominatim_client.py`) para autocompletar el texto de dirección — best-effort, si Nominatim falla el chofer igual puede escribirla a mano. No confundir con el motor VRP: esto es puramente para cargar datos, `routing/solver.py` sigue sin saber nada de geocoding.

**Flujo de "armar ruta"** (`FlujoArmarRuta.tsx`, disparado desde el botón "Armar ruta" en `PestanaLugares.tsx`):
1. Si el chofer todavía no tiene `Deposito`, primero se lo pide (`FormularioDeposito`) — es su punto de partida/llegada, obligatorio para el CVRP.
2. Selecciona qué `Cliente` de su libreta visita hoy y cuánta carga (kg) lleva a cada uno — la carga es del viaje, no un dato fijo del `Cliente` (que solo tiene un `demanda_carga_default` opcional, hoy sin usar en la UI).
3. `POST /api/v1/rutas/optimizar` arma el problema (vía `routing/planificador.planificar_ruta`, que reusa `resolver_ruteo`/`obtener_matriz_osrm` sin duplicar el modelado) y devuelve un preview **sin persistir**: orden de paradas + distancia acumulada por parada.
4. El chofer confirma o cancela. `POST /api/v1/rutas/confirmar` vuelve a resolver el mismo problema (no persiste el preview del frontend tal cual — la única fuente de verdad es el solver) y crea `Ruta` + `ParadaRuta` (con snapshot de cada `Cliente` en ese momento, igual que ya documentaba el modelo de datos).
5. Un chofer solo puede tener una `Ruta` con estado `planificada`/`en_curso` por día (`crud.obtener_ruta_activa`) — confirmar una segunda da 409.

`RutaPreview` también trae `explicacion` (por qué ese orden — texto fijo, no una traza del solver) y `ahorro_m` (distancia real ahorrada comparando el orden optimizado contra el orden en que el chofer fue marcando los lugares en la selección — mismas distancias de OSRM, sin estimaciones de combustible: `routing/planificador._distancia_recorrido`).

**Ciclo de vida de una `Ruta` ya confirmada** (`api/routes_rutas.py`, todo bajo `/api/v1/rutas/activa`, todo requiere `requiere_chofer_independiente` salvo donde se aclara):
- `PUT /activa` — editar: solo si `estado=planificada`; vuelve a llamar `planificar_ruta` con la nueva selección, cancela la `Ruta` vieja (`estado=cancelada`, no se borra) y crea una nueva — mismo camino que confirmar, no un update in-place.
- `DELETE /activa` — cancela (`estado=cancelada`).
- `POST /activa/iniciar` — `planificada` → `en_curso`; la primera parada (`orden=0`) pasa a `EstadoParada.en_curso` (`crud.iniciar_ruta`).
- `POST /activa/paradas/{parada_id}/completar` — marca esa parada `completada` y avanza la siguiente a `en_curso` (`crud.completar_parada`); si no queda ninguna pendiente, cierra la `Ruta` entera (`estado=completada`). Ojo: una `Ruta` completada deja de ser "la ruta activa" (`obtener_ruta_activa` solo mira `planificada`/`en_curso`) — por eso `PestanaInicio.tsx` usa la `Ruta` que devuelve la propia llamada a iniciar/completar en vez de siempre volver a pedir `GET /activa`, que ya no la encontraría.
- `GET /activa/geometria` — traza real (calles, no línea recta) para el mapa, vía `services/osrm_client.obtener_geometria_osrm` (perfil `driving`, distinto request que la matriz de distancias). Gatillo del pedido del usuario ("un mapa que vaya marcando el camino a la próxima parada"): `MapaRutaActiva.tsx` dibuja esa traza + un pin por parada coloreado por `estado` (gris=pendiente, azul pulsante=en_curso, verde=completada) — mismo código de color que `.chip-estado` en las tarjetas.

**CVRP únicamente, sin VRPTW todavía**: ni el formulario de `Cliente` ni el de selección piden ventana horaria, así que `ParadaRuta.hora_estimada_llegada` queda `NULL` — el preview y la ruta confirmada muestran distancia acumulada, no ETA. Extender a VRPTW es agregar los campos de ventana horaria a `Cliente`/`ParadaSeleccionada` y pasar `tipo_problema="VRPTW"` a `resolver_ruteo`, no un cambio de arquitectura.

**Solo chofer independiente**: `api/dependencies.requiere_chofer_independiente` (403 si `usuario.empresa_id` no es `None`) protege `/rutas/optimizar` y `/rutas/confirmar` — un chofer de empresa no puede auto-asignarse una ruta todavía (ver §10, fuera de alcance). `GET /rutas/activa` sí es genérico (cualquier usuario autenticado), para cuando exista asignación por empresa no haga falta tocar ese endpoint.

**`PestanaInicio.tsx`** (contenido de la pestaña "Inicio"): llama a `GET /rutas/activa` y listo — sin rama especial por rol, porque para cualquier usuario sin `Ruta` activa hoy (chofer de empresa, admin) el endpoint ya devuelve `null` de forma natural.
