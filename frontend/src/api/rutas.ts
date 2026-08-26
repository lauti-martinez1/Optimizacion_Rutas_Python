import { fetchApi } from "./cliente";
import type { GeometriaRuta, OptimizarRutaRequest, RutaPreview, RutaPublica } from "../tipos/ruta";

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

export function editarRuta(datos: OptimizarRutaRequest) {
  return fetchApi<RutaPublica>(`${BASE}/activa`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });
}

export function eliminarRuta() {
  return fetchApi<{ mensaje: string }>(`${BASE}/activa`, { method: "DELETE" });
}

export function iniciarRuta() {
  return fetchApi<RutaPublica>(`${BASE}/activa/iniciar`, { method: "POST" });
}

export function completarParada(paradaId: string) {
  return fetchApi<RutaPublica>(`${BASE}/activa/paradas/${paradaId}/completar`, {
    method: "POST",
  });
}

export function obtenerRutaActiva() {
  return fetchApi<RutaPublica | null>(`${BASE}/activa`);
}

export function obtenerGeometriaRutaActiva() {
  return fetchApi<GeometriaRuta>(`${BASE}/activa/geometria`);
}
