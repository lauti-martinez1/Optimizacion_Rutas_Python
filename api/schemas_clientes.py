import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ClienteCrear(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=200)
    direccion: str = Field(..., min_length=3, max_length=300)
    latitud: float = Field(..., ge=-90, le=90)
    longitud: float = Field(..., ge=-180, le=180)
    telefono: str | None = Field(default=None, max_length=30)


class ClienteActualizar(BaseModel):
    nombre: str | None = Field(default=None, min_length=2, max_length=200)
    direccion: str | None = Field(default=None, min_length=3, max_length=300)
    latitud: float | None = Field(default=None, ge=-90, le=90)
    longitud: float | None = Field(default=None, ge=-180, le=180)
    telefono: str | None = None


class ClientePublico(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    nombre: str
    direccion: str
    latitud: float
    longitud: float
    telefono: str | None
    activo: bool
    fecha_creacion: datetime
