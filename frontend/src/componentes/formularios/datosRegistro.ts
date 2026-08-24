import { ErrorFormulario } from "../../api/cliente";
import type { TipoVehiculo } from "../../tipos/auth";

export interface ValoresCredenciales {
  nombreCompleto: string;
  email: string;
  contrasena: string;
  confirmarContrasena: string;
}

export const VALORES_CREDENCIALES_INICIALES: ValoresCredenciales = {
  nombreCompleto: "",
  email: "",
  contrasena: "",
  confirmarContrasena: "",
};

export function validarContrasenasCoinciden(valores: ValoresCredenciales): void {
  if (valores.contrasena !== valores.confirmarContrasena) {
    throw new ErrorFormulario("Las contraseñas no coinciden.");
  }
}

export interface ValoresVehiculo {
  telefono: string;
  tipoVehiculo: TipoVehiculo | "";
  patente: string;
  capacidadCargaKg: string;
}

export const VALORES_VEHICULO_INICIALES: ValoresVehiculo = {
  telefono: "",
  tipoVehiculo: "",
  patente: "",
  capacidadCargaKg: "",
};

/** El input ya restringe a `type="number" min={1}`, pero esa validación es
 * solo de UI — igual hay que confirmar acá que el valor enviado es un número
 * válido antes de mandarlo al backend. */
export function capacidadCargaValidaKg(valores: ValoresVehiculo): number {
  const capacidad = Number(valores.capacidadCargaKg);
  if (!Number.isFinite(capacidad) || capacidad <= 0) {
    throw new ErrorFormulario("La capacidad de carga tiene que ser un número mayor a 0.");
  }
  return capacidad;
}
