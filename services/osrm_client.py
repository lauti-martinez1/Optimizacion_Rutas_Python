import requests

from core.config import settings


def _formatear_coordenadas(coordenadas: list) -> str:
    # OSRM pide las coordenadas en formato "longitud,latitud" (ojo, al revés que Google Maps)
    return ";".join(f"{coord['longitud']},{coord['latitud']}" for coord in coordenadas)


def _pedir_osrm(url: str) -> dict:
    """GET compartido por los endpoints de OSRM que usa este cliente (table/
    route): misma conexión, mismo chequeo de `code` y mismo envoltorio de
    error — cada función pública solo arma su URL y lee su forma de respuesta."""
    try:
        respuesta = requests.get(url, timeout=10)
        respuesta.raise_for_status()  # Lanza error si la API de OSRM falla
        datos = respuesta.json()
    except requests.exceptions.RequestException as e:
        raise Exception(f"Falla de conexión con la capa de tránsito (OSRM): {e!s}") from e

    if datos.get("code") != "Ok":
        raise ValueError(f"Error de OSRM: {datos.get('message', 'Desconocido')}")
    return datos


def obtener_matriz_osrm(coordenadas: list) -> dict:
    """
    Se conecta a la API de OSRM para obtener la matriz asimétrica
    de distancias y tiempos de tránsito reales.
    """
    string_coordenadas = _formatear_coordenadas(coordenadas)
    # Pedimos específicamente que nos devuelva 'distance' (metros) y 'duration' (segundos)
    url = f"{settings.osrm_base_url}/table/v1/driving/{string_coordenadas}?annotations=distance,duration"
    datos = _pedir_osrm(url)
    return {
        "matriz_distancias_metros": datos["distances"],
        "matriz_tiempos_segundos": datos["durations"],
    }


def obtener_geometria_osrm(coordenadas: list) -> list[tuple[float, float]]:
    """Traza real (siguiendo calles) que pasa por `coordenadas` en orden —
    para dibujar el camino en el mapa, no para calcular costos (eso lo hace
    obtener_matriz_osrm). Devuelve puntos en (latitud, longitud), al revés
    del GeoJSON que da OSRM, para que Leaflet los use sin transformar."""
    string_coordenadas = _formatear_coordenadas(coordenadas)
    url = (
        f"{settings.osrm_base_url}/route/v1/driving/{string_coordenadas}"
        "?overview=full&geometries=geojson"
    )
    datos = _pedir_osrm(url)
    coordenadas_geojson = datos["routes"][0]["geometry"]["coordinates"]
    return [(lat, lon) for lon, lat in coordenadas_geojson]
