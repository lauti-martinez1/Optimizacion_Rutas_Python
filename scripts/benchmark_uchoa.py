import os
import glob
import math
import time
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp

# ==========================================
# 1. LECTURA DE ARCHIVOS UCHOA (TSPLIB FORMAT)
# ==========================================
def leer_instancia_uchoa(ruta_vrp):
    nodos = []
    capacidad = 0
    vehiculos = 0
    
    with open(ruta_vrp, 'r') as f:
        lineas = f.readlines()
        
    seccion_actual = None
    
    for linea in lineas:
        linea = linea.strip()
        if not linea: continue
        
        # Extraer la cantidad de vehículos del nombre (ej: X-n101-k25 -> 25 vehículos)
        if linea.startswith("NAME"):
            partes_nombre = linea.split("-k")
            if len(partes_nombre) > 1:
                vehiculos = int(partes_nombre[1])

              
        elif linea.startswith("CAPACITY"):
            capacidad = int(linea.split(":")[1].strip())
            
        elif linea.startswith("NODE_COORD_SECTION"):
            seccion_actual = "COORD"
            continue
        elif linea.startswith("DEMAND_SECTION"):
            seccion_actual = "DEMAND"
            continue
        elif linea.startswith("DEPOT_SECTION"):
            break
            
        if seccion_actual == "COORD":
            datos = linea.split()
            # Uchoa usa índices base 1, los guardamos en orden
            nodos.append({"id": int(datos[0]), "x": float(datos[1]), "y": float(datos[2]), "demanda": 0})
            
        elif seccion_actual == "DEMAND":
            datos = linea.split()
            id_nodo = int(datos[0])
            demanda = int(datos[1])
            # Actualizamos la demanda del nodo correspondiente
            nodos[id_nodo - 1]["demanda"] = demanda

    return vehiculos, capacidad, nodos

def leer_solucion_uchoa(ruta_sol):
    if not os.path.exists(ruta_sol):
        return None
        
    with open(ruta_sol, 'r') as f:
        for linea in f:
            if "Cost" in linea:
                # Extraemos el costo de la solución (ej: "Cost 27471")
                return float(linea.replace("Cost", "").strip())
    return None

# ==========================================
# 2. MOTOR MATEMÁTICO OR-TOOLS (Puro CVRP)
# ==========================================
def resolver_benchmark_cvrp(vehiculos, capacidad, nodos):
    num_nodos = len(nodos)
    manager = pywrapcp.RoutingIndexManager(num_nodos, vehiculos, 0)
    routing = pywrapcp.RoutingModel(manager)

    def distancia_euclidiana(from_index, to_index):
        n1 = nodos[manager.IndexToNode(from_index)]
        n2 = nodos[manager.IndexToNode(to_index)]
        dist = math.hypot(n1['x'] - n2['x'], n1['y'] - n2['y'])
        # Las distancias en Uchoa tradicionalmente se redondean al entero más cercano
        return int(round(dist))

    transit_callback_index = routing.RegisterTransitCallback(distancia_euclidiana)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    def demanda_callback(from_index):
        return nodos[manager.IndexToNode(from_index)]['demanda']
    
    demand_callback_index = routing.RegisterUnaryTransitCallback(demanda_callback)
    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index, 0, [capacidad] * vehiculos, True, 'Capacidad')

    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    # Usamos la estrategia que nos dio 100% de factibilidad antes
    search_parameters.first_solution_strategy = (routing_enums_pb2.FirstSolutionStrategy.AUTOMATIC)
    search_parameters.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    
    # Tiempo límite para el benchmark (ej: 30 segundos)
    search_parameters.time_limit.seconds = 60

    start_time = time.time()
    solucion = routing.SolveWithParameters(search_parameters)
    tiempo_ejecucion = time.time() - start_time

    if solucion:
        costo_final = solucion.ObjectiveValue()
        vehiculos_usados = sum(1 for i in range(vehiculos) if routing.IsVehicleUsed(solucion, i))
        return costo_final, vehiculos_usados, tiempo_ejecucion, True
        
    return None, None, tiempo_ejecucion, False

# ==========================================
# 3. EJECUCIÓN POR LOTES (BATCH)
# ==========================================
if __name__ == "__main__":
    archivos_vrp = sorted(glob.glob("data/uchoa/*.vrp"))
    
    if not archivos_vrp:
        print("❌ No se encontraron archivos .vrp en data/uchoa/")
        exit()

    print("Iniciando Benchmark CVRP (Uchoa) por Lotes...")
    print("-" * 90)
    print(f"{'Instancia':<15} | {'Vehículos':<10} | {'Costo OR-Tools':<15} | {'Costo BKS':<12} | {'Gap %':<8} | {'Tiempo (s)':<12} | {'Factible'}")
    print("-" * 90)

    total_instancias = 0
    factibles = 0
    suma_gaps = 0

    for archivo_vrp in archivos_vrp:
        nombre_instancia = os.path.basename(archivo_vrp).replace(".vrp", "")
        archivo_sol = archivo_vrp.replace(".vrp", ".sol")
        
        vehiculos, capacidad, nodos = leer_instancia_uchoa(archivo_vrp)
        costo_referencia = leer_solucion_uchoa(archivo_sol)
        
        costo_ortools, vehiculos_usados, tiempo, factible = resolver_benchmark_cvrp(vehiculos, capacidad, nodos)
        
        total_instancias += 1
        if factible:
            factibles += 1
            if costo_referencia:
                gap = ((costo_ortools - costo_referencia) / costo_referencia) * 100
                suma_gaps += gap
                gap_str = f"{gap:.2f}"
                bks_str = f"{costo_referencia:.2f}"
            else:
                gap_str = "N/A"
                bks_str = "N/A"
                
            print(f"{nombre_instancia:<15} | {vehiculos_usados:<10} | {costo_ortools:<15.2f} | {bks_str:<12} | {gap_str:<8} | {tiempo:<12.2f} | {'Sí'}")
        else:
            bks_str = f"{costo_referencia:.2f}" if costo_referencia else "N/A"
            print(f"{nombre_instancia:<15} | {'-':<10} | {'-':<15} | {bks_str:<12} | {'-':<8} | {tiempo:<12.2f} | {'No'}")

    print("-" * 90)
    print(f"RESUMEN: {factibles}/{total_instancias} instancias factibles.")
    if factibles > 0 and total_instancias > 0:
        print(f"Gap Promedio: {suma_gaps/factibles:.2f}%")