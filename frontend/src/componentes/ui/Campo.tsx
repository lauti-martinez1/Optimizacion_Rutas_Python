import type { InputHTMLAttributes } from "react";

import { CampoContenedor } from "./CampoContenedor";
import { combinarClases } from "./combinarClases";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta: string;
  error?: string;
}

export function Campo({ etiqueta, error, id, className, ...resto }: Props) {
  const idCampo = id ?? etiqueta.toLowerCase().replace(/\s+/g, "-");
  return (
    <CampoContenedor etiqueta={etiqueta} idCampo={idCampo} error={error}>
      <input
        id={idCampo}
        className={combinarClases(
          "h-[46px] w-full rounded-md border bg-blanco px-3.5 text-sm text-texto-fuerte outline-none " +
            "transition-[border-color,box-shadow] duration-150 focus:border-primario " +
            "focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)] focus-visible:outline-none",
          error ? "border-peligro" : "border-borde-input",
          className,
        )}
        {...resto}
      />
    </CampoContenedor>
  );
}
