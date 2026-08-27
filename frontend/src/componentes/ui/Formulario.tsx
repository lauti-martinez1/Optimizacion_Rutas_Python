import type { FormHTMLAttributes, ReactNode } from "react";

interface Props extends FormHTMLAttributes<HTMLFormElement> {
  error?: string | null;
  children: ReactNode;
}

/** Esqueleto compartido por todos los formularios: banner de error + campos +
 * lo que el caller ponga al final (típicamente un Boton type="submit"). */
export function Formulario({ error, children, ...resto }: Props) {
  return (
    <form {...resto}>
      {error && (
        <div className="mb-4 rounded-md border border-peligro-borde bg-peligro-tint px-3 py-2.5 text-[12.5px] text-peligro">
          {error}
        </div>
      )}
      {children}
    </form>
  );
}
