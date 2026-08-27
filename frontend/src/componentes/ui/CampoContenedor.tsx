import type { ReactNode } from "react";

interface Props {
  etiqueta: string;
  /** Con id: la etiqueta es un <label> real para ese control. Sin id (ej.
   * SelectorUbicacion, que no tiene un único control enfocable): un <span>. */
  idCampo?: string;
  error?: string | null;
  children: ReactNode;
}

export function CampoContenedor({ etiqueta, idCampo, error, children }: Props) {
  const Etiqueta = idCampo ? "label" : "span";
  return (
    <div className="mb-4 flex flex-col gap-1.5">
      <Etiqueta
        className="text-[11px] font-semibold uppercase tracking-[0.04em] text-texto-tenue"
        {...(idCampo ? { htmlFor: idCampo } : {})}
      >
        {etiqueta}
      </Etiqueta>
      {children}
      {error && <span className="text-[11.5px] text-peligro">{error}</span>}
    </div>
  );
}
