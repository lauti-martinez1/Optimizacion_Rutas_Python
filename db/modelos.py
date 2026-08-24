import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class RolUsuario(str, enum.Enum):
    CHOFER = "chofer"
    ADMIN = "admin"


class PlanSuscripcion(str, enum.Enum):
    PRUEBA = "prueba"
    BASICO = "basico"
    PREMIUM = "premium"


class TipoVehiculo(str, enum.Enum):
    MOTO = "moto"
    AUTO = "auto"
    CAMIONETA = "camioneta"
    FURGON = "furgon"
    CAMION = "camion"


class SuscripcionMixin:
    """Campos de plan compartidos por Empresa y Usuario (chofer independiente paga su propio plan)."""

    plan: Mapped[PlanSuscripcion] = mapped_column(
        Enum(PlanSuscripcion, name="plan_suscripcion", native_enum=False),
        nullable=False,
        default=PlanSuscripcion.PRUEBA,
    )
    fecha_fin_prueba: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class Empresa(SuscripcionMixin, Base):
    __tablename__ = "empresas"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)

    usuarios: Mapped[list["Usuario"]] = relationship(
        back_populates="empresa", foreign_keys="Usuario.empresa_id"
    )
    codigos_invitacion: Mapped[list["CodigoInvitacion"]] = relationship(
        back_populates="empresa", foreign_keys="CodigoInvitacion.empresa_id"
    )


class Usuario(SuscripcionMixin, Base):
    __tablename__ = "usuarios"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    contrasena_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    nombre_completo: Mapped[str] = mapped_column(String(200), nullable=False)
    rol: Mapped[RolUsuario] = mapped_column(
        Enum(RolUsuario, name="rol_usuario", native_enum=False),
        nullable=False,
        default=RolUsuario.CHOFER,
    )

    empresa_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("empresas.id"), nullable=True
    )

    # Datos operativos del chofer — NULL para admins de empresa (no manejan) y
    # para cuentas creadas antes de que estos campos existieran.
    telefono: Mapped[str | None] = mapped_column(String(30), nullable=True)
    tipo_vehiculo: Mapped[TipoVehiculo | None] = mapped_column(
        Enum(TipoVehiculo, name="tipo_vehiculo", native_enum=False), nullable=True
    )
    patente: Mapped[str | None] = mapped_column(String(12), nullable=True)
    capacidad_carga_kg: Mapped[int | None] = mapped_column(Integer, nullable=True)

    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    empresa: Mapped["Empresa | None"] = relationship(
        back_populates="usuarios", foreign_keys=[empresa_id]
    )

    def __repr__(self) -> str:
        return f"<Usuario {self.email} rol={self.rol.value}>"


class CodigoInvitacion(Base):
    __tablename__ = "codigos_invitacion"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    codigo: Mapped[str] = mapped_column(String(12), unique=True, nullable=False, index=True)

    empresa_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("empresas.id"), nullable=False
    )
    creado_por_usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False
    )
    usado_por_usuario_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True
    )

    usado: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    fecha_uso: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    empresa: Mapped["Empresa"] = relationship(
        back_populates="codigos_invitacion", foreign_keys=[empresa_id]
    )
    creado_por: Mapped["Usuario"] = relationship(foreign_keys=[creado_por_usuario_id])
    usado_por: Mapped["Usuario | None"] = relationship(foreign_keys=[usado_por_usuario_id])
