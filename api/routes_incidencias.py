from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api import schemas_incidencias as schemas
from api.dependencies import get_db, requiere_admin
from db import crud
from db.modelos import Usuario

router = APIRouter(prefix="/api/v1/incidencias", tags=["Incidencias"])


@router.post("", response_model=schemas.IncidenciaPublica, status_code=201)
def crear_incidencia(
    datos: schemas.IncidenciaCrear,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(requiere_admin),
):
    ruta = crud.obtener_ruta_empresa(db, admin.empresa_id, datos.ruta_id)
    if ruta is None:
        raise HTTPException(status_code=404, detail="Esa ruta no pertenece a tu empresa.")
    if (
        datos.parada_id is not None
        and crud.obtener_parada_de_ruta(db, ruta, datos.parada_id) is None
    ):
        raise HTTPException(status_code=404, detail="Esa parada no pertenece a la ruta indicada.")
    return crud.crear_incidencia(db, datos, reportado_por=admin)


@router.get("", response_model=list[schemas.IncidenciaPublica])
def listar_incidencias(
    fecha: date | None = None,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(requiere_admin),
):
    return crud.listar_incidencias_empresa(db, admin.empresa_id, fecha)
