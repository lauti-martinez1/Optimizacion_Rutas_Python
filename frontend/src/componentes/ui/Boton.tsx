import type { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: "primario" | "secundario";
  cargando?: boolean;
}

export function Boton({ variante = "primario", cargando = false, disabled, children, ...resto }: Props) {
  return (
    <button
      className={`boton boton--${variante}`}
      disabled={disabled || cargando}
      {...resto}
    >
      {cargando ? "Un momento…" : children}
    </button>
  );
}
