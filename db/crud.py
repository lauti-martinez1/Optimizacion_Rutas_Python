import secrets
import string
import uuid
from datetime import UTC, date, datetime
from typing import Protocol

from sqlalchemy import select
from sqlalchemy.orm import Session

from db.modelos import (
    Cliente,
    CodigoInvitacion,
    Deposito,
    Duenio,
    Empresa,
    EstadoParada,
    EstadoRuta,
    ParadaRuta,
    PlanSuscripcion,
    RolUsuario,
    Ruta,
    TipoProblema,
    TipoVehiculo,
    Usuario,
    Vehiculo,
)
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


class DatosCliente(Protocol):
    """Forma estructural que necesita crear_cliente — cumplida por
    api/schemas_clientes.py.ClienteCrear sin acoplar este módulo a Pydantic."""

    nombre: str
    direccion: str
    latitud: float
    longitud: float
    telefono: str | None


class DatosDeposito(Protocol):
    """Forma estructural que necesita crear_deposito — cumplida por
    api/schemas_depositos.py.DepositoCrear."""

    nombre: str
    latitud: float
    longitud: float
    ventana_inicio: int | None
    ventana_fin: int | None


def obtener_usuario_por_email(db: Session, email: str) -> Usuario | None:
    return db.execute(select(Usuario).where(Usuario.email == email)).scalar_one_or_none()


def obtener_vehiculo_por_patente(db: Session, patente: str) -> Vehiculo | None:
    return db.execute(select(Vehiculo).where(Vehiculo.patente == patente)).scalar_one_or_none()


def crear_empresa(db: Session, nombre: str) -> Empresa:
    return guardar(db, Empresa(nombre=nombre, plan=PlanSuscripcion.PRUEBA))


def crear_chofer(
    db: Session,
    datos: DatosChofer,
    contrasena_hash: str,
    empresa_id: uuid.UUID | None = None,
) -> Usuario:
    """Chofer independiente (empresa_id=None) o chofer vinculado a una empresa.
    Crea también su Vehiculo — el registro sigue pidiendo esos datos juntos,
    aunque ahora vivan en tablas separadas."""
    usuario = guardar(
        db,
        Usuario(
            email=datos.email,
            contrasena_hash=contrasena_hash,
            nombre_completo=datos.nombre_completo,
            rol=RolUsuario.CHOFER,
            empresa_id=empresa_id,
            telefono=datos.telefono,
            plan=PlanSuscripcion.PRUEBA,
        ),
    )
    guardar(
        db,
        Vehiculo(
            empresa_id=empresa_id,
            usuario_id=usuario.id,
            tipo_vehiculo=datos.tipo_vehiculo,
            patente=datos.patente,
            capacidad_carga_kg=datos.capacidad_carga_kg,
        ),
    )
    return usuario


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


def _condicion_dueño(modelo: type[Cliente] | type[Deposito], duenio: Duenio):
    """Condición SQL de dueño, compartida por cualquier modelo con
    DuenioMixin (hoy Cliente y Deposito) — un solo lugar donde vive el
    filtro, en vez de repetirlo por modelo."""
    return (
        modelo.empresa_id == duenio.empresa_id
        if duenio.empresa_id
        else modelo.usuario_id == duenio.usuario_id
    )


def crear_cliente(db: Session, datos: DatosCliente, duenio: Duenio) -> Cliente:
    return guardar(
        db,
        Cliente(
            empresa_id=duenio.empresa_id,
            usuario_id=duenio.usuario_id,
            nombre=datos.nombre,
            direccion=datos.direccion,
            latitud=datos.latitud,
            longitud=datos.longitud,
            telefono=datos.telefono,
        ),
    )


def listar_clientes(db: Session, duenio: Duenio) -> list[Cliente]:
    return list(
        db.execute(
            select(Cliente)
            .where(_condicion_dueño(Cliente, duenio), Cliente.activo.is_(True))
            .order_by(Cliente.nombre)
        ).scalars()
    )


def obtener_cliente_propio(db: Session, cliente_id: uuid.UUID, duenio: Duenio) -> Cliente | None:
    """Trae el Cliente solo si pertenece a `duenio` — el scoping vive en la
    query, no queda a cargo de que el caller lo verifique después de un
    fetch sin restricción (eso sería fácil de olvidar en un endpoint nuevo)."""
    return db.execute(
        select(Cliente).where(Cliente.id == cliente_id, _condicion_dueño(Cliente, duenio))
    ).scalar_one_or_none()


def obtener_clientes_propios(
    db: Session, cliente_ids: list[uuid.UUID], duenio: Duenio
) -> list[Cliente]:
    """Trae varios Cliente por id, filtrados por dueño — usado al armar una
    ruta a partir de una selección. Si algún id no pertenece a `duenio`
    (ajeno o inexistente), simplemente no aparece en el resultado; el
    caller es responsable de comparar la cantidad devuelta contra la
    pedida si necesita detectarlo."""
    return list(
        db.execute(
            select(Cliente).where(Cliente.id.in_(cliente_ids), _condicion_dueño(Cliente, duenio))
        ).scalars()
    )


def actualizar_cliente(db: Session, cliente: Cliente, cambios: dict[str, object]) -> Cliente:
    for campo, valor in cambios.items():
        setattr(cliente, campo, valor)
    return guardar(db, cliente)


