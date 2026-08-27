import uuid
from datetime import UTC, date, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api.dependencies import get_db, requiere_admin
from api.schemas_empresa import ReoptimizacionRutaResultado, ReoptimizarDiaResponse
from api.schemas_rutas import RutaPublica
from db import crud
from db.modelos import EstadoRuta, Usuario
from routing.planificador import ErrorPlanificacion
from routing.reoptimizador import reoptimizar_ruta

router = APIRouter(prefix="/api/v1/empresa", tags=["Empresa"])


def _hoy() -> date:
    return datetime.now(UTC).date()


@router.post("/rutas/{ruta_id}/reoptimizar", response_model=RutaPublica)
def reoptimizar_una_ruta(
    ruta_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(requiere_admin),
):
    ruta = crud.obtener_ruta_empresa(db, admin.empresa_id, ruta_id)
    if ruta is None:
        raise HTTPException(status_code=404, detail="Ruta no encontrada.")
    try:
        return reoptimizar_ruta(db, ruta)
    except ErrorPlanificacion as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/reoptimizar-dia", response_model=ReoptimizarDiaResponse)
def reoptimizar_dia(
    fecha: date | None = None,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(requiere_admin),
):
    """Reoptimiza cada ruta activa de la empresa de forma independiente —
    nunca reasigna paradas entre choferes. Si una ruta falla, no aborta el
    resto del lote: cada resultado queda reflejado individualmente."""
    fecha = fecha or _hoy()
    rutas = [
        ruta
        for ruta in crud.listar_rutas_empresa(db, admin.empresa_id, fecha)
        if ruta.estado in (EstadoRuta.PLANIFICADA, EstadoRuta.EN_CURSO)
    ]
    resultados = []
    for ruta in rutas:
        try:
            reoptimizar_ruta(db, ruta)
            resultados.append(
                ReoptimizacionRutaResultado(ruta_id=ruta.id, ok=True, mensaje="Reoptimizada.")
            )
        except ErrorPlanificacion as error:
            resultados.append(
                ReoptimizacionRutaResultado(ruta_id=ruta.id, ok=False, mensaje=str(error))
            )
    return ReoptimizarDiaResponse(resultados=resultados)
