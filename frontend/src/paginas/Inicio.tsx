import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { PanelPerfil } from "../componentes/ui/PanelPerfil";
import { useAuthStore } from "../store/useAuthStore";
import { PanelChoferIndependiente } from "./PanelChoferIndependiente";
import { PestanaInicio } from "./PestanaInicio";

function Saludo({ nombre, subtitulo }: { nombre: string | undefined; subtitulo: string }) {
  return (
    <div>
      <h1 className="mb-0.5 text-lg font-bold text-texto-fuerte">Hola, {nombre}</h1>
      <p className="text-[12.5px] text-texto-mutado">{subtitulo}</p>
    </div>
  );
}

export function Inicio() {
  const navigate = useNavigate();
  const usuario = useAuthStore((estado) => estado.usuario);
  const cerrarSesion = useAuthStore((estado) => estado.cerrarSesion);
  const [panelPerfilAbierto, setPanelPerfilAbierto] = useState(false);

  // La gestión de lugares es para el chofer particular: arma su propia ruta
  // cliente por cliente. Un chofer de empresa recibe la ruta ya asignada por
  // su empresa (fuera de alcance todavía) — no maneja este listado.
  const esChoferParticular = usuario?.rol === "chofer" && usuario.empresa_id === null;

  async function manejarLogout() {
    await cerrarSesion();
    navigate("/login");
  }

  // El chofer independiente tiene una experiencia propia (Driver Desktop en
  // escritorio, mismo flujo de pestañas de siempre en mobile) — ver
  // PanelChoferIndependiente.tsx. Lo que sigue acá abajo es la pantalla
  // clásica, solo para admin y chofer de empresa (ninguno arma su propia
  // ruta todavía, así que no hay pestañas ni sidebar de navegación).
  if (esChoferParticular && usuario) {
    return <PanelChoferIndependiente usuario={usuario} onLogout={manejarLogout} />;
  }

  const subtitulo =
    (usuario?.rol === "admin" ? "Administrador de empresa" : "Chofer") +
    (usuario?.empresa_id ? " · con empresa vinculada" : "");

  const inicialAvatar = usuario?.nombre_completo.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-dvh flex-col bg-fondo lg:flex-row">
      <aside className="hidden lg:flex lg:w-60 lg:shrink-0 lg:flex-col lg:border-r lg:border-borde lg:bg-superficie lg:p-5">
        <Saludo nombre={usuario?.nombre_completo} subtitulo={subtitulo} />

        <button
          type="button"
          className="mt-auto flex items-center gap-2.5 border-t border-borde pt-4 text-left"
          onClick={() => setPanelPerfilAbierto(true)}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primario font-mono text-sm font-bold text-blanco">
            {inicialAvatar}
          </span>
          <span className="text-[13px] font-semibold text-texto-fuerte">Mi perfil</span>
        </button>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-borde bg-superficie px-5 py-5 lg:hidden">
          <Saludo nombre={usuario?.nombre_completo} subtitulo={subtitulo} />
          <button
            type="button"
            className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-primario font-mono text-sm font-bold text-blanco"
            onClick={() => setPanelPerfilAbierto(true)}
            aria-label="Mi perfil"
          >
            {inicialAvatar}
          </button>
        </header>

        <main className="flex-1 p-5 xl:mx-auto xl:w-full xl:max-w-[1040px] xl:px-10 xl:py-10">
          <PestanaInicio onEditar={() => {}} />
        </main>
      </div>

      <PanelPerfil
        abierto={panelPerfilAbierto}
        onCerrar={() => setPanelPerfilAbierto(false)}
        onCerrarSesion={manejarLogout}
      />
    </div>
  );
}
