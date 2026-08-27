import type { EstadoParada } from "./ruta";

export interface PedidoPublico {
  id: string;
  ruta_id: string;
  fecha: string;
  cliente_nombre: string;
  direccion: string;
  carga_kg: number;
  ventana_inicio: number | null;
  ventana_fin: number | null;
  estado: EstadoParada;
  orden: number;
  chofer_nombre: string;
  vehiculo_patente: string;
}
