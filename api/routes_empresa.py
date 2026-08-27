import uuid
from datetime import UTC, date, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api import schemas_empresa as schemas
from api.dependencies import get_db, requiere_admin
from api.schemas_rutas import DepositoResumen, GeometriaRuta, RutaPublica
from db import crud
from db.modelos import EstadoParada, EstadoRuta, Ruta, Usuario
from routing.planificador import ErrorPlanificacion, coordenadas_de_ruta, planificar_ruta
from services.osrm_client import obtener_geometria_osrm

router = APIRouter(prefix="/api/v1/empresa", tags=["Empresa"])


def _hoy() -> date:
    return datetime.now(UTC).date()


def _rutas_con_incidencia(db: Session, empresa_id: uuid.UUID, fecha: date) -> set[uuid.UUID]:
    return {
        incidencia.ruta_id for incidencia in crud.listar_incidencias_empresa(db, empresa_id, fecha)
    }


def _resumen(ruta: Ruta, rutas_con_incidencia: set[uuid.UUID]) -> schemas.RutaResumenEmpresa:
    completadas = sum(1 for p in ruta.paradas if p.estado == EstadoParada.COMPLETADA)
    fallidas = sum(1 for p in ruta.paradas if p.estado == EstadoParada.FALLIDA)
    total = len(ruta.paradas)
    return schemas.RutaResumenEmpresa(
        id=ruta.id,
        chofer_id=ruta.chofer_id,
        chofer_nombre=ruta.chofer.nombre_completo,
        vehiculo_patente=ruta.vehiculo.patente,
        estado=ruta.estado,
        fecha=ruta.fecha,
        distancia_total_m=ruta.distancia_total_m,
        deposito=DepositoResumen.model_validate(ruta.deposito),
        explicacion=ruta.explicacion,
        total_paradas=total,
        paradas_completadas=completadas,
        paradas_fallidas=fallidas,
        paradas_pendientes=total - completadas - fallidas,
        en_riesgo=fallidas > 0 or ruta.id in rutas_con_incidencia,
    )


def _ruta_empresa_o_404(db: Session, admin: Usuario, ruta_id: uuid.UUID) -> Ruta:
    ruta = crud.obtener_ruta_empresa(db, admin.empresa_id, ruta_id)
    if ruta is None:
        raise HTTPException(status_code=404, detail="Ruta no encontrada.")
    return ruta


@router.get("/choferes", response_model=list[schemas.ChoferResumenEmpresa])
def listar_choferes(
    db: Session = Depends(get_db),
    admin: Usuario = Depends(requiere_admin),
):
    return [
        schemas.ChoferResumenEmpresa(
            id=chofer.id,
            nombre_completo=chofer.nombre_completo,
            email=chofer.email,
            vehiculo_patente=chofer.vehiculo.patente if chofer.vehiculo else None,
        )
        for chofer in crud.listar_choferes_empresa(db, admin.empresa_id)
    ]


@router.get("/rutas", response_model=list[schemas.RutaResumenEmpresa])
def listar_rutas(
    fecha: date | None = None,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(requiere_admin),
):
    fecha = fecha or _hoy()
    rutas = crud.listar_rutas_empresa(db, admin.empresa_id, fecha)
    con_incidencia = _rutas_con_incidencia(db, admin.empresa_id, fecha)
    return [_resumen(ruta, con_incidencia) for ruta in rutas]


@router.get("/kpis", response_model=schemas.KpisEmpresaDia)
def kpis(
    fecha: date | None = None,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(requiere_admin),
):
    fecha = fecha or _hoy()
    rutas = crud.listar_rutas_empresa(db, admin.empresa_id, fecha)
    con_incidencia = _rutas_con_incidencia(db, admin.empresa_id, fecha)
    resumenes = [_resumen(ruta, con_incidencia) for ruta in rutas]
    return schemas.KpisEmpresaDia(
        fecha=fecha,
        rutas_activas=sum(
            1 for r in rutas if r.estado in (EstadoRuta.PLANIFICADA, EstadoRuta.EN_CURSO)
        ),
        rutas_completadas=sum(1 for r in rutas if r.estado == EstadoRuta.COMPLETADA),
        rutas_en_riesgo=sum(1 for r in resumenes if r.en_riesgo),
        total_paradas=sum(r.total_paradas for r in resumenes),
        paradas_completadas=sum(r.paradas_completadas for r in resumenes),
        paradas_pendientes=sum(r.paradas_pendientes for r in resumenes),
        paradas_fallidas=sum(r.paradas_fallidas for r in resumenes),
    )


@router.get("/rutas/{ruta_id}", response_model=RutaPublica)
def detalle_ruta(
    ruta_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(requiere_admin),
):
    return _ruta_empresa_o_404(db, admin, ruta_id)


@router.get("/rutas/{ruta_id}/geometria", response_model=GeometriaRuta)
def geometria_ruta(
    ruta_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(requiere_admin),
):
    ruta = _ruta_empresa_o_404(db, admin, ruta_id)
    try:
        tramos = obtener_geometria_osrm(coordenadas_de_ruta(ruta))
    except Exception as error:
        raise HTTPException(
            status_code=502, detail=f"No se pudo trazar el camino: {error}"
        ) from error
    return GeometriaRuta(tramos=tramos)


@router.get("/pedidos", response_model=list[schemas.PedidoPublico])
def listar_pedidos(
    fecha: date | None = None,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(requiere_admin),
):
    fecha = fecha or _hoy()
    paradas = crud.listar_paradas_empresa(db, admin.empresa_id, fecha)
    return [
        schemas.PedidoPublico(
            id=parada.id,
            ruta_id=parada.ruta_id,
            fecha=parada.ruta.fecha,
            cliente_nombre=parada.nombre_snapshot,
            direccion=parada.direccion_snapshot,
            carga_kg=parada.demanda_carga_snapshot,
            ventana_inicio=parada.ventana_inicio_snapshot,
            ventana_fin=parada.ventana_fin_snapshot,
            estado=parada.estado,
            orden=parada.orden,
            chofer_nombre=parada.ruta.chofer.nombre_completo,
            vehiculo_patente=parada.ruta.vehiculo.patente,
        )
        for parada in paradas
    ]


@router.post("/rutas", response_model=RutaPublica, status_code=201)
def asignar_ruta(
    datos: schemas.EmpresaAsignarRutaRequest,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(requiere_admin),
):
    chofer = crud.obtener_chofer_de_empresa(db, datos.chofer_id, admin.empresa_id)
    if chofer is None:
        raise HTTPException(status_code=404, detail="Ese chofer no pertenece a tu empresa.")
    if crud.obtener_ruta_activa(db, chofer.id, _hoy()) is not None:
        raise HTTPException(status_code=409, detail="Ese chofer ya tiene una ruta activa hoy.")

    cargas_por_cliente = {parada.cliente_id: parada.carga_kg for parada in datos.paradas}
    try:
        resultado = planificar_ruta(db, chofer, cargas_por_cliente)
    except ErrorPlanificacion as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    return crud.crear_ruta(
        db,
        chofer=chofer,
        vehiculo=resultado.vehiculo,
        deposito=resultado.deposito,
        fecha=_hoy(),
        distancia_total_m=resultado.distancia_total_m,
        explicacion=resultado.explicacion,
        paradas=[
            {"cliente": parada.cliente, "orden": parada.orden, "carga_kg": parada.carga_kg}
            for parada in resultado.paradas
        ],
        creado_por=admin,
    )
