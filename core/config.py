from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    entorno: str = "desarrollo"  # "desarrollo" | "produccion"
    frontend_url: str = "http://localhost:5173"

    osrm_base_url: str = "http://router.project-osrm.org"
    solver_time_limit_segundos: int = 5

    database_url: str
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 10080  # 7 días


@lru_cache
def obtener_settings() -> Settings:
    return Settings()


settings = obtener_settings()
