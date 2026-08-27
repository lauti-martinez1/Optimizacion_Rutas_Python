from sqlalchemy.orm import Session

from db.modelos import EstadoParada, EstadoRuta, Ruta
from db.sesion import guardar
from routing.planificador import ErrorPlanificacion
from routing.solver import resolver_ruteo
from services.osrm_client import obtener_matriz_osrm


def reoptimizar_ruta(db: Session, ruta: Ruta) -> Ruta:
    """Re-resuelve solo las paradas pendientes/en_curso de `ruta`, dejando
    intactas las completadas/fallidas (snapshot y orden no se tocan). No hay
    tracking GPS: si la ruta ya arrancó, el punto de partida es la última
    parada resuelta (aproximación), no la posición real del vehículo."""
    resueltas = [
        p for p in ruta.paradas if p.estado in (EstadoParada.COMPLETADA, EstadoParada.FALLIDA)
    ]
    pendientes = sorted(
        (p for p in ruta.paradas if p.estado in (EstadoParada.PENDIENTE, EstadoParada.EN_CURSO)),
        key=lambda p: p.orden,
    )
    if not pendientes:
        raise ErrorPlanificacion("No quedan paradas pendientes para reoptimizar.")

    if ruta.estado == EstadoRuta.EN_CURSO and resueltas:
        ultima = max(resueltas, key=lambda p: p.orden)
        origen = {"latitud": ultima.latitud_snapshot, "longitud": ultima.longitud_snapshot}
        origen_nota = f"desde la última parada resuelta ({ultima.nombre_snapshot})"
    else:
        origen = {"latitud": ruta.deposito.latitud, "longitud": ruta.deposito.longitud}
        origen_nota = "desde el depósito"

    coordenadas = [origen] + [
        {"latitud": p.latitud_snapshot, "longitud": p.longitud_snapshot} for p in pendientes
    ]
    try:
        matrices = obtener_matriz_osrm(coordenadas)
    except Exception as error:
        raise ErrorPlanificacion(f"No se pudo recalcular la ruta: {error}") from error

    matriz_distancias = matrices["matriz_distancias_metros"]
    # Lo ya entregado salió del vehículo: no se resta de la capacidad ni se
    # vuelve a contar como demanda, solo se resuelve lo que falta repartir.
    demandas = [0] + [p.demanda_carga_snapshot for p in pendientes]

    resultado = resolver_ruteo(matriz_distancias, demandas, [ruta.capacidad_vehiculo_kg])
    if resultado["estado"] == "Fallo":
        raise ErrorPlanificacion(resultado["mensaje"])

    secuencia_nodos = [n["nodo_id"] for n in resultado["rutas"][0]["ruta_secuencial_nodos"]]
    orden_inicial = max((p.orden for p in resueltas), default=-1) + 1

    # Dos pasadas: la unique constraint (ruta_id, orden) rompería si el nuevo
    # orden de una parada pisa temporalmente el orden actual de otra
    # pendiente que todavía no se actualizó en este mismo loop.
    for offset, parada in enumerate(pendientes):
        parada.orden = -(offset + 1)
        guardar(db, parada)

    orden = orden_inicial
    for nodo in secuencia_nodos:
        if nodo == 0:
            continue
        parada = pendientes[nodo - 1]
        parada.orden = orden
        guardar(db, parada)
        orden += 1

    ruta.distancia_total_m = resultado["rutas"][0]["distancia_recorrida_metros"]
    ruta.explicacion = (
        f"Ruta reoptimizada: se recalcularon las {len(pendientes)} paradas pendientes "
        f"{origen_nota} — no hay posición GPS en vivo, así que es una aproximación."
    )
    return guardar(db, ruta)
