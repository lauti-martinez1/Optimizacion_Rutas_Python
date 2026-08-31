import type { UsuarioPublico } from "../../tipos/auth";
import { OPCIONES_TIPO_VEHICULO } from "../formularios/opcionesVehiculo";
import { Boton } from "../ui/Boton";

interface Props {
  usuario: UsuarioPublico;
  onCerrarSesion: () => void;
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <span className="text-xs text-texto-mutado">{etiqueta}</span>
      <span className="text-right font-mono text-[12.5px] break-words text-texto-fuerte">
        {valor}
      </span>
    </div>
  );
}

/** Reemplaza el drawer PanelPerfil para el chofer independiente: la cuenta
 * es una sección más del menú lateral, no un panel flotante aparte —
 * mismo criterio de navegación que el resto de las secciones. */
export function PanelCuenta({ usuario, onCerrarSesion }: Props) {
  const etiquetaVehiculo = usuario.vehiculo
    ? OPCIONES_TIPO_VEHICULO.find((op) => op.valor === usuario.vehiculo?.tipo_vehiculo)?.etiqueta
    : null;

  return (
    <div className="mx-auto flex max-w-[480px] flex-col gap-4 p-4 sm:p-6">
      <div className="rounded-2xl border border-borde bg-blanco px-6 py-7 text-center shadow-md">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primario font-mono text-2xl font-bold text-blanco">
          {usuario.nombre_completo.charAt(0).toUpperCase()}
        </div>
        <p className="text-[15px] font-bold text-texto-fuerte">{usuario.nombre_completo}</p>
        <p className="text-[12.5px] text-texto-mutado">
          Chofer{usuario.empresa_id ? " · con empresa vinculada" : " · independiente"}
        </p>
      </div>

      <div className="rounded-2xl border border-borde bg-blanco px-5 py-4 shadow-md">
        <p className="mb-1 text-[10px] font-bold tracking-[0.12em] text-texto-tenue uppercase">
          Contacto
        </p>
        <div className="divide-y divide-borde">
          <Dato etiqueta="Email" valor={usuario.email} />
          <Dato etiqueta="Teléfono" valor={usuario.telefono ?? "—"} />
        </div>
      </div>

      {usuario.vehiculo && (
        <div className="rounded-2xl border border-borde bg-blanco px-5 py-4 shadow-md">
          <p className="mb-1 text-[10px] font-bold tracking-[0.12em] text-texto-tenue uppercase">
            Mi vehículo
          </p>
          <div className="divide-y divide-borde">
            <Dato etiqueta="Tipo" valor={etiquetaVehiculo ?? ""} />
            <Dato etiqueta="Patente" valor={usuario.vehiculo.patente} />
            <Dato etiqueta="Capacidad" valor={`${usuario.vehiculo.capacidad_carga_kg} kg`} />
          </div>
        </div>
      )}

      <Boton variante="peligro" onClick={onCerrarSesion}>
        Cerrar sesión
      </Boton>
    </div>
  );
}
