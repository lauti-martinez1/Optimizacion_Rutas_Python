import type { DepositoResumen, EstadoRuta } from "./ruta";

export interface ChoferResumenEmpresa {
  id: string;
  nombre_completo: string;
  email: string;
  vehiculo_patente: string | null;
}

export interface RutaResumenEmpresa {
  id: string;
  chofer_id: string;
  chofer_nombre: string;
  vehiculo_patente: string;
  estado: EstadoRuta;
  fecha: string;
  distancia_total_m: number | null;
  deposito: DepositoResumen;
  explicacion: string | null;
  total_paradas: number;
  paradas_completadas: number;
  paradas_fallidas: number;
  paradas_pendientes: number;
  en_riesgo: boolean;
}

export interface KpisEmpresaDia {
  fecha: string;
  rutas_activas: number;
  rutas_completadas: number;
  rutas_en_riesgo: number;
  total_paradas: number;
  paradas_completadas: number;
  paradas_pendientes: number;
  paradas_fallidas: number;
}

export interface EmpresaAsignarRutaRequest {
  chofer_id: string;
  paradas: { cliente_id: string; carga_kg: number }[];
}

export interface ReoptimizacionRutaResultado {
  ruta_id: string;
  ok: boolean;
  mensaje: string;
}

export interface ReoptimizarDiaResponse {
  resultados: ReoptimizacionRutaResultado[];
}
