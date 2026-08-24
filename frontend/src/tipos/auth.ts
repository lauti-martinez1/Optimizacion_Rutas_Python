export type RolUsuario = "chofer" | "admin";
export type PlanSuscripcion = "prueba" | "basico" | "premium";
export type TipoVehiculo = "moto" | "auto" | "camioneta" | "furgon" | "camion";

export interface EmpresaPublica {
  id: string;
  nombre: string;
  plan: PlanSuscripcion;
  fecha_fin_prueba: string | null;
  fecha_creacion: string;
}

export interface UsuarioPublico {
  id: string;
  email: string;
  nombre_completo: string;
  rol: RolUsuario;
  empresa_id: string | null;
  telefono: string | null;
  tipo_vehiculo: TipoVehiculo | null;
  patente: string | null;
  capacidad_carga_kg: number | null;
  plan: PlanSuscripcion;
  fecha_fin_prueba: string | null;
  fecha_creacion: string;
}

export interface RegistroEmpresaResponse {
  usuario: UsuarioPublico;
  empresa: EmpresaPublica;
}

export interface CodigoInvitacionPublico {
  id: string;
  codigo: string;
  usado: boolean;
  fecha_creacion: string;
  fecha_uso: string | null;
}

interface DatosPersonaBase {
  email: string;
  contrasena: string;
  confirmar_contrasena: string;
  nombre_completo: string;
}

interface DatosVehiculo {
  telefono: string;
  tipo_vehiculo: TipoVehiculo;
  patente: string;
  capacidad_carga_kg: number;
}

export type DatosRegistroChoferIndependiente = DatosPersonaBase & DatosVehiculo;

export interface DatosRegistroEmpresa extends DatosPersonaBase {
  nombre_empresa: string;
}

export type DatosRegistroChoferInvitado = DatosPersonaBase &
  DatosVehiculo & {
    codigo_invitacion: string;
  };

export interface DatosLogin {
  email: string;
  contrasena: string;
}
