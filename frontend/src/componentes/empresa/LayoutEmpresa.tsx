import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { PanelPerfil } from "../ui/PanelPerfil";
import { combinarClases } from "../ui/combinarClases";
import { useAuthStore } from "../../store/useAuthStore";

const SECCIONES = [
  { to: "/empresa", etiqueta: "Torre de control", fin: true },
  { to: "/empresa/pedidos", etiqueta: "Pedidos", fin: false },
  { to: "/empresa/flota", etiqueta: "Flota", fin: false },
  { to: "/empresa/incidencias", etiqueta: "Incidencias", fin: false },
  { to: "/empresa/reportes", etiqueta: "Reportes", fin: false },
  { to: "/empresa/sla", etiqueta: "Cumplimiento SLA", fin: false },
];

function claseLink(activo: boolean) {
  return combinarClases(
    "rounded-md px-3 py-2.5 text-left text-[13.5px] font-semibold transition-colors",
    activo ? "bg-blanco/15 text-blanco" : "text-blanco/70 hover:bg-blanco/10 hover:text-blanco",
  );
}

/** Shell de escritorio para la sección "empresa" (admin) — sidebar fija +
 * contenido con <Outlet />. No hay versión mobile todavía: este dashboard es
 * para el despachante en su puesto de trabajo, a diferencia del resto de la
 * app (mobile-first, pensada para el chofer en la calle). */
export function LayoutEmpresa() {
  const navigate = useNavigate();
  const usuario = useAuthStore((estado) => estado.usuario);
  const cerrarSesion = useAuthStore((estado) => estado.cerrarSesion);
  const [panelPerfilAbierto, setPanelPerfilAbierto] = useState(false);

  async function manejarLogout() {
    await cerrarSesion();
    navigate("/login");
  }

  const inicialAvatar = usuario?.nombre_completo.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-dvh bg-fondo">
      <aside className="flex w-60 shrink-0 flex-col bg-primario p-5">
        <p className="mb-6 text-[15px] font-bold text-blanco">OptiRuta</p>

        <nav className="flex flex-1 flex-col gap-1">
          {SECCIONES.map((seccion) => (
            <NavLink
              key={seccion.to}
              to={seccion.to}
              end={seccion.fin}
              className={({ isActive }) => claseLink(isActive)}
            >
              {seccion.etiqueta}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="mt-auto flex items-center gap-2.5 border-t border-blanco/15 pt-4 text-left"
          onClick={() => setPanelPerfilAbierto(true)}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blanco font-mono text-sm font-bold text-primario">
            {inicialAvatar}
          </span>
          <span className="text-[13px] font-semibold text-blanco">Mi perfil</span>
        </button>
      </aside>

      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>

      <PanelPerfil
        abierto={panelPerfilAbierto}
        onCerrar={() => setPanelPerfilAbierto(false)}
        onCerrarSesion={manejarLogout}
      />
    </div>
  );
}
