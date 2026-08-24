from fastapi import APIRouter, HTTPException

from api.schemas import PeticionRutas
from routing.solver import resolver_ruteo
from services.osrm_client import obtener_matriz_osrm

router = APIRouter(tags=["Ruteo"])


@router.post("/api/v1/optimizar")
async def optimizar_rutas(datos_dia: PeticionRutas):

    if not datos_dia.clientes or not datos_dia.vehiculos:
        raise HTTPException(status_code=400, detail="Faltan clientes o vehículos.")

    if datos_dia.tipo_problema == "VRPTW":
        if not datos_dia.deposito.ventana_horaria:
            raise HTTPException(
                status_code=400, detail="El depósito debe tener ventana horaria para VRPTW."
            )
        for cliente in datos_dia.clientes:
            if not cliente.ventana_horaria:
                raise HTTPException(
                    status_code=400, detail=f"Falta ventana en {cliente.id_cliente}."
                )

    try:
        coordenadas_completas = [
            {
                "latitud": datos_dia.deposito.ubicacion.latitud,
                "longitud": datos_dia.deposito.ubicacion.longitud,
            }
        ]
        for cliente in datos_dia.clientes:
            coordenadas_completas.append(
                {"latitud": cliente.ubicacion.latitud, "longitud": cliente.ubicacion.longitud}
            )

        matrices = obtener_matriz_osrm(coordenadas_completas)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    try:
        matriz_distancias = matrices["matriz_distancias_metros"]
        matriz_tiempos = matrices["matriz_tiempos_segundos"]

        demandas = [0] + [cliente.demanda_carga for cliente in datos_dia.clientes]
        capacidades_vehiculos = [vehiculo.capacidad for vehiculo in datos_dia.vehiculos]

        # Variables de tiempo
        tiempos_servicio = [0] + [cliente.tiempo_servicio for cliente in datos_dia.clientes]
        ventanas_horarias = []
        if datos_dia.tipo_problema == "VRPTW":
            ventanas_horarias.append(
                (datos_dia.deposito.ventana_horaria.inicio, datos_dia.deposito.ventana_horaria.fin)
            )
            for cliente in datos_dia.clientes:
                ventanas_horarias.append(
                    (cliente.ventana_horaria.inicio, cliente.ventana_horaria.fin)
                )

        resultado = resolver_ruteo(
            matriz_distancias,
            demandas,
            capacidades_vehiculos,
            matriz_tiempos,
            tiempos_servicio,
            ventanas_horarias,
            datos_dia.tipo_problema,
        )

        if resultado["estado"] == "Fallo":
            raise HTTPException(status_code=400, detail=resultado["mensaje"])

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error OR-Tools: {e!s}")

    # Mapeo de salida mejorado
    nombres_nodos = ["Depósito"] + [cliente.id_cliente for cliente in datos_dia.clientes]
    rutas_finales = []

    for ruta_or in resultado["rutas"]:
        secuencia = []
        for parada in ruta_or["ruta_secuencial_nodos"]:
            nombre = nombres_nodos[parada["nodo_id"]]

            # Si es VRPTW, le pegamos el texto con la hora al lado del nombre
            if datos_dia.tipo_problema == "VRPTW":
                texto_parada = f"{nombre} (Llegada estimada: Min {parada['minuto_llegada']})"
            else:
                texto_parada = nombre

            secuencia.append(texto_parada)

        rutas_finales.append(
            {
                "vehiculo": datos_dia.vehiculos[ruta_or["vehiculo"]].id_vehiculo,
                "ruta_secuencial": secuencia,
                "carga_total": ruta_or["carga_total"],
                "distancia_recorrida_metros": ruta_or["distancia_recorrida_metros"],
            }
        )

    return {
        "mensaje": f"Optimización {datos_dia.tipo_problema} exitosa",
        "distancia_total_flota_metros": resultado["distancia_total_flota"],
        "rutas": rutas_finales,
    }
