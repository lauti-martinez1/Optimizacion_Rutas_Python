import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api import schemas_rutas as schemas
from api.dependencies import get_db, obtener_usuario_actual, requiere_chofer_independiente
from db import crud
from db.modelos import Usuario
from routing.planificador import ErrorPlanificacion, ResultadoPlanificacion, planificar_ruta

router = APIRouter(prefix="/api/v1/rutas", tags=["Rutas"])


def _cargas_por_cliente(datos: schemas.OptimizarRutaRequest) -> dict[uuid.UUID, int]:
    return {parada.cliente_id: parada.carga_kg for parada in datos.paradas}


def _preview(resultado: ResultadoPlanificacion) -> schemas.RutaPreview:
    return schemas.RutaPreview(
        paradas=[
            schemas.ParadaPreview(
                cliente_id=parada.cliente.id,
                nombre=parada.cliente.nombre,
                direccion=parada.cliente.direccion,
                orden=parada.orden,
                carga_kg=parada.carga_kg,
                distancia_acumulada_m=parada.distancia_acumulada_m,
            )
            for parada in resultado.paradas
        ],
        distancia_total_m=resultado.distancia_total_m,
        carga_total_kg=resultado.carga_total_kg,
    )


@router.post("/optimizar", response_model=schemas.RutaPreview)
def optimizar_ruta(
    datos: schemas.OptimizarRutaRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_chofer_independiente),
):
    try:
        resultado = planificar_ruta(db, usuario, _cargas_por_cliente(datos))
    except ErrorPlanificacion as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return _preview(resultado)


@router.post("/confirmar", response_model=schemas.RutaPublica, status_code=201)
def confirmar_ruta(
    datos: schemas.OptimizarRutaRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(requiere_chofer_independiente),
):
    hoy = datetime.now(UTC).date()
    if crud.obtener_ruta_activa(db, usuario.id, hoy) is not None:
        raise HTTPException(status_code=409, detail="Ya tenés una ruta activa para hoy.")

    try:
        resultado = planificar_ruta(db, usuario, _cargas_por_cliente(datos))
    except ErrorPlanificacion as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    return crud.crear_ruta(
        db,
        chofer=usuario,
        vehiculo=resultado.vehiculo,
        deposito=resultado.deposito,
        fecha=hoy,
        distancia_total_m=resultado.distancia_total_m,
        paradas=[
            {"cliente": parada.cliente, "orden": parada.orden, "carga_kg": parada.carga_kg}
            for parada in resultado.paradas
        ],
    )


@router.get("/activa", response_model=schemas.RutaPublica | None)
def ruta_activa(db: Session = Depends(get_db), usuario: Usuario = Depends(obtener_usuario_actual)):
    return crud.obtener_ruta_activa(db, usuario.id, datetime.now(UTC).date())
