import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from db.modelos import TipoVehiculo


class VehiculoCrear(BaseModel):
    tipo_vehiculo: TipoVehiculo
    patente: str = Field(..., min_length=5, max_length=12)
    capacidad_carga_kg: int = Field(..., gt=0)
    usuario_id: uuid.UUID | None = None


class VehiculoActualizar(BaseModel):
    tipo_vehiculo: TipoVehiculo | None = None
    capacidad_carga_kg: int | None = Field(default=None, gt=0)
    usuario_id: uuid.UUID | None = None
    activo: bool | None = None


class VehiculoPublico(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tipo_vehiculo: TipoVehiculo
    patente: str
    capacidad_carga_kg: int
    activo: bool
    usuario_id: uuid.UUID | None
    fecha_creacion: datetime
