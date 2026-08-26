import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from db.modelos import EstadoParada, EstadoRuta


class ParadaSeleccionada(BaseModel):
    cliente_id: uuid.UUID
    carga_kg: int = Field(..., ge=0)


class OptimizarRutaRequest(BaseModel):
    paradas: list[ParadaSeleccionada] = Field(..., min_length=1)


class ParadaPreview(BaseModel):
    cliente_id: uuid.UUID
    nombre: str
    direccion: str
    orden: int
    carga_kg: int
    distancia_acumulada_m: int


class RutaPreview(BaseModel):
    paradas: list[ParadaPreview]
    distancia_total_m: int
    carga_total_kg: int


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


class RutaPublica(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    fecha: date
    estado: EstadoRuta
    distancia_total_m: int | None
    fecha_creacion: datetime
    paradas: list[ParadaRutaPublica]
