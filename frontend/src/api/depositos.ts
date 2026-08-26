import { fetchApi } from "./cliente";
import type { DatosDepositoCrear, DepositoPublico } from "../tipos/deposito";

const BASE = "/api/v1/depositos";

export function crearDeposito(datos: DatosDepositoCrear) {
  return fetchApi<DepositoPublico>(BASE, { method: "POST", body: JSON.stringify(datos) });
}

export function listarDepositos() {
  return fetchApi<DepositoPublico[]>(BASE);
}
