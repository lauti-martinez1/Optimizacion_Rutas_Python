import { fetchApi } from "./cliente";
import type { PedidoPublico } from "../tipos/pedido";

export function obtenerPedidos(fecha?: string) {
  return fetchApi<PedidoPublico[]>(`/api/v1/empresa/pedidos${fecha ? `?fecha=${fecha}` : ""}`);
}
