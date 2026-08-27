import type { ReactNode } from "react";

/** Mensaje centrado para un estado de carga o de lista vacía. */
export function TextoVacio({ children }: { children: ReactNode }) {
  return <p className="px-2 py-6 text-center text-[13px] text-texto-mutado">{children}</p>;
}
