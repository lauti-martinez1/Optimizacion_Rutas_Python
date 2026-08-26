import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Boton } from "../componentes/ui/Boton";
import { useAuthStore } from "../store/useAuthStore";
import { PestanaLugares } from "./PestanaLugares";

type Pestana = "inicio" | "lugares";

export function Inicio() {
  const navigate = useNavigate();
  const usuario = useAuthStore((estado) => estado.usuario);
  const cerrarSesion = useAuthStore((estado) => estado.cerrarSesion);
  const [pestana, setPestana] = useState<Pestana>("inicio");

  // La gestión de lugares es para el chofer particular: arma su propia ruta
  // cliente por cliente. Un chofer de empresa recibe la ruta ya asignada por
  // su empresa (fuera de alcance todavía) — no maneja este listado.
  const esChoferParticular = usuario?.rol === "chofer" && usuario.empresa_id === null;

  async function manejarLogout() {
    await cerrarSesion();
    navigate("/login");
  }

  return (
    <div className="pantalla-app">
      <header className="cabecera-app">
        <div>
          <h1 className="cabecera-app__titulo">Hola, {usuario?.nombre_completo}</h1>
          <p className="cabecera-app__subtitulo">
            {usuario?.rol === "admin" ? "Administrador de empresa" : "Chofer"}
            {usuario?.empresa_id
              ? " · con empresa vinculada"
              : usuario?.rol === "chofer"
                ? " · independiente"
                : ""}
          </p>
        </div>
        <Boton variante="secundario" onClick={manejarLogout}>
          Salir
        </Boton>
      </header>

      {esChoferParticular && (
        <nav className="pestanas">
          <button
            type="button"
            className={`pestanas__boton ${pestana === "inicio" ? "pestanas__boton--activa" : ""}`}
            onClick={() => setPestana("inicio")}
          >
            Inicio
          </button>
          <button
            type="button"
            className={`pestanas__boton ${pestana === "lugares" ? "pestanas__boton--activa" : ""}`}
            onClick={() => setPestana("lugares")}
          >
            Mis lugares
          </button>
        </nav>
      )}

      <main className="contenido-app">
        {pestana === "lugares" && esChoferParticular ? (
          <PestanaLugares />
        ) : (
          <div className="tarjeta-contenido">
            <p>Todavía no tenés rutas asignadas.</p>
          </div>
        )}
      </main>
    </div>
  );
}
