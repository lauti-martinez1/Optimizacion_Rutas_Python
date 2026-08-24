import type { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta: string;
  error?: string;
}

export function Campo({ etiqueta, error, id, ...resto }: Props) {
  const idCampo = id ?? etiqueta.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="campo">
      <label className="campo__etiqueta" htmlFor={idCampo}>
        {etiqueta}
      </label>
      <input
        id={idCampo}
        className={`campo__input ${error ? "campo__input--error" : ""}`}
        {...resto}
      />
      {error && <span className="campo__error">{error}</span>}
    </div>
  );
}
