import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { combinarClases } from "../componentes/ui/combinarClases";
import { PanelPerfil } from "../componentes/ui/PanelPerfil";
import { useAuthStore } from "../store/useAuthStore";
import { PestanaInicio } from "./PestanaInicio";
import { PestanaLugares } from "./PestanaLugares";

type Pestana = "inicio" | "lugares";

const PESTANAS: { valor: Pestana; etiqueta: string }[] = [
  { valor: "inicio", etiqueta: "Inicio" },
  { valor: "lugares", etiqueta: "Mis lugares" },
];

function claseTabMovil(activa: boolean) {
  return combinarClases(
    "flex-1 border-b-2 px-1 pb-3 text-[13.5px] font-semibold",
    activa ? "border-primario text-primario" : "border-transparent text-texto-mutado",
  );
}

function claseTabEscritorio(activa: boolean) {
  return combinarClases(
    "rounded-md border-l-2 px-3 py-2.5 text-left text-[13.5px] font-semibold transition-colors",
    activa
      ? "border-primario bg-primario/[0.06] text-primario"
      : "border-transparent text-texto-mutado hover:bg-fondo hover:text-texto-cuerpo",
  );
}

export function Inicio() {
  const navigate = useNavigate();
  const usuario = useAuthStore((estado) => estado.usuario);
  const cerrarSesion = useAuthStore((estado) => estado.cerrarSesion);
  const [pestana, setPestana] = useState<Pestana>("inicio");
  const [abrirEdicionRuta, setAbrirEdicionRuta] = useState(false);
  const [panelPerfilAbierto, setPanelPerfilAbierto] = useState(false);

  // La gestión de lugares es para el chofer particular: arma su propia ruta
  // cliente por cliente. Un chofer de empresa recibe la ruta ya asignada por
  // su empresa (fuera de alcance todavía) — no maneja este listado.
  const esChoferParticular = usuario?.rol === "chofer" && usuario.empresa_id === null;

  async function manejarLogout() {
    await cerrarSesion();
    navigate("/login");
  }

  function irAEditarRuta() {
    setAbrirEdicionRuta(true);
    setPestana("lugares");
  }

  const subtitulo =
    (usuario?.rol === "admin" ? "Administrador de empresa" : "Chofer") +
    (usuario?.empresa_id
      ? " · con empresa vinculada"
      : usuario?.rol === "chofer"
        ? " · independiente"
        : "");

  const inicialAvatar = usuario?.nombre_completo.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-dvh flex-col bg-fondo lg:flex-row">
      {/* --- Sidebar de escritorio: reemplaza el header + pestañas de mobile,
          no es una versión "estirada" de lo mismo. --- */}
      <aside className="hidden lg:flex lg:w-60 lg:shrink-0 lg:flex-col lg:border-r lg:border-borde lg:bg-superficie lg:p-5">
        <h1 className="mb-0.5 text-lg font-bold text-texto-fuerte">
          Hola, {usuario?.nombre_completo}
        </h1>
        <p className="text-[12.5px] text-texto-mutado">{subtitulo}</p>

        {esChoferParticular && (
          <nav className="mt-6 flex flex-1 flex-col gap-1">
            {PESTANAS.map((tab) => (
              <button
                key={tab.valor}
                type="button"
                className={claseTabEscritorio(pestana === tab.valor)}
                onClick={() => setPestana(tab.valor)}
              >
                {tab.etiqueta}
              </button>
            ))}
          </nav>
        )}

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
          <div>
            <h1 className="mb-0.5 text-lg font-bold text-texto-fuerte">
              Hola, {usuario?.nombre_completo}
            </h1>
            <p className="text-[12.5px] text-texto-mutado">{subtitulo}</p>
          </div>
          <button
            type="button"
            className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-primario font-mono text-sm font-bold text-blanco"
            onClick={() => setPanelPerfilAbierto(true)}
            aria-label="Mi perfil"
          >
            {inicialAvatar}
          </button>
        </header>

        {esChoferParticular && (
          <nav className="flex gap-1.5 border-b border-borde bg-superficie px-5 pt-3 lg:hidden">
            {PESTANAS.map((tab) => (
              <button
                key={tab.valor}
                type="button"
                className={claseTabMovil(pestana === tab.valor)}
                onClick={() => setPestana(tab.valor)}
              >
                {tab.etiqueta}
              </button>
            ))}
          </nav>
        )}

        <main className="flex-1 p-5 xl:mx-auto xl:w-full xl:max-w-[1040px] xl:px-10 xl:py-10">
          {pestana === "lugares" && esChoferParticular ? (
            <PestanaLugares
              onRutaConfirmada={() => setPestana("inicio")}
              abrirEdicionRuta={abrirEdicionRuta}
              onAbrioEdicionRuta={() => setAbrirEdicionRuta(false)}
            />
          ) : (
            <PestanaInicio
              onEditar={irAEditarRuta}
              onArmarRuta={esChoferParticular ? () => setPestana("lugares") : undefined}
            />
          )}
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
