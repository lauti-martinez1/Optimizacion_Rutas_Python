import type { SelectHTMLAttributes } from "react";

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
    <div className="campo">
      <label className="campo__etiqueta" htmlFor={idCampo}>
        {etiqueta}
      </label>
      <select
        id={idCampo}
        className={`campo__select ${error ? "campo__input--error" : ""}`}
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
      {error && <span className="campo__error">{error}</span>}
    </div>
  );
}
