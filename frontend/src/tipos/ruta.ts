export type EstadoRuta = "planificada" | "en_curso" | "completada" | "cancelada";
export type EstadoParada = "pendiente" | "en_curso" | "completada" | "fallida";

export interface ParadaSeleccionada {
  cliente_id: string;
  carga_kg: number;
}

export interface OptimizarRutaRequest {
  paradas: ParadaSeleccionada[];
}

export interface ParadaPreview {
  cliente_id: string;
  nombre: string;
  direccion: string;
  orden: number;
  carga_kg: number;
  distancia_acumulada_m: number;
}

export interface RutaPreview {
  paradas: ParadaPreview[];
  distancia_total_m: number;
  carga_total_kg: number;
  distancia_sin_optimizar_m: number;
  ahorro_m: number;
  explicacion: string;
}

export interface GeometriaRuta {
  puntos: [number, number][];
}

export interface ParadaRutaPublica {
  id: string;
  cliente_id: string;
  orden: number;
  estado: EstadoParada;
  nombre_snapshot: string;
  direccion_snapshot: string;
  latitud_snapshot: number;
  longitud_snapshot: number;
  demanda_carga_snapshot: number;
}

export interface DepositoResumen {
  latitud: number;
  longitud: number;
}

export interface RutaPublica {
  id: string;
  fecha: string;
  estado: EstadoRuta;
  distancia_total_m: number | null;
  fecha_creacion: string;
  deposito: DepositoResumen;
  capacidad_vehiculo_kg: number;
  explicacion: string | null;
  paradas: ParadaRutaPublica[];
}
