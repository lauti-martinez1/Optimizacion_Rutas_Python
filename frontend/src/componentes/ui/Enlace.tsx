import type { ButtonHTMLAttributes } from "react";

import { combinarClases } from "./combinarClases";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Para acciones destructivas (eliminar) — mismo criterio de color que
   * Boton variante="peligro", pero acá el control es un texto, no un botón. */
  peligro?: boolean;
}

/** Enlace de texto sin fondo — "Editar", "‹ Volver", "Eliminar". No es un
 * <Boton variante="secundario">: no tiene fondo ni borde, es solo texto. */
export function Enlace({ peligro = false, className, ...resto }: Props) {
  return (
    <button
      type="button"
      className={combinarClases(
        "cursor-pointer border-none bg-transparent p-0 text-[12.5px]",
        peligro ? "text-peligro hover:brightness-[0.85]" : "text-texto-mutado hover:text-texto-cuerpo",
        className,
      )}
      {...resto}
    />
  );
}
