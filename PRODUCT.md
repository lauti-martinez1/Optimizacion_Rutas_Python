# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Dos audiencias con roles distintos, en la misma app:

- **Choferes de reparto** (independientes o vinculados a una empresa de distribución) que necesitan ver su ruta asignada del día y ejecutar las entregas. Uso principal desde el celular, en movimiento.
- **Administradores de empresas de distribución** que gestionan una flota de choferes: invitan choferes a su empresa (vía código de invitación) y, a futuro, les asignan rutas.

## Product Purpose

Motor de optimización de rutas (VRP — Vehicle Routing Problem) para empresas de distribución del Gran Mendoza, empaquetado como app web para que choferes y empresas lo usen en el día a día. Nació como prototipo de software del paper académico *"Optimización de rutas para empresas de distribución: un enfoque computacional"* (CACIC 2026, Universidad del Aconcagua) y está evolucionando hacia un producto real con cuentas de usuario, y a futuro planes de suscripción.

## Positioning

No reinventa el algoritmo de optimización — integra una librería de alto rendimiento (Google OR-Tools) con datos de tránsito reales (OSRM: distancias y tiempos reales, no euclidianos) detrás de una API backend desacoplada, y lo valida empíricamente contra la topología y las restricciones operativas reales del Gran Mendoza. El diferencial frente a una app de ruteo genérica es esa validación empírica local, no el algoritmo en sí.

## Operating Context

- Resuelve dos variantes del problema: CVRP (capacidad de carga) y VRPTW (CVRP + ventanas horarias por cliente y depósito).
- Modelo de cuentas: `Empresa` (1) —N— `Usuario`, donde un `Usuario` es chofer independiente (sin empresa), chofer vinculado a una empresa (código de invitación de un solo uso), o admin de una empresa.
- Sesión vía JWT en cookie httpOnly (no localStorage) — la app se piensa como algo que un chofer deja abierto en el celular durante el turno.

## Capabilities and Constraints

- **Idioma**: todo el copy y la UI en español — convención ya establecida en el código (backend y frontend), no se mezcla inglés.
- **Plataforma**: pensado como PWA, uso mobile-first — el chofer la usa desde el celular en la calle.
- Backend: FastAPI + PostgreSQL + SQLAlchemy. Frontend: React + Vite + TypeScript + Zustand.
- Sin billing/suscripciones reales todavía (modelo freemium planeado a futuro, sin implementar).
- Sin verificación de email, sin offline/service worker todavía.

## Brand Commitments

Sin nombre de marca ni logo definidos todavía — el proyecto se identifica por su función ("optimización de rutas de reparto") más que por una marca nombrada.

## Evidence on Hand

- Mockup de referencia diseñado en Claude Design (`Active Route View.dc.html`, no versionado en este repo): pantallas mobile de la operación del chofer (ruta activa, detalle de parada, confirmación de entrega, flota, incidencias, resumen de cierre). Paleta usada ahí y ya extraída a `frontend/src/estilos/tokens.css`: azul primario `#2E5CFF`, verde éxito `#12B76A`, fondo `#E9EAEC`/`#F5F6F8`, tipografía Inter (texto) + JetBrains Mono (datos numéricos).
- El mismo proyecto de Claude Design contiene un design system separado ("Trazo", tema oscuro/verde lima, terminología de levantamiento olímpico) que **no tiene relación con este producto** — evidencia a ignorar, no a heredar.
- Sin fotografía, ilustración ni assets de marca propios todavía.

## Product Principles

1. La validación empírica local (Gran Mendoza) es el diferencial — no el algoritmo de optimización en sí.
2. Dos audiencias con necesidades distintas conviven en una sola app: chofer ejecutando una ruta, admin gestionando una flota.
3. Mobile-first siempre — el chofer es el usuario primario y usa el celular en movimiento.
4. Sin hardcodear nada configurable (URLs, límites, secretos) — todo vía `Settings`/`.env`.
