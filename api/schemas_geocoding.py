from pydantic import BaseModel


class DireccionSugerida(BaseModel):
    direccion: str | None


class ResultadoBusquedaDireccion(BaseModel):
    direccion: str
    latitud: float
    longitud: float
