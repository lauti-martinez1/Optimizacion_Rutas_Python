from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp

def resolver_cvrp(matriz_distancias: list, demandas: list, capacidades_vehiculos: list) -> dict:
    """
    Motor lógico usando Google OR-Tools para resolver el CVRP.
    """
    # 1. Configuración básica de la instancia
    num_nodos = len(matriz_distancias)
    num_vehiculos = len(capacidades_vehiculos)
    nodo_deposito = 0 # El depósito siempre es el índice 0

    # 2. Inicialización del Administrador de Rutas y el Modelo
    manager = pywrapcp.RoutingIndexManager(num_nodos, num_vehiculos, nodo_deposito)
    routing = pywrapcp.RoutingModel(manager)

    # 3. Función de Costo (Distancias)
    def callback_distancia(from_index, to_index):
        nodo_origen = manager.IndexToNode(from_index)
        nodo_destino = manager.IndexToNode(to_index)
        # Retorna la distancia real de OSRM entre los dos nodos
        return int(matriz_distancias[nodo_origen][nodo_destino])

    indice_transito = routing.RegisterTransitCallback(callback_distancia)
    routing.SetArcCostEvaluatorOfAllVehicles(indice_transito)

    # 4. Dimensión de Capacidad (Restricciones del CVRP)
    def callback_demanda(from_index):
        nodo_origen = manager.IndexToNode(from_index)
        return demandas[nodo_origen]

    indice_demanda = routing.RegisterUnaryTransitCallback(callback_demanda)
    routing.AddDimensionWithVehicleCapacity(
        indice_demanda,
        0,  # Sin holgura en la capacidad
        capacidades_vehiculos,  # Límite físico de carga inyectado
        True,  # Empezar en cero
        'Capacidad'
    )

    # 5. Estrategia de Búsqueda (Como está definido en el paper)
    parametros_busqueda = pywrapcp.DefaultRoutingSearchParameters()
    
    # Búsqueda inicial rápida: Path Cheapest Arc
    parametros_busqueda.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC)
        
    # Metaheurística de refinamiento: Guided Local Search
    parametros_busqueda.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH)
        
    # Límite de tiempo computacional (5 segundos por ahora para pruebas rápidas)
    parametros_busqueda.time_limit.seconds = 5

    # 6. ¡Resolver!
    solucion = routing.SolveWithParameters(parametros_busqueda)

    # 7. Serialización de Salida
    if not solucion:
        return {"estado": "Fallo", "mensaje": "No se encontró solución factible."}

    rutas_vehiculos = []
    distancia_total = 0

    for id_vehiculo in range(num_vehiculos):
        indice = routing.Start(id_vehiculo)
        ruta = []
        carga_ruta = 0
        distancia_ruta = 0
        
        while not routing.IsEnd(indice):
            nodo_actual = manager.IndexToNode(indice)
            ruta.append(nodo_actual)
            carga_ruta += demandas[nodo_actual]
            
            indice_anterior = indice
            indice = solucion.Value(routing.NextVar(indice))
            distancia_ruta += routing.GetArcCostForVehicle(indice_anterior, indice, id_vehiculo)

        ruta.append(manager.IndexToNode(indice)) # Agrega el depósito al final
        rutas_vehiculos.append({
            "vehiculo": id_vehiculo,
            "ruta_secuencial_nodos": ruta,
            "carga_total": carga_ruta,
            "distancia_recorrida_metros": distancia_ruta
        })
        distancia_total += distancia_ruta

    return {
        "estado": "Exito",
        "rutas": rutas_vehiculos,
        "distancia_total_flota": distancia_total
    }