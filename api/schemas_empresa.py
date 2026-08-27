import uuid
from datetime import date

from pydantic import BaseModel, Field

from api.schemas_rutas import DepositoResumen, ParadaSeleccionada
from db.modelos import EstadoParada, EstadoRuta


class ChoferResumenEmpresa(BaseModel):
    id: uuid.UUID
    nombre_completo: str
    email: str
    vehiculo_patente: str | None


class EmpresaAsignarRutaRequest(BaseModel):
    chofer_id: uuid.UUID
    paradas: list[ParadaSeleccionada] = Field(..., min_length=1)


class RutaResumenEmpresa(BaseModel):
    id: uuid.UUID
    chofer_id: uuid.UUID
    chofer_nombre: str
    vehiculo_patente: str
    estado: EstadoRuta
    fecha: date
    distancia_total_m: int | None
    deposito: DepositoResumen
    explicacion: str | None
    total_paradas: int
    paradas_completadas: int
    paradas_fallidas: int
    paradas_pendientes: int
    en_riesgo: bool


class KpisEmpresaDia(BaseModel):
    fecha: date
    rutas_activas: int
    rutas_completadas: int
    rutas_en_riesgo: int
    total_paradas: int
    paradas_completadas: int
    paradas_pendientes: int
    paradas_fallidas: int


class PedidoPublico(BaseModel):
    id: uuid.UUID
    ruta_id: uuid.UUID
    fecha: date
    cliente_nombre: str
    direccion: str
    carga_kg: int
    ventana_inicio: int | None
    ventana_fin: int | None
    estado: EstadoParada
    orden: int
    chofer_nombre: str
    vehiculo_patente: str


class ReoptimizacionRutaResultado(BaseModel):
    ruta_id: uuid.UUID
    ok: bool
    mensaje: str


class ReoptimizarDiaResponse(BaseModel):
    resultados: list[ReoptimizacionRutaResultado]
