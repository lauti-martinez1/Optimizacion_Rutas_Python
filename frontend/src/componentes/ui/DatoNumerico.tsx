import type { ElementType, ReactNode } from "react";

import { combinarClases } from "./combinarClases";

/** Rol tipográfico "Data" de DESIGN.md — mono, reservado a valores numéricos
 * reales (distancias, kg, conteos) en pantallas operativas. */
export function DatoNumerico({
  as: Elemento = "span",
  className,
  children,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Elemento
      className={combinarClases(
        "font-mono text-[12.5px] font-medium text-texto-cuerpo whitespace-nowrap shrink-0",
        className,
      )}
    >
      {children}
    </Elemento>
  );
}
