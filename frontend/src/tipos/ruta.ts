export type EstadoRuta = "planificada" | "en_curso" | "completada" | "cancelada";
export type EstadoParada = "pendiente" | "en_curso" | "completada" | "fallida";
export type TipoProblema = "CVRP" | "VRPTW";

export interface ParadaSeleccionada {
  cliente_id: string;
  carga_kg: number;
  unidades: number;
  ventana_inicio: number | null;
  ventana_fin: number | null;
}

export interface OptimizarRutaRequest {
  paradas: ParadaSeleccionada[];
  usa_ventanas_horarias: boolean;
}

export interface ParadaPreview {
  cliente_id: string;
  nombre: string;
  direccion: string;
  orden: number;
  carga_kg: number;
  unidades: number;
  distancia_acumulada_m: number;
  ventana_inicio: number | null;
  ventana_fin: number | null;
  hora_estimada_llegada: number | null;
}

export interface RutaPreview {
  paradas: ParadaPreview[];
  distancia_total_m: number;
  carga_total_kg: number;
  distancia_sin_optimizar_m: number;
  ahorro_m: number;
  explicacion: string;
  usa_ventanas_horarias: boolean;
  hora_fin_estimada_min: number | null;
}

export interface GeometriaRuta {
  tramos: [number, number][][];
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
  unidades_snapshot: number;
  distancia_acumulada_m: number;
  ventana_inicio_snapshot: number | null;
  ventana_fin_snapshot: number | null;
  hora_estimada_llegada: number | null;
  hora_real_salida: string | null;
  en_riesgo: boolean;
  ventana_cumplida: boolean | null;
}

export interface DepositoResumen {
  latitud: number;
  longitud: number;
}

export interface RutaPublica {
  id: string;
  fecha: string;
  estado: EstadoRuta;
  tipo_problema: TipoProblema;
  distancia_total_m: number | null;
  hora_inicio_real: string | null;
  hora_fin_estimada_min: number | null;
  fecha_creacion: string;
  deposito: DepositoResumen;
  capacidad_vehiculo_kg: number;
  explicacion: string | null;
  paradas: ParadaRutaPublica[];
  usa_ventanas_horarias: boolean;
}

export interface RutaHistorialItem {
  id: string;
  fecha: string;
  estado: EstadoRuta;
  tipo_problema: TipoProblema;
  distancia_total_m: number | null;
  paradas_total: number;
  paradas_completadas: number;
  usa_ventanas_horarias: boolean;
}
