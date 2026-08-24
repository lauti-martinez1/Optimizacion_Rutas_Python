export type RolUsuario = "chofer" | "admin";
export type PlanSuscripcion = "prueba" | "basico" | "premium";

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
  nombre_completo: string;
}

export type DatosRegistroChoferIndependiente = DatosPersonaBase;

export interface DatosRegistroEmpresa extends DatosPersonaBase {
  nombre_empresa: string;
}

export interface DatosRegistroChoferInvitado extends DatosPersonaBase {
  codigo_invitacion: string;
}

export interface DatosLogin {
  email: string;
  contrasena: string;
}
