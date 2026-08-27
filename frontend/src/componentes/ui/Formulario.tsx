import type { FormHTMLAttributes, ReactNode } from "react";

import { combinarClases } from "./combinarClases";

/** Banner de error inline — lo usa Formulario, pero también pantallas que
 * muestran un error fuera de un <form> (ej. una acción de un botón suelto). */
export function BannerError({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={combinarClases(
        "rounded-md border border-peligro-borde bg-peligro-tint px-3 py-2.5 text-[12.5px] text-peligro",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface Props extends FormHTMLAttributes<HTMLFormElement> {
  error?: string | null;
  children: ReactNode;
}

/** Esqueleto compartido por todos los formularios: banner de error + campos +
 * lo que el caller ponga al final (típicamente un Boton type="submit"). */
export function Formulario({ error, children, ...resto }: Props) {
  return (
    <form {...resto}>
      {error && <BannerError className="mb-4">{error}</BannerError>}
      {children}
    </form>
  );
}
