export type TipoIncidencia =
  | "cliente_ausente"
  | "rechazo_entrega"
  | "direccion_incorrecta"
  | "mercaderia_danada"
  | "problema_vehiculo"
  | "otro";

export interface IncidenciaPublica {
  id: string;
  ruta_id: string;
  parada_id: string | null;
  tipo: TipoIncidencia;
  descripcion: string | null;
  reportado_por_usuario_id: string;
  fecha_hora: string;
}

export interface DatosIncidenciaCrear {
  ruta_id: string;
  parada_id?: string | null;
  tipo: TipoIncidencia;
  descripcion?: string | null;
}
