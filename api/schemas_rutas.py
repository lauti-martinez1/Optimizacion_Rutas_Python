import uuid
from datetime import UTC, date, datetime

from pydantic import BaseModel, ConfigDict, Field, computed_field

from db.modelos import EstadoParada, EstadoRuta, TipoProblema

# Margen antes del cierre de una ventana horaria para marcar una parada
# "en riesgo" (todavía no vencida, pero al filo) — puramente de UI, no
# afecta al solver.
MARGEN_RIESGO_MIN = 15


def _minuto_del_dia(momento: datetime) -> int:
    local = momento.astimezone()
    return local.hour * 60 + local.minute


def _usa_ventanas_horarias(tipo_problema: TipoProblema) -> bool:
    return tipo_problema == TipoProblema.VRPTW


class ParadaSeleccionada(BaseModel):
    cliente_id: uuid.UUID
    carga_kg: int = Field(..., ge=0)
    # Bultos/unidades — informativo, no entra en la dimensión de capacidad
    # del solver (esa sigue siendo carga_kg). Default 0 para no romper
    # clientes de la API que todavía no lo mandan.
    unidades: int = Field(0, ge=0)
    ventana_inicio: int | None = Field(None, ge=0, le=1440)
    ventana_fin: int | None = Field(None, ge=0, le=1440)


class OptimizarRutaRequest(BaseModel):
    paradas: list[ParadaSeleccionada] = Field(..., min_length=1)
    usa_ventanas_horarias: bool = False


class ParadaPreview(BaseModel):
    cliente_id: uuid.UUID
    nombre: str
    direccion: str
    orden: int
    carga_kg: int
    unidades: int
    distancia_acumulada_m: int
    ventana_inicio: int | None = None
    ventana_fin: int | None = None
    hora_estimada_llegada: int | None = None


class RutaPreview(BaseModel):
    paradas: list[ParadaPreview]
    distancia_total_m: int
    carga_total_kg: int
    distancia_sin_optimizar_m: int
    ahorro_m: int
    explicacion: str
    usa_ventanas_horarias: bool = False
    hora_fin_estimada_min: int | None = None


class GeometriaRuta(BaseModel):
    tramos: list[list[tuple[float, float]]]


class ParadaRutaPublica(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    cliente_id: uuid.UUID
    orden: int
    estado: EstadoParada
    nombre_snapshot: str
    direccion_snapshot: str
    latitud_snapshot: float
    longitud_snapshot: float
    demanda_carga_snapshot: int
    unidades_snapshot: int
    distancia_acumulada_m: int
    ventana_inicio_snapshot: int | None
    ventana_fin_snapshot: int | None
    hora_estimada_llegada: int | None
    hora_real_salida: datetime | None

    @computed_field
    @property
    def en_riesgo(self) -> bool:
        """Solo tiene sentido con ventana horaria y mientras la parada
        sigue sin completarse — el solver ya garantiza que, de haber
        solución, toda ventana se cumple *en el plan*; esto marca cuándo el
        reloj real se está acercando al límite planificado."""
        if self.ventana_fin_snapshot is None or self.estado not in (
            EstadoParada.PENDIENTE,
            EstadoParada.EN_CURSO,
        ):
            return False
        ahora_min = _minuto_del_dia(datetime.now(UTC))
        return ahora_min >= self.ventana_fin_snapshot - MARGEN_RIESGO_MIN

    @computed_field
    @property
    def ventana_cumplida(self) -> bool | None:
        """None: no aplica (sin ventana, o todavía no se completó). Si no,
        si la salida real quedó dentro de la ventana planificada."""
        if self.ventana_fin_snapshot is None or self.hora_real_salida is None:
            return None
        return _minuto_del_dia(self.hora_real_salida) <= self.ventana_fin_snapshot


class DepositoResumen(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    latitud: float
    longitud: float


class RutaPublica(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    fecha: date
    estado: EstadoRuta
    tipo_problema: TipoProblema
    distancia_total_m: int | None
    hora_inicio_real: datetime | None
    hora_fin_estimada_min: int | None
    fecha_creacion: datetime
    deposito: DepositoResumen
    capacidad_vehiculo_kg: int
    explicacion: str | None
    paradas: list[ParadaRutaPublica]

    @computed_field
    @property
    def usa_ventanas_horarias(self) -> bool:
        return _usa_ventanas_horarias(self.tipo_problema)


class RutaHistorialItem(BaseModel):
    """Resumen liviano para la vista de mes del almanaque — sin las
    paradas, que solo hacen falta al abrir el detalle de un día.
    `paradas_total`/`paradas_completadas` se derivan de `Ruta.paradas` en
    el router (no hay attribute plano en el modelo), así que este schema
    siempre se construye a mano, nunca con `model_validate` directo."""

    id: uuid.UUID
    fecha: date
    estado: EstadoRuta
    tipo_problema: TipoProblema
    distancia_total_m: int | None
    paradas_total: int
    paradas_completadas: int

    @computed_field
    @property
    def usa_ventanas_horarias(self) -> bool:
        return _usa_ventanas_horarias(self.tipo_problema)
