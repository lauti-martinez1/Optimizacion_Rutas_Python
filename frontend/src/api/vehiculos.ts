import { fetchApi } from "./cliente";
import type { DatosVehiculoActualizar, DatosVehiculoCrear, VehiculoPublico } from "../tipos/vehiculo";

const BASE = "/api/v1/vehiculos";

export function crearVehiculo(datos: DatosVehiculoCrear) {
  return fetchApi<VehiculoPublico>(BASE, { method: "POST", body: JSON.stringify(datos) });
}

export function listarVehiculos() {
  return fetchApi<VehiculoPublico[]>(BASE);
}

export function actualizarVehiculo(id: string, datos: DatosVehiculoActualizar) {
  return fetchApi<VehiculoPublico>(`${BASE}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(datos),
  });
}

export function eliminarVehiculo(id: string) {
  return fetchApi<{ mensaje: string }>(`${BASE}/${id}`, { method: "DELETE" });
}
