import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from api import schemas_vehiculos as schemas
from api.dependencies import get_db, requiere_admin
from api.schemas_auth import MensajeResponse
from db import crud
from db.modelos import Usuario, Vehiculo

router = APIRouter(prefix="/api/v1/vehiculos", tags=["Vehiculos"])

MENSAJE_PATENTE_DUPLICADA = "La patente ya está registrada."


def _obtener_vehiculo_propio(db: Session, vehiculo_id: uuid.UUID, admin: Usuario) -> Vehiculo:
    vehiculo = crud.obtener_vehiculo_propio(db, vehiculo_id, admin.ambito_dueño)
    if vehiculo is None:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado.")
    return vehiculo


def _validar_chofer_asignado(db: Session, admin: Usuario, usuario_id: uuid.UUID | None) -> None:
    if (
        usuario_id is not None
        and crud.obtener_chofer_de_empresa(db, usuario_id, admin.empresa_id) is None
    ):
        raise HTTPException(status_code=404, detail="Ese chofer no pertenece a tu empresa.")


@router.post("", response_model=schemas.VehiculoPublico, status_code=201)
def crear_vehiculo(
    datos: schemas.VehiculoCrear,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(requiere_admin),
):
    _validar_chofer_asignado(db, admin, datos.usuario_id)
    if crud.obtener_vehiculo_por_patente(db, datos.patente):
        raise HTTPException(status_code=409, detail=MENSAJE_PATENTE_DUPLICADA)
    try:
        return crud.crear_vehiculo(db, datos, admin.ambito_dueño)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail=MENSAJE_PATENTE_DUPLICADA)


@router.get("", response_model=list[schemas.VehiculoPublico])
def listar_vehiculos(db: Session = Depends(get_db), admin: Usuario = Depends(requiere_admin)):
    return crud.listar_vehiculos(db, admin.ambito_dueño)


@router.patch("/{vehiculo_id}", response_model=schemas.VehiculoPublico)
def actualizar_vehiculo(
    vehiculo_id: uuid.UUID,
    datos: schemas.VehiculoActualizar,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(requiere_admin),
):
    vehiculo = _obtener_vehiculo_propio(db, vehiculo_id, admin)
    cambios = datos.model_dump(exclude_unset=True)
    if "usuario_id" in cambios:
        _validar_chofer_asignado(db, admin, cambios["usuario_id"])
    return crud.actualizar_vehiculo(db, vehiculo, cambios)


@router.delete("/{vehiculo_id}", response_model=MensajeResponse)
def eliminar_vehiculo(
    vehiculo_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(requiere_admin),
):
    vehiculo = _obtener_vehiculo_propio(db, vehiculo_id, admin)
    crud.eliminar_vehiculo(db, vehiculo)
    return MensajeResponse(mensaje="Vehículo eliminado.")
