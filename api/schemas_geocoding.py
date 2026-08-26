from pydantic import BaseModel


class DireccionSugerida(BaseModel):
    direccion: str | None
