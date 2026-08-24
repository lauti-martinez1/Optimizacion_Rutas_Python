import secrets
import string
import uuid
from datetime import UTC, datetime
from typing import Protocol

from sqlalchemy import select
from sqlalchemy.orm import Session

from db.modelos import CodigoInvitacion, Empresa, PlanSuscripcion, RolUsuario, TipoVehiculo, Usuario
from db.sesion import guardar

ALFABETO_CODIGO = string.ascii_uppercase + string.digits


class DatosChofer(Protocol):
    """Forma estructural que necesita crear_chofer. Los schemas de registro de
    api/schemas_auth.py la cumplen sin que este módulo dependa de ellos."""

    email: str
    nombre_completo: str
    telefono: str
    tipo_vehiculo: TipoVehiculo
    patente: str
    capacidad_carga_kg: int


def obtener_usuario_por_email(db: Session, email: str) -> Usuario | None:
    return db.execute(select(Usuario).where(Usuario.email == email)).scalar_one_or_none()


def crear_empresa(db: Session, nombre: str) -> Empresa:
    return guardar(db, Empresa(nombre=nombre, plan=PlanSuscripcion.PRUEBA))


def crear_chofer(
    db: Session,
    datos: DatosChofer,
    contrasena_hash: str,
    empresa_id: uuid.UUID | None = None,
) -> Usuario:
    """Chofer independiente (empresa_id=None) o chofer vinculado a una empresa."""
    return guardar(
        db,
        Usuario(
            email=datos.email,
            contrasena_hash=contrasena_hash,
            nombre_completo=datos.nombre_completo,
            rol=RolUsuario.CHOFER,
            empresa_id=empresa_id,
            telefono=datos.telefono,
            tipo_vehiculo=datos.tipo_vehiculo,
            patente=datos.patente,
            capacidad_carga_kg=datos.capacidad_carga_kg,
            plan=PlanSuscripcion.PRUEBA,
        ),
    )


def crear_admin(
    db: Session,
    email: str,
    contrasena_hash: str,
    nombre_completo: str,
    empresa_id: uuid.UUID,
) -> Usuario:
    """Único camino para crear un admin — empresa_id no-opcional a propósito:
    un admin sin empresa es un estado inválido que no debe poder construirse."""
    return guardar(
        db,
        Usuario(
            email=email,
            contrasena_hash=contrasena_hash,
            nombre_completo=nombre_completo,
            rol=RolUsuario.ADMIN,
            empresa_id=empresa_id,
            plan=PlanSuscripcion.PRUEBA,
        ),
    )


def obtener_codigo_invitacion(db: Session, codigo: str) -> CodigoInvitacion | None:
    return db.execute(
        select(CodigoInvitacion).where(CodigoInvitacion.codigo == codigo)
    ).scalar_one_or_none()


def _generar_codigo_unico(db: Session) -> str:
    while True:
        candidato = "".join(secrets.choice(ALFABETO_CODIGO) for _ in range(8))
        if obtener_codigo_invitacion(db, candidato) is None:
            return candidato


def crear_codigo_invitacion(
    db: Session, empresa_id: uuid.UUID, creado_por_usuario_id: uuid.UUID
) -> CodigoInvitacion:
    return guardar(
        db,
        CodigoInvitacion(
            codigo=_generar_codigo_unico(db),
            empresa_id=empresa_id,
            creado_por_usuario_id=creado_por_usuario_id,
        ),
    )


def listar_codigos_invitacion(db: Session, empresa_id: uuid.UUID) -> list[CodigoInvitacion]:
    return list(
        db.execute(
            select(CodigoInvitacion)
            .where(CodigoInvitacion.empresa_id == empresa_id)
            .order_by(CodigoInvitacion.fecha_creacion.desc())
        ).scalars()
    )


def marcar_codigo_usado(db: Session, invitacion: CodigoInvitacion, usuario_id: uuid.UUID) -> None:
    invitacion.usado = True
    invitacion.usado_por_usuario_id = usuario_id
    invitacion.fecha_uso = datetime.now(UTC)
    guardar(db, invitacion)
