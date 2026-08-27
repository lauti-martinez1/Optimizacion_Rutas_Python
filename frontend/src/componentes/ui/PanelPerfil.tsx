import type { ReactNode } from "react";

import { OPCIONES_TIPO_VEHICULO } from "../formularios/opcionesVehiculo";
import { useAuthStore } from "../../store/useAuthStore";
import { Boton } from "./Boton";
import { TextoEyebrow } from "./TextoEyebrow";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  onCerrarSesion: () => void;
}

const ETIQUETA_ROL: Record<string, string> = {
  chofer: "Chofer",
  admin: "Administrador",
};

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs text-texto-mutado">{etiqueta}</span>
      <span className="text-right font-mono text-[12.5px] break-words text-texto-fuerte">
        {valor}
      </span>
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="my-5 flex flex-col gap-2.5 border-t border-borde pt-4">
      <TextoEyebrow className="mt-0">{titulo}</TextoEyebrow>
      {children}
    </div>
  );
}

export function PanelPerfil({ abierto, onCerrar, onCerrarSesion }: Props) {
  const usuario = useAuthStore((estado) => estado.usuario);

  if (!abierto || !usuario) {
    return null;
  }

  const etiquetaVehiculo = usuario.vehiculo
    ? OPCIONES_TIPO_VEHICULO.find((op) => op.valor === usuario.vehiculo?.tipo_vehiculo)?.etiqueta
    : null;

  return (
    <div className="fixed inset-0 z-[900] animate-aparecer-fondo bg-[rgba(16,24,40,0.4)]" onClick={onCerrar}>
      <aside
        className="absolute top-0 right-0 flex h-full w-[min(340px,88vw)] animate-deslizar-panel flex-col overflow-y-auto bg-blanco p-5 shadow-[-8px_0_24px_rgba(16,24,40,0.18)] lg:w-[380px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm font-bold text-texto-fuerte">Mi perfil</p>
          <button
            className="h-8 w-8 rounded-full border border-borde bg-superficie text-[13px] text-texto-fuerte"
            onClick={onCerrar}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="mb-2.5 flex h-14 w-14 items-center justify-center rounded-full bg-primario font-mono text-xl font-bold text-blanco">
          {usuario.nombre_completo.charAt(0).toUpperCase()}
        </div>
        <p className="mb-0.5 text-[15px] font-bold text-texto-fuerte">{usuario.nombre_completo}</p>
        <p className="text-[12.5px] text-texto-mutado">
          {ETIQUETA_ROL[usuario.rol] ?? usuario.rol}
          {usuario.empresa_id ? " · con empresa vinculada" : " · independiente"}
        </p>

        <Seccion titulo="Contacto">
          <Dato etiqueta="Email" valor={usuario.email} />
          <Dato etiqueta="Teléfono" valor={usuario.telefono ?? "—"} />
        </Seccion>

        {usuario.vehiculo && (
          <Seccion titulo="Mi vehículo">
            <Dato etiqueta="Tipo" valor={etiquetaVehiculo ?? ""} />
            <Dato etiqueta="Patente" valor={usuario.vehiculo.patente} />
            <Dato etiqueta="Capacidad" valor={`${usuario.vehiculo.capacidad_carga_kg} kg`} />
          </Seccion>
        )}

        <Boton variante="secundario" className="mt-auto" onClick={onCerrarSesion}>
          Cerrar sesión
        </Boton>
      </aside>
    </div>
  );
}
