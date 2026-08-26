from fastapi import APIRouter, Depends, Query

from api.dependencies import obtener_usuario_actual
from api.schemas_geocoding import DireccionSugerida
from db.modelos import Usuario
from services.nominatim_client import geocodificar_inverso

router = APIRouter(prefix="/api/v1/geocoding", tags=["Geocoding"])


@router.get("/inverso", response_model=DireccionSugerida)
def geocoding_inverso(
    latitud: float = Query(..., ge=-90, le=90),
    longitud: float = Query(..., ge=-180, le=180),
    usuario: Usuario = Depends(obtener_usuario_actual),
):
    return DireccionSugerida(direccion=geocodificar_inverso(latitud, longitud))
