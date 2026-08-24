import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from db.modelos import PlanSuscripcion, RolUsuario


class DatosPersona(BaseModel):
    email: EmailStr
    contrasena: str = Field(..., min_length=8, max_length=128)
    nombre_completo: str = Field(..., min_length=2, max_length=200)


class RegistroChoferIndependiente(DatosPersona):
    pass


class RegistroEmpresa(DatosPersona):
    nombre_empresa: str = Field(..., min_length=2, max_length=200)


class RegistroChoferInvitado(DatosPersona):
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
