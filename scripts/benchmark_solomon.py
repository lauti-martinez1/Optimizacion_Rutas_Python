import os
import glob
import math
import time
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp

# ==========================================
# 1. LECTURA DE ARCHIVOS ORIGINALES
# ==========================================
def leer_instancia_solomon(ruta_txt):
    with open(ruta_txt, 'r') as f:
        lineas = f.readlines()
    
    vehiculos, capacidad = map(int, lineas[4].split())
    nodos = []
    
    for linea in lineas[9:]:
        if not linea.strip(): continue
        datos = linea.split()
        nodos.append({
            "id": int(datos[0]),
            "x": float(datos[1]),
            "y": float(datos[2]),
            "demanda": int(datos[3]),
            "inicio": int(datos[4]),
            "fin": int(datos[5]),
            "servicio": int(datos[6])
        })
    return vehiculos, capacidad, nodos

def leer_solucion_solomon(ruta_sol):
    if not os.path.exists(ruta_sol):
        return None
        
    with open(ruta_sol, 'r') as f:
        for linea in f:
            if "Cost" in linea:
                return float(linea.replace("Cost", "").strip())
    return None

# ==========================================
# 2. MOTOR MATEMÁTICO OR-TOOLS
# ==========================================
def resolver_benchmark(vehiculos, capacidad, nodos):
    # Aumentamos la precisión a 2 decimales para mayor rigor científico
    FACTOR_ESCALA = 100 
    
    num_nodos = len(nodos)
    manager = pywrapcp.RoutingIndexManager(num_nodos, vehiculos, 0)
    routing = pywrapcp.RoutingModel(manager)

    def distancia_euclidiana(from_index, to_index):
        n1 = nodos[manager.IndexToNode(from_index)]
        n2 = nodos[manager.IndexToNode(to_index)]
        dist = math.hypot(n1['x'] - n2['x'], n1['y'] - n2['y'])
        # Usamos round antes de int para no perder milímetros por truncamiento
        return int(round(dist * FACTOR_ESCALA))

    transit_callback_index = routing.RegisterTransitCallback(distancia_euclidiana)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    def demanda_callback(from_index):
        return nodos[manager.IndexToNode(from_index)]['demanda']
    
    demand_callback_index = routing.RegisterUnaryTransitCallback(demanda_callback)
    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index, 0, [capacidad] * vehiculos, True, 'Capacidad')

    def tiempo_callback(from_index, to_index):
        origen = manager.IndexToNode(from_index)
        destino = manager.IndexToNode(to_index)
        n1 = nodos[origen]
        n2 = nodos[destino]
        tiempo_viaje = math.hypot(n1['x'] - n2['x'], n1['y'] - n2['y'])
        return int(round((n1['servicio'] + tiempo_viaje) * FACTOR_ESCALA))

    time_callback_index = routing.RegisterTransitCallback(tiempo_callback)
    
    # ¡ARREGLO ACÁ! Aumentamos el techo de la holgura y límite a 10 millones 
    # para que no crashee con el FACTOR_ESCALA = 100 en instancias largas.
    routing.AddDimension(
        time_callback_index, 10000000, 10000000, False, 'Tiempo'
    )
    
    time_dimension = routing.GetDimensionOrDie('Tiempo')
    for i in range(num_nodos):
        index = manager.NodeToIndex(i)
        time_dimension.CumulVar(index).SetRange(
            int(nodos[i]['inicio'] * FACTOR_ESCALA), 
            int(nodos[i]['fin'] * FACTOR_ESCALA)
        )

    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (routing_enums_pb2.FirstSolutionStrategy.PARALLEL_CHEAPEST_INSERTION)
    search_parameters.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    search_parameters.time_limit.seconds = 60

    start_time = time.time()
    solucion = routing.SolveWithParameters(search_parameters)
    tiempo_ejecucion = time.time() - start_time

    if solucion:
        costo_final = solucion.ObjectiveValue() / FACTOR_ESCALA
        vehiculos_usados = sum(1 for i in range(vehiculos) if routing.IsVehicleUsed(solucion, i))
        return costo_final, vehiculos_usados, tiempo_ejecucion, True
        
    return None, None, tiempo_ejecucion, False

# ==========================================
# 3. EJECUCIÓN POR LOTES (BATCH)
# ==========================================
if __name__ == "__main__":
    # Busca todos los .txt en la carpeta solomon
    archivos_txt = sorted(glob.glob("data/solomon/*.txt"))
    
    if not archivos_txt:
        print("❌ No se encontraron archivos .txt en data/solomon/")
        exit()

    print("Iniciando Benchmark Académico por Lotes...")
    print("-" * 90)
    print(f"{'Instancia':<12} | {'Vehículos':<10} | {'Costo OR-Tools':<15} | {'Costo BKS':<12} | {'Gap %':<8} | {'Tiempo (s)':<12} | {'Factible'}")
    print("-" * 90)

    total_instancias = 0
    factibles = 0
    suma_gaps = 0

    for archivo_txt in archivos_txt:
        nombre_instancia = os.path.basename(archivo_txt).replace(".txt", "")
        archivo_sol = archivo_txt.replace(".txt", ".sol")
        
        vehiculos, capacidad, nodos = leer_instancia_solomon(archivo_txt)
        costo_referencia = leer_solucion_solomon(archivo_sol)
        
        costo_ortools, vehiculos_usados, tiempo, factible = resolver_benchmark(vehiculos, capacidad, nodos)
        
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
                
            print(f"{nombre_instancia:<12} | {vehiculos_usados:<10} | {costo_ortools:<15.2f} | {bks_str:<12} | {gap_str:<8} | {tiempo:<12.2f} | {'Sí'}")
        else:
            bks_str = f"{costo_referencia:.2f}" if costo_referencia else "N/A"
            print(f"{nombre_instancia:<12} | {'-':<10} | {'-':<15} | {bks_str:<12} | {'-':<8} | {tiempo:<12.2f} | {'No'}")

    print("-" * 90)
    print(f"RESUMEN: {factibles}/{total_instancias} instancias factibles.")
    if factibles > 0 and total_instancias > 0:
        print(f"Gap Promedio: {suma_gaps/factibles:.2f}%")