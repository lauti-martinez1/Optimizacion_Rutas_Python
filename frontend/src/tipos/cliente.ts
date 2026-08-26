export interface ClientePublico {
  id: string;
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  telefono: string | null;
  activo: boolean;
  fecha_creacion: string;
}

export interface DatosClienteCrear {
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  telefono: string | null;
}

export type DatosClienteActualizar = Partial<DatosClienteCrear>;
