import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from db.modelos import TipoIncidencia


class IncidenciaCrear(BaseModel):
    ruta_id: uuid.UUID
    parada_id: uuid.UUID | None = None
    tipo: TipoIncidencia
    descripcion: str | None = Field(default=None, max_length=2000)


class IncidenciaPublica(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    ruta_id: uuid.UUID
    parada_id: uuid.UUID | None
    tipo: TipoIncidencia
    descripcion: str | None
    reportado_por_usuario_id: uuid.UUID
    fecha_hora: datetime
