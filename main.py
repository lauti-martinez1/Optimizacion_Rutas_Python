from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Literal

# Importamos los servicios externos e internos
from services.osrm_client import obtener_matriz_osrm
from routing.solver import resolver_cvrp

app = FastAPI(
    title="API de Optimización de Rutas - Gran Mendoza",
    description="Motor de optimización VRP basado en Google OR-Tools",
    version="1.0.3"
)

# ==========================================
# FASE DE MODELADO Y PARSING (Esquemas)
# ==========================================
class VentanaHoraria(BaseModel):
    inicio: int = Field(..., description="Minuto de inicio de la ventana")
    fin: int = Field(..., description="Minuto de fin de la ventana")

class Coordenada(BaseModel):
    latitud: float
    longitud: float

class Cliente(BaseModel):
    id_cliente: str
    ubicacion: Coordenada
    demanda_carga: int = Field(..., ge=0, description="Demanda de carga del cliente")
    tiempo_servicio: int = Field(default=0, description="Tiempo en minutos para realizar la entrega")
    ventana_horaria: Optional[VentanaHoraria] = None

class Deposito(BaseModel):
    ubicacion: Coordenada
    ventana_horaria: Optional[VentanaHoraria] = None

class Vehiculo(BaseModel):
    id_vehiculo: str
    capacidad: int = Field(..., gt=0, description="Límite físico de carga")

class PeticionRutas(BaseModel):
    tipo_problema: Literal["CVRP", "VRPTW"]
    deposito: Deposito
    clientes: List[Cliente]
    vehiculos: List[Vehiculo]

# ==========================================
# ENDPOINT HTTP POST
# ==========================================
@app.post("/api/v1/optimizar", tags=["Ruteo"])
async def optimizar_rutas(datos_dia: PeticionRutas):
    
    # 1. VALIDACIONES
    if not datos_dia.clientes or not datos_dia.vehiculos:
        raise HTTPException(status_code=400, detail="Faltan clientes o vehículos.")
        
    if datos_dia.tipo_problema == "VRPTW":
        for cliente in datos_dia.clientes:
            if not cliente.ventana_horaria:
                raise HTTPException(status_code=400, detail=f"Falta ventana en {cliente.id_cliente}.")

    # 2. CAPA DE TRÁNSITO: OSRM
    try:
        coordenadas_completas = [
            {"latitud": datos_dia.deposito.ubicacion.latitud, "longitud": datos_dia.deposito.ubicacion.longitud}
        ]
        for cliente in datos_dia.clientes:
            coordenadas_completas.append(
                {"latitud": cliente.ubicacion.latitud, "longitud": cliente.ubicacion.longitud}
            )
            
        matrices = obtener_matriz_osrm(coordenadas_completas)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    # 3. MOTOR LÓGICO: OR-Tools
    try:
        matriz_distancias = matrices["matriz_distancias_metros"]
        
        # El depósito (índice 0) tiene demanda 0. Los clientes tienen su demanda de carga.
        demandas = [0] + [cliente.demanda_carga for cliente in datos_dia.clientes]
        capacidades_vehiculos = [vehiculo.capacidad for vehiculo in datos_dia.vehiculos]

        resultado_optimizacion = resolver_cvrp(matriz_distancias, demandas, capacidades_vehiculos)

        if resultado_optimizacion["estado"] == "Fallo":
            raise HTTPException(status_code=400, detail=resultado_optimizacion["mensaje"])
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error OR-Tools: {str(e)}")

    # 4. SERIALIZACIÓN DE SALIDA
    # Mapeamos los índices (0, 1, 2) a los nombres reales para el JSON final
    nombres_nodos = ["Depósito"] + [cliente.id_cliente for cliente in datos_dia.clientes]
    nombres_vehiculos = [vehiculo.id_vehiculo for vehiculo in datos_dia.vehiculos]

    rutas_finales = []
    for ruta_or in resultado_optimizacion["rutas"]:
        secuencia = [nombres_nodos[idx] for idx in ruta_or["ruta_secuencial_nodos"]]
        
        rutas_finales.append({
            "vehiculo": nombres_vehiculos[ruta_or["vehiculo"]],
            "ruta_secuencial": secuencia,
            "carga_total": ruta_or["carga_total"],
            "distancia_recorrida_metros": ruta_or["distancia_recorrida_metros"]
        })

    return {
        "mensaje": "Optimización exitosa",
        "distancia_total_flota_metros": resultado_optimizacion["distancia_total_flota"],
        "rutas": rutas_finales,
        "estado": "Prototipo V1 Completado"
    }