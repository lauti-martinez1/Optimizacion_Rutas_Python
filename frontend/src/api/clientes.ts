// Endpoints del recurso Cliente ("lugares" guardados por el chofer). No
// confundir con api/cliente.ts — ese es el helper genérico de fetch
// (fetchApi/ErrorFormulario), no tiene relación con el dominio Cliente.
import { fetchApi } from "./cliente";
import type { ClientePublico, DatosClienteActualizar, DatosClienteCrear } from "../tipos/cliente";

const BASE = "/api/v1/clientes";

export function crearCliente(datos: DatosClienteCrear) {
  return fetchApi<ClientePublico>(BASE, { method: "POST", body: JSON.stringify(datos) });
}

export function listarClientes() {
  return fetchApi<ClientePublico[]>(BASE);
}

export function actualizarCliente(id: string, datos: DatosClienteActualizar) {
  return fetchApi<ClientePublico>(`${BASE}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(datos),
  });
}

export function eliminarCliente(id: string) {
  return fetchApi<{ mensaje: string }>(`${BASE}/${id}`, { method: "DELETE" });
}
