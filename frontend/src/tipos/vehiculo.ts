export type TipoVehiculo = "moto" | "auto" | "camioneta" | "furgon" | "camion";

// Forma completa del recurso Vehiculo para el dashboard de Flota — distinta
// de la VehiculoPublico resumida en tipos/auth.ts (esa solo trae lo que un
// chofer necesita ver de su propio vehículo asignado).
export interface VehiculoPublico {
  id: string;
  tipo_vehiculo: TipoVehiculo;
  patente: string;
  capacidad_carga_kg: number;
  activo: boolean;
  usuario_id: string | null;
  fecha_creacion: string;
}

export interface DatosVehiculoCrear {
  tipo_vehiculo: TipoVehiculo;
  patente: string;
  capacidad_carga_kg: number;
  usuario_id?: string | null;
}

export interface DatosVehiculoActualizar {
  tipo_vehiculo?: TipoVehiculo;
  capacidad_carga_kg?: number;
  usuario_id?: string | null;
  activo?: boolean;
}
