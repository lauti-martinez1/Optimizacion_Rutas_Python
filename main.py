from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router as router_ruteo
from api.routes_auth import router as router_auth
from core.config import settings

app = FastAPI(
    title="API de Optimización de Rutas - Gran Mendoza",
    description="Motor de optimización VRPTW basado en Google OR-Tools",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router_ruteo)
app.include_router(router_auth)