def eliminar_cliente(db: Session, cliente: Cliente) -> None:
    """Soft delete — activo=False, para no romper el snapshot de ParadaRuta
    de rutas ya confirmadas que referencien este cliente."""
    cliente.activo = False
    guardar(db, cliente)


def crear_deposito(db: Session, datos: DatosDeposito, duenio: Duenio) -> Deposito:
    return guardar(
        db,
        Deposito(
            empresa_id=duenio.empresa_id,
            usuario_id=duenio.usuario_id,
            nombre=datos.nombre,
            latitud=datos.latitud,
            longitud=datos.longitud,
            ventana_inicio=datos.ventana_inicio,
            ventana_fin=datos.ventana_fin,
        ),
    )


def listar_depositos(db: Session, duenio: Duenio) -> list[Deposito]:
    return list(
        db.execute(
            select(Deposito)
            .where(_condicion_dueño(Deposito, duenio), Deposito.activo.is_(True))
            .order_by(Deposito.nombre)
        ).scalars()
    )


def obtener_deposito_propio(db: Session, deposito_id: uuid.UUID, duenio: Duenio) -> Deposito | None:
    return db.execute(
        select(Deposito).where(Deposito.id == deposito_id, _condicion_dueño(Deposito, duenio))
    ).scalar_one_or_none()


def actualizar_deposito(db: Session, deposito: Deposito, cambios: dict[str, object]) -> Deposito:
    for campo, valor in cambios.items():
        setattr(deposito, campo, valor)
    return guardar(db, deposito)


def eliminar_deposito(db: Session, deposito: Deposito) -> None:
    deposito.activo = False
    guardar(db, deposito)


def obtener_ruta_activa(db: Session, chofer_id: uuid.UUID, fecha: date) -> Ruta | None:
    return db.execute(
        select(Ruta).where(
            Ruta.chofer_id == chofer_id,
            Ruta.fecha == fecha,
            Ruta.estado.in_([EstadoRuta.PLANIFICADA, EstadoRuta.EN_CURSO]),
        )
    ).scalar_one_or_none()


def crear_ruta(
    db: Session,
    chofer: Usuario,
    vehiculo: Vehiculo,
    deposito: Deposito,
    fecha: date,
    distancia_total_m: int,
    explicacion: str,
    paradas: list[dict],
) -> Ruta:
    """`paradas`: lista de {"cliente": Cliente, "orden": int, "carga_kg": int},
    ya en el orden que resolvió el solver (ver routing/planificador.py)."""
    ruta = guardar(
        db,
        Ruta(
            chofer_id=chofer.id,
            vehiculo_id=vehiculo.id,
            deposito_id=deposito.id,
            creado_por_usuario_id=chofer.id,
            fecha=fecha,
            tipo_problema=TipoProblema.CVRP,
            estado=EstadoRuta.PLANIFICADA,
            distancia_total_m=distancia_total_m,
            explicacion=explicacion,
        ),
    )
    for item in paradas:
        cliente = item["cliente"]
        guardar(
            db,
            ParadaRuta(
                ruta_id=ruta.id,
                cliente_id=cliente.id,
                orden=item["orden"],
                nombre_snapshot=cliente.nombre,
                direccion_snapshot=cliente.direccion,
                latitud_snapshot=cliente.latitud,
                longitud_snapshot=cliente.longitud,
                demanda_carga_snapshot=item["carga_kg"],
            ),
        )
    return ruta


def cancelar_ruta(db: Session, ruta: Ruta) -> None:
    ruta.estado = EstadoRuta.CANCELADA
    guardar(db, ruta)


def iniciar_ruta(db: Session, ruta: Ruta) -> Ruta:
    """Arranca el día: la ruta pasa a en_curso y la primera parada (orden=0)
    pasa a ser el objetivo actual — ver EstadoParada.EN_CURSO."""
    ruta.estado = EstadoRuta.EN_CURSO
    ruta.hora_inicio_real = datetime.now(UTC)
    guardar(db, ruta)
    if ruta.paradas:
        ruta.paradas[0].estado = EstadoParada.EN_CURSO
        guardar(db, ruta.paradas[0])
    return ruta


def completar_parada(db: Session, ruta: Ruta, parada: ParadaRuta) -> Ruta:
    """Marca `parada` como visitada y avanza la siguiente (por `orden`) a
    en_curso. Si no queda ninguna pendiente, cierra la ruta entera."""
    parada.estado = EstadoParada.COMPLETADA
    parada.hora_real_salida = datetime.now(UTC)
    guardar(db, parada)

    siguientes = [p for p in ruta.paradas if p.orden > parada.orden]
    if siguientes:
        siguiente = min(siguientes, key=lambda p: p.orden)
        siguiente.estado = EstadoParada.EN_CURSO
        guardar(db, siguiente)
    else:
        ruta.estado = EstadoRuta.COMPLETADA
        ruta.hora_fin_real = datetime.now(UTC)
        guardar(db, ruta)
    return ruta


def obtener_parada_de_ruta(db: Session, ruta: Ruta, parada_id: uuid.UUID) -> ParadaRuta | None:
    return next((p for p in ruta.paradas if p.id == parada_id), None)
