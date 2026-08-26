export interface DepositoPublico {
  id: string;
  nombre: string;
  latitud: number;
  longitud: number;
  ventana_inicio: number | null;
  ventana_fin: number | null;
  activo: boolean;
  fecha_creacion: string;
}

export interface DatosDepositoCrear {
  nombre: string;
  latitud: number;
  longitud: number;
  ventana_inicio?: number | null;
  ventana_fin?: number | null;
}
