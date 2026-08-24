import secrets
import string
import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from db.modelos import CodigoInvitacion, Empresa, PlanSuscripcion, RolUsuario, Usuario

ALFABETO_CODIGO = string.ascii_uppercase + string.digits


def obtener_usuario_por_email(db: Session, email: str) -> Usuario | None:
    return db.execute(select(Usuario).where(Usuario.email == email)).scalar_one_or_none()


def crear_empresa(db: Session, nombre: str) -> Empresa:
    empresa = Empresa(nombre=nombre, plan=PlanSuscripcion.PRUEBA)
    db.add(empresa)
    db.flush()
    db.refresh(empresa)
    return empresa


def crear_usuario(
    db: Session,
    email: str,
    contrasena_hash: str,
    nombre_completo: str,
    rol: RolUsuario,
    empresa_id: uuid.UUID | None = None,
) -> Usuario:
    usuario = Usuario(
        email=email,
        contrasena_hash=contrasena_hash,
        nombre_completo=nombre_completo,
        rol=rol,
        empresa_id=empresa_id,
        plan=PlanSuscripcion.PRUEBA,
    )
    db.add(usuario)
    db.flush()
    db.refresh(usuario)
    return usuario


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
    invitacion = CodigoInvitacion(
        codigo=_generar_codigo_unico(db),
        empresa_id=empresa_id,
        creado_por_usuario_id=creado_por_usuario_id,
    )
    db.add(invitacion)
    db.flush()
    db.refresh(invitacion)
    return invitacion


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
    db.add(invitacion)
    db.flush()
