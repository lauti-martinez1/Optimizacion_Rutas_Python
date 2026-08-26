import type { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: "primario" | "secundario" | "exito" | "peligro";
  cargando?: boolean;
}

export function Boton({
  variante = "primario",
  cargando = false,
  disabled,
  children,
  className,
  ...resto
}: Props) {
  return (
    <button
      className={`boton boton--${variante}${className ? ` ${className}` : ""}`}
      disabled={disabled || cargando}
      {...resto}
    >
      {cargando ? "Un momento…" : children}
    </button>
  );
}
