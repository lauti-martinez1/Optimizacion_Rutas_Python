import { fetchApi } from "./cliente";
import type { DatosDepositoActualizar, DatosDepositoCrear, DepositoPublico } from "../tipos/deposito";

const BASE = "/api/v1/depositos";

export function crearDeposito(datos: DatosDepositoCrear) {
  return fetchApi<DepositoPublico>(BASE, { method: "POST", body: JSON.stringify(datos) });
}

export function listarDepositos() {
  return fetchApi<DepositoPublico[]>(BASE);
}

export function actualizarDeposito(id: string, datos: DatosDepositoActualizar) {
  return fetchApi<DepositoPublico>(`${BASE}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(datos),
  });
}
