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
        yield db_session

    app.dependency_overrides[get_db] = _get_db_test
    with TestClient(app) as cliente_test:
        yield cliente_test
    app.dependency_overrides.clear()
