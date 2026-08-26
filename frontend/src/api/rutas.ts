import { fetchApi } from "./cliente";
import type { OptimizarRutaRequest, RutaPreview, RutaPublica } from "../tipos/ruta";

const BASE = "/api/v1/rutas";

export function optimizarRuta(datos: OptimizarRutaRequest) {
  return fetchApi<RutaPreview>(`${BASE}/optimizar`, {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

export function confirmarRuta(datos: OptimizarRutaRequest) {
  return fetchApi<RutaPublica>(`${BASE}/confirmar`, {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

export function obtenerRutaActiva() {
  return fetchApi<RutaPublica | null>(`${BASE}/activa`);
}
