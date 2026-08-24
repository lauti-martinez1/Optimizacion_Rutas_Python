from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from core.config import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def guardar[Modelo](db: Session, instancia: Modelo) -> Modelo:
    """Persiste una instancia nueva o modificada y la deja lista para leer.

    flush() asigna los defaults client-side (ej. UUID de PK) y ejecuta el
    INSERT/UPDATE dentro de la transacción abierta por get_db() (que recién
    commitea al final del request); refresh() vuelve a leerla para poblar los
    defaults server-side (ej. fecha_creacion). Centralizado acá para que
    ninguna función de db/crud.py tenga que acordarse de repetir el ritual.
    """
    db.add(instancia)
    db.flush()
    db.refresh(instancia)
    return instancia
