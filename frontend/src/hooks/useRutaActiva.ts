import { useEffect, useState } from "react";

import { obtenerRutaActiva } from "../api/rutas";
import type { RutaPublica } from "../tipos/ruta";

/** Firma de `ejecutar` — compartida por los componentes de escritorio
 * (RutaDeHoyEscritorio.tsx, VistaEnCursoRuta.tsx) que la reciben por prop
 * desde acá, para no redeclarar el tipo en cada uno. */
export type EjecutarAccionRuta = (
  accion: () => Promise<RutaPublica | void>,
  mensajeError: string,
) => Promise<void>;

/** Estado + acciones sobre "la ruta activa de hoy" — compartido por la vista
 * mobile (PestanaInicio.tsx) y el panel de escritorio del chofer
 * independiente (RutaDeHoyEscritorio.tsx), mismo comportamiento en ambos. */
export function useRutaActiva() {
  const [ruta, setRuta] = useState<RutaPublica | null>(null);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function recargar() {
    setRuta(await obtenerRutaActiva());
  }

  useEffect(() => {
    // oxlint no distingue que setRuta ocurre después de un await dentro de
    // recargar() — no hay setState síncrono ni loop de renders acá.
    // oxlint-disable-next-line react/set-state-in-effect
    recargar().finally(() => setCargando(false));
  }, []);

  /** Iniciar/completar devuelven la Ruta actualizada — la usamos tal cual en
   * vez de recargar vía GET /activa, que ya no encuentra una ruta recién
   * completada (esa deja de contar como "activa") y pisaría el resumen
   * final con el estado vacío antes de que el chofer llegue a verlo.
   * Eliminar no devuelve una Ruta (queda cancelada, deja de ser "activa"),
   * así que su acción se pasa sin valor de retorno y siempre recarga. */
  async function ejecutar(accion: () => Promise<RutaPublica | void>, mensajeError: string) {
    setError(null);
    setEnviando(true);
    try {
      const resultado = await accion();
      if (resultado) {
        setRuta(resultado);
      } else {
        await recargar();
      }
    } catch {
      setError(mensajeError);
    } finally {
      setEnviando(false);
    }
  }

  return { ruta, cargando, enviando, error, recargar, ejecutar };
}
