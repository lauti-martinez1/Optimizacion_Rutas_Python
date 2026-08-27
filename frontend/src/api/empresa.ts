import { fetchApi } from "./cliente";
import type {
  ChoferResumenEmpresa,
  EmpresaAsignarRutaRequest,
  KpisEmpresaDia,
  ReoptimizarDiaResponse,
  RutaResumenEmpresa,
} from "../tipos/empresa";
import type { GeometriaRuta, RutaPublica } from "../tipos/ruta";

const BASE = "/api/v1/empresa";

function conFecha(fecha?: string) {
  return fecha ? `?fecha=${fecha}` : "";
}

export function obtenerChoferesEmpresa() {
  return fetchApi<ChoferResumenEmpresa[]>(`${BASE}/choferes`);
}

export function obtenerRutasEmpresa(fecha?: string) {
  return fetchApi<RutaResumenEmpresa[]>(`${BASE}/rutas${conFecha(fecha)}`);
}

export function obtenerKpisEmpresa(fecha?: string) {
  return fetchApi<KpisEmpresaDia>(`${BASE}/kpis${conFecha(fecha)}`);
}

export function obtenerRutaEmpresa(id: string) {
  return fetchApi<RutaPublica>(`${BASE}/rutas/${id}`);
}

export function obtenerGeometriaRutaEmpresa(id: string) {
  return fetchApi<GeometriaRuta>(`${BASE}/rutas/${id}/geometria`);
}

export function asignarRuta(datos: EmpresaAsignarRutaRequest) {
  return fetchApi<RutaPublica>(`${BASE}/rutas`, { method: "POST", body: JSON.stringify(datos) });
}

export function reoptimizarRuta(id: string) {
  return fetchApi<RutaPublica>(`${BASE}/rutas/${id}/reoptimizar`, { method: "POST" });
}

export function reoptimizarDia(fecha?: string) {
  return fetchApi<ReoptimizarDiaResponse>(`${BASE}/reoptimizar-dia${conFecha(fecha)}`, {
    method: "POST",
  });
}
