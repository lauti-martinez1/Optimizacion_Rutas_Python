import { useEffect, useState } from "react";

import { listarClientes } from "../../api/clientes";
import { useRutaActiva } from "../../hooks/useRutaActiva";
import { type AccionPendiente, PestanaLugares } from "../../paginas/PestanaLugares";
import type { UsuarioPublico } from "../../tipos/auth";
import type { ClientePublico } from "../../tipos/cliente";
import {
  construirUrlGoogleMaps,
  origenNavegacionParaParadaActual,
} from "../../utilidades/googleMaps";
import { PanelCuenta } from "../cuenta/PanelCuenta";
import { PanelHistorial } from "../historial/PanelHistorial";
import type { Seleccion } from "../rutas/FlujoArmarRuta";
import { RutaDeHoyEscritorio } from "../rutas/RutaDeHoyEscritorio";
import { combinarClases } from "../ui/combinarClases";
import { PanelVehiculo } from "../vehiculo/PanelVehiculo";
import { ItemsNav, type Seccion } from "./NavSidebar";

const TITULOS: Record<Seccion, string> = {
  ruta: "Ruta de hoy",
  lugares: "Mis lugares",
  historial: "Historial de rutas",
  vehiculo: "Mi vehículo",
  incidencias: "Incidencias",
  cuenta: "Mi cuenta",
};

interface Props {
  usuario: UsuarioPublico;
  onLogout: () => void;
}

