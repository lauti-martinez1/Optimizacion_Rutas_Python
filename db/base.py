from sqlalchemy import MetaData
from sqlalchemy.orm import declarative_base

# Naming convention explícita para que `alembic revision --autogenerate` genere
# nombres de constraint estables entre corridas (si no, cada dialecto autogenera
# nombres distintos y ensucia el diff de las migraciones).
CONVENCION_NOMBRES = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}
metadata = MetaData(naming_convention=CONVENCION_NOMBRES)
Base = declarative_base(metadata=metadata)
