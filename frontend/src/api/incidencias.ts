import { fetchApi } from "./cliente";
import type { DatosIncidenciaCrear, IncidenciaPublica } from "../tipos/incidencia";

const BASE = "/api/v1/incidencias";

export function crearIncidencia(datos: DatosIncidenciaCrear) {
  return fetchApi<IncidenciaPublica>(BASE, { method: "POST", body: JSON.stringify(datos) });
}

export function listarIncidencias(fecha?: string) {
  return fetchApi<IncidenciaPublica[]>(`${BASE}${fecha ? `?fecha=${fecha}` : ""}`);
}
