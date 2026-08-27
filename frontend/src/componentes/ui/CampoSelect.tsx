import type { SelectHTMLAttributes } from "react";

import { CampoContenedor } from "./CampoContenedor";
import { combinarClases } from "./combinarClases";

interface Opcion {
  valor: string;
  etiqueta: string;
}

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  etiqueta: string;
  opciones: Opcion[];
  placeholder?: string;
  error?: string;
}

export function CampoSelect({ etiqueta, opciones, placeholder, error, id, ...resto }: Props) {
  const idCampo = id ?? etiqueta.toLowerCase().replace(/\s+/g, "-");
  return (
    <CampoContenedor etiqueta={etiqueta} idCampo={idCampo} error={error}>
      <select
        id={idCampo}
        className={combinarClases(
          "campo-select h-[46px] w-full cursor-pointer appearance-none rounded-md border bg-blanco " +
            "py-0 pl-3.5 pr-9 text-sm text-texto-fuerte outline-none transition-[border-color,box-shadow] " +
            "duration-150 invalid:text-texto-tenue focus:border-primario " +
            "focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)] focus-visible:outline-none",
          error ? "border-peligro" : "border-borde-input",
        )}
        {...resto}
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>
    </CampoContenedor>
  );
}
