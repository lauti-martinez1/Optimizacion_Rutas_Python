import uuid
from dataclasses import dataclass
from itertools import pairwise

from sqlalchemy.orm import Session

from db import crud
from db.modelos import Cliente, Deposito, Usuario, Vehiculo
from routing.solver import resolver_ruteo
from services.osrm_client import obtener_matriz_osrm


class ErrorPlanificacion(Exception):
    """Error de negocio al planificar una ruta (falta vehículo/depósito,
    clientes inválidos, o el solver no encontró solución) — el router lo
    traduce a un 400 con el mensaje tal cual."""


@dataclass
class ParadaPlanificada:
    cliente: Cliente
    carga_kg: int
    orden: int
    distancia_acumulada_m: int


@dataclass
class ResultadoPlanificacion:
    vehiculo: Vehiculo
    deposito: Deposito
    paradas: list[ParadaPlanificada]
    distancia_total_m: int
    carga_total_kg: int
    distancia_sin_optimizar_m: int
    explicacion: str


def _distancia_recorrido(matriz_distancias: list, secuencia_nodos: list[int]) -> int:
    return sum(int(matriz_distancias[a][b]) for a, b in pairwise(secuencia_nodos))


def planificar_ruta(
    db: Session, usuario: Usuario, cargas_por_cliente: dict[uuid.UUID, int]
) -> ResultadoPlanificacion:
    """Arma y resuelve el CVRP para los clientes seleccionados por `usuario`,
    usando su vehículo y depósito ya configurados. Compartida por
    /rutas/optimizar (preview, no persiste) y /rutas/confirmar (persiste el
    mismo resultado) para no recalcular ni duplicar el armado del problema."""
    vehiculo = usuario.vehiculo
    if vehiculo is None:
        raise ErrorPlanificacion("No tenés un vehículo registrado.")

    duenio = usuario.ambito_dueño
    depositos = crud.listar_depositos(db, duenio)
    if not depositos:
        raise ErrorPlanificacion("Todavía no configuraste tu depósito de partida.")
    deposito = depositos[0]

    clientes = crud.obtener_clientes_propios(db, list(cargas_por_cliente), duenio)
    if len(clientes) != len(cargas_por_cliente):
        raise ErrorPlanificacion("Alguno de los lugares seleccionados ya no existe.")

    coordenadas = [{"latitud": deposito.latitud, "longitud": deposito.longitud}] + [
        {"latitud": cliente.latitud, "longitud": cliente.longitud} for cliente in clientes
    ]
    try:
        matrices = obtener_matriz_osrm(coordenadas)
    except Exception as error:
        raise ErrorPlanificacion(f"No se pudo calcular la ruta: {error}") from error

    matriz_distancias = matrices["matriz_distancias_metros"]
    demandas = [0] + [cargas_por_cliente[cliente.id] for cliente in clientes]

    # Un solo vehículo, sin ventanas horarias todavía (CVRP puro) — si el solver
    # falla, la causa casi siempre es esta y no una traza genérica de OR-Tools
    # ayuda al chofer a entender qué hacer. Se chequea antes de llamar al solver
    # para no depender de que agote el time_limit en un problema ya sin salida.
    carga_total = sum(demandas)
    if carga_total > vehiculo.capacidad_carga_kg:
        raise ErrorPlanificacion(
            f"La carga total de tu selección ({carga_total} kg) supera la capacidad "
            f"de tu vehículo ({vehiculo.capacidad_carga_kg} kg) — sacá algún bulto o "
            f"repartilo en más de una ruta."
        )

    resultado = resolver_ruteo(matriz_distancias, demandas, [vehiculo.capacidad_carga_kg])
    if resultado["estado"] == "Fallo":
        raise ErrorPlanificacion(resultado["mensaje"])

    # Nodo 0 = depósito (no es una parada), nodo i = clientes[i - 1] — mismo
    # orden en que se armaron `coordenadas` y `demandas` arriba.
    secuencia_nodos = [nodo["nodo_id"] for nodo in resultado["rutas"][0]["ruta_secuencial_nodos"]]
    paradas = []
    distancia_acumulada = 0
    orden = 0
    for nodo_previo, nodo_actual in pairwise(secuencia_nodos):
        # OSRM devuelve metros como float — el solver ya trunca a int para
        # los costos de arco (routing/solver.py:callback_distancia), acá
        # hay que hacer lo mismo para que sea consistente con esos valores.
        distancia_acumulada += int(matriz_distancias[nodo_previo][nodo_actual])
        if nodo_actual == 0:
            continue
        cliente = clientes[nodo_actual - 1]
        paradas.append(
            ParadaPlanificada(
                cliente=cliente,
                carga_kg=cargas_por_cliente[cliente.id],
                orden=orden,
                distancia_acumulada_m=distancia_acumulada,
            )
        )
        orden += 1

    # Comparación honesta: mismas distancias reales de OSRM, orden pedido
    # (tal como el chofer fue marcando los lugares) vs. orden que resolvió
    # el solver — así el ahorro es un dato real, no una estimación.
    indice_por_cliente = {cliente.id: i + 1 for i, cliente in enumerate(clientes)}
    secuencia_sin_optimizar = [0] + [indice_por_cliente[id_] for id_ in cargas_por_cliente] + [0]
    distancia_sin_optimizar_m = _distancia_recorrido(matriz_distancias, secuencia_sin_optimizar)
    distancia_total_m = resultado["rutas"][0]["distancia_recorrida_metros"]

    porcentaje_carga = round(
        100 * resultado["rutas"][0]["carga_total"] / vehiculo.capacidad_carga_kg
    )
    explicacion = (
        f"Elegimos este orden para recorrer la menor distancia posible entre las "
        f"{len(paradas)} paradas, respetando la capacidad de tu vehículo "
        f"({resultado['rutas'][0]['carga_total']}/{vehiculo.capacidad_carga_kg} kg, "
        f"{porcentaje_carga}%)."
    )

    return ResultadoPlanificacion(
        vehiculo=vehiculo,
        deposito=deposito,
        paradas=paradas,
        distancia_total_m=distancia_total_m,
        carga_total_kg=resultado["rutas"][0]["carga_total"],
        distancia_sin_optimizar_m=distancia_sin_optimizar_m,
        explicacion=explicacion,
    )
