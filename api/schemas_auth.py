import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from db.modelos import PlanSuscripcion, RolUsuario, TipoVehiculo


class DatosPersona(BaseModel):
    email: EmailStr
    contrasena: str = Field(..., min_length=8, max_length=128)
    confirmar_contrasena: str
    nombre_completo: str = Field(..., min_length=2, max_length=200)

    @model_validator(mode="after")
    def validar_contrasenas_coinciden(self):
        if self.contrasena != self.confirmar_contrasena:
            raise ValueError("Las contraseñas no coinciden.")
        return self


class DatosVehiculo(BaseModel):
    telefono: str = Field(..., min_length=6, max_length=30)
    tipo_vehiculo: TipoVehiculo
    patente: str = Field(..., min_length=4, max_length=12)
    capacidad_carga_kg: int = Field(..., gt=0)


class RegistroChoferIndependiente(DatosPersona, DatosVehiculo):
    pass


class RegistroEmpresa(DatosPersona):
    nombre_empresa: str = Field(..., min_length=2, max_length=200)


class RegistroChoferInvitado(DatosPersona, DatosVehiculo):
    codigo_invitacion: str = Field(..., min_length=8, max_length=12)


class LoginRequest(BaseModel):
    email: EmailStr
    contrasena: str


class EmpresaPublica(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    nombre: str
    plan: PlanSuscripcion
    fecha_fin_prueba: datetime | None
    fecha_creacion: datetime


class UsuarioPublico(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    nombre_completo: str
    rol: RolUsuario
    empresa_id: uuid.UUID | None
    telefono: str | None
    tipo_vehiculo: TipoVehiculo | None
    patente: str | None
    capacidad_carga_kg: int | None
    plan: PlanSuscripcion
    fecha_fin_prueba: datetime | None
    fecha_creacion: datetime


class RegistroEmpresaResponse(BaseModel):
    usuario: UsuarioPublico
    empresa: EmpresaPublica


class CodigoInvitacionPublico(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    codigo: str
    usado: bool
    fecha_creacion: datetime
    fecha_uso: datetime | None


class MensajeResponse(BaseModel):
    mensaje: str
