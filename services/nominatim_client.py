import requests

from core.config import settings

# Nominatim exige un User-Agent que identifique la app (política de uso del
# servidor público) — sin esto puede devolver 403.
_USER_AGENT = "optimizacion-rutas-gran-mendoza/1.0"


def _pedir_nominatim(endpoint: str, parametros: dict) -> dict | list | None:
    """GET compartido por los dos endpoints de Nominatim que usa este cliente
    (reverse/search): mismo User-Agent, mismo timeout y mismo criterio
    best-effort (None si Nominatim no responde o falla) — cada función
    pública solo arma sus parámetros y lee su propia forma de respuesta.
    Mismo patrón que _pedir_osrm en services/osrm_client.py."""
    url = f"{settings.nominatim_base_url}/{endpoint}"
    try:
        respuesta = requests.get(
            url, params=parametros, headers={"User-Agent": _USER_AGENT}, timeout=5
        )
        respuesta.raise_for_status()
        return respuesta.json()
    except requests.exceptions.RequestException:
        return None


def geocodificar_inverso(latitud: float, longitud: float) -> str | None:
    """Traduce un punto del mapa a una dirección legible. None si Nominatim
    no encuentra nada o falla — el llamador no debe tratarlo como error
    fatal, es un autocompletado, no un dato obligatorio."""
    datos = _pedir_nominatim("reverse", {"lat": latitud, "lon": longitud, "format": "jsonv2"})
    return datos.get("display_name") if datos else None


def geocodificar(direccion: str, limite: int = 5) -> list[dict]:
    """Busca coincidencias para un texto de dirección escrito a mano — lo
    inverso de geocodificar_inverso (texto -> puntos, no punto -> texto).
    countrycodes=ar es un sesgo de relevancia, no un filtro estricto: no
    hay todavía un dataset propio del Gran Mendoza (CLAUDE.md ítem 9) como
    para acotar por bounding box sin arriesgarse a descartar resultados
    válidos. Devuelve [] si Nominatim no encuentra nada o falla — mismo
    criterio best-effort que geocodificar_inverso."""
    datos = _pedir_nominatim(
        "search",
        {"q": direccion, "format": "jsonv2", "limit": limite, "countrycodes": "ar"},
    )
    if not datos:
        return []

    return [
        {
            "direccion": resultado["display_name"],
            "latitud": float(resultado["lat"]),
            "longitud": float(resultado["lon"]),
        }
        for resultado in datos
    ]
