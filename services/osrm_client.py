import requests

from core.config import settings


def obtener_matriz_osrm(coordenadas: list) -> dict:
    """
    Se conecta a la API de OSRM para obtener la matriz asimétrica
    de distancias y tiempos de tránsito reales.
    """
    # OSRM pide las coordenadas en formato "longitud,latitud" (ojo, al revés que Google Maps)
    coords_formateadas = []
    for coord in coordenadas:
        coords_formateadas.append(f"{coord['longitud']},{coord['latitud']}")

    string_coordenadas = ";".join(coords_formateadas)

    # Armamos la URL para la API de OSRM (perfil driving/auto)
    # Pedimos específicamente que nos devuelva 'distance' (metros) y 'duration' (segundos)
    url = f"{settings.osrm_base_url}/table/v1/driving/{string_coordenadas}?annotations=distance,duration"

    try:
        respuesta = requests.get(url, timeout=10)
        respuesta.raise_for_status()  # Lanza error si la API de OSRM falla
        datos = respuesta.json()

        if datos.get("code") != "Ok":
            raise ValueError(f"Error de OSRM: {datos.get('message', 'Desconocido')}")

        return {
            "matriz_distancias_metros": datos["distances"],
            "matriz_tiempos_segundos": datos["durations"],
        }

    except requests.exceptions.RequestException as e:
        raise Exception(f"Falla de conexión con la capa de tránsito (OSRM): {e!s}")
