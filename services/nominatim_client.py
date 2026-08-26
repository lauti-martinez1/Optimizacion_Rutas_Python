import requests

from core.config import settings

# Nominatim exige un User-Agent que identifique la app (política de uso del
# servidor público) — sin esto puede devolver 403.
_USER_AGENT = "optimizacion-rutas-gran-mendoza/1.0"


def geocodificar_inverso(latitud: float, longitud: float) -> str | None:
    """Traduce un punto del mapa a una dirección legible. None si Nominatim
    no encuentra nada o falla — el llamador no debe tratarlo como error
    fatal, es un autocompletado, no un dato obligatorio."""
    url = f"{settings.nominatim_base_url}/reverse"
    parametros = {"lat": latitud, "lon": longitud, "format": "jsonv2"}

    try:
        respuesta = requests.get(
            url, params=parametros, headers={"User-Agent": _USER_AGENT}, timeout=5
        )
        respuesta.raise_for_status()
        datos = respuesta.json()
    except requests.exceptions.RequestException:
        return None

    return datos.get("display_name")