export function EscritorioChofer({ usuario, onLogout }: Props) {
  const [seccion, setSeccion] = useState<Seccion>("ruta");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [accionPendiente, setAccionPendiente] = useState<AccionPendiente | undefined>(undefined);
  const [clientes, setClientes] = useState<ClientePublico[]>([]);
  const { ruta, cargando, enviando, error, ejecutar, recargar } = useRutaActiva();

  useEffect(() => {
    // Se dispara con cada cambio de sección (no solo al montar) para que el
    // badge de "Mis lugares" y el teléfono usado en "Llamar al cliente" no
    // queden desactualizados después de agregar/editar/eliminar un lugar.
    listarClientes().then(setClientes);
  }, [seccion]);

  function irAEditarRuta() {
    setAccionPendiente({ tipo: "editar" });
    setSeccion("lugares");
  }

  function irAArmarRuta() {
    setSeccion("lugares");
  }

  // "Mis lugares" confirma/edita la ruta sobre su propia instancia de
  // FlujoArmarRuta, sin pasar por el useRutaActiva() de acá — hay que
  // refrescarlo a mano al volver, si no "Ruta de hoy" se queda mostrando el
  // estado vacío de cuando montó este componente.
  function manejarRutaConfirmada() {
    setSeccion("ruta");
    recargar();
  }

  function usarRutaDeNuevo(datos: { seleccion: Seleccion; usaVentanasHorarias: boolean }) {
    setAccionPendiente({ tipo: "copiar", ...datos });
    setSeccion("lugares");
  }

  const paradaActual = ruta?.paradas.find((p) => p.estado === "en_curso");
  const origenNavegacion = ruta ? origenNavegacionParaParadaActual(ruta.deposito, ruta.paradas) : null;
  const clientePorId = new Map(clientes.map((c) => [c.id, c] as const));

  const subtitulo =
    seccion === "ruta"
      ? ruta
        ? `${ruta.paradas.length} paradas de hoy`
        : "Todavía no armaste tu ruta"
      : seccion === "lugares"
        ? `${clientes.length} lugares guardados`
        : seccion === "vehiculo"
          ? usuario.vehiculo?.patente
          : seccion === "incidencias"
            ? "Sin incidencias registradas"
            : seccion === "cuenta"
              ? usuario.email
              : undefined;

  const estiloSidebar = {
    backgroundColor: "#2A1264",
    backgroundImage:
      "radial-gradient(420px 260px at 0% 0%, rgba(124,58,237,0.55), transparent 70%), linear-gradient(180deg, #35197A 0%, #1E0C4C 100%)",
  };

  return (
    <div className="flex h-dvh w-full flex-col lg:flex-row">
      {/* SIDEBAR de escritorio: columna fija a la izquierda desde lg, con el
          nav completo adentro. En mobile es solo la barra de marca — el
          nav completo vive en el drawer de abajo, no acá (nada de scroll
          horizontal). */}
      <aside className="flex shrink-0 flex-col text-blanco lg:w-[232px]" style={estiloSidebar}>
        <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-white/12 px-4 lg:h-16 lg:px-5">
          <button
            type="button"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-blanco hover:bg-white/10 lg:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blanco">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6428CC" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-extrabold tracking-tight text-blanco">OptiRuta</div>
            <div className="hidden text-[9.5px] font-semibold tracking-[0.1em] text-white/60 uppercase lg:block">
              Vista del chofer
            </div>
          </div>
        </div>

        <nav className="hidden min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-3 lg:flex">
          <ItemsNav seccion={seccion} ruta={ruta} clientes={clientes} onSeleccionar={setSeccion} />
        </nav>
      </aside>

      {/* Drawer del menú en mobile — el mismo nav de arriba, ahora vertical
          y deslizable desde la izquierda, en vez de una tira horizontal
          que había que scrollear. */}
      {menuAbierto && (
        <div
          className="fixed inset-0 z-[900] animate-aparecer-fondo bg-[rgba(16,24,40,0.4)] lg:hidden"
          onClick={() => setMenuAbierto(false)}
        >
          <aside
            className="absolute top-0 left-0 flex h-full w-[min(280px,80vw)] animate-deslizar-panel-izq flex-col text-blanco"
            style={estiloSidebar}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-14 shrink-0 items-center justify-between gap-2.5 border-b border-white/12 px-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blanco">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6428CC" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="3 11 22 2 13 21 11 13 3 11" />
                  </svg>
                </div>
                <span className="text-sm font-extrabold tracking-tight text-blanco">OptiRuta</span>
              </div>
              <button
                type="button"
                onClick={() => setMenuAbierto(false)}
                aria-label="Cerrar menú"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/80 hover:bg-white/10"
              >
                ✕
              </button>
            </div>
            <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-3">
              <ItemsNav
                seccion={seccion}
                ruta={ruta}
                clientes={clientes}
                onSeleccionar={(s) => {
                  setSeccion(s);
                  setMenuAbierto(false);
                }}
              />
            </nav>
          </aside>
        </div>
      )}

      {/* MAIN */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 flex-col gap-2.5 border-b border-borde bg-blanco px-4 py-3 lg:h-16 lg:flex-row lg:items-center lg:gap-4 lg:px-6 lg:py-0">
          <div className="min-w-0 flex-1">
            <div className="text-base font-bold tracking-tight text-texto-fuerte">
              {TITULOS[seccion]}
            </div>
            {subtitulo && <div className="text-[11.5px] text-texto-mutado">{subtitulo}</div>}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {ruta?.estado === "en_curso" && (
              <div className="flex items-center gap-2 rounded-pill border border-[#ABEFC6] bg-exito-tint px-3 py-1.5">
                <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-exito" />
                <span className="text-[11.5px] font-semibold text-[#067647]">
                  En ruta
                  {ruta.hora_inicio_real &&
                    ` · desde ${new Date(ruta.hora_inicio_real).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                </span>
              </div>
            )}

            <button
              type="button"
              disabled
              title="Próximamente"
              className="h-[38px] cursor-not-allowed rounded-lg border border-borde-input bg-blanco px-3.5 text-[12.5px] font-semibold text-texto-cuerpo opacity-60"
            >
              Reportar incidencia
            </button>

            <a
              href={
                paradaActual && origenNavegacion
                  ? construirUrlGoogleMaps(origenNavegacion, {
                      latitud: paradaActual.latitud_snapshot,
                      longitud: paradaActual.longitud_snapshot,
                    })
                  : undefined
              }
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!paradaActual}
              className={combinarClases(
                "flex h-[38px] items-center gap-1.5 rounded-lg bg-primario px-4 text-[12.5px] font-bold text-blanco shadow-boton-primario",
                !paradaActual && "pointer-events-none opacity-50",
              )}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11" />
              </svg>
              Abrir navegación
            </a>
          </div>
        </header>

        <div
          className="min-h-0 flex-1 overflow-y-auto"
          style={{
            backgroundColor: "#EEEDF6",
            backgroundImage:
              "radial-gradient(900px 480px at 8% 0%, rgba(124,58,237,0.10), transparent 62%), radial-gradient(700px 420px at 96% 100%, rgba(15,118,110,0.07), transparent 60%), linear-gradient(160deg, #F7F6FC 0%, #EAEAF3 100%)",
          }}
        >
          {seccion === "ruta" && (
            <RutaDeHoyEscritorio
              ruta={ruta}
              cargando={cargando}
              enviando={enviando}
              error={error}
              ejecutar={ejecutar}
              usuario={usuario}
              clientePorId={clientePorId}
              onIrAArmarRuta={irAArmarRuta}
              onEditar={irAEditarRuta}
            />
          )}

          {seccion === "lugares" && (
            <div className="p-4 lg:p-6">
              <PestanaLugares
                onRutaConfirmada={manejarRutaConfirmada}
                accionPendiente={accionPendiente}
                onAccionPendienteConsumida={() => setAccionPendiente(undefined)}
              />
            </div>
          )}

          {seccion === "historial" && (
            <div className="p-4 lg:p-6">
              <PanelHistorial clientes={clientes} onUsarDeNuevo={usarRutaDeNuevo} />
            </div>
          )}

          {seccion === "vehiculo" && (
            <div className="p-4 lg:p-6">
              <PanelVehiculo usuario={usuario} ruta={ruta} />
            </div>
          )}

          {seccion === "incidencias" && (
            <PlaceholderSeccion
              titulo="Incidencias"
              descripcion="Historial de incidencias que reportaste, con estado de resolución del dador de carga y su impacto en tu reputación."
              onVolver={() => setSeccion("ruta")}
            />
          )}

          {seccion === "cuenta" && <PanelCuenta usuario={usuario} onCerrarSesion={onLogout} />}
        </div>
      </div>
    </div>
  );
}

function PlaceholderSeccion({
  titulo,
  descripcion,
  onVolver,
}: {
  titulo: string;
  descripcion: string;
  onVolver: () => void;
}) {
  return (
    <div className="flex min-h-full items-center justify-center p-4 sm:p-10">
      <div className="max-w-[420px] rounded-2xl border border-borde bg-white/90 px-5 py-6 text-center shadow-md backdrop-blur-[10px] sm:px-7 sm:py-8">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primario/10 text-[#6428CC]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
        </div>
        <p className="mb-1.5 text-[15px] font-bold text-texto-fuerte">{titulo}</p>
        <p className="mb-4.5 text-[12.5px] leading-relaxed text-texto-mutado">{descripcion}</p>
        <p className="mb-5 inline-flex items-center gap-1.5 rounded-pill bg-fondo px-2.5 py-1 text-[10.5px] font-semibold text-texto-cuerpo">
          Fuera del alcance de este prototipo
        </p>
        <div>
          <button
            type="button"
            onClick={onVolver}
            className="h-10 rounded-[10px] bg-primario px-4.5 text-[12.5px] font-bold text-blanco shadow-boton-primario"
          >
            Volver a Ruta de hoy
          </button>
        </div>
      </div>
    </div>
  );
}
