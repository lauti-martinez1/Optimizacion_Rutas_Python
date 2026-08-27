from itertools import pairwise

import psycopg
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from api.dependencies import get_db
from core.config import settings
from db import modelos  # noqa: F401 — registra los modelos en Base.metadata
from db.base import Base
from main import app

# Nunca corremos los tests contra la DB de desarrollo: usamos una base aparte
# en el mismo servidor Postgres, derivada agregando el sufijo "_test".
DATOS_VEHICULO = {
    "telefono": "+54 9 261 555-0100",
    "tipo_vehiculo": "moto",
    "patente": "AB123CD",
    "capacidad_carga_kg": 50,
}


def payload_chofer(email, contrasena="soloYoManejo1", nombre_completo="Carlos Solo", **overrides):
    """Payload de registro de chofer independiente, reutilizado por
    test_auth.py y test_clientes.py — evita que cada archivo tenga su propia
    copia de DATOS_VEHICULO."""
    payload = {
        "email": email,
        "contrasena": contrasena,
        "confirmar_contrasena": contrasena,
        "nombre_completo": nombre_completo,
        **DATOS_VEHICULO,
    }
    payload.update(overrides)
    return payload


def payload_empresa(
    nombre_empresa="Distribuidora Test",
    email="admin@test.com",
    contrasena="contrasenaSegura123",
    nombre_completo="Admin Test",
    **overrides,
):
    payload = {
        "nombre_empresa": nombre_empresa,
        "email": email,
        "contrasena": contrasena,
        "confirmar_contrasena": contrasena,
        "nombre_completo": nombre_completo,
    }
    payload.update(overrides)
    return payload


def payload_chofer_invitado(
    codigo_invitacion,
    email,
    contrasena="otraSegura123",
    nombre_completo="Chofer Invitado",
    patente="XY987ZW",
    **overrides,
):
    payload = {
        "email": email,
        "contrasena": contrasena,
        "confirmar_contrasena": contrasena,
        "nombre_completo": nombre_completo,
        "telefono": "+54 9 261 555-0200",
        "tipo_vehiculo": "furgon",
        "patente": patente,
        "capacidad_carga_kg": 300,
        "codigo_invitacion": codigo_invitacion,
    }
    payload.update(overrides)
    return payload


def crear_empresa_con_chofer(
    client,
    email_admin="admin@empresa.com",
    contrasena_admin="contrasenaSegura123",
    email_chofer="chofer@empresa.com",
    patente_chofer="XY987ZW",
):
    """Registra una empresa (deja sesión de admin activa), invita y registra
    un chofer de esa empresa, y vuelve a loguear como admin al final —
    usado por los tests de vehiculos/incidencias/empresa/reoptimización que
    necesitan un admin y al menos un chofer de la misma empresa.
    Devuelve (admin_json, chofer_json)."""
    admin = client.post(
        "/api/v1/auth/registro/empresa",
        json=payload_empresa(email=email_admin, contrasena=contrasena_admin),
    ).json()
    codigo = client.post("/api/v1/auth/invitaciones").json()["codigo"]
    client.cookies.clear()
    chofer = client.post(
        "/api/v1/auth/registro/chofer-invitado",
        json=payload_chofer_invitado(codigo, email_chofer, patente=patente_chofer),
    ).json()
    client.cookies.clear()
    client.post("/api/v1/auth/login", json={"email": email_admin, "contrasena": contrasena_admin})
    return admin, chofer


def _matriz_sintetica(coordenadas):
    # Distancias/tiempos con parte fraccionaria a propósito — OSRM real
    # devuelve floats (ej. 4538.5 metros), no enteros. Un valor entero acá
    # hubiera dejado pasar el bug de int_from_float que rompió esto en vivo.
    n = len(coordenadas)
    distancias = [[abs(i - j) * 1000.5 for j in range(n)] for i in range(n)]
    tiempos = [[abs(i - j) * 60.5 for j in range(n)] for i in range(n)]
    return {"matriz_distancias_metros": distancias, "matriz_tiempos_segundos": tiempos}


@pytest.fixture
def osrm_falso(monkeypatch):
    """Reemplaza la llamada real a OSRM por una matriz sintética
    determinística — evita depender del servidor público en los tests.
    Parchea todos los módulos que llaman obtener_matriz_osrm directamente
    (planificador y reoptimizador comparten la misma firma)."""
    monkeypatch.setattr("routing.planificador.obtener_matriz_osrm", _matriz_sintetica)
    monkeypatch.setattr("routing.reoptimizador.obtener_matriz_osrm", _matriz_sintetica)


def _geometria_sintetica(coordenadas):
    # Un tramo por cada par de coordenadas consecutivas, igual que la forma real
    # de obtener_geometria_osrm (steps=true separa la traza por leg).
    return [
        [(origen["latitud"], origen["longitud"]), (destino["latitud"], destino["longitud"])]
        for origen, destino in pairwise(coordenadas)
    ]


@pytest.fixture
def osrm_geometria_falsa(monkeypatch):
    monkeypatch.setattr("api.routes_rutas.obtener_geometria_osrm", _geometria_sintetica)
    monkeypatch.setattr("api.routes_empresa.obtener_geometria_osrm", _geometria_sintetica)


_URL_BASE = settings.database_url
_NOMBRE_DB_TEST = _URL_BASE.rsplit("/", 1)[-1] + "_test"
URL_DB_TEST = _URL_BASE.rsplit("/", 1)[0] + "/" + _NOMBRE_DB_TEST
URL_MANTENIMIENTO = _URL_BASE.rsplit("/", 1)[0] + "/postgres"


def _url_a_dsn_psycopg(url_sqlalchemy: str) -> str:
    # psycopg no entiende el prefijo "postgresql+psycopg://" de SQLAlchemy.
    return url_sqlalchemy.replace("postgresql+psycopg://", "postgresql://", 1)


@pytest.fixture(scope="session")
def engine_test():
    with (
        psycopg.connect(_url_a_dsn_psycopg(URL_MANTENIMIENTO), autocommit=True) as conexion,
        conexion.cursor() as cursor,
    ):
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (_NOMBRE_DB_TEST,))
        if cursor.fetchone() is None:
            cursor.execute(f'CREATE DATABASE "{_NOMBRE_DB_TEST}"')

    engine = create_engine(URL_DB_TEST)
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def db_session(engine_test):
    SessionLocalTest = sessionmaker(bind=engine_test, autoflush=False, autocommit=False)
    sesion = SessionLocalTest()
    try:
        yield sesion
    finally:
        # Aislamiento entre tests: vaciamos las tablas en vez de recrear el schema.
        for tabla in reversed(Base.metadata.sorted_tables):
            sesion.execute(text(f'TRUNCATE TABLE "{tabla.name}" CASCADE'))
        sesion.commit()
        sesion.close()


@pytest.fixture
def client(db_session):
    def _get_db_test():
        # Espeja el contrato de get_db() real (commit al salir bien, rollback
        # si algo revienta) para que un bug de manejo de transacciones se vea
        # acá, no solo en producción. A diferencia de get_db(), no cierra la
        # sesión entre requests — la reutilizamos durante todo el test y la
        # cierra el fixture db_session.
        try:
            yield db_session
            db_session.commit()
        except Exception:
            db_session.rollback()
            raise

    app.dependency_overrides[get_db] = _get_db_test
    with TestClient(app) as cliente_test:
        yield cliente_test
    app.dependency_overrides.clear()
